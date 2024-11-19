import { SettingsContent } from "@/features/settings/components/SettingsContent";

export const runtime = "edge";

export default function Home() {
  // Show wizard if no settings, otherwise redirect to first application
  return <SettingsContent applicationId={null} />;
}
