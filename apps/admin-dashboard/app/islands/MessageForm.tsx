import { useState } from "hono/jsx";

export default function MessageForm() {
  const [message, setMessage] = useState({
    templateId: "",
    phoneNumber: "",
    variables: "{}",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let variables = {};
      if (message.variables.trim()) {
        variables = JSON.parse(message.variables);
      }

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: message.templateId,
          phoneNumber: message.phoneNumber,
          variables,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Show success notification
        setMessage({ templateId: "", phoneNumber: "", variables: "{}" });
      }
    } catch (error) {
      console.error("Message send failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
          메시지 발송
        </h3>
        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">
              템플릿 ID
            </label>
            <input
              type="text"
              value={message.templateId}
              onInput={(e) =>
                setMessage({ ...message, templateId: e.currentTarget.value })
              }
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
              value={message.phoneNumber}
              onInput={(e) =>
                setMessage({ ...message, phoneNumber: e.currentTarget.value })
              }
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
              value={message.variables}
              onInput={(e) =>
                setMessage({ ...message, variables: e.currentTarget.value })
              }
              rows={3}
              placeholder='{"이름": "홍길동", "금액": "10000"}'
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? "발송 중..." : "메시지 발송"}
          </button>
        </form>
      </div>
    </div>
  );
}
