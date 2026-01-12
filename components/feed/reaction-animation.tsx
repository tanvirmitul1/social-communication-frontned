"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactionType } from "@/types/feed.types";

interface ReactionAnimationProps {
  reaction: ReactionType | null;
  trigger: number; // Change this to trigger animation
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  LIKE: "👍",
  LOVE: "❤️", 
  HAHA: "😂",
  WOW: "😮",
  SAD: "😢",
  ANGRY: "😡"
};

export function ReactionAnimation({ reaction, trigger }: ReactionAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (reaction && trigger > 0) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [reaction, trigger]);

  return (
    <AnimatePresence>
      {showAnimation && reaction && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 0 }}
          animate={{ 
            scale: [0, 1.5, 1], 
            opacity: [0, 1, 0], 
            y: [0, -30, -60] 
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 1,
            times: [0, 0.3, 1],
            ease: "easeOut"
          }}
          className="absolute pointer-events-none z-10"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <span className="text-2xl">
            {REACTION_EMOJIS[reaction]}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}