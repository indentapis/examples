provider "google" {
  version     = "~> 3.76"
  credentials = file(var.google_creds_path)
  project     = var.project
}
