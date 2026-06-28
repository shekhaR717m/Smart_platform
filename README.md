# Real-Time Serverless-Hybrid Auto-Healing Platform — Terraform

Production-ready, modular Terraform for AWS that provisions:

- VPC (10.0.0.0/16), 2 public subnets, IGW, route tables, security groups
- EC2 Launch Template (Amazon Linux 2023, t2.micro) running a FastAPI Docker container on port 8000
- Internet-facing Application Load Balancer with `/health` target group
- Auto Scaling Group (min 1 / desired 1 / max 3) with ELB health checks + instance refresh
- CloudWatch CPU alarms (>70% scale out, <30% scale in)
- SNS topic + email subscription for scaling/alarm/instance-replacement events
- Least-privilege IAM roles for EC2 (SSM, CloudWatch Agent, ECR pull, SNS publish)
- SSM Document so GitHub Actions can deploy new container images via `SendCommand`
- S3 bucket for the React frontend (private) served by CloudFront via Origin Access Control with HTTPS + SPA routing
- GitHub Actions OIDC provider + deployment IAM role (no long-lived keys)

## Layout

```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── provider.tf
├── terraform.tfvars
└── modules/
    ├── networking/
    ├── ec2/
    ├── alb/
    ├── asg/
    ├── cloudwatch/
    ├── sns/
    ├── s3/
    ├── cloudfront/
    ├── iam/
    └── ssm/
```

## Requirements

- Terraform >= 1.6
- AWS Provider >= 5.x
- AWS credentials with permissions to create the listed resources

## Usage

1. Edit `terraform.tfvars`:
   - `alarm_email` — your email (confirm the SNS subscription email!)
   - `frontend_bucket_name` — globally unique S3 bucket name
   - `github_org` / `github_repo` — for the OIDC trust policy
   - Optionally swap `docker_image` for your ECR image URI

2. Deploy:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

3. Outputs (after apply):
   - `alb_dns_name` — public ALB endpoint
   - `cloudfront_url` — frontend HTTPS URL
   - `s3_bucket_name` — upload React build here
   - `sns_topic_arn`
   - `asg_name`
   - `vpc_id`
   - `github_actions_role_arn` — set as `role-to-assume` in your GitHub Actions workflow


## Notes

- The CloudFront S3 bucket policy is created at the root (`main.tf`) to break the bucket ↔ distribution cycle.
- EC2 user-data installs Docker + amazon-cloudwatch-agent and runs the FastAPI container; replace `docker_image` with your own image exposing `/health` on port 8000.
- Instance refresh is enabled on the ASG so launch-template updates roll out automatically.
- All resources are tagged via the provider `default_tags` block.