const { verify } = require('@indent/webhook')
const axios = require('axios')

exports['indent-okta-webhook'] = async function handle(req, res) {
  const { body } = req

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      headers: req.headers,
      body
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return res.status(500).json({ error: { message: err.message } })
  }

  const { events } = body

  console.log(`@indent/webhook: received ${events.length} events`)
  console.log(JSON.stringify(events, null, 2))

  await Promise.all(
    events.map(auditEvent => {
      let { actor, event, resources } = auditEvent

      console.log(
        `@indent/webhook: ${event} { actor: ${
          actor.id
        }, resources: ${JSON.stringify(resources.map(r => r.id))} }`
      )

      switch (event) {
        case 'access/grant':
          return grantPermission(auditEvent)
        case 'access/revoke':
          return revokePermission(auditEvent)
        default:
          console.log('received unknown event')
          console.log(auditEvent)
          return Promise.resolve()
      }
    })
  )

  return res.status(200).json({})
}

const OKTA_TENANT = process.env.OKTA_TENANT
const OKTA_TOKEN = process.env.OKTA_TOKEN

async function addUserToGroup({ user, group }) {
  return await axios({
    method: 'put',
    url: `https://${OKTA_TENANT}/api/v1/groups/${group}/users/${user}`,
    headers: {
      Accept: 'application/json',
      Authorization: `SSWS ${OKTA_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
}

async function removeUserFromGroup({ user, group }) {
  return await axios({
    method: 'delete',
    url: `https://${OKTA_TENANT}/api/v1/groups/${group}/users/${user}`,
    headers: {
      Accept: 'application/json',
      Authorization: `SSWS ${OKTA_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
}

const okta = { addUserToGroup, removeUserFromGroup }

async function grantPermission(auditEvent) {
  const { event, actor, resources } = auditEvent
  const user = getOktaIdFromResources(resources, 'user')
  const group =
    getOktaIdFromResources(resources, 'app') ||
    getOktaIdFromResources(resources, 'group')

  let result = await okta.addUserToGroup({ user, group })

  console.log({
    event,
    actor,
    resources,
    success: result.status >= 200 && result.status < 300
  })
}

async function revokePermission(auditEvent) {
  const { event, actor, resources } = auditEvent
  const user = getOktaIdFromResources(resources, 'user')
  const group =
    getOktaIdFromResources(resources, 'app') ||
    getOktaIdFromResources(resources, 'group')

  let result = await okta.removeUserFromGroup({ user, group })

  console.log({
    event,
    actor,
    resources,
    success: result.status >= 200 && result.status < 300
  })
}

function getOktaIdFromResources(resources, kind) {
  return resources
    .filter(r => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map(r => {
      if (r.labels && r.labels.oktaId) {
        return r.labels.oktaId
      }

      return r.id
    })[0]
}
