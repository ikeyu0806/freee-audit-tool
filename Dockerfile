FROM node:20

WORKDIR /app

# ① 依存ファイルを先にコピー（キャッシュ効かせる）
COPY package.json package-lock.json ./

RUN npm install

# ② Prisma schema をコピー
COPY prisma ./prisma

# ③ Linux環境でPrisma Client生成
RUN npx prisma generate

# ④ 残りのソースコードをコピー
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
