import { describe, it, expect } from 'vitest';
import {
  findNonFollowers,
  filterWhitelisted,
  parseWhitelist,
} from '../src/domain/logic.js';

// ✅ BasicGuideline 11.1: 純粋関数のテスト
describe('findNonFollowers', () => {
  it('フォロー中だがフォローバックされていないユーザーを特定する', () => {
    const following = ['alice', 'bob', 'charlie', 'david'];
    const followers = ['alice', 'charlie', 'eve'];

    const result = findNonFollowers(following, followers);

    expect(result).toEqual(['bob', 'david']);
  });

  it('全員がフォローバックしている場合は空の配列を返す', () => {
    const following = ['alice', 'bob', 'charlie'];
    const followers = ['alice', 'bob', 'charlie', 'david'];

    const result = findNonFollowers(following, followers);

    expect(result).toEqual([]);
  });

  it('誰もフォローバックしていない場合は全員を返す', () => {
    const following = ['alice', 'bob', 'charlie'];
    const followers = ['eve', 'frank'];

    const result = findNonFollowers(following, followers);

    expect(result).toEqual(['alice', 'bob', 'charlie']);
  });

  it('空の配列を処理できる', () => {
    expect(findNonFollowers([], [])).toEqual([]);
    expect(findNonFollowers(['alice'], [])).toEqual(['alice']);
    expect(findNonFollowers([], ['alice'])).toEqual([]);
  });

  it('重複するユーザー名を正しく処理する', () => {
    const following = ['alice', 'bob', 'alice', 'charlie'];
    const followers = ['alice', 'eve'];

    const result = findNonFollowers(following, followers);

    // alice は2回含まれているが、followers にあるので除外される
    expect(result).toEqual(['bob', 'charlie']);
  });
});

describe('filterWhitelisted', () => {
  it('ホワイトリストに含まれるユーザーを除外する', () => {
    const targets = ['alice', 'bob', 'charlie', 'david'];
    const whitelist = ['bob', 'david'];

    const result = filterWhitelisted(targets, whitelist);

    expect(result).toEqual(['alice', 'charlie']);
  });

  it('ホワイトリストが空の場合は全てのターゲットを返す', () => {
    const targets = ['alice', 'bob', 'charlie'];
    const whitelist: string[] = [];

    const result = filterWhitelisted(targets, whitelist);

    expect(result).toEqual(['alice', 'bob', 'charlie']);
  });

  it('ターゲットが空の場合は空の配列を返す', () => {
    const targets: string[] = [];
    const whitelist = ['alice', 'bob'];

    const result = filterWhitelisted(targets, whitelist);

    expect(result).toEqual([]);
  });

  it('全てがホワイトリストに含まれる場合は空の配列を返す', () => {
    const targets = ['alice', 'bob'];
    const whitelist = ['alice', 'bob', 'charlie'];

    const result = filterWhitelisted(targets, whitelist);

    expect(result).toEqual([]);
  });

  it('ホワイトリストとターゲットが一致しない場合は全てを返す', () => {
    const targets = ['alice', 'bob'];
    const whitelist = ['charlie', 'david'];

    const result = filterWhitelisted(targets, whitelist);

    expect(result).toEqual(['alice', 'bob']);
  });
});

describe('parseWhitelist', () => {
  it('カンマ区切りの文字列を配列に変換する', () => {
    const input = 'alice,bob,charlie';

    const result = parseWhitelist(input);

    expect(result).toEqual(['alice', 'bob', 'charlie']);
  });

  it('前後のスペースをトリムする', () => {
    const input = ' alice , bob , charlie ';

    const result = parseWhitelist(input);

    expect(result).toEqual(['alice', 'bob', 'charlie']);
  });

  it('空文字列の場合は空の配列を返す', () => {
    expect(parseWhitelist('')).toEqual([]);
    expect(parseWhitelist('   ')).toEqual([]);
  });

  it('単一の要素を処理できる', () => {
    const input = 'alice';

    const result = parseWhitelist(input);

    expect(result).toEqual(['alice']);
  });

  it('空の要素を除外する', () => {
    const input = 'alice,,bob,  ,charlie';

    const result = parseWhitelist(input);

    expect(result).toEqual(['alice', 'bob', 'charlie']);
  });
});
