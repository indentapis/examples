# Terraform AWS + Okta Profile Webhook

## How To Use

### Requirements

- [Okta Account](https://okta.com)
  - [Okta API Token](https://help.okta.com/en/prod/Content/Topics/Security/API.htm?cshid=Security_API#)
  - [Okta OAuth 2.0 Service App](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/create-serviceapp-grantscopes/) with the following scopes:
    - `okta.users.manage`
    - Use the RSA Private Key you used when setting up your Service App.
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- [Terraform](https://terraform.io)
  - [Terraform's guide to getting started with AWS](https://learn.hashicorp.com/collections/terraform/aws-get-started)

### How to use

#### Import profile attributes manually

1. Sign in to your [Indent Space](https://indent.com/spaces).
1. Go to your [Resources](https://indent.com/spaces?next=/manage/spaces/[space]/resources/new).
1. Click "New" and create a new Resource.
   - Under resource kind, type in the kind you want to use, e.g. `example.v1.Customer`
   - Enter the name of your Profile Attribute
   - Enter the ID of your Profile Attribute
   - Add these labels to your resource:
     - `okta/userProfileAttribute/id` &mdash; name of the custom Okta User Profile Attribute, e.g. `assigned_customers`
     - `okta/userProfileAttribute/value` &mdash; value of the custom Okta User Profile Attribute, e.g. `cust_123`
1. Note down these values for use with the deployment steps.

If you have a lot of custom profile attributes, you can [create a list of resources](https://indent.com/manage/spaces?next=/manage/spaces/[space]/resources/bulk?action=import) and upload them in bulk.

#### Deploy the change webhook

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/change/terraform-aws-okta-profile-webhook
cd terraform-aws-okta-profile-webhook
```

Initialize the provider:

```bash
npm run deploy:init # initializes terraform aws provider with ~/.aws/config
npm run deploy:prepare # builds AWS Lambda layers
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
# Okta Domain - This is your Okta URL
okta_domain = "example.okta.com"
# Okta Token - Your Okta administration token
okta_token = "0Oabcdefghijklmnopqrs"

# Okta Profile Resource Kind - the kind of Indent Resource that uses a custom Okta User Profile Attribute
okta_profile_resource_kind = "example.v1.Customer"
# Okta Profile Custom Attribute - the label for the name of your custom profile attribute
okta_profile_attribute = "okta/userProfileAttribute/id"
# Okta Profile Custom Attribute Value - the label for the value of your custom profile attribute
okta_profile_attribute_value = "okta/userProfileAttribute/value"
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
indent_webhook_secret = "wks0asdfghjklqwertyuiop"
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

# Okta Profile Resource Kind - the kind of Indent Resource that uses a custom Okta User Profile Attribute
okta_profile_resource_kind = "example.v1.Customer"
# Okta Profile Custom Attribute - the label for the name of your custom profile attribute
okta_profile_attribute = "okta/userProfileAttribute/id"
# Okta Profile Custom Attribute Value - the label for the value of your custom profile attribute
okta_profile_attribute_value = "okta/userProfileAttribute/value"
```

</p>
</details>

Add all the remaining environment variables:

`terraform/config/terraform.tfvars`

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0asdfghjklqwertyuiop"
# Okta Domain - This is your Okta URL
okta_domain = "example.okta.com"

# Okta Profile Resource Kind - the kind of Indent Resource that uses a custom Okta User Profile Attribute
okta_profile_resource_kind = "example.v1.Customer"
# Okta Profile Custom Attribute - the label for the name of your custom profile attribute
okta_profile_attribute = "okta/userProfileAttribute/id"
# Okta Profile Custom Attribute Value - the label for the value of your custom profile attribute
okta_profile_attribute_value = "okta/userProfileAttribute/value"
```

### Deployment

Build and deploy the webhook to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [AWS Lambda](https://aws.amazon.com/lambda/):

```bash
npm run deploy:all
```

This will take a few minutes to run the first time as Terraform sets up the resources in the AWS Account.

### About Example

This is a simple example showing how to use [AWS Lambda](https://console.aws.amazon.com/lambda/home?=/functions) to deploy an Indent webhook for managing access to custom Okta Profile Attributes.
