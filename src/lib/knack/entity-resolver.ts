import { KnackApplication } from "./types/application";
import { KnackObject } from "./types/object";
import { KnackField } from "./types/field";
import { KnackView } from "./types/view";
import { KnackScene } from "./types/scene";

export function resolveKnackEntity(
  app: KnackApplication,
  type: string,
  key: string
) {
  switch (type) {
    case "object":
      return app.objects?.find((o: KnackObject) => o.key === key) ?? null;
    case "field":
      for (const obj of app.objects ?? []) {
        const found = (obj.fields ?? []).find((f: KnackField) => f.key === key);
        if (found)
          return { ...found, objectKey: obj.key, objectName: obj.name };
      }
      return null;
    case "view":
      for (const scene of app.scenes ?? []) {
        const found = (scene.views ?? []).find((v: KnackView) => v.key === key);
        if (found)
          return { ...found, sceneKey: scene.key, sceneName: scene.name };
      }
      return null;
    case "scene":
      return app.scenes?.find((s: KnackScene) => s.key === key) ?? null;
    default:
      return null;
  }
}
