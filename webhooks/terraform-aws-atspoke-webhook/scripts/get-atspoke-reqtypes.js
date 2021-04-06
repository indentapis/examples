const assert = require('assert')
const axios = require('axios')
const fs = require('fs').promises
const path = require('path')

const ATSPOKE_API_KEY = process.env.ATSPOKE_API_KEY
const ATSPOKE_API_HOST =
  process.env.ATSPOKE_API_HOST || 'https://api.askspoke.com'

assert(ATSPOKE_API_KEY, 'required env var missing: `ATSPOKE_API_KEY`')

async function loadFromAtspoke() {
  const results = await axios
    .get(`${ATSPOKE_API_HOST}/api/v1/request_types`, {
      headers: { 'Api-Key': ATSPOKE_API_KEY }
    })
    .then(r => r.data)

  return results
}

async function load() {
  const reqTypes = await loadFromAtspoke()
  const datadir = path.resolve(__dirname, '../data')

  try {
    await fs.mkdir(datadir)
  } catch (err) {
    console.warn(`WARN: data directory "${datadir}" already exists`)
  }

  await fs.writeFile(
    datadir + '/request_types.json',
    JSON.stringify(reqTypes, null, 2)
  )
  console.log(`completed writing to "${datadir}/request_types.json"`)
}

load().catch(err => {
  console.error(err)
  process.exit(1)
})
