import { generateKeyPair, constants } from 'crypto'
import * as fs from 'fs/promises'
import { promisify } from 'util'
import { Jwt, create } from 'njwt'
import rsaPemToJwk from '../util/rsaPemToJwk'

const generateKeys = promisify(generateKeyPair)

const keyOptions = {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: '',
  },
}

export const createAuthKeys = async function () {
  const { publicKey, privateKey } = await generateKeys('rsa', keyOptions)
  try {
    await fs.write('keys.pem', `${privateKey}\n${publicKey}`)
    console.log(rsaPemToJwk(publicKey, privateKey, 'public'))
    return rsaPemToJwk(publicKey, privateKey, 'public')
  } catch (err) {
    console.error('@indent/webhook.createAuthKeys(): failed')
    console.error(err)
  }
}

export const createOktaJWT = async function () {
  const claims = {
    iss: `${process.env.CLIENT_ID}`,
    sub: `${process.env.CLIENT_ID}`,
    aud: `https://${process.env.OKTA_DOMAIN}/oauth2/v1/token`,
  }

  const signingKey = {
    key: await fs.readFile('keys.pem', 'utf-8'),
    passphrase: '',
    padding: constants.RSA_PKCS1_PADDING,
  }

  const jwt: Jwt = create(claims, signingKey)
  console.log(jwt.compact())
  return jwt.compact()
}
