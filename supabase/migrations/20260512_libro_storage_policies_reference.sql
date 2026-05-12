-- このファイルは GUI 設定の参考用。実行不要。
-- ============================================================
-- Storage バケット libro-images の RLS ポリシー（参考）
-- ============================================================
-- Supabase の SQL Editor からは storage.objects への CREATE POLICY が
-- 権限エラー（must be owner of table objects）で実行できないため、
-- ダッシュボードの Storage > libro-images > Policies タブから
-- GUI で設定すること。
--
-- 設定内容の参考として、意図するポリシー定義を以下に記載する。
-- ============================================================

-- SELECT ポリシー
-- ポリシー名: libro_images_select
-- ターゲットロール: authenticated
CREATE POLICY "libro_images_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'libro-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT ポリシー
-- ポリシー名: libro_images_insert
-- ターゲットロール: authenticated
CREATE POLICY "libro_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'libro-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE ポリシー
-- ポリシー名: libro_images_update
-- ターゲットロール: authenticated
CREATE POLICY "libro_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'libro-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'libro-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE ポリシー
-- ポリシー名: libro_images_delete
-- ターゲットロール: authenticated
CREATE POLICY "libro_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'libro-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
