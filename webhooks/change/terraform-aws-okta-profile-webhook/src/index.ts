import { APIGatewayProxyHandler } from 'aws-lambda'
import { verify } from '@indent/webhook'
import { Event } from '@indent/types'

import * as oktaProfiles from './capabilities/okta-profiles'

export const handle: APIGatewayProxyHandler = async function handle(event) {
  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      headers: event.headers,
      body: event.body,
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } }),
    }
  }

  const body = JSON.parse(event.body)
  const { events } = body

  console.log(`@indent/webhook: received ${events.length} events`)
  console.log(JSON.stringify(events, null, 2))

  await Promise.all(
    events.map((auditEvent: Event) => {
      let { actor, event, resources } = auditEvent

      console.log(
        `@indent/webhook: ${event} { actor: ${
          actor.id
        }, resources: ${JSON.stringify(resources.map((r) => r.id))} }`
      )

      switch (event) {
        case 'access/grant':
          return grantPermission(auditEvent)
        case 'access/revoke':
          return revokePermission(auditEvent)
        case 'access/approve':
          return Promise.resolve()
        default:
          console.log('received unknown event')
          console.log(auditEvent)
          return Promise.resolve()
      }
    })
  )

  return {
    statusCode: 200,
    body: '{}',
  }
}

async function grantPermission(auditEvent: Event) {
  if (oktaProfiles.matchEvent(auditEvent)) {
    return await oktaProfiles.grantPermission(auditEvent)
  }

  return {
    code: 404,
    message:
      'This resource is not supported by the capabilities of this webhook.',
  }
}

async function revokePermission(auditEvent: Event) {
  if (oktaProfiles.matchEvent(auditEvent)) {
    return await oktaProfiles.revokePermission(auditEvent)
  }

  return {
    code: 404,
    message:
      'This resource is not supported by the capabilities of this webhook.',
  }
}
