output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${module.cloudfront.distribution_domain_name}"
}

output "s3_bucket_name" {
  description = "Frontend S3 bucket name"
  value       = module.s3.bucket_id
}

output "sns_topic_arn" {
  description = "SNS Topic ARN for notifications"
  value       = module.sns.topic_arn
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = module.asg.asg_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "github_actions_role_arn" {
  description = "IAM role ARN assumed by GitHub Actions via OIDC"
  value       = module.iam.github_actions_role_arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID used for frontend cache invalidations"
  value       = module.cloudfront.distribution_id
}

output "ssm_deploy_document_name" {
  description = "SSM document name used by GitHub Actions backend deployments"
  value       = module.ssm.deploy_document_name
}

output "app_instance_name_tag" {
  description = "Name tag value used to target ASG app instances with SSM"
  value       = "${var.project_name}-asg-instance"
}

output "target_group_arn" {
  description = "ALB target group ARN used to inspect backend target health"
  value       = module.alb.target_group_arn
}
