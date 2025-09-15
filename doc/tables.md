# テーブル構成

永続化するデータの構成について記載します。
現在実装されているPrismaスキーマに基づくテーブル定義を以下に示します。

## イベント関連テーブル

### events（イベントテーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | String (CUID) | NOT NULL | PK | イベント内部ID |
| event_id | String | NOT NULL | UK | イベント識別子 |
| title | String | NULL | - | イベントタイトル |
| created_at | DateTime | NOT NULL | - | 作成日時 |
| updated_at | DateTime | NOT NULL | - | 更新日時 |

**リレーション:**
- 1つのEventは複数のSurveyを持つ（1対多）

## アンケート関連テーブル

### surveys（アンケートテーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | String (CUID) | NOT NULL | PK | アンケート内部ID |
| survey_id | String | NOT NULL | UK | アンケート識別子 |
| event_id | String | NOT NULL | FK | イベント識別子 |
| title | String | NOT NULL | - | アンケートタイトル |
| question | String | NOT NULL | - | アンケート質問文 |
| created_at | DateTime | NOT NULL | - | 作成日時 |
| updated_at | DateTime | NOT NULL | - | 更新日時 |

**リレーション:**
- 1つのSurveyは1つのEventに属する（多対1）
- 1つのSurveyは複数のSurveyOptionを持つ（1対多）
- 1つのSurveyは複数のResponseを持つ（1対多）

### survey_options（アンケート選択肢テーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | String (CUID) | NOT NULL | PK | 選択肢内部ID |
| survey_id | String | NOT NULL | FK | アンケート識別子 |
| text | String | NOT NULL | - | 選択肢テキスト |
| order | Integer | NOT NULL | - | 表示順序 |

**リレーション:**
- 1つのSurveyOptionは1つのSurveyに属する（多対1）
- 1つのSurveyOptionは複数のResponseを持つ（1対多）

### responses（回答テーブル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| id | String (CUID) | NOT NULL | PK | 回答内部ID |
| survey_id | String | NOT NULL | FK | アンケート識別子 |
| survey_option_id | String | NOT NULL | FK | 選択肢内部ID |
| user_token | String | NULL | - | ユーザー識別トークン |
| submitted_at | DateTime | NOT NULL | - | 回答日時 |

**リレーション:**
- 1つのResponseは1つのSurveyに属する（多対1）
- 1つのResponseは1つのSurveyOptionに属する（多対1）

## インデックス設計

### 実装されているユニークインデックス
- events.event_id（イベント識別子による検索用）
- surveys.survey_id（アンケート識別子による検索用）

### パフォーマンス向上のための推奨インデックス
- surveys.event_id（イベント別アンケート検索用）
- survey_options.survey_id（アンケート別選択肢検索用）
- responses.survey_id（アンケート別回答検索用）
- responses.survey_option_id（選択肢別回答検索用）
- responses.submitted_at（時系列分析用）
- responses.user_token（ユーザー別回答検索用）

## ER図

```
[Event] ||--o{ [Survey] : 1つのイベントに複数のアンケート
[Survey] ||--o{ [SurveyOption] : 1つのアンケートに複数の選択肢
[Survey] ||--o{ [Response] : 1つのアンケートに複数の回答
[SurveyOption] ||--o{ [Response] : 1つの選択肢に複数の回答
```

## 備考

- IDフィールドはすべてCUID（Collision-resistant Unique IDentifier）を使用
- PostgreSQLデータベースを使用
- リアルタイムアンケートシステムに特化したシンプルな構成
- ユーザー認証は現在未実装（user_tokenによる簡易識別のみ）