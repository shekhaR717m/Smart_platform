###############################################################################
# SSM document used by GitHub Actions to deploy a new container image
###############################################################################

resource "aws_ssm_document" "deploy" {
  name            = "${var.project_name}-deploy-app"
  document_type   = "Command"
  document_format = "YAML"

  content = <<-DOC
    schemaVersion: '2.2'
    description: Pull and restart the FastAPI container on managed instances
    parameters:
      image:
        type: String
        description: Full Docker image URI (e.g. <acct>.dkr.ecr.<region>.amazonaws.com/app:tag)
    mainSteps:
      - action: aws:runShellScript
        name: deployApp
        inputs:
          runCommand:
            - set -eux
            - aws --version || true
            - docker pull {{ image }}
            - docker rm -f fastapi || true
            - docker run -d --restart=always --name fastapi -p ${var.app_port}:${var.app_port} {{ image }}
  DOC
}

# Note: EC2 instances are registered automatically with SSM via the
# AmazonSSMManagedInstanceCore policy attached in the iam module +
# the SSM agent installed via user-data.
