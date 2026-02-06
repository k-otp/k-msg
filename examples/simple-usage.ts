#!/usr/bin/env bun

/**
 * K-Message Simple Usage Examples
 * 간단한 메시지 발송 및 템플릿 관리 예시
 */

import { createKMsgSender, createKMsgTemplates } from 'k-msg';

// 환경 변수 확인
if (!process.env.IWINV_API_KEY) {
  console.error('❌ IWINV_API_KEY environment variable is required');
  process.exit(1);
}

async function demonstrateSimpleUsage() {
  console.log('🚀 K-Message Simple Usage Demo\n');

  // === 1. 간단한 메시지 발송 ===
  console.log('📤 1. Simple Message Sending');
  const sender = createKMsgSender({
    iwinvApiKey: process.env.IWINV_API_KEY!,
    iwinvBaseUrl: process.env.IWINV_BASE_URL
  });

  try {
    // 단일 메시지 발송 (기존 템플릿 사용)
    const result = await sender.sendMessage(
      '01000000000', // 테스트 번호
      'TEMPLATE_CODE_1', // kotp_typed_test 템플릿
      { code: '789012' }
    );

    console.log('   ✅ Message sent:', {
      messageId: result.messageId,
      status: result.status,
      template: result.templateCode
    });
  } catch (error) {
    console.log('   ❌ Message failed:', error);
  }

  console.log('');

  // === 2. 템플릿 관리 ===
  console.log('📝 2. Template Management');
  const templates = createKMsgTemplates({
    iwinvApiKey: process.env.IWINV_API_KEY!,
    iwinvBaseUrl: process.env.IWINV_BASE_URL
  });

  try {
    // 기존 템플릿 목록 조회
    const existingTemplates = await templates.list();
    console.log(`   📋 Found ${existingTemplates.length} existing templates:`);
    
    existingTemplates.slice(0, 3).forEach(template => {
      console.log(`     - ${template.name} (${template.code})`);
    });

    // 템플릿 검증
    const validation = await templates.validate(
      'Hello #{name}! Your verification code is #{code}. Valid for #{minutes} minutes.'
    );
    
    console.log('   🔍 Template validation result:', {
      isValid: validation.isValid,
      variableCount: validation.variables.length,
      variables: validation.variables.map(v => v.name)
    });

  } catch (error) {
    console.log('   ❌ Template operations failed:', error);
  }

  console.log('');

  // === 3. CLI 스타일 사용법 ===
  console.log('💻 3. CLI Style Usage');
  
  const args = process.argv.slice(2);
  if (args.length >= 3) {
    const [phoneNumber, templateCode, ...variables] = args;
    const vars: Record<string, any> = {};
    
    // 변수를 key=value 형태로 파싱
    variables.forEach(varString => {
      const [key, value] = varString.split('=');
      if (key && value) vars[key] = value;
    });

    console.log(`   📞 Sending to: ${phoneNumber}`);
    console.log(`   📄 Template: ${templateCode}`);
    console.log(`   🔢 Variables:`, vars);

    try {
      const result = await sender.sendMessage(phoneNumber, templateCode, vars);
      console.log('   ✅ CLI send result:', result.status);
    } catch (error) {
      console.log('   ❌ CLI send failed:', error);
    }
  } else {
    console.log('   💡 CLI Usage: bun simple-usage.ts <phone> <template> <key=value> ...');
    console.log('   💡 Example: bun simple-usage.ts 01012345678 OTP_TEMPLATE code=123456 name=홍길동');
  }

  console.log('');
  console.log('🎉 Demo completed!');
}

// === 4. 대량 발송 예시 ===
async function demonstrateBulkSending() {
  console.log('🚛 Bulk Sending Demo');
  
  const sender = createKMsgSender({
    iwinvApiKey: process.env.IWINV_API_KEY!
  });

  const recipients = [
    { phoneNumber: '01011111111', variables: { name: '김철수', code: '111111' } },
    { phoneNumber: '01022222222', variables: { name: '이영희', code: '222222' } },
    { phoneNumber: '01033333333', variables: { name: '박민수', code: '333333' } }
  ];

  try {
    const result = await sender.sendBulk(
      recipients,
      'USER_OTP_TEMPLATE',
      { batchSize: 2, batchDelay: 1000 }
    );

    console.log('   ✅ Bulk send completed:', {
      batchId: result.batchId,
      total: result.totalCount,
      success: result.successCount,
      failed: result.failureCount
    });
  } catch (error) {
    console.log('   ❌ Bulk send failed:', error);
  }
}

// 실행
if (import.meta.main) {
  await demonstrateSimpleUsage();
  
  // 대량 발송은 주석 처리 (테스트용)
  // await demonstrateBulkSending();
}