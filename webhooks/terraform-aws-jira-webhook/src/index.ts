import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { verify } from '@indent/webhook'
import * as types from '@indent/types'

import * as jiraTicket from './operations/jira-ticket'
import * as jiraProjectRole from './operations/jira-project-role'

const INDENT_WEBHOOK_SECRET = process.env.INDENT_WEBHOOK_SECRET || ''

export const handle: APIGatewayProxyHandler = async function handle(event) {
  const body = JSON.parse(event.body)

  try {
    await verify({
      secret: INDENT_WEBHOOK_SECRET,
      headers: event.headers,
      body: event.body
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } })
    }
  }

  const { events } = body

  console.log(`@indent/webhook: received ${events.length} events`)

  const responses = (
    await Promise.all(
      events.map(
        (auditEvent: types.Event): Promise<APIGatewayProxyResult> => {
          let { event } = auditEvent

          console.log(`@indent/webhook: ${event}`)
          console.log(JSON.stringify(auditEvent))

          switch (event) {
            case 'access/grant':
              return grantPermission(auditEvent, events)
            case 'access/revoke':
              return revokePermission(auditEvent, events)
            default:
              return Promise.resolve({
                statusCode: 200,
                body: 'Unknown event'
              })
          }
        }
      )
    )
  ).filter(
    (r: APIGatewayProxyResult) => r.statusCode !== 200
  ) as APIGatewayProxyResult[]

  if (responses.length > 0) {
    return responses[0]
  }

  return {
    statusCode: 200,
    body: '{}'
  }
}

async function grantPermission(event: types.Event, allEvents: types.Event[]) {
  try {
    if (jiraProjectRole.match(event)) {
      return await jiraProjectRole.grantPermission(event, allEvents)
    }

    if (jiraTicket.match(event)) {
      return await jiraTicket.grantPermission(event, allEvents)
    }

    console.warn('grantPermission: no operations matched')
  } catch (err) {
    console.error(err)
    if (err.response) {
      console.error(err.response.data)
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: err.toString() })
    }
  }
}

async function revokePermission(event: types.Event, allEvents: types.Event[]) {
  try {
    if (jiraProjectRole.match(event)) {
      return await jiraProjectRole.revokePermission(event, allEvents)
    }

    if (jiraTicket.match(event)) {
      return await jiraTicket.revokePermission(event, allEvents)
    }

    console.warn('grantPermission: no operations matched')
  } catch (err) {
    console.error(err)
    if (err.response) {
      console.error(err.response.data)
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: err.toString() })
    }
  }
}
