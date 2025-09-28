variable "project_id" {
  description = "GCPプロジェクトID"
  type        = string
}

variable "region" {
  description = "デプロイするリージョン"
  type        = string
  default     = "asia-northeast1" # 東京リージョン（コスト効率が良い）
}

variable "environment" {
  description = "環境名 (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "min_instances" {
  description = "Cloud Runの最小インスタンス数（コスト最適化のため0に設定）"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Cloud Runの最大インスタンス数"
  type        = number
  default     = 10
}

variable "cpu_limit" {
  description = "CPU制限"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "メモリ制限"
  type        = string
  default     = "512Mi"
}

variable "database_tier" {
  description = "Cloud SQLのマシンタイプ（コスト最適化）"
  type        = string
  default     = "db-f1-micro" # 最小構成
}