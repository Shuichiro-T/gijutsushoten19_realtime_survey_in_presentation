# Artifact Registry リポジトリ
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = local.app_name
  description   = "Docker repository for ${local.app_name}"
  format        = "DOCKER"

  labels = local.labels
}

# バックエンドのCloud Runサービス
resource "google_cloud_run_v2_service" "backend" {
  name     = "${local.app_name}-backend"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/backend:latest"

      ports {
        container_port = 3001
      }

      env {
        name  = "PORT"
        value = "3001"
      }

      env {
        name  = "FRONTEND_URL"
        value = google_cloud_run_v2_service.frontend.uri
      }

      env {
        name  = "DATABASE_URL"
        value = "postgresql://${google_sql_user.user.name}:${random_password.db_password.result}@${google_sql_database_instance.postgres.public_ip_address}:5432/${google_sql_database.database.name}"
      }

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
        cpu_idle = true
        startup_cpu_boost = false
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    # コスト最適化: リクエストがない場合はインスタンスを0に
    max_instance_request_concurrency = 100
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  labels = local.labels
}

# フロントエンドのCloud Runサービス
resource "google_cloud_run_v2_service" "frontend" {
  name     = "${local.app_name}-frontend"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/frontend:latest"

      ports {
        container_port = 3000
      }

      env {
        name  = "REACT_APP_BACKEND_URL"
        value = google_cloud_run_v2_service.backend.uri
      }

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
        cpu_idle = true
        startup_cpu_boost = false
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    max_instance_request_concurrency = 100
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  labels = local.labels
}

# IAM設定: 一般公開アクセス許可
resource "google_cloud_run_v2_service_iam_binding" "backend_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}

resource "google_cloud_run_v2_service_iam_binding" "frontend_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.frontend.location
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}