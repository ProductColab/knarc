import { ViewContent } from "./components/view-content";
import { cn } from "@/lib/utils";

export default function ViewPage({
  params,
}: {
  params: { configId: string; sceneKey: string; viewKey: string };
}) {
  const { configId, sceneKey, viewKey } = params;

  return (
    <div
      className={cn(
        "relative",
        "animate-in fade-in duration-500",
        "min-h-screen"
      )}
    >
      <ViewContent configId={configId} sceneKey={sceneKey} viewKey={viewKey} />
    </div>
  );
}
