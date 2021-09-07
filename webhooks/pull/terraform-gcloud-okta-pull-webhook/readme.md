# Google Cloud + Okta Pull Webhook

### Requirements

- [Okta Account](https://okta.com)
  - One of these authentication methods:
    - [Okta API Token](https://help.okta.com/en/prod/Content/Topics/Security/API.htm?cshid=Security_API#)
    - [Okta OAuth 2.0 Service App](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/create-serviceapp-grantscopes/)
      - Service App requires the `okta.groups.manage` scope for all groups you want to manage with Indent.
      - Use the RSA Private Key you used when setting up your Service App.
- [Google Cloud Project](https://cloud.google.com/) with these APIs enabled:
  - [Google Cloud Functions API](https://cloud.google.com/functions)
  - [Google Cloud Build API](https://console.cloud.google.com/cloud-build)
  - Optional: [Terraform's Guide to getting started with the Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/getting_started)

### How To Use

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/pull/terraform-gcloud-okta-pull-webhook
cd terraform-gcloud-okta-pull-webhook
```

Initialize the provider:

```bash
npm run deploy:init # initializes terraform gcloud provider
```

Add the environment variables:

    **Note:** If you plan to use an Okta Service App for deployment, you do not need to include an Okta API token but you must include your Service App Client ID and your private RSA key so the webhook can create a signed Bearer token.

    If you plan to use an Okta API token you can leave the Okta Client ID and Okta Private Key variables empty

```bash
mv terraform/config/example.tfvars terraform/config/terraform.tfvars
```

`terraform/config/terraform.tfvars`

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0asdfghjklqwertyuiop"

# Project - The Google Cloud project you want to deploy this webhook to
project = "my-project-123"

# Okta Domain - This is your Okta URL
okta_domain = "my-domain.okta.com"

# Okta Token - Your Okta administration token
okta_token = "00qwertyuiopzxcvbnmasdfgh"

# Okta Client ID - The client ID for your Okta Service App
okta_client_id = "asdfghjklqwertyuiop"

# Okta Private Key - This is an RSA private key used to generate a signed Bearer token for OAuth 2.0 access
okta_private_key = <<EOT

EOT
```

Once you've set up your [Google Cloud credentials](https://indent.com/docs/webhooks/deploy#deploying-on-google-cloud), either with `gcloud auth login` or using a service account key, build and deploy the function:

```bash
npm run deploy:all
```

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [Google Cloud Functions](https://console.cloud.google.com/functions).

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Cloud Project.

### About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can pull resources from Okta into Indent programatically.
