import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../src/effects/config-loader.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 環境変数をリセット
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // 環境変数を元に戻す
    process.env = originalEnv;
  });

  it('正しい環境変数が設定されている場合は成功する', () => {
    process.env.GITHUB_TOKEN = 'ghp_test_token_123456789';
    process.env.GITHUB_USERNAME = 'testuser';
    process.env.WHITELIST = 'alice,bob,charlie';

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.githubToken).toBe('ghp_test_token_123456789');
      expect(result.value.targetUser).toBe('testuser');
      expect(result.value.whitelist).toEqual(['alice', 'bob', 'charlie']);
    }
  });

  it('WHITELISTが未設定の場合は空の配列を使用する', () => {
    process.env.GITHUB_TOKEN = 'ghp_test_token_123456789';
    process.env.GITHUB_USERNAME = 'testuser';
    delete process.env.WHITELIST;

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.whitelist).toEqual([]);
    }
  });

  it('GITHUB_TOKENが未設定の場合はエラーを返す', () => {
    delete process.env.GITHUB_TOKEN;
    process.env.GITHUB_USERNAME = 'testuser';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('GITHUB_TOKEN');
    }
  });

  it('GITHUB_USERNAMEが未設定の場合はエラーを返す', () => {
    process.env.GITHUB_TOKEN = 'ghp_test_token_123456789';
    delete process.env.GITHUB_USERNAME;

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('GITHUB_USERNAME');
    }
  });

  it('GITHUB_TOKENが空文字列の場合はエラーを返す', () => {
    process.env.GITHUB_TOKEN = '';
    process.env.GITHUB_USERNAME = 'testuser';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
  });

  it('WHITELISTのパースが正しく行われる', () => {
    process.env.GITHUB_TOKEN = 'ghp_test_token_123456789';
    process.env.GITHUB_USERNAME = 'testuser';
    process.env.WHITELIST = ' alice , bob , charlie ';

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.whitelist).toEqual(['alice', 'bob', 'charlie']);
    }
  });
});
