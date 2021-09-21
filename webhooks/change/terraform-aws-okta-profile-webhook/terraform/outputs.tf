output "api_base_url" {
  value       = aws_api_gateway_deployment.api_gateway_deployment.invoke_url
  description = "The URL of the deployed Lambda"
}

output "api_key_value" {
  value       = var.create_api_key ? aws_api_gateway_api_key.api_key[0].value : "AWS API Keys are not being used with this Lambda's gateway"
  description = "API key used to access your Indent Webhook"
}
