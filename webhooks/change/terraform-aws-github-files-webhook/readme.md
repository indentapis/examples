# Terraform AWS + Github ACL Files Webhook

## How To Use

### Requirements

- [GitHub Account](https://github.com)
  - [GitHub Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the following scopes:
  - `repo`
- [AWS Account](https://aws.amazon.com)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- [Terraform](https://learn.hashicorp.com/collections/terraform/aws-get-started)
  - Optional: [Terraform's guide to working with the AWS Provider](https://learn.hashicorp.com/collections/terraform/aws-get-started).

### Create an Indent Resource for the ACL file

1. Sign into your [Indent Space](https://indent.com/spaces).
1. Go to your [Resources](https://indent.com/spaces?next=/manage/spaces/[space]/resources/new).
1. Click "New" and create a new Resource.
   - Under resource kind, type in "customApp.v1.Role"
   - Enter the name of your Custom App
   - Enter the ID of your Custom App
   - Add these labels to your resource:
     - `githubRepo` &mdash; path to the repo, e.g. `org/repo_name`
     - `githubPath` &mdash; path to the file, e.g. `conf/prod.conf`
     - `role` &mdash; Name of the role, e.g. `admin`

### Create the ACL file

Create an ACL file in the GitHub Repo you want Indent to manage. Include each role as an entry in the file. Note, Indent can only manage roles inside the comment blocks in your ACL file.

Example:

```bash
"app_roles" = {
  "admin" = [
    "engineer1@example.com",
    "engineer2@example.com",

    //indent:managed start admin
    //indent:managed end
  ]
}
```

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/change/terraform-aws-github-files-webhook
cd terraform-aws-github-files-webhook
```

Initialize the provider:

```bash
npm run deploy:init # initializes terraform aws provider with ~/.aws/config
npm run deploy:prepare # builds AWS Lambda layers
```

Add the environment variables:

```bash
mv terraform/config/example.tfvars terraform/config/terraform.tfvars
```

`terraform/config/terraform.tfvars`

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0example-secret"
# Github Token is used to authorize requests to your Github environment
github_token = "ghp_eXaMpLeGithubToKeN"
```

### Deployment

Build and deploy the webhook to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [AWS Lambda](https://aws.amazon.com/lambda/):

```bash
npm run deploy:all
```

This will take a few minutes to run the first time as Terraform sets up the resources in the AWS Account.

## About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can change a file on GitHub programatically.
