import { APIGatewayProxyHandler } from 'aws-lambda'
import { verify } from '@indent/webhook'
import * as types from '@indent/types'
import * as AWS from 'aws-sdk'

AWS.config.update({ region: process.env.AWS_REGION })

const iam = new AWS.IAM({ apiVersion: '2010-05-08' })

export const handle: APIGatewayProxyHandler = async function handle(event) {
  const body = JSON.parse(event.body)

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      headers: event.headers,
      body: event.body
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } })
    }
  }

  const { events } = body

  console.log(`@indent/webhook: received ${events.length} events`)

  await Promise.all(
    events.map((auditEvent: types.Event) => {
      let { actor, event, resources } = auditEvent

      console.log(
        `@indent/webhook: ${event} { actor: ${
          actor.id
        }, resources: ${JSON.stringify(resources.map(r => r.id))} }`
      )

      switch (event) {
        case 'access/grant':
          return grantPermission(auditEvent)
        case 'access/revoke':
          return revokePermission(auditEvent)
        default:
          return Promise.resolve()
      }
    })
  )

  return {
    statusCode: 200,
    body: '{}'
  }
}

async function grantPermission(auditEvent: types.Event) {
  const { event, actor, resources } = auditEvent
  const userArn = getArnFromResources(resources, 'user')
  const groupArn = getArnFromResources(resources, 'group')

  let result = await iam
    .addUserToGroup({
      GroupName: groupArn,
      UserName: userArn
    })
    .promise()

  console.log({ event, actor, resources, result })
}

async function revokePermission(auditEvent: types.Event) {
  const { event, actor, resources } = auditEvent
  const userArn = getArnFromResources(resources, 'user')
  const groupArn = getArnFromResources(resources, 'group')

  let result = await iam
    .removeUserFromGroup({
      GroupName: groupArn,
      UserName: userArn
    })
    .promise()

  console.log({ event, actor, resources, result })
}

function getArnFromResources(
  resources: types.Resource[],
  kind: string
): string {
  return resources
    .filter(r => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map(r => {
      if (r.labels && r.labels.arn) {
        return r.labels.arn
      }

      return r.id
    })[0]
}
