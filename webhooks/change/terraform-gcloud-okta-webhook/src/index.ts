import { verify } from '@indent/webhook'
import { Event, ApplyUpdateResponse } from '@indent/types'
import { AxiosResponse } from 'axios'
import { Request, Response } from 'express'
import * as oktaGroups from './capabilities/okta-groups'

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
    return res.status(500).json({
      status: { code: 500, message: err.message, details: err.stack },
    })
  }

  const body = JSON.parse(rawBody)
  const { events } = body

  console.log(`@indent/webhook: received ${events.length} events`)
  console.log(JSON.stringify(events, null, 2))

  try {
    await Promise.all(
      events.map(
        (
          auditEvent: Event
        ): Promise<void | AxiosResponse<any> | ApplyUpdateResponse> => {
          let { actor, event, resources } = auditEvent

          console.log(
            `@indent/webhook: ${event} { actor: ${
              actor.id
            }, resources: ${JSON.stringify(resources.map((r) => r.id))} }`
          )

          switch (event) {
            case 'access/grant':
              return grantPermission(auditEvent)
            case 'access/revoke':
              return revokePermission(auditEvent)
            default:
              console.log('received unknown event')
              console.log(auditEvent)
              return Promise.resolve()
          }
        }
      )
    )
  } catch (err) {
    if (err.response) {
      let res = err.response

      if (res.body && res.body.toJSON) {
        console.error(res.body.toJSON())
      } else if (res.body) {
        console.error(res.body)
      } else if (res.data) {
        console.error(res.data)
      } else {
        console.error(res)
      }
    } else {
      console.error(err)
    }
    return res.status(500).json({
      status: {
        code: 500,
        message: '@indent/webhook: failed to provision, check logs',
      },
    })
  }
  return res.status(200).json({})
}

async function grantPermission(auditEvent: Event) {
  if (oktaGroups.matchEvent(auditEvent)) {
    return await oktaGroups.grantPermission(auditEvent)
  }

  return {
    status: {
      code: 404,
      message:
        'This resource is not supported by the capabilities of this webhook.',
    },
  }
}

async function revokePermission(auditEvent: Event) {
  if (oktaGroups.matchEvent(auditEvent)) {
    return await oktaGroups.revokePermission(auditEvent)
  }

  return {
    status: {
      code: 404,
      message:
        'This resource is not supported by the capabilities of this webhook.',
    },
  }
}

type IRequest = Request & { rawBody: string }
