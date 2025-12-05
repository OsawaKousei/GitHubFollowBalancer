import { run } from 'cmd-ts';
import { unfollowCommand } from './commands/unfollow.js';
import 'dotenv/config';

// ✅ BasicGuideline 8.1: エントリーポイントはmain関数
// ✅ CLI Guideline 4.1: process.exitはmain関数でのみ使用
const main = async (): Promise<void> => {
  try {
    // cmd-ts の run 関数でコマンドを実行
    await run(unfollowCommand, process.argv.slice(2));
    process.exit(0);
  } catch (e) {
    console.error('Fatal Error:', e);
    process.exit(1);
  }
};

main();
