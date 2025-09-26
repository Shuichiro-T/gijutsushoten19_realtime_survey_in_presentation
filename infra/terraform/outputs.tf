output "project_id" {
  description = "GCPプロジェクトID"
  value       = var.project_id
}

output "region" {
  description = "デプロイリージョン"
  value       = var.region
}

output "frontend_url" {
  description = "フロントエンドURL"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "backend_url" {
  description = "バックエンドURL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "database_host" {
  description = "データベースのホスト"
  value       = google_sql_database_instance.postgres.public_ip_address
}

output "database_name" {
  description = "データベース名"
  value       = google_sql_database.database.name
}

output "database_user" {
  description = "データベースユーザー名"
  value       = google_sql_user.user.name
}

output "database_password" {
  description = "データベースパスワード"
  value       = random_password.db_password.result
  sensitive   = true
}

output "artifact_registry_repo" {
  description = "Artifact Registryリポジトリ名"
  value       = google_artifact_registry_repository.repo.name
}

output "docker_repo_url" {
  description = "DockerイメージのリポジトリURL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}