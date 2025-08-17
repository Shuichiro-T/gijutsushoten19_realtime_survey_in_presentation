# テーブル構成

永続化するデータの構成について記載します。

## ユーザー関連テーブル

### users（ユーザーテーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | SERIAL | NOT NULL | PK | ユーザーID |
| username | VARCHAR(50) | NOT NULL | UK | ユーザー名 |
| email | VARCHAR(255) | NOT NULL | UK | メールアドレス |
| password_hash | VARCHAR(255) | NOT NULL | - | パスワードハッシュ |
| role | ENUM('presenter', 'audience', 'admin') | NOT NULL | - | ユーザーロール |
| created_at | TIMESTAMP | NOT NULL | - | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | - | 更新日時 |

### sessions（セッションテーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | VARCHAR(255) | NOT NULL | PK | セッションID |
| user_id | INTEGER | NOT NULL | FK | ユーザーID |
| expires_at | TIMESTAMP | NOT NULL | - | 有効期限 |
| created_at | TIMESTAMP | NOT NULL | - | 作成日時 |

## プレゼンテーション関連テーブル

### presentations（プレゼンテーションテーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | SERIAL | NOT NULL | PK | プレゼンテーションID |
| title | VARCHAR(255) | NOT NULL | - | プレゼンテーションタイトル |
| presenter_id | INTEGER | NOT NULL | FK | プレゼンターID |
| status | ENUM('draft', 'active', 'completed') | NOT NULL | - | ステータス |
| start_time | TIMESTAMP | NULL | - | 開始時刻 |
| end_time | TIMESTAMP | NULL | - | 終了時刻 |
| access_code | VARCHAR(10) | NOT NULL | UK | アクセスコード |
| created_at | TIMESTAMP | NOT NULL | - | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | - | 更新日時 |

## アンケート関連テーブル

### surveys（アンケートテーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | SERIAL | NOT NULL | PK | アンケートID |
| presentation_id | INTEGER | NOT NULL | FK | プレゼンテーションID |
| title | VARCHAR(255) | NOT NULL | - | アンケートタイトル |
| description | TEXT | NULL | - | アンケート説明 |
| type | ENUM('multiple_choice', 'single_choice', 'text', 'rating') | NOT NULL | - | アンケート種別 |
| status | ENUM('draft', 'active', 'closed') | NOT NULL | - | ステータス |
| display_order | INTEGER | NOT NULL | - | 表示順序 |
| is_required | BOOLEAN | NOT NULL | - | 必須回答フラグ |
| created_at | TIMESTAMP | NOT NULL | - | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | - | 更新日時 |

### survey_options（アンケート選択肢テーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | SERIAL | NOT NULL | PK | 選択肢ID |
| survey_id | INTEGER | NOT NULL | FK | アンケートID |
| option_text | VARCHAR(500) | NOT NULL | - | 選択肢テキスト |
| display_order | INTEGER | NOT NULL | - | 表示順序 |
| created_at | TIMESTAMP | NOT NULL | - | 作成日時 |

### responses（回答テーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | SERIAL | NOT NULL | PK | 回答ID |
| survey_id | INTEGER | NOT NULL | FK | アンケートID |
| user_id | INTEGER | NULL | FK | ユーザーID（匿名の場合はNULL） |
| session_token | VARCHAR(255) | NULL | - | 匿名ユーザー識別トークン |
| response_data | JSONB | NOT NULL | - | 回答データ（JSON形式） |
| submitted_at | TIMESTAMP | NOT NULL | - | 回答日時 |
| updated_at | TIMESTAMP | NOT NULL | - | 更新日時 |

## ログ関連テーブル

### activity_logs（活動ログテーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | SERIAL | NOT NULL | PK | ログID |
| user_id | INTEGER | NULL | FK | ユーザーID |
| action | VARCHAR(100) | NOT NULL | - | アクション |
| resource_type | VARCHAR(50) | NOT NULL | - | リソース種別 |
| resource_id | INTEGER | NULL | - | リソースID |
| ip_address | INET | NULL | - | IPアドレス |
| user_agent | TEXT | NULL | - | ユーザーエージェント |
| created_at | TIMESTAMP | NOT NULL | - | 作成日時 |

### system_logs（システムログテーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | SERIAL | NOT NULL | PK | ログID |
| level | ENUM('debug', 'info', 'warning', 'error', 'critical') | NOT NULL | - | ログレベル |
| message | TEXT | NOT NULL | - | ログメッセージ |
| context | JSONB | NULL | - | 追加コンテキスト |
| created_at | TIMESTAMP | NOT NULL | - | 作成日時 |

## インデックス設計

### パフォーマンス向上のためのインデックス
- users.email（ユーザー検索用）
- sessions.user_id（セッション管理用）
- presentations.presenter_id（プレゼンター別検索用）
- presentations.access_code（アクセスコード検索用）
- surveys.presentation_id（プレゼンテーション別アンケート検索用）
- responses.survey_id（アンケート別回答検索用）
- responses.submitted_at（時系列分析用）
- activity_logs.user_id（ユーザー別ログ検索用）
- activity_logs.created_at（時系列ログ検索用）