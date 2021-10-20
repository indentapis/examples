import axios from 'axios'
import { AxiosResponse } from 'axios'
import { Event, Resource } from '@indent/types'

const TS_API_KEY = process.env.TS_API_KEY
const TS_TAILNET = process.env.TS_TAILNET
export const matchEvent = (event: Event): boolean => {
  return (
    event.resources.filter((r) =>
      r.kind?.toLowerCase().includes('tailscale.v1.group')
    ).length > 0
  )
}

export const grantPermission = async (auditEvent: Event) => {
  try {
    const { event, resources } = auditEvent
    const { email } = getResourceByKind(resources, 'user')
    const { displayName } = getResourceByKind(resources, 'tailscale.v1.group')

    return await updateTailscaleACL({
      user: email,
      group: displayName,
      event,
      tailnet: TS_TAILNET,
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
      }),
    }
  }
}

export const revokePermission = async (auditEvent: Event) => {
  try {
    const { event, resources } = auditEvent
    const { email } = getResourceByKind(resources, 'user')
    const { displayName } = getResourceByKind(resources, 'tailscale.v1.group')

    return await updateTailscaleACL({
      user: email,
      group: displayName,
      event,
      tailnet: TS_TAILNET,
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
      }),
    }
  }
}

const updateTailscaleACL = async ({
  user,
  group,
  tailnet,
  event,
}: {
  user: string
  group: string
  tailnet: string
  event: string
}) => {
  const tailnetGroup = 'group:' + group
  const { headers, data: results } = await getTailscaleACL({ tailnet })
  const { Etag } = headers
  const currentACL = JSON.parse(results)

  if (currentACL) {
    let currentGroup = currentACL.groups[tailnetGroup]
    if (currentGroup) {
      if (event === 'access/grant') {
        if (currentGroup.includes(user)) {
          return Promise.resolve()
        }
        currentGroup.push(user)
      } else {
        currentGroup = currentGroup.filter((u) => u !== user)
      }
    } else {
      currentGroup = [user]
    }

    console.log('Current group members', currentGroup)
    currentACL.groups[tailnetGroup] = currentGroup
  } else {
    console.warn('No ACL found on Tailscale response')
  }

  return postTailscaleACL({ tailnet, Etag, ACL: currentACL })
}

const getTailscaleACL = async ({
  tailnet,
}: {
  tailnet: string
}): Promise<AxiosResponse<any>> => {
  const response = await axios({
    method: 'get',
    url: `https://api.tailscale.net/api/v2/tailnet/${tailnet}/acl`,
    headers: {
      Accept: 'application/json',
    },
    auth: {
      username: TS_API_KEY,
      password: '',
    },
  })
  console.log('Headers:', response.headers)
  console.log('Tailscale response:', response.data)
  return response
}

const postTailscaleACL = async ({
  tailnet,
  Etag,
  ACL,
}: {
  tailnet: string
  Etag: string
  ACL: any
}) => {
  return await axios({
    method: 'post',
    url: `https://api.tailscale.com/api/v2/tailnet/${tailnet}/acl`,
    headers: {
      Accept: 'application/json',
      'If-Match': Etag,
    },
    auth: {
      username: TS_API_KEY,
      password: '',
    },
    data: {
      ...ACL,
    },
  }).then((r) => r.data)
}

const getResourceByKind = (resources: Resource[], kind: string): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
