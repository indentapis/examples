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

variable "api_key_name" {
  description = "Name of the API Key attached to API Gateway"
  default     = "indent-api-credential"
}

# variable "quota_limit" {
#   description = "Maximum number of api calls for the usage plan"
#   default     = 10000
# }

# variable "quota_period" {
#   description = "Period in which the limit is accumulated, eg DAY, WEEK, MONTH"
#   default     = "DAY"
# }

# variable "throttle_burst_limit" {
#   description = "Burst token bucket"
#   default     = 5
# }

# variable "throttle_rate_limit" {
#   description = "Rate at which burst tokens are added to bucket"
#   default     = 10
# }
