# アーキテクチャ

本システムのアーキテクチャについて、実装済みの内容に基づいてインフラアーキテクチャとソフトウェアアーキテクチャに分けて記載します。

## インフラアーキテクチャ

### デプロイメント構成
- **コンテナ化**: Docker Compose
- **開発環境**: ローカル開発用Docker構成
- **データベース**: PostgreSQL（Docker コンテナ）

### サービス構成
```
クライアント
    ↓
フロントエンド (React, Port: 3000)
    ↓ (Proxy経由)
バックエンド (Express.js, Port: 3001)
    ↓
PostgreSQL (Docker Container)
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
- **コンテナ**: Docker + Docker Compose
- **開発環境**: ローカルマルチコンテナ構成
- **パッケージ管理**: npm
- **型安全性**: TypeScript (フロント・バック共通)