# Troubleshooting and Run Notes

Use this note if the frontend does not connect, buttons do not work, or GitHub Actions checks fail.

## Run Locally

Open PowerShell and start the backend:

```powershell
cd C:\Games\may\smart-platform\backend
npm install
npm run dev
```

Check the backend:

```powershell
curl http://localhost:8000/health
```

Open another PowerShell window and start the frontend:

```powershell
cd C:\Games\may\smart-platform\frontend
npm install
npm run build
npm start
```

Open the frontend:

```text
http://localhost:5173
```

In the frontend, enter this backend URL and click **Connect**:

```text
http://localhost:8000
```

After that, **Schedule** and **Evaluate** should work.

## If the AWS ALB URL Fails

If the browser console shows `ERR_NAME_NOT_RESOLVED`, the saved ALB DNS name is no longer active or has changed. Get the latest ALB value:

```powershell
cd C:\Games\may\smart-platform
terraform output alb_dns_name
```

If Terraform has no active output, recreate or refresh the infrastructure:

```powershell
terraform init
terraform apply
terraform output alb_dns_name
terraform output cloudfront_url
```

Use the latest ALB URL in the frontend.

## If GitHub Actions Fail

Go to the GitHub repository:

```text
Settings -> Secrets and variables -> Actions
```

Add these repository variables:

```text
AWS_DEPLOY_ROLE_ARN
AWS_REGION=ap-south-1
ECR_REPOSITORY
SSM_DOCUMENT
APP_INSTANCE_NAME_TAG
FRONTEND_BUCKET
CLOUDFRONT_DIST_ID
```

Add these secrets if the workflow uses AWS access keys:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

Most values come from:

```powershell
terraform output
```

Open the failed GitHub Actions check and click **Details**. If the error says a variable is missing, a role cannot be assumed, an ECR repository is missing, or an S3 bucket is missing, update the corresponding GitHub variable/secret or Terraform output.

## Push Fixes to GitHub

```powershell
cd C:\Games\may\smart-platform
git status
git add .
git commit -m "fix frontend connection and node backend"
git push origin main
```

## Browser Extension Warnings

Warnings like `contentscript.js`, `MaxListenersExceededWarning`, or `ObjectMultiplex` usually come from a browser extension, not this React app. The important app-breaking issue is usually the backend URL or ALB DNS value.
