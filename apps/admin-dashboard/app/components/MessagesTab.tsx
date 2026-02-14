import type { FC } from "hono/jsx";

export const MessagesTab: FC = () => {
  return (
    <div class="space-y-6">
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            메시지 발송
          </h3>
          <form
            hx-post="/api/messages/send"
            hx-target="#notification"
            hx-swap="outerHTML"
            class="space-y-4"
          >
            <div>
              <label class="block text-sm font-medium text-gray-700">
                템플릿 ID
              </label>
              <input
                type="text"
                name="templateId"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">
                수신자 전화번호
              </label>
              <input
                type="tel"
                name="phoneNumber"
                required
                pattern="[0-9]{10,11}"
                placeholder="01012345678"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">
                변수 (JSON 형식)
              </label>
              <textarea
                name="variables"
                rows="3"
                placeholder='{"이름": "홍길동", "금액": "10000"}'
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>

            <button
              type="submit"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              메시지 발송
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
