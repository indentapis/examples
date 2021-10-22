import axios from 'axios'
import { Event, Resource } from '@indent/types'

const TAILSCALE_API_KEY = process.env.TAILSCALE_API_KEY
const tailnet = process.env.TAILSCALE_TAILNET

export const matchEvent = (event: Event): boolean => {
  return (
    event.resources.filter((r) =>
      r.kind?.toLowerCase().includes('tailscale.v1.group')
    ).length > 0
  )
}

export async function grantPermission(auditEvent: Event) {
  try {
    const { event, resources } = auditEvent
    const { email } = getResourceByKind(resources, 'user')
    const { id } = getResourceByKind(resources, 'tailscale.v1.group')

    return await updateTailscaleACL({
      user: email,
      group: id,
      event,
      tailnet,
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
      }),
    }
  }
}

export async function revokePermission(auditEvent: Event) {
  try {
    const { event, resources } = auditEvent
    const { email } = getResourceByKind(resources, 'user')
    const { id } = getResourceByKind(resources, 'tailscale.v1.group')

    return await updateTailscaleACL({
      user: email,
      group: id,
      event,
      tailnet,
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

async function updateTailscaleACL({
  user,
  group,
  event,
}: {
  user: string
  group: string
  tailnet: string
  event: string
}) {
  const tailnetGroup = group.includes('group:') ? group : `group:${group}`
  const acl = await getTailscaleACL({ tailnet })

  if (acl) {
    let aclGroup = acl.Groups[tailnetGroup]
    if (aclGroup) {
      aclGroup = aclGroup.filter((u: string) => u !== user)
      if (event === 'access/grant') {
        aclGroup.push(user)
      }
    } else {
      if (event === 'access/grant') {
        aclGroup = [user]
      }
    }
    acl.Groups[tailnetGroup] = aclGroup
  } else {
    throw new Error('No ACL found in Tailscale response')
  }

  return await postTailscaleACL({ tailnet, ACL: acl })
}

async function getTailscaleACL({ tailnet = '' }): Promise<any> {
  return await axios({
    method: 'get',
    url: `https://api.tailscale.com/api/v2/tailnet/${tailnet}/acl`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    auth: {
      username: TAILSCALE_API_KEY,
      password: '',
    },
  }).then(r => r.data)
}

async function postTailscaleACL({
  tailnet,
  ACL,
}: {
  tailnet: string
  ACL: any
}) {
  return await axios({
    method: 'post',
    url: `https://api.tailscale.com/api/v2/tailnet/${tailnet}/acl`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    auth: {
      username: TAILSCALE_API_KEY,
      password: '',
    },
    data: ACL,
  })
}

const getResourceByKind = (resources: Resource[], kind: string): Resource =>
  resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
