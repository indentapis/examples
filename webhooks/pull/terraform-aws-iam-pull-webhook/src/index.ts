import { APIGatewayProxyHandler } from 'aws-lambda'
import { verify } from '@indent/webhook'
import { Resource } from '@indent/types'
import {
  Group,
  IAMClient,
  ListGroupsCommand,
  ListGroupsCommandOutput,
} from '@aws-sdk/client-iam'

const iamClient = new IAMClient({ region: `${process.env.AWS_REGION}` })

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
  const pull = body as { kinds: string[] }

  if (pull && pull.kinds) {
    console.log('pullUpdate: attempt: ' + pull.kinds)
    try {
      const resources = await loadFromAWS()
      console.log('My Resource: ' + resources[0])
      console.log('pullUpdate: success: ' + pull.kinds)
      return {
        statusCode: 200,
        body: JSON.stringify({ resources }),
      }
    } catch (err) {
      console.log('pullUpdate: error: ' + pull.kinds)
      console.error(err)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message }),
      }
    }
  } else {
    // unknown payload
    console.warn('webhook received unknown payload')
    console.warn(JSON.stringify(body))
  }

  return {
    statusCode: 200,
    body: JSON.stringify({}),
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
    id: g.GroupId.toString(),
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
