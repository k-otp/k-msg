export const dashboardHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlimTalk Platform - Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen" x-data="dashboard">
        <!-- Header -->
        <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <h1 class="text-xl font-semibold text-gray-900">AlimTalk Platform</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              :class="platformHealth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                            <span :class="platformHealth ? 'bg-green-400' : 'bg-red-400'" 
                                  class="w-2 h-2 rounded-full mr-2"></span>
                            <span x-text="platformHealth ? 'Healthy' : 'Unhealthy'"></span>
                        </span>
                    </div>
                </div>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="bg-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex space-x-8">
                    <button @click="currentTab = 'dashboard'" 
                            :class="currentTab === 'dashboard' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-300 hover:text-white'"
                            class="border-b-2 py-4 px-1 text-sm font-medium">
                        대시보드
                    </button>
                    <button @click="currentTab = 'templates'" 
                            :class="currentTab === 'templates' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-300 hover:text-white'"
                            class="border-b-2 py-4 px-1 text-sm font-medium">
                        템플릿 관리
                    </button>
                    <button @click="currentTab = 'messages'" 
                            :class="currentTab === 'messages' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-300 hover:text-white'"
                            class="border-b-2 py-4 px-1 text-sm font-medium">
                        메시지 발송
                    </button>
                    <button @click="currentTab = 'providers'" 
                            :class="currentTab === 'providers' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-300 hover:text-white'"
                            class="border-b-2 py-4 px-1 text-sm font-medium">
                        프로바이더
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            
            <!-- Dashboard Tab -->
            <div x-show="currentTab === 'dashboard'" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Platform Info Card -->
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                                        <span class="text-white text-sm font-medium">🚀</span>
                                    </div>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">플랫폼 상태</dt>
                                        <dd class="text-lg font-medium text-gray-900" x-text="platformInfo.version || 'Loading...'"></dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Providers Card -->
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                        <span class="text-white text-sm font-medium">🔌</span>
                                    </div>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">등록된 프로바이더</dt>
                                        <dd class="text-lg font-medium text-gray-900" x-text="(platformInfo.providers || []).length"></dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Features Card -->
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                        <span class="text-white text-sm font-medium">⚡</span>
                                    </div>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">활성 기능</dt>
                                        <dd class="text-lg font-medium text-gray-900" x-text="(platformInfo.features || []).length"></dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Health Status -->
                <div class="bg-white shadow rounded-lg">
                    <div class="px-4 py-5 sm:p-6">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">시스템 상태</h3>
                        <div class="space-y-2">
                            <template x-for="(healthy, provider) in healthStatus.providers" :key="provider">
                                <div class="flex items-center justify-between">
                                    <span x-text="provider" class="text-sm font-medium text-gray-900"></span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                          :class="healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                        <span :class="healthy ? 'bg-green-400' : 'bg-red-400'" 
                                              class="w-2 h-2 rounded-full mr-2"></span>
                                        <span x-text="healthy ? 'Healthy' : 'Unhealthy'"></span>
                                    </span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Templates Tab -->
            <div x-show="currentTab === 'templates'" class="space-y-6">
                <div class="bg-white shadow rounded-lg">
                    <div class="px-4 py-5 sm:p-6">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">새 템플릿 생성</h3>
                        <form @submit.prevent="createTemplate" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">템플릿 이름</label>
                                <input type="text" x-model="newTemplate.name" required
                                       class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">카테고리</label>
                                <select x-model="newTemplate.category" required
                                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="AUTHENTICATION">인증</option>
                                    <option value="NOTIFICATION">알림</option>
                                    <option value="PROMOTION">프로모션</option>
                                    <option value="INFORMATION">정보</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">템플릿 내용</label>
                                <textarea x-model="newTemplate.content" @input="validateTemplate" rows="4" required
                                          placeholder="#{변수명} 형식으로 변수를 사용하세요"
                                          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                                <p class="mt-2 text-sm text-gray-500">발견된 변수: <span x-text="detectedVariables.join(', ')"></span></p>
                            </div>
                            <button type="submit" :disabled="templateLoading"
                                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                                <span x-show="!templateLoading">템플릿 생성</span>
                                <span x-show="templateLoading">생성 중...</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Messages Tab -->
            <div x-show="currentTab === 'messages'" class="space-y-6">
                <div class="bg-white shadow rounded-lg">
                    <div class="px-4 py-5 sm:p-6">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">메시지 발송</h3>
                        <form @submit.prevent="sendMessage" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">템플릿 ID</label>
                                <input type="text" x-model="newMessage.templateId" required
                                       class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">수신자 전화번호</label>
                                <input type="tel" x-model="newMessage.phoneNumber" required pattern="[0-9]{10,11}"
                                       placeholder="01012345678"
                                       class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">변수 (JSON 형식)</label>
                                <textarea x-model="newMessage.variables" rows="3"
                                          placeholder='{"이름": "홍길동", "금액": "10000"}'
                                          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                            </div>
                            <button type="submit" :disabled="messageLoading"
                                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                                <span x-show="!messageLoading">메시지 발송</span>
                                <span x-show="messageLoading">발송 중...</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Providers Tab -->
            <div x-show="currentTab === 'providers'" class="space-y-6">
                <div class="bg-white shadow rounded-lg">
                    <div class="px-4 py-5 sm:p-6">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">프로바이더 목록</h3>
                        <div class="space-y-3">
                            <template x-for="provider in platformInfo.providers" :key="provider">
                                <div class="border rounded-lg p-4">
                                    <div class="flex items-center justify-between">
                                        <h4 x-text="provider" class="text-lg font-medium text-gray-900"></h4>
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                              :class="healthStatus.providers && healthStatus.providers[provider] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                            <span x-text="healthStatus.providers && healthStatus.providers[provider] ? 'Active' : 'Inactive'"></span>
                                        </span>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

        </main>

        <!-- Notifications -->
        <div x-show="notification.show" 
             x-transition:enter="transform ease-out duration-300 transition"
             x-transition:enter-start="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
             x-transition:enter-end="translate-y-0 opacity-100 sm:translate-x-0"
             x-transition:leave="transition ease-in duration-100"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
            <div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                <div class="p-4">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <span x-show="notification.type === 'success'" class="h-6 w-6 text-green-400">✅</span>
                            <span x-show="notification.type === 'error'" class="h-6 w-6 text-red-400">❌</span>
                        </div>
                        <div class="ml-3 w-0 flex-1 pt-0.5">
                            <p x-text="notification.message" class="text-sm font-medium text-gray-900"></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function dashboard() {
            return {
                currentTab: 'dashboard',
                platformInfo: {},
                healthStatus: {},
                platformHealth: false,
                templateLoading: false,
                messageLoading: false,
                detectedVariables: [],
                
                newTemplate: {
                    name: '',
                    content: '',
                    category: 'NOTIFICATION'
                },
                
                newMessage: {
                    templateId: '',
                    phoneNumber: '',
                    variables: '{}'
                },
                
                notification: {
                    show: false,
                    type: 'success',
                    message: ''
                },

                async init() {
                    await this.loadPlatformInfo();
                    await this.loadHealthStatus();
                },

                async loadPlatformInfo() {
                    try {
                        const response = await fetch('/api/info');
                        const data = await response.json();
                        this.platformInfo = data;
                    } catch (error) {
                        console.error('Failed to load platform info:', error);
                    }
                },

                async loadHealthStatus() {
                    try {
                        const response = await fetch('/api/providers/health');
                        const result = await response.json();
                        if (result.success) {
                            this.healthStatus = result.data;
                            this.platformHealth = result.data.healthy;
                        }
                    } catch (error) {
                        console.error('Failed to load health status:', error);
                    }
                },

                validateTemplate() {
                    if (this.newTemplate.content) {
                        const variables = this.newTemplate.content.match(/#{([^}]+)}/g) || [];
                        this.detectedVariables = variables.map(v => v.slice(2, -1));
                    } else {
                        this.detectedVariables = [];
                    }
                },

                async createTemplate() {
                    this.templateLoading = true;
                    try {
                        const response = await fetch('/api/templates', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(this.newTemplate)
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            this.showNotification('success', '템플릿이 성공적으로 생성되었습니다!');
                            this.newTemplate = { name: '', content: '', category: 'NOTIFICATION' };
                            this.detectedVariables = [];
                        } else {
                            this.showNotification('error', result.error || '템플릿 생성에 실패했습니다.');
                        }
                    } catch (error) {
                        this.showNotification('error', '템플릿 생성 중 오류가 발생했습니다.');
                    } finally {
                        this.templateLoading = false;
                    }
                },

                async sendMessage() {
                    this.messageLoading = true;
                    try {
                        let variables = {};
                        if (this.newMessage.variables.trim()) {
                            variables = JSON.parse(this.newMessage.variables);
                        }

                        const response = await fetch('/api/messages/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                templateId: this.newMessage.templateId,
                                phoneNumber: this.newMessage.phoneNumber,
                                variables
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            this.showNotification('success', '메시지가 성공적으로 발송되었습니다!');
                            this.newMessage = { templateId: '', phoneNumber: '', variables: '{}' };
                        } else {
                            this.showNotification('error', result.error || '메시지 발송에 실패했습니다.');
                        }
                    } catch (error) {
                        this.showNotification('error', '메시지 발송 중 오류가 발생했습니다.');
                    } finally {
                        this.messageLoading = false;
                    }
                },

                showNotification(type, message) {
                    this.notification = { show: true, type, message };
                    setTimeout(() => {
                        this.notification.show = false;
                    }, 5000);
                }
            }
        }
    </script>
</body>
</html>
`;
