terraform {# Terraform configuration example for cloud deployment

  required_providers {terraform {

    render = {  required_providers {

      source  = "render-oss/render"    aws = {

      version = "~> 1.0"      source  = "hashicorp/aws"

    }      version = "~> 5.0"

  }    }

}  }

}

provider "render" {

  # API key will be set via environment variable RENDER_API_KEYprovider "aws" {

}  region = var.aws_region

}

# Backend Service

resource "render_web_service" "crm_backend" {# Variables

  name          = "crm-backend"variable "aws_region" {

  plan          = "starter"  description = "AWS region"

  region        = "oregon"  type        = string

  runtime       = "node"  default     = "us-east-1"

  build_command = "npm run build"}

  start_command = "npm run start:prod"

  variable "environment" {

  github_repo = {  description = "Environment name"

    url    = "https://github.com/your-username/crm-system"  type        = string

    branch = "main"  default     = "dev"

  }}

  

  environment_variables = {# Example resources

    NODE_ENV = "production"resource "aws_vpc" "crm_vpc" {

    DATABASE_URL = render_postgres.crm_db.connection_string  cidr_block           = "10.0.0.0/16"

    JWT_SECRET = "your-jwt-secret"  enable_dns_hostnames = true

    REDIS_URL = render_redis.crm_cache.connection_string  enable_dns_support   = true

  }

}  tags = {

    Name        = "crm-vpc-${var.environment}"

# Frontend Service    Environment = var.environment

resource "render_static_site" "crm_frontend" {  }

  name = "crm-frontend"}

  

  github_repo = {# RDS PostgreSQL instance

    url    = "https://github.com/your-username/crm-system"resource "aws_db_instance" "crm_postgres" {

    branch = "main"  identifier             = "crm-postgres-${var.environment}"

  }  engine                 = "postgres"

    engine_version         = "15"

  root_directory   = "frontend"  instance_class         = "db.t3.micro"

  build_command    = "npm run build"  allocated_storage      = 20

  publish_directory = "out"  storage_encrypted      = true

}  

  db_name  = "crm_${var.environment}"

# PostgreSQL Database  username = "postgres"

resource "render_postgres" "crm_db" {  password = "change-me-in-production"

  name   = "crm-database"  

  plan   = "starter"  vpc_security_group_ids = [aws_security_group.rds.id]

  region = "oregon"  

}  skip_final_snapshot = true

  

# Redis Cache  tags = {

resource "render_redis" "crm_cache" {    Name        = "crm-postgres-${var.environment}"

  name   = "crm-cache"    Environment = var.environment

  plan   = "starter"  }

  region = "oregon"}

}
# Security group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "crm-rds-${var.environment}"
  vpc_id      = aws_vpc.crm_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.crm_vpc.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "crm-rds-sg-${var.environment}"
    Environment = var.environment
  }
}