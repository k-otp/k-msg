import { FC } from 'hono/jsx';

export const Header: FC = () => {
  return (
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">K-Message Platform</h1>
          </div>
          <div class="flex items-center space-x-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span class="w-2 h-2 rounded-full mr-2 bg-green-400"></span>
              Healthy
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};