# Libro - Supabase マイグレーション管理

このディレクトリには Supabase の DB スキーマ定義（マイグレーション SQL）を管理します。

## ファイル一覧

| ファイル | 内容 |
|---|---|
| `migrations/20260512_libro_init_schema.sql` | 第1-B: 初期スキーマ（7テーブル + RLS + バケット作成）**← SQL Editor で実行** |
| `migrations/20260512_libro_storage_policies_reference.sql` | Storage ポリシー定義（参考用・実行不要）|
| `migrations/20260513_libro_theme_default_light.sql` | 第2-C: `libro_user_settings.theme` のデフォルト値を `'light'` に変更 **← SQL Editor で実行** |

---

## 第2-C マイグレーションの適用手順

1. [Supabase ダッシュボード](https://supabase.com/dashboard) にログイン
2. プロジェクト **mille-foglie-law** を選択
3. 左メニューから **SQL Editor** を開く
4. `migrations/20260513_libro_theme_default_light.sql` の内容を貼り付け
5. **Run** ボタンをクリックして実行

---

## 第1-B マイグレーションの適用手順

### ステップ1: SQL Editor で実行（テーブル + バケット作成）

#### 実行前の確認事項

1. Supabase ダッシュボードの **Table Editor** を開き、`libro_` プレフィックスのテーブルが存在しないことを確認
2. **Storage** を開き、`libro-images` バケットが存在しないことを確認
3. Ninfee 由来の `update_updated_at_column()` 関数が既に存在することを確認（存在しない場合は Ninfee のマイグレーションを先に実行する）

#### 実行手順

1. [Supabase ダッシュボード](https://supabase.com/dashboard) にログイン
2. プロジェクト **mille-foglie-law** を選択
3. 左メニューから **SQL Editor** を開く
4. `migrations/20260512_libro_init_schema.sql` の内容を全選択してコピー
5. SQL Editor に貼り付け
6. **Run** ボタンをクリックして実行

#### 実行後の確認

- **Table Editor** で以下 7 テーブルが作成されていることを確認:
  - `libro_books`
  - `libro_notes`
  - `libro_tags`
  - `libro_note_tags`
  - `libro_note_images`
  - `libro_book_images`
  - `libro_user_settings`
- 各テーブルの **RLS** が有効になっていることを確認（Table Editor → テーブル選択 → RLS タブ）
- **Storage** で `libro-images` バケットが作成されていることを確認

---

### ステップ2: Storage RLS ポリシーを GUI で設定

> **注意**: Storage の RLS ポリシーは SQL Editor から設定できないため（権限エラー）、  
> ダッシュボードの GUI から設定する必要があります。

#### 設定手順

1. Supabase ダッシュボード → **Storage** → `libro-images` バケットを選択
2. **Policies** タブを開く
3. 以下の 4 つのポリシーを順番に **New Policy** → **For full customization** で作成する

#### ポリシー設定内容

**① SELECT ポリシー（読み取り）**
- Policy name: `libro_images_select`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- USING expression:
  ```
  (storage.foldername(name))[1] = auth.uid()::text
  ```

**② INSERT ポリシー（アップロード）**
- Policy name: `libro_images_insert`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression:
  ```
  (storage.foldername(name))[1] = auth.uid()::text
  ```

**③ UPDATE ポリシー（更新）**
- Policy name: `libro_images_update`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression:
  ```
  (storage.foldername(name))[1] = auth.uid()::text
  ```
- WITH CHECK expression:
  ```
  (storage.foldername(name))[1] = auth.uid()::text
  ```

**④ DELETE ポリシー（削除）**
- Policy name: `libro_images_delete`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
  ```
  (storage.foldername(name))[1] = auth.uid()::text
  ```

> ポリシーの意味: ファイルパスの先頭ディレクトリ（`{user_id}/...`）がログイン中のユーザーの UID と一致する場合のみアクセスを許可。

---

## エラー時のロールバック

実行途中でエラーが発生した場合、以下の SQL で作成済みのオブジェクトをすべて削除してリセットできます。

```sql
-- Storage バケット削除（オブジェクトを先に削除してからバケットを削除）
DELETE FROM storage.objects WHERE bucket_id = 'libro-images';
DELETE FROM storage.buckets WHERE id = 'libro-images';

-- テーブル削除（依存関係の逆順で削除）
DROP TABLE IF EXISTS libro_note_tags     CASCADE;
DROP TABLE IF EXISTS libro_note_images   CASCADE;
DROP TABLE IF EXISTS libro_book_images   CASCADE;
DROP TABLE IF EXISTS libro_notes         CASCADE;
DROP TABLE IF EXISTS libro_tags          CASCADE;
DROP TABLE IF EXISTS libro_user_settings CASCADE;
DROP TABLE IF EXISTS libro_books         CASCADE;
```

ロールバック後、ステップ1から再実行してください。
