# Google Cloud + GitHub Teams Webhook

This guide will show you how to deploy a webhook for Indent to manage access to GitHub Teams using Google Cloud Functions.

### Requirements

- [GitHub account](https://github.com/)
  - [GitHub Organization](https://github.com/account/organizations) with at least one team
  - [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the following scopes:
    - `admin:org`
- [Google Cloud Project](https://cloud.google.com/) with these APIs enabled:
  - [Google Cloud Functions API](https://cloud.google.com/functions)
  - [Google Cloud Build API](https://console.cloud.google.com/cloud-build)

### How To Use

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/change/terraform-gcloud-github-teams-webhook
cd terraform-gcloud-github-teams-webhook
```

Initialize the provider:

```bash
npm run deploy:init
```

Add the environment variables:

```bash
mv terraform/config/example.tfvars terraform/config/terraform.tfvars
```

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0asdfghjkliqwertyuiop"

# GitHub Personal Access Token
github_token = "ghp_asdfghjklqwertyuiop"

# Name of the project to deploy
project = "my-project-123"
```

### Deployment

Once you've set up your [Google Cloud credentials](https://indent.com/docs/webhooks/deploy#deploying-on-google-cloud), either with `gcloud auth login` or using a service account key, build and deploy the function to [Google Cloud Functions](https://console.cloud.google.com/functions) with [Terraform](https://terraform.io/):

```bash
npm run deploy:all
```

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Cloud Project.

### About Example

This is a simple example showing how to use [Google Cloud Functions](https://cloud.google.com/) to deploy an Indent webhook for managing access in GitHub Teams.
