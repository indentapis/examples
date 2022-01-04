# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = ""

# Okta Domain - This is your Okta URL
okta_domain = ""

# Okta Token - Your Okta administration token
okta_token = ""

## Note: If you plan to use an Okta Service App for deployment, you do not need to include an Okta API token but you must include your Service App Client ID and your private RSA key so the webhook can create a signed Bearer token.

# Okta Client ID - The client ID for your Okta Service App
okta_client_id = ""

# Okta Private Key - This is an RSA private key used to generate a signed Bearer token for OAuth 2.0 access
okta_private_key = <<EOT

EOT

# Okta Profile Resource Kind - the kind of Indent Resource that uses a custom Okta User Profile Attribute
okta_profile_resource_kind = "ProfileAttribute"

# Okta Profile Custom Attribute - the label for the name of your custom profile attribute
okta_profile_attribute = "okta/userProfileAttribute/id"

# Okta Profile Custom Attribute Value - the label for the value of your custom profile attribute
okta_profile_attribute_value = "okta/userProfileAttribute/value"

# Toggle whether to use an AWS API Key with the API Gateway for this webhook
# When you update your Indent Space, set an additional header
# "x-api-key" = abcdefghjilkmnop
create_api_key = false
