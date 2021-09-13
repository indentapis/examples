
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
  description = "INDENT_WEBHOOK_SECRET for the indent-gcloud-okta-webhook"
  type        = string
  sensitive   = true
}

variable "okta_domain" {
  description = "OKTA_DOMAIN for the indent-gcloud-okta-webhook"
  type        = string
  sensitive   = true
}

variable "okta_token" {
  description = "OKTA_TOKEN for the indent-gcloud-okta-webhook"
  type        = string
  sensitive   = true
  default     = ""
}

variable "okta_slack_app_id" {
  type      = string
  default   = ""
  sensitive = true
}

variable "okta_client_id" {
  description = "OKTA_CLIENT_ID for the indent-gcloud-okta-webhook"
  type        = string
  sensitive   = true
  default     = ""
}

variable "okta_private_key" {
  description = "OKTA_PRIVATE_KEY for the indent-gcloud-okta-webhook"
  type        = string
  sensitive   = true
  default     = ""
}
