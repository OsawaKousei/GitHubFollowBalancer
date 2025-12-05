import { z } from 'zod';

// ✅ BasicGuideline 9.2: Zod Schema First
// GitHub ユーザー名のスキーマ
export const UsernameSchema = z.string().min(1, 'Username cannot be empty');

// 設定情報のスキーマ
export const ConfigSchema = z.object({
  githubToken: z.string().min(1, 'GitHub token is required'),
  targetUser: z.string().min(1, 'Target username is required'),
  whitelist: z.array(z.string()).default([]),
});

// 型定義 (Zodから自動生成)
export type Config = z.infer<typeof ConfigSchema>;
export type Username = z.infer<typeof UsernameSchema>;
