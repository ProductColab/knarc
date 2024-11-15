import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { useKnack } from "@/lib/knack/context";
import type { KnackScene } from "@/lib/knack/types/scenes";
import { isSceneProtected } from "@/lib/knack/utils/scenes";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

interface SceneViewSelectorProps {
  onSelect: (path: string) => void;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

export function SceneViewSelector({
  onSelect,
  isAuthenticated,
  onAuthRequired,
}: SceneViewSelectorProps) {
  const { client } = useKnack();
  const [scenes, setScenes] = useState<KnackScene[]>([]);
  const [selectedScene, setSelectedScene] = useState<string>();
  const [selectedView, setSelectedView] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  // Get the current scene's views that can return records
  const getAvailableViews = (sceneKey: string) => {
    const scene = scenes.find((s) => s.key === sceneKey);
    if (!scene) return [];

    return scene.views.filter((view) => ["table", "form"].includes(view.type));
  };

  // Convert scenes to combobox options
  const sceneOptions: ComboboxOption[] =
    scenes?.map((scene) => ({
      value: scene.key,
      label: scene.name,
      icon: isSceneProtected(scene, scenes) ? (
        <Lock className="w-3 h-3 text-muted-foreground" />
      ) : undefined,
    })) ?? [];

  // Convert views to combobox options
  const viewOptions: ComboboxOption[] = selectedScene
    ? getAvailableViews(selectedScene).map((view) => ({
        value: view.key,
        label: view.name,
      }))
    : [];

  // Load scenes on mount
  useEffect(() => {
    const loadScenes = async () => {
      try {
        setLoading(true);
        const schema = await client?.getApplicationSchema();
        if (schema) {
          setScenes(schema.scenes);
        }
      } catch (err) {
        setError("Failed to load scenes");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadScenes();
  }, [client]);

  // Handle scene selection
  const handleSceneSelect = (sceneKey: string) => {
    const scene = scenes.find((s) => s.key === sceneKey);
    if (!scene) return;

    // Notify about auth requirement but don't block selection
    if (isSceneProtected(scene, scenes) && !isAuthenticated) {
      onAuthRequired();
    }

    setSelectedScene(sceneKey);
    setSelectedView(undefined);
  };

  // Handle view selection
  const handleViewSelect = (viewKey: string) => {
    setSelectedView(viewKey);

    // If scene requires auth, make sure we notify
    const scene = scenes.find((s) => s.key === selectedScene);
    if (scene && isSceneProtected(scene, scenes) && !isAuthenticated) {
      onAuthRequired();
    }

    onSelect(`/pages/${selectedScene}/views/${viewKey}/records`);
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading scenes...</div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Scene</Label>
          <Combobox
            options={sceneOptions}
            value={selectedScene}
            onSelect={handleSceneSelect}
            placeholder="Select a scene"
            searchPlaceholder="Search scenes..."
            loading={loading}
            loadingText="Loading scenes..."
          />
        </div>

        <div className="space-y-2">
          <Label>View</Label>
          <Combobox
            options={viewOptions}
            value={selectedView}
            onSelect={handleViewSelect}
            placeholder="Select a view"
            searchPlaceholder="Search views..."
            disabled={!selectedScene}
            loading={loading}
            loadingText="Loading views..."
          />
        </div>
      </div>

      {selectedScene &&
        scenes.find((s) => s.key === selectedScene) &&
        isSceneProtected(
          scenes.find((s) => s.key === selectedScene)!,
          scenes
        ) &&
        !isAuthenticated && (
          <Alert>
            <Lock className="w-4 h-4" />
            <AlertDescription>
              Authentication will be required to access this scene
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
