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

variable "jira_api_token" {
  type      = string
  sensitive = true
}

variable "jira_user_email" {
  type      = string
  sensitive = true
}

variable "jira_instance_url" {
  type      = string
  sensitive = true
}

variable "jira_project_key" {
  type      = string
  sensitive = true
}

variable "jira_ticket_event_match" {
  type    = string
  default = ""
}
