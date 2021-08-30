import axios from 'axios'
import { APIGatewayProxyHandler } from 'aws-lambda'
import { verify } from '@indent/webhook'
import { Event, Resource } from '@indent/types'
import { getToken } from '../utils/okta-auth'

// create placeholder for okta event type with environment variable
const OKTA_PROFILE_ATTRIBUTE = process.env.OKTA_PROFILE_ATTRIBUTE
const OKTA_DOMAIN = process.env.OKTA_DOMAIN
// match events with the profile event type
export function matchEvent(event: Event) {
  return (
    event.resources.filter((r) => r.kind?.includes(OKTA_PROFILE_ATTRIBUTE))
      .length > 0
  )
}

// export grant permission
export async function grantPermission(auditEvent: Event) {
  const { event, actor, resources } = auditEvent
  const user = getOktaIdFromResources(resources, 'user')
  const attribute = getProfileAttributeFromResources(
    resources,
    'ProfileAttribute'
  )
  console.log({
    event,
    actor,
    resources,
  }) // add result status
}

// export revoke permission
export async function revokePermission(auditEvent: Event) {
  const { event, actor, resources } = auditEvent
  // get Okta user ID
  const user = getOktaIdFromResources(resources, 'user')
  // get customer attribute to change
  const { id, value } = getProfileAttributeFromResources(resources, 'customer')

  console.log({
    event,
    actor,
    resources,
  }) // add result status
}

// update Okta user profile
async function updateOktaUserProfile({ user, id, value }) {
  // await getting user profile
  

}

// get Okta user profile
// GET from OKTA api based on user info
async function getOktaUserProfile({ user }) {
  const { Authorization } = await getToken()
  return await axios({
    method: 'get',
    url: `https://${OKTA_DOMAIN}/api/v1/users/${user}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).then((r) => r.data)
}

// post user profile
async function postOktaUserProfile({ user, profile }) {
  const { Authorization } = await getToken()
  return await axios({
    method: 'post',
    url: `https://${OKTA_DOMAIN}/api/v1/users/${user}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: {
      profile,
    },
  }).then((r) => r.data)
}
// POST to OKTA api based on user info - must be a POST and not a PUT or it will overwrite

// get values from resources
function getOktaIdFromResources(resources: Resource[], kind: string): string {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind))
    .map((r) => {
      if (r.labels && r.labels.oktaId) {
        return r.labels.oktaId
      }

      return r.id
    })[0]
}

function getProfileAttributeFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind))
    .map((r) => {
      if (
        r.labels &&
        r.labels['okta/userProfileAttribute/id'] &&
        r.labels['okta/userProfileAttribute/value']
      ) {
        return {
          id: r.labels['okta/userProfileAttribute/id'],
          value: r.labels['okta/userProfileAttribute/value'],
        }
      }

      return r.id
    })[0]
}
// need to get profile attribute from resources
// pass attribute to the update function
// make API call
