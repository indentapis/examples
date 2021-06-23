import path from 'path'
import { promises as fs } from 'fs'
import { getJiraClient } from '../src/utils/jira'

async function load() {
  const datadir = path.resolve(__dirname, '../data')

  try {
    await fs.mkdir(datadir)
  } catch (err) {
    console.warn(`WARN: data directory "${datadir}" already exists`)
  }

  const roles = await getJiraClient()({
    url: '/rest/api/3/role'
  })

  await fs.writeFile(datadir + '/roles.json', JSON.stringify(roles, null, 2))
  console.log(`completed writing to "${datadir}/roles.json"`)
}

load().catch(err => {
  console.error(err)
  process.exit(1)
})
