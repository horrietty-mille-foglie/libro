-- 第2-C: libro_user_settings.theme のデフォルト値を 'system' → 'light' に変更
ALTER TABLE libro_user_settings ALTER COLUMN theme SET DEFAULT 'light';
