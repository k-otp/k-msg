import { createRoute } from 'honox/factory';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { MessagesTab } from '../components/MessagesTab';
import { NotificationToast } from '../components/NotificationToast';

export default createRoute(async (c) => {
  return c.render(
    <Layout title="메시지 발송 - K-Message Admin Dashboard">
      <div class="min-h-screen">
        <Header />
        <Navigation />
        
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            <MessagesTab />
          </div>
        </main>

        <NotificationToast />
      </div>
    </Layout>
  );
});