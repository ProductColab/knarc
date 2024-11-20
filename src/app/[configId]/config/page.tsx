import { ConfigContent } from "@/features/config/components/ConfigContent";

export const runtime = "edge";

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4">
      <ConfigContent />
    </div>
  );
}
