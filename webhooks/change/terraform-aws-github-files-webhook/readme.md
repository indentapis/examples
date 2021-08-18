# Terraform AWS + Github ACL Files Webhook

## How To Use

### Requirements

- [GitHub Account](https://github.com)
  - [GitHub Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token)
  - The token should have access to the `repo` permissions on your account
- [AWS CLI or ~/.aws/credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- [Terraform](https://terraform.io)
  - Optional: Review [Get Started with AWS](https://learn.hashicorp.com/collections/terraform/aws-get-started) documentation from HashiCorp

### Create an Indent Resource for the ACL file

1. Sign into your [Indent Space](https://indent.com/spaces).
1. Go to your [Resources](https://indent.com/spaces?next=/manage/spaces/[space]/resources/new).
1. Click "New" and create a new Resource.

   - Under resource kind, type in "customApp.v1.Role"
   - Enter the name of your Resource
   - Enter the ID of your Resource

1. Add these required labels to your Resource

   - githubRepo: organization/repoName
   - githubPath: /repo/path/to/acl/file
   - role: name of the role to change

**Note:** You will need to create a separate Resource for each Role you plan to manage.

### Configure your ACL file

- The ACL file should have a commented section that looks like this

```bash
"app_roles" = {
  "admin" = [
    "engineer1@example.com",
    "engineer2@example.com",

    //indent:managed start admin
    //indent:managed end
  ]

  "engOnCall" = [
    "engineer2@example.com",

    //indent:managed start engOnCall
    //indent:managed end
  ]

  "superAdmin" = ["engineering@example.com"]
}
```

- The webhook can only make changes inside this section

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/change/terraform-github-file-webhook
cd terraform-github-file-webhook
```

Install the dependencies:

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

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [AWS Lambda](https://aws.amazon.com/lambda/).

This will take a few minutes to run the first time as Terraform sets up the resources in the AWS Account. You should see an output similar to below:

```bash
$ npm run deploy:all
```

## About Example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can change a file on GitHub programatically.
