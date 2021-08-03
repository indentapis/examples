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

Install the dependencies

```bash
npm run deploy:init # initializes terraform GCloud provider
```

**Note: If you are using an existing service account import the account at this step:**

```bash
terraform import <Google resource name> serviceaccount@domain.com
```

Add the environment variables

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

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [Google Cloud Functions](https://console.cloud.google.com/functions).

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Account. You should see an output similar to below:

```bash
$ npm install; npm run build; npm run bundle; npm run tf:apply -- -auto-approve

up to date, audited 212 packages in 648ms

14 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

> @indent/terraform-gcloud-google-groups-pull-webhook@0.0.0 build
> tsc


> @indent/terraform-gcloud-google-groups-pull-webhook@0.0.0 bundle
> ncc build lib/index.js -m -o dist

ncc: Version 0.29.0
ncc: Compiling file index.js into CJS
6276kB  dist/index.js
6276kB  [20299ms] - ncc 0.29.0

> @indent/terraform-gcloud-google-groups-pull-webhook@0.0.0 tf:apply
> cd terraform; terraform apply -compact-warnings -var-file ./config/terraform.tfvars "-auto-approve"

<...terraformResources>

Plan: 2 to add, 0 to change, 0 to destroy.
module.google-groups.google_cloudfunctions_function.deploy[0]: Creating...
module.google-groups.google_cloudfunctions_function.deploy[0]: Still creating... [10s elapsed]
module.google-groups.google_cloudfunctions_function.deploy[0]: Still creating... [20s elapsed]
module.google-groups.google_cloudfunctions_function.deploy[0]: Still creating... [30s elapsed]
module.google-groups.google_cloudfunctions_function.deploy[0]: Still creating... [40s elapsed]
module.google-groups.google_cloudfunctions_function.deploy[0]: Still creating... [50s elapsed]
module.google-groups.google_cloudfunctions_function.deploy[0]: Creation complete after 51s [id=projects/id-drop-weekly-zkodj/locations/us-central1/functions/indent-pull-google-groups]
module.google-groups.google_cloudfunctions_function_iam_member.invoker[0]: Creating...
module.google-groups.google_cloudfunctions_function_iam_member.invoker[0]: Creation complete after 4s [id=projects/id-drop-weekly-zkodj/locations/us-central1/functions/indent-pull-google-groups/roles/cloudfunctions.invoker/allUsers]

Warnings:

- Version constraints inside provider configuration blocks are deprecated
  on providers.tf line 2

To see the full warning notes, run Terraform without -compact-warnings.

Apply complete! Resources: 2 added, 0 changed, 0 destr
```
