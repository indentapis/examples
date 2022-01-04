import axios from 'axios'
import { ApplyUpdateResponse, Event, Resource } from '@indent/types'
import { getToken } from '../utils/okta-auth'

const OKTA_PROFILE_RESOURCE_KIND =
  process.env.OKTA_PROFILE_RESOURCE_KIND || 'ProfileAttribute'
const OKTA_PROFILE_ATTRIBUTE =
  process.env.OKTA_PROFILE_ATTRIBUTE || 'okta/userProfileAttribute/id'
const OKTA_PROFILE_ATTRIBUTE_VALUE =
  process.env.OKTA_PROFILE_ATTRIBUTE_VALUE || 'okta/userProfileAttribute/value'
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
    const oktaUser = getResourceByKind(resources, 'user')
    const attributeResource = getResourceByKind(
      resources,
      process.env.OKTA_PROFILE_RESOURCE_KIND
    )

    return await updateUserAttribute({
      oktaUser,
      event,
      attributeResource,
    })
  } catch (err) {
    console.error('@indent/webhook.grantPermission(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: {
          code: 500,
          message: err.message,
          details: err.stack,
        },
      } as ApplyUpdateResponse),
    }
  }
}

export async function revokePermission(auditEvent: Event) {
  try {
    const { event, resources } = auditEvent
    const oktaUser = getResourceByKind(resources, 'user')
    const attributeResource = getResourceByKind(
      resources,
      process.env.OKTA_PROFILE_RESOURCE_KIND
    )

    return await updateUserAttribute({
      oktaUser,
      event,
      attributeResource,
    })
  } catch (err) {
    console.error('@indent/webhook.revokePermission(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: {
          code: 500,
          message: err.message,
          details: err.stack,
        },
      } as ApplyUpdateResponse),
    }
  }
}

async function updateUserAttribute({
  oktaUser,
  attributeResource,
  event,
}: {
  oktaUser: Resource
  attributeResource: Resource
  event: string
}) {
  const oktaUserId = oktaUser.labels['oktaId'] || oktaUser.id
  const user = await getOktaUser({ id: oktaUserId })

  const attributeKey = attributeResource?.labels?.[OKTA_PROFILE_ATTRIBUTE]
  const attributeValue =
    attributeResource?.labels?.[OKTA_PROFILE_ATTRIBUTE_VALUE] ||
    attributeResource.id
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
        currAttrValue = currAttrValue.filter((item) => item !== attributeValue)
      }
    } else {
      currAttrValue = [attributeValue]
    }
    console.log(`Current Attribute Value: ${currAttrValue}`)
    updatedUser.profile[attributeKey] = currAttrValue
  } else {
    console.warn(`No user profile found on Okta User response`)
  }
  console.log(
    `attributeKey: ${attributeKey}; attributeValue: ${attributeValue}`
  )
  console.log(`Updated user: ${JSON.stringify(updatedUser)}`)
  return await updateOktaUser({ id: oktaUserId, user: updatedUser })
}

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

async function updateOktaUser({ id, user }: { id: string; user: any }) {
  const { Authorization } = await getToken()
  const { profile } = user
  return await axios({
    method: 'POST',
    url: `https://${OKTA_DOMAIN}/api/v1/users/${id}`,
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

const getResourceByKind = (resources: Resource[], kind: string): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
