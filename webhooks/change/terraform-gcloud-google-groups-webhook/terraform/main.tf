resource "random_string" "suffix" {
  length  = 4
  upper   = false
  special = false
}

resource "google_storage_bucket" "function_bucket" {
  name = "indent-gworkspace-groups-webhook-${random_string.suffix.result}"
}

module "google-groups" {
  source                = "./function"
  root_dir              = "${path.module}/.."
  name                  = "indent-google-groups-webhook"
  region                = var.region
  bucket                = google_storage_bucket.function_bucket.name
  source_dir            = "/dist"
  service_account_email = var.service_account_email

  environment_variables = {
    INDENT_WEBHOOK_SECRET = var.indent_webhook_secret
  }
}
