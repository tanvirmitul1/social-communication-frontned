"use client";

import { motion } from "framer-motion";
import { ThumbsUp, Heart, Laugh, Frown, Angry } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { ReactionType } from "@/types/feed.types";

interface ReactionOption {
  type: ReactionType;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const REACTIONS: ReactionOption[] = [
  { 
    type: "LIKE", 
    icon: <ThumbsUp className="h-5 w-5" />, 
    label: "Like",
    color: "text-blue-600" 
  },
  { 
    type: "LOVE", 
    icon: <Heart className="h-5 w-5 fill-red-500 text-red-500" />, 
    label: "Love",
    color: "text-red-500" 
  },
  { 
    type: "HAHA", 
    icon: <img src="/icons/emoji-laugh.svg" alt="Haha" className="h-5 w-5" />, 
    label: "Haha",
    color: "text-yellow-500" 
  },
  { 
    type: "WOW", 
    icon: <img src="/icons/emoji-wow.svg" alt="Wow" className="h-5 w-5" />, 
    label: "Wow",
    color: "text-yellow-600" 
  },
  { 
    type: "SAD", 
    icon: <img src="/icons/emoji-sad.svg" alt="Sad" className="h-5 w-5" />, 
    label: "Sad",
    color: "text-yellow-700" 
  },
  { 
    type: "ANGRY", 
    icon: <img src="/icons/emoji-angry.svg" alt="Angry" className="h-5 w-5" />, 
    label: "Angry",
    color: "text-orange-600" 
  },
];

interface ReactionPickerProps {
  currentReaction?: ReactionType | null;
  onReact: (type: ReactionType) => void;
  onUnreact: () => void;
}

export function ReactionPicker({ currentReaction, onReact, onUnreact }: ReactionPickerProps) {
  const handleReactionClick = (type: ReactionType) => {
    if (currentReaction === type) {
      onUnreact();
    } else {
      onReact(type);
    }
  };

  const currentReactionOption = REACTIONS.find(r => r.type === currentReaction);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={currentReaction ? currentReactionOption?.color : ""}
        >
          {currentReaction ? (
            <>
              {currentReactionOption?.icon}
              <span className="ml-2">{currentReactionOption?.label}</span>
            </>
          ) : (
            <>
              <ThumbsUp className="h-4 w-4 mr-2" />
              Like
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-2">
          {REACTIONS.map((reaction, index) => (
            <motion.button
              key={reaction.type}
              onClick={() => handleReactionClick(reaction.type)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 500, damping: 25 }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                currentReaction === reaction.type ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
              title={reaction.label}
            >
              {reaction.icon}
            </motion.button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}