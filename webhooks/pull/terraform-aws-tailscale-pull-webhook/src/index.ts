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
        code: 2,
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

const tailnet = process.env.TAILSCALE_TAILNET
const TAILSCALE_API_KEY = process.env.TAILSCALE_API_KEY

const pullGroups = async (): Promise<Resource[]> => {
  const timestamp = new Date().toISOString()
  const tailscaleGroupResources = await loadFromTailscale({
    transform: (id) => ({
      id,
      kind: 'tailscale.v1.Group',
      displayName: id.split(':')[1],
      labels: {
        ['tailscale/tailnet']: tailnet,
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

  const acl = (await axios({
    method: 'get',
    url: `https://api.tailscale.com/api/v2/tailnet/${tailnet}/acl`,
    headers: {
      Accept: 'application/json',
    },
    auth: {
      username: TAILSCALE_API_KEY,
      password: '',
    },
  }).then((r) => r.data)) as any

  if (acl?.Groups) {
    return Object.keys(acl.Groups).map(transform)
  }

  console.warn('Tailscale ACL missing `.Groups`')

  return []
}
