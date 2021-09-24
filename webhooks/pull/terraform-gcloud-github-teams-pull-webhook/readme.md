# Google Cloud + GitHub Teams Webhook

## How To Use

### Requirements

- [GitHub account](https://github.com/)
  - [GitHub Organization](https://github.com/account/organizations) with at least one team
  - [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the following scopes:
    - `admin:org` _Recommended scope_
    - `read:org` _Minimum scope to use this webhook. You will only be able to pull updates, you will not be able to make any changes with Indent's [GitHub Teams Change Webhook](https://github.com/indentapis/examples/tree/ID-903/webhooks/change/terraform-gcloud-github-teams-webhook)_
- [Google Cloud Project](https://cloud.google.com/) with these APIs enabled:
  - [Google Cloud Functions API](https://cloud.google.com/functions)
  - [Google Cloud Build API](https://console.cloud.google.com/cloud-build)
- [Terraform](https://terraform.io)
  - Optional: [Terraform's guide to working with the Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/getting_started).

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/pull/terraform-gcloud-github-teams-pull-webhook \
cd terraform-gcloud-github-teams-pull-webhook
```

Initialize the provider:

**NPM**

```bash
npm run deploy:init
```

**Yarn**

```bash
yarn deploy:init
```

Add the environment variables:

```bash
mv terraform/config/example.tfvars terraform/config/terraform.tfvars
```

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = ""

# GitHub Personal Access Token
github_token = ""

# GitHub Organization - The organization you want to get teams from
github_org = ""

# Project - Google Cloud Project the webhook will be deployed to
project = ""
```

Once you've set up your [Google Cloud credentials](https://indent.com/docs/webhooks/deploy#deploying-on-google-cloud), either with `gcloud auth login` or using a service account key, build and deploy the function:

```bash
npm run deploy:all
```

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [Google Cloud Functions](https://console.cloud.google.com/functions). This will take a few minutes to run the first time as Terraform sets up the resources in the Google Account.

### About example

This is a simple example showing how to use [Google Cloud Functions](https://cloud.google.com/) to deploy an Indent Webhook.
