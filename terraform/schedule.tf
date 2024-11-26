resource "aws_cloudwatch_event_rule" "every_fifteen_minutes" {
  name                = "trigger-typescript-lambda"
  description         = "Fires every 15 minutes starting at 3 minutes past the hour"
  schedule_expression = "cron(3/15 * * * ? *)"
}

# Permission to allow CloudWatch Events to invoke Lambda
resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.typescript_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every_fifteen_minutes.arn
}

# CloudWatch Event Target
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.every_fifteen_minutes.name
  target_id = "TriggerTypescriptLambda"
  arn       = aws_lambda_function.typescript_lambda.arn
}