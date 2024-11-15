import type { KnackScene } from "../types/scenes";

const DEBUG = process.env.NODE_ENV === "development";

function debugLog(...args: unknown[]) {
  if (DEBUG) {
    console.log(...args);
  }
}

/**
 * Recursively finds all parent scenes in the hierarchy
 * @returns Array of scenes from child to root parent
 */
export function findParentScenes(
  scene: KnackScene,
  allScenes: KnackScene[]
): KnackScene[] {
  debugLog("Finding parents for scene:", scene.key, scene);
  const parents: KnackScene[] = [scene];

  let currentScene = scene;
  while (currentScene.parent) {
    debugLog("Looking for parent:", currentScene.parent);
    const parentScene = allScenes.find(
      (s) => s.key === currentScene.parent || s.slug === currentScene.parent
    );

    if (!parentScene) {
      debugLog("Parent not found:", currentScene.parent);
      break;
    }

    debugLog("Found parent:", parentScene.key, parentScene);
    parents.push(parentScene);
    currentScene = parentScene;
  }

  debugLog(
    "Final parent chain:",
    parents.map((s) => ({ key: s.key, slug: s.slug }))
  );
  return parents;
}

/**
 * Checks if a scene requires authentication based on its properties
 */
function isSceneAuthenticated(scene: KnackScene): boolean {
  return (
    // Explicit authentication flag
    scene.authenticated === true ||
    // Has restricted profiles
    (Array.isArray(scene.allowed_profiles) && scene.allowed_profiles.length > 0) ||
    // Login scenes are protected
    scene.slug?.endsWith("-login") ||
    // Scenes with user-specific data are protected
    scene.slug?.includes("user") ||
    scene.slug?.includes("profile")
  );
}

/**
 * Checks if a scene or any of its parents requires authentication
 */
export function isSceneProtected(
  scene: KnackScene,
  allScenes: KnackScene[]
): boolean {
  const parentScenes = findParentScenes(scene, allScenes);
  const isProtected = parentScenes.some(isSceneAuthenticated);

  debugLog(
    "Scene protection check:",
    scene.key,
    "Protected:",
    isProtected,
    "Auth values:",
    parentScenes.map((s) => ({
      key: s.key,
      slug: s.slug,
      authenticated: s.authenticated,
      allowed_profiles: s.allowed_profiles,
      isLoginScene: s.slug?.endsWith("-login"),
    }))
  );

  return isProtected;
}
