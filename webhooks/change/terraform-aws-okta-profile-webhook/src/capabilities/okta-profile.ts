import axios from 'axios'
import { Event, Resource } from '@indent/types'
import { getToken } from '../utils/okta-auth'

const OKTA_PROFILE_RESOURCE_KIND = process.env.OKTA_PROFILE_RESOURCE_KIND || 'ProfileAttribute'
const OKTA_PROFILE_ATTRIBUTE = process.env.OKTA_PROFILE_ATTRIBUTE || 'okta/userProfileAttribute/id'
const OKTA_PROFILE_ATTRIBUTE_VALUE = process.env.OKTA_PROFILE_ATTRIBUTE || 'okta/userProfileAttribute/value'
const OKTA_DOMAIN = process.env.OKTA_DOMAIN

export function matchEvent(event: Event) {
  return (
    event.resources.filter((r) =>
      r.kind?.toLowerCase().includes(OKTA_PROFILE_RESOURCE_KIND.toLowerCase())
    ).length > 0
  )
}

export async function grantPermission(auditEvent: Event) {
  try {
    const { event, resources } = auditEvent
    const user = getResourceByKind(resources, 'user')
    const attributeResource = getResourceByKind(resources, process.env.OKTA_PROFILE_RESOURCE_KIND)

    return await updateUserAttribute({
      user,
      event,
      attributeResource,
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

export async function revokePermission(auditEvent: Event) {
  try {
    const { event, resources } = auditEvent
    const user = getResourceByKind(resources, 'user')
    const attributeResource = getResourceByKind(resources, process.env.OKTA_PROFILE_RESOURCE_KIND)

    return await updateUserAttribute({
      user,
      event,
      attributeResource,
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

async function updateUserAttribute({ user, attributeResource, event }: { user: Resource, attributeResource: Resource, event: string }) {
  const oktaUserId = user.labels['oktaId'] || user.id
  const user = await getOktaUser({ id: oktaUserId })

  const attributeKey = attributeResource?.labels?.[OKTA_PROFILE_ATTRIBUTE]
  const attributeValue = attributeResource?.labels?.[OKTA_PROFILE_ATTRIBUTE_VALUE] || attributeResource.id
  const updatedUser = { profile: {} }

  if (user.profile) {
    let currAttrValue = user.profile[attributeKey]
    if (currAttrValue) {
      if (event === 'access/grant') {
        if (currAttrValue.includes(attributeValue)) {
          return Promise.resolve()
        }
        currAttrValue.push(attributeValue)
      } else {
        currAttrValue = currAttrValue.filter(item => item !== attributeValue)
      }
    } else {
      currAttrValue = [attributeValue]
    }
    updatedUser.profile[attributeKey] = currAttrValue
  } else {
    console.warn(`No user profile found on Okta User response`)
  }

  console.log(`Updated user: ${JSON.stringify(user)}`)
  return await updateOktaUser({ id: oktaUserId, user })
}

// GET from OKTA api based on user info
async function getOktaUser({ id }: { id: string }) {
  const { Authorization } = await getToken()
  return await axios({
    method: 'GET',
    url: `https://${OKTA_DOMAIN}/api/v1/users/${id}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).then((r) => r.data)
}

// POST to OKTA api based on user info - must be a POST and not a PUT or it will overwrite
async function updateOktaUser({ id, user }: { id: string, user: any }) {
  const { Authorization } = await getToken()
  return await axios({
    method: 'POST',
    url: `https://${OKTA_DOMAIN}/api/v1/users/${id}`,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: { profile: user.profile },
  }).then((r) => r.data)
}

// get values from resources
const getResourceByKind = (resources: Resource[], kind: string): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}




// No longer necessary:


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
  const user = await getOktaUser({ oktaUserId })
  console.log(`Okta User Response: ${JSON.stringify(profile)}}`)
  // get user profile info
  let { profile } = user
  console.log(`Okta Profile ${JSON.stringify(profile)}`)
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
    return await updateOktaUser({ oktaUserId, profile })
  }
  // check our value is an array
  if (Array.isArray(customProfileAttribute)) {
    let newProfileAttribute = customProfileAttribute.push(profileValue)
    profile[profileAttribute] = newProfileAttribute
  } else {
    profile[profileAttribute] = [profileValue]
  }

  return await updateOktaUser({ oktaUserId, profile })
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
  const user = await getOktaUser({ oktaUserId })
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
    return await updateOktaUser({ oktaUserId, profile })
  }
  // remove value from our array
  let newProfileAttribute = customProfileAttribute.filter(
    (c) => !c.includes(profileValue)
  )

  profile[profileAttribute] = newProfileAttribute

  return await updateOktaUser({ oktaUserId, profile })
}
