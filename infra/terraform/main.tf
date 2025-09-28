# Google Cloud Provider設定
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 基本設定
locals {
  app_name = "realtime-survey"
  labels = {
    app         = local.app_name
    environment = var.environment
    managed-by  = "terraform"
  }
}