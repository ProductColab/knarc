"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const pulseVariants = {
  initial: { scale: 0.95, opacity: 0.5 },
  animate: {
    scale: 1,
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const shimmerVariants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear",
    },
  },
};

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden border-2 border-dashed">
          {/* Shimmer effect overlay */}
          <motion.div
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          />

          <div className="p-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Animated icon */}
              <motion.div
                variants={pulseVariants}
                initial="initial"
                animate="animate"
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>

              {/* Loading text placeholders */}
              <div className="space-y-4 w-full">
                <motion.div
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-6 w-3/4 bg-muted rounded-md mx-auto"
                />
                <motion.div
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                  className="h-4 w-1/2 bg-muted rounded-md mx-auto"
                />
              </div>

              {/* Loading indicator dots */}
              <div className="flex gap-2 justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Loading text */}
        <motion.p
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
