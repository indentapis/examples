import { Event, Resource } from '@indent/types'
import {
  IAMClient,
  AddUserToGroupCommand,
  RemoveUserFromGroupCommand,
} from '@aws-sdk/client-iam'

const region = process.env.AWS_REGION
const iamClient = new IAMClient({ region })

export function matchEvent(event: Event) {
  return (
    event.resources.filter((r) =>
      r.kind?.toLowerCase().includes('aws.iam.v1.group')
    ).length > 0
  )
}

export async function grantPermission(auditEvent: Event) {
  const { event, actor, resources } = auditEvent
  const user = getUserNameFromResources(resources, 'user')
  const group = getGroupFromResources(resources, 'group')

  const addUserToGroup = new AddUserToGroupCommand({
    GroupName: group,
    UserName: user,
  })

  const response = await iamClient.send(addUserToGroup)

  console.log({ event, actor, resources, response })
}

export async function revokePermission(auditEvent: Event) {
  const { event, actor, resources } = auditEvent
  const user = getUserNameFromResources(resources, 'user')
  const group = getGroupFromResources(resources, 'group')

  const removeUserFromGroup = new RemoveUserFromGroupCommand({
    GroupName: group,
    UserName: user,
  })

  const response = await iamClient.send(removeUserFromGroup)

  console.log({ event, actor, resources, response })
}

const getUserNameFromResources = (
  resources: Resource[],
  kind: string
): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => {
      if (r.labels && r.labels['aws/username']) {
        return r.labels['aws/username']
      }

      return r.displayName
    })[0]
}

const getGroupFromResources = (resources: Resource[], kind: string): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => {
      if (r.labels && r.labels['aws/group']) {
        return r.labels['aws/group']
      }

      return r.displayName
    })[0]
}
