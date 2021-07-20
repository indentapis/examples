resource "google_storage_bucket" "function_bucket" {
  name = var.bucket
}

module "google-groups" {
  source     = "../../../../terraform/function"
  root_dir   = "${path.module}/.."
  name       = "indent-google-groups-webhook"
  region     = var.region
  bucket     = google_storage_bucket.function_bucket.name
  source_dir = "/dist"

  environment_variables = {
    INDENT_WEBHOOK_SECRET = var.webhook_secret
    GCP_SVC_ACCT_EMAIL    = var.service_account_email
  }
}
