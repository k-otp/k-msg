import { Command } from 'commander';
import chalk from 'chalk';
import { AlimTalkPlatform, TemplateCategory } from '@k-msg/core';

export class TemplateCommand {
  constructor(private platform: AlimTalkPlatform) { }

  getCommand(): Command {
    const cmd = new Command('template');
    cmd.description('Manage AlimTalk templates');

    // Create template
    cmd
      .command('create')
      .description('Create a new template')
      .requiredOption('-n, --name <name>', 'template name')
      .requiredOption('-c, --content <content>', 'template content')
      .option('--category <category>', 'template category', 'NOTIFICATION')
      .action(async (options) => {
        try {
          console.log(chalk.yellow('📝 Creating template...'));

          const template = await this.platform.templates.register({
            name: options.name,
            content: options.content,
            category: TemplateCategory[options.category as keyof typeof TemplateCategory] || TemplateCategory.NOTIFICATION,
            variables: this.extractVariables(options.content),
            provider: 'iwinv'
          });

          console.log(chalk.green('✅ Template created successfully!'));
          console.log(`Template ID: ${template.id}`);
          console.log(`Status: ${template.status}`);

        } catch (error) {
          console.error(chalk.red('❌ Failed to create template:'), error);
        }
      });

    // List templates
    cmd
      .command('list')
      .description('List all templates')
      .option('--status <status>', 'filter by status')
      .action(async (options) => {
        try {
          console.log(chalk.yellow('📋 Fetching templates...'));

          // Note: This would need to be implemented in the platform
          console.log(chalk.blue('Templates will be listed here once provider integration is complete.'));

        } catch (error) {
          console.error(chalk.red('❌ Failed to list templates:'), error);
        }
      });

    // Validate template
    cmd
      .command('validate')
      .description('Validate template content')
      .requiredOption('-c, --content <content>', 'template content to validate')
      .action(async (options) => {
        try {
          console.log(chalk.yellow('🔍 Validating template...'));

          const variables = this.platform.templates.parseVariables(options.content);

          console.log(chalk.green('✅ Template validation complete!'));
          console.log(`Found variables: ${variables.join(', ')}`);

        } catch (error) {
          console.error(chalk.red('❌ Template validation failed:'), error);
        }
      });

    return cmd;
  }

  private extractVariables(content: string): Array<{ name: string; type: string; required: boolean }> {
    const variables = this.platform.templates.parseVariables(content);
    return variables.map(name => ({
      name,
      type: 'string',
      required: true
    }));
  }
}