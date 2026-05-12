# Libro - 読書メモアプリ

本・読書記録・メモを管理するシンプルな Web アプリ。

## 技術スタック

- React + Vite
- Supabase（認証・DB・Storage）
- Tailwind CSS
- React Router v7

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定（Ninfee と同じ値を使用）
cp .env.example .env.local
# .env.local を開き VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を Ninfee と同じ値で設定

# 開発サーバー起動
npm run dev
```

## アクセス

http://localhost:5173 にアクセスし、Google アカウントでログイン。

## 環境変数

`.env.local` を作成して Ninfee と同じ値を設定すること（`.env.example` を参照）。

| 変数名 | 説明 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
