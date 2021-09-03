# Terraform Google Groups Pull Webhook

## How to Use

### Requirements

- [Google Group](https://groups.google.com/my-groups)
- [Google Cloud SDK CLI](https://cloud.google.com/sdk/docs/install)
- [Google Cloud Identity API](https://console.cloud.google.com/apis/library/cloudidentity.googleapis.com)
- [Terraform](https://terraform.io)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/pull/terraform-gcloud-google-groups-pull-webhook
cd terraform-gcloud-google-groups-pull-webhook
```

Install the dependencies:

```bash
npm run deploy:init # initializes terraform GCloud provider
```

**Note: If you are using an existing service account import the account at this step:**

```bash
terraform import <Google resource name> my-service-accountt@my-project.iam.gserviceaccount.com
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

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [Google Cloud Functions](https://console.cloud.google.com/functions).

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Account.

### About example

[Google Cloud Functions](https://cloud.google.com/) to deploy an Indent Webhook to pull Google Groups programatically.
