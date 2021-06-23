import * as types from '@indent/types'
import { APIGatewayProxyResult } from 'aws-lambda'
import { getJiraClient } from '../utils/jira'

function matchRoleResource(r: types.Resource) {
  return r.kind?.toLowerCase().includes('jira.v1.projectrole')
}

export function match(auditEvent: types.Event) {
  return auditEvent.resources.filter(matchRoleResource).length > 0
}

export async function grantPermission(
  auditEvent: types.Event,
  _allEvents: types.Event[]
): Promise<APIGatewayProxyResult> {
  let role = auditEvent.resources.filter(matchRoleResource)[0]
  let grantee = auditEvent.resources.filter(r => !matchRoleResource(r))[0]
  let jiraUserId = grantee.labels.jiraId

  // Assume role.id is path like `project/[pid]/role/[rid]`
  let result = await getJiraClient()
    .post('/rest/api/3/' + role.id, { user: [jiraUserId] })
    .then(r => r.data)

  console.log({ result })
  return {
    statusCode: 200,
    body: '{}'
  }
}

export async function revokePermission(
  auditEvent: types.Event,
  _allEvents: types.Event[]
): Promise<APIGatewayProxyResult> {
  let role = auditEvent.resources.filter(matchRoleResource)[0]
  let grantee = auditEvent.resources.filter(r => !matchRoleResource(r))[0]
  let jiraUserId = grantee.labels.jiraId

  // Assume role.id is path like `project/[pid]/role/[rid]`
  let result = await getJiraClient()
    .delete('/rest/api/3/' + role.id, { params: { user: jiraUserId } })
    .then(r => r.data)

  console.log({ result })
  return {
    statusCode: 200,
    body: '{}'
  }
}
