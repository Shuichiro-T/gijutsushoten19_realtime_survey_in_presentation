# アーキテクチャ

本システムのアーキテクチャについて、インフラアーキテクチャとソフトウェアアーキテクチャに分けて記載します。

## インフラアーキテクチャ

### 利用クラウドサービス
- **パブリッククラウド**: AWS / Azure / GCP（選定予定）
- **コンテナオーケストレーション**: Kubernetes
- **データベース**: PostgreSQL（マネージドサービス）
- **キャッシュ**: Redis
- **CDN**: CloudFront / Azure CDN / Cloud CDN

### サービス構成
```
インターネット
    ↓
ロードバランサー
    ↓
Webサーバー（フロントエンド）
    ↓
APIサーバー（バックエンド）
    ↓
データベース・キャッシュ
```

### リアルタイム通信
- **WebSocket接続**: リアルタイムアンケートの双方向通信
- **Message Queue**: アンケート結果の非同期処理

## ソフトウェアアーキテクチャ

### フロントエンド
- **言語**: TypeScript
- **フレームワーク**: React.js / Vue.js（選定予定）
- **状態管理**: Redux / Pinia
- **リアルタイム通信**: Socket.io / WebSocket API
- **UI**: Material-UI / Vuetify

### バックエンド
- **言語**: Node.js (TypeScript) / Python / Go（選定予定）
- **フレームワーク**: Express.js / FastAPI / Gin
- **ORM**: Prisma / SQLAlchemy / GORM
- **WebSocket**: Socket.io / Gorilla WebSocket
- **認証**: JWT

### データベース
- **RDBMS**: PostgreSQL
- **NoSQL**: MongoDB（ログ・履歴用）
- **インメモリDB**: Redis（セッション・キャッシュ）

### 開発・運用
- **コンテナ**: Docker
- **CI/CD**: GitHub Actions
- **監視**: Prometheus + Grafana
- **ログ**: ELK Stack / Loki