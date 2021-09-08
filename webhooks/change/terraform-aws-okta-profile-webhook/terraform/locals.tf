locals {
  name          = "indent-okta-profile-webhook-${random_string.suffix.result}"
  lambda_memory = 128

  tags = {
    Name       = "Indent + Okta Profiles on AWS via Terraform"
    GitRepo    = "https://github.com/indentapis/examples"
    ProvidedBy = "Indent"
  }
}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  special = false
}
