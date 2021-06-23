import { APIGatewayProxyHandler } from 'aws-lambda'
import { verify } from '@indent/webhook'
import * as Indent from '@indent/types'
import { Octokit } from '@octokit/rest'
import hclParser from 'js-hcl-parser'
import _ from 'lodash'

export const handle: APIGatewayProxyHandler = async function handle(event) {
  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      headers: event.headers,
      body: event.body,
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } }),
    }
  }

  const body = JSON.parse(event.body)
  const { events } = body

  console.log(`@indent/webhook: received ${events.length} events`)
  console.log(JSON.stringify(events))

  await Promise.all(
    events.map((auditEvent: Indent.Event) => {
      let { actor, event, resources } = auditEvent

      console.log(
        `@indent/webhook: ${event} { actor: ${
          actor.id
        }, resources: ${JSON.stringify(resources.map((r) => r.id))} }`
      )

      switch (event) {
        case 'access/grant':
          return grantPermission(auditEvent)
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

async function getFile({ owner, repo, path }) {
  return await octokit.repos
    .getContent({
      owner,
      repo,
      path,
    })
    .then((r) => r.data)
}

async function updateFile({ owner, repo, path, sha, newContent }) {
  return await octokit.repos
    .createOrUpdateFileContents({
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
    .then((r) => r.data)
}

const github = { getFile, updateFile }

async function grantPermission(auditEvent: Indent.Event) {
  try {
    const { resources } = auditEvent
    const userId = getIdFromResources(resources, 'user')
    const roleId = getIdFromResources(resources, 'role')
    const { updateResult, acl, sourceACL } = await getAndUpdateACL(
      roleId,
      (role) => {
        role = role.filter((id: string) => id !== userId)
        role.push(userId)
        return role
      }
    )

    console.log({
      roleId,
      userId,
      updateResult,
      acl,
      sourceACL,
    })
  } catch (err) {
    console.error(err)
  }
}

async function revokePermission(auditEvent: Indent.Event) {
  try {
    const { resources } = auditEvent
    const userId = getIdFromResources(resources, 'user')
    const roleId = getIdFromResources(resources, 'role')
    const { updateResult, acl, sourceACL } = await getAndUpdateACL(
      roleId,
      (role) => role.filter((id: string) => id !== userId)
    )

    console.log(
      JSON.stringify({
        roleId,
        userId,
        updateResult,
        acl,
        sourceACL,
      })
    )
  } catch (err) {
    console.error(err)
  }
}

type RoleUpdater = (members: string[]) => string[]

async function getAndUpdateACL(roleId: string, updater: RoleUpdater) {
  const [fullRepo, path, roleObjectPath] = roleId.split(':')
  const [owner, repo] = fullRepo.split('/')
  const file = await github.getFile({ owner, repo, path })
  const fileContent = Buffer.from(file.content, 'base64').toString('ascii')
  const sourceACL = hclParser.parse(fileContent)
  const sourceACLObject = JSON.parse(sourceACL)
  const sourceRole = _.get(sourceACLObject, roleObjectPath) || []
  const role = updater(sourceRole)
  const acl = _.set(sourceACLObject, roleObjectPath, role)

  console.log(
    JSON.stringify({
      role,
      sourceRole,
      sourceACLObject,
      roleObjectPath
    })
  )

  const newContentBody = hclParser.stringify(JSON.stringify(acl), null, 2)

  if (newContentBody.includes('unable')) {
    console.error('HCL.stringify: failed')
    console.error(newContentBody)
    return { sourceACL, acl }
  }

  let newContent = Buffer.from(newContentBody, 'ascii').toString('base64')

  if (newContent === file.content) {
    console.warn('No changes to be applied')
    return { sourceACL, acl }
  }

  const updateResult = await github.updateFile({
    owner,
    repo,
    path,
    sha: file.sha,
    newContent,
  })

  return { updateResult, acl, sourceACL }
}

function getIdFromResources(
  resources: Indent.Resource[],
  kind: string
): string {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.labels.githubId || r.email || r.id)[0]
}
