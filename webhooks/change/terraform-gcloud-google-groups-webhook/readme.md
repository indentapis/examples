# Terraform Google Groups Change Webhook

## How to Use

### Requirements

- [Google Group](https://groups.google.com/my-groups) whose access you want to manage
- [Google Cloud SDK CLI](https://cloud.google.com/sdk/docs/install)
- [Google Cloud Service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts)
  - You will also need a JSON [Service Account Key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
  - The new account should have the [Group Admin Role](https://cloud.google.com/iam/docs/understanding-roles#service-accounts-roles)
  - The account should be a Group Owner in Google Groups
- Enable [Google Cloud Identity API](https://console.cloud.google.com/apis/library/cloudidentity.googleapis.com)
- [Google Cloud Customer ID](https://support.google.com/a/answer/10070793?hl=en)
- [Terraform](https://terraform.io)
  - Optional: Review [Terraform's guide to working with the Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/getting_started)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=2 examples-main/webhooks/change/terraform-gcloud-google-groups-pull-webhook
cd terraform-gcloud-google-groups-pull-webhook
```

Install the dependencies:

**NPM**

```bash
npm run deploy:init # initializes Terraform GCloud provider
```

**Yarn**

```bash
yarn deploy:init
```

**Note: If you are using an existing service account you must import the account at this step:**

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

# The project name for your deployment
project = "my-example-project"

# The region for your deployment
region = "us-central1"
```

Add the Service Account Key at `terrafomr/secrets/terraform-deploy-key.json`

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [Google Cloud Functions](https://console.cloud.google.com/functions).

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Account. You should see an output similar to below:

```bash
$ npm run deploy:all

> terraform-gcloud-google-groups-webhook@1.0.0 deploy:all
> npm install; npm run build; npm run tf:apply -auto-approve


up to date, audited 225 packages in 799ms

14 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

> terraform-gcloud-google-groups-webhook@1.0.0 build
> tsc

> terraform-gcloud-google-groups-webhook@1.0.0 tf:apply
> cd terraform; terraform apply -compact-warnings -var-file ./config/terraform.tfvars

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

 <...terraformResources>

Plan: 5 to add, 0 to change, 0 to destroy.

Warnings:

- Version constraints inside provider configuration blocks are deprecated
  on providers.tf line 2

To see the full warning notes, run Terraform without -compact-warnings.

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

module.google-groups.google_service_account.runtime_account[0]: Creating...
google_storage_bucket.function_bucket: Creating...
```
