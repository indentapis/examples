import axios from 'axios'
import { Event, Resource } from '@indent/types'
import { getToken } from '../utils/okta-auth'

const OKTA_DOMAIN = process.env.OKTA_DOMAIN

export function matchEvent(event: Event) {
  return (
    event.resources.filter((r) => r.kind?.toLowerCase().includes('group'))
      .length > 0
  )
}

export async function grantPermission(auditEvent: Event) {
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

export async function revokePermission(auditEvent: Event) {
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
