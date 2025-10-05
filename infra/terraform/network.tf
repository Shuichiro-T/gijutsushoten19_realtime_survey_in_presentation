# VPCネットワーク作成
resource "google_compute_network" "vpc" {
  name                    = "${local.app_name}-vpc"
  auto_create_subnetworks = false
  
  labels = local.labels
}

# サブネット作成
resource "google_compute_subnetwork" "subnet" {
  name          = "${local.app_name}-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
  
  # Cloud Runのアウトバウンド接続のためのプライベートGoogleアクセス有効化
  private_ip_google_access = true
}

# VPCコネクタ作成（Cloud RunがVPCに接続するため）
resource "google_vpc_access_connector" "connector" {
  name          = "${local.app_name}-connector"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
  
  min_instances = 2
  max_instances = 3
}

# Cloud SQLプライベート接続用のプライベートIP割り当て
resource "google_compute_global_address" "private_ip_address" {
  name          = "${local.app_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

# Cloud SQLへのプライベート接続設定
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}