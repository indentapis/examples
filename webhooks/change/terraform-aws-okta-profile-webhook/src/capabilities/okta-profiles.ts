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
      r.kind?.toLowerCase().includes(OKTA_PROFILE_ATTRIBUTE.toLowerCase())
    ).length > 0
  )
}

// export grant permission
export async function grantPermission(auditEvent: Event) {
  try {
    const { resources } = auditEvent
    const user = getResourceByKind(resources, 'user')
    const customer = getResourceByKind(resources, 'customer')
    const oktaUserId = user.labels['oktaId'] || user.id
    const { labels } = customer
    // resolve ID
    const profileAttribute = labels['okta/userProfileAttribute/id']
    const profileValue =
      labels['okta/userProfileAttribute/value'] || customer.id
    console.log(`{
      User: ${JSON.stringify(user)},
      Customer: ${JSON.stringify(customer)},
      oktaUserId: ${oktaUserId},
      profileAttribute: ${profileAttribute},
      profileValue: ${profileValue},
      Labels: ${JSON.stringify(labels)}
    }`)
    return await getAndUpdateOktaProfileAttribute({
      oktaUserId,
      profileAttribute,
      profileValue,
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
    const customer = getResourceByKind(resources, 'customer')
    const oktaUserId = user.labels['oktaId'] || user.id
    const { labels } = customer
    // resolve ID
    const profileAttribute = labels['okta/userProfileAttribute/id']
    const profileValue =
      labels['okta/userProfileAttribute/value'] || customer.id
    console.log(`{
      User: ${JSON.stringify(user)},
      Customer: ${JSON.stringify(customer)},
      oktaUserId: ${oktaUserId},
      profileAttribute: ${profileAttribute},
      profileValue: ${profileValue},
      Labels: ${JSON.stringify(labels)}
    }`)
    return await getAndRemoveOktaProfileAttribute({
      oktaUserId,
      profileAttribute,
      profileValue,
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
  profileValue,
}: {
  oktaUserId: string
  profileAttribute: string
  profileValue: string
}) {
  // Get user profile from Okta API
  const user = await getOktaUserProfile({ oktaUserId })
  // get user profile info
  let { profile } = user
  let customProfileAttribute = profile[profileAttribute]
  // check if value exists in profile
  if (!customProfileAttribute) {
    console.error('@indent/webhook.getAndUpdateOktaProfileAttribute(): failed')
    console.error(
      JSON.stringify({
        user,
        customProfileAttribute,
      })
    )
    throw new Error('no profileAttribute found')
  }

  if (customProfileAttribute.includes(profileValue)) {
    console.warn(
      'profileAttribute already includes new value, no changes will be made'
    )
    return await updateOktaUserProfile({ oktaUserId, profile })
  }
  // check our value is an array
  if (Array.isArray(customProfileAttribute)) {
    let newProfileAttribute = customProfileAttribute.push(profileValue)
    profile[profileAttribute] = newProfileAttribute
  } else {
    profile[profileAttribute] = [profileValue]
  }

  return await updateOktaUserProfile({ oktaUserId, profile })
}

async function getAndRemoveOktaProfileAttribute({
  oktaUserId,
  profileAttribute,
  profileValue,
}: {
  oktaUserId: string
  profileAttribute: string
  profileValue: string
}) {
  // Get user profile from Okta API
  const user = await getOktaUserProfile({ oktaUserId })
  // get user profile info
  let { profile } = user
  let customProfileAttribute = profile[profileAttribute]
  // check if value exists in profile
  if (!customProfileAttribute) {
    console.error('@indent/webhook.getAndRemoveOktaProfileAttribute(): failed')
    console.error(
      JSON.stringify({
        user,
        customProfileAttribute,
      })
    )
    throw new Error('no profileAttribute found')
  }

  if (!customProfileAttribute.includes(profileValue)) {
    console.warn(
      'profileAttribute does not include value, no changes will be made'
    )
    return await updateOktaUserProfile({ oktaUserId, profile })
  }
  // remove value from our array
  let newProfileAttribute = customProfileAttribute.filter(
    (c) => !c.includes(profileValue)
  )

  profile[profileAttribute] = newProfileAttribute

  return await updateOktaUserProfile({ oktaUserId, profile })
}

// GET from OKTA api based on user info
async function getOktaUserProfile({ oktaUserId }: { oktaUserId: string }) {
  const { Authorization } = await getToken()
  return await axios({
    method: 'get',
    url: `https://${OKTA_DOMAIN}/api/v1/users/${oktaUserId}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).then((r) => r.data)
}

// POST to OKTA api based on user info - must be a POST and not a PUT or it will overwrite
async function updateOktaUserProfile({ oktaUserId, profile }) {
  const { Authorization } = await getToken()
  return await axios({
    method: 'post',
    url: `https://${OKTA_DOMAIN}/api/v1/users/${oktaUserId}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: {
      profile: JSON.stringify(profile),
    },
  }).then((r) => r.data)
}

// get values from resources
const getResourceByKind = (resources: Resource[], kind: string): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
