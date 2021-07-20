resource "google_storage_bucket" "function_bucket" {
  name = var.bucket
}

module "google-groups" {
  source = "../../../terraform/function"

  name   = "indent-gcloud-google-groups-webhook"
  region = var.region
  bucket = google_storage_bucket.function_bucket.name

  environment_variables = {
    INDENT_WEBHOOK_SECRET = var.webhook_secret
  }
}