# Node.js の公式イメージを使用
FROM node:18

# 作業ディレクトリを設定
WORKDIR /app

# package.json をコピーして依存関係をインストール
COPY package.json package-lock.json ./
RUN npm install

# 残りのコードをコピー
COPY . .

# ポートを開放
EXPOSE 80

# アプリを起動
CMD ["node", "server.js"]
