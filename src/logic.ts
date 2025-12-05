import { z } from 'zod';
import { ok, err, Result } from 'neverthrow';
import { match } from 'ts-pattern';
import { getHours } from 'date-fns'; // ✅ date-fns: 日付操作
import { LANGUAGE, type Language } from './constants.js';

// ✅ BasicGuideline 9.2: Zod Schema First
// 言語のバリデーションスキーマ
export const LanguageSchema = z.nativeEnum(LANGUAGE);

// 名前のバリデーションスキーマ
export const NameSchema = z.string().min(1, 'Name cannot be empty');

// 時間帯の定義
type TimeOfDay = 'morning' | 'day' | 'evening';

// ✅ BasicGuideline 5.4: Pure Function
// 時間帯を判定する純粋関数
export const getTimeOfDay = (date: Date): TimeOfDay => {
  const hour = getHours(date);
  return match(hour)
    .when(
      (h) => h < 12,
      () => 'morning' as const,
    )
    .when(
      (h) => h < 18,
      () => 'day' as const,
    )
    .otherwise(() => 'evening' as const);
};

// 挨拶メッセージを生成する純粋関数
// ✅ BasicGuideline 7.2: Result型で返す
export const createGreeting = (
  name: string,
  lang: Language,
  date: Date,
): Result<string, Error> => {
  // バリデーションチェック
  const nameResult = NameSchema.safeParse(name);
  if (!nameResult.success) return err(new Error(nameResult.error.message));

  const timeOfDay = getTimeOfDay(date);

  // ✅ BasicGuideline 3.5 & 9.3: ts-pattern による分岐
  // switch文禁止のため、match式を使用
  const message = match([lang, timeOfDay] as const)
    .with([LANGUAGE.JA, 'morning'], () => `おはようございます、${name}さん！`)
    .with([LANGUAGE.JA, 'day'], () => `こんにちは、${name}さん！`)
    .with([LANGUAGE.JA, 'evening'], () => `こんばんは、${name}さん！`)
    .with([LANGUAGE.EN, 'morning'], () => `Good morning, ${name}!`)
    .with([LANGUAGE.EN, 'day'], () => `Hello, ${name}!`)
    .with([LANGUAGE.EN, 'evening'], () => `Good evening, ${name}!`)
    .with([LANGUAGE.ES, 'morning'], () => `¡Buenos días, ${name}!`)
    .with([LANGUAGE.ES, 'day'], () => `¡Hola, ${name}!`)
    .with([LANGUAGE.ES, 'evening'], () => `¡Buenas noches, ${name}!`)
    .exhaustive();

  return ok(message);
};
