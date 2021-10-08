// import * as Indent from '@indent/types'
import { google } from 'googleapis'
import { getAuth } from './capabilities/google-groups'
import { verify } from '@indent/webhook'
import { Request, Response } from 'express'
import { Resource, PullUpdateResponse } from '@indent/types'

const GOOGLE_CUSTOMER_ID = process.env.GOOGLE_CUSTOMER_ID

async function loadFromGoogleGroups(): Promise<Resource[]> {
  console.log('Loading data from Google Groups...')
  const auth = await getAuth()
  const service = google.cloudidentity({
    version: 'v1',
    auth,
  })

  const {
    data: { groups },
  } = await service.groups.list({
    parent: `customers/${GOOGLE_CUSTOMER_ID}`,
    view: 'FULL',
  })

  const kind = 'google.v1.Group'

  return groups.map((g) => ({
    id: g.name.split('/')[1],
    kind,
    displayName: g.displayName,
    labels: {
      ...(g.labels || {}),
    },
  })) as Resource[]
}

exports['webhook'] = async function handle(
  req: IRequest,
  res: Response
): Promise<Response<PullUpdateResponse>> {
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
    return res.status(500).json({
      status: {
        message: err.message,
        details: JSON.stringify(err.stack),
      },
    })
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
    }
  } else {
    // unknown payload
    console.warn('webhook received unknown payload')
    console.warn(JSON.stringify(body))
  }

  return res.status(200).json({})
}

type IRequest = Request & { rawBody: string }
