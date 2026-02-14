import { createRoute } from "honox/factory";
import { Header } from "../components/Header";
import { Layout } from "../components/Layout";
import { Navigation } from "../components/Navigation";
import { NotificationToast } from "../components/NotificationToast";
import { ProvidersTab } from "../components/ProvidersTab";

export default createRoute(async (c) => {
  return c.render(
    <Layout title="프로바이더 - K-Message Admin Dashboard">
      <div class="min-h-screen">
        <Header />
        <Navigation />

        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            <ProvidersTab />
          </div>
        </main>

        <NotificationToast />
      </div>
    </Layout>,
  );
});
