resource "google_storage_bucket" "function_bucket" {
  name = "indent-gcloud-github-teams-change"
}

module "google-github-teams" {
  source     = "./function"
  root_dir   = "${path.module}/.."
  name       = "indent-gcloud-github-teams"
  region     = var.region
  bucket     = google_storage_bucket.function_bucket.name
  source_dir = "/dist"

  environment_variables = {
    INDENT_WEBHOOK_SECRET = var.indent_webhook_secret
    GITHUB_USERNAME       = var.github_username
    GITHUB_TOKEN          = var.github_token
  }
}
