import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { verify } from '@indent/webhook'
import * as types from '@indent/types'
import * as AWS from 'aws-sdk'

const ses = new AWS.SES({
  apiVersion: '2010-12-01',
  region: process.env.AWS_REGION
})

const INDENT_WEBHOOK_SECRET = process.env.INDENT_WEBHOOK_SECRET || ''
const INDENT_SPACE_NAME = process.env.INDENT_SPACE_NAME || ''
const EMAIL_FROM_ADDR = process.env.EMAIL_FROM_ADDR || ''
const EMAIL_TO_ADDR = process.env.EMAIL_TO_ADDR || ''

export const handle: APIGatewayProxyHandler = async function handle(event) {
  const body = JSON.parse(event.body)

  try {
    await verify({
      secret: INDENT_WEBHOOK_SECRET,
      headers: event.headers,
      body: event.body
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } })
    }
  }

  const { events } = body

  console.log(`@indent/webhook: received ${events.length} events`)

  const responses = (
    await Promise.all(
      events.map(
        (auditEvent: types.Event): Promise<APIGatewayProxyResult> => {
          let { actor, event, resources } = auditEvent

          console.log(
            `@indent/webhook: ${event} { actor: ${
              actor.id
            }, resources: ${JSON.stringify(resources.map(r => r.id))} }`
          )

          switch (event) {
            case 'access/grant':
              return grantPermission(auditEvent, events)
            case 'access/revoke':
              return revokePermission(auditEvent, events)
            default:
              return Promise.resolve({
                statusCode: 200,
                body: 'Unknown event'
              })
          }
        }
      )
    )
  ).filter(
    (r: APIGatewayProxyResult) => r.statusCode !== 200
  ) as APIGatewayProxyResult[]

  if (responses.length > 0) {
    return responses[0]
  }

  return {
    statusCode: 200,
    body: '{}'
  }
}

async function grantPermission(
  auditEvent: types.Event,
  allEvents: types.Event[]
): Promise<APIGatewayProxyResult> {
  let result = await ses
    .sendEmail(getSendEmailParams(auditEvent, allEvents))
    .promise()

  console.log({ resultFromSES: result })
  return {
    statusCode: 200,
    body: '{}'
  }
}

async function revokePermission(
  auditEvent: types.Event,
  allEvents: types.Event[]
): Promise<APIGatewayProxyResult> {
  let result = await ses
    .sendEmail(getSendEmailParams(auditEvent, allEvents))
    .promise()

  console.log({ resultFromSES: result })
  return {
    statusCode: 200,
    body: '{}'
  }
}

function getSendEmailParams(
  auditEvent: types.Event,
  allEvents: types.Event[]
): AWS.SES.SendEmailRequest {
  let targetActor = getTargetActor(auditEvent)
  let targetResource = getTargetResource(auditEvent)
  let targetActorLabel = getDisplayName(targetActor)
  let targetResourceLabel = getDisplayName(targetResource)
  let actionLabel = auditEvent.event === 'access/grant' ? 'Granted' : 'Revoked'

  let EmailText = `Please use an HTML-capable email viewer.`
  let EmailHtml = getEmailHtml(auditEvent, allEvents, {
    simple: true
  })
  let EmailSubject = `IAM · ${targetActorLabel} / ${targetResource.kind} ${targetResourceLabel} · Access ${actionLabel}`

  return {
    Source: EMAIL_FROM_ADDR,
    Destination: { ToAddresses: EMAIL_TO_ADDR.split(',') },
    Message: {
      Subject: { Charset: 'UTF-8', Data: EmailSubject },
      Body: {
        Html: { Charset: 'UTF-8', Data: EmailHtml },
        Text: { Charset: 'UTF-8', Data: EmailText }
      }
    }
  }
}

function getDisplayName(r: types.Resource): string {
  return (
    r.displayName ||
    (r.labels ? r.labels['indent.com/profile/name/preferred'] : '') ||
    r.id
  )
}

function getTargetActor(auditEvent: types.Event): types.Resource {
  return auditEvent?.resources?.filter(r => r.kind?.includes('user'))[0] || {}
}

function getTargetResource(auditEvent: types.Event): types.Resource {
  return auditEvent?.resources?.filter(r => !r.kind?.includes('user'))[0] || {}
}

type EmailHtmlOptions = {
  simple: boolean
}

function getEmailHtml(
  auditEvent: types.Event,
  allEvents: types.Event[],
  opts: EmailHtmlOptions
) {
  let targetActor = getTargetActor(auditEvent)
  let targetResource = getTargetResource(auditEvent)
  let timestampDate = new Date(auditEvent.timestamp)
  let timestampLabel = timestampDate.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles'
  })

  let metaLabels = auditEvent?.meta?.labels || {}
  let actionLabel = auditEvent.event === 'access/grant' ? 'granted' : 'revoked'
  let indentURL = `https://indent.com/spaces/${INDENT_SPACE_NAME}/workflows/${metaLabels['indent.com/workflow/origin/id']}/runs/${metaLabels['indent.com/workflow/origin/run/id']}`

  if (opts.simple) {
    return `
<img style="margin:0;border:0;padding:0;display:block;outline:none;"
src="https://indent.com/static/indent_text_black.png" width="120" height="34" />

${allEvents
  .filter(e => e.event === 'access/request')
  .map(e => `<b>Request Reason</b> ${e.reason}`)}

${allEvents
  .filter(e => e.event === 'access/approve')
  .map(
    e => `
<p>
  <b>${e?.actor?.displayName}</b> (<a href="mailto:${
      e?.actor?.email
    }" target="_blank">${
      e?.actor?.email
    }</a>) approved access to <b>${getDisplayName(
      targetActor
    )}</b> (<a href="mailto:${targetActor?.email}" target="_blank">${
      targetActor?.email
    }</a>) for <b>${targetResource?.kind} ${getDisplayName(targetResource)}</b>.
</p>`
  )
  .join('\n')}

<p>
  <b>${auditEvent?.actor?.displayName}</b> (<a href="mailto:${
      auditEvent?.actor?.email
    }" target="_blank">${
      auditEvent?.actor?.email
    }</a>) ${actionLabel} access to <b>${getDisplayName(
      targetActor
    )}</b> (<a href="mailto:${targetActor?.email}" target="_blank">${
      targetActor?.email
    }</a>) for <b>${targetResource?.kind} ${getDisplayName(targetResource)}</b>.
</p>
<p style="font-size:11px">
<a href="${indentURL}" target="_blank">View Workflow in Indent &rarr;</a>
</p>
<p style="font-size:11px">${timestampLabel}</p>
`
  }

  return `
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f5f5f5" style="font-family:Arial,Helvetica,sans-serif;font-weight:normal;font-size:14px;line-height:19px;color:#444444;border-collapse:collapse;border:1px solid #dddddd">
  <tbody>
    <tr>
      <td width="4%"></td>
      <td width="92%">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-weight:normal;font-size:14px;line-height:19px;color:#444444;border-collapse:collapse">
          <tbody><tr>
            <td width="100%" height="30"></td>
          </tr>
          <tr>
            <td width="100%" height="40">
            <img src="https://indent.com/static/indent_text_black.png" alt="Indent" height="34" style="outline:none;text-decoration:none;display:block" class="CToWUd">
            </td>
          </tr>
          <tr>
            <td width="100%" height="20"></td>
          </tr>
        </tbody></table>
      </td>
      <td width="4%"></td>
    </tr>
  </tbody>
</table>
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="font-family:Arial,Helvetica,sans-serif;font-weight:normal;font-size:14px;line-height:19px;color:#444444;border-collapse:collapse;border-left:1px solid #dddddd;border-right:1px solid #dddddd">
  <tbody>
    <tr>
      <td width="4%"></td>
      <td width="92%">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family:Arial,Helvetica,sans-serif;font-weight:normal;font-size:18px;line-height:24px;color:#444444;border-collapse:collapse">
          <tbody><tr>
            <td width="100%" height="30"></td>
          </tr>
          <tr>
            <td width="100%" valign="top">
              <p>
                <b>${auditEvent?.actor?.displayName}</b> (<a href="mailto:${
    auditEvent?.actor?.email
  }" target="_blank">${
    auditEvent?.actor?.email
  }</a>) ${actionLabel} access to <b>${getDisplayName(
    targetActor
  )}</b> (<a href="mailto:${targetActor?.email}" target="_blank">${
    targetActor?.email
  }</a>) for <b>${targetResource?.kind} ${getDisplayName(targetResource)}</b>.
              </p>
              <p style="font-size:11px">
              <a href="${indentURL}" target="_blank">View Workflow in Indent &rarr;</a>
              </p>
              <p style="font-size:11px">${timestampLabel}</p>
            </td>
          </tr>
          <tr>
            <td width="100%" height="20"></td>
          </tr>
        </tbody></table>
      </td><td width="4%"></td>
    </tr>
  </tbody>
</table>`
}
