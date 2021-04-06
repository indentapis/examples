import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { verify } from '@indent/webhook'
import * as types from '@indent/types'
import * as AWS from 'aws-sdk'

AWS.config.update({ region: process.env.AWS_REGION })

const dynamo = new AWS.DynamoDB({
  apiVersion: '2012-08-10',
  endpoint: process.env.AWS_DDB_ENDPOINT
})

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

  const responses = (
    await Promise.all(
      events.map(
        (auditEvent: types.Event): Promise<APIGatewayProxyResult> => {
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
              return Promise.resolve({
                statusCode: 200,
                body: 'Unknown event'
              })
          }
        }
      )
    )
  ).filter(
    (r: APIGatewayProxyResult) => r.statusCode !== 200
  ) as APIGatewayProxyResult[]

  if (responses.length > 0) {
    return responses[0]
  }

  return {
    statusCode: 200,
    body: '{}'
  }
}

async function grantPermission(
  auditEvent: types.Event
): Promise<APIGatewayProxyResult> {
  const { event, actor, resources, reason } = auditEvent

  if (!reason || !/woop/.test(reason)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: {
          message: `This is not a valid reason: ${reason}. Try including the fly trap.`
        }
      })
    }
  }

  const userId = getCognitoIdFromResources(resources, 'user')
  const tenantId = getCognitoIdFromResources(resources, 'tenant')

  let result = await dynamo
    .putItem({
      TableName: 'rbac_bindings',
      Item: {
        Role: { S: 'read' },
        UserId: { S: userId },
        TenantId: { S: tenantId }
      }
    })
    .promise()

  console.log({ event, actor, resources, result })
  return {
    statusCode: 200,
    body: '{}'
  }
}

async function revokePermission(
  auditEvent: types.Event
): Promise<APIGatewayProxyResult> {
  const { event, actor, resources } = auditEvent
  const userId = getCognitoIdFromResources(resources, 'user')
  const tenantId = getCognitoIdFromResources(resources, 'tenant')

  let result = await dynamo
    .deleteItem({
      TableName: 'rbac_bindings',
      Key: {
        UserId: { S: userId },
        TenantId: { S: tenantId }
      }
    })
    .promise()

  console.log({ event, actor, resources, result })
  return {
    statusCode: 200,
    body: '{}'
  }
}

function getCognitoIdFromResources(
  resources: types.Resource[],
  kind: string
): string {
  return resources
    .filter(r => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map(r => {
      if (r.labels && r.labels.cognitoId) {
        return r.labels.cognitoId
      }

      return r.id
    })[0]
}
