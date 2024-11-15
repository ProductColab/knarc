import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { KnackScene } from "@/lib/knack/types/scenes";

interface SceneDetailsCardProps {
  scene: KnackScene;
}

export function SceneDetailsCard({ scene }: SceneDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{scene.name}</CardTitle>
        <CardDescription>Scene Details</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-2">
          <dt className="text-muted-foreground">Key</dt>
          <dd>{scene.key}</dd>
          {scene.slug && (
            <>
              <dt className="text-muted-foreground">Slug</dt>
              <dd>{scene.slug}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Authentication Required</dt>
          <dd>{scene.authenticated ? "Yes" : "No"}</dd>
          {scene.parent && (
            <>
              <dt className="text-muted-foreground">Parent Scene</dt>
              <dd>{scene.parent}</dd>
            </>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
