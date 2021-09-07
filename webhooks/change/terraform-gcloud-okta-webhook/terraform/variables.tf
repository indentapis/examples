
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

variable "okta_profile_attribute" {
  description = "OKTA_PROFILE_ATTRIBUTE for the indent-gcloud-okta-webhook"
  type        = string
  default     = "okta/userProfileAttribute/id"
}

variable "okta_profile_attribute_value" {
  description = "OKTA_PROFILE_ATTRIBUTE_VALUE for the indent-gcloud-okta-webhook"
  type        = string
  default     = "okta/userProfileAttribute/value"
}

variable "okta_profile_resource_kind" {
  description = "OKTA_PROFILE_RESOURCE_KIND for the indent-gcloud-okta-webhook"
  type        = string
  default     = "ProfileAttribute"
}
