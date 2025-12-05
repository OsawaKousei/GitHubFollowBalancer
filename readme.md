# Functional TypeScript CLI Template

厳格な関数型プログラミング（Functional Programming）の原則に基づき、堅牢かつ保守性の高いCLIツールを構築するための **GitHub Template Repository** です。

本リポジトリは、**「人間が読みやすく、AIが迷わない」** コードベースを目指し、徹底したルール（Class禁止、例外禁止、副作用の分離）の下で管理された個人の開発用ボイラープレートを共有するものです。

> **Note (免責事項):**
> 本リポジトリは、作者個人の開発効率化および知見共有を目的としたテンプレートです。
> 提供される構成やライブラリ選定は、特定の思想（Functional TS）に強く依存しています。一般的なサポートや機能保証を約束するものではありませんので、利用者自身の責任においてカスタマイズしてご利用ください。

## ✨ 特徴

- **No Classes / No OOP**: クラスや継承を排除し、データと関数を分離。
- **Immutable by Default**: 変数はすべて `const`。再代入や変異を禁止。
- **Result Type Error Handling**: `try-catch` を排除し、`neverthrow` による安全なレールウェイ指向プログラミングを採用。
- **Schema-First**: `zod` による厳格な入力検証と、`cmd-ts` による型安全なCLI引数パース。
- **Pure Core, Imperative Shell**: ビジネスロジック（純粋関数）と副作用（I/O）を厳格に分離。

## 🚀 テンプレートの使い方

GitHub画面右上の **"Use this template"** ボタンをクリックし、新しいリポジトリを作成してください。

### 初期セットアップ

```bash
# 依存関係のインストール
npm install

# テストの実行(環境確認)
npm test
```

### コマンドの実行

> **推奨:** `npm start` では引数が正常に動作しない可能性があるため、直接 `npx tsx` を使用することを推奨します。

```bash
# 推奨: npx tsx を使用
npx tsx src/index.ts --help

# 例: 引数を渡して実行
npx tsx src/index.ts Kosei --lang=ja
```

## 📂 サンプルコードについて

現在 src/ ディレクトリに含まれているコードは、本テンプレートのアーキテクチャ（純粋関数の分離、カスタム型定義、テスト手法など）を実演するための Hello World サンプルアプリケーション です。ご自身のプロジェクトを開始する際は、以下の手順でサンプルを置き換えてください。

1. src/logic.ts, src/effects.ts の中身をクリアする。
2. src/constants.ts の定義をご自身のドメインに合わせて書き換える。
3. src/index.ts のコマンド定義 (cmd-ts) を変更する。
4. test/ 内のテストコードを削除・更新する。

## 🛠 技術スタック

| Category        | Library        | Description                                          |
| --------------- | -------------- | ---------------------------------------------------- |
| CLIFramework    | cmd-ts         | 関数合成ベースの型安全なコマンド定義                 |
| Validation      | zod            | TypeScriptファーストのスキーマ宣言と検証             |
| Error Handlingn | everthrow      | Result型によるエラーハンドリング                     |
| Control Flow    | ts-pattern     | 網羅性チェック付きのパターンマッチング（Switch代替） |
| Date            | date-fns       | 不変性を保証する日付操作ライブラリ                   |
| UI/UX           | @clack/prompts | モダンな対話型プロンプト                             |
| Testing         | vitest         | 高速な単体テストランナー                             |

## 📝 開発ガイドライン

このテンプレートには厳格な開発規約が含まれています。実装前に必ず docs/ ディレクトリを確認してください。
Basic Guideline: TypeScriptコーディング規約（Class禁止、型運用など）
CLI Guideline: CLI固有のアーキテクチャ規約

主な禁止事項 (Linterで強制)
❌ class (使用禁止)
❌ let (原則禁止)
❌ switch (使用禁止 -> ts-pattern を使用)
❌ any (使用禁止 -> zod で検証)
❌ throw (ロジック内での使用禁止 -> Result を返却)
📂 ディレクトリ構造本プロジェクトは「コロケーション（機能単位）」と「責務の分離」を重視しています。

```Plaintext
src/
├── constants.ts # 定数定義 (Object-as-Enum)
├── logic.ts # 純粋関数 (ビジネスロジック、バリデーション)
├── effects.ts # 副作用 (API通信、ファイル操作、Shell実行)
└── index.ts # エントリーポイント (CLI定義、依存性の注入、全体の配線)
```
