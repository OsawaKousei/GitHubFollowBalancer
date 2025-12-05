import { Octokit } from '@octokit/rest';
import { ResultAsync } from 'neverthrow';

// ✅ CLI Guideline 3.3: Executor Type Definition
// フォロー解除を実行する関数の型
export type UnfollowExecutor = (username: string) => ResultAsync<void, Error>;

// フォロー中のユーザーリストを取得する関数の型
export type FetchFollowingExecutor = (
  username: string,
) => ResultAsync<string[], Error>;

// フォロワーのユーザーリストを取得する関数の型
export type FetchFollowersExecutor = (
  username: string,
) => ResultAsync<string[], Error>;

// GitHub API クライアントの型
export type GithubClient = {
  getFollowing: FetchFollowingExecutor;
  getFollowers: FetchFollowersExecutor;
  unfollowUser: UnfollowExecutor;
};

// ✅ BasicGuideline 7.2: Result型で返す
// ✅ CLI Guideline 5.2: execa logic wrapper
// GitHub API クライアントを作成する
export const createGithubClient = (token: string): GithubClient => {
  const octokit = new Octokit({ auth: token });

  const getFollowing: FetchFollowingExecutor = (username) => {
    return ResultAsync.fromPromise(
      octokit.paginate(octokit.rest.users.listFollowingForUser, {
        username,
        per_page: 100,
      }),
      (e) => new Error(`Failed to fetch following: ${e}`),
    ).map((users) => users.map((u) => u.login));
  };

  const getFollowers: FetchFollowersExecutor = (username) => {
    return ResultAsync.fromPromise(
      octokit.paginate(octokit.rest.users.listFollowersForUser, {
        username,
        per_page: 100,
      }),
      (e) => new Error(`Failed to fetch followers: ${e}`),
    ).map((users) => users.map((u) => u.login));
  };

  const unfollowUser: UnfollowExecutor = (username) => {
    return ResultAsync.fromPromise(
      octokit.rest.users.unfollow({ username }),
      (e) => new Error(`Failed to unfollow ${username}: ${e}`),
    ).map(() => undefined);
  };

  return {
    getFollowing,
    getFollowers,
    unfollowUser,
  };
};
