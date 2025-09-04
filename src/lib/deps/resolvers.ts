import { KnackApplication } from "@/lib/knack/types/application";

export interface Resolvers {
  objectKeyToName: Map<string, string>;
  connectionFieldKeyToObjectKey: Map<string, string>;
}

export function buildResolvers(app: KnackApplication): Resolvers {
  const objectKeyToName = new Map<string, string>();
  const connectionFieldKeyToObjectKey = new Map<string, string>();

  for (const obj of app.objects ?? []) {
    if (obj?.key && obj?.name) {
      objectKeyToName.set(obj.key, obj.name);
    }
    for (const f of obj.fields ?? []) {
      // Map connection field key -> target object key
      // Knack connection fields use type === "connection" and have relationship.object
      if (f?.type === "connection") {
        const key = (f as any)?.key as string | undefined;
        const target = (f as any)?.relationship?.object as string | undefined;
        if (key && target) {
          connectionFieldKeyToObjectKey.set(key, target);
        }
      }
    }
  }

  return { objectKeyToName, connectionFieldKeyToObjectKey };
}

export function resolveObjectName(
  resolvers: Resolvers | undefined,
  objectKey: string | undefined
): string | undefined {
  if (!resolvers || !objectKey) return undefined;
  return resolvers.objectKeyToName.get(objectKey);
}

export function resolveConnectionTargetObjectKey(
  resolvers: Resolvers | undefined,
  connectionFieldKey: string | undefined
): string | undefined {
  if (!resolvers || !connectionFieldKey) return undefined;
  return resolvers.connectionFieldKeyToObjectKey.get(connectionFieldKey);
}
