###############################################################################
# Root composition: wires modules together
###############################################################################

data "aws_availability_zones" "available" {
  state = "available"
}

module "networking" {
  source              = "./modules/networking"
  project_name        = var.project_name
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  availability_zones  = slice(data.aws_availability_zones.available.names, 0, 2)
  app_port            = var.app_port
  ssh_allowed_cidrs   = var.ssh_allowed_cidrs
}

module "sns" {
  source       = "./modules/sns"
  project_name = var.project_name
  alarm_email  = var.alarm_email
}

module "iam" {
  source              = "./modules/iam"
  project_name        = var.project_name
  sns_topic_arn       = module.sns.topic_arn
  github_org          = var.github_org
  github_repo         = var.github_repo
  frontend_bucket_arn = module.s3.bucket_arn
}

module "s3" {
  source               = "./modules/s3"
  project_name         = var.project_name
  frontend_bucket_name = var.frontend_bucket_name
}

module "cloudfront" {
  source                 = "./modules/cloudfront"
  project_name           = var.project_name
  frontend_bucket_id     = module.s3.bucket_id
  frontend_bucket_arn    = module.s3.bucket_arn
  frontend_bucket_domain = module.s3.bucket_regional_domain_name
}

# Bucket policy needs the CloudFront distribution ARN
resource "aws_s3_bucket_policy" "frontend" {
  bucket = module.s3.bucket_id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipalReadOnly"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${module.s3.bucket_arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = module.cloudfront.distribution_arn
        }
      }
    }]
  })
}

module "alb" {
  source            = "./modules/alb"
  project_name      = var.project_name
  vpc_id            = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  alb_sg_id         = module.networking.alb_sg_id
  app_port          = var.app_port
}

module "ec2" {
  source                = "./modules/ec2"
  project_name          = var.project_name
  instance_type         = var.instance_type
  instance_profile_name = module.iam.instance_profile_name
  ec2_sg_id             = module.networking.ec2_sg_id
  docker_image          = var.docker_image
  app_port              = var.app_port
  ssh_key_name          = var.ssh_key_name
  ssh_public_key_path   = var.ssh_public_key_path
}

module "asg" {
  source                  = "./modules/asg"
  project_name            = var.project_name
  launch_template_id      = module.ec2.launch_template_id
  launch_template_version = module.ec2.launch_template_latest_version
  public_subnet_ids       = module.networking.public_subnet_ids
  target_group_arn        = module.alb.target_group_arn
  min_size                = var.asg_min_size
  max_size                = var.asg_max_size
  desired_capacity        = var.asg_desired_capacity
  sns_topic_arn           = module.sns.topic_arn
}

module "cloudwatch" {
  source               = "./modules/cloudwatch"
  project_name         = var.project_name
  asg_name             = module.asg.asg_name
  scale_out_policy_arn = module.asg.scale_out_policy_arn
  scale_in_policy_arn  = module.asg.scale_in_policy_arn
  sns_topic_arn        = module.sns.topic_arn
}

module "ssm" {
  source          = "./modules/ssm"
  project_name    = var.project_name
  app_port        = var.app_port
  github_role_arn = module.iam.github_actions_role_arn
}
