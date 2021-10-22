import axios from 'axios'
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

const getACL = async () => {
  return await axios({
    method: 'get',
    url: `https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl`,
    auth: {
      username: TS_API_KEY,
      password: '',
    },
    headers: {
      Accept: 'application/hujson',
    },
  }).then((r) => r.data)
}

const postACL = async ({ newContent }) => {
  return await axios({
    method: 'post',
    url: `https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl`,
    auth: {
      username: TS_API_KEY,
      password: '',
    },
    headers: {
      'Content-Type': 'application/hujson',
      Accept: 'application/hujson',g
    },
    data: newContent,
  })
}

const tailscale = { getACL, postACL }

export const grantPermission = async (
  auditEvent: Event,
  allEvents: Event[]
) => {
  try {
    const { resources } = auditEvent
    const user = getResourceByKind(resources, 'user')
    const group = getResourceByKind(resources, 'group')
    const { displayName } = group
    const resolvedGroup = `group:${displayName}`
    const { updateResult, sourceACL, updatedACL } = await getAndUpdateACL(
      {
        user,
        resolvedGroup,
      },
      (aclText: string) => {
        const aclByLine = aclText.split('\n')
        const aclPrefix = getIndentationPrefix(aclByLine[0])
        const entries = aclByLine.filter((a) => !a.includes('//indent:managed'))
        const newEntries = entries.filter((e) => !e.includes(user.email))
        let reqReason =
          allEvents
            .filter((e) => e.event === 'access/request')
            .map((e) => e.reason)[0] || ''

        if (reqReason) {
          reqReason = ` // ${reqReason}`
        }

        newEntries.push(
          aclPrefix +
            `"${resolvedGroup}":` +
            `["${user.email}"]` +
            `${reqReason}`
        )

        return [
          aclByLine[0],
          ...newEntries,
          aclByLine[aclByLine.length - 1],
        ].join('\n')
      }
    )

    console.log({
      updateResult,
      sourceACL,
      updatedACL,
    })
  } catch (err) {
    console.error(err)
    throw new Error(`indent.grantPermission(): failed ${err}`)
  }
}

export const revokePermission = async (auditEvent: Event) => {
  try {
    const { resources } = auditEvent
    const user = getResourceByKind(resources, 'user')
    const group = getResourceByKind(resources, 'group')
    const { displayName } = group
    const resolvedGroup = `group:${displayName}`
    const { updateResult, sourceACL, updatedACL } = await getAndUpdateACL(
      {
        user,
        resolvedGroup,
      },
      (aclText: string) =>
        aclText
          .split('\n')
          .filter((e) => !e.includes(user.email))
          .join('\n')
    )

    console.log({
      updateResult,
      sourceACL,
      updatedACL,
    })
  } catch (err) {
    console.error(err)
    throw new Error(`indent.revokePermission(): failed ${err}`)
  }
}

// export const updateTailscaleACL = async ({
//   user,
//   group,
// }: {
//   user: string
//   group: string
// }) => {
//   // split file into lines
//   const aclByLine = await getTailscaleACL().toString().split('\n')
//   // filter for the line that includes the group I want
//     // "group:example": [ "user1", "user2" ]
//   // what does that leave?
//   // Regex filter on remaining characters?
//   // How do I write a new string?

// }

const getACLBlock = (content: string, label: string) => {
  let matched = [],
    inBlock = false

  for (let line of content.split('\n')) {
    if (inBlock) {
      matched.push(line)
    }

    if (line.trim() === `//indent:managed start ${label}`) {
      inBlock = true
      matched.push(line)
    } else if (inBlock && line.trim().includes(`//indent:managed end`)) {
      inBlock = false
      // prevent matching multiple acl blocks
      break
    }
  }

  if (matched.length < 2) {
    return ''
  }

  return matched.join('\n')
}

async function getAndUpdateACL(
  {
    user,
    resolvedGroup,
  }: {
    user: Resource
    resolvedGroup: string
  },
  updater: RoleUpdater
) {
  const aclData = await tailscale.getACL()
  const aclContent = aclData.toString()
  const sourceACL = getACLBlock(aclContent, resolvedGroup)
  const updatedACL = updater(sourceACL)

  if (!sourceACL) {
    console.error(
      JSON.stringify({
        user,
        resolvedGroup,
        aclContent,
      })
    )
    throw new Error('no sourceACL found')
  }

  console.log(
    JSON.stringify({
      user,
      resolvedGroup,
      aclContent,
      sourceACL,
      updatedACL,
    })
  )

  const newContent = aclContent.replace(sourceACL, updatedACL)

  if (newContent === aclContent) {
    console.warn('No changes to be applied')
    return { sourceACL, aclContent, newContent }
  }

  const updateResult = await tailscale.postACL({
    newContent,
  })

  return { updateResult, sourceACL, updatedACL }
}

const getResourceByKind = (resources: Resource[], kind: string): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}

function getIndentationPrefix(str: string) {
  return str.match(/^[\s\uFEFF\xA0]+/g)
}

type RoleUpdater = (roleBlock: string) => string
