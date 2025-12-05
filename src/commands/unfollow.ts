import { command, flag, boolean } from 'cmd-ts';
import { ResultAsync } from 'neverthrow';
import ora from 'ora';
import * as p from '@clack/prompts';
import pc from 'picocolors';

import { findNonFollowers, filterWhitelisted } from '../domain/logic.js';
import { loadConfig } from '../effects/config-loader.js';
import { createGithubClient } from '../effects/github-client.js';

// ✅ CLI Guideline 2.1: cmd-ts による実装
export const unfollowCommand = command({
  name: 'unfollow',
  description: 'Unfollow users who are not following you back',
  args: {
    dryRun: flag({
      long: 'dry-run',
      type: boolean,
      defaultValue: () => false,
      description: 'Run without actually unfollowing users',
    }),
  },
  handler: async ({ dryRun }) => {
    p.intro(pc.bgCyan(' GitHub Follow Balancer '));

    const spinner = ora();

    // ✅ 1. 設定読み込み
    const configResult = loadConfig();
    if (configResult.isErr()) {
      p.outro(pc.red(`Error: ${configResult.error.message}`));
      p.note(
        'Please set the following environment variables:\n' +
          '  - GITHUB_TOKEN: Your GitHub Personal Access Token\n' +
          '  - GITHUB_USERNAME: Your GitHub username\n' +
          '  - WHITELIST (optional): Comma-separated usernames to exclude',
        'Configuration',
      );
      return;
    }

    const config = configResult.value;
    const gh = createGithubClient(config.githubToken);

    // ✅ 2. データ取得 (ResultAsyncチェーン)
    spinner.start(`Fetching data for ${pc.cyan(config.targetUser)}...`);

    const result = await ResultAsync.combine([
      gh.getFollowing(config.targetUser),
      gh.getFollowers(config.targetUser),
    ]);

    if (result.isErr()) {
      spinner.fail(pc.red('Failed to fetch data from GitHub'));
      p.outro(pc.red(`Error: ${result.error.message}`));
      return;
    }

    const [following, followers] = result.value;
    spinner.succeed(
      `Fetched ${pc.cyan(String(following.length))} following, ${pc.cyan(String(followers.length))} followers`,
    );

    // ✅ 3. ロジック適用 (純粋関数)
    const candidates = findNonFollowers(following, followers);
    const targets = filterWhitelisted(candidates, config.whitelist);

    p.log.info(
      `Found ${pc.cyan(String(targets.length))} users to unfollow` +
        (config.whitelist.length > 0
          ? ` (${pc.yellow(String(config.whitelist.length))} whitelisted)`
          : ''),
    );

    if (targets.length === 0) {
      p.outro(pc.green("No users to unfollow. You're all balanced!"));
      return;
    }

    // ターゲットリストを表示
    p.note(
      targets.slice(0, 10).join('\n') +
        (targets.length > 10 ? `\n... and ${targets.length - 10} more` : ''),
      'Users to unfollow',
    );

    // ✅ 4. ユーザー確認 (@clack/prompts)
    if (dryRun) {
      p.outro(pc.yellow('Dry run mode - no users were unfollowed'));
      return;
    }

    const shouldProceed = await p.confirm({
      message: `Do you want to unfollow ${pc.cyan(String(targets.length))} users?`,
    });

    if (p.isCancel(shouldProceed) || !shouldProceed) {
      p.outro(pc.yellow('Operation cancelled'));
      return;
    }

    // ✅ 5. 実行
    spinner.start('Unfollowing users...');
    let successCount = 0;
    let failureCount = 0;

    for (const username of targets) {
      const unfollowResult = await gh.unfollowUser(username);
      if (unfollowResult.isOk()) {
        successCount++;
        spinner.text = `Unfollowing... (${successCount}/${targets.length})`;
      } else {
        failureCount++;
        p.log.warn(
          `Failed to unfollow ${username}: ${unfollowResult.error.message}`,
        );
      }
    }

    spinner.succeed(
      `Unfollowed ${pc.green(String(successCount))} users` +
        (failureCount > 0 ? `, ${pc.red(String(failureCount))} failed` : ''),
    );

    p.outro(pc.green('Done!'));
  },
});
