import { generateKeyPair } from 'crypto' crypto from 'crypto'
import { write } from 'fs/promises'
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
    await write('keys.pem', `${privateKey}\n${publicKey}`)
    console.log(rsaPemToJwk(publicKey, privateKey, 'public'))
  } catch (err) {
    console.error('@indent/webhook.createAuthKeys(): failed')
    console.error(err)
  }
}

export const createJWKToken = async function () {}
