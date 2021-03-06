

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
  type        = string
}

variable "region" {
  description = "Region to run functions in"
  default     = "us-central1"
  type        = string
}

variable "indent_webhook_secret" {
  description = "INDENT_WEBHOOK_SECRET for the indent-google-groups-webhook"
  type        = string
  sensitive   = true
}

variable "service_account_email" {
  description = "Runtime service account function should be run with. If empty new service account will be created"
  default     = ""
  type        = string
}
