import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { Resource } from '@indent/types'
import { verify } from '@indent/webhook'
import axios from 'axios'

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
        code: 500,
        message: err.message,
        details: err.stack,
      }),
    }
  }

  const body = JSON.parse(event.body)
  const pull = body as { kinds: string[] }

  if (pull && pull.kinds) {
    console.log('pullUpdate: attempt: ' + pull.kinds)
    try {
      const resourcesAsync = await Promise.all(
        pull.kinds.map(async (kind: string): Promise<Resource[]> => {
          if (kind.toLowerCase().includes('tailscale.v1.group')) {
            return await pullGroups()
          }
          return []
        })
      )
      const resources = resourcesAsync.flat()
      console.log('My Resource: ' + resources[0])
      console.log('pullUpdate: success: ' + pull.kinds)
      return {
        statusCode: 200,
        body: JSON.stringify({ resources }),
      }
    } catch (err) {
      console.log('pullUpdate: error ' + pull.kinds)
      console.error(err)
    }
  } else {
    console.warn('webhook received unknown payload')
    console.warn(JSON.stringify(body))
  }

  return {
    statusCode: 200,
    body: '{}',
  }
}

const TS_TAILNET = process.env.TS_TAILNET
const TS_API_KEY = process.env.TS_API_KEY

const pullGroups = async (): Promise<Resource[]> => {
  const timestamp = new Date().toISOString()
  const tailscaleGroupResources = await loadFromTailscale({
    transform: (group) => ({
      id: [`tailscale/${TS_TAILNET}`, group.split(':')[1]].join('/'),
      kind: 'tailscale.v1.Group',
      displayName: group.split(':')[1],
      labels: {
        ['tailscale/tailnet']: TS_TAILNET,
        timestamp,
      },
    }),
  })

  return tailscaleGroupResources
}

const loadFromTailscale = async ({
  transform = (r: any): Resource => r,
}): Promise<Resource[]> => {
  console.log('Loading data from Tailscale...')

  // call to axios
  const response = await axios({
    method: 'get',
    url: `https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/acl`,
    headers: {
      Accept: 'application/json',
    },
    auth: {
      username: TS_API_KEY,
      password: '',
    },
  })

  const { data: results } = response as any
  console.log('Tailscale response:', response)
  console.log('Tailscale groups:', results)
  // parse response
  if (results?.groups) {
    return Object.keys(results.groups).map(transform)
  }
}
