import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { KnackScene } from "@/lib/knack/types/scenes";
import { cn } from "@/lib/utils";

interface SceneDetailsCardProps {
  scene: KnackScene;
}

export function SceneDetailsCard({ scene }: SceneDetailsCardProps) {
  return (
    <Card className="glass-card border-glow">
      <CardHeader>
        <CardTitle className="text-glow-white text-glow-sm">
          {scene.name}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Scene Details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Key</dt>
            <dd className="font-mono text-sm glass-border px-2 py-1 rounded bg-muted/5 inline-block">
              {scene.key}
            </dd>
          </div>

          {scene.slug && (
            <div className="space-y-1">
              <dt className="text-sm text-muted-foreground">Slug</dt>
              <dd className="font-mono text-sm glass-border px-2 py-1 rounded bg-muted/5 inline-block">
                {scene.slug}
              </dd>
            </div>
          )}

          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Authentication</dt>
            <dd
              className={cn(
                "text-sm px-2 py-1 rounded inline-block",
                scene.authenticated
                  ? "bg-warning-glow/10 text-glow-amber text-glow-sm"
                  : "bg-success-glow/10 text-success-glow text-glow-sm"
              )}
            >
              {scene.authenticated ? "Required" : "Public"}
            </dd>
          </div>

          {scene.parent && (
            <div className="space-y-1">
              <dt className="text-sm text-muted-foreground">Parent Scene</dt>
              <dd className="font-mono text-sm glass-border px-2 py-1 rounded bg-muted/5 inline-block">
                {scene.parent}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
