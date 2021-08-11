import axios from 'axios'

const oktaServiceRequest = {
  client_name: 'idt-okta-service-app',
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
        kid: `${process.env.KEY_ID}`,
        n: `${process.env.KEY}`,
      },
    ],
  },
}

const createApp = async function () {
  try {
    return await axios({
      method: 'post',
      url: `${process.env.OKTA_DOMAIN}/oauth2/v1/clients`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `SSWS ${process.env.OKTA_TOKEN}`,
      },
      data: JSON.stringify(oktaServiceRequest),
    }).then((data) => console.log(data))
  } catch (err) {
    console.error(err)
  }
}

createApp()
