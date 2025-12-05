# GitHub Follow Balancer - セットアップガイド

このドキュメントでは、GitHub Follow Balancerの初回セットアップ手順を詳しく説明します。

## 前提条件

- Node.js (LTS版を推奨)
- GitHubアカウント
- Personal Access Token (PAT) の発行権限

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/OsawaKousei/GitHubFollowBalancer.git
cd GitHubFollowBalancer
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. GitHub Personal Access Token の取得

#### 3.1. GitHubの設定ページにアクセス

1. GitHubにログイン
2. [Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens) にアクセス

#### 3.2. 新しいトークンを生成

1. "Generate new token (classic)" をクリック
2. トークンの名前を入力（例: `GitHub Follow Balancer`）
3. **必須スコープ**を選択:
   - ✅ `user:follow` - フォロー/アンフォローの実行に必要
4. "Generate token" をクリック
5. 表示されたトークンをコピー（**この画面を閉じると二度と表示されません**）

### 4. 環境変数の設定

#### 4.1. .envファイルの作成

```bash
cp .env.example .env
```

#### 4.2. .envファイルの編集

`.env` ファイルを開いて、以下の情報を設定します:

```env
# GitHub Personal Access Token (必須)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# あなたのGitHubユーザー名 (必須)
GITHUB_USERNAME=your_username

# フォロー解除しないユーザーのリスト (オプション)
# カンマ区切りで複数指定可能
WHITELIST=important_user1,colleague2,friend3
```

**設定項目の説明:**

- `GITHUB_TOKEN`: 手順3で取得したPersonal Access Token
- `GITHUB_USERNAME`: あなたのGitHubユーザー名（プロフィールURLの末尾）
- `WHITELIST`: フォロー解除したくないユーザーをカンマ区切りで指定（任意）

### 5. テストの実行（環境確認）

セットアップが正しく完了しているか確認します:

```bash
npm test
```

すべてのテストが成功すれば、セットアップ完了です。

## 使用方法

### Dry Run（確認のみ）

実際にはフォロー解除せず、対象ユーザーの確認のみ行います:

```bash
npm start -- --dry-run
```

### 実際の実行

フォロー解除を実行します（確認プロンプトが表示されます）:

```bash
npm start
```

## トラブルシューティング

### エラー: "GITHUB_TOKEN is not set"

`.env` ファイルが存在しないか、`GITHUB_TOKEN` が設定されていません。

**解決方法:**

1. `.env` ファイルが存在するか確認
2. `.env` ファイル内の `GITHUB_TOKEN` が正しく設定されているか確認

### エラー: "Failed to fetch data from GitHub"

トークンの権限が不足しているか、無効なトークンです。

**解決方法:**

1. トークンに `user:follow` スコープが含まれているか確認
2. トークンが有効期限切れでないか確認
3. 新しいトークンを生成して `.env` を更新

### エラー: "API rate limit exceeded"

GitHub APIのレート制限に達しました。

**解決方法:**

1. 1時間ほど待ってから再実行
2. 認証されたリクエストのレート制限は 5,000 リクエスト/時間です

## セキュリティに関する注意事項

- `.env` ファイルは **絶対にGitにコミットしないでください**
- Personal Access Tokenは **他人と共有しないでください**
- トークンが漏洩した場合は、すぐにGitHubで無効化してください

## 次のステップ

セットアップが完了したら、以下のドキュメントも参照してください:

- [README.md](../readme.md) - プロジェクト概要と使い方
- [仕様書](<./GitHubアンフォローCLIツール%20仕様書%20(Rev.%202).md>) - 詳細な仕様
- [コーディング規約](./BasicGuideline.md) - 開発時の規約
