import { APIGatewayProxyHandler } from 'aws-lambda'
import { verify } from '@indent/webhook'
import * as Indent from '@indent/types'
import axios from 'axios'

export const handle: APIGatewayProxyHandler = async function handle(event) {
  const body = JSON.parse(event.body)

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
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
  console.log(JSON.stringify(events, null, 2))

  await Promise.all(
    events.map((auditEvent: Indent.Event) => {
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
    })
  )

  return {
    statusCode: 200,
    body: '{}'
  }
}

const SLACK_TOKEN = process.env.SLACK_TOKEN

type Channel = {
  id: string
  name: string
  is_archived: boolean
}

type ChannelInfo = {
  ok: boolean
  channel: Channel
}

async function getChannelInfo({
  channel
}: {
  channel: string
}): Promise<ChannelInfo> {
  return await axios({
    method: 'get',
    url: `https://slack.com/api/conversations.info`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SLACK_TOKEN}`
    },
    data: { channel }
  }).then(r => r.data)
}

async function addUserToChannel({
  user: users,
  channel
}: {
  user: string
  channel: string
}) {
  return await axios({
    method: 'post',
    url: `https://slack.com/api/conversations.invite`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SLACK_TOKEN}`
    },
    data: { users, channel }
  })
}

async function unarchiveChannel({ channel }: { channel: string }) {
  return await axios({
    method: 'post',
    url: `https://slack.com/api/conversations.unarchive`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SLACK_TOKEN}`
    },
    data: { channel }
  }).then(r => r.data)
}

async function removeUserFromChannel({
  user,
  channel
}: {
  user: string
  channel: string
}) {
  return await axios({
    method: 'post',
    url: `https://slack.com/api/conversations.kick`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SLACK_TOKEN}`
    },
    data: { user, channel }
  })
}

const slack = {
  getChannelInfo,
  unarchiveChannel,
  addUserToChannel,
  removeUserFromChannel
}

async function grantPermission(auditEvent: Indent.Event) {
  const { event, actor, resources } = auditEvent
  const user = getSlackIdFromResources(resources, 'user')
  const channel = getSlackIdFromResources(resources, 'channel')

  let info = await slack.getChannelInfo({ channel })

  console.log({ info })

  if (info.ok && info.channel.is_archived) {
    let unarchiveData = await slack.unarchiveChannel({ channel })

    console.log({ unarchiveData })
  }

  let result = await slack.addUserToChannel({ user, channel })

  console.log({
    event,
    actor,
    resources,
    success: result.status >= 200 && result.status < 300
  })

  console.log(result.data)
}

async function revokePermission(auditEvent: Indent.Event) {
  const { event, actor, resources } = auditEvent
  const user = getSlackIdFromResources(resources, 'user')
  const channel = getSlackIdFromResources(resources, 'channel')

  let result = await slack.removeUserFromChannel({ user, channel })

  console.log({
    event,
    actor,
    resources,
    success: result.status >= 200 && result.status < 300
  })

  console.log(result.data)
}

function getSlackIdFromResources(
  resources: Indent.Resource[],
  kind: string
): string {
  return resources
    .filter(r => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map(r => {
      if (r.labels && r.labels.slackId) {
        return r.labels.slackId
      }

      return r.id
    })[0]
}
