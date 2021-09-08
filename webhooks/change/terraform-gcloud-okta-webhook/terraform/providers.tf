provider "google" {
  credentials = fileexists(var.google_creds_path) ? file(var.google_creds_path) : ""
  project     = var.project
}

terraform {
  required_providers {
    random = {
      source = "hashicorp/random"
    }
  }
}
