import axios from 'axios'
import { Event, Resource } from '@indent/types'
import { getToken } from '../utils/okta-auth'

// create placeholder for okta event type with environment variable
const OKTA_PROFILE_ATTRIBUTE = process.env.OKTA_PROFILE_ATTRIBUTE
const OKTA_DOMAIN = process.env.OKTA_DOMAIN
// match events with the profile event type
export function matchEvent(event: Event) {
  return (
    event.resources.filter((r) =>
      r.kind?.toLowerCase().includes(OKTA_PROFILE_ATTRIBUTE)
    ).length > 0
  )
}

// export grant permission
export async function grantPermission(auditEvent: Event) {
  try {
    const { resources } = auditEvent
    const user = getResourceByKind(resources, 'user')
    const oktaUserId = user.labels.oktaId || user.id
    const customer = getResourceByKind(resources, 'customer')
    const { labels } = customer
    // resolve ID
    const profileAttribute = labels['okta/userProfileAttribute/id']
    const resolvedProfileValue =
      labels['okta/userProfileAttribute/value' || customer.id]
    console.table({
      oktaUserId,
      labels,
    })
    return await getAndUpdateOktaProfileAttribute({
      oktaUserId,
      profileAttribute,
      resolvedProfileValue,
    })
  } catch (err) {
    console.error('@indent/webhook.grantPermission(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } }),
    }
  }
}

// export revoke permission
export async function revokePermission(auditEvent: Event) {
  try {
    const { resources } = auditEvent
    const user = getResourceByKind(resources, 'user')
    const oktaUserId = user.labels.oktaId || user.id
    const customer = getResourceByKind(resources, 'customer')
    const { labels } = customer
    // resolve ID
    const profileAttribute = labels['okta/userProfileAttribute/id']
    const resolvedProfileValue =
      labels['okta/userProfileAttribute/value' || customer.id]
    console.table({
      oktaUserId,
      labels,
    })
    return await getAndUpdateOktaProfileAttribute({
      oktaUserId,
      profileAttribute,
      resolvedProfileValue,
    })
  } catch (err) {
    console.error('@indent/webhook.revokePermission(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } }),
    }
  }
}

// update Okta user profile
async function getAndUpdateOktaProfileAttribute({
  oktaUserId,
  profileAttribute,
  resolvedProfileValue,
}: {
  oktaUserId: string
  profileAttribute: string
  resolvedProfileValue: string
}) {
  // await getting user profile
  const user = await getOktaUserProfile({ oktaUserId })
  // get user profile info
  const { profile } = user
  let newProfile = profile
  // check if value exists in profile
  if (!profile[profileAttribute]) {
    console.error('@indent/webhook.getAndUpdateOktaUserProfile: failed')
    console.error(JSON.stringify(profile))
    throw new Error('Okta Profile Attribute not found')
  }
  // make the change
  if (profile[profileAttribute] === resolvedProfileValue) {
    newProfile[profileAttribute] = profile[profileAttribute].filter(
      (p) => !p.includes(resolvedProfileValue)
    )
  } else {
    newProfile[profileAttribute].push(resolvedProfileValue)
  }

  const updateProfile = await updateOktaUserProfile({ oktaUserId, newProfile })
  // post the result
  return updateProfile
}

// GET from OKTA api based on user info
async function getOktaUserProfile({ oktaUserId }: { oktaUserId: string }) {
  const { Authorization } = await getToken()
  const result = await axios({
    method: 'get',
    url: `https://${OKTA_DOMAIN}/api/v1/users/${oktaUserId}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).then((r) => r.data)

  console.log(result)
  return result
}

// POST to OKTA api based on user info - must be a POST and not a PUT or it will overwrite
async function updateOktaUserProfile({ oktaUserId, newProfile }) {
  const { Authorization } = await getToken()
  const result = await axios({
    method: 'post',
    url: `https://${OKTA_DOMAIN}/api/v1/users/${oktaUserId}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: {
      newProfile,
    },
  }).then((r) => r.data)

  console.log(result)
  return result
}

// get values from resources
const getResourceByKind = (resources: Resource[], kind: string): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
