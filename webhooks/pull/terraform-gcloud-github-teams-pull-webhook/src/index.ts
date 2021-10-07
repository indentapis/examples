import axios from 'axios'
import { verify } from '@indent/webhook'
import { Request, Response } from 'express'
import { Resource, PullUpdateResponse } from '@indent/types'

const INDENT_WEBHOOK_SECRET = process.env.INDENT_WEBHOOK_SECRET
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_ORG = process.env.GITHUB_ORG

async function loadFromGitHubTeams(
  path = '',
  resultsPerPage = 100
): Promise<Resource[]> {
  console.log('Loading data from GitHub...')
  const response = await axios({
    method: 'GET',
    url: /http/.test(path)
      ? path
      : `https://api.github.com/orgs/${GITHUB_ORG}/teams`,
    headers: {
      Accept: `application/vnd.github.v3+json`,
      Authorization: `token ${GITHUB_TOKEN}`,
    },
    params: {
      page: 1,
      per_page: resultsPerPage,
    },
  })

  const kind = 'github.v1.Team'
  const timestamp = new Date().toISOString()

  const { data: results } = response

  return results.map((r: GitHubTeam) => ({
    id: r.id.toString(),
    kind,
    displayName: r.name,
    labels: {
      'github/org': GITHUB_ORG,
      'github/id': r.id.toString(),
      'github/slug': r.slug,
      'github/description': r.description,
      'github/privacy': r.privacy,
      'github/permission': r.permission,
      'github/parent': r.parent ? r.parent : '',
      timestamp,
    },
  })) as Resource[]
}

exports['webhook'] = async function handle(
  req: IRequest,
  res: Response
): Promise<Response<PullUpdateResponse>> {
  const { headers, rawBody } = req
  // Log attempt #1
  console.log(rawBody.toString())

  try {
    await verify({
      secret: INDENT_WEBHOOK_SECRET,
      body: rawBody.toString(),
      headers,
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return res.status(500).json({
      status: {
        code: 500,
        message: err.message,
        details: JSON.stringify(err.stack),
      },
    })
  }

  const body = JSON.parse(rawBody.toString())
  const pull = body as { kinds: string[] }

  if (pull && pull.kinds) {
    console.log('pullUpdate: attempt: ' + pull.kinds)
    // log attempt #2
    console.log(JSON.stringify(res))
    try {
      const resourcesAsync = await Promise.all(
        pull.kinds.map(async (kind: string): Promise<Resource[]> => {
          if (kind.toLowerCase().includes('github.v1.team')) {
            return await loadFromGitHubTeams()
          }

          return []
        })
      )
      const resources = resourcesAsync.flat()
      console.log('pullUpdate: success: ' + pull.kinds)

      return res.status(200).json({ resources })
    } catch (err) {
      console.log('pullUpdate: error: ' + pull.kinds)
      console.error(err)
      return res.status(500).json({
        status: {
          code: 500,
          message: err.message,
          details: JSON.stringify(err.stack),
        },
      })
    }
  } else {
    // unknown payload
    console.warn('webhook received unknown payload')
    console.warn(JSON.stringify(body))
  }

  return res.status(200).json({})
}

type GitHubTeam = {
  name: string
  id: number
  node_id?: string
  slug?: string
  description?: string
  privacy?: 'secret' | 'closed'
  url?: string
  html_url?: string
  members_url?: string
  repositories_url?: string
  permission?: 'pull' | 'push' | 'admin'
  parent?: string | null
}

type IRequest = Request & { rawBody: string }
