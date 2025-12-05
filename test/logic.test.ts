// test/logic.test.ts
import { describe, it, expect } from 'vitest';
import { getTimeOfDay, createGreeting } from '../src/logic.js';
import { LANGUAGE } from '../src/constants.js';

describe('src/logic.ts', () => {
  describe('getTimeOfDay (Pure Function)', () => {
    it('returns "morning" before 12:00', () => {
      const date = new Date('2024-01-01T10:00:00');
      expect(getTimeOfDay(date)).toBe('morning');
    });

    it('returns "day" between 12:00 and 18:00', () => {
      const dateNoon = new Date('2024-01-01T12:00:00');
      const dateAfternoon = new Date('2024-01-01T15:00:00');
      expect(getTimeOfDay(dateNoon)).toBe('day');
      expect(getTimeOfDay(dateAfternoon)).toBe('day');
    });

    it('returns "evening" after 18:00', () => {
      const date = new Date('2024-01-01T19:00:00');
      expect(getTimeOfDay(date)).toBe('evening');
    });
  });

  describe('createGreeting (Result Type)', () => {
    // 全9パターンの組み合わせを定義（網羅テスト）
    const testCases = [
      // JA
      {
        lang: LANGUAGE.JA,
        hour: 9,
        expected: 'おはようございます、Testさん！',
      },
      { lang: LANGUAGE.JA, hour: 14, expected: 'こんにちは、Testさん！' },
      { lang: LANGUAGE.JA, hour: 19, expected: 'こんばんは、Testさん！' },
      // EN
      { lang: LANGUAGE.EN, hour: 9, expected: 'Good morning, Test!' },
      { lang: LANGUAGE.EN, hour: 14, expected: 'Hello, Test!' },
      { lang: LANGUAGE.EN, hour: 19, expected: 'Good evening, Test!' },
      // ES
      { lang: LANGUAGE.ES, hour: 9, expected: '¡Buenos días, Test!' },
      { lang: LANGUAGE.ES, hour: 14, expected: '¡Hola, Test!' },
      { lang: LANGUAGE.ES, hour: 19, expected: '¡Buenas noches, Test!' },
    ];

    it.each(testCases)(
      'returns correct message for $lang at $hour:00',
      ({ lang, hour, expected }) => {
        // 指定した時間のDateオブジェクトを作成
        // 文字列連結で時刻を作る: '2024-01-01T09:00:00' のような形式
        const timeStr = hour.toString().padStart(2, '0');
        const date = new Date(`2024-01-01T${timeStr}:00:00`);

        const result = createGreeting('Test', lang, date);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(expected);
        }
      },
    );

    // 異常系のテスト（名前空文字）
    it('returns Err result when name is empty', () => {
      const result = createGreeting('', LANGUAGE.JA, new Date());
      expect(result.isErr()).toBe(true);
    });
  });
});
