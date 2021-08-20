import { Event, Resource } from '@indent/types'
import axios from 'axios'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export function matchEvent(event: Event) {
  return event.resources.filter((r) => r.kind?.includes('Team')).length > 0
}

export async function grantPermission(auditEvent: Event) {
  const { event, actor, resources } = auditEvent
  const user = getIdFromResources(resources, 'user')
  const { team, org } = getTeamFromResources(resources, 'team')

  let result = await addUserToGroup({ user, org, team })

  console.log({
    event,
    actor,
    resources,
    success: result.status >= 200 && result.status < 300,
  })

  return result
}

export async function revokePermission(auditEvent: Event) {
  const { resources } = auditEvent
  const user = getIdFromResources(resources, 'user')
  const { team, org } = getTeamFromResources(resources, 'team')

  return await removeUserFromGroup({ user, org, team })
}

export async function addUserToGroup({ user, org, team }) {
  return await axios({
    method: 'PUT',
    url: `https://api.github.com/orgs/${org}/teams/${team}/memberships/${user}`,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  })
}

export async function removeUserFromGroup({ user, org, team }) {
  return await axios({
    method: 'DELETE',
    url: `https://api.github.com/orgs/${org}/teams/${team}/memberships/${user}`,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  })
}

function getIdFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.labels['github/id'] || r.id)[0]
}

function getTeamFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => ({
      team: r.labels['github/slug'],
      org: r.labels['github/org'],
    }))[0]
}
