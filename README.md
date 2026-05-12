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

## 画像アップロードの動作確認

### iPhone の HEIC ファイルをアップロードする場合

iPhone で撮影した画像は HEIC 形式で保存されているが、本アプリでは `heic2any` ライブラリで自動的に JPG に変換してからアップロードする。

1. メモ作成・編集画面の「+ 画像追加」をタップ
2. iPhone のカメラロールから HEIC 画像を選択
3. 「処理中… HEIC変換・圧縮中…」と表示されるので完了まで待つ
4. サムネが表示されれば変換・アップロード成功

### 画像が表示されない場合のトラブルシューティング

**サムネが表示されない（空白またはエラー画像になる）**

- Supabase ダッシュボード → Storage → `libro-images` バケットの Policies タブを開き、4 つの RLS ポリシー（SELECT / INSERT / UPDATE / DELETE）が設定されているか確認する
- `supabase/README.md` のステップ2の手順に従い GUI でポリシーを設定する

**Image Transformation の URL が機能しない**

- Supabase Pro プランが有効であることを確認する（Image Transformation は Pro プラン以上が必要）
- Supabase ダッシュボード → Storage → Transform images が有効になっているか確認する
- サムネ表示に失敗する場合でも、モーダルでは原寸 URL（Transform なし）で表示されるため動作確認可能

**アップロードはできるが Storage に保存されない**

- ブラウザの開発者ツール → Network タブで `upload` リクエストのレスポンスを確認する
- RLS ポリシーの `USING` 式でパスの第1セグメントがユーザー ID と一致しているか確認する
