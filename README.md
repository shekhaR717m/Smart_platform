# Real-Time Serverless-Hybrid Auto-Healing Platform - Terraform

Modular Terraform for an AWS demo platform that provisions:

- VPC with 2 public subnets, an internet gateway, route tables, and security groups
- EC2 Launch Template running a Dockerized FastAPI app on `app_port`
- Internet-facing Application Load Balancer with a `/health` target group
- Auto Scaling Group with ELB health checks, rolling instance refresh, and CPU scaling policies
- CloudWatch CPU alarms with SNS notifications
- IAM roles for EC2 and GitHub Actions OIDC deployments
- SSM document so GitHub Actions can deploy new backend container images with Run Command
- Private S3 frontend bucket served through CloudFront Origin Access Control
- GitHub Actions workflows for backend and frontend deployments

## Layout

```text
.
|-- main.tf
|-- variables.tf
|-- outputs.tf
|-- provider.tf
|-- terraform.tfvars
|-- modules/
|   |-- networking/
|   |-- ec2/
|   |-- alb/
|   |-- asg/
|   |-- cloudwatch/
|   |-- sns/
|   |-- s3/
|   |-- cloudfront/
|   |-- IAM/
|   `-- ssm/
`-- .github/workflows/
    |-- backend.yaml
    `-- frontend.yaml
```

## Requirements

- Terraform >= 1.6
- AWS CLI configured with credentials that can create the listed AWS resources
- An SSH public key at `ssh_public_key_path`, or update that variable
- A backend Docker image that listens on `app_port` and returns `200` on `/health`
- Optional frontend app under `frontend/` that builds to `frontend/dist`

## Configure

Edit `terraform.tfvars`:

- `alarm_email`: email address for SNS notifications. Confirm the subscription email after apply.
- `frontend_bucket_name`: globally unique S3 bucket name.
- `github_org` and `github_repo`: GitHub owner and repo used in the OIDC trust policy.
- `docker_image`: backend image URI. Use an image that exposes `/health` on `app_port`.
- `ssh_key_name` and `ssh_public_key_path`: EC2 key pair settings.
- `ssh_allowed_cidrs`: CIDR blocks allowed to SSH to EC2. Use your public IP as `/32` for normal use.

Do not commit `terraform.tfvars`, `terraform.tfstate`, or `terraform.tfstate.backup`.

## Fix EC2 Instance Connect

The EC2 security group now includes SSH ingress on port `22` from `ssh_allowed_cidrs`.

For a quick demo, the default allows SSH from anywhere:

```hcl
ssh_allowed_cidrs = ["0.0.0.0/0"]
```

For safer access, replace it with your public IP:

```hcl
ssh_allowed_cidrs = ["YOUR_PUBLIC_IP/32"]
```

Then apply the security group update:

```bash
terraform plan
terraform apply
```

After apply, try EC2 Instance Connect again with user `ec2-user`.

## Deploy Infrastructure

From this project root:

```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan
terraform apply
terraform output
```

Important outputs:

- `alb_dns_name`: backend ALB endpoint.
- `cloudfront_url`: frontend HTTPS URL.
- `s3_bucket_name`: frontend deployment bucket.
- `cloudfront_distribution_id`: GitHub variable `CLOUDFRONT_DIST_ID`.
- `github_actions_role_arn`: GitHub variable `AWS_DEPLOY_ROLE_ARN`.
- `ssm_deploy_document_name`: GitHub variable `SSM_DOCUMENT`.
- `app_instance_name_tag`: GitHub variable `APP_INSTANCE_NAME_TAG`.

## GitHub Actions Variables

Set these repository variables before using the workflows:

```text
AWS_DEPLOY_ROLE_ARN=<terraform output github_actions_role_arn>
AWS_REGION=<your Terraform aws_region>
ECR_REPOSITORY=<account>.dkr.ecr.<region>.amazonaws.com/<repo>
SSM_DOCUMENT=<terraform output ssm_deploy_document_name>
APP_INSTANCE_NAME_TAG=<terraform output app_instance_name_tag>
FRONTEND_BUCKET=<terraform output s3_bucket_name>
CLOUDFRONT_DIST_ID=<terraform output cloudfront_distribution_id>
```

The workflows assume:

- Backend code and Dockerfile live in `backend/`.
- Frontend code lives in `frontend/` and `npm run build` creates `frontend/dist`.
- The ECR repository already exists, or you create it separately.

## Telehealth App

This repo includes a small telehealth demo:

- `backend/`: FastAPI API with `/health`, provider listing, appointments, and triage.
- `frontend/`: static React-based dashboard that builds to `frontend/dist`.

Run backend locally:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run frontend locally:

```bash
cd frontend
npm ci
npm run build
npm start
```

Open `http://localhost:5173` and enter `http://localhost:8000` as the backend URL.

For AWS deployment, build and push the backend image to ECR, set `docker_image` to that image URI, and run `terraform apply`. Later backend changes can deploy through the GitHub Actions backend workflow.

## Demo Script

1. Show the architecture: VPC, public subnets, ALB, ASG, EC2 container, CloudWatch alarms, SNS, S3, CloudFront, IAM OIDC, and SSM.
2. Run `terraform output` and point out the ALB URL, CloudFront URL, GitHub role ARN, SSM document, and instance tag.
3. Open `http://<alb_dns_name>/health` to demonstrate the backend health check.
4. Open `cloudfront_url` to demonstrate the frontend served through CloudFront and private S3.
5. In AWS Console, show the Auto Scaling Group instances registered as healthy in the target group.
6. Demonstrate auto-healing by terminating one ASG instance. The ASG should launch a replacement and ALB health should recover.
7. Demonstrate backend deployment by pushing a change under `backend/`; GitHub Actions builds/pushes the image and runs the SSM deploy document.
8. Demonstrate frontend deployment by pushing a change under `frontend/`; GitHub Actions syncs S3 and invalidates CloudFront.
9. Demonstrate observability by opening CloudWatch alarms and the SNS topic. Confirm that the email subscription is confirmed.

## Useful Commands

```bash
terraform output alb_dns_name
terraform output cloudfront_url
terraform output app_instance_name_tag
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$(terraform output -raw asg_name)"
aws elbv2 describe-target-health --target-group-arn "$(terraform output -raw target_group_arn)"
aws ssm describe-instance-information
```

## Notes

- The CloudFront S3 bucket policy is created in `main.tf` to break the bucket/distribution dependency cycle.
- The default sample Docker image should be replaced with your own backend image for a real demo.
- If your AWS account already has a GitHub OIDC provider, import it into Terraform state or adjust the IAM module to reference the existing provider.
- Run `terraform destroy` after the demo if you do not want to keep paying for AWS resources.
