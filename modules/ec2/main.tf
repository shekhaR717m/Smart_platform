###############################################################################
# EC2 Launch Template (Amazon Linux 2023 + Docker + FastAPI container)
###############################################################################

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

locals {
  user_data = <<-EOF
    #!/bin/bash
    set -eux
    dnf update -y
    dnf install -y docker
    systemctl enable --now docker
    usermod -aG docker ec2-user

    # Install CloudWatch agent + SSM agent (SSM is preinstalled on AL2023)
    dnf install -y amazon-cloudwatch-agent
    systemctl enable --now amazon-ssm-agent

    # Pull and run FastAPI container on port ${var.app_port}
    docker pull ${var.docker_image}
    docker run -d --restart=always \
      --name fastapi \
      -p ${var.app_port}:${var.app_port} \
      ${var.docker_image}
  EOF
}

resource "aws_launch_template" "this" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = data.aws_ami.al2023.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = var.instance_profile_name
  }

  vpc_security_group_ids = [var.ec2_sg_id]

  user_data = base64encode(local.user_data)

  metadata_options {
    http_tokens                 = "required"
    http_endpoint               = "enabled"
    http_put_response_hop_limit = 2
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-app"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}