resource "aws_api_gateway_api_key" "ApiKey" {
  name = var.api_key_name
}

resource "aws_api_gateway_usage_plan" "ApiKey" {
  name = var.api_key_name

  api_stages {
    api_id = aws_api_gateway_rest_api.api-gateway.id
    stage  = aws_api_gateway_deployment.api-gateway-deployment.stage_name
  }
}

resource "aws_api_gateway_usage_plan_key" "deploy-apigw-usage-plan-key" {
  key_id        = aws_api_gateway_api_key.ApiKey.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.deploy-api-gw-usage-plan.id
}
resource "aws_api_gateway_rest_api" "api_gateway_rest_api" {
  name           = "api_gateway"
  description    = "Api Gateway for Lambda"
  api_key_source = "HEADER"
}

resource "aws_api_gateway_resource" "api_gateway" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
  parent_id   = aws_api_gateway_rest_api.api_gateway_rest_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "api_gateway_method" {
  rest_api_id      = aws_api_gateway_rest_api.api_gateway_rest_api.id
  resource_id      = aws_api_gateway_resource.api_gateway.id
  http_method      = "ANY"
  authorization    = "NONE"
  api_key_required = "true"
  request_parameters = {
    "method.request.header.x-indent-signature" = true
    "method.request.header.x-indent-timestamp" = true
  }
}

resource "aws_api_gateway_integration" "api_gateway_integration" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
  resource_id = aws_api_gateway_method.api_gateway_method.resource_id
  http_method = aws_api_gateway_method.api_gateway_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda.invoke_arn
}

resource "aws_api_gateway_method" "api_gateway_root_method" {
  rest_api_id      = aws_api_gateway_rest_api.api_gateway_rest_api.id
  resource_id      = aws_api_gateway_rest_api.api_gateway_rest_api.root_resource_id
  http_method      = "ANY"
  authorization    = "NONE"
  api_key_required = "true"

  request_parameters = {
    "method.request.header.x-indent-signature" = true
    "method.request.header.x-indent-timestamp" = true
  }
}

resource "aws_api_gateway_integration" "api_gateway_root_integration" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
  resource_id = aws_api_gateway_method.api_gateway_root_method.resource_id
  http_method = aws_api_gateway_method.api_gateway_root_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda.invoke_arn
}

resource "aws_api_gateway_deployment" "api_gateway_deployment" {
  depends_on = [
    aws_api_gateway_integration.api_gateway_integration,
    aws_api_gateway_integration.api_gateway_root_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
  stage_name  = "dev"
}

resource "aws_api_gateway_usage_plan" "deploy-api-gw-usage-plan" {
  name = var.api_name

  api_stages {
    api_id = aws_api_gateway_rest_api.api-gateway.id
    stage  = aws_api_gateway_deployment.api-gateway-deployment.stage_name
  }

  # quota_settings {
  #   limit  = var.quota_limit
  #   period = var.quota_period
  # }

  # throttle_settings {
  #   burst_limit = var.throttle_burst_limit
  #   rate_limit  = var.throttle_rate_limit
  # }
}
