/**
 * K-Message Service 테스트 클라이언트
 * 실제로 각 패키지들이 연동되는지 확인
 */

const BASE_URL = "http://localhost:3002";

async function testKMessageService() {
  console.log("🧪 K-Message Service 테스트 시작\n");

  try {
    // 1. 헬스 체크
    console.log("1️⃣ 헬스 체크...");
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const health = await healthResponse.json();
    console.log("✅ 헬스 체크:", health);
    console.log("");

    // 2. 템플릿 생성
    console.log("2️⃣ 템플릿 생성...");
    const createTemplateResponse = await fetch(`${BASE_URL}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "test_welcome_template",
        content:
          "Welcome to #{serviceName}, #{customerName}! Your verification code is #{code}.",
        category: "AUTHENTICATION",
      }),
    });
    const templateResult = await createTemplateResponse.json();
    console.log("✅ 템플릿 생성:", templateResult);
    console.log("");

    // 3. 템플릿 목록 조회
    console.log("3️⃣ 템플릿 목록 조회...");
    const templatesResponse = await fetch(`${BASE_URL}/templates`);
    const templates = await templatesResponse.json();
    console.log("✅ 템플릿 목록:", templates);
    console.log("");

    // 4. 메시지 발송
    console.log("4️⃣ 메시지 발송...");
    const sendMessageResponse = await fetch(`${BASE_URL}/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "01012345678",
        templateName: "test_welcome_template",
        variables: {
          serviceName: "K-Message Test",
          customerName: "홍길동",
          code: "123456",
        },
      }),
    });
    const messageResult = await sendMessageResponse.json();
    console.log("✅ 메시지 발송:", messageResult);
    console.log("");

    // 5. Analytics 조회
    console.log("5️⃣ Analytics 조회...");
    const analyticsResponse = await fetch(`${BASE_URL}/analytics`);
    const analytics = await analyticsResponse.json();
    console.log("✅ Analytics:", analytics);
    console.log("");

    // 6. 추가 메시지 발송 (Analytics 데이터 증가 확인)
    console.log("6️⃣ 추가 메시지 발송...");
    for (let i = 0; i < 3; i++) {
      await fetch(`${BASE_URL}/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: `010123456${i + 78}`,
          templateName: "test_welcome_template",
          variables: {
            serviceName: "K-Message Test",
            customerName: `사용자${i + 1}`,
            code: `12345${i}`,
          },
        }),
      });
      console.log(`📤 메시지 ${i + 1} 발송됨`);
    }

    // 7. 최종 Analytics 확인
    console.log("\n7️⃣ 최종 Analytics 확인...");
    const finalAnalyticsResponse = await fetch(`${BASE_URL}/analytics`);
    const finalAnalytics = await finalAnalyticsResponse.json();
    console.log("✅ 최종 Analytics:", finalAnalytics);

    console.log("\n🎉 모든 테스트 완료!");
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
  }
}

// 서버가 시작될 때까지 대기 후 테스트 실행
async function waitForServer() {
  const maxRetries = 10;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        console.log("✅ 서버 준비 완료, 테스트 시작합니다...\n");
        return true;
      }
    } catch (error) {
      // 서버가 아직 시작되지 않음
    }

    retries++;
    console.log(`⏳ 서버 시작 대기중... (${retries}/${maxRetries})`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("서버 시작 대기 시간 초과");
}

if (import.meta.main) {
  waitForServer()
    .then(() => testKMessageService())
    .catch((error) => {
      console.error("❌ 테스트 시작 실패:", error);
      process.exit(1);
    });
}
