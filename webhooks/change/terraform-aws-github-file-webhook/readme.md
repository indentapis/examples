# Terraform AWS + GitHub Webhook

## How To Use

### Requirements

- [GitHub Account](https://github.com)
- [GitHub Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Terraform](https://terraform.io)
- [AWS CLI or ~/.aws/credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/change/terraform-aws-github-file-webhook
cd terraform-aws-github-webhook
```

Install the dependencies

```bash
npm run deploy:init # initializes terraform aws provider with ~/.aws/config
npm run deploy:prepare # builds AWS Lambda layers
```

Create a [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token) for your webhook. It needs `repo` permissions in order to work with Indent.

Add the environment variables, your Indent webhook secret and your new Personal Access Token

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
$ npm run deploy:all # Builds Node.js package
yarn run v1.22.10
$ npm install; npm run build; npm run tf:apply -auto-approve

up to date, audited 440 packages in 939ms

8 packages are looking for funding
  run `npm fund` for details

5 moderate severity vulnerabilities

To address all issues, run:
  npm audit fix

Run `npm audit` for details.

> @indent/terraform-aws-github-file-webhook@0.0.0 build
> tsc


> @indent/terraform-aws-github-file-webhook@0.0.0 tf:apply
> cd terraform; terraform apply -compact-warnings -var-file ./config/terraform.tfvars

random_string.suffix: Refreshing state... [id=ufyr]
aws_lambda_layer_version.deps: Refreshing state... [id=arn:aws:lambda:us-west-2:123456789012:layer:indent-aws-github-webhook-ufyr-dependency_layer:1]
aws_api_gateway_rest_api.api_gateway_rest_api: Refreshing state... [id=7zupv2eo6k]
aws_iam_role.lambda_role: Refreshing state... [id=indent-aws-github-webhook-ufyr-role]
aws_iam_policy.lambda_policy: Refreshing state... [id=arn:aws:iam::123456789012:policy/terraform-20210728190617305000000001]
aws_api_gateway_method.api_gateway_root_method: Refreshing state... [id=agm-7zupv2eo6k-adltrjpvd1-ANY]
aws_api_gateway_resource.api_gateway: Refreshing state... [id=71rpp7]
aws_iam_policy_attachment.lambda_attachment: Refreshing state... [id=indent-aws-github-webhook-ufyr-attachment]
aws_lambda_function.lambda: Refreshing state... [id=indent-aws-github-webhook-ufyr]
aws_api_gateway_method.api_gateway_method: Refreshing state... [id=agm-7zupv2eo6k-71rpp7-ANY]
aws_lambda_permission.lambda: Refreshing state... [id=AllowAPIGatewayInvoke]
aws_api_gateway_integration.api_gateway_root_integration: Refreshing state... [id=agi-7zupv2eo6k-adltrjpvd1-ANY]
aws_api_gateway_integration.api_gateway_integration: Refreshing state... [id=agi-7zupv2eo6k-71rpp7-ANY]
aws_api_gateway_deployment.api_gateway_deployment: Refreshing state... [id=t9wx9t]

<...terraformResources>

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

aws_iam_policy_attachment.lambda_attachment: Destroying... [id=indent-aws-github-webhook-ufyr-attachment]
aws_lambda_layer_version.deps: Destroying... [id=arn:aws:lambda:us-west-2:123456789012:layer:indent-aws-github-webhook-ufyr-dependency_layer:1]
aws_iam_policy_attachment.lambda_attachment: Destruction complete after 1s
aws_iam_role.lambda_role: Destroying... [id=indent-aws-github-webhook-ufyr-role]
aws_iam_policy.lambda_policy: Modifying... [id=arn:aws:iam::123456789012:policy/terraform-20210728190617305000000001]
aws_lambda_layer_version.deps: Destruction complete after 1s
aws_lambda_layer_version.deps: Creating...
aws_iam_policy.lambda_policy: Modifications complete after 2s [id=arn:aws:iam::123456789012:policy/terraform-20210728190617305000000001]
aws_iam_role.lambda_role: Destruction complete after 2s
aws_iam_role.lambda_role: Creating...
aws_iam_role.lambda_role: Creation complete after 1s [id=indent-aws-github-file-webhook-ufyr-role]
aws_iam_policy_attachment.lambda_attachment: Creating...
aws_iam_policy_attachment.lambda_attachment: Creation complete after 1s [id=indent-aws-github-file-webhook-ufyr-attachment]
aws_lambda_layer_version.deps: Still creating... [10s elapsed]
aws_lambda_layer_version.deps: Creation complete after 11s [id=arn:aws:lambda:us-west-2:123456789012:layer:indent-aws-github-file-webhook-ufyr-dependency_layer:1]
aws_lambda_function.lambda: Creating...
aws_lambda_function.lambda: Creation complete after 9s [id=indent-aws-github-file-webhook-ufyr]
aws_lambda_permission.lambda: Creating...
aws_api_gateway_integration.api_gateway_integration: Modifying... [id=agi-7zupv2eo6k-71rpp7-ANY]
aws_api_gateway_integration.api_gateway_root_integration: Modifying... [id=agi-7zupv2eo6k-adltrjpvd1-ANY]
aws_lambda_permission.lambda: Creation complete after 1s [id=AllowAPIGatewayInvoke]
aws_api_gateway_integration.api_gateway_integration: Modifications complete after 6s [id=agi-7zupv2eo6k-71rpp7-ANY]
aws_api_gateway_integration.api_gateway_root_integration: Modifications complete after 6s [id=agi-7zupv2eo6k-adltrjpvd1-ANY]

Apply complete! Resources: 5 added, 3 changed, 3 destroyed.

Outputs:

api_base_url = "https://abcdefghi.execute-api.aws-region-1.amazonaws.com/dev"
✨  Done in 121.91s.

```

## About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can add or remove users from GitHub teams programatically.
