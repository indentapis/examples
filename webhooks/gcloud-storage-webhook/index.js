const { Storage } = require('@google-cloud/storage')
const { verify } = require('@indent/webhook')

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
})

exports['indent-storage-webhook'] = async function handle(req, res) {
  const { body } = req

  try {
    await verify({
      secret: process.env.INDENT_WEBHOOK_SECRET,
      headers: req.headers,
      body
    })
  } catch (err) {
    console.error('@indent/webhook.verify(): failed')
    console.error(err)
    return res.status(500).json({ error: { message: err.message } })
  }

  const { events } = body

  console.log(`@indent/webhook: received ${events.length} events`)
  console.log(JSON.stringify(events, null, 2))

  try {
    await Promise.all(
      events.map(auditEvent => {
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
  } catch (err) {
    console.error(err)
  }

  return res.status(200).json({})
}

async function addBucketMember({ user, bucketName }) {
  const bucket = storage.bucket(bucketName)
  const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 })
  const grantedRole = 'roles/storage.objectViewer'

  if (
    policy.bindings.filter(binding => binding.role === grantedRole).length > 0
  ) {
    policy.bindings = policy.bindings.map(binding => {
      if (binding.role === grantedRole) {
        binding.members.push(`user:${user}`)
      }

      return binding
    })
  } else {
    policy.bindings.push({
      role: bindingRole,
      members: [`user:${user}`]
    })
  }

  return await bucket.iam.setPolicy(policy)
}

async function removeBucketMember({ user, bucketName }) {
  const bucket = storage.bucket(bucketName)
  const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 })

  policy.bindings
    .map(binding => {
      if (!binding.members.includes(`user:${user}`)) {
        return binding
      }

      let members = binding.members.filter(m => m !== `user:${user}`)

      if (members.length === 0) {
        return null
      }

      return { ...binding, members }
    })
    .filter(Boolean)

  return await bucket.iam.setPolicy(policy)
}

const gcs = { addBucketMember, removeBucketMember }

async function grantPermission(auditEvent) {
  const { event, actor, resources } = auditEvent
  const user = getIdFromResources(resources, 'user')
  const bucketName = getIdFromResources(resources, 'bucket')

  let result = await gcs.addBucketMember({ user, bucketName })

  console.log({
    event,
    actor,
    resources,
    result
  })
}

async function revokePermission(auditEvent) {
  const { event, actor, resources } = auditEvent
  const user = getIdFromResources(resources, 'user')
  const bucketName = getIdFromResources(resources, 'bucket')

  let result = await gcs.removeBucketMember({ user, bucketName })

  console.log({
    event,
    actor,
    resources,
    result
  })
}

function getIdFromResources(resources, kind) {
  return resources
    .filter(r => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map(r => r.email || (r.labels && r.labels.bucektName) || r.id)[0]
}
