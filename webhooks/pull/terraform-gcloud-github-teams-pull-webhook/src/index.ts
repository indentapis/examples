// import indent types and verify
import axios from 'axios'
import { verify } from '@indent/webhook'
import { Request, Response } from 'express'
import { Resource } from '@indent/types'

const INDENT_WEBHOOK_SECRET = process.env.INDENT_WEBHOOK_SECRET
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_ORG = process.env.GITHUB_ORG

// auth to GitHub
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

  const kind = 'github.team'

  const { data: results } = response
  console.log(results)

  return results.map((r: GitHubTeam) => ({
    id: r.id,
    kind,
    displayName: r.name,
    org: GITHUB_ORG,
    labels: {
      ...(r || {}),
    },
  })) as Resource[]
}
// pull webhook requires `read:org`
exports['webhook'] = async function handle(req: IRequest, res: Response) {
  const { headers, rawBody } = req

  // verify boilerplate
  try {
    await verify({
      secret: INDENT_WEBHOOK_SECRET,
      body: rawBody.toString(),
      headers,
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return res.status(500).json({ status: { message: err.message } })
  }

  const body = JSON.parse(rawBody.toString())
  const pull = body as { kinds: string[] }
  // function - load from GitHub Teams
  if (pull && pull.kinds) {
    console.log('pullUpdate: attempt: ' + pull.kinds)
    try {
      const resources = await loadFromGitHubTeams()
      console.log('pullUpdate: success: ' + pull.kinds)
      return res.status(200).json({ resources })
    } catch (err) {
      console.log('pullUpdate: error: ' + pull.kinds)
      console.error(err)
      return res.status(500).json({ status: { message: err.message } })
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
  id: string
  node_id?: string
  slug?: string
  description
  privacy
  url
  html_url
  members_url
  repositories_url
  permission
  parent?: string
}

type IRequest = Request & { rawBody: string }
