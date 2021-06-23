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

variable "indent_space_name" {
  type      = string
  sensitive = true
}

variable "atspoke_api_key" {
  type      = string
  sensitive = true
}
