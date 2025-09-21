# リアルタイムアンケートシステム - バックエンド

MVPバックエンドAPIサーバーです。5択アンケートをリアルタイムで管理・表示する機能を提供します。

## 機能概要

- **イベント管理**: 12桁ランダムIDによるイベント作成・管理
- **アンケート管理**: 12桁ランダムIDによるアンケート作成・取得
- **5択対応**: 選択肢数は可変で設定可能
- **リアルタイム通信**: Socket.ioによる即座の結果更新
- **回答管理**: 匿名回答の収集・集計

## 技術スタック

- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **Security**: Helmet, CORS

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して以下を設定：

```
DATABASE_URL="postgresql://username:password@localhost:5432/realtime_survey"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

### 3. データベースのセットアップ

```bash
# Prismaクライアントの生成
npm run generate

# マイグレーションの実行
npm run migrate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

サーバーは http://localhost:3001 で起動します。

## API エンドポイント

### イベント管理

#### イベント作成
```
POST /api/surveys/events
Content-Type: application/json

{
  "title": "イベント名"
}
```

### アンケート管理

#### アンケート作成
```
POST /api/surveys
Content-Type: application/json

{
  "eventId": "12桁のイベントID",
  "title": "アンケートタイトル",
  "question": "質問内容",
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5"]
}
```

#### イベントのアンケート一覧取得
```
GET /api/surveys/events/:eventId/surveys
```

#### アンケート取得
```
GET /api/surveys/events/:eventId/surveys/:surveyId
```

#### アンケート結果取得
```
GET /api/surveys/events/:eventId/surveys/:surveyId/results
```

### 回答管理

#### 回答送信
```
POST /api/surveys/responses
Content-Type: application/json

{
  "eventId": "12桁のイベントID",
  "surveyId": "12桁のアンケートID",
  "optionId": "選択肢ID",
  "userToken": "ユーザートークン（オプション）"
}
```

## Socket.io イベント

### クライアント → サーバー

- `join-survey`: アンケートの部屋に参加
- `leave-survey`: アンケートの部屋から退出
- `submit-response`: 回答送信

### サーバー → クライアント

- `survey-results`: アンケート結果の更新
- `response-submitted`: 回答送信完了
- `error`: エラー通知

## 使用例

### リアルタイム接続

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// アンケートの部屋に参加
socket.emit('join-survey', {
  eventId: 'abcd1234efgh',
  surveyId: 'wxyz5678ijkl'
});

// 結果の受信
socket.on('survey-results', (results) => {
  console.log('アンケート結果:', results);
});

// 回答送信
socket.emit('submit-response', {
  eventId: 'abcd1234efgh',
  surveyId: 'wxyz5678ijkl',
  optionId: 'option-id-123',
  userToken: 'user-token-456'
});
```

## プロジェクト構造

```
backend/
├── src/
│   ├── database/
│   │   └── client.ts          # Prismaクライアント
│   ├── routes/
│   │   └── surveys.ts         # アンケートAPI
│   ├── socket/
│   │   └── handlers.ts        # WebSocketハンドラー
│   ├── utils/
│   │   └── idGenerator.ts     # ID生成ユーティリティ
│   └── index.ts               # メインアプリケーション
├── prisma/
│   └── schema.prisma          # データベーススキーマ
├── package.json
├── tsconfig.json
└── README.md
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# Prismaクライアント生成
npm run generate

# マイグレーション実行
npm run migrate
```

## ヘルスチェック

```
GET /health
```

サーバーの状態確認用エンドポイントです。