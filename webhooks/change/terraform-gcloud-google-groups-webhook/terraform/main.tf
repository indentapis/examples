resource "google_storage_bucket" "function_bucket" {
  name = var.bucket
}

module "google-groups" {
  source     = "./function"
  root_dir   = "${path.module}/.."
  name       = "indent-google-groups-webhook"
  region     = var.region
  bucket     = google_storage_bucket.function_bucket.name
  source_dir = "/dist"

  environment_variables = {
    INDENT_WEBHOOK_SECRET = var.indent_webhook_secret
  }
}
