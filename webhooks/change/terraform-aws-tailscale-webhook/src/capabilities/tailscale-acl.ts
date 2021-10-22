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

export async function grantPermission(auditEvent: Event) {
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
  const tailnetGroup = 'group:' + group
  const { headers, data } = await getTailscaleACL()
  console.log('ACL with comments', data.toString())
  const { etag } = headers
  let currentACL = data

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
      console.log(
        `There are no members of the group ${currentGroup}, adding ${user}...`
      )
      currentGroup = [user]
    }
    currentACL.groups[tailnetGroup] = currentGroup
  } else {
    console.warn('No ACL found on Tailscale response')
  }

  return await postTailscaleACL({ etag, ACL: currentACL })
}

async function getTailscaleACL(): Promise<AxiosResponse<any>> {
  return await axios({
    method: 'get',
    url: `https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl`,
    headers: {
      'Content-Type': 'application/hujson',
      Accept: 'application/hujson',
    },
    auth: {
      username: TS_API_KEY,
      password: '',
    },
  })
}

async function postTailscaleACL({ etag, ACL }: { etag: string; ACL: any }) {
  console.log(`etag: ${etag}`)
  return await axios({
    method: 'post',
    url: `https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl`,
    headers: {
      Accept: 'application/hujson',
      'If-Match': etag,
    },
    auth: {
      username: TS_API_KEY,
      password: '',
    },
    data: ACL,
  })
}

const getResourceByKind = (resources: Resource[], kind: string): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
