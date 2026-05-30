# Bank Run

多人挤兑博弈网页游戏：点击银行提现，在爆炸前取光或信任银行撑到最后。

## 技术栈

- 前端：React + Vite
- 后端：Vercel Serverless Functions（`/api`）
- 数据库：Supabase（PostgreSQL，存储全局游戏状态）

## 本地开发

### 1. 创建 Supabase 项目

1. 打开 [Supabase](https://supabase.com) 并新建项目
2. 进入 **SQL Editor**，执行 [`supabase/migrations/001_global_game.sql`](supabase/migrations/001_global_game.sql)
3. 在 **Project Settings → API** 复制：
   - Project URL → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`（仅用于服务端，不要暴露到前端）

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填入 Supabase 凭证：

```bash
cp .env.example .env.local
```

### 3. 启动

```bash
npm install
npm run dev
```

- 前端：http://localhost:5173
- API：http://localhost:3001（Vite 已代理 `/api`）

## 部署到 Vercel

1. 将仓库推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 在 **Environment Variables** 中添加：
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - （可选）`EXPLOSION_CLICK_THRESHOLD`、`VISITOR_THRESHOLD`
4. 部署完成后，公网用户可通过 Vercel 域名访问

部署后 API 与前端同域，例如 `https://your-app.vercel.app/api/join`，无需再配置 localhost。

## 游戏规则

- 每人初始 $100，每次点击提现 $10
- 全站提现超过阈值 → 银行爆炸（账户仍有余额者死亡）
- 访问人数达到阈值且未爆炸 → 从未提现者存活
- 每轮结束后 10 秒自动开启新一轮

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发（前端 + API） |
| `npm run build` | 构建前端 |
| `npm run dev:kill` | 清理占用的本地端口 |
