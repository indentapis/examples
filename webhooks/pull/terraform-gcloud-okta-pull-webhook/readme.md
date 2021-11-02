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

Add the environment variables then choose an authentication method:

```bash
mv terraform/config/example.tfvars terraform/config/terraform.tfvars
```

#### Authenticating to Okta

You have two choices to authenticate this webhook with Okta:

<details><summary>Option 1: Okta Admin API Token</summary>
<p>

- [Create an Okta Admin API Token](https://indent.com/docs/integrations/okta#option-1-account-with-api-token)
- Set this variable in `terraform.tfvars`:

```hcl
okta_token = "0Oabcdefghijklmnopqrs"
```

- Your final environment variable configuration should look like this:

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0qwertyuiopzxcvbnm"
# Project - The Google Cloud project you want to deploy this webhook to
project = "my-project-123"
# Okta Domain - This is your Okta URL
okta_domain = "example.okta.com"
# Okta Token - Your Okta administration token
okta_token = "0Oabcdefghijklmnopqrs"
```

</p>
</details>

<details><summary>Option 2: Okta Service App</summary>
<p>

- [Create an Okta Service App with API Scopes](https://indent.com/docs/integrations/okta#option-2-service-app-with-api-scopes)
- Set these environment variables in `terraform.tfvars`

```hcl
# Okta Client ID - The client ID for your Okta Service App
okta_client_id = "0oasdfghjklqwertyuiop"
# Okta Private Key - This is an RSA private key used to generate a signed Bearer token for OAuth 2.0 access
okta_private_key = <<EOT
----BEGIN RSA PUBLIC KEY-----
asdfghjklzxcvbnmqwertyuiopzxcvbnm,./asdfghj
kl;'qwertyuiop[]asdfghjklzxcvbnmqwertyuiopz
xcvbnm,./asdfghjkl;'qwertyuiop[]asdfghjklzx
cvbnmqwertyuiopzxcvbnm,./asdfghjkl;'qwertyu
iop[]asdfghjklzxcvbnmqwertyuiopzxcvbnm,./as
dfghjkl;'qwertyuiop[]asdfghjklzxcvbnmqwerty
uiopzxcvbnm,./asdfghjkl;'qwertyuiop[]asdfgh
jklzxcvbnmqwertyuiopzxcvbnm,./asdfghjkl;'qw
ertyuiop[]asdfghjklzxcvbnmqwertyuiopzxcvbnm
,./asdfghjkl;'qwertyuiop[]asdfghjklzxcvbnmq
wertyuiopzxcvbnm,./asdfghjkl;'qwertyuiop[]a
sdfghjklzxcvbnmqwertyuiopzxcvbnm,./asdfghjk
l;'qwertyuio[]asdfghjklzxcvbnmqwertyuiopzxc
vbnm,./asdfghjkl;'qwertyuiop[bcdefghijklmno
----END RSA PUBLIC KEY------
EOT
```

- Your final environment variable configuration should look like this:

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0abcdefghijklmnopqrstuv"
# Project - The Google Cloud project you want to deploy this webhook to
project = "my-project-123"
# Okta Domain - This is your Okta URL
okta_domain = "example.okta.com"
# Okta Client ID - The client ID for your Okta Service App
okta_client_id = "0oasdfghjklqwertyuiop"
# Okta Private Key - This is an RSA private key used to generate a signed Bearer token for OAuth 2.0 access
okta_private_key = <<EOT
----BEGIN RSA PUBLIC KEY-----
asdfghjklzxcvbnmqwertyuiopzxcvbnm,./asdfghj
kl;'qwertyuiop[]asdfghjklzxcvbnmqwertyuiopz
xcvbnm,./asdfghjkl;'qwertyuiop[]asdfghjklzx
cvbnmqwertyuiopzxcvbnm,./asdfghjkl;'qwertyu
iop[]asdfghjklzxcvbnmqwertyuiopzxcvbnm,./as
dfghjkl;'qwertyuiop[]asdfghjklzxcvbnmqwerty
uiopzxcvbnm,./asdfghjkl;'qwertyuiop[]asdfgh
jklzxcvbnmqwertyuiopzxcvbnm,./asdfghjkl;'qw
ertyuiop[]asdfghjklzxcvbnmqwertyuiopzxcvbnm
,./asdfghjkl;'qwertyuiop[]asdfghjklzxcvbnmq
wertyuiopzxcvbnm,./asdfghjkl;'qwertyuiop[]a
sdfghjklzxcvbnmqwertyuiopzxcvbnm,./asdfghjk
l;'qwertyuio[]asdfghjklzxcvbnmqwertyuiopzxc
vbnm,./asdfghjkl;'qwertyuiop[bcdefghijklmno
----END RSA PUBLIC KEY------
EOT
```

</p>
</details>

Add all the remaining environment variables:

`terraform/config/terraform.tfvars`

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0abcdefghijklmnopqrstuv"
# Project - The Google Cloud project you want to deploy this webhook to
project = "my-project-123"
# Okta Domain - This is your Okta URL
okta_domain = "example.okta.com"
```

Once you've set up your [Google Cloud credentials](https://indent.com/docs/webhooks/deploy#deploying-on-google-cloud), either with `gcloud auth login` or using a service account key, build and deploy the function:

```bash
npm run deploy:all
```

### Deployment

Build and deploy the function to Google Cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [Google Cloud Functions](https://console.cloud.google.com/functions):

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Cloud Project.

### About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can pull resources from Okta into Indent programatically.
