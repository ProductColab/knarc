"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Layout, Database, FileJson, Settings } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";

const features = [
  {
    title: "Scenes Explorer",
    description: "Navigate through your Knack app's scenes and views",
    icon: Layout,
    href: "scenes",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Objects & Fields",
    description: "Explore your data model and field configurations",
    icon: Database,
    href: "objects",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "API Explorer",
    description: "Test API endpoints and explore your data",
    icon: FileJson,
    href: "api-explorer",
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Settings",
    description: "Configure your Knack application settings",
    icon: Settings,
    href: "config",
    color: "bg-orange-500/10 text-orange-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { activeConfig } = useConfig();

  if (!activeConfig) return null;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{activeConfig.name}</h1>
        <p className="text-muted-foreground">
          Application ID: {activeConfig.applicationId}
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-2"
      >
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => router.push(`/${activeConfig.id}/${feature.href}`)}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}
