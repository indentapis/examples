provider "google" {
  credentials = file(var.google_creds_path)
  project     = var.project
}

terraform {
  required_providers {
    random = {
      source = "hashicorp/random"
    }
  }
}