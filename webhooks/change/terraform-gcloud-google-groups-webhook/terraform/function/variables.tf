variable "name" {
  description = "Name of the function to be deployed"
  type        = string
}

variable "root_dir" {
  description = "Root directory path for terraform plan"
  type        = string
}

variable "source_dir" {
  description = "Source directory path"
  default     = ""
  type        = string
}

variable "bucket" {
  description = "Name of bucket to store function source in"
  type        = string
}

variable "region" {
  description = "Region to run function in"
  type        = string
}

variable "description" {
  description = "Short text explaining purpose of the function"
  default     = ""
  type        = string
}

variable "runtime" {
  description = "Runtime environment used to run function"
  default     = "nodejs14"
  type        = string
}

variable "memory" {
  description = "Memory (in MB), available to the function. Default is 256. Allowed values are 128,256,512,1024,2048"
  default     = 256
  type        = number
}

variable "timeout" {
  description = "Time in seconds before function to timeout (max 540)"
  default     = 60
  type        = number
}

variable "entry_point" {
  description = "Exported function to be deployed"
  default     = "webhook"
  type        = string
}

variable "environment_variables" {
  description = "Variables to be made available to function"
  default     = {}
  type        = map(string)
}

variable "service_account_email" {
  description = "Runtime service account function should be run with. If empty new service account will be created"
  default     = ""
  type        = string
}
