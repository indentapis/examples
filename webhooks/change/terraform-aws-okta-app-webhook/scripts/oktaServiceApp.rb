#/usr/bin/env ruby
require 'openssl'
require 'json/jwt'
rsa_private = OpenSSL::PKey::RSA.generate 2048
rsa_private.to_pem

puts rsa_private.public_key.to_jwk