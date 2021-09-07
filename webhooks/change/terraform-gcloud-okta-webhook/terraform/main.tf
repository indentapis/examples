resource "random_string" "suffix" {
  length  = 4
  upper   = false
  special = false
}

resource "google_storage_bucket" "function_bucket" {
  name = "indent-gcloud-okta-webhook-${random_string.suffix.result}"
}

module "google-github-teams" {
  source     = "./function"
  root_dir   = "${path.module}/.."
  name       = "indent-gcloud-okta-webhook-${random_string.suffix.result}"
  region     = var.region
  bucket     = google_storage_bucket.function_bucket.name
  source_dir = "/dist"

  environment_variables = {
    INDENT_WEBHOOK_SECRET = var.indent_webhook_secret
    OKTA_DOMAIN           = var.okta_domain
    OKTA_TOKEN            = var.okta_token
    OKTA_CLIENT_ID        = var.okta_client_id
    OKTA_PRIVATE_KEY      = var.okta_private_key
  }
}
