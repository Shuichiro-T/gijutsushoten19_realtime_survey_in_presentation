# フロントエンド用Dockerfile（本番環境最適化）
# ビルド段階
FROM node:24-alpine as builder

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install && npm cache clean --force

# ソースコードをコピー
COPY . .

# プロダクションビルドを実行
RUN npm run build

# 本番段階：Nginxを使用した軽量なイメージ
FROM nginx:alpine

# ビルドされたファイルをNginxのドキュメントルートにコピー
COPY --from=builder /app/build /usr/share/nginx/html

# Nginxの設定ファイルをコピー（SPAルーティング対応）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 環境変数注入スクリプトをコピー
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ポート3000を公開（Cloud Run対応）
EXPOSE 3000

# エントリーポイントスクリプトを実行
CMD ["/entrypoint.sh"]