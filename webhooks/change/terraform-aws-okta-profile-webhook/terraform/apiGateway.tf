resource "aws_api_gateway_rest_api" "api_gateway_rest_api" {
  name           = "api_gateway"
  description    = "API Gateway for AWS Lambda"
  api_key_source = "HEADER" # Uncomment if you are using an AWS API Gateway key
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
  api_key_required = var.create_api_key ? true : false # Uncomment if you are using an AWS API Gateway key
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
  api_key_required = var.create_api_key ? true : false # Uncomment if you are using an AWS API Gateway key

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

# Create an AWS API Gateway Key and a Usage Plan

resource "aws_api_gateway_api_key" "api_key" {
  count = var.create_api_key ? 1 : 0
  name  = var.api_key_name
}

resource "aws_api_gateway_usage_plan" "api_key" {
  count = var.create_api_key ? 1 : 0
  name  = var.api_key_name

  api_stages {
    api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
    stage  = aws_api_gateway_deployment.api_gateway_deployment.stage_name
  }
}

resource "aws_api_gateway_usage_plan_key" "deploy_api_gw_usage_plan_key" {
  count         = var.create_api_key ? 1 : 0
  key_id        = aws_api_gateway_api_key.api_key[0].id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.deploy_api_gw_usage_plan[0].id
}

resource "aws_api_gateway_usage_plan" "deploy_api_gw_usage_plan" {
  count = var.create_api_key ? 1 : 0

  name = local.name

  api_stages {
    api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
    stage  = aws_api_gateway_deployment.api_gateway_deployment.stage_name
  }
}
