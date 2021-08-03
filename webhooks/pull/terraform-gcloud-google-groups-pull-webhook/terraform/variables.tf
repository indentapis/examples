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

<<<<<<< HEAD
=======
variable "bucket" {
  description = "Name of bucket to store function sources in"
  default     = "indent-gcloud-groups-webhooks"
  type        = string
}

>>>>>>> 9cc442805cfadb85b1b8c04a2ab65026322d2cf2
variable "region" {
  description = "Region to run functions in"
  default     = "us-central1"
  type        = string
}

variable "indent_webhook_secret" {
  description = "INDENT_WEBHOOK_SECRET for the indent-gcloud-groups-webhook"
  type        = string
  sensitive   = true
}

variable "google_customer_id" {
  description = "GOOGLE_CUSTOMER_ID for the indent-gcloud-groups-webhook"
  default     = ""
  type        = string
  sensitive   = true
}
