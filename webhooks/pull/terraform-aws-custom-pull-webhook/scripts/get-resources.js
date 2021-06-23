const path = require('path')
const axios = require('axios')
const assert = require('assert')
const fs = require('fs').promises
const { unparse } = require('papaparse')

const OKTA_TENANT = process.env.OKTA_TENANT
const OKTA_TOKEN = process.env.OKTA_TOKEN

assert(OKTA_TENANT, 'required env var missing: `OKTA_TENANT`')
assert(OKTA_TOKEN, 'required env var missing: `OKTA_TOKEN`')

const defaultColumns = 'kind,displayName,id,email'.split(',')

function toCSV(resources) {
  let columns = [...defaultColumns]
  let addColumn = c => (columns = [...columns.filter(col => col !== c), c])
  let items = resources.map(r => ({
    ...r,
    labels: undefined,
    ...(r.labels
      ? Object.keys(r.labels).reduce((acc, k) => {
          let label = `labels__${k}`
          addColumn(label)
          return {
            ...acc,
            [label]: r.labels[k]
          }
        }, {})
      : {})
  }))
  return unparse(items, {
    columns
  })
}

async function loadFromOkta({ path = '', limit = 200, transform = r => r }) {
  console.log(`Loading data from Okta: { path: ${path}, limit: ${limit} }`)
  const response = await axios({
    method: 'get',
    url: /http/.test(path)
      ? path
      : `https://${OKTA_TENANT}/api/v1${path}?limit=${limit}`,
    headers: {
      Accept: 'application/json',
      Authorization: `SSWS ${OKTA_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  const { headers, data: results } = response
  const linkInfo = parseLinkHeader(headers.link)
  const oktaRateLimitMax = headers['x-rate-limit-limit']
  const oktaRateLimitRemaining = headers['x-rate-limit-remaining']
  const oktaRateLimitReset = new Date(0)
  oktaRateLimitReset.setUTCSeconds(parseInt(headers['x-rate-limit-reset'], 10))
  console.log(
    `  → ${oktaRateLimitRemaining} / ${oktaRateLimitMax} requests to Okta left until ${oktaRateLimitReset.toLocaleString()}`
  )
  return results
    .concat(linkInfo.next ? await loadFromOkta({ path: linkInfo.next }) : [])
    .map(transform)
}

async function load() {
  const groups = await loadFromOkta({
    path: '/groups',
    transform: r => ({
      id: r.id,
      kind: 'okta.v1.Group',
      displayName: r.profile.name,
      labels: { description: r.profile.description }
    })
  })
  const users = await loadFromOkta({
    path: '/users',
    transform: r => ({
      id: r.id,
      kind: 'okta.v1.User',
      email: r.profile.email,
      displayName: [r.profile.firstName, r.profile.lastName]
        .filter(Boolean)
        .join(' '),
      labels: {
        managerId: r.profile.managerId
      }
    })
  })

  const roles = (
    await Promise.all(
      users.map(
        async user =>
          await loadFromOkta({
            path: `/users/${user.id}/roles`,
            transform: r => {
              let { id, _links, ...role } = r
              return {
                id: [user.id, id].join(':'),
                kind: 'okta.v1.RoleBinding',
                displayName: r.label,
                email: user.email,
                labels: {
                  'indent.com/risk/level': 'critical',
                  ...Object.keys(role).reduce(
                    (acc, key) => ({
                      ...acc,
                      [key]: role[key]
                    }),
                    {}
                  )
                }
              }
            }
          })
      )
    )
  ).flat()

  const csv = toCSV([...groups, ...roles, ...users])
  const datadir = path.resolve(__dirname, '../data')

  try {
    await fs.mkdir(datadir)
  } catch (err) {
    if (/EEXIST/.test(err.message)) {
      // ignore directory already exists error
    } else {
      throw err
    }
  }

  await fs.writeFile(datadir + '/resources.csv', csv)
  console.log(`Completed writing to: "${datadir}/resources.csv"`)
}

function parseLinkHeader(s) {
  const output = {}
  const regex = /<([^>]+)>; rel="([^"]+)"/g
  let m
  while ((m = regex.exec(s))) {
    const [_, v, k] = m
    output[k] = v
  }
  return output
}

load().catch(err => {
  console.error(err)
  process.exit(1)
})
