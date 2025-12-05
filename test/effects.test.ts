// test/effects.test.ts
import { describe, it, expect, vi } from 'vitest';
import { logToSystem } from '../src/effects.js';
import { execa } from 'execa';

// 外部ライブラリをモック化
vi.mock('execa');

describe('src/effects.ts', () => {
  it('logToSystem calls execa with correct arguments', async () => {
    // execa のモック実装（成功するPromiseを返す）
    // 注意: execa v9以降は戻り値の構造が異なる場合があるため、anyや型アサーションが必要な場合があります
    vi.mocked(execa).mockResolvedValue({ stdout: '' } as any);

    const message = 'Test Log Message';
    const result = await logToSystem(message);

    // Result型がOkであることを確認
    expect(result.isOk()).toBe(true);

    // 副作用の検証: 正しいコマンドと引数で呼ばれたか
    expect(execa).toHaveBeenCalledWith('echo', [`[LOG]: ${message}`]);
  });

  it('returns Err result when execa fails', async () => {
    // execa が失敗する場合のモック
    vi.mocked(execa).mockRejectedValue(new Error('Command failed'));

    const result = await logToSystem('Fail Msg');

    // Result型がErrになり、エラーが捕捉されていることを確認
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('Failed to log');
      expect(result.error.message).toContain('Command failed');
    }
  });
});
