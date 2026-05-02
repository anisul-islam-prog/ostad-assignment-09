# Ostad DevOps Assignment 09 — Starter Pack

## What is this?
A complete 3-tier application (Vue frontend + Node backend + PostgreSQL) designed to work with the Terraform infrastructure from the 5-part guide.

## Folder Structure
```
ostad-devops-app/
├── backend/           # Node.js + Express API
│   ├── package.json
│   ├── server.js
│   └── .gitignore
├── frontend/          # Vue 3 + Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       └── App.vue
└── terraform-scripts/ # Replacement user_data scripts
    ├── user-data-backend.sh
    ├── user-data-frontend.sh
    └── user-data-db.sh
```

## Step 1 — Test Locally (Optional but Recommended)

### 1.1 Start PostgreSQL locally
Install PostgreSQL locally or use Docker:
```bash
docker run -d --name local-postgres   -e POSTGRES_DB=ostad_app_db   -e POSTGRES_USER=ostad_admin   -e POSTGRES_PASSWORD=ostad_password   -p 5432:5432 postgres:15
```

### 1.2 Start Backend
```bash
cd backend
npm install
export DB_HOST=localhost
export DB_NAME=ostad_app_db
export DB_USER=ostad_admin
export DB_PASSWORD=ostad_password
export PORT=8080
node server.js
```
Visit http://localhost:8080/health and http://localhost:8080/api/deployment-info

### 1.3 Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:3000

## Step 2 — Push to GitHub

1. Create a new PUBLIC repository on GitHub named `ostad-devops-app`.
2. Run:
```bash
cd ostad-devops-app
git init
git add .
git commit -m "Initial commit: Vue + Node + Postgres"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ostad-devops-app.git
git push -u origin main
```

## Step 3 — Update Terraform

### 3.1 Copy the new user_data scripts
Replace your old files in `application/scripts/` with the ones from `terraform-scripts/` in this pack.

### 3.2 Add this variable to `terraform/variables.tf`
```hcl
variable "github_repo_url" {
  description = "Public GitHub repo URL with frontend/ and backend/ folders"
  type        = string
}
```

### 3.3 Add this to `terraform/terraform.tfvars`
```hcl
github_repo_url = "https://github.com/YOUR_GITHUB_USERNAME/ostad-devops-app.git"
```

### 3.4 Update `terraform/backend_asg.tf`
Find the `user_data` block inside `aws_launch_template.backend` and change it to:
```hcl
user_data = base64encode(templatefile("${path.module}/../application/scripts/user-data-backend.sh", {
  db_host     = aws_instance.database.private_ip
  db_name     = var.db_name
  db_user     = var.db_user
  db_password = var.db_password
  github_url  = var.github_repo_url
}))
```

### 3.5 Update `terraform/frontend.tf`
Find the `user_data` block inside `aws_instance.frontend` and change it to:
```hcl
user_data = base64encode(templatefile("${path.module}/../application/scripts/user-data-frontend.sh", {
  backend_alb_dns = aws_lb.backend.dns_name
  github_url      = var.github_repo_url
}))
```

### 3.6 Update `terraform/database.tf`
Find the `user_data` block inside `aws_instance.database` and change it to:
```hcl
user_data = base64encode(templatefile("${path.module}/../application/scripts/user-data-db.sh", {
  db_name     = var.db_name
  db_user     = var.db_user
  db_password = var.db_password
}))
```

### 3.7 Fix Security Group Cycle (IMPORTANT)
In `terraform/security_groups.tf`, replace any line that looks like:
```hcl
cidr_blocks = ["${aws_instance.monitoring.private_ip}/32"]
```
with:
```hcl
cidr_blocks = [var.vpc_cidr]
```
This prevents Terraform from crashing due to circular dependencies.

## Step 4 — Deploy

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Step 5 — Verify

1. Get outputs:
```bash
terraform output
```

2. Open the Frontend ALB DNS in your browser. You should see the Vue app.

3. Click "Load Users" — it should show Alice and Bob from PostgreSQL.

4. Check backend health directly:
```bash
curl http://YOUR_BACKEND_ALB_DNS/health
```

## How This Satisfies the Assignment

| Requirement | How it works here |
|-------------|-------------------|
| 3-Tier Architecture | Vue (Frontend) → Node API (Backend ASG) → PostgreSQL (DB EC2) |
| Auto Scaling | Backend ASG with min=1, desired=1, max=3 |
| Health Checks | `/health` endpoint checks DB connectivity; ALB uses this |
| Self-Healing | Terminate an instance → ASG launches new one → clones latest code automatically |
| Scaling Policies | CPU > 60% scale out, < 30% scale in |
| CI/CD Ready | Every new instance clones latest GitHub code on boot (auto-deployment) |
| Blue/Green | Explained in architecture doc using two target groups |

## Next Steps for CI/CD (Advanced)
Once this works, add `.github/workflows/deploy.yml` to automate artifact upload to S3 and trigger ASG Instance Refresh.
