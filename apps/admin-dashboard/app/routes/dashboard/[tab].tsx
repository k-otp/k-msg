import { createRoute } from "honox/factory";
import { DashboardTab } from "../../components/DashboardTab";
import { MessagesTab } from "../../components/MessagesTab";
import { ProvidersTab } from "../../components/ProvidersTab";
import { TemplatesTab } from "../../components/TemplatesTab";

export default createRoute(async (c) => {
  const tab = c.req.param("tab") || "dashboard";

  // Fetch platform data for tabs that need it
  let platformInfo = {};
  let healthStatus = {};

  if (tab === "dashboard" || tab === "providers") {
    try {
      const infoRes = await fetch("http://localhost:3000/api/info");
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        if (infoData.success) {
          platformInfo = infoData.data;
        }
      }
    } catch (error) {
      console.warn("Failed to fetch platform info:", error);
    }

    try {
      const healthRes = await fetch("http://localhost:3000/api/health");
      if (healthRes.ok) {
        healthStatus = await healthRes.json();
      }
    } catch (error) {
      console.warn("Failed to fetch health status:", error);
    }
  }

  const renderTab = () => {
    switch (tab) {
      case "templates":
        return <TemplatesTab />;
      case "messages":
        return <MessagesTab />;
      case "providers":
        return (
          <ProvidersTab
            platformInfo={platformInfo}
            healthStatus={healthStatus}
          />
        );
      case "dashboard":
      default:
        return (
          <DashboardTab
            platformInfo={platformInfo}
            healthStatus={healthStatus}
          />
        );
    }
  };

  return c.html(renderTab());
});
