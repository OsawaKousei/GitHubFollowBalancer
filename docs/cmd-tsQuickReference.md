# **cmd-ts Quick Reference**

Rustの clap や structopt に影響を受けた、TypeScriptネイティブなCLI引数パーサー。  
「文字列ですべてを受け取る」のではなく、「型定義（Type）を通して値をデコードする」 アーキテクチャを持つ。これにより、ハンドラ（ビジネスロジック）に到達した時点でデータが型安全かつ検証済みであることを保証する。

## **1\. 基本構造 (Basic Structure)**

クラス継承ではなく、関数合成 (command, subcommands) によってCLIを定義する。

```TypeScript

import { command, run, string, number, positional, option } from 'cmd-ts';

// コマンド定義
const app \= command({
 name: 'my-command',
 description: 'コマンドの説明',
 version: '1.0.0',

// 引数とオプションの定義（ここで型が決まる）
 args: {
 // 位置引数: 順番に依存する引数 (例: cp \<src\> \<dest\>)
 myNumber: positional({ type: number, displayName: 'num' }),

    // オプション引数: フラグ (例: \--greeting \<text\>)
    myMessage: option({
      long: 'greeting', // \--greeting
      short: 'g',       // \-g (※readmeにはないが一般的な機能として補足)
      type: string,
    }),

},

// ハンドラ: バリデーション済みの安全なオブジェクトを受け取る
 handler: (args) \=\> {
 // args.myNumber は確実に number 型
 // args.myMessage は確実に string 型
 console.log(args);
 },
});

// 実行: process.argv をスライスして渡す
run(app, process.argv.slice(2));
```

## **2\. 引数の種類 (Argument Types)**

### **positional (位置引数)**

コマンド名の直後に来る、順序が重要な引数。

```TypeScript

positional({
 type: string, // 型デコーダ
 displayName: 'src', // ヘルプ表示名
})
```

### **option (フラグ引数)**

名前付きの引数。

```TypeScript

option({
 long: 'env', // \--env
 type: string, // 型デコーダ
 description: '...', // 説明
})
```

## **3\. Custom Types (カスタム型デコーダ)**

cmd-ts の最大の特徴。文字列として受け取った値を、ハンドラに渡す前に 目的の型（Stream, Date, Domain Object）に変換する。  
バリデーションロジックや副作用（ファイル存在確認など）をハンドラから分離できる。  
**構造:**

```TypeScript

import { Type } from 'cmd-ts';

// Type\<Input, Output\>
const MyType: Type\<string, MyObject\> \= {
 async from(str: string): Promise\<MyObject\> {
 // 1\. バリデーション (失敗時は throw するだけでよい)
 if (\!isValid(str)) {
 throw new Error('Invalid input');
 }
 // 2\. 変換ロジック
 return new MyObject(str);
 }
};
```

使用例: ファイルパスを受け取り、ReadStream に変換してハンドラに渡す  
ハンドラ内で fs.existsSync を書く必要がなくなる。

```TypeScript

// types/stream.ts
import { Type } from 'cmd-ts';
import fs from 'fs';

// string を受け取り、fs.ReadStream を返す型定義
export const ReadStream: Type\<string, fs.ReadStream\> \= {
 async from(path) {
 if (\!fs.existsSync(path)) {
 // エラーハンドリングはここに集約される
 throw new Error(\`File not found: ${path}\`);
 }
 return fs.createReadStream(path);
 },
};

// app.ts
const app \= command({
 args: {
 // string ではなく ReadStream 型として定義
 input: positional({ type: ReadStream, displayName: 'file' }),
 },
 handler: ({ input }) \=\> {
 // input は既に fs.ReadStream 型であり、ファイルの存在も保証されている
 input.pipe(process.stdout);
 },
});
```

## **4\. 設計思想との整合性 (Design Philosophy)**

このライブラリは以下の点でプロジェクト規約に合致する：

1. **Pure Handlers**: ハンドラ内から「引数のパース」「バリデーション」「前処理（ファイルを開く等）」を排除し、純粋なビジネスロジックの実行に集中できる。
2. **Encapsulation**: パースロジック（from 関数）は単体テストが容易な Type オブジェクトとしてカプセル化され、再利用可能になる。
3. **Declarative**: 命令的な処理ではなく、定義（スキーマ）としてCLIを記述できる。
