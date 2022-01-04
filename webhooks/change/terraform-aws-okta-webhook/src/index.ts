import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
} from 'aws-lambda'
import { verify } from '@indent/webhook'
import { Event, Resource, ApplyUpdateResponse } from '@indent/types'
import axios from 'axios'

import { getToken } from './utils/okta-auth'

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
      statuscode: 2,
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

const OKTA_DOMAIN = process.env.OKTA_DOMAIN

async function addUserToGroup({ user, group }) {
  const { Authorization } = await getToken()
  return await axios({
    method: 'put',
    url: `https://${OKTA_DOMAIN}/api/v1/groups/${group}/users/${user}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
}

async function removeUserFromGroup({ user, group }) {
  const { Authorization } = await getToken()
  return await axios({
    method: 'delete',
    url: `https://${OKTA_DOMAIN}/api/v1/groups/${group}/users/${user}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
}

const okta = { addUserToGroup, removeUserFromGroup }

async function grantPermission(auditEvent: Event) {
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
    success: result.status >= 200 && result.status < 300,
  })
}

async function revokePermission(auditEvent: Event) {
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
    success: result.status >= 200 && result.status < 300,
  })
}

function getOktaIdFromResources(resources: Resource[], kind: string): string {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => {
      if (r.labels && r.labels.oktaId) {
        return r.labels.oktaId
      }

      return r.id
    })[0]
}
