import { Event, Resource } from '@indent/types'
import axios from 'axios'

// Indent Operator Agent will use access token from app installed with client id/secret
// Interested in the Indent Agent early access program? Let us know at https://indent.com/support
const GITHUB_USERNAME = process.env.GITHUB_USERNAME
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export function matchEvent(event: Event) {
  return (
    event.resources.filter(
      (r) => r.kind?.includes('app') || r.kind?.includes('group')
    ).length > 0
  )
}

export async function grantPermission(auditEvent: Event) {
  const { resources } = auditEvent
  const user = getIdFromResources(resources, 'user')
  const group = getIdFromResources(resources, 'team')
  const [org, team] = group.split('/')

  return await addUserToGroup({ user, org, team })
}

export async function revokePermission(auditEvent: Event) {
  const { resources } = auditEvent
  const user = getIdFromResources(resources, 'user')
  const group = getIdFromResources(resources, 'team')
  const [org, team] = group.split('/')

  return await removeUserFromGroup({ user, org, team })
}

export async function addUserToGroup({ user, org, team }) {
  return await axios({
    method: 'PUT',
    url: `https://api.github.com/orgs/${org}/teams/${team}/memberships/${user}`,
    auth: { username: GITHUB_USERNAME, password: GITHUB_TOKEN },
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  })
}

export async function removeUserFromGroup({ user, org, team }) {
  return await axios({
    method: 'DELETE',
    url: `https://api.github.com/orgs/${org}/teams/${team}/memberships/${user}`,
    auth: { username: GITHUB_USERNAME, password: GITHUB_TOKEN },
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  })
}

function getIdFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.labels?.githubId || r.id)[0]
}
