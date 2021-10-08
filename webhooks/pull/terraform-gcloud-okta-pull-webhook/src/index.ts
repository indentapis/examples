import { verify } from '@indent/webhook'
import { Resource } from '@indent/types'
import { Request, Response } from 'express'
import axios from 'axios'

import { getToken } from './utils/okta-auth'

const OKTA_DOMAIN = process.env.OKTA_DOMAIN

// Okta Slack App ID - used to link okta `managerId` to slack users
const APP_ID = process.env.OKTA_SLACK_APP_ID || ''

async function loadFromOkta({
  path = '',
  limit = 200,
  transform = (r: any): Resource => r,
}): Promise<Resource[]> {
  console.log(`Loading data from Okta: { path: ${path}, limit: ${limit} }`)
  const { Authorization } = await getToken()
  const response = await axios({
    method: 'get',
    url: /http/.test(path)
      ? path
      : `https://${OKTA_DOMAIN}/api/v1${path}?limit=${limit}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  const { headers, data: results } = response
  const linkInfo = parseLinkHeader(headers.link)
  const oktaRateLimitMax = parseInt(
    String(headers['x-rate-limit-limit'] || '1'),
    10
  )
  const oktaRateLimitRemaining = parseInt(
    String(headers['x-rate-limit-remaining'] || '1'),
    10
  )
  const oktaRateLimitReset = new Date(0)
  oktaRateLimitReset.setUTCSeconds(parseInt(headers['x-rate-limit-reset'], 10))
  console.log(
    `  → ${oktaRateLimitRemaining} / ${oktaRateLimitMax} requests to Okta left until ${oktaRateLimitReset.toLocaleString()}`
  )

  // If less than 20% left, wait a minute
  if ((oktaRateLimitRemaining / oktaRateLimitMax) * 100 < 20) {
    await new Promise((r) => setTimeout(r, 60 * 1000))
  }

  return results
    .concat(linkInfo.next ? await loadFromOkta({ path: linkInfo.next }) : [])
    .map(transform)
}

exports['webhook'] = async function handle(
  req: IRequest,
  res: Response
): Promise<Response<PullUpdateResponse>> {
  const { headers, rawBody } = req

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      body: rawBody.toString(),
      headers,
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return res.status(500).json({
      status: {
        message: err.message,
        details: JSON.stringify(err.stack),
      },
    })
  }

  const body = JSON.parse(rawBody)
  const pull = body as { kinds: string[] }

  if (pull && pull.kinds) {
    console.log('pullUpdate: attempt: ' + pull.kinds)
    try {
      const resourcesAsync = await Promise.all(
        pull.kinds.map(async (kind: string): Promise<Resource[]> => {
          if (kind.toLowerCase().includes('user')) {
            return await pullUsers()
          } else if (kind.toLowerCase().includes('group')) {
            return await pullGroups()
          }

          return []
        })
      )
      const resources = resourcesAsync.flat()
      console.log('pullUpdate: success: ' + pull.kinds)

      return res.status(200).json({ resources })
    } catch (err) {
      console.log('pullUpdate: error: ' + pull.kinds)
      console.error(err)
    }
  } else {
    // unknown payload
    console.warn('webhook received unknown payload')
    console.warn(JSON.stringify(body))
  }

  return res.status(200).json({})
}

async function pullGroups(): Promise<Resource[]> {
  const timestamp = new Date().toISOString()
  const oktaGroupResources = await loadFromOkta({
    path: '/groups',
    transform: (group) => ({
      id: [OKTA_DOMAIN, group.id].join('/api/v1/groups/'),
      kind: 'okta.v1.Group',
      email: group.profile.email,
      displayName: group.profile.name,
      labels: {
        oktaId: group.id,
        description: group.profile.description || '',
        timestamp,
        oktaGroupType: group.type,
      },
    }),
  })

  return oktaGroupResources
}

async function pullUsers(): Promise<Resource[]> {
  const timestamp = new Date().toISOString()
  const oktaUserResources = await loadFromOkta({
    path: '/users',
    transform: (user) => ({
      id: [OKTA_DOMAIN, user.id].join('/api/v1/users/'),
      kind: 'okta.v1.User',
      email: user.profile.email,
      displayName: [user.profile.firstName, user.profile.lastName]
        .filter(Boolean)
        .join(' '),
      labels: {
        oktaId: user.id,
        managerId: user.profile.managerId || '',
        timestamp,
      },
    }),
  })

  const oktaUserMapById = oktaUserResources.reduce(
    (acc, r) => ({
      ...acc,
      [r.labels.oktaId]: r,
      [r.email]: r,
    }),
    {}
  )

  oktaUserResources.forEach((user) => {
    // check if managerId is an email, then update to okta id for uniqueness
    if (user.labels.managerId && user.labels.managerId.includes('@')) {
      if (oktaUserMapById[user.labels.managerId]) {
        user.labels.managerId =
          oktaUserMapById[user.labels.managerId].labels.oktaId
      }
    }
  })

  const appUserResources = !APP_ID
    ? []
    : await loadFromOkta({
        path: `/apps/${APP_ID}/users`,
        transform: (appuser) => ({
          id: [OKTA_DOMAIN, appuser.id].join(`/api/v1/apps/${APP_ID}/users/`),
          kind: 'okta.v1.AppUser',
          email: appuser.profile.email,
          displayName: [appuser.profile.firstName, appuser.profile.lastName]
            .filter(Boolean)
            .join(' '),
          labels: {
            oktaAppId: APP_ID,
            oktaId: appuser.id,
            slackId: appuser.externalId,
            managerId: oktaUserMapById[appuser.id]
              ? oktaUserMapById[appuser.id].labels.managerId
              : '',
            slackUsername: appuser.profile.slackUsername,
            timestamp,
          },
        }),
      })
  const slackUserResources =
    appUserResources.length > 0
      ? appUserResources
      : oktaUserResources.map(
          (r) =>
            ({
              // Due to missing slack app ID this pull webhook resolves based on email
              id: r.labels.slackId,
              displayName: r.displayName,
              kind: 'slack/user',
              email: r.email,
              labels: {
                oktaId: r.labels.oktaId,
                managerId: r.labels.managerId,
                timestamp,
              },
            } as Resource)
        )

  return [...oktaUserResources, ...appUserResources, ...slackUserResources]
}

function parseLinkHeader(s: string): { next?: string } {
  const output = {}
  const regex = /<([^>]+)>; rel="([^"]+)"/g
  let m: RegExpExecArray
  while ((m = regex.exec(s))) {
    const [, v, k] = m
    output[k] = v
  }
  return output
}

type IRequest = Request & { rawBody: string }

type Status = {
  message: string
  details?: string | JSON
}

type PullUpdateResponse = {
  status: Status
  resources?: Resource[]
}
