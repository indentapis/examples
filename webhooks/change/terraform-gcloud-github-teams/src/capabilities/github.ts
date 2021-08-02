import { Event, Resource } from '@indent/types'
import axios from 'axios'

// Indent Operator Agent will use access token from app installed with client id/secret
// Interested in the Indent Agent early access program? Let us know at https://indent.com/support
const GITHUB_USERNAME = process.env.GITHUB_USERNAME
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export function matchEvent(event: Event) {
  return (
    event.resources.filter(
      (r) => r.kind?.includes('github.v1.team') // This was the issue
    ).length > 0
  )
}

export async function grantPermission(auditEvent: Event) {
  const { resources } = auditEvent
  const team = getTeamFromResources(resources, 'github.v1.team')
  const user = getUsernameFromResources(resources, 'github.v1.team')
  const org = getOrgFromResources(resources, 'github.v1.team')

  console.log(`Team: ${team}, Username: ${user}, Org: ${org}`)

  return await addUserToGroup({ user, org, team })
}

export async function revokePermission(auditEvent: Event) {
  const { resources } = auditEvent
  const team = getTeamFromResources(resources, 'github.v1.team')
  const user = getUsernameFromResources(resources, 'github.v1.team')
  const org = getOrgFromResources(resources, 'github.v1.team')

  console.log(`Team: ${team}, Username: ${user}, Org: ${org}`)

  return await removeUserFromGroup({ user, org, team })
}

export async function addUserToGroup({ user, org, team }) {
  console.log(
    `URL: https://api.github.com/orgs/${org}/teams/${team}/memberships/${user}`
  )
  return await axios({
    method: 'PUT',
    url: `https://api.github.com/orgs/${org}/teams/${team}/memberships/${user}`,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  }).catch((err) => console.error(`Add User Error: ${err}`))
}

export async function removeUserFromGroup({ user, org, team }) {
  console.log(
    `URL: https://api.github.com/orgs/${org}/teams/${team}/memberships/${user}`
  )
  return await axios({
    method: 'DELETE',
    url: `https://api.github.com/orgs/${org}/teams/${team}/memberships/${user}`,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  }).catch((err) => console.error(`Remove user error: ${err}`))
}

// function getIdFromResources(resources: Resource[], kind: string) {
//   return resources
//     .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
//     .map((r) => r.labels?.githubId || r.id)[0]
// }

function getTeamFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.labels?.team_slug)[0]
}

function getUsernameFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.labels?.username)[0]
}

function getOrgFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.labels?.org)[0]
}
