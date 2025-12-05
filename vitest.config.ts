// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // グローバルAPI (describe, it, expect) を有効化
    globals: true,

    // テスト環境: Node.js
    environment: 'node',

    // テスト対象ファイルのパターン
    include: ['test/**/*.test.ts'],

    // カバレッジ設定 (c8 / v8)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/types.ts', '**/*.d.ts'], // エントリーポイント等は除外推奨
    },

    // モックのクリア設定
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
});
