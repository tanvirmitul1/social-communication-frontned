"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactionType } from "@/types/feed.types";

interface ReactionOption {
  type: ReactionType;
  icon: React.ReactNode;
  label: string;
  color: string;
  hoverColor: string;
}

const REACTIONS: ReactionOption[] = [
  { 
    type: "LIKE", 
    icon: <ThumbsUp className="h-5 w-5" />, 
    label: "Like",
    color: "text-blue-600",
    hoverColor: "hover:bg-blue-50 dark:hover:bg-blue-950/20"
  },
  { 
    type: "LOVE", 
    icon: <Heart className="h-5 w-5 fill-red-500 text-red-500" />, 
    label: "Love",
    color: "text-red-500",
    hoverColor: "hover:bg-red-50 dark:hover:bg-red-950/20"
  },
  { 
    type: "HAHA", 
    icon: <span className="text-xl">😂</span>, 
    label: "Haha",
    color: "text-yellow-500",
    hoverColor: "hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
  },
  { 
    type: "WOW", 
    icon: <span className="text-xl">😮</span>, 
    label: "Wow",
    color: "text-yellow-600",
    hoverColor: "hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
  },
  { 
    type: "SAD", 
    icon: <span className="text-xl">😢</span>, 
    label: "Sad",
    color: "text-blue-400",
    hoverColor: "hover:bg-blue-50 dark:hover:bg-blue-950/20"
  },
  { 
    type: "ANGRY", 
    icon: <span className="text-xl">😡</span>, 
    label: "Angry",
    color: "text-orange-600",
    hoverColor: "hover:bg-orange-50 dark:hover:bg-orange-950/20"
  },
];

interface ReactionPickerProps {
  currentReaction?: ReactionType | null;
  onReact: (type: ReactionType) => void;
  onUnreact: () => void;
}

export function ReactionPicker({ currentReaction, onReact, onUnreact }: ReactionPickerProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pressTimeout, setPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleReactionClick = (type: ReactionType) => {
    if (currentReaction === type) {
      onUnreact();
    } else {
      onReact(type);
    }
    setShowReactions(false);
  };

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (window.innerWidth >= 768) { // Only on desktop
      setShowReactions(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      const timeout = setTimeout(() => setShowReactions(false), 300);
      setHoverTimeout(timeout);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const timeout = setTimeout(() => {
      setShowReactions(true);
    }, 500); // 500ms long press
    setPressTimeout(timeout);
  };

  const handleTouchEnd = () => {
    if (pressTimeout) {
      clearTimeout(pressTimeout);
      setPressTimeout(null);
    }
    if (!showReactions) {
      // Quick tap - toggle like or remove current reaction
      if (currentReaction) {
        onUnreact();
      } else {
        onReact("LIKE");
      }
    }
  };

  const handleQuickLike = () => {
    if (currentReaction === "LIKE") {
      onUnreact();
    } else {
      onReact("LIKE");
    }
  };

  const currentReactionOption = REACTIONS.find(r => r.type === currentReaction);

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={handleQuickLike}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`gap-2 hover:bg-muted transition-all duration-200 ${
          currentReaction ? currentReactionOption?.color : "hover:text-blue-600"
        }`}
        aria-label="React to post"
      >
        <motion.div
          animate={currentReaction ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {currentReaction ? (
            currentReactionOption?.icon
          ) : (
            <ThumbsUp className="h-4 w-4" />
          )}
        </motion.div>
        <span className="text-sm">
          {currentReaction ? currentReactionOption?.label : "Like"}
        </span>
      </Button>

      <AnimatePresence>
        {showReactions && (
          <>
            {/* Mobile backdrop */}
            <div 
              className="fixed inset-0 z-40 md:hidden" 
              onClick={() => setShowReactions(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute bottom-full left-0 mb-2 z-50"
            >
              <div className="flex gap-1 p-2 bg-background/95 backdrop-blur-sm border border-border/50 rounded-full shadow-lg">
                {REACTIONS.map((reaction, index) => (
                  <motion.button
                    key={reaction.type}
                    onClick={() => handleReactionClick(reaction.type)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: index * 0.05, 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 25 
                    }}
                    whileHover={{ scale: 1.3, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      reaction.hoverColor
                    } ${
                      currentReaction === reaction.type ? 'bg-muted scale-110' : ''
                    }`}
                    title={reaction.label}
                  >
                    {reaction.icon}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}