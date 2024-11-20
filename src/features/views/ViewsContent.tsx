"use client";

import ViewsTable from "./ViewsTable";
import { useActiveConfig } from "@/features/config/config-provider";
import { useSchema } from "@/lib/knack/hooks/useSchema";
import { Loading } from "@/components/ui/loading";
import { KnackView } from "@/lib/knack/types/view";

interface ViewWithScene extends KnackView {
  sceneName: string;
  sceneKey: string;
}

export default function ViewsContent() {
  const { config } = useActiveConfig();

  const {
    data: schema,
    isLoading: isLoadingSchema,
    isError: isSchemaError,
  } = useSchema({
    config: config!,
    enabled: !!config?.config?.applicationId,
  });

  if (isLoadingSchema) {
    return <Loading message="Loading schema..." />;
  }

  if (isSchemaError || !schema) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load schema</p>
      </div>
    );
  }

  if (!config?.config?.applicationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No configuration found</p>
      </div>
    );
  }

  // Flatten views from all scenes into a single array with scene info
  const views: ViewWithScene[] = schema.scenes.flatMap((scene) =>
    scene.views.map((view) => ({
      ...view,
      sceneName: scene.name,
      sceneKey: scene.key,
    }))
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Views</h1>
          <p className="text-sm text-muted-foreground">
            {config.applicationInfo?.name || config.config.applicationId}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {views.length} views found
        </p>
      </div>
      <ViewsTable views={views} />
    </div>
  );
}
