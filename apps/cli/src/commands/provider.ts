import { Command } from 'commander';
import chalk from 'chalk';
import type { AlimTalkPlatform } from '../cli.js';

export class ProviderCommand {
  constructor(private platform: AlimTalkPlatform) {}

  getCommand(): Command {
    const cmd = new Command('provider');
    cmd.description('Manage messaging providers');

    // List providers
    cmd
      .command('list')
      .description('List registered providers')
      .action(async () => {
        try {
          const info = this.platform.getInfo();
          
          console.log(chalk.cyan('📋 Registered Providers:'));
          info.providers.forEach(provider => {
            console.log(`  - ${provider}`);
          });

        } catch (error) {
          console.error(chalk.red('❌ Failed to list providers:'), error);
        }
      });

    // Provider health check
    cmd
      .command('health')
      .description('Check provider health')
      .option('-p, --provider <name>', 'specific provider name')
      .action(async (options) => {
        try {
          console.log(chalk.yellow('🔍 Checking provider health...'));

          const health = await this.platform.healthCheck();
          
          if (options.provider) {
            const providerHealth = health.providers[options.provider];
            if (providerHealth !== undefined) {
              const status = providerHealth ? chalk.green('✅ Healthy') : chalk.red('❌ Unhealthy');
              console.log(`${options.provider}: ${status}`);
            } else {
              console.log(chalk.red(`❌ Provider '${options.provider}' not found`));
            }
          } else {
            console.log('\n📊 All Providers:');
            Object.entries(health.providers).forEach(([name, healthy]) => {
              const status = healthy ? chalk.green('✅') : chalk.red('❌');
              console.log(`  ${status} ${name}`);
            });
          }

        } catch (error) {
          console.error(chalk.red('❌ Failed to check provider health:'), error);
        }
      });

    // Provider capabilities
    cmd
      .command('capabilities')
      .description('Show provider capabilities')
      .requiredOption('-p, --provider <name>', 'provider name')
      .action(async (options) => {
        try {
          const provider = this.platform.getProvider(options.provider);
          
          if (provider) {
            console.log(chalk.cyan(`📋 ${(provider as any).name || options.provider} Capabilities:`));
            console.log('\n✨ Basic Info:');
            console.log(`  Provider ID: ${(provider as any).id}`);
            console.log(`  Name: ${(provider as any).name}`);
            console.log(`  Supported Channels: ${(provider as any).supportedChannels?.join(', ') || 'N/A'}`);
            console.log(`  Supported Types: ${(provider as any).supportedTypes?.join(', ') || 'N/A'}`);
          } else {
            console.log(chalk.red(`❌ Provider '${options.provider}' not found`));
          }

        } catch (error) {
          console.error(chalk.red('❌ Failed to get provider capabilities:'), error);
        }
      });

    return cmd;
  }
}