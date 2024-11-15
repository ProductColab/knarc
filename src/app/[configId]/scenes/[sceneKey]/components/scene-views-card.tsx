import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import { KnackView } from "@/lib/knack/types/views";
import { motion } from "framer-motion";
import { ViewTypeIcon } from "./view-type-icon";
import { cn } from "@/lib/utils";

interface SceneViewsCardProps {
  configId: string;
  sceneKey: string;
  views: KnackView[];
}

export function SceneViewsCard({
  configId,
  sceneKey,
  views,
}: SceneViewsCardProps) {
  if (!views?.length) return null;

  return (
    <Card className="glass-card border-glow">
      <CardHeader>
        <CardTitle className="text-glow-white text-glow-sm">Views</CardTitle>
        <CardDescription className="text-muted-foreground">
          Scene views and components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {views.map((view) => (
            <motion.div
              key={view.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link href={`/${configId}/scenes/${sceneKey}/${view.key}`}>
                <Card
                  className={cn(
                    "h-full transition-all duration-300",
                    "glass-border",
                    "hover:border-glow-purple/20",
                    "hover:border-glow-active"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-glow-purple/5 border-glow">
                        <ViewTypeIcon
                          type={view.type}
                          className="text-glow-purple"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 text-glow-white text-glow-sm">
                          {view.name}
                        </h3>
                        <p className="font-mono text-sm glass-border px-2 py-1 rounded bg-muted/5 inline-block">
                          {view.key}
                        </p>
                        <div className="mt-4 text-sm text-muted-foreground">
                          Type: {view.type || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
