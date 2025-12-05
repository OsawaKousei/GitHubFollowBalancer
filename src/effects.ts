import { execa } from 'execa';
import { ResultAsync } from 'neverthrow';

// ✅ CLI Guideline 3.3: Executor Type Definition
export type Executor = (message: string) => ResultAsync<void, Error>;

// ✅ CLI Guideline 5.2: execa logic wrapper
// 実際に副作用を実行する関数
export const logToSystem: Executor = (message: string) => {
  return ResultAsync.fromPromise(
    // 実際にはログファイルへの書き込みなどを想定。ここではechoで代用。
    execa('echo', [`[LOG]: ${message}`]),
    (e) => new Error(`Failed to log: ${e}`),
  ).map(() => undefined);
};
