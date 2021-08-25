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
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=2 examples-main/webhooks/change/terraform-gcloud-google-groups-webhook
cd terraform-gcloud-google-groups-webhook
```

Install the dependencies:

```bash
npm run deploy:init # initializes terraform GCloud provider
```

**Note: If you are using an existing service account import the account at this step:**

```bash
terraform import <Google resource name> serviceaccount@domain.com
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

# Project name
project = "my-project"
```

Save your JSON Service Account Key to `terraform/secrets/terraform-deploy-key.json`

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [Google Cloud Functions](https://console.cloud.google.com/functions).

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Account.

### About example

This is a simple example showing how to use [Terraform](https://terraform.io) to deploy a function that can pull Google Groups programatically.

