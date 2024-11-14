"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Settings,
  Layout,
  Database,
  FileJson,
  ArrowRight,
  Github,
  Sparkles,
} from "lucide-react";
import { useConfig } from "@/lib/hooks/use-config";

const features = [
  {
    title: "Scenes Explorer",
    description: "Navigate through your Knack app's scenes and views",
    icon: Layout,
    href: "/scenes",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Objects & Fields",
    description: "Explore your data model and field configurations",
    icon: Database,
    href: "/objects",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "API Explorer",
    description: "Test API endpoints and explore your data",
    icon: FileJson,
    href: "/api-explorer",
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Settings",
    description: "Configure your Knack application settings",
    icon: Settings,
    href: "/config",
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

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export default function Home() {
  const router = useRouter();
  const { hasConfig } = useConfig();

  if (hasConfig === null) return null;

  if (!hasConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md px-4 py-8"
        >
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Welcome to Knack Explorer!
              </CardTitle>
              <CardDescription className="text-base">
                To get started, you&apos;ll need to configure your Knack
                application settings. This only takes a minute!
              </CardDescription>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => router.push("/config")}
                >
                  Configure Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
              <div className="text-xs text-muted-foreground pt-4">
                You&apos;ll need your Knack application ID and API key handy.
                <br />
                <a
                  href="https://docs.knack.com/docs/api-key-app-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Learn how to find these →
                </a>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Knack Application Explorer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A powerful tool for exploring and managing your Knack application.
            Navigate through scenes, analyze data models, and test API
            endpoints.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card
                className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={() => router.push(feature.href)}
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {feature.title}
                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Open Source Project
          </div>

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                window.open(
                  "https://github.com/productcolab/knack-explorer",
                  "_blank"
                )
              }
            >
              <Github className="w-4 h-4" />
              Star on GitHub
            </Button>
            <Button
              variant="default"
              className="gap-2"
              onClick={() => router.push("/docs")}
            >
              Read Documentation
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
