import { FC } from 'hono/jsx';

interface ProvidersTabProps {
  platformInfo?: any;
  healthStatus?: any;
}

export const ProvidersTab: FC<ProvidersTabProps> = ({ platformInfo = {}, healthStatus = {} }) => {
  const provider = platformInfo.provider || {};
  const providerHealth = healthStatus.provider || {};

  return (
    <div class="space-y-6">
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">프로바이더 목록</h3>
          <div class="space-y-3">
            <div class="border rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-lg font-medium text-gray-900">{provider.name || 'IWINV Provider'}</h4>
                  <p class="text-sm text-gray-500">ID: {provider.id || 'iwinv'}</p>
                  {provider.capabilities && (
                    <div class="mt-2">
                      <p class="text-sm font-medium text-gray-700">기능:</p>
                      <div class="flex flex-wrap gap-1 mt-1">
                        {Object.entries(provider.capabilities).map(([key, value]) => (
                          <span 
                            key={key}
                            class={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {key}: {value ? '지원' : '미지원'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span 
                  class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    providerHealth.healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {providerHealth.healthy ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {providerHealth.issues && providerHealth.issues.length > 0 && (
                <div class="mt-3">
                  <p class="text-sm font-medium text-red-700">문제점:</p>
                  <ul class="text-sm text-red-600 list-disc list-inside mt-1">
                    {providerHealth.issues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};