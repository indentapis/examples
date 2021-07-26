// import * as Indent from '@indent/types'
import { readFile } from 'fs/promises'
import { google } from 'googleapis'
import { authorize } from './auth/google'
import { verify } from '@indent/webhook'
import { Request, Response } from 'express'
import { Resource } from '@indent/types'

const GOOGLE_CUSTOMER_ID = process.env.GOOGLE_CUSTOMER_ID

async function loadFromGoogleGroups(): Promise<Resource[]> {
  console.log('Loading data from Google Groups')
  const auth = await getAuth()
  const service = google.cloudidentity({
    version: 'v1',
    auth,
  })

  const {
    data: { groups },
  } = await service.groups.list({
    parent: `customers/${GOOGLE_CUSTOMER_ID}`,
    view: 'BASIC',
  })

  const kind = 'google.v1.group'

  return groups.map((g) => ({
    id: g.name.split('/')[1],
    kind,
    displayName: g.displayName,
    labels: {
      'google/parent': g.parent,
      'google/createTime': g.createTime,
      'google/updateTime': g.updateTime,
      description: g.description,
      ...(g.labels || {}),
    },
  })) as Resource[]
}

// handle the request
// figure out what type this is
exports['webhook'] = async function handle(req: IRequest, res: Response) {
  const { headers, rawBody } = req

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
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

  if (pull && pull.kinds) {
    console.log('pullUpdate: attempt: ' + pull.kinds)
    try {
      const resources = await loadFromGoogleGroups()
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
// refer to pull from google groups
export async function getAuth() {
  if (process.env.NODE_ENV !== 'development') {
    let auth = new google.auth.Compute({
      serviceAccountEmail: process.env.GCP_SVC_ACCT_EMAIL,
      scopes: ['https://www.googleapis.com/auth/cloud-identity.groups'],
    })

    let { token } = await auth.getAccessToken()
    if (!token) {
      throw new Error('getAuth: getAccessToken: token not found')
    }

    let tokenInfo = await auth.getTokenInfo(token)
    console.log(JSON.stringify({ tokenInfo }))

    return auth
  }

  try {
    // Load client secrets from a local file.
    let content = await readFile('credentials.json')
    return await authorize(JSON.parse(content.toString()))
  } catch (err) {
    console.error('Error loading client secret file', err)
    throw err
  }
}

type IRequest = Request & { rawBody: string }
