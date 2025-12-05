# GitHub Follow Balancer

GitHubで「片思いフォロー」しているユーザーを特定し、一括または選択的にフォロー解除を行うCLIツールです。

本プロジェクトは、関数型TypeScriptの原則に厳格に従い、クラスを使わず、純粋関数とイミュータブルなデータ構造で実装されています。

## ✨ 特徴

- ✅ **関数型プログラミング**: クラスを使わず、純粋関数とイミュータブルなデータ構造で実装
- ✅ **型安全**: TypeScript Strict Mode + `noUncheckedIndexedAccess` で完全な型安全性を保証
- ✅ **エラーハンドリング**: `neverthrow` による `Result` 型で、例外を投げない設計
- ✅ **テスト駆動**: 純粋関数の単体テストとDIパターンによる副作用のテスト
- ✅ **ユーザーフレンドリー**: `@clack/prompts` と `ora` による美しい対話型UI

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. GitHub Personal Access Token の取得

1. [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens) にアクセス
2. "Generate new token (classic)" をクリック
3. 以下のスコープを選択:
   - `user:follow` (ユーザーのフォロー管理)
4. トークンを生成してコピー

### 3. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成:

```bash
cp .env.example .env
```

`.env` ファイルを編集して、必要な情報を設定:

```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_USERNAME=your_username_here
WHITELIST=friend1,colleague2,boss3
```

- `GITHUB_TOKEN`: GitHubのPersonal Access Token
- `GITHUB_USERNAME`: あなたのGitHubユーザー名
- `WHITELIST` (オプション): フォロー解除しないユーザーのリスト（カンマ区切り）

### 4. 実行

```bash
# 通常実行（実際にフォロー解除する）
npm start

# Dry Run（実行せずに確認だけする）
npm start -- --dry-run
```

## 📖 使い方

### 実行の流れ

1. **データ取得**: GitHubからフォロー中とフォロワーのリストを取得
2. **片思い特定**: フォローしているが、フォローバックされていないユーザーを抽出
3. **ホワイトリスト適用**: 環境変数で指定したユーザーを除外
4. **確認プロンプト**: フォロー解除するユーザーのリストを表示し、確認を求める
5. **実行**: 承認された場合のみ、フォロー解除を実行

### オプション

- `--dry-run`: 実際にはフォロー解除せず、対象ユーザーの確認のみ行う

## 🏗️ アーキテクチャ

このプロジェクトは、関数型プログラミングの原則に従って設計されています:

### ディレクトリ構造

```
src/
├── domain/              # 純粋関数・型定義 (副作用なし)
│   ├── schemas.ts       # Zodスキーマ (User, Config)
│   └── logic.ts         # ビジネスロジック (純粋関数)
├── effects/             # 副作用を伴う処理 (ResultAsyncを返す)
│   ├── github-client.ts # GitHub APIラッパー
│   └── config-loader.ts # 環境変数読み込み
├── commands/            # CLIコマンド定義
│   └── unfollow.ts      # cmd-tsによるコマンド構成
└── main.ts              # エントリーポイント
```

### コーディング規約

- **クラス禁止**: `class` キーワードは使用せず、データ（Type）と振る舞い（Pure Function）を分離
- **不変性**: すべての変数は `const` で宣言（`let` は最小限に）
- **型安全**: `any` 型は使用禁止、外部データは `zod` で検証
- **副作用の分離**: I/O操作は `effects/` ディレクトリに集約
- **Result型**: エラーは `neverthrow` の `Result` 型で扱い、`throw` は使用しない

詳細は `docs/` ディレクトリ内のガイドラインを参照してください。

## 🧪 開発

### テストの実行

```bash
# テストを実行
npm test

# カバレッジを確認
npm run coverage
```

### リント

```bash
# ESLintでコードをチェック
npm run lint

# Prettierでコードをフォーマット
npm run format
```

## 🛠 技術スタック

| Category       | Library        | Description                                          |
| -------------- | -------------- | ---------------------------------------------------- |
| CLI Framework  | cmd-ts         | 関数合成ベースの型安全なコマンド定義                 |
| Validation     | zod            | TypeScriptファーストのスキーマ宣言と検証             |
| Error Handling | neverthrow     | Result型によるエラーハンドリング                     |
| Control Flow   | ts-pattern     | 網羅性チェック付きのパターンマッチング（Switch代替） |
| Date           | date-fns       | 不変性を保証する日付操作ライブラリ                   |
| UI/UX          | @clack/prompts | モダンな対話型プロンプト                             |
| UI/UX          | ora            | ローディングスピナー                                 |
| UI/UX          | picocolors     | ターミナル色付け                                     |
| HTTP Client    | @octokit/rest  | GitHub API クライアント                              |
| Shell/Process  | execa          | プロセス実行                                         |
| Testing        | vitest         | 高速な単体テストランナー                             |
