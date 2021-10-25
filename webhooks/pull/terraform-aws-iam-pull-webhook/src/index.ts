import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { verify } from '@indent/webhook'
import { Resource, PullUpdateResponse } from '@indent/types'
import {
  Group,
  IAMClient,
  ListGroupsCommand,
  ListGroupsCommandOutput,
} from '@aws-sdk/client-iam'

const iamClient = new IAMClient({ region: `${process.env.AWS_REGION}` })

export const handle: APIGatewayProxyHandler = async function handle(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
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
      body: JSON.stringify({
        status: {
          code: 2,
          message: err.message,
          details: err.stack,
        },
      } as PullUpdateResponse),
    }
  }

  const body = JSON.parse(event.body)
  const pull = body as { kinds: string[] }

  if (pull && pull.kinds) {
    console.log('pullUpdate: attempt: ' + pull.kinds)
    try {
      const resourcesAsync = await Promise.all(
        pull.kinds.map(async (kind: string): Promise<Resource[]> => {
          if (kind.toLowerCase().includes('aws.iam.v1.group')) {
            return await loadFromAWS()
          }

          return []
        })
      )
      const resources = resourcesAsync.flat()
      console.log('pullUpdate: success: ' + pull.kinds)
      return {
        statusCode: 200,
        body: JSON.stringify({ resources } as PullUpdateResponse),
      }
    } catch (err) {
      console.log('pullUpdate: error: ' + pull.kinds)
      console.error(err)
    }
  } else {
    // unknown payload
    console.warn('webhook received unknown payload')
    console.warn(JSON.stringify(body))
  }

  return {
    statusCode: 200,
    body: '{}',
  }
}

async function loadFromAWS(MaxItems = 100): Promise<Resource[]> {
  console.log(`Loading data from AWS IAM`)
  const ListGroups = new ListGroupsCommand({
    MaxItems,
  })
  const response: ListGroupsCommandOutput = await iamClient.send(ListGroups)

  const kind = 'aws.iam.v1.Group'
  const timestamp = new Date().toISOString()

  const { Groups } = response

  return Groups.map((g: Group) => ({
    id: g.Arn.toString(),
    kind,
    displayName: g.GroupName,
    labels: {
      'aws/arn': g.Arn,
      'aws/createDate': g.CreateDate.toString(),
      'aws/path': g.Path,
      timestamp,
    },
  })) as Resource[]
}
