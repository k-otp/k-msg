import { useState, useEffect } from 'hono/jsx';

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  type: 'SMS' | 'ALIMTALK';
  channelId?: string;
}

interface Channel {
  id: string;
  name: string;
  phoneNumber: string;
}

export default function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [templateType, setTemplateType] = useState<'SMS' | 'ALIMTALK'>('ALIMTALK');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 채널 목록 불러오기
  const loadChannels = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/channels');
      const result = await response.json();
      if (result.success) {
        setChannels(result.data || []);
        if (result.data && result.data.length > 0) {
          setSelectedChannel(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  // 템플릿 목록 불러오기
  const loadTemplates = async () => {
    if (templateType === 'ALIMTALK' && !selectedChannel) {
      setError('알림톡 템플릿을 불러오려면 채널을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let url = `http://localhost:3001/api/templates?type=${templateType}`;
      if (templateType === 'ALIMTALK' && selectedChannel) {
        url += `&channelId=${selectedChannel}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data || []);
      } else {
        setError(result.error || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 타입 변경 시
  const handleTypeChange = async (type: 'SMS' | 'ALIMTALK') => {
    setTemplateType(type);
    setTemplates([]);
    
    if (type === 'ALIMTALK' && channels.length === 0) {
      await loadChannels();
    }
  };

  // 초기 로드
  useEffect(() => {
    loadChannels();
  }, []);

  // 템플릿 타입이나 채널이 변경될 때 자동으로 템플릿 로드
  useEffect(() => {
    if (templateType === 'SMS' || (templateType === 'ALIMTALK' && selectedChannel)) {
      loadTemplates();
    }
  }, [templateType, selectedChannel]);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">기존 템플릿</h3>
          <button
            onClick={loadTemplates}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            새로고침
          </button>
        </div>

        {/* 템플릿 타입 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            템플릿 타입
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="SMS"
                checked={templateType === 'SMS'}
                onChange={(e) => handleTypeChange('SMS')}
                className="mr-2"
              />
              문자 (SMS)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="ALIMTALK"
                checked={templateType === 'ALIMTALK'}
                onChange={(e) => handleTypeChange('ALIMTALK')}
                className="mr-2"
              />
              알림톡
            </label>
          </div>
        </div>

        {/* 채널 선택 (알림톡인 경우) */}
        {templateType === 'ALIMTALK' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              채널 선택
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">채널을 선택하세요</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name} ({channel.phoneNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 템플릿 목록 */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">템플릿을 불러오는 중...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>등록된 {templateType === 'SMS' ? '문자' : '알림톡'} 템플릿이 없습니다.</p>
              {templateType === 'ALIMTALK' && !selectedChannel && (
                <p className="text-sm mt-1">채널을 선택한 후 새로고침 버튼을 클릭하세요.</p>
              )}
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.type === 'SMS' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {template.type === 'SMS' ? '문자' : '알림톡'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.content}</p>
                    {template.channelId && (
                      <p className="text-xs text-gray-400">
                        채널: {channels.find(c => c.id === template.channelId)?.name || template.channelId}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-sm text-indigo-600 hover:text-indigo-800">
                      사용
                    </button>
                    <button className="text-sm text-gray-600 hover:text-gray-800">
                      수정
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}