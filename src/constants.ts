// ✅ BasicGuideline 4.5: Object-as-Enum
export const LANGUAGE = {
  EN: 'en',
  JA: 'ja',
  ES: 'es',
} as const;

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];

export const APP_NAME = 'hello-cli';
