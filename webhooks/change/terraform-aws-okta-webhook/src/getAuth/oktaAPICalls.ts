import axios, { AxiosPromise } from 'axios'
import { URLSearchParams } from 'url'
import * as dotenv from 'dotenv'

dotenv.config()

export const createOktaServiceApp = async function (): Promise<any> {
  const response = await axios({
    method: 'post',
    url: `https://${process.env.OKTA_DOMAIN}/oauth2/v1/clients`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `SSWS ${process.env.OKTA_TOKEN}`,
    },
    data: {
      client_name: 'idt-okta-serivce-app',
      response_types: ['token'],
      grant_types: ['client_credentials'],
      token_endpoint_auth_method: 'private_key_jwt',
      application_type: 'service',
      jwks: {
        keys: [
          {
            kty: 'RSA',
            e: 'AQAB',
            use: 'sig',
            kid: '100001',
            alg: 'RS256',
            n: 'qwertyuiop[]asdfghjkl;zxcvbnm,.', // should be a lot more bits than this
          },
        ],
      },
    },
  })

  return response.data
}

export const grantScopes =
  async function (): Promise<void | AxiosPromise<any>> {
    const data = await createOktaServiceApp
    console.log(data)
    return await axios({
      method: 'post',
      url: `https://${process.env.OKTA_DOMAIN}/api/v1/apps/${client_id}/grants`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `SSWS ${process.env.OKTA_TOKEN}`,
        'Cache-Control': 'no-cache',
      },
      data: {
        scopeId: 'okta.users.read',
        issuer: `https://${process.env.OKTA_DOMAIN}`,
      },
    })
  }

export const signOktaToken = async function () {
  const urlParams = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'okta.users.read',
    client_assertion_type:
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: `asdfghjklqwertyuiop`, // bearer token
  })

  return await axios({
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: urlParams,
  })
}
