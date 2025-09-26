# アーキテクチャ

本システムのアーキテクチャについて、実装済みの内容に基づいてインフラアーキテクチャとソフトウェアアーキテクチャに分けて記載します。

## インフラアーキテクチャ

### デプロイメント構成
- **開発環境**: Docker Compose によるローカル開発
- **本番環境**: Google Cloud Platform（GCP）
  - **コンテナオーケストレーション**: Cloud Run
  - **データベース**: Cloud SQL for PostgreSQL
  - **コンテナレジストリ**: Artifact Registry
  - **Infrastructure as Code**: Terraform

### サービス構成

#### 開発環境
```
クライアント
    ↓
フロントエンド (React, Port: 3000)
    ↓ (Proxy経由)
バックエンド (Express.js, Port: 3001)
    ↓
PostgreSQL (Docker Container)
```

#### 本番環境（GCP）
```
インターネット
    ↓
Cloud Run (Frontend)
    ↓ (HTTPS)
Cloud Run (Backend)
    ↓
Cloud SQL for PostgreSQL
```

### リアルタイム通信
- **WebSocket接続**: Socket.io によるリアルタイム通信基盤
- **RESTful API**: アンケートデータの CRUD 操作
- **ポーリング**: 5秒間隔でのリアルタイムアンケート結果更新

## ソフトウェアアーキテクチャ

### フロントエンド
- **言語**: TypeScript
- **フレームワーク**: React.js (v18.2.0)
- **ルーティング**: React Router v6
- **状態管理**: React Hooks (useState, useEffect)
- **HTTP通信**: Fetch API
- **スタイリング**: CSS Modules + CSS-in-JS
- **ビルドツール**: Create React App

### バックエンド
- **言語**: Node.js (TypeScript)
- **フレームワーク**: Express.js (v4.18.2)
- **ORM**: Prisma (v6.1.0)
- **WebSocket**: Socket.io (v4.7.5)
- **セキュリティ**: Helmet, CORS
- **開発ツール**: ts-node-dev (ホットリロード)

### データベース
- **RDBMS**: PostgreSQL
- **ORM**: Prisma Client
- **マイグレーション**: Prisma Migrate
- **スキーマ管理**: Prisma Schema

### 開発・運用
- **開発環境**: Docker + Docker Compose（ローカル）
- **本番環境**: Google Cloud Platform
  - **IaC**: Terraform による自動構築
  - **CI/CD**: Google Cloud Build（推奨）
  - **コンテナ**: 軽量化されたマルチステージビルド
  - **スケーリング**: Cloud Run オートスケーリング
- **パッケージ管理**: npm
- **型安全性**: TypeScript (フロント・バック共通)

## クラウド環境の特徴

### コスト最適化
- **Cloud Run**: 最小インスタンス数0（使用時のみ課金）
- **Cloud SQL**: PER_USE課金モデル + 最小構成
- **リージョン**: asia-northeast1（東京）でレイテンシ最適化

### セキュリティ
- **ネットワーク**: HTTPS通信の強制
- **認証**: Google Cloud IAM
- **環境変数**: 機密情報の安全な管理

### 可用性・パフォーマンス
- **オートスケーリング**: Cloud Run による自動スケール
- **CDN**: 静的コンテンツの高速配信（Nginx + gzip圧縮）
- **ヘルスチェック**: 自動化されたサービス監視