# インフラストラクチャドキュメント

## 概要

リアルタイムアンケートシステムのインフラストラクチャは、Google Cloud Platform (GCP) 上に構築されており、セキュリティとコスト効率を重視した設計となっています。

## アーキテクチャ

### 全体構成

```
インターネット
    ↓
[Cloud Load Balancer] (HTTP/HTTPS)
    ↓
[Cloud Run Services] (Frontend & Backend)
    ↓ (VPC Connector)
[VPC Network] (Private)
    ↓ (Private IP)
[Cloud SQL PostgreSQL] (Private)
```

### セキュリティ設計

#### ネットワークセキュリティ

1. **VPCネットワーク分離**
   - 専用VPCネットワーク (`realtime-survey-vpc`) を作成
   - サブネット: `10.0.0.0/24` 
   - プライベートGoogleアクセス有効化

2. **データベースセキュリティ**
   - **プライベートIP接続のみ**: パブリックIPアクセスを完全に無効化
   - **VPCピアリング**: Cloud SQLはVPCネットワーク経由でのみアクセス可能
   - **認証ネットワークなし**: インターネットからの直接アクセスを遮断

3. **Cloud Runセキュリティ**
   - **VPCコネクタ**: Cloud RunサービスをVPCネットワークに接続
   - **エグレス制限**: プライベート範囲のみへの送信を許可 (`PRIVATE_RANGES_ONLY`)
   - **プライベート通信**: データベースとの通信は完全にプライベート

#### アクセス制御

- **データベースアクセス**: バックエンドCloud Runサービスからのみ接続可能
- **外部アクセス**: フロントエンドとバックエンドサービスは引き続きインターネットからアクセス可能

## リソース構成

### ネットワークリソース

| リソース | 名前 | 用途 |
|----------|------|------|
| VPC Network | `realtime-survey-vpc` | メインネットワーク |
| Subnet | `realtime-survey-subnet` | Cloud Runサブネット |
| VPC Connector | `realtime-survey-connector` | Cloud Run-VPC接続 |
| Private IP Range | `realtime-survey-private-ip` | Cloud SQL用プライベートIP |

### コンピューティングリソース

| リソース | 名前 | 構成 |
|----------|------|------|
| Cloud Run Backend | `realtime-survey-backend` | 1 vCPU, 512MB, VPC接続 |
| Cloud Run Frontend | `realtime-survey-frontend` | 1 vCPU, 512MB |

### データベースリソース

| リソース | 名前 | 構成 |
|----------|------|------|
| Cloud SQL | `realtime-survey-db-*` | PostgreSQL 15, db-f1-micro, プライベートIP |

## セキュリティ対策の詳細

### 実装されたセキュリティ機能

1. **データベース分離**
   ```hcl
   ip_configuration {
     ipv4_enabled    = false  # パブリックIP無効化
     private_network = google_compute_network.vpc.id
   }
   ```

2. **VPC接続制限**
   ```hcl
   vpc_access {
     connector = google_vpc_access_connector.connector.id
     egress    = "PRIVATE_RANGES_ONLY"
   }
   ```

3. **ネットワーク分離**
   - Cloud SQLはVPC内のプライベートIP (`10.0.0.0/16` 範囲) でのみアクセス可能
   - サービス間通信はGoogleバックボーンネットワーク経由

### セキュリティ監査

以下の受け入れ基準を満たしています：

- ✅ データベースへの接続がバックエンド以外から行えないこと
- ✅ インターネットから直接データベースにアクセスできないこと
- ✅ 全ての通信がプライベートネットワーク経由で行われること

## コスト最適化

### 設定済みコスト削減機能

1. **Cloud Run**
   - 最小インスタンス数: 0 (使用時のみ課金)
   - CPU制限: 1 vCPU
   - メモリ制限: 512MB
   - CPU idle課金削減

2. **Cloud SQL**
   - マシンタイプ: db-f1-micro
   - 課金モデル: 使用量ベース (PER_USE)
   - 可用性: シングルゾーン (ZONAL)
   - バックアップ: 無効 (開発環境)

3. **VPCコネクタ**
   - 最小インスタンス: 2
   - 最大インスタンス: 3

## 運用考慮事項

### デプロイメント

1. 新しいネットワークリソースが追加されたため、初回デプロイ時は追加時間が必要
2. VPCピアリング設定により、Cloud SQLインスタンス作成に5-10分程度要する場合があります

### モニタリング

- Cloud Runサービスログ
- Cloud SQLプライベート接続ステータス
- VPCコネクタ使用状況

### トラブルシューティング

1. **データベース接続エラー**
   - VPCコネクタのステータス確認
   - プライベートIP接続の確認
   - データベース認証情報の確認

2. **ネットワーク接続問題**
   - VPCピアリング状況の確認
   - サブネット設定の確認

## 将来の改善案

1. **追加セキュリティ**
   - IAMベースのデータベース認証
   - Cloud Armorによる DDoS 保護
   - VPC Flow Logsによる監査ログ

2. **パフォーマンス**
   - Cloud CDN導入
   - Redis Cache追加

3. **可用性**
   - マルチリージョン展開
   - Cloud SQL高可用性構成