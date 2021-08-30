# Terraform AWS + Okta Profile Webhook

## How To Use

### Requirements

- [Okta Account](https://okta.com)
  - One of these authentication methods:
    - An [Okta API Token](https://help.okta.com/en/prod/Content/Topics/Security/API.htm?cshid=Security_API#)
    - [Okta OAuth 2.0 Service App](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/create-serviceapp-grantscopes/)
      - Service App requires the `okta.users.manage` scope for all groups you want to manage with Indent.
      - Use the RSA Private Key you used when setting up your Service App.
- [AWS CLI or ~/.aws/credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- [Terraform](https://terraform.io)
  - Optional: Review [Get Started with AWS](https://learn.hashicorp.com/collections/terraform/aws-get-started) documentation from HashiCorp.

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/change/terraform-aws-okta-profile-webhook
cd terraform-aws-okta-profile-webhook
```

Install the dependencies:

```bash
npm run deploy:init # initializes terraform aws provider with ~/.aws/config
npm run deploy:prepare # builds AWS Lambda layers
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
indent_webhook_secret = "wks0example-secret"
# Okta Tenant is used to route requests to your Okta environment
okta_domain = "example.okta.com"
# Okta Token is used to authorize requests to your Okta environment
okta_token = "eXaMpLeOkTaToKeN"
# Okta Client ID - The client ID for your Okta Service App
okta_client_id = ""
# Okta Private Key = This is an RSA private key used to generate a signed Bearer token for OAuth 2.0 access
okta_private_key = <<EOT

EOT
```

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [AWS Lambda](https://aws.amazon.com/lambda/).

This will take a few minutes to run the first time as Terraform sets up the resources in the AWS Account.

## About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can add or remove users from Okta Groups programatically.
