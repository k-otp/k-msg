import { Hono } from "hono";
import { MessageServiceFactory } from "k-msg";

// 환경 변수 설정
const config = {
  iwinvApiKey: process.env.IWINV_API_KEY || "test-key",
  iwinvBaseUrl: process.env.IWINV_BASE_URL,
  debug: process.env.NODE_ENV !== "production",
};

// 🎉 새로운 방식: 팩토리로 간단하게 서비스 생성
const kmsgService = MessageServiceFactory.createIWINVService({
  apiKey: config.iwinvApiKey,
  baseUrl: config.iwinvBaseUrl,
  debug: config.debug,
  autoLoad: true, // 자동으로 채널과 템플릿 로드
});

// Hono 앱 생성
const app = new Hono();

// === API 엔드포인트 ===
// 헬스 체크
app.get("/health", async (c) => {
  const health = await kmsgService.healthCheck();
  return c.json(health);
});

// 템플릿 생성
app.post("/templates", async (c) => {
  const body = await c.req.json();
  const { name, content, category } = body;

  if (!name || !content || !category) {
    return c.json(
      {
        success: false,
        error: "Missing required fields: name, content, category",
      },
      400,
    );
  }

  const result = await kmsgService.createTemplate(name, content, category);
  return c.json(result);
});

// 템플릿 목록 조회 (쿼리 파라미터로 소스 선택)
app.get("/templates", async (c) => {
  const source =
    (c.req.query("source") as "local" | "provider" | "all") || "all";
  const result = kmsgService.getTemplates(source);
  return c.json(result);
});

// 채널 목록 조회
app.get("/channels", async (c) => {
  const result = kmsgService.getChannels();
  return c.json(result);
});

// 메시지 발송
app.post("/messages/send", async (c) => {
  const body = await c.req.json();
  const { phoneNumber, templateName, variables } = body;

  if (!phoneNumber || !templateName) {
    return c.json(
      {
        success: false,
        error: "Missing required fields: phoneNumber, templateName",
      },
      400,
    );
  }

  const result = await kmsgService.sendMessage(
    phoneNumber,
    templateName,
    variables || {},
  );
  return c.json(result);
});

// Analytics 조회
app.get("/analytics", async (c) => {
  const result = await kmsgService.getAnalytics();
  return c.json(result);
});

// 프로바이더 데이터 새로고침
app.post("/provider/refresh", async (c) => {
  const result = await kmsgService.refreshProviderData();
  return c.json(result);
});

// === IWINV 특화 엔드포인트 ===
// IWINV 잔액 조회
app.get("/iwinv/balance", async (c) => {
  const result = await kmsgService.getIWINVBalance();
  return c.json(result);
});

// IWINV 발송 이력
app.get("/iwinv/history", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const size = parseInt(c.req.query("size") || "20");
  const result = await kmsgService.getIWINVHistory(page, size);
  return c.json(result);
});

// 서버 시작
const port = process.env.PORT ? parseInt(process.env.PORT) : 3010;

console.log(`🚀 K-Message Service V2 starting on port ${port}`);
console.log(`📦 Using new MessageServiceFactory with auto-loading`);

// Bun serve configuration
export default {
  port,
  fetch: app.fetch,
  development: process.env.NODE_ENV !== "production",
};
