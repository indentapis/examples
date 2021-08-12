# Google Cloud + GitHub Teams Webhook

## How To Use

### Requirements

- A [GitHub account](https://github.com/signup?ref_cta=Sign+up&ref_loc=header+logged+out&ref_page=%2F&source=header-home)
- A [GitHub Organization](https://github.com/account/organizations/new)
- At least one GitHub Team within your organization
- [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Google Cloud SDK CLI](https://cloud.google.com/sdk/gcloud)
- [Google Cloud Service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts)
  - You will also need a JSON [Service Account Key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
  - The account needs to have permissions to create Cloud Functions
  - The Personal Access Token should have access to the `admin:org` permissions in order to make changes to GitHub Teams
- Enable the required Google APIs:
  - [Google Cloud Functions API](https://cloud.google.com/functions)
  - [Google Cloud Build API](https://console.cloud.google.com/cloud-build)
- [Terraform](https://terraform.io)
  - Optional: Review [Terraform's guide to working with the Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/getting_started)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/terraform-gcloud-github-teams
cd terraform-gcloud-github-teams
```

Install the dependencies:

**NPM**

```bash
npm run deploy:init
```

**Yarn**

```bash
yarn deploy:init
```

**Note: If you are using an existing service account at runtime you must import the account at this step:**

```bash
terraform import <Google resource name> serviceaccount@domain.com
```

Add the environment variables:

```bash
mv terraform/config/example.tfvars terraform/config/terraform.tfvars
```

```hcl
# Indent Webhook Secret is used to verify messages from Indent
indent_webhook_secret = "wks0asdfghjkliqwertyuiop"

# GitHub Username
github_username = "random123"

# GitHub Personal Access Token
github_token = "ghp_asdfghjklqwertyuiop"
```

### Deployment

Deploy it to the cloud with [Terraform](https://terraform.io) ([Documentation](https://terraform.io/docs/)) and [Google Cloud Functions](https://console.cloud.google.com/functions).

This will take a few minutes to run the first time as Terraform sets up the resources in the Google Account. You should see an output similar to below:

```bash
$ npm install; npm run build; npm run bundle; npm run tf:apply -auto-approve

up to date, audited 114 packages in 596ms

6 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

> @indent/gcloud-github-webhook@0.0.0 build
> tsc


> @indent/gcloud-github-webhook@0.0.0 bundle
> ncc build lib/index.js -m -o dist

ncc: Version 0.24.1
ncc: Compiling file index.js
107kB  dist/index.js
107kB  [1119ms] - ncc 0.24.1

> @indent/gcloud-github-webhook@0.0.0 tf:apply
> cd terraform; terraform apply -compact-warnings -var-file ./config/terraform.tfvars

google_storage_bucket.function_bucket: Refreshing state... [id=indent-gcloud-groups-webhooks]
module.google-groups.google_service_account.runtime_account[0]: Refreshing state... [id=projects/my-gcp-example-project/serviceAccounts/indent-gcloud-github-teams@my-gcp-example-project.iam.gserviceaccount.com]
module.google-groups.google_storage_bucket_object.uploaded_source: Refreshing state... [id=indent-gcloud-groups-webhooks-indent-gcloud-github-teams/wNlY1DIsZW6NXuGlkOZL+UNW+CYQ+zSD/Weyiy/jG6U=.zip]
module.google-groups.google_cloudfunctions_function.deploy[0]: Refreshing state... [id=projects/my-gcp-example-project/locations/us-central1/functions/indent-gcloud-github-teams]
module.google-groups.google_cloudfunctions_function_iam_member.invoker[0]: Refreshing state... [id=projects/my-gcp-example-project/locations/us-central1/functions/indent-gcloud-github-teams/roles/cloudfunctions.invoker/allUsers]

Terraform will perform the following actions:

<...terraformResources>

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

module.google-groups.google_service_account.runtime_account[0]: Creating...
google_storage_bucket.function_bucket: Creating...
```

## About Example

This is a simple example showing how to use [Google Cloud Functions](https://cloud.google.com/)
