# データベースインスタンス用のランダムID生成
resource "random_id" "db_name_suffix" {
  byte_length = 4
}

# Cloud SQL for PostgreSQL（コスト最適化設定）
resource "google_sql_database_instance" "postgres" {
  name                = "${local.app_name}-db-${random_id.db_name_suffix.hex}"
  database_version    = "POSTGRES_15"
  region              = var.region
  deletion_protection = false # 開発環境では削除可能にする
  
  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier                        = var.database_tier
    availability_type          = "ZONAL"           # コスト削減のためシングルゾーン
    disk_type                  = "PD_SSD"
    disk_size                  = 10                # 最小ディスクサイズ
    disk_autoresize           = true
    disk_autoresize_limit     = 20                # オートリサイズの上限

    backup_configuration {
      enabled    = false                          # コスト削減のためバックアップ無効
      start_time = "02:00"
    }

    maintenance_window {
      day          = 7    # 日曜日
      hour         = 3    # 午前3時
      update_track = "stable"
    }

    ip_configuration {
      ipv4_enabled                                  = false  # パブリックIPを無効化
      private_network                              = google_compute_network.vpc.id
      enable_private_path_for_google_cloud_services = true
    }

    # コスト最適化の設定
    pricing_plan = "PER_USE"                      # 使用量ベース課金
    
    # ラベル設定（settingsブロック内でuser_labelsを使用）
    user_labels = local.labels
  }
}

# データベース作成
resource "google_sql_database" "database" {
  name     = local.app_name
  instance = google_sql_database_instance.postgres.name
}

# データベースユーザー作成
resource "google_sql_user" "user" {
  name     = "app_user"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# データベースパスワード生成
resource "random_password" "db_password" {
  length  = 32
  special = true
}