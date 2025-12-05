# **GitHubアンフォローCLIツール 仕様書 (Rev. 2\)**

## **1\. 概要**

本ドキュメントは、GitHubにおいて「片思いフォロー（自分がフォローしているが、相手からはフォローされていない）」ユーザーを特定し、一括または選択的にフォロー解除を行うCLIツールの仕様書です。

本ツールは **BasicGuideline** および **CLI Application Guideline** に厳格に準拠し、クラスを使用しない関数型アプローチ、不変性、そして副作用の分離を徹底して設計されます。

## **2\. 機能要件**

1. **認証**: GitHub Personal Access Token (PAT) を使用してAPIにアクセスする。
2. **リスト取得**: 指定ユーザーのフォロー中 (Following) および フォロワー (Followers) リストを全件取得する。
3. **片思い特定**: 2つのリストを比較し、片思い状態のユーザーを抽出する（純粋関数）。
4. **除外処理**: ホワイトリスト（設定ファイル）に基づき、特定ユーザーを解除対象から除外する。
5. **対話的実行**: ユーザーに解除対象を確認し、承認された場合のみ解除を実行する。

## **3\. 技術スタック & ライブラリ選定**

規約に基づき、以下のライブラリを採用する。

| カテゴリ           | ライブラリ         | 用途                                           |
| :----------------- | :----------------- | :--------------------------------------------- |
| **CLI Framework**  | **cmd-ts**         | コマンド定義、引数パース (Commanderは使用不可) |
| **Validation**     | **zod**            | 環境変数およびAPIレスポンスの型定義・検証      |
| **Error Handling** | **neverthrow**     | ResultAsync によるエラー制御 (try-catchの排除) |
| **Async/UI**       | **ora**            | ローディングスピナー (非同期処理の可視化)      |
| **Prompt**         | **@clack/prompts** | ユーザー確認などの対話的UI                     |
| **Color**          | **picocolors**     | ログの装飾                                     |
| **HTTP Client**    | **@octokit/rest**  | GitHub APIクライアント                         |

## **4\. アーキテクチャ設計**

### **4.1 ディレクトリ構成 (Feature-based / Functional)**

クラス継承による階層化（Repository/Serviceパターン）は廃止し、**「定義(Types)」「純粋ロジック(Logic)」「副作用(Effects)」「コマンド(Commands)」** に分離します。

Plaintext

src/  
├── domain/ \# 純粋関数・型定義 (依存なし)  
│ ├── schemas.ts \# Zodスキーマ (User, Config)  
│ └── logic.ts \# 片思い特定、ホワイトリストフィルタ等の純粋関数  
├── effects/ \# 副作用を伴う処理 (ResultAsyncを返す)  
│ ├── github-client.ts \# GitHub APIラッパー  
│ └── config-loader.ts \# 環境変数読み込み  
├── commands/ \# CLIコマンド定義  
│ └── unfollow.ts \# cmd-tsによるコマンド構成・ハンドラ  
└── main.ts \# エントリーポイント

### **4.2 データフロー設計**

処理は以下のパイプラインとして構成し、Result 型でチェーンする。

1. **Load Config**: 環境変数を読み込み Zod で検証 → Config オブジェクト生成
2. **Fetch Data**: GitHub API からリスト取得 (副作用)
3. **Process Logic**: 純粋関数による差分抽出・フィルタリング (副作用なし)
4. **Confirm**: ユーザーへの確認プロンプト (副作用)
5. **Execute**: フォロー解除の実行 (副作用)

## **5\. 実装詳細仕様**

### **5.1 Domain (Pure Logic)**

ビジネスロジックは全て純粋関数として実装し、単体テストを容易にする。

TypeScript

// src/domain/logic.ts  
import { ok, err, Result } from 'neverthrow';

// 片思いユーザーの特定 (A \- B)  
// 純粋関数: 外部アクセスは行わない  
export const findNonFollowers \= (  
 following: string\[\],  
 followers: string\[\]  
): string\[\] \=\> {  
 const followerSet \= new Set(followers);  
 return following.filter((user) \=\> \!followerSet.has(user));  
};

// ホワイトリストによるフィルタリング  
export const filterWhitelisted \= (  
 targets: string\[\],  
 whitelist: string\[\]  
): string\[\] \=\> {  
 const whiteSet \= new Set(whitelist);  
 return targets.filter((user) \=\> \!whiteSet.has(user));  
};

### **5.2 Effects (Side Effects / Adapters)**

外部API通信は neverthrow の ResultAsync でラップし、例外を投げない設計とする。

TypeScript

// src/effects/github-client.ts  
import { Octokit } from '@octokit/rest';  
import { ResultAsync } from 'neverthrow';

// 依存性の注入 (DI) のための型定義  
export type UnfollowExecutor \= (username: string) \=\> ResultAsync\<void, Error\>;  
export type FetchListExecutor \= (username: string) \=\> ResultAsync\<string\[\], Error\>;

export const createGithubClient \= (token: string) \=\> {  
 const octokit \= new Octokit({ auth: token });

const getFollowing: FetchListExecutor \= (username) \=\> {  
 return ResultAsync.fromPromise(  
 octokit.paginate(octokit.rest.users.listFollowingForUser, { username }),  
 (e) \=\> new Error(\`Failed to fetch following: ${e}\`)  
 ).map((users) \=\> users.map((u) \=\> u.login));  
 };

// ... listFollowers, unfollowUser も同様に定義

return { getFollowing, /\* ... \*/ };  
};

### **5.3 Commands (CLI Definition)**

cmd-ts を使用し、ハンドラ内でドメインロジックとエフェクトを合成する。

TypeScript

// src/commands/unfollow.ts  
import { command, option, string, flag, boolean } from 'cmd-ts';  
import { match } from 'ts-pattern'; // 分岐制御  
import ora from 'ora';  
import \* as p from '@clack/prompts';  
import { findNonFollowers, filterWhitelisted } from '../domain/logic';  
import { loadConfig } from '../effects/config-loader';  
import { createGithubClient } from '../effects/github-client';

export const unfollowCommand \= command({  
 name: 'unfollow',  
 description: 'Unfollow users who are not following you back',  
 args: {  
 dryRun: flag({ long: 'dry-run', type: boolean, defaultValue: () \=\> false }),  
 },  
 handler: async ({ dryRun }) \=\> {  
 const spinner \= ora();

    // 1\. 設定読み込み
    const configResult \= loadConfig();
    if (configResult.isErr()) {
      console.error(configResult.error.message);
      return; // process.exitはmain以外禁止
    }
    const config \= configResult.value;
    const gh \= createGithubClient(config.githubToken);

    // 2\. データ取得 (ResultAsyncチェーン)
    spinner.start('Fetching data...');
    const result \= await ResultAsync.combine(\[
      gh.getFollowing(config.targetUser),
      gh.getFollowers(config.targetUser),
    \]);

    if (result.isErr()) {
      spinner.fail('Fetch failed');
      console.error(result.error.message);
      return;
    }

    // 3\. ロジック適用 (純粋関数)
    const \[following, followers\] \= result.value;
    const candidates \= findNonFollowers(following, followers);
    const targets \= filterWhitelisted(candidates, config.whitelist);

    spinner.succeed(\`Found ${targets.length} users to unfollow.\`);

    if (targets.length \=== 0) return;

    // 4\. ユーザー確認 (@clack/prompts)
    if (\!dryRun) {
        const shouldProceed \= await p.confirm({
            message: \`Do you want to unfollow ${targets.length} users?\`
        });
        if (p.isCancel(shouldProceed) || \!shouldProceed) {
            p.outro('Operation cancelled');
            return;
        }
    }

    // 5\. 実行
    // ... (for...of または Promise.all で順次実行し、結果を表示)

},  
});

### **5.4 Main Entry Point**

main.ts はコマンドの起動とトップレベルのエラーハンドリングのみを担当する。

TypeScript

// src/main.ts  
import { run } from 'cmd-ts';  
import { unfollowCommand } from './commands/unfollow';

const main \= async () \=\> {  
 try {  
 // 引数を除いた部分を渡す  
 await run(unfollowCommand, process.argv.slice(2));  
 process.exit(0);  
 } catch (e) {  
 console.error('Fatal Error:', e);  
 process.exit(1);  
 }  
};

main();

## **6\. 開発プロセスとテスト**

### **6.1 テスト戦略**

- **Domain層**: モックを使用せず、純粋関数の入出力のみをJest/Vitestでテストする。
  - 例: findNonFollowers に配列を渡し、正しい差分が返るか検証。
- **Command層**: createGithubClient が返す関数群をスタブ（Stub）に置き換えて注入し、コマンドの挙動を検証する。
  - APIのモック（nock等）ではなく、関数そのものを差し替える戦略をとる。

### **6.2 禁止事項 (規約より抜粋)**

- class キーワードの使用禁止。
- interface の定義禁止（type を使用）。
- any 型の使用禁止。
- let による再代入の禁止（reduce等で対応）。
- ハンドラ内での直接的な process.exit() 禁止。

## **7\. 設定ファイル (.env)**

Ini, TOML

GITHUB_TOKEN\=ghp_xxxxxxxxxxxx  
GITHUB_USERNAME\=my-user-name  
\# カンマ区切りで除外ユーザーを指定  
WHITELIST\=friend1,colleague2,boss3
