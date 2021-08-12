import { Event, Resource } from '@indent/types'
import axios from 'axios'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export function matchEvent(event: Event) {
  return event.resources.filter((r) => r.kind?.includes('team')).length > 0
}

export async function grantPermission(auditEvent: Event) {
  const { resources } = auditEvent
  const user = getIdFromResources(resources, 'user')
  const org = getOrgFromResources(resources, 'team')
  const team = getTeamFromResources(resources, 'team')

  return await addUserToGroup({ user, org, team })
}

export async function revokePermission(auditEvent: Event) {
  const { resources } = auditEvent
  const user = getIdFromResources(resources, 'user')
  const org = getOrgFromResources(resources, 'team')
  const team = getTeamFromResources(resources, 'team')

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
    .map((r) => r.labels?.githubId || r.id)[0]
}

function getTeamFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.displayName)[0]
}

function getOrgFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.labels?.org)[0]
}
