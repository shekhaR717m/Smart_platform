aws_region   = "ap-south-1"
project_name = "rt-serverless-hybrid"
environment  = "prod"

vpc_cidr            = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]

instance_type = "t3.micro"
docker_image  = "tiangolo/uvicorn-gunicorn-fastapi:python3.11"
app_port      = 8000

asg_min_size         = 1
asg_max_size         = 3
asg_desired_capacity = 1
ssh_key_name         = "omen-ec2"
ssh_public_key_path  = "C:/Users/omen/.ssh/id_rsa.pub"

alarm_email          = "mayankshekhar170704@gmail.com"
frontend_bucket_name = "rt-serverless-hybrid-frontend-mayank-shekhar-717m"

github_org  = "shekhkaR717m"
github_repo = "Smart_platform"
