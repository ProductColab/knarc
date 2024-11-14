"use client";

import { useScenes } from "@/lib/knack/hooks/useScenes";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function ScenePage() {
  const params = useParams();
  const sceneKey = params.sceneKey as string;
  const { scenes, loading, error } = useScenes();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const scene = scenes.find((s) => s.key === sceneKey);

  if (!scene) {
    notFound();
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{scene.name}</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-gray-600">Key</dt>
            <dd>{scene.key}</dd>
            {scene.slug && (
              <>
                <dt className="text-gray-600">Slug</dt>
                <dd>{scene.slug}</dd>
              </>
            )}
            <dt className="text-gray-600">Authentication Required</dt>
            <dd>{scene.authenticated ? "Yes" : "No"}</dd>
            {scene.parent && (
              <>
                <dt className="text-gray-600">Parent Scene</dt>
                <dd>{scene.parent}</dd>
              </>
            )}
          </dl>
        </div>
        {scene.views && scene.views.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold">Views</h2>
            <ul className="space-y-2">
              {scene.views.map((view) => (
                <li key={view.key}>
                  <Link
                    href={`/scenes/${scene.key}/${view.key}`}
                    className="block p-2 border rounded hover:bg-gray-50"
                  >
                    <span className="font-medium">{view.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({view.key})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
