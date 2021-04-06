import axios, { AxiosRequestConfig } from 'axios'
import assert from 'assert'

const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || ''
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL || ''
const JIRA_INSTANCE_URL = process.env.JIRA_INSTANCE_URL || ''

assert(JIRA_API_TOKEN, 'missing environment variable: JIRA_API_TOKEN')
assert(JIRA_USER_EMAIL, 'missing environment variable: JIRA_USER_EMAIL')
assert(JIRA_INSTANCE_URL, 'missing environment variable: JIRA_INSTANCE_URL')

export function getJiraClient() {
  let client = axios.create({
    baseURL: JIRA_INSTANCE_URL,
    auth: {
      username: JIRA_USER_EMAIL,
      password: JIRA_API_TOKEN
    }
  })

  return client
}
