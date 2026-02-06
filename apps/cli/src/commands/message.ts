import { Command } from 'commander';
import chalk from 'chalk';
import type { AlimTalkPlatform } from '../cli.js';

export class MessageCommand {
  constructor(private platform: AlimTalkPlatform) {}

  getCommand(): Command {
    const cmd = new Command('message');
    cmd.description('Send AlimTalk messages');

    // Send single message
    cmd
      .command('send')
      .description('Send a single message')
      .requiredOption('-t, --template <templateId>', 'template ID')
      .requiredOption('-p, --phone <phoneNumber>', 'recipient phone number')
      .option('-v, --variables <variables>', 'variables as JSON string', '{}')
      .action(async (options) => {
        try {
          console.log(chalk.yellow('📤 Sending message...'));

          const variables = JSON.parse(options.variables);
          
          const result = await this.platform.messages.send({
            templateId: options.template,
            recipients: [{ phoneNumber: options.phone }],
            variables
          });

          if (result.summary.sent > 0) {
            console.log(chalk.green('✅ Message sent successfully!'));
            console.log(`Message ID: ${result.results[0].messageId}`);
            console.log(`Status: ${result.results[0].status}`);
          } else {
            console.log(chalk.red('❌ Message failed to send'));
            if (result.results[0].error) {
              console.log(`Error: ${result.results[0].error.message}`);
            }
          }

        } catch (error) {
          console.error(chalk.red('❌ Failed to send message:'), error);
        }
      });

    // Send bulk messages
    cmd
      .command('bulk')
      .description('Send bulk messages from CSV file')
      .requiredOption('-t, --template <templateId>', 'template ID')
      .requiredOption('-f, --file <csvFile>', 'CSV file with recipients and variables')
      .action(async (options) => {
        try {
          console.log(chalk.yellow('📤 Sending bulk messages...'));
          
          // Read CSV file (would need CSV parser)
          console.log(chalk.blue('Bulk messaging will be implemented with CSV file support.'));
          console.log(`Template: ${options.template}`);
          console.log(`File: ${options.file}`);

        } catch (error) {
          console.error(chalk.red('❌ Failed to send bulk messages:'), error);
        }
      });

    // Check message status
    cmd
      .command('status')
      .description('Check message delivery status')
      .requiredOption('-i, --id <messageId>', 'message ID')
      .action(async (options) => {
        try {
          console.log(chalk.yellow('🔍 Checking message status...'));

          const status = await this.platform.messages.getStatus(options.id);
          
          console.log(chalk.green('📊 Message Status:'));
          console.log(`Status: ${status}`);

        } catch (error) {
          console.error(chalk.red('❌ Failed to get message status:'), error);
        }
      });

    return cmd;
  }
}