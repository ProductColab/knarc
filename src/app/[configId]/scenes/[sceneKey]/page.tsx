export const runtime = "edge";

import { SceneContent } from "./components/scene-content";

export default function ScenePage({
  params,
}: {
  params: { configId: string; sceneKey: string };
}) {
  const { configId, sceneKey } = params;

  return <SceneContent configId={configId} sceneKey={sceneKey} />;
}
