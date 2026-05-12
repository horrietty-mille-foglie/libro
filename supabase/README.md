# Libro - Supabase マイグレーション管理

このディレクトリには Supabase の DB スキーマ定義（マイグレーション SQL）を管理します。

## ファイル一覧

| ファイル | 内容 |
|---|---|
| `migrations/20260512_libro_init_schema.sql` | 第1-B: 初期スキーマ（7テーブル + RLS + Storage） |

---

## 第1-B マイグレーションの適用手順

### 実行前の確認事項

1. Supabase ダッシュボードの **Table Editor** を開き、`libro_` プレフィックスのテーブルが存在しないことを確認
2. **Storage** を開き、`libro-images` バケットが存在しないことを確認
3. Ninfee 由来の `update_updated_at_column()` 関数が既に存在することを確認（存在しない場合は Ninfee のマイグレーションを先に実行する）

### 適用手順

1. [Supabase ダッシュボード](https://supabase.com/dashboard) にログイン
2. プロジェクト **mille-foglie-law** を選択
3. 左メニューから **SQL Editor** を開く
4. `migrations/20260512_libro_init_schema.sql` の内容を全選択してコピー
5. SQL Editor に貼り付け
6. **Run** ボタンをクリックして実行

### 実行後の確認

- **Table Editor** で以下 7 テーブルが作成されていることを確認:
  - `libro_books`
  - `libro_notes`
  - `libro_tags`
  - `libro_note_tags`
  - `libro_note_images`
  - `libro_book_images`
  - `libro_user_settings`
- **Storage** で `libro-images` バケットが作成されていることを確認
- 各テーブルの **RLS** が有効になっていることを確認（Table Editor → テーブル選択 → RLS タブ）

---

## エラー時のロールバック

実行途中でエラーが発生した場合、以下の SQL で作成済みのオブジェクトをすべて削除してリセットできます。

```sql
-- Storage バケット削除
DELETE FROM storage.objects WHERE bucket_id = 'libro-images';
DELETE FROM storage.buckets WHERE id = 'libro-images';

-- Storage ポリシー削除
DROP POLICY IF EXISTS "libro_images_select" ON storage.objects;
DROP POLICY IF EXISTS "libro_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "libro_images_update" ON storage.objects;
DROP POLICY IF EXISTS "libro_images_delete" ON storage.objects;

-- テーブル削除（依存関係の逆順で削除）
DROP TABLE IF EXISTS libro_note_tags     CASCADE;
DROP TABLE IF EXISTS libro_note_images   CASCADE;
DROP TABLE IF EXISTS libro_book_images   CASCADE;
DROP TABLE IF EXISTS libro_notes         CASCADE;
DROP TABLE IF EXISTS libro_tags          CASCADE;
DROP TABLE IF EXISTS libro_user_settings CASCADE;
DROP TABLE IF EXISTS libro_books         CASCADE;
```

ロールバック後、SQL ファイルを再実行してください。
