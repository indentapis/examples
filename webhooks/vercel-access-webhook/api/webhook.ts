import { json, send } from 'micro'
import { verify } from '@indent/webhook'
import { Request, Response } from 'express'
import { Event as AuditEvent } from '@indent/types'

export default async function(req: Request, res: Response) {
  try {
    const body = await json(req)

    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      headers: req.headers,
      body
    })

    const { events } = body

    console.log(`@indent/webhook: received ${events.length} events`)
    console.log(JSON.stringify(events, null, 2))

    await Promise.all(
      events.map((auditEvent: AuditEvent) => {
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
            return Promise.resolve()
        }
      })
    )

    send(res, 200, '{}')
  } catch (err) {
    send(
      res,
      200,
      JSON.stringify({ error: { message: err.message, stack: err.stack } })
    )
  }
}

async function grantPermission({ event, actor, resources }: AuditEvent) {
  // - Grab labels from actor (e.g. AWS ARN)
  // - Grant them permission(s)
}

async function revokePermission({ event, actor, resources }: AuditEvent) {
  // - Grab labels from actor (e.g. AWS ARN)
  // - Revoke their permission(s)
}
