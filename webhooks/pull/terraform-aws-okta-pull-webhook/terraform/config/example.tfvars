# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = ""

# Okta Domain - This is your Okta URL
okta_domain = ""

# Okta Token - Your Okta administration token
okta_token = ""

# Okta Slack App ID - Your Slack App ID if you use Slack with Okta
okta_slack_app_id = ""

## Note: If you plan to use an Okta Service App for deployment, you do not need to include an Okta API token but you must include your Service App Client ID and your private RSA key so the webhook can create a signed Bearer token.

# Okta Client ID (Optional) - The client ID for your Okta Service App
okta_client_id = ""

# Okta Private Key (Optional) - This is an RSA private key used to generate a signed Bearer token for OAuth 2.0 access
okta_private_key = <<EOT
EOT