variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "aws_profile" {
  type    = string
  default = "default"
}

variable "indent_webhook_secret" {
  type      = string
  sensitive = true
}

variable "okta_domain" {
  type      = string
  sensitive = true
}

variable "okta_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "okta_client_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "okta_private_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "okta_profile_attribute" {
  type    = string
  default = "okta/userProfileAttribute/id"
}

variable "okta_profile_attribute_value" {
  type    = string
  default = "okta/userProfileAttribute/value"
}

variable "okta_profile_resource_kind" {
  type    = string
  default = "ProfileAttribute"
}
