#!/bin/bash

# Google Cloud デプロイスクリプト
set -e

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 設定ファイルの読み込み
if [ ! -f "terraform/terraform.tfvars" ]; then
    echo -e "${RED}Error: terraform/terraform.tfvars が見つかりません。${NC}"
    echo "terraform.tfvars.example をコピーして設定してください。"
    exit 1
fi

# プロジェクトIDの取得
PROJECT_ID=$(grep 'project_id' terraform/terraform.tfvars | cut -d '"' -f 2)
REGION=$(grep 'region' terraform/terraform.tfvars | cut -d '"' -f 2)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: PROJECT_ID が設定されていません。${NC}"
    exit 1
fi

echo -e "${GREEN}=== リアルタイムアンケートシステム GCPデプロイ ===${NC}"
echo "プロジェクト: $PROJECT_ID"
echo "リージョン: $REGION"
echo ""

# Google Cloud CLIの認証確認
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
    echo -e "${RED}Error: Google Cloud CLIにログインしていません。${NC}"
    echo "gcloud auth login を実行してください。"
    exit 1
fi

# プロジェクトの設定
echo -e "${YELLOW}Google Cloudプロジェクトを設定中...${NC}"
gcloud config set project $PROJECT_ID

# 必要なAPIの有効化
echo -e "${YELLOW}必要なAPIを有効化中...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Terraformのインフラ構築
echo -e "${YELLOW}Terraformでインフラを構築中...${NC}"
cd terraform

# Terraform初期化
terraform init

# インフラの計画
terraform plan

# インフラの適用
echo -e "${YELLOW}インフラを適用しますか？ (y/n)${NC}"
read -r response
if [ "$response" = "y" ] || [ "$response" = "yes" ]; then
    terraform apply -auto-approve
else
    echo "デプロイを中止しました。"
    exit 1
fi

# Terraformのアウトプットを取得
DOCKER_REPO=$(terraform output -raw docker_repo_url)
FRONTEND_URL=$(terraform output -raw frontend_url)
BACKEND_URL=$(terraform output -raw backend_url)

cd ..

# Docker認証設定
echo -e "${YELLOW}Artifact Registryの認証を設定中...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Dockerイメージのビルド・プッシュ
echo -e "${YELLOW}バックエンドのDockerイメージをビルド・プッシュ中...${NC}"
docker build -t ${DOCKER_REPO}/backend:latest ../backend/
docker push ${DOCKER_REPO}/backend:latest

echo -e "${YELLOW}フロントエンドのDockerイメージをビルド・プッシュ中...${NC}"
docker build -t ${DOCKER_REPO}/frontend:latest ../frontend/
docker push ${DOCKER_REPO}/frontend:latest

# Cloud Runサービスの更新（Terraformで作成済みのサービスにデプロイ）
echo -e "${YELLOW}Cloud Runサービスを更新中...${NC}"
gcloud run services update realtime-survey-backend \
    --image=${DOCKER_REPO}/backend:latest \
    --region=$REGION

gcloud run services update realtime-survey-frontend \
    --image=${DOCKER_REPO}/frontend:latest \
    --region=$REGION

# データベースマイグレーション
echo -e "${YELLOW}データベースマイグレーションを実行中...${NC}"
# マイグレーション用のCloud Runジョブを一時的に作成して実行
DATABASE_URL=$(cd terraform && terraform output -raw database_password | sed 's/.*/"&"/')
gcloud run jobs create migration-job \
    --image=${DOCKER_REPO}/backend:latest \
    --region=$REGION \
    --set-env-vars="DATABASE_URL=postgresql://app_user:$(cd terraform && terraform output -raw database_password)@$(cd terraform && terraform output -raw database_host):5432/realtime-survey" \
    --command="npx" \
    --args="prisma,migrate,deploy"

gcloud run jobs execute migration-job --region=$REGION --wait

# ジョブの削除
gcloud run jobs delete migration-job --region=$REGION --quiet

echo -e "${GREEN}=== デプロイ完了 ===${NC}"
echo ""
echo -e "${GREEN}🌐 フロントエンドURL:${NC} $FRONTEND_URL"
echo -e "${GREEN}🚀 バックエンドURL:${NC} $BACKEND_URL"
echo ""
echo -e "${YELLOW}注意: 初回アクセス時はコールドスタートにより時間がかかる場合があります。${NC}"