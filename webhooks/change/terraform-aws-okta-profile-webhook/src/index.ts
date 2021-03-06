import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { verify } from '@indent/webhook'
import { Event, ApplyUpdateResponse } from '@indent/types'

import * as oktaProfile from './capabilities/okta-profile'

export const handle: APIGatewayProxyHandler = async function handle(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
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
      body: JSON.stringify({
        status: {
          code: 2,
          message: err.message,
          details: err.stack,
        },
      } as ApplyUpdateResponse),
    }
  }

  const body = JSON.parse(event.body)
  const { events } = body

  console.log(`@indent/webhook: received ${events.length} events`)
  console.log(JSON.stringify(events, null, 2))

  const results = await Promise.all(
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

  const errors = results.filter((r: any) => r?.statusCode > 200)
  if (errors.length > 0) {
    console.error('@indent/webhook.handle: non-200 status code')
    console.error(errors[0])
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: {
          code: 2,
          message: errors[0].toString(),
        },
      } as ApplyUpdateResponse),
    }
  }

  return {
    statusCode: 200,
    body: '{}',
  }
}

async function grantPermission(auditEvent: Event) {
  if (oktaProfile.matchEvent(auditEvent)) {
    return await oktaProfile.grantPermission(auditEvent)
  }

  return {
    status: {
      code: 12,
      message:
        'This resource is not supported by the capabilities of this webhook',
    },
  }
}

async function revokePermission(auditEvent: Event) {
  if (oktaProfile.matchEvent(auditEvent)) {
    return await oktaProfile.revokePermission(auditEvent)
  }

  return {
    status: {
      code: 12,
      message:
        'This resource is not supported by the capabilities of this webhook',
    },
  }
}
