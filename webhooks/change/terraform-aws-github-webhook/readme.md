# Terraform AWS + GitHub Webhook

## How To Use

### Requirements

- [GitHub Account](https://github.com)
- [Terraform](https://terraform.io)
- [AWS CLI or ~/.aws/credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/change/terraform-aws-github-webhook
cd terraform-aws-github-webhook
```

Install the dependencies...

```bash
npm run deploy:init # initializes terraform aws provider with ~/.aws/config
npm run deploy:prepare # builds AWS Lambda layers
```

Add the environment variables...

```bash
mv terraform/config/example.tfvars terraform/config/terraform.tfvars
```

`terraform/config/terraform.tfvars`

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0example-secret"
# Github Token is used to authorize requests to your Github environment
github_token = "eXaMpLeGithubToKeN"
```

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [AWS Lambda](https://aws.amazon.com/lambda/).

This will take a few minutes to run the first time as Terraform sets up the resources in the AWS Account. You should see an output similar to below:

```bash
$ npm run deploy:all
```

## About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can add or remove users from GitHub teams programatically.
