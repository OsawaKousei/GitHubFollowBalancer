import {
  command,
  run,
  option,
  string,
  positional,
  Type,
  optional,
} from 'cmd-ts';
import { text, select, isCancel, intro, outro } from '@clack/prompts';
import { ResultAsync, ok, err } from 'neverthrow';
import ora from 'ora';
import pc from 'picocolors';
import { z } from 'zod';

import { LANGUAGE, type Language, APP_NAME } from './constants.js';
import { createGreeting, LanguageSchema } from './logic.js';
import { logToSystem } from './effects.js';

// --- CLI Guideline 1.1: Custom Type Definition ---

const LanguageType: Type<string, Language> = {
  async from(str) {
    const result = LanguageSchema.safeParse(str);
    if (!result.success) {
      throw new Error(
        `Invalid language: ${str}. Allowed: ${Object.values(LANGUAGE).join(', ')}`,
      );
    }
    return result.data;
  },
};

// --- Helper Functions (Interactive Mode) ---

const askName = async (): Promise<string> => {
  const name = await text({
    message: 'What is your name?',
    placeholder: 'Alice',
    validate: (value) => {
      if (value.length === 0) return 'Name is required!';
      return undefined;
    },
  });
  if (isCancel(name)) {
    process.exit(0);
  }
  return name as string;
};

const askLanguage = async (): Promise<Language> => {
  const lang = await select({
    message: 'Choose a language:',
    options: [
      { value: LANGUAGE.EN, label: 'English' },
      { value: LANGUAGE.JA, label: '日本語' },
      { value: LANGUAGE.ES, label: 'Español' },
    ],
  });
  if (isCancel(lang)) {
    process.exit(0);
  }
  return lang as Language;
};

// --- Main Command Definition ---

const app = command({
  name: APP_NAME,
  description: 'Greets the user in strict Functional TypeScript style',
  args: {
    // 位置引数
    nameArg: positional({ type: string, displayName: 'name' }),

    // オプション引数
    langArg: option({
      // optional() でラップすることで、未指定時に undefined が返るようになる
      type: optional(LanguageType),
      long: 'lang',
      short: 'l',
      description: 'Language (en, ja, es)',
    }),
  },
  handler: async ({ nameArg, langArg }) => {
    let finalName = nameArg;
    let finalLang: Language;

    // langArg が optional になったため、未指定時は undefined になる
    // これにより、以下の if 文が正しく機能するようになる
    if (langArg === undefined) {
      intro(pc.bgCyan(pc.black(` ${APP_NAME} `)));
      if (!finalName) finalName = await askName();
      finalLang = await askLanguage();
    } else {
      finalLang = langArg;
    }

    const result = createGreeting(finalName, finalLang, new Date());

    if (result.isErr()) {
      console.error(pc.red(`Error: ${result.error.message}`));
      process.exit(1);
    }

    const message = result.value;

    const spinner = ora('Processing greeting...').start();

    await new Promise((r) => setTimeout(r, 800));

    const logResult = await logToSystem(message);

    if (logResult.isOk()) {
      spinner.succeed(pc.gray('System log updated.'));
    } else {
      spinner.warn(pc.yellow('Failed to update system log, but continuing.'));
    }

    outro(pc.green(pc.bold(message)));
  },
});

// --- Entry Point ---

try {
  run(app, process.argv.slice(2));
} catch (e) {
  console.error(pc.red('Fatal Error:'), e);
  process.exit(1);
}
