import { useState } from 'hono/jsx';

export default function TemplateForm() {
  const [template, setTemplate] = useState({
    name: '',
    content: '',
    category: 'NOTIFICATION'
  });
  const [variables, setVariables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleContentChange = (content: string) => {
    setTemplate({ ...template, content });
    // Extract variables from template content
    const foundVars = content.match(/#{([^}]+)}/g) || [];
    setVariables(foundVars.map(v => v.slice(2, -1)));
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use the API server on port 3001
      const response = await fetch('http://localhost:3001/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('템플릿이 성공적으로 생성되었습니다!');
        setTemplate({ name: '', content: '', category: 'NOTIFICATION' });
        setVariables([]);
      } else {
        alert('템플릿 생성에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('Template creation failed:', error);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">새 템플릿 생성</h3>
        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">템플릿 이름</label>
            <input 
              type="text" 
              value={template.name}
              onInput={(e) => setTemplate({ ...template, name: e.currentTarget.value })}
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">카테고리</label>
            <select 
              value={template.category}
              onChange={(e) => setTemplate({ ...template, category: e.currentTarget.value })}
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="AUTHENTICATION">인증</option>
              <option value="NOTIFICATION">알림</option>
              <option value="PROMOTION">프로모션</option>
              <option value="INFORMATION">정보</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">템플릿 내용</label>
            <textarea 
              value={template.content}
              onInput={(e) => handleContentChange(e.currentTarget.value)}
              rows={4} 
              required
              placeholder="#{변수명} 형식으로 변수를 사용하세요"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div class="mt-2 text-sm text-gray-500">
              발견된 변수: {variables.length > 0 ? (
                variables.map((variable, index) => (
                  <span key={variable} class="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 mr-1">
                    #{variable}
                  </span>
                ))
              ) : (
                <span class="text-gray-400">-</span>
              )}
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? '생성 중...' : '템플릿 생성'}
          </button>
        </form>
      </div>
    </div>
  );
}