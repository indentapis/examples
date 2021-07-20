variable "google_creds_path" {
  description = <<EOF
File containing JSON credentials used to authenticate with Google Cloud and create a cluster.
Credentials can be downloaded at https://console.cloud.google.com/apis/credentials/serviceaccountkey.
EOF
  default     = "./secrets/terraform-deploy-key.json"
  type        = string
}

variable "project" {
  description = "Google Cloud Platform project to deploy cluster in."
  default     = "granite-functions"
  type        = string
}

variable "bucket" {
  description = "Name of bucket to store function sources in"
  default     = "indent-gcloud-groups-webhooks"
  type        = string
}

variable "region" {
  description = "Region to run functions in"
  default     = "us-central1"
  type        = string
}

variable "webhook_secret" {
  description = "INDENT_WEBHOOK_SECRET for the indent-gcloud-groups-webhook"
  type        = string
}

variable "service_account_email" {
  description = "Service account email address for managing Google Groups"
  type        = string
}
