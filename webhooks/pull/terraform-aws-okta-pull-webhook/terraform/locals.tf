locals {
  name          = "indent-pull-okta-webhook-${random_string.suffix.result}"
  lambda_memory = 128

  tags = {
    Name             = "indent-pull-okta-webhook"
    Docs             = "https://indent.com/docs/connect/webhooks/okta"
    Examples         = "https://github.com/indentapis/examples"
    ProvidedBy       = "Indent"
    IdtCanPullUpdate = "True"
  }
}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  special = false
}
