"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useConfig } from "@/hooks/useConfig";
import { Plus, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { configs, activeConfig } = useConfig();

  return (
    <div className="container max-w-4xl py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">Welcome to Knack Explorer</h1>
        <p className="text-xl text-muted-foreground">
          A powerful tool for exploring and managing your Knack applications
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {configs.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Create your first configuration to start exploring your Knack
                application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/config/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Continue Exploring</CardTitle>
              <CardDescription>
                {activeConfig
                  ? `Currently working with ${activeConfig.name}`
                  : "Select a configuration to continue"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              {activeConfig && (
                <Button onClick={() => router.push(`/${activeConfig.id}`)}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push("/config")}>
                Manage Configurations
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
