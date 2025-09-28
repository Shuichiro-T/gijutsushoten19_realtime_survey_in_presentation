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
        name  = "FRONTEND_URL"
        value = "https://placeholder-frontend-url"
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
        value = "https://placeholder-backend-url"
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

# サービス作成後に正しい環境変数を設定するためのnull_resource
resource "null_resource" "update_service_urls" {
  depends_on = [
    google_cloud_run_v2_service.backend,
    google_cloud_run_v2_service.frontend,
    google_cloud_run_v2_service_iam_binding.backend_public,
    google_cloud_run_v2_service_iam_binding.frontend_public
  ]

  # サービスURLが変更されるたびに再実行
  triggers = {
    frontend_url = google_cloud_run_v2_service.frontend.uri
    backend_url  = google_cloud_run_v2_service.backend.uri
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "Updating backend service with frontend URL: ${google_cloud_run_v2_service.frontend.uri}"
      # バックエンドサービスの環境変数を更新
      gcloud run services update ${google_cloud_run_v2_service.backend.name} \
        --region=${var.region} \
        --update-env-vars=FRONTEND_URL=${google_cloud_run_v2_service.frontend.uri},NODE_ENV=production \
        --project=${var.project_id}

      echo "Updating frontend service with backend URL: ${google_cloud_run_v2_service.backend.uri}"
      # フロントエンドサービスの環境変数を更新
      gcloud run services update ${google_cloud_run_v2_service.frontend.name} \
        --region=${var.region} \
        --update-env-vars=REACT_APP_BACKEND_URL=${google_cloud_run_v2_service.backend.uri} \
        --project=${var.project_id}
      
      echo "Services updated successfully!"
    EOT
  }

  # サービスが削除される際は何もしない
  provisioner "local-exec" {
    when    = destroy
    command = "echo 'Services being destroyed, no cleanup needed'"
  }
}