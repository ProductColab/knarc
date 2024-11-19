import { ConfigContent } from "@/features/config/components/ConfigContent";

export const runtime = "edge";

export default function Home() {
  // Show wizard if no settings, otherwise redirect to first application
  return <ConfigContent configId={null} />;
}
