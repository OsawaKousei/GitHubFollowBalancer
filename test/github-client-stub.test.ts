import { describe, it, expect } from 'vitest';
import { ResultAsync } from 'neverthrow';
import type { GithubClient } from '../src/effects/github-client.js';

// ✅ CLI Guideline 11.2: DI パターンによるテスト
// モックではなく、スタブ関数を作成してテストする

describe('GithubClient (Stub Test)', () => {
  it('スタブを使用してフォロー中のユーザーを取得できる', async () => {
    // スタブ: 実際のAPIを呼ばず、固定のデータを返す
    const stubClient: GithubClient = {
      getFollowing: (_username: string) =>
        ResultAsync.fromSafePromise(
          Promise.resolve(['alice', 'bob', 'charlie']),
        ),
      getFollowers: (_username: string) =>
        ResultAsync.fromSafePromise(Promise.resolve([])),
      unfollowUser: (_username: string) =>
        ResultAsync.fromSafePromise(Promise.resolve(undefined)),
    };

    const result = await stubClient.getFollowing('testuser');

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(['alice', 'bob', 'charlie']);
    }
  });

  it('スタブを使用してフォロワーを取得できる', async () => {
    const stubClient: GithubClient = {
      getFollowing: (_username: string) =>
        ResultAsync.fromSafePromise(Promise.resolve([])),
      getFollowers: (_username: string) =>
        ResultAsync.fromSafePromise(Promise.resolve(['alice', 'eve'])),
      unfollowUser: (_username: string) =>
        ResultAsync.fromSafePromise(Promise.resolve(undefined)),
    };

    const result = await stubClient.getFollowers('testuser');

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(['alice', 'eve']);
    }
  });

  it('スタブを使用してエラーケースをテストできる', async () => {
    const errorMessage = 'API rate limit exceeded';
    const stubClient: GithubClient = {
      getFollowing: (_username: string) =>
        ResultAsync.fromPromise(
          Promise.reject(new Error(errorMessage)),
          (e) => e as Error,
        ),
      getFollowers: (_username: string) =>
        ResultAsync.fromSafePromise(Promise.resolve([])),
      unfollowUser: (_username: string) =>
        ResultAsync.fromSafePromise(Promise.resolve(undefined)),
    };

    const result = await stubClient.getFollowing('testuser');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain(errorMessage);
    }
  });

  it('スタブを使用してフォロー解除の動作を検証できる', async () => {
    const unfollowedUsers: string[] = [];

    const stubClient: GithubClient = {
      getFollowing: (_username: string) =>
        ResultAsync.fromSafePromise(Promise.resolve([])),
      getFollowers: (_username: string) =>
        ResultAsync.fromSafePromise(Promise.resolve([])),
      unfollowUser: (username: string) => {
        // 副作用をキャプチャする
        unfollowedUsers.push(username);
        return ResultAsync.fromSafePromise(Promise.resolve(undefined));
      },
    };

    await stubClient.unfollowUser('alice');
    await stubClient.unfollowUser('bob');

    expect(unfollowedUsers).toEqual(['alice', 'bob']);
  });
});
