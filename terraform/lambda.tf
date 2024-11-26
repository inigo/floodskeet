# Archive the TypeScript build output and node_modules
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/../dist/floodskeet.zip"
  source_dir  = "${path.module}/../dist"
  depends_on  = [null_resource.build_typescript]
}

# Build TypeScript and install dependencies
resource "null_resource" "build_typescript" {
  triggers = {
    always_run = "${timestamp()}"
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/.."  # Change to parent directory
    interpreter = ["bash", "-c"]
    command     = <<-EOT
      set -e
      echo "Starting build..."
      npm install
      echo "NPM install complete"
      npm run build
      echo "Build complete"
      mkdir -p dist
      echo "Dist directory created"
      cp -r node_modules dist/
      echo "Node modules copied"
      cp -r build/* dist/
      echo "Build files copied"
    EOT
  }

}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "floodskeet_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_lambda_function" "typescript_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  function_name    = "floodskeet-lambda"
  role            = aws_iam_role.lambda_role.arn
  handler         = "aws.handler"
  runtime         = "nodejs22.x"
  timeout          = "20"

  environment {
    variables = {
      NODE_ENV = "production"
      BLUESKY_USERNAME = var.bluesky_username
      BLUESKY_PASSWORD = var.bluesky_password
    }
  }
}

# Outputs
output "lambda_function_arn" {
  value = aws_lambda_function.typescript_lambda.arn
}

output "lambda_function_name" {
  value = aws_lambda_function.typescript_lambda.function_name
}