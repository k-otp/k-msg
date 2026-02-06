import { useState } from 'hono/jsx';

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'templates', label: '템플릿 관리' },
    { id: 'messages', label: '메시지 발송' },
    { id: 'providers', label: '프로바이더' },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    
    // Navigate to the route (HonoX will handle routing)
    window.history.pushState(null, '', `/${tabId}`);
    
    // Trigger navigation event for HonoX
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <nav class="bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              class={`border-b-2 py-4 px-1 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-white' 
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-600'
              }`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}