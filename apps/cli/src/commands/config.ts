import { Command } from 'commander';
import chalk from 'chalk';
import type { AlimTalkPlatform } from '../cli.js';

export class ConfigCommand {
  constructor(private platform: AlimTalkPlatform) {}

  getCommand(): Command {
    const cmd = new Command('config');
    cmd.description('Manage configuration');

    // Show current config
    cmd
      .command('show')
      .description('Show current configuration')
      .action(() => {
        try {
          const info = this.platform.getInfo();
          
          console.log(chalk.cyan('⚙️  Current Configuration:'));
          console.log(`Version: ${info.version}`);
          console.log(`Providers: ${info.providers.join(', ')}`);
          console.log(`Features: ${info.features.join(', ')}`);

        } catch (error) {
          console.error(chalk.red('❌ Failed to show configuration:'), error);
        }
      });

    // Validate config
    cmd
      .command('validate')
      .description('Validate configuration')
      .action(async () => {
        try {
          console.log(chalk.yellow('🔍 Validating configuration...'));

          const health = await this.platform.healthCheck();
          
          if (health.healthy) {
            console.log(chalk.green('✅ Configuration is valid!'));
          } else {
            console.log(chalk.red('❌ Configuration has issues:'));
            health.issues.forEach(issue => {
              console.log(chalk.red(`  - ${issue}`));
            });
          }

        } catch (error) {
          console.error(chalk.red('❌ Configuration validation failed:'), error);
        }
      });

    return cmd;
  }
}