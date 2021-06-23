import * as types from '@indent/types'
import { APIGatewayProxyResult } from 'aws-lambda'
import { getJiraClient } from '../utils/jira'

const INDENT_SPACE_NAME = process.env.INDENT_SPACE_NAME || ''
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || ''
// By default match all events and create a ticket
const JIRA_TICKET_EVENT_MATCH = process.env.JIRA_TICKET_EVENT_MATCH || ''

export function match(auditEvent: types.Event) {
  return (
    auditEvent.resources.filter(r =>
      r.kind?.toLowerCase().includes(JIRA_TICKET_EVENT_MATCH)
    ).length > 0
  )
}

export async function grantPermission(
  auditEvent: types.Event,
  allEvents: types.Event[]
): Promise<APIGatewayProxyResult> {
  let createMeta = await getJiraClient()({
    url: '/rest/api/3/issue/createmeta',
    params: {
      projectKeys: JIRA_PROJECT_KEY,
      expand: 'projects.issuetypes.fields'
    }
  }).then(r => r.data)

  let { projects = [] } = createMeta
  let { issuetypes } = projects[0]

  let primaryIssueType =
    issuetypes.filter(t => t.name === 'Change')[0] || issuetypes[0]

  let ticket = await prepareRequest(auditEvent, allEvents)
  let result = await getJiraClient()({
    method: 'POST',
    url: '/rest/api/2/issue',
    data: {
      fields: {
        issuetype: { id: primaryIssueType.id },
        project: { key: JIRA_PROJECT_KEY },
        summary: ticket.summary,
        description: ticket.description
      }
    }
  }).then(r => r.data)

  console.log({ result })
  return {
    statusCode: 200,
    body: '{}'
  }
}

export async function revokePermission(
  auditEvent: types.Event,
  allEvents: types.Event[]
): Promise<APIGatewayProxyResult> {
  let createMeta = await getJiraClient()({
    url: '/rest/api/3/issue/createmeta',
    params: {
      projectKeys: JIRA_PROJECT_KEY,
      expand: 'projects.issuetypes.fields'
    }
  }).then(r => r.data)

  let { projects = [] } = createMeta
  let { issuetypes } = projects[0]

  let primaryIssueType =
    issuetypes.filter(t => t.name === 'Change')[0] || issuetypes[0]

  let ticket = await prepareRequest(auditEvent, allEvents)
  let result = await getJiraClient()({
    method: 'POST',
    url: '/rest/api/2/issue',
    data: {
      fields: {
        issuetype: { id: primaryIssueType.id },
        project: { key: JIRA_PROJECT_KEY },
        summary: ticket.summary,
        description: ticket.description
      }
    }
  }).then(r => r.data)

  console.log({ result })
  return {
    statusCode: 200,
    body: '{}'
  }
}

type JiraIssueRequest = {
  [field: string]: string
}

async function prepareRequest(
  auditEvent: types.Event,
  allEvents: types.Event[]
): Promise<JiraIssueRequest> {
  let targetActor = getTargetActor(auditEvent)
  let targetResource = getTargetResource(auditEvent)
  let targetActorLabel = targetActor.email || targetActor.displayName
  let targetResourceLabel = getDisplayName(targetResource)
  let actionLabel = auditEvent.event === 'access/grant' ? 'Granted' : 'Revoked'
  let summary = `${targetActorLabel} / ${targetResource.kind} ${targetResourceLabel} · Access ${actionLabel}`
  let description = getBody(auditEvent, allEvents)

  return {
    summary,
    description
  }
}

function getDisplayName(r: types.Resource): string {
  return (
    r.displayName ||
    (r.labels ? r.labels['indent.com/profile/name/preferred'] : '') ||
    r.id
  )
}

function getTargetActor(auditEvent: types.Event): types.Resource {
  return auditEvent?.resources?.filter(r => r.kind?.includes('user'))[0] || {}
}

function getTargetResource(auditEvent: types.Event): types.Resource {
  return auditEvent?.resources?.filter(r => !r.kind?.includes('user'))[0] || {}
}

function getBody(auditEvent: types.Event, allEvents: types.Event[]) {
  let targetActor = getTargetActor(auditEvent)
  let targetResource = getTargetResource(auditEvent)

  let metaLabels = auditEvent?.meta?.labels || {}
  let actionLabel = auditEvent.event === 'access/grant' ? 'granted' : 'revoked'
  let indentURL = `https://indent.com/spaces/${INDENT_SPACE_NAME}/workflows/${metaLabels['indent.com/workflow/origin/id']}/runs/${metaLabels['indent.com/workflow/origin/run/id']}`

  return `
${allEvents
  .filter(e => e.event === 'access/request')
  .map(e => `*Request Reason:* ${e.reason}`)}

${allEvents
  .filter(e => e.event != auditEvent.event && e.event === 'access/approve')
  .map(
    e =>
      `*${e?.actor?.displayName}(${
        e?.actor?.email
      })* approved access to *${getDisplayName(targetActor)} (${
        targetActor?.email
      })* for ${targetResource?.kind} ${getDisplayName(
        targetResource
      )}${durationText(e)}.`
  )
  .join('\n')}

*${auditEvent?.actor?.displayName} (${
    auditEvent?.actor?.email
  })* ${actionLabel} access to *${getDisplayName(targetActor)} (${
    targetActor?.email
  })* for ${targetResource?.kind} ${getDisplayName(targetResource)}.

[View Workflow in Indent →|${indentURL}]`
}

function durationText(event: types.Event) {
  return `${
    !event.meta?.labels?.['indent.com/time/duration'] ||
    event.meta?.labels?.['indent.com/time/duration'] === '-1ns'
      ? ' '
      : ' for '
  }${dur(event)}`
}

function dur(event: types.Event) {
  return !event.meta?.labels?.['indent.com/time/duration'] ||
    event.meta?.labels?.['indent.com/time/duration'] === '-1ns'
    ? 'until revoked'
    : event.meta?.labels?.['indent.com/time/duration']
}
