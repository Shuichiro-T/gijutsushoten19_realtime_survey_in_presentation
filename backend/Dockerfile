FROM node:24-alpine

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール（ビルドのためdevDependenciesも含める）
RUN npm install && npm cache clean --force

# アプリケーションファイルをコピー
COPY . .

# Prismaクライアントを生成
RUN npx prisma generate

# TypeScriptをビルド
RUN npm run build

# プロダクション用の依存関係のみに削減
RUN npm prune --production

# ポート3001を公開
EXPOSE 3001

# 非rootユーザーでアプリケーションを実行
USER node

# アプリケーションを起動
CMD ["npm", "start"]