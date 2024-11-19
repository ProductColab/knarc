import { ConfigContent } from "@/features/config/components/ConfigContent";

export const runtime = "edge";

export default function SettingsPage({
  params,
}: {
  params: { configId: string };
}) {
  return (
    <div className="container mx-auto p-4">
      <ConfigContent configId={parseInt(params.configId)} />
    </div>
  );
}
