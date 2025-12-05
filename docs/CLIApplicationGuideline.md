# **CLI Application Guideline**

Parent Document: BasicGuideline.md

Scope: Command Line Interface (CLI) Tools

本規約は、BasicGuideline（上位規約）を継承し、CLI 開発特有のルールを定義する。

CLI は「純粋関数（ロジック）」と「副作用（入出力）」の境界が曖昧になりやすいため、これを厳格に分離することを目的とする。

## **1\. アーキテクチャ (Architecture)**

### **1.1 コマンドの定義 (Declaration)**

コマンド定義には cmd-ts を使用し、クラス継承ではなく「オブジェクトと関数の合成」によって構成する。

引数（Arguments）とオプション（Options）の定義においては、可能な限り Zod スキーマを活用し、型安全性とバリデーションロジックを一元化する。

```TypeScript

// ✅ Good: Zod 連携による型安全なコマンド定義
import { command, option, string } from 'cmd-ts';
import { z } from 'zod'; // BasicGuideline 9.2 準拠

// バリデーションロジックを Schema として分離
const EnvSchema \= z.enum(\['dev', 'stg', 'prod'\]);

export const deployCommand \= command({
 name: 'deploy',
 args: {
 env: option({
 type: string,
 long: 'env',
 description: 'Target environment (dev, stg, prod)',
 }),
 },
 handler: async ({ env }) \=\> {
 // 境界での型確定 (BasicGuideline 4.2/9.2)
 const parseResult \= EnvSchema.safeParse(env);

    if (\!parseResult.success) {
      // エラーを投げて main でキャッチさせる（ここで process.exit しない）
      throw new Error(\`Invalid env: ${env}. Allowed: ${EnvSchema.options.join(', ')}\`);
    }

    await performDeploy(parseResult.data);

},
});
```

### **1.2 エントリーポイントの責務**

main 関数（またはエントリーファイル）は、以下の責務のみを持つ。

1. CLI アプリの構築（binary や run の呼び出し）。
2. 最上位レベルでのエラーキャッチと終了コード（Exit Code）の制御。
3. **ロジックの記述は禁止する。**

## **2\. 入出力と対話 (Input & Output)**

### **2.1 ユーザー対話 (Prompts)**

対話モードが必要な場合は、@clack/prompts を使用する。

**重要ルール:**

- ヘルパー関数内で process.exit を呼んではならない（Sec 3.2 遵守）。
- キャンセル（isCancel）時は、専用のエラー型または Result 型を返し、呼び出し元（main）で終了フローへ誘導する。

```TypeScript

// ✅ Good: Result 型 または 専用のシンボルを返す
import { text, isCancel } from '@clack/prompts';
import { ok, err, ResultAsync } from 'neverthrow';

// キャンセルエラー型の定義
class UserCancelError extends Error {
 readonly \_tag \= 'UserCancelError';
}

const askName \= (): ResultAsync\<string, UserCancelError\> \=\> {
 return ResultAsync.fromPromise(
 (async () \=\> {
 const name \= await text({ message: 'Project name?' });
 if (isCancel(name)) {
 throw new UserCancelError();
 }
 return name;
 })(),
 (e) \=\> (e instanceof UserCancelError ? e : new Error('Unknown error'))
 );
};
```

### **2.2 ログ出力 (Logging)**

console.log の直接使用は、デバッグ目的以外では禁止する。

出力は以下の 3 種類に分類し、専用のラッパー関数またはロガーを通して行う。

1. **Result Output:** コマンドの実行結果（JSON, テーブル等）。標準出力(stdout)へ。
2. **Status/Info:** 進行状況や案内。標準エラー出力(stderr)へ（パイプ渡しを阻害しないため）。
3. **Error:** エラー詳細。標準エラー出力(stderr)へ。

## **3\. 副作用の制御 (Side Effects)**

### **3.1 ファイルシステム / シェル実行**

ファイル読み書き（fs）やコマンド実行（execa）は、コード内で最も不安定な副作用である。

これらは必ず **Result 型 を返すラッパー関数** に閉じ込め、メインロジック内で try-catch を露出させない。

```TypeScript

// ❌ Bad: ロジック内で生のエラーハンドリング
try {
 await execa('npm', \['install'\]);
} catch (e) { ... }

// ✅ Good: Result 型ユーティリティの使用 (neverthrow 等)
const installPackages \= (): ResultAsync\<void, Error\> \=\> {
 return ResultAsync.fromPromise(
 execa('npm', \['install'\]),
 (e) \=\> new Error(\`Install failed: ${e}\`)
 );
};
```

### **3.2 プロセス終了 (Process Exit)**

ルール: process.exit() を呼んでよいのは **main 関数（エントリーポイント）のみ** とする。

理由: 下位の関数が勝手にプロセスを殺すと、テストが不可能になるため。

例外: 致命的な回復不能エラー（Panic）の場合のみ、明示的な名前の関数（panicAndExit など）を経由して許可する。

### **3.3 DI によるテスト容易性の確保**

BasicGuideline 5.4（純粋関数）を遵守するため、副作用（execa や fs）を伴うロジックは、実行関数を引数として受け取る（Dependency Injection）構成を推奨する。

```TypeScript

// ✅ Good: 実行関数を注入可能にする
type Executor \= (cmd: string, args: string\[\]) \=\> ResultAsync\<void, Error\>;

// ロジック本体（テスト時はモック関数を渡せる）
const setupProject \= (name: string, exec: Executor) \=\> {
 return exec('npm', \['install'\]).map(() \=\> \`Project ${name} setup complete\`);
};
```

## **4\. エラーハンドリング規約 (Error Handling)**

### **4.1 終了コード (Exit Codes)**

| Code  | 意味          | 条件                                               |
| :---- | :------------ | :------------------------------------------------- |
| **0** | Success       | 正常終了。                                         |
| **1** | General Error | 予期せぬエラー、実行時例外。                       |
| **2** | User Error    | 引数間違い、バリデーションエラー、対話キャンセル。 |

### **4.2 Friendly Error Messages**

エラー発生時は、必ず以下の形式でメッセージを表示すること。

1. **What:** 何が起きたか（例: "Config file not found"）
2. **Why:** なぜ起きたか（例: "Missing ./config.json"）
3. **How:** どうすれば直るか（例: "Run 'init' command to generate it."）

## **5\. 準標準ライブラリ (Standard Libraries)**

CLI 特有の要件を満たしつつ、BasicGuideline に適合する以下のライブラリを採用する。

### **5.1 picocolors (色・装飾)**

選定理由:

- **軽量・低副作用**: chalk より軽量であり、グローバルな状態を持たない。
- **関数型**: 単純な関数（string \-\> string）として色付けを行うため、関数合成やパイプライン処理に適している。

```TypeScript

import pc from 'picocolors';

const formatSuccess \= (msg: string) \=\> pc.green(pc.bold(msg));
console.log(formatSuccess('Done\!'));
```

### **5.2 execa (シェル実行)**

選定理由:

- **Promise ベース**: child_process のモダンなラッパーであり、async/await との相性が良い。
- **Result 型への適合**: エラーハンドリングが予測可能であり、neverthrow の ResultAsync.fromPromise でラップして管理しやすい。

```TypeScript

import { execa } from 'execa';
import { ResultAsync } from 'neverthrow';

const runBuild \= (): ResultAsync\<void, Error\> \=\> {
 return ResultAsync.fromPromise(
 execa('npm', \['run', 'build'\]),
 (e) \=\> new Error(\`Build failed: ${e}\`)
 );
};
```

### **5.3 ora (スピナー)**

選定理由:

- **UX 向上**: 非同期処理中のユーザー体験を向上させるデファクトスタンダード。
- **制御の容易さ**: API がシンプルであり、副作用（描画）の開始・終了をロジックのブロック前後で明確に管理できる。

```TypeScript

import ora from 'ora';

const spinner \= ora('Loading...').start();
// 処理実行...
spinner.succeed('Completed');
```

## **6\. テスト (Testing)**

「何が書かれているか」ではなく「何が起きるか」を検証します。過剰なモックはリファクタリングの耐性を下げるため、設計（DI）によってテストの単純さを維持します。

### **6.1 ロジックの分離と純粋関数のテスト**

ルール: テストコードの 80% 以上は、モックを一切使用しない「純粋関数の単体テスト」でなければならない。  
適用:

- コマンドのハンドラ (handler) 内に複雑なロジックを書かず、別の純粋関数に切り出す。
- 切り出した純粋関数に対して、単純な入力と出力の検証を行う。

```TypeScript

// ❌ Bad: ハンドラ内でロジックと副作用が結合しているため、テストには複雑なモックが必要
handler: async ({ name }) \=\> {
 if (name.length \< 3) throw new Error('Too short'); // ロジック
 await execa('mkdir', \[name\]); // 副作用
}

// ✅ Good: ロジックは純粋関数としてテストする
// logic.ts
export const validateName \= (name: string): Result\<string, Error\> \=\> {
 return name.length \>= 3 ? ok(name) : err(new Error('Too short'));
};

// logic.test.ts (モック不要)
test('validateName', () \=\> {
 expect(validateName('ab').isErr()).toBe(true);
 expect(validateName('abc').isOk()).toBe(true);
});
```

### **6.2 副作用の境界テスト (Dependency Injection)**

**ルール:** ファイル操作やシェル実行などの副作用は、jest.mock() や vi.mock() でモジュール全体を書き換えるのではなく、関数の引数として渡された「依存関数」をスタブ（単純な代替関数）に置き換えることで検証する。

**適用:**

- Sec 3.3 で定義した Executor パターンを使用する。
- 「ライブラリが正しく呼ばれたか」のみを検証し、ライブラリの内部挙動までは追わない。

```TypeScript

// ❌ Bad: モジュール全体を魔法のように書き換える（挙動が分かりにくい）
vi.mock('execa');

// ✅ Good: 明示的にスタブ関数を渡す
test('setupProject calls npm install', async () \=\> {
 // 1\. 記録用のスタブを作成
 const commands: string\[\] \= \[\];
 const mockExec: Executor \= (cmd, args) \=\> {
 commands.push(\`${cmd} ${args.join(' ')}\`);
 return okAsync(undefined); // 常に成功を返す
 };

// 2\. スタブを注入して実行
 await setupProject('my-app', mockExec);

// 3\. 呼び出し履歴を検証（状態の検証）
 expect(commands).toContain('npm install');
});
```

## **6.3 テストツールの選定 (Vitest)**

推奨: Vitest を使用する。  
理由: 設定不要で TypeScript を動作させることができ、Vite エコシステム（CLIツール開発でよく使われる）との親和性が高いため。

## **6.4 禁止事項**

1. **フレームワークのテスト禁止:** cmd-ts や zod が正しく動くかどうかを検証するテストは書かない（それはライブラリ作者の責務である）。自分のコード（定義したスキーマやハンドラ）のみをテストする。
2. **Privateメソッドのテスト禁止:** 外部に公開されていない関数を無理やりテストしない。テストしにくい場合は、そのロジックを別の公開関数（純粋関数）として切り出すシグナルである。
