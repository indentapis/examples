import { readFile } from 'fs/promises'
import { google } from 'googleapis'
import { authorize } from '../auth/google'

export async function getAuth() {
  if (process.env.NODE_ENV !== 'development') {
    let auth = new google.auth.Compute({
      serviceAccountEmail: process.env.GCP_SVC_ACCT_EMAIL,
      scopes: [
        'https://www.googleapis.com/auth/cloud-identity.groups',
        'https://www.googleapis.com/auth/cloud-identity.groups.readonly',
        'https://www.googleapis.com/auth/cloud-identity',
        'https://www.googleapis.com/auth/cloud-platform',
      ],
    })

    let { token } = await auth.getAccessToken()
    if (!token) {
      throw new Error('getAuth: getAccessToken: token not found')
    }

    let tokenInfo = await auth.getTokenInfo(token)
    console.log(JSON.stringify({ tokenInfo }))

    return auth
  }

  try {
    // Load client secrets from a local file.
    let content = await readFile('credentials.json')
    return await authorize(JSON.parse(content.toString()))
  } catch (err) {
    console.error('Error loading client secret file', err)
    throw err
  }
}
