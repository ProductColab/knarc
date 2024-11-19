import { SettingsContent } from "@/features/settings/components/SettingsContent";

export const runtime = "edge";

export default function SettingsPage({
  params,
}: {
  params: { applicationId: string };
}) {
  return (
    <div className="container mx-auto p-4">
      <SettingsContent applicationId={params.applicationId} />
    </div>
  );
}
