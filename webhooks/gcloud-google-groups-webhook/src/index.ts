import { AxiosResponse } from 'axios'
import { Event } from '@indent/types'
import { verify } from '@indent/webhook'
import { Request, Response } from 'express'
import * as github from './capabilities/google-groups'
import { GaxiosResponse } from 'gaxios'

exports['webhook'] = async function handle(req: IRequest, res: Response) {
  let { headers, body } = req
  const rawBody = JSON.stringify(body)

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      body: rawBody,
      headers
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return res.status(500).json({ status: { message: err.message } })
  }

  let events: Array<Event>

  try {
    let json = JSON.parse(rawBody)

    events = json.events as Event[]
  } catch (err) {
    console.error('JSON.parse(body): failed')
    console.error(err)
    return res.status(500).json({ status: { message: err.message } })
  }

  console.log(`@indent/webhook: received ${events.length} events`)
  console.log(JSON.stringify(events, null, 2))

  try {
    await Promise.all(
      events.map(
        (
          auditEvent: Event
        ): Promise<
          void | GaxiosResponse<any> | AxiosResponse<any> | Status
        > => {
          let { actor, event, resources } = auditEvent

          console.log(
            `@indent/webhook: ${event} { actor: ${
              actor.id
            }, resources: ${JSON.stringify(resources.map(r => r.id))} }`
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
  }

  return res.status(200).json({})
}

async function grantPermission(auditEvent: Event) {
  if (github.matchEvent(auditEvent)) {
    return await github.grantPermission(auditEvent)
  }

  return {
    code: 404,
    message:
      'This resource is not supported by the capabilities of this webhook.'
  }
}

async function revokePermission(auditEvent: Event) {
  if (github.matchEvent(auditEvent)) {
    return await github.revokePermission(auditEvent)
  }

  return {
    code: 404,
    message:
      'This resource is not supported by the capabilities of this webhook.'
  }
}

type IRequest = Request & { rawBody: string }

type Status = {
  code: number
  message: string
}
