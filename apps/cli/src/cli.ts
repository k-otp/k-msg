#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { AlimTalkPlatform, type Config } from '@k-msg/core';
import { IWINVProvider } from '@k-msg/provider';
// import { TemplateCommand } from './commands/template.js';
// import { MessageCommand } from './commands/message.js';
// import { ProviderCommand } from './commands/provider.js';
// import { ConfigCommand } from './commands/config.js';

const program = new Command();

console.log(chalk.blue(`
┌─────────────────────────────────────┐
│           AlimTalk CLI              │
│     Open Source Messaging Platform  │
└─────────────────────────────────────┘
`));

program
  .name('alimtalk')
  .description('AlimTalk Platform CLI - Manage templates, send messages, and more')
  .version('0.1.0');

// Initialize platform
const config: Config = {
  providers: ['iwinv'],
  defaultProvider: 'iwinv',
  features: {
    enableBulkSending: true,
    enableScheduling: true,
    enableAnalytics: true
  }
};
const platform = new AlimTalkPlatform(config);

// Auto-register IWINV provider if API key is available
if (process.env.IWINV_API_KEY) {
  const iwinvProvider = new IWINVProvider({
    apiKey: process.env.IWINV_API_KEY,
    baseUrl: process.env.IWINV_BASE_URL || 'https://alimtalk.bizservice.iwinv.kr',
    debug: true
  });

  platform.registerProvider(iwinvProvider);
}

// Register commands (임시로 주석처리)
// const templateCmd = new TemplateCommand(platform);
// const messageCmd = new MessageCommand(platform);
// const providerCmd = new ProviderCommand(platform);
// const configCmd = new ConfigCommand(platform);

// program.addCommand(templateCmd.getCommand());
// program.addCommand(messageCmd.getCommand());
// program.addCommand(providerCmd.getCommand());
// program.addCommand(configCmd.getCommand());

// Global options
program.option('-v, --verbose', 'enable verbose logging');
program.option('--config <path>', 'config file path', './alimtalk.config.json');

// Health check command
program
  .command('health')
  .description('Check platform and provider health')
  .action(async () => {
    try {
      console.log(chalk.yellow('🔍 Checking platform health...'));

      const health = await platform.healthCheck();

      if (health.healthy) {
        console.log(chalk.green('✅ Platform is healthy'));
      } else {
        console.log(chalk.red('❌ Platform has issues:'));
        health.issues.forEach(issue => {
          console.log(chalk.red(`  - ${issue}`));
        });
      }

      console.log('\n📊 Provider Status:');
      for (const [name, healthy] of Object.entries(health.providers)) {
        const status = healthy ? chalk.green('✅') : chalk.red('❌');
        console.log(`  ${status} ${name}: ${healthy ? 'healthy' : 'unhealthy'}`);

        // IWINV 프로바이더인 경우 상세 정보 표시
        if (name === 'iwinv') {
          try {
            const providerHealth = await platform.providerHealth('iwinv');
            if (providerHealth.data) {
              console.log(chalk.cyan(`    💰 잔액: ${providerHealth.data.balance || 'N/A'}원`));
              console.log(chalk.cyan(`    🔗 연결상태: ${providerHealth.data.status || 'unknown'}`));
            }
            if (providerHealth.issues && providerHealth.issues.length > 0) {
              console.log(chalk.yellow(`    ⚠️  이슈: ${providerHealth.issues.join(', ')}`));
            }
          } catch (error) {
            console.log(chalk.red(`    ❌ 상세 정보 조회 실패: ${error}`));
          }
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Health check failed:'), error);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Show platform information')
  .action(() => {
    const info = platform.getInfo();

    console.log(chalk.cyan('📋 Platform Information:'));
    console.log(`Version: ${info.version}`);
    console.log(`Providers: ${info.providers.join(', ')}`);
    console.log(`Features: ${info.features.join(', ')}`);
  });

// Balance check command
program
  .command('balance')
  .description('Check IWINV account balance')
  .action(async () => {
    try {
      console.log(chalk.yellow('💰 Checking IWINV account balance...'));

      const provider = platform.getProvider('iwinv');
      if (!provider) {
        console.log(chalk.red('❌ IWINV provider not found'));
        return;
      }

      const health = await provider.healthCheck();

      if (health.data) {
        console.log(chalk.green('✅ Balance information:'));
        console.log(`  💰 잔액: ${health.data.balance || 'N/A'}원`);
        console.log(`  🔗 상태: ${health.data.status || 'unknown'}`);
        console.log(`  📊 응답코드: ${health.data.code || 'N/A'}`);

        if (health.data.message) {
          console.log(`  📝 메시지: ${health.data.message}`);
        }
      } else {
        console.log(chalk.red('❌ Failed to get balance information'));
        if (health.issues.length > 0) {
          console.log('Issues:');
          health.issues.forEach((issue: string) => console.log(`  - ${issue}`));
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Balance check failed:'), error);
    }
  });

// Test send command
program
  .command('test-send')
  .description('Test IWINV message sending')
  .option('-t, --template <code>', 'Template code', 'TEST_TEMPLATE')
  .option('-p, --phone <number>', 'Phone number', '01012345678')
  .option('-v, --variables <json>', 'Variables JSON')
  .action(async (options) => {
    try {
      console.log(chalk.yellow('📤 Testing IWINV message sending...'));

      const provider = platform.getProvider('iwinv');
      if (!provider) {
        console.log(chalk.red('❌ IWINV provider not found'));
        return;
      }

      const variables = JSON.parse(options.variables);
      const result = await provider.sendMessage(options.template, options.phone, variables);

      if (result.success) {
        console.log(chalk.green('✅ Message sent successfully!'));
        console.log(`Message ID: ${result.messageId}`);
        console.log(`Status: ${result.status}`);
      } else {
        console.log(chalk.red('❌ Message send failed:'));
        console.log(result.error);
      }
    } catch (error) {
      console.error(chalk.red('❌ Test send failed:'), error);
    }
  });

// Advanced send command with all options
program
  .command('send')
  .description('Send IWINV message with advanced options')
  .option('-t, --template <code>', 'Template code (required)')
  .option('-p, --phone <number>', 'Phone number (required)')
  .option('-v, --variables <json>', 'Variables JSON')
  .option('--reserve', 'Enable reservation sending')
  .option('--send-date <date>', 'Send date (yyyy-MM-dd HH:mm:ss) for reservation')
  .option('--enable-resend', 'Enable fallback SMS/LMS sending')
  .option('--resend-callback <number>', 'Callback number for fallback')
  .option('--resend-type <type>', 'Resend type: alimtalk (use template) or custom (use custom content)', 'alimtalk')
  .option('--resend-title <title>', 'LMS title for fallback')
  .option('--resend-content <content>', 'Custom content for fallback (required if resend-type is custom)')
  .action(async (options) => {
    try {
      if (!options.template || !options.phone) {
        console.log(chalk.red('❌ Template code and phone number are required.'));
        return;
      }

      console.log(chalk.yellow('📤 Sending IWINV message...'));

      const provider = platform.getProvider('iwinv');
      if (!provider) {
        console.log(chalk.red('❌ IWINV provider not found'));
        return;
      }

      console.log(options, options.variables)

      const variables = JSON.parse(options.variables);
      const sendOptions: any = {};

      if (options.reserve) {
        sendOptions.reserve = true;
        if (options.sendDate) {
          sendOptions.sendDate = options.sendDate;
        } else {
          console.log(chalk.red('❌ Send date is required for reservation sending.'));
          return;
        }
      }

      if (options.enableResend) {
        sendOptions.enableResend = true;
        sendOptions.resendCallback = options.resendCallback;
        sendOptions.resendType = options.resendType;
        sendOptions.resendTitle = options.resendTitle;
        sendOptions.resendContent = options.resendContent;

        if (options.resendType === 'custom' && !options.resendContent) {
          console.log(chalk.red('❌ Resend content is required when resend type is custom.'));
          return;
        }
      }

      console.log({
        template: options.template, phone: options.phone, variables, sendOptions
      })

      const result = await provider.sendTemplateMessage(options.template, options.phone, variables, sendOptions);

      if (result.success) {
        console.log(chalk.green('✅ Message sent successfully!'));
        console.log(`📱 Phone: ${options.phone}`);
        console.log(`📝 Template: ${options.template}`);
        console.log(`🆔 Message ID: ${result.messageId}`);
        console.log(`📊 Status: ${result.status}`);

        if (options.reserve) {
          console.log(`⏰ Scheduled for: ${options.sendDate}`);
        }
        if (options.enableResend) {
          console.log(`🔄 Fallback enabled: ${options.resendType}`);
        }
      } else {
        console.log(chalk.red('❌ Message send failed:'));
        console.log(result.error);
      }
    } catch (error) {
      console.error(chalk.red('❌ Send failed:'), error);
    }
  });

// Test template creation
program
  .command('test-template')
  .description('Test IWINV template creation')
  .option('-n, --name <name>', 'Template name', 'test_template')
  .option('-c, --content <content>', 'Template content', '[TEST] 테스트 메시지입니다.')
  .option('--category <category>', 'Template category', 'NOTIFICATION')
  .action(async (options) => {
    try {
      console.log(chalk.yellow('📝 Testing IWINV template creation...'));

      const provider = platform.getProvider('iwinv');
      if (!provider) {
        console.log(chalk.red('❌ IWINV provider not found'));
        return;
      }

      const templates = await platform.templates('iwinv');
      const result = await templates.create(options.name, options.content, options.category);

      if (result.success) {
        console.log(chalk.green('✅ Template created successfully!'));
        console.log(`Template Code: ${result.templateCode}`);
        console.log(`Status: ${result.status}`);
      } else {
        console.log(chalk.red('❌ Template creation failed:'));
        console.log(result.error);
      }
    } catch (error) {
      console.error(chalk.red('❌ Test template failed:'), error);
    }
  });

// List templates command
program
  .command('list-templates')
  .description('List IWINV templates')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-s, --size <number>', 'Page size', '15')
  .option('-c, --code <code>', 'Filter by template code')
  .option('-n, --name <name>', 'Filter by template name')
  .option('--status <status>', 'Filter by status (Y/I/R)', '')
  .action(async (options) => {
    try {
      console.log(chalk.yellow('📋 Listing IWINV templates...'));

      const provider = platform.getProvider('iwinv');
      if (!provider) {
        console.log(chalk.red('❌ IWINV provider not found'));
        return;
      }

      const filters: any = {};
      if (options.code) filters.templateCode = options.code;
      if (options.name) filters.templateName = options.name;
      if (options.status) filters.templateStatus = options.status;

      const templates = await platform.templates('iwinv');
      const result = await templates.list(
        parseInt(options.page),
        parseInt(options.size),
        filters
      );

      if (result.code === 200) {
        console.log(chalk.green('✅ Templates retrieved successfully!'));
        console.log(`📊 Total: ${result.totalCount} templates`);
        console.log('');

        if (result.list && result.list.length > 0) {
          result.list.forEach((template: any, index: number) => {
            const statusIcon = template.status === 'Y' ? '✅' : template.status === 'I' ? '⏳' : '❌';
            const statusText = template.status === 'Y' ? '사용가능' : template.status === 'I' ? '검수중' : '부결';

            console.log(chalk.cyan(`${index + 1}. ${template.templateName}`));
            console.log(`   📝 코드: ${template.templateCode}`);
            console.log(`   ${statusIcon} 상태: ${statusText}`);
            console.log(`   📅 생성일: ${template.createDate}`);
            console.log(`   💬 내용: ${template.templateContent.substring(0, 50)}${template.templateContent.length > 50 ? '...' : ''}`);
            console.log('');
          });
        } else {
          console.log(chalk.yellow('📭 No templates found'));
        }
      } else {
        console.log(chalk.red('❌ Failed to retrieve templates:'));
        console.log(result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ List templates failed:'), error);
    }
  });

// Delete template command
program
  .command('delete-template')
  .description('Delete IWINV template')
  .option('-c, --code <code>', 'Template code to delete')
  .action(async (options) => {
    try {
      if (!options.code) {
        console.log(chalk.red('❌ Template code is required. Use --code option.'));
        return;
      }

      console.log(chalk.yellow(`🗑️  Deleting IWINV template: ${options.code}...`));

      const provider = platform.getProvider('iwinv');
      if (!provider) {
        console.log(chalk.red('❌ IWINV provider not found'));
        return;
      }

      const templates = await platform.templates('iwinv');
      const result = await templates.delete(options.code);

      if (result.code === 200) {
        console.log(chalk.green('✅ Template deleted successfully!'));
        console.log(`📝 Template Code: ${options.code}`);
        console.log(`📝 Message: ${result.message}`);
      } else {
        console.log(chalk.red('❌ Template deletion failed:'));
        console.log(result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Delete template failed:'), error);
    }
  });

// Modify template command
program
  .command('modify-template')
  .description('Modify IWINV template')
  .option('-c, --code <code>', 'Template code to modify')
  .option('-n, --name <name>', 'New template name')
  .option('--content <content>', 'New template content')
  .action(async (options) => {
    try {
      if (!options.code || !options.name || !options.content) {
        console.log(chalk.red('❌ Template code, name, and content are required.'));
        return;
      }

      console.log(chalk.yellow(`📝 Modifying IWINV template: ${options.code}...`));

      const provider = platform.getProvider('iwinv');
      if (!provider) {
        console.log(chalk.red('❌ IWINV provider not found'));
        return;
      }

      const templates = await platform.templates('iwinv');
      const result = await templates.modify(options.code, options.name, options.content);

      if (result.success) {
        console.log(chalk.green('✅ Template modified successfully!'));
        console.log(`📝 Template Code: ${result.templateCode}`);
        console.log(`📊 Status: ${result.status}`);
      } else {
        console.log(chalk.red('❌ Template modification failed:'));
        console.log(result.error);
      }
    } catch (error) {
      console.error(chalk.red('❌ Modify template failed:'), error);
    }
  });

// History command
program
  .command('history')
  .description('Get IWINV message history')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-s, --size <number>', 'Page size', '15')
  .option('--reserve <reserve>', 'Filter by reservation status (Y/N)')
  .option('--start <date>', 'Start date (yyyy-MM-dd HH:mm:ss)')
  .option('--end <date>', 'End date (yyyy-MM-dd HH:mm:ss)')
  .option('--message-id <id>', 'Filter by message ID')
  .option('--phone <phone>', 'Filter by phone number')
  .action(async (options) => {
    try {
      console.log(chalk.yellow('📋 Getting IWINV message history...'));

      const provider = platform.getProvider('iwinv');
      if (!provider) {
        console.log(chalk.red('❌ IWINV provider not found'));
        return;
      }

      const filters: any = {};
      if (options.reserve) filters.reserve = options.reserve;
      if (options.start) filters.startDate = options.start;
      if (options.end) filters.endDate = options.end;
      if (options.messageId) filters.messageId = parseInt(options.messageId);
      if (options.phone) filters.phone = options.phone;

      const history = await platform.history('iwinv');
      const result = await history.list(
        parseInt(options.page),
        parseInt(options.size),
        filters
      );

      if (result.code === 200) {
        console.log(chalk.green('✅ Message history retrieved successfully!'));
        console.log(`📊 Total: ${result.totalCount} messages`);
        console.log('');

        if (result.list && result.list.length > 0) {
          result.list.forEach((message: any, index: number) => {
            const statusIcon = message.statusCode === 'OK' ? '✅' : '❌';

            console.log(chalk.cyan(`${index + 1}. Message ID: ${message.seqNo}`));
            console.log(`   📱 Phone: ${message.phone}`);
            console.log(`   📝 Template: ${message.templateCode}`);
            console.log(`   ${statusIcon} Status: ${message.statusCodeName}`);
            console.log(`   📅 Request: ${message.requestDate}`);
            console.log(`   📤 Sent: ${message.sendDate}`);
            console.log(`   📥 Received: ${message.receiveDate}`);
            console.log(`   💬 Message: ${message.sendMessage.substring(0, 50)}${message.sendMessage.length > 50 ? '...' : ''}`);

            if (message.resendStatus) {
              console.log(`   🔄 Resend: ${message.resendStatusName}`);
            }
            console.log('');
          });
        } else {
          console.log(chalk.yellow('📭 No message history found'));
        }
      } else {
        console.log(chalk.red('❌ Failed to retrieve history:'));
        console.log(result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Get history failed:'), error);
    }
  });

// Cancel reservation command
program
  .command('cancel-reservation')
  .description('Cancel IWINV reserved message')
  .option('-m, --message-id <id>', 'Message ID to cancel')
  .action(async (options) => {
    try {
      if (!options.messageId) {
        console.log(chalk.red('❌ Message ID is required. Use --message-id option.'));
        return;
      }

      console.log(chalk.yellow(`🚫 Cancelling reservation: ${options.messageId}...`));

      const provider = platform.getProvider('iwinv');
      if (!provider) {
        console.log(chalk.red('❌ IWINV provider not found'));
        return;
      }

      const history = await platform.history('iwinv');
      const result = await history.cancelReservation(options.messageId);

      if (result.code === 200) {
        console.log(chalk.green('✅ Reservation cancelled successfully!'));
        console.log(`📝 Message ID: ${options.messageId}`);
        console.log(`📝 Message: ${result.message}`);
      } else {
        console.log(chalk.red('❌ Reservation cancellation failed:'));
        console.log(result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Cancel reservation failed:'), error);
    }
  });

// Setup command
program
  .command('setup')
  .description('Interactive setup for providers')
  .action(async () => {
    const { default: inquirer } = await import('inquirer');

    console.log(chalk.yellow('🔧 Setting up AlimTalk Platform...'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Which provider would you like to configure?',
        choices: ['IWINV', 'Aligo', 'Kakao', 'NHN']
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your API key:',
        mask: '*'
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Enter base URL (optional):',
        default: 'https://alimtalk.bizservice.iwinv.kr'
      }
    ]);

    if (answers.provider === 'IWINV') {
      try {
        const iwinvProvider = new IWINVProvider({
          apiKey: answers.apiKey,
          baseUrl: answers.baseUrl,
          debug: program.opts().verbose
        });

        platform.registerProvider(iwinvProvider);

        console.log(chalk.green('✅ IWINV provider configured successfully!'));

        // Test connection
        console.log(chalk.yellow('🔍 Testing connection...'));
        const health = await platform.healthCheck();

        if (health.healthy) {
          console.log(chalk.green('✅ Connection test successful!'));
        } else {
          console.log(chalk.red('❌ Connection test failed'));
        }

      } catch (error) {
        console.error(chalk.red('❌ Setup failed:'), error);
        process.exit(1);
      }
    }
  });

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str))
});

program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    console.error(chalk.red('❌ Command failed:'), error.message);
    process.exit(1);
  }
}