import { ok, err, type Result } from 'neverthrow';
import { ConfigSchema, type Config } from '../domain/schemas.js';
import { parseWhitelist } from '../domain/logic.js';

// ✅ BasicGuideline 7.2: Result型で返す
// ✅ CLI Guideline 5.1: 環境変数の読み込み
// 環境変数から設定を読み込む
export const loadConfig = (): Result<Config, Error> => {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const whitelistRaw = process.env.WHITELIST || '';

  if (!token) {
    return err(new Error('GITHUB_TOKEN is not set in environment variables'));
  }

  if (!username) {
    return err(
      new Error('GITHUB_USERNAME is not set in environment variables'),
    );
  }

  // ホワイトリストをパース
  const whitelist = parseWhitelist(whitelistRaw);

  // Zodでバリデーション
  const result = ConfigSchema.safeParse({
    githubToken: token,
    targetUser: username,
    whitelist,
  });

  if (!result.success) {
    return err(new Error(`Config validation failed: ${result.error.message}`));
  }

  return ok(result.data);
};
