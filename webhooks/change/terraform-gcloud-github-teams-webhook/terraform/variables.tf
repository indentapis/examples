
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
  description = "INDENT_WEBHOOK_SECRET for the indent-gcloud-groups webhook"
  type        = string
  sensitive   = true
}

variable "github_username" {
  description = "GITHUB_USERNAME from the indent-gcloud-github-teams webhook"
  type        = string
  sensitive   = true
}

variable "github_token" {
  description = "GITHUB_TOKEN for the indent-gcloud-github-teams webhook"
  type        = string
  sensitive   = true
}
