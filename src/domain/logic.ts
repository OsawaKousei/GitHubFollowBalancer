import { ok, err, Result } from 'neverthrow';

// ✅ BasicGuideline 5.4: Pure Function
// 片思いユーザーの特定 (A - B)
// following: フォロー中のユーザーリスト
// followers: フォロワーのユーザーリスト
// 戻り値: following に含まれるが、followers に含まれないユーザーのリスト
export const findNonFollowers = (
  following: string[],
  followers: string[],
): string[] => {
  const followerSet = new Set(followers);
  return following.filter((user) => !followerSet.has(user));
};

// ✅ BasicGuideline 5.4: Pure Function
// ホワイトリストによるフィルタリング
// targets: フィルタリング対象のユーザーリスト
// whitelist: 除外するユーザーのリスト
// 戻り値: targets に含まれるが、whitelist に含まれないユーザーのリスト
export const filterWhitelisted = (
  targets: string[],
  whitelist: string[],
): string[] => {
  const whiteSet = new Set(whitelist);
  return targets.filter((user) => !whiteSet.has(user));
};

// ✅ BasicGuideline 5.4: Pure Function
// カンマ区切りの文字列をリストに変換し、トリムする
// input: カンマ区切りの文字列（例: "user1,user2, user3"）
// 戻り値: トリムされた文字列のリスト（例: ["user1", "user2", "user3"]）
export const parseWhitelist = (input: string): string[] => {
  if (input.trim() === '') {
    return [];
  }
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
};
