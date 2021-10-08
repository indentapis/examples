import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { verify } from '@indent/webhook'
import { Event, Resource, ApplyUpdateResponse } from '@indent/types'
import { Octokit } from '@octokit/rest'
import _ from 'lodash'

export const handle: APIGatewayProxyHandler = async function handle(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { headers, body } = event

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      headers,
      body,
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
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

  let events: Event[]
  const json = JSON.parse(body)

  events = json.events

  console.log(`@indent/webhook: received ${events.length} events`)
  console.log(JSON.stringify(events))

  await Promise.all(
    events.map((auditEvent: Event) => {
      let { actor, event, resources } = auditEvent

      console.log(
        `@indent/webhook: ${event} { actor: ${
          actor.id
        }, resources: ${JSON.stringify(resources.map((r) => r.id))} }`
      )

      switch (event) {
        case 'access/grant':
          return grantPermission(auditEvent, events)
        case 'access/revoke':
          return revokePermission(auditEvent)
        case 'access/approve':
          return Promise.resolve()
        default:
          console.log('received unknown event')
          console.log(auditEvent)
          return Promise.resolve()
      }
    })
  )

  return {
    statusCode: 200,
    body: '{}',
  }
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
})

async function getFile({
  owner,
  repo,
  path,
}: {
  owner: string
  repo: string
  path: string
}) {
  const repoContents = await octokit.repos.getContent({ owner, repo, path })
  if ('content' in repoContents.data) {
    if (Array.isArray(repoContents.data)) {
      throw new Error(
        `@indent/webhook.getFile(): failed. Returned a directory instead of a single file`
      )
    }

    const responseType = repoContents.data.type
    switch (responseType) {
      case 'file':
        return repoContents.data
      default:
        throw new Error(
          `@indent/webhook.getFile(): failed. Returned repoContents of type ${responseType}`
        )
    }
  }
}

async function updateFile({
  owner,
  repo,
  path,
  sha,
  newContent,
}: {
  owner: string
  repo: string
  path: string
  sha: string
  newContent: string
}) {
  return await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    sha,
    content: newContent,
    message: 'chore(acl): update roles',
    committer: {
      name: 'Indent Bot',
      email: 'github-bot@noreply.indentapis.com',
    },
    author: {
      name: 'Indent Bot',
      email: 'github-bot@noreply.indentapis.com',
    },
  })
}

const github = { getFile, updateFile }

async function grantPermission(auditEvent: Event, allEvents: Event[]) {
  try {
    const { resources } = auditEvent
    const recipient = getResourceByKind(resources, 'user')
    const granted = getResourceByKind(resources, 'role')
    const { labels } = granted
    const { githubRepo, githubPath, githubManagedLabel } = labels
    const resolvedLabel = labels[githubManagedLabel || 'role']
    const { updateResult, sourceACL, updatedACL } = await getAndUpdateACL(
      {
        githubRepo,
        path: githubPath,
        resolvedLabel,
      },
      (aclText: string) => {
        const aclByLine = aclText.split('\n')
        const aclPrefix = getIndentationPrefix(aclByLine[0])
        const entries = aclByLine.filter((a) => !a.includes('//indent:managed'))
        const newEntries = entries.filter((e) => !e.includes(recipient.email))
        let reqReason =
          allEvents
            .filter((e) => e.event === 'access/request')
            .map((e) => e.reason)[0] || ''

        if (reqReason) {
          reqReason = ` // ${reqReason}`
        }

        newEntries.push(aclPrefix + `"${recipient.email}",${reqReason}`)

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

async function revokePermission(auditEvent: Event) {
  try {
    const { resources } = auditEvent
    const recipient = getResourceByKind(resources, 'user')
    const granted = getResourceByKind(resources, 'role')
    const { labels } = granted
    const { githubRepo, githubPath, githubManagedLabel } = labels
    const resolvedLabel = labels[githubManagedLabel || 'role']
    const { updateResult, sourceACL, updatedACL } = await getAndUpdateACL(
      {
        githubRepo,
        path: githubPath,
        resolvedLabel,
      },
      (aclText: string) =>
        aclText
          .split('\n')
          .filter((e) => !e.includes(recipient.email))
          .join('\n')
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

/**
 *
 * @param content
 * @param label
 * @returns `
 *    //indent:managed start example
 *    //indent:managed end
 * `
 */
function getACLBlock(content: string, label: string) {
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

type RoleUpdater = (roleBlock: string) => string

async function getAndUpdateACL(
  {
    path,
    githubRepo,
    resolvedLabel,
  }: {
    path: string
    githubRepo: string
    resolvedLabel: string
  },
  updater: RoleUpdater
) {
  const [owner, repo] = githubRepo.split('/')
  const file = await github.getFile({ owner, repo, path })
  const fileContent = Buffer.from(file.content, 'base64').toString('ascii')
  const sourceACL = getACLBlock(fileContent, resolvedLabel)
  const updatedACL = updater(sourceACL)

  if (!sourceACL) {
    console.error(
      JSON.stringify({
        githubRepo,
        path,
        fileContent,
        resolvedLabel,
      })
    )
    throw new Error('no sourceACL found')
  }

  console.log(
    JSON.stringify({
      githubRepo,
      path,
      sourceACL,
      updatedACL,
    })
  )

  const newContentBody = fileContent.replace(sourceACL, updatedACL)
  const newContent = Buffer.from(newContentBody, 'ascii').toString('base64')

  if (newContent === file.content) {
    console.warn('No changes to be applied')
    return { sourceACL, fileContent, newContent }
  }

  const updateResult = await github.updateFile({
    owner,
    repo,
    path,
    newContent,
    sha: file.sha,
  })

  return { updateResult, sourceACL, updatedACL }
}

function getResourceByKind(resources: Resource[], kind: string): Resource {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}

function getIndentationPrefix(str: string) {
  return str.match(/^[\s\uFEFF\xA0]+/g)
}
