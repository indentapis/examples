# Google Groups + Indent Webhook

This guide will show you how to deploy a webhook for Indent to manage access to Google Groups using a Google Cloud Function.

### Requirements

- [Google Group](https://groups.google.com/my-groups)
- [Google Cloud Project](https://cloud.google.com/) with these APIs enabled:
  - [Google Cloud Functions API](https://cloud.google.com/functions)
  - [Google Cloud Build API](https://console.cloud.google.com/cloud-build)
  - [Google Cloud Identity API](https://console.cloud.google.com/apis/library/cloudidentity.googleapis.com)

### How To Use

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/change/terraform-gcloud-google-groups-webhook
cd terraform-gcloud-google-groups-webhook
```

Initialize the provider:

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
indent_webhook_secret = "wks0example-secret"

# Project - The GCloud project where you want to deploy this webhook
project = "my-project"

# Service Account - The GCloud service account with access to execute this Function and manage your Google Groups
service_account_email = "my-service-account@my-project.iam.gserviceaccount.com"
```

Save your [JSON Service Account Key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) to `terraform/secrets/terraform-deploy-key.json`

Once you've set up your [Google Cloud credentials](https://indent.com/docs/webhooks/deploy#deploying-on-google-cloud), either with `gcloud auth login` or using a service account key, build and deploy the function:

```bash
npm run deploy:all
```

### Deployment

Once you've set up your [Google Cloud credentials](https://indent.com/docs/webhooks/deploy#deploying-on-google-cloud), either with `gcloud auth login` or using a service account key, build and deploy the function to [Google Cloud Functions](https://console.cloud.google.com/functions) with [Terraform](https://terraform.io/):

```bash
npm run deploy:all
```

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Project.

### About Example

This is a simple example showing how to use [Google Cloud Functions](https://cloud.google.com/) to deploy an Indent webhook for managing access to Google Groups.
