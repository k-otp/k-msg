// Global client-side JavaScript for HonoX
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
    
    notification.innerHTML = `
      <div class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
        <div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <span class="h-6 w-6">${icon}</span>
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium text-gray-900">${message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      notification.innerHTML = '';
    }, 5000);
  }
}