variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for tagging and naming"
  type        = string
  default     = "rt-serverless-hybrid"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

# Networking
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

# EC2
variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "docker_image" {
  description = "FastAPI Docker image (e.g. ECR URI or public image)"
  type        = string
  default     = "tiangolo/uvicorn-gunicorn-fastapi:python3.11"
}

variable "app_port" {
  type    = number
  default = 8000
}

variable "ssh_key_name" {
  description = "SSH key pair name for EC2 instances"
  type        = string
  default     = "omen-ec2"
}

variable "ssh_public_key_path" {
  description = "Local path to the public SSH key file"
  type        = string
  default     = "C:/Users/omen/.ssh/id_rsa.pub"
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH to EC2 instances. For demos, 0.0.0.0/0 works but your public IP /32 is safer."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# ASG
variable "asg_min_size" {
  type    = number
  default = 1
}

variable "asg_max_size" {
  type    = number
  default = 3
}

variable "asg_desired_capacity" {
  type    = number
  default = 1
}

# SNS
variable "alarm_email" {
  description = "Email address to receive SNS notifications"
  type        = string
}

# S3 / CloudFront
variable "frontend_bucket_name" {
  description = "Globally unique S3 bucket name for React frontend"
  type        = string
}

# GitHub OIDC
variable "github_org" {
  description = "GitHub organization or user owning the repo"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}
