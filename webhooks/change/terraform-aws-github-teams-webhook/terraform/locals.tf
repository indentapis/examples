locals {
  name          = "indent-aws-github-webhook-${random_string.suffix.result}"
  lambda_memory = 128

  tags = {
    Name       = "Indent + GitHub on AWS via Terraform"
    GitRepo    = "https://github.com/indentapis/indent-js"
    ProvidedBy = "Indent"
  }
}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  special = false
}
