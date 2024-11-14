"use client";

import Link from "next/link";
import type { KnackScene } from "../types";

interface SceneProps {
  scene: KnackScene;
}

export function Scene({ scene }: SceneProps) {
  return (
    <Link
      href={`/scenes/${scene.key}`}
      className="block p-4 border rounded-lg hover:bg-gray-50"
    >
      <h3 className="font-medium">{scene.name}</h3>
      <p className="text-sm text-gray-600">Key: {scene.key}</p>
      {scene.slug && (
        <p className="text-sm text-gray-600">Slug: {scene.slug}</p>
      )}
    </Link>
  );
}
