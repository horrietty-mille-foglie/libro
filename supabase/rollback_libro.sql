-- ============================================================
-- Libro 第1-B ロールバック SQL
-- ============================================================
-- 第1-B マイグレーション（20260512_libro_init_schema.sql）の
-- 適用内容をすべて削除してリセットするためのスクリプト。
--
-- 実行方法: Supabase ダッシュボード > SQL Editor に貼り付けて Run
-- ============================================================

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
