import * as fs from 'fs'
import { promisify } from 'util'
import { google } from 'googleapis'
import { authorize } from '../auth/google'
import { Event, Resource } from '@indent/types'

const readFile = promisify(fs.readFile).bind(fs)

export function matchEvent(event: Event) {
  return (
    event.resources.filter(r =>
      r.kind?.toLowerCase().includes('google.v1.group')
    ).length > 0
  )
}

export async function grantPermission(auditEvent: Event) {
  const { resources } = auditEvent
  const user = getEmailFromResources(resources, 'user')
  const group = getIdFromResources(resources, 'google.v1.group')

  return await addUserToGroup({ user, group })
}

export async function revokePermission(auditEvent: Event) {
  const { resources } = auditEvent
  const user = getEmailFromResources(resources, 'user')
  const group = getIdFromResources(resources, 'google.v1.group')

  return await removeUserFromGroup({ user, group })
}

export async function addUserToGroup({ user, group }) {
  const auth = await getAuth()
  const service = google.cloudidentity({ version: 'v1', auth })

  return await service.groups.memberships.create({
    parent: `groups/${group}`,
    requestBody: {
      preferredMemberKey: { id: user },
      roles: [
        {
          name: 'MEMBER'
        }
      ]
    }
  })
}

export async function removeUserFromGroup({ user, group }) {
  const auth = await getAuth()
  const service = google.cloudidentity({ version: 'v1', auth })

  const membershipID = await service.groups.memberships.lookup({
    parent: `groups/${group}`,
    'memberKey.id': user
  })

  return await service.groups.memberships.delete({
    name: membershipID.data.name
  })
}

function getIdFromResources(resources: Resource[], kind: string) {
  return resources
    .filter(r => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map(r => r.id)[0]
}

function getEmailFromResources(resources: Resource[], kind: string) {
  return resources
    .filter(r => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map(r => r.email || r.id)[0]
}

export async function getAuth() {
  if (process.env.NODE_ENV !== 'development') {
    let auth = new google.auth.Compute({
      serviceAccountEmail: process.env.GCP_SVC_ACCT_EMAIL,
      scopes: ['https://www.googleapis.com/auth/cloud-identity.groups']
    })

    let { token } = await auth.getAccessToken()
    if (!token) {
      throw new Error('getAuth: getAccessToken: token not found')
    }

    let tokenInfo = await auth.getTokenInfo(token)
    console.log(JSON.stringify({ tokenInfo }))

    return auth
  }

  try {
    // Load client secrets from a local file.
    let content = await readFile('credentials.json')
    return await authorize(JSON.parse(content.toString()))
  } catch (err) {
    console.error('Error loading client secret file', err)
    throw err
  }
}
