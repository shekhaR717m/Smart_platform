###############################################################################
# SNS topic for ops notifications (scaling + alarms)
###############################################################################

resource "aws_sns_topic" "this" {
  name = "${var.project_name}-notifications"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.this.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Allow CloudWatch Alarms + ASG to publish
data "aws_iam_policy_document" "sns" {
  statement {
    sid       = "AllowCloudWatchAndASGPublish"
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.this.arn]

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com", "autoscaling.amazonaws.com"]
    }
  }
}

resource "aws_sns_topic_policy" "this" {
  arn    = aws_sns_topic.this.arn
  policy = data.aws_iam_policy_document.sns.json
}