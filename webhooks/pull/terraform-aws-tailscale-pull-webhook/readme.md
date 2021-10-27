# Terraform AWS Tailscale Pull Webhook

## How To Use

### Requirements

- [AWS CLI or ~/.aws/credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- [Tailscale Tailnet](https://tailscale.com/kb/1017/install/)
- [Terraform](https://terraform.io)
  - Optional: [Terraform's guide to getting started with the AWS Provider](https://learn.hashicorp.com/collections/terraform/aws-get-started) documentation from HashiCorp.

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/pull/terraform-aws-tailscale-pull-webhook
cd terraform-aws-iam-pull-webhook
```

Initialize the provider:

```bash
npm run deploy:init # initializes terraform aws provider with ~/.aws/config
npm run deploy:prepare # builds AWS Lambda layers
```

Add the environment variables:

`mv terraform/config/example.tfvars terraform/config/terraform.tfvars`

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = ""

# Tailscale API Key - Create this in the admin console
tailscale_api_key = ""

# Tailnet - This is usually the email address you used to create your Tailscale account
tailscale_tailnet = ""
```

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [AWS Lambda](https://aws.amazon.com/lambda/).

This will take a few minutes to run the first time as Terraform sets up the resources in the AWS Account.

### About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can add or remove users from Tailscale ACL groups programatically.
