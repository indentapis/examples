locals {
  name          = "indent-atspoke-webhook-${random_string.suffix.result}"
  lambda_memory = 128

  tags = {
    Name       = "Indent + Atspoke on AWS via Terraform"
    GitRepo    = "https://github.com/indentapis/indent-js"
    ProvidedBy = "Indent"
  }
}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  special = false
}
