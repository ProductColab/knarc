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
    <Card>
      <CardHeader>
        <CardTitle>Views</CardTitle>
        <CardDescription>Scene views and components</CardDescription>
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
                <Card className="h-full hover:shadow-lg transition-shadow duration-200 hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ViewTypeIcon
                          type={view.type}
                          className="text-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 text-primary">
                          {view.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono">
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
