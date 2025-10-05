# インフラストラクチャ・デプロイガイド

このディレクトリには、リアルタイムアンケートシステムをGoogle Cloud Platform（GCP）にデプロイするための Infrastructure as Code (IaC) と関連ドキュメントが含まれています。

## 前提条件

### 必要なツール
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) (gcloud)
- [Terraform](https://developer.hashicorp.com/terraform/downloads) (>= 1.0)
- [Docker](https://docs.docker.com/get-docker/)

### GCPの準備
1. GCPプロジェクトを作成
2. 課金アカウントを設定
3. Google Cloud CLIでログイン:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

## ディレクトリ構成

```
infra/
├── terraform/                # Terraformファイル
│   ├── main.tf               # プロバイダー設定
│   ├── variables.tf          # 変数定義
│   ├── database.tf           # Cloud SQL設定
│   ├── cloud-run.tf         # Cloud Run設定
│   ├── outputs.tf           # アウトプット定義
│   └── terraform.tfvars.example  # 設定例
├── deploy.sh                # 自動デプロイスクリプト
└── README.md                # このファイル
```

## デプロイ手順

### 1. 設定ファイルの準備

terraform.tfvars.exampleをコピーして設定:

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

terraform.tfvarsを編集:
```hcl
project_id = "your-gcp-project-id"
region     = "asia-northeast1"
environment = "dev"
```

### 2. 自動デプロイの実行

**推奨方法：** 自動デプロイスクリプトを使用

```bash
cd infra
chmod +x deploy.sh
./deploy.sh
```

このスクリプトが以下を自動実行します：
- 必要なGCP APIの有効化
- Terraformによるインフラ構築
- Dockerイメージのビルド・プッシュ
- Cloud Runサービスのデプロイ
- データベースマイグレーション

### 3. 手動デプロイ（詳細制御が必要な場合）

#### 3.1 必要なAPIの有効化
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

#### 3.2 Terraformでインフラ構築
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

#### 3.3 Dockerイメージのビルド・プッシュ
```bash
# 認証設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# Terraformアウトプットの取得
DOCKER_REPO=$(terraform output -raw docker_repo_url)

# バックエンドイメージ
docker build -t ${DOCKER_REPO}/backend:latest ../backend/
docker push ${DOCKER_REPO}/backend:latest

# フロントエンドイメージ
docker build -t ${DOCKER_REPO}/frontend:latest ../frontend/
docker push ${DOCKER_REPO}/frontend:latest
```

#### 3.4 Cloud Runサービスの更新
```bash
gcloud run services update realtime-survey-backend \
    --image=${DOCKER_REPO}/backend:latest \
    --region=asia-northeast1

gcloud run services update realtime-survey-frontend \
    --image=${DOCKER_REPO}/frontend:latest \
    --region=asia-northeast1
```

#### 3.5 データベースマイグレーション
```bash
# マイグレーション用の一時的なCloud Runジョブを作成・実行
DATABASE_URL="postgresql://app_user:$(terraform output -raw database_password)@$(terraform output -raw database_host):5432/realtime-survey"

gcloud run jobs create migration-job \
    --image=${DOCKER_REPO}/backend:latest \
    --region=asia-northeast1 \
    --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
    --command="npx" \
    --args="prisma,migrate,deploy"

gcloud run jobs execute migration-job --region=asia-northeast1 --wait
gcloud run jobs delete migration-job --region=asia-northeast1 --quiet
```

## コスト最適化の設定

このIaCは以下のコスト最適化を適用しています：

### Cloud Run設定
- **最小インスタンス数**: 0 （リクエストがない場合は課金されない）
- **CPU制限**: 1 vCPU
- **メモリ制限**: 512MB
- **CPU idle**: 有効（アイドル時のCPU課金を削減）

### Cloud SQL設定
- **マシンタイプ**: db-f1-micro（最小構成）
- **課金モデル**: PER_USE（使用量ベース）
- **可用性**: ZONAL（シングルゾーン）
- **バックアップ**: 無効（開発環境）
- **ディスクサイズ**: 10GB（最小）

### リージョン設定
- **デフォルトリージョン**: asia-northeast1（東京）

## セキュリティ考慮事項

### データベース
- パスワードはTerraformで自動生成
- 本番環境ではより厳しいネットワークアクセス制限を推奨

### Cloud Run
- 一般公開アクセス許可（allUsers）
- 本番環境ではIAMによるアクセス制御を検討

## トラブルシューティング

### よくある問題

1. **権限エラー**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

2. **APIが有効化されていない**
   ```bash
   gcloud services enable [API-NAME]
   ```

3. **Docker認証エラー**
   ```bash
   gcloud auth configure-docker asia-northeast1-docker.pkg.dev
   ```

4. **データベース接続エラー**
   - Cloud SQLインスタンスの公開IPが有効か確認
   - データベースユーザー・パスワードの確認
   - 正しいユーザー名が使用されているか確認（`app_user`が設定されている）
   - Cloud SQLのユーザー管理で想定外のユーザー（`administrator`等）が作成されていないか確認

### ログの確認
```bash
# Cloud Runのログ確認
gcloud logs read "resource.type=cloud_run_revision" --limit=50

# 特定のサービスのログ
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=realtime-survey-backend" --limit=50
```

## リソースの削除

**注意**: 以下のコマンドは全てのリソースを削除します。データは復元できません。

```bash
cd terraform
terraform destroy
```

## サポート

問題が発生した場合は、以下を確認してください：
- GCPの課金状況
- APIの有効化状況
- Cloud Runサービスのログ
- データベース接続状況