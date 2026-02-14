import type { FC } from "hono/jsx";

interface DashboardProps {
  platformInfo?: any;
  healthStatus?: any;
  platformHealth?: boolean;
}

export const DashboardPage: FC<DashboardProps> = ({
  platformInfo = {},
  healthStatus = {},
  platformHealth = false,
}) => {
  const providers = platformInfo.providers || [];
  const features = platformInfo.features || {};

  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>K-Message Admin Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/htmx.org@1.9.10" defer></script>
      </head>
      <body class="bg-gray-100">
        <div class="min-h-screen">
          {/* Header */}
          <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="flex justify-between h-16">
                <div class="flex items-center">
                  <h1 class="text-xl font-semibold text-gray-900">
                    K-Message Platform
                  </h1>
                </div>
                <div class="flex items-center space-x-4">
                  <span
                    class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      platformHealth
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <span
                      class={`w-2 h-2 rounded-full mr-2 ${
                        platformHealth ? "bg-green-400" : "bg-red-400"
                      }`}
                    ></span>
                    {platformHealth ? "Healthy" : "Unhealthy"}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Navigation */}
          <nav class="bg-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="flex space-x-8">
                <button
                  class="border-indigo-500 text-white border-b-2 py-4 px-1 text-sm font-medium"
                  hx-get="/dashboard/dashboard"
                  hx-target="#main-content"
                  hx-push-url="true"
                >
                  대시보드
                </button>
                <button
                  class="border-transparent text-gray-300 hover:text-white border-b-2 py-4 px-1 text-sm font-medium"
                  hx-get="/dashboard/templates"
                  hx-target="#main-content"
                  hx-push-url="true"
                >
                  템플릿 관리
                </button>
                <button
                  class="border-transparent text-gray-300 hover:text-white border-b-2 py-4 px-1 text-sm font-medium"
                  hx-get="/dashboard/messages"
                  hx-target="#main-content"
                  hx-push-url="true"
                >
                  메시지 발송
                </button>
                <button
                  class="border-transparent text-gray-300 hover:text-white border-b-2 py-4 px-1 text-sm font-medium"
                  hx-get="/dashboard/providers"
                  hx-target="#main-content"
                  hx-push-url="true"
                >
                  프로바이더
                </button>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div id="main-content">
              {/* Dashboard Tab */}
              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Platform Info Card */}
                  <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                            <span class="text-white text-sm font-medium">
                              🚀
                            </span>
                          </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                          <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">
                              플랫폼 상태
                            </dt>
                            <dd class="text-lg font-medium text-gray-900">
                              {platformInfo.version || "v0.1.0"}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Providers Card */}
                  <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                            <span class="text-white text-sm font-medium">
                              🔌
                            </span>
                          </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                          <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">
                              등록된 프로바이더
                            </dt>
                            <dd class="text-lg font-medium text-gray-900">
                              {providers.length || 1}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features Card */}
                  <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                            <span class="text-white text-sm font-medium">
                              ⚡
                            </span>
                          </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                          <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">
                              활성 기능
                            </dt>
                            <dd class="text-lg font-medium text-gray-900">
                              {Object.keys(features).length || 7}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health Status */}
                <div class="bg-white shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                      시스템 상태
                    </h3>
                    <div class="space-y-2">
                      {healthStatus.services &&
                        Object.entries(healthStatus.services).map(
                          ([service, status]) => (
                            <div
                              key={service}
                              class="flex items-center justify-between"
                            >
                              <span class="text-sm font-medium text-gray-900">
                                {service}
                              </span>
                              <span
                                class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  status === "healthy"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                <span
                                  class={`w-2 h-2 rounded-full mr-2 ${
                                    status === "healthy"
                                      ? "bg-green-400"
                                      : "bg-red-400"
                                  }`}
                                ></span>
                                {status === "healthy" ? "Healthy" : "Unhealthy"}
                              </span>
                            </div>
                          ),
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Notifications */}
          <div id="notification"></div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Global notification handler
            document.addEventListener('htmx:afterRequest', function(event) {
              const xhr = event.detail.xhr;
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  if (response.success) {
                    showNotification('success', response.message || '작업이 완료되었습니다.');
                  } else {
                    showNotification('error', response.error || '작업 중 오류가 발생했습니다.');
                  }
                } catch (e) {
                  // Response is HTML, assume success
                }
              } else {
                showNotification('error', '오류 발생: ' + xhr.statusText);
              }
            });

            function showNotification(type, message) {
              const notification = document.getElementById('notification');
              if (notification) {
                const icon = type === 'success' ? '✅' : '❌';
                
                notification.innerHTML = \`
                  <div class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
                    <div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                      <div class="p-4">
                        <div class="flex items-start">
                          <div class="flex-shrink-0">
                            <span class="h-6 w-6">\${icon}</span>
                          </div>
                          <div class="ml-3 w-0 flex-1 pt-0.5">
                            <p class="text-sm font-medium text-gray-900">\${message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                \`;
                
                setTimeout(() => {
                  notification.innerHTML = '';
                }, 5000);
              }
            }
          `,
          }}
        />
      </body>
    </html>
  );
};
