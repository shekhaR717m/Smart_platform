variable "project_name" { type = string }
variable "instance_type" { type = string }
variable "instance_profile_name" { type = string }
variable "ec2_sg_id" { type = string }
variable "docker_image" { type = string }
variable "app_port" { type = number }

variable "ssh_key_name" {
  description = "Name of the EC2 SSH key pair to use for instance access"
  type        = string
}

variable "ssh_public_key_path" {
  description = "Path to the public SSH key file on the local machine"
  type        = string
}
