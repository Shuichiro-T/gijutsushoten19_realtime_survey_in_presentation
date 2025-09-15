# リアルタイムアンケートシステム

アンケートをリアルタイムで表示しつつプレゼンテーションをするためのシステムです。

## 機能概要

- **リアルタイムアンケート**: 5択アンケートのリアルタイム作成・回答・表示
- **イベント管理**: 12桁ランダムIDによるイベント管理
- **匿名回答**: ユーザー登録なしでの匿名回答対応
- **即座の結果表示**: WebSocketによる回答結果のリアルタイム更新

## 技術スタック

- **フロントエンド**: React.js + TypeScript
- **バックエンド**: Node.js + Express.js + TypeScript
- **データベース**: PostgreSQL + Prisma ORM
- **リアルタイム通信**: Socket.io
- **開発環境**: Docker + Docker Compose

## クイックスタート

### 1. 環境の起動

```bash
# プロジェクトをクローン
git clone <repository-url>
cd gijutsushoten19_realtime_survey_in_presentation

# Docker環境で全サービス起動
docker-compose up --build
```

### 2. 初期設定

```bash
# バックエンドコンテナに入る
docker-compose exec backend sh

# データベースマイグレーション
npm run migrate
```

### 3. アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001
- **ヘルスチェック**: http://localhost:3001/health

## ディレクトリ構成

| ディレクトリ | 内容 |
| ---- | ---- |
| ./frontend | フロントエンド側のコード（React.js） |
| ./backend | バックエンド側のコード（Node.js + Express.js） |
| ./infra | 開発環境や実行環境の定義 |
| ./doc | システムの設計ドキュメント |

## 開発ガイド

### バックエンド開発

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

詳細は [backend/README.md](./backend/README.md) を参照してください。

### フロントエンド開発

```bash
cd frontend
npm install
npm start
```

詳細は [frontend/README.md](./frontend/README.md) を参照してください。

## API ドキュメント

### 基本的な使用フロー

1. **イベント作成**: `POST /api/surveys/events`
2. **アンケート作成**: `POST /api/surveys`
3. **リアルタイム接続**: Socket.io接続でアンケートの部屋に参加
4. **回答送信**: `POST /api/surveys/responses` または Socket.ioイベント
5. **結果取得**: リアルタイムで結果が配信される

詳細なAPIドキュメントは [backend/README.md](./backend/README.md) を参照してください。
