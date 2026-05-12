-- ============================================================
-- Libro 初期スキーマ
-- ============================================================
-- 7 テーブル + インデックス + updated_at トリガー + RLS ポリシー
-- + Storage バケット (libro-images) + Storage RLS
--
-- 実行方法: Supabase ダッシュボード > SQL Editor に貼り付けて Run
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- テーブル1: libro_books（書籍）
-- ──────────────────────────────────────────────────────────────

CREATE TABLE libro_books (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  isbn         TEXT,
  title        TEXT        NOT NULL,
  author       TEXT,
  publisher    TEXT,
  cover_url    TEXT,
  status       TEXT        NOT NULL DEFAULT '積読',
  started_at   DATE,
  finished_at  DATE,
  summary      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status IN ('積読', '読書中', '読了'))
);

COMMENT ON TABLE  libro_books           IS 'Libro の書籍マスタ。1ユーザーが登録した書籍を管理する。';
COMMENT ON COLUMN libro_books.cover_url IS '書影URL。OpenBD / Google Books API から取得した外部URLを保存。';
COMMENT ON COLUMN libro_books.status    IS '読書ステータス: 積読 / 読書中 / 読了';
COMMENT ON COLUMN libro_books.summary   IS '書籍全体のまとめ（Markdown 想定）。';


-- ──────────────────────────────────────────────────────────────
-- テーブル2: libro_notes（読書メモ）
-- ──────────────────────────────────────────────────────────────

CREATE TABLE libro_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id    UUID        NOT NULL REFERENCES libro_books(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter    TEXT,
  page       INTEGER,
  quote      TEXT,
  thought    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  libro_notes         IS '読書メモ。書籍に紐づく章・ページ・引用・考察を記録する。';
COMMENT ON COLUMN libro_notes.quote   IS '原文からの引用部分。';
COMMENT ON COLUMN libro_notes.thought IS '引用に対する自分の考察・感想。';


-- ──────────────────────────────────────────────────────────────
-- テーブル3: libro_tags（タグマスタ）
-- ──────────────────────────────────────────────────────────────

CREATE TABLE libro_tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

COMMENT ON TABLE libro_tags IS 'ユーザーが作成するタグマスタ。(user_id, name) で一意。';


-- ──────────────────────────────────────────────────────────────
-- テーブル4: libro_note_tags（メモ ↔ タグ 中間テーブル）
-- ──────────────────────────────────────────────────────────────

CREATE TABLE libro_note_tags (
  note_id UUID NOT NULL REFERENCES libro_notes(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES libro_tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

COMMENT ON TABLE libro_note_tags IS '読書メモとタグの多対多を管理する中間テーブル。';


-- ──────────────────────────────────────────────────────────────
-- テーブル5: libro_note_images（メモ添付画像）
-- ──────────────────────────────────────────────────────────────

CREATE TABLE libro_note_images (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id       UUID        NOT NULL REFERENCES libro_notes(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  storage_path  TEXT        NOT NULL,
  caption       TEXT,
  display_order INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  libro_note_images              IS 'メモに添付する画像。storage_path は libro-images バケット内のパス。';
COMMENT ON COLUMN libro_note_images.storage_path IS 'Storage パス例: {user_id}/{note_id}/{uuid}.jpg';


-- ──────────────────────────────────────────────────────────────
-- テーブル6: libro_book_images（書籍まとめ用画像）
-- ──────────────────────────────────────────────────────────────

CREATE TABLE libro_book_images (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       UUID        NOT NULL REFERENCES libro_books(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  storage_path  TEXT        NOT NULL,
  caption       TEXT,
  display_order INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  libro_book_images              IS '書籍まとめページに添付する画像。storage_path は libro-images バケット内のパス。';
COMMENT ON COLUMN libro_book_images.storage_path IS 'Storage パス例: {user_id}/{book_id}/{uuid}.jpg';


-- ──────────────────────────────────────────────────────────────
-- テーブル7: libro_user_settings（ユーザー設定）
-- ──────────────────────────────────────────────────────────────

CREATE TABLE libro_user_settings (
  user_id        UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  list_view_mode TEXT        NOT NULL DEFAULT 'grid',
  theme          TEXT        NOT NULL DEFAULT 'system',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (list_view_mode IN ('grid', 'list')),
  CHECK (theme IN ('light', 'dark', 'system'))
);

COMMENT ON TABLE  libro_user_settings               IS '1ユーザー1レコードの設定テーブル。user_id が PK。';
COMMENT ON COLUMN libro_user_settings.list_view_mode IS '書籍一覧の表示形式: grid / list';
COMMENT ON COLUMN libro_user_settings.theme          IS 'カラーテーマ: light / dark / system';


-- ──────────────────────────────────────────────────────────────
-- インデックス（パフォーマンス用）
-- ──────────────────────────────────────────────────────────────

CREATE INDEX idx_libro_books_user_id        ON libro_books(user_id);
CREATE INDEX idx_libro_books_user_status    ON libro_books(user_id, status);
CREATE INDEX idx_libro_notes_book_id        ON libro_notes(book_id);
CREATE INDEX idx_libro_notes_user_id        ON libro_notes(user_id);
CREATE INDEX idx_libro_tags_user_id         ON libro_tags(user_id);
CREATE INDEX idx_libro_note_tags_tag_id     ON libro_note_tags(tag_id);
CREATE INDEX idx_libro_note_images_note_id  ON libro_note_images(note_id);
CREATE INDEX idx_libro_book_images_book_id  ON libro_book_images(book_id);


-- ──────────────────────────────────────────────────────────────
-- updated_at 自動更新トリガー
-- ──────────────────────────────────────────────────────────────
-- Ninfee と同じ Supabase プロジェクトを共有しているため、
-- update_updated_at_column() 関数は既に定義済み。
-- トリガーのみ Libro テーブル向けに新規作成する。

CREATE TRIGGER update_libro_books_updated_at
  BEFORE UPDATE ON libro_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_libro_notes_updated_at
  BEFORE UPDATE ON libro_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_libro_user_settings_updated_at
  BEFORE UPDATE ON libro_user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ──────────────────────────────────────────────────────────────
-- RLS（Row Level Security）: 本人限定方針
-- ──────────────────────────────────────────────────────────────

ALTER TABLE libro_books         ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_note_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_note_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_book_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_user_settings ENABLE ROW LEVEL SECURITY;

-- libro_books: 本人のみ全操作可
CREATE POLICY "libro_books_owner" ON libro_books
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- libro_notes: 本人のみ全操作可
CREATE POLICY "libro_notes_owner" ON libro_notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- libro_tags: 本人のみ全操作可
CREATE POLICY "libro_tags_owner" ON libro_tags
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- libro_note_tags: user_id 列がないため、紐づく note の user_id 経由でチェック
CREATE POLICY "libro_note_tags_owner" ON libro_note_tags
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM libro_notes
      WHERE libro_notes.id = libro_note_tags.note_id
        AND libro_notes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM libro_notes
      WHERE libro_notes.id = libro_note_tags.note_id
        AND libro_notes.user_id = auth.uid()
    )
  );

-- libro_note_images: 本人のみ全操作可
CREATE POLICY "libro_note_images_owner" ON libro_note_images
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- libro_book_images: 本人のみ全操作可
CREATE POLICY "libro_book_images_owner" ON libro_book_images
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- libro_user_settings: user_id が PK のため user_id = auth.uid() で本人限定
CREATE POLICY "libro_user_settings_owner" ON libro_user_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────
-- Storage バケット: libro-images
-- ──────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('libro-images', 'libro-images', false);

-- Storage RLS: libro-images バケットへのアクセス制御
-- ファイルパスの第1セグメントが auth.uid() と一致する場合のみ許可
-- 想定パス例: {user_id}/{book_id}/{uuid}.jpg

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "libro_images_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'libro-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "libro_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'libro-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "libro_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'libro-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "libro_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'libro-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================
-- 完了
-- ============================================================
