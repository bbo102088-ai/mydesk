import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardWidgets } from "@/components/layout/DashboardWidgets";

export default function Home() {
  return (
    <main>
      <DashboardLayout
        left={<DashboardWidgets column="left" />}
        right={<DashboardWidgets column="right" />}
      />
    </main>
  );
}
