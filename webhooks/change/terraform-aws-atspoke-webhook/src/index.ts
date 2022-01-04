import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
} from 'aws-lambda'
import { verify } from '@indent/webhook'
import { Event, Resource, ApplyUpdateResponse } from '@indent/types'
import axios from 'axios'

const INDENT_WEBHOOK_SECRET = process.env.INDENT_WEBHOOK_SECRET || ''
const INDENT_SPACE_NAME = process.env.INDENT_SPACE_NAME || ''
const ATSPOKE_API_KEY = process.env.ATSPOKE_API_KEY || ''
const ATSPOKE_API_HOST =
  process.env.ATSPOKE_API_HOST || 'https://api.askspoke.com'

export const handle: APIGatewayProxyHandler = async function handle(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { headers, body } = event

  try {
    await verify({
      secret: INDENT_WEBHOOK_SECRET,
      headers,
      body,
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: { code: 2, message: err.message, details: err.stack },
      } as ApplyUpdateResponse),
    }
  }

  let events: Event[]
  const json = JSON.parse(body)

  events = json.events

  console.log(`@indent/webhook: received ${events.length} events`)

  const responses = (
    await Promise.all(
      events.map((auditEvent: Event): Promise<APIGatewayProxyResult> => {
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
              body: JSON.stringify({
                status: {
                  code: 0,
                  message: 'Unknown event',
                },
              } as ApplyUpdateResponse),
            })
        }
      })
    )
  ).filter(
    (r: APIGatewayProxyResult) => r.statusCode !== 200
  ) as APIGatewayProxyResult[]

  if (responses.length > 0) {
    return responses[0]
  }

  return {
    statusCode: 200,
    body: '{}',
  }
}

type AtspokeRequest = {
  subject: string
  requester: string
  body?: string
  team?: string
  owner?: string
  privacyLevel?: 'private' | 'public'
  requestTypeInfo?: AtspokeRequestTypeInfo
  requestType?: string
}

type AtspokeRequestTypeInfo = {
  answeredFields: {
    fieldId: string
    value: string
  }[]
}

type AtspokeUser = {
  org: string
  user: string
  role: string
  status: string
  displayName?: string
}

async function sendAtspokeRequest(request: AtspokeRequest) {
  return await axios
    .post(`${ATSPOKE_API_HOST}/api/v1/requests`, request, {
      headers: { 'Api-Key': ATSPOKE_API_KEY },
    })
    .then((r) => r.data)
}

async function getAtspokeWhoami(): Promise<AtspokeUser> {
  return await axios
    .get(`${ATSPOKE_API_HOST}/api/v1/whoami`, {
      headers: { 'Api-Key': ATSPOKE_API_KEY },
    })
    .then((r) => r.data)
}

async function grantPermission(
  auditEvent: Event,
  allEvents: Event[]
): Promise<APIGatewayProxyResult> {
  let result = await sendAtspokeRequest(
    await prepareRequest(auditEvent, allEvents)
  )

  console.log({ result })
  return {
    statusCode: 200,
    body: '{}',
  }
}

async function revokePermission(
  auditEvent: Event,
  allEvents: Event[]
): Promise<APIGatewayProxyResult> {
  let result = await sendAtspokeRequest(
    await prepareRequest(auditEvent, allEvents)
  )

  console.log({ result })
  return {
    statusCode: 200,
    body: '{}',
  }
}

async function prepareRequest(
  auditEvent: Event,
  allEvents: Event[]
): Promise<AtspokeRequest> {
  let targetActor = getTargetActor(auditEvent)
  let targetResource = getTargetResource(auditEvent)
  let targetActorLabel = getDisplayName(targetActor)
  let targetResourceLabel = getDisplayName(targetResource)
  let actionLabel = auditEvent.event === 'access/grant' ? 'Granted' : 'Revoked'
  let subject = `${targetActorLabel} / ${targetResource.kind} ${targetResourceLabel} · Access ${actionLabel}`
  let body = getBody(auditEvent, allEvents)
  let atspokeUser = await getAtspokeWhoami()

  if (!atspokeUser) {
    throw new Error('getAtspokeWhoami: not found')
  }

  let { user: requester } = atspokeUser

  return {
    requester,
    subject,
    body,

    team: '5ffe35b92142af0006d52807',
    requestType: '6000080fbc8dc50006e3d17c',
    requestTypeInfo: {
      answeredFields: [
        {
          // reason
          fieldId: 'e18e9750-5646-11eb-b4c3-1f3b0fa733e1',
          value:
            allEvents
              .filter((e) => e.event === 'access/request')
              .map((e) => e.reason)[0] || '',
        },
        // duration
        auditEvent.event === 'access/grant' && {
          fieldId: 'e18e9751-5646-11eb-b4c3-1f3b0fa733e1',
          value: dur(auditEvent),
        },
      ].filter(Boolean),
    },
  } as AtspokeRequest
}

function getDisplayName(r: Resource): string {
  return (
    r.displayName ||
    (r.labels ? r.labels['indent.com/profile/name/preferred'] : '') ||
    r.id
  )
}

function getTargetActor(auditEvent: Event): Resource {
  return auditEvent?.resources?.filter((r) => r.kind?.includes('user'))[0] || {}
}

function getTargetResource(auditEvent: Event): Resource {
  return (
    auditEvent?.resources?.filter((r) => !r.kind?.includes('user'))[0] || {}
  )
}

function getBody(auditEvent: Event, allEvents: Event[]) {
  let targetActor = getTargetActor(auditEvent)
  let targetResource = getTargetResource(auditEvent)

  let metaLabels = auditEvent?.meta?.labels || {}
  let actionLabel = auditEvent.event === 'access/grant' ? 'granted' : 'revoked'
  let indentURL = `https://indent.com/spaces/${INDENT_SPACE_NAME}/workflows/${metaLabels['indent.com/workflow/origin/id']}/runs/${metaLabels['indent.com/workflow/origin/run/id']}`

  return `
${allEvents
  .filter((e) => e.event === 'access/request')
  .map((e) => `*Request Reason:* ${e.reason}`)}

${allEvents
  .filter((e) => e.event != auditEvent.event && e.event === 'access/approve')
  .map(
    (e) =>
      `${e?.actor?.displayName}(${
        e?.actor?.email
      }) approved access to ${getDisplayName(targetActor)} (${
        targetActor?.email
      }) for ${targetResource?.kind} ${getDisplayName(
        targetResource
      )}${durationText(e)}.`
  )
  .join('\n')}

${auditEvent?.actor?.displayName} (${
    auditEvent?.actor?.email
  }) ${actionLabel} access to ${getDisplayName(targetActor)} (${
    targetActor?.email
  }) for ${targetResource?.kind} ${getDisplayName(targetResource)}.

View Workflow in Indent →
${indentURL}`.trim()
}

function durationText(event: Event) {
  return `${
    !event.meta?.labels?.['indent.com/time/duration'] ||
    event.meta?.labels?.['indent.com/time/duration'] === '-1ns'
      ? ' '
      : ' for '
  }${dur(event)}`
}

function dur(event: Event) {
  return !event.meta?.labels?.['indent.com/time/duration'] ||
    event.meta?.labels?.['indent.com/time/duration'] === '-1ns'
    ? 'until revoked'
    : event.meta?.labels?.['indent.com/time/duration']
}
