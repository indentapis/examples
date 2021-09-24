# Google Groups + Indent Pull Webhook

This guide will show you how to deploy a webhook for Indent to pull resources from Google Groups using a Google Cloud Function.

### Requirements

- [Google Group](https://groups.google.com/my-groups)
- [Google Cloud Project](https://cloud.google.com/) with these APIs enabled:
  - [Google Cloud Functions API](https://cloud.google.com/functions)
  - [Google Cloud Build API](https://console.cloud.google.com/cloud-build)
  - [Google Cloud Identity API](https://console.cloud.google.com/apis/library/cloudidentity.googleapis.com)

### How To Use

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/pull/terraform-gcloud-google-groups-pull-webhook
cd terraform-gcloud-google-groups-pull-webhook
```

Initialize the provider

```bash
npm run deploy:init # initializes terraform GCloud provider
```

**Note: If you are using an existing service account import the account at this step:**

```bash
terraform import <Google resource name> my-service-account@my-project.iam.gserviceaccount.com
```

Add the environment variables:

```bash
mv terraform/config/example.tfvars terraform/config/terraform.tfvars
```

`terraform/config/terraform.tfvars`

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0asdfghjkliqwertyuiop"

# Google Customer ID
google_customer_id = "C0qwertyui"

# Project name - The name of your Google Cloud Project
project = "my-project"

# Service Account - The GCloud service account with access to execute this Function and manage your Google Groups
service_account_email = "my-service-account@my-project.iam.gserviceaccount.com"
```

Save your JSON Service Account Key to `terraform/secrets/terraform-deploy-key.json`

Once you've set up your [Google Cloud credentials](https://indent.com/docs/webhooks/deploy#deploying-on-google-cloud), either with `gcloud auth login` or using a service account key, build and deploy the function:

```bash
npm run deploy:all
```

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [Google Cloud Functions](https://console.cloud.google.com/functions).

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Account.

### About example

[Google Cloud Functions](https://cloud.google.com/) to deploy an Indent Webhook to pull Google Groups programatically.
