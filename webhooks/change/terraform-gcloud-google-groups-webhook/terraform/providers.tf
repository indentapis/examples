provider "google" {
  credentials = file(var.google_creds_path)
  project     = var.project
}
