output "instance_profile_name" { value = aws_iam_instance_profile.ec2.name }
output "ec2_role_arn" { value = aws_iam_role.ec2.arn }
output "github_actions_role_arn" { value = aws_iam_role.github_actions.arn }
output "github_oidc_provider_arn" { value = aws_iam_openid_connect_provider.github.arn }
