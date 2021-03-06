# Terraform AWS IAM Pull Webhook

## How To Use

### Requirements

- [AWS CLI or ~/.aws/credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- [Terraform](https://terraform.io)
  - Optional: [Terraform's guide to getting started with the AWS Provider](https://learn.hashicorp.com/collections/terraform/aws-get-started) documentation from HashiCorp.

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/pull/terraform-aws-iam-pull-webhook
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
```

### Deployment

Build and deploy the webhook to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [AWS Lambda](https://aws.amazon.com/lambda/):

```bash
npm run deploy:all
```

This will take a few minutes to run the first time as Terraform sets up the resources in the AWS Account.

### About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can add or remove users from AWS IAM Groups programatically.
