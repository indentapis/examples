import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { verify } from '@indent/webhook'
import { Resource, PullUpdateResponse } from '@indent/types'

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
        status: { code: 2, message: err.message, details: err.stack },
      } as PullUpdateResponse),
    }
  }

  const body = JSON.parse(event.body)
  const pull = body as { kinds: string[] }

  if (pull && pull.kinds) {
    console.log('pullUpdate: attempt: ' + pull.kinds)
    try {
      const resourcesAsync = await Promise.all(
        pull.kinds.map(async (_kind: string): Promise<Resource[]> => {
          // pull resources from custom data source

          return [
            {
              kind: 'custom.v1.Admin',
              id: 'example-admin-123',
              displayName: 'Example Admin 123',
            },
          ]
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
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: { code: 2, message: err.message, details: err.stack },
        } as PullUpdateResponse),
      }
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
