# Terraform AWS + atSpoke Webhook

## How To Use

### Requirements

- [atSpoke Account](https://atspoke.com)
- [Terraform](https://terraform.io)
- [AWS CLI or ~/.aws/credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/change/terraform-aws-atspoke-webhook
cd terraform-aws-atspoke-webhook
```

Initialize the provider:

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
# Indent Space Name is used to link to the right space on Indent
indent_space_name = "my-space-123"
# atSpoke API Key is used to authorize requests to your atSpoke environment
atspoke_api_key = "AY_myapikey"
```

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [AWS Lambda](https://aws.amazon.com/lambda/).

This will take a few minutes to run the first time as Terraform sets up the resources in the AWS Account. You should see an output similar to below:

```bash
npm run deploy:all

# or if you want to manually review
npm run tf:plan
npm run tf:apply
```

**Expected Output**

```
> @indent/terraform-aws-atspoke-webhook@0.0.0 deploy:all  /Users/docs/dl/indent-js/examples/terraform-aws-atspoke-webhook
> npm install; npm run build; npm run tf:apply -auto-approve

audited 406 packages in 1.878s

4 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities


> @indent/terraform-aws-atspoke-webhook@0.0.0 build  /Users/docs/dl/indent-js/examples/terraform-aws-atspoke-webhook
> tsc


> @indent/terraform-aws-atspoke-webhook@0.0.0 tf:apply  /Users/docs/dl/indent-js/examples/terraform-aws-atspoke-webhook
> cd terraform; terraform apply -compact-warnings -var-file ./config/terraform.tfvars

data.archive_file.function_archive: Refreshing state...
data.aws_iam_policy_document.lambda_assume_role_document: Refreshing state...
data.aws_iam_policy_document.lambda_document: Refreshing state...

An execution plan has been generated and is shown below.
Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  <...terraformResources>

Plan: 14 to add, 0 to change, 0 to destroy.


Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

random_string.suffix: Creating...
random_string.suffix: Creation complete after 0s [id=sm85]
aws_iam_role.lambda_role: Creating...
aws_iam_policy.lambda_policy: Creating...
aws_api_gateway_rest_api.api_gateway_rest_api: Creating...
aws_lambda_layer_version.deps: Creating...
aws_api_gateway_rest_api.api_gateway_rest_api: Creation complete after 1s [id=92jf20fmw]
aws_api_gateway_resource.api_gateway: Creating...
aws_api_gateway_method.api_gateway_root_method: Creating...
aws_api_gateway_method.api_gateway_root_method: Creation complete after 0s [id=agm-92jf20fmw-gldokcr667-ANY]
aws_iam_role.lambda_role: Creation complete after 1s [id=indent-atspoke-webhook-sm85-role]
aws_api_gateway_resource.api_gateway: Creation complete after 0s [id=3rgb0h]
aws_api_gateway_method.api_gateway_method: Creating...
aws_iam_policy.lambda_policy: Creation complete after 1s [id=arn:aws:iam::283478849108:policy/terraform-20200701073232957200000001]
aws_iam_policy_attachment.lambda_attachment: Creating...
aws_api_gateway_method.api_gateway_method: Creation complete after 0s [id=agm-92jf20fmw-3rgb0h-ANY]
aws_iam_policy_attachment.lambda_attachment: Creation complete after 2s [id=indent-atspoke-webhook-sm85-attachment]
aws_lambda_layer_version.deps: Creation complete after 9s [id=arn:aws:lambda:us-west-2:283478849108:layer:dependency_layer:16]
aws_lambda_function.lambda: Creating...
aws_lambda_function.lambda: Creation complete after 10s [id=indent-atspoke-webhook-sm85]
aws_lambda_permission.lambda: Creating...
aws_api_gateway_integration.api_gateway_root_integration: Creating...
aws_api_gateway_integration.api_gateway_integration: Creating...
aws_lambda_permission.lambda: Creation complete after 0s [id=AllowAPIGatewayInvoke]
aws_api_gateway_integration.api_gateway_integration: Creation complete after 0s [id=agi-92jf20fmw-3rgb0h-ANY]
aws_api_gateway_integration.api_gateway_root_integration: Creation complete after 0s [id=agi-92jf20fmw-gldokcr667-ANY]
aws_api_gateway_deployment.api_gateway_deployment: Creating...
aws_api_gateway_deployment.api_gateway_deployment: Creation complete after 1s [id=dljg6b]

Apply complete! Resources: 14 added, 0 changed, 0 destroyed.

Outputs:

api_base_url = https://92jf20fmw.execute-api.us-west-2.amazonaws.com/dev
```

## About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can create requests in atSpoke.
