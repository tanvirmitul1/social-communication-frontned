"use client";

import { useState, useCallback } from "react";
import { 
  useReactToPostMutation, 
  useUpdateReactionMutation,
  useUnreactToPostMutation 
} from "@/lib/api/feed-api.slice";
import type { ReactionType } from "@/types/feed.types";

interface UsePostReactionsProps {
  postId: string;
  currentReaction?: ReactionType | null;
}

export function usePostReactions({ postId, currentReaction }: UsePostReactionsProps) {
  const [isReacting, setIsReacting] = useState(false);
  const [reactionTrigger, setReactionTrigger] = useState(0);
  
  const [reactToPost] = useReactToPostMutation();
  const [updateReaction] = useUpdateReactionMutation();
  const [unreactToPost] = useUnreactToPostMutation();

  const handleReact = useCallback(async (type: ReactionType) => {
    if (isReacting) return;
    
    setIsReacting(true);
    setReactionTrigger(prev => prev + 1);
    
    try {
      if (currentReaction) {
        // Update existing reaction
        await updateReaction({ id: postId, data: { type } }).unwrap();
      } else {
        // Add new reaction
        await reactToPost({ id: postId, data: { type } }).unwrap();
      }
    } catch (error) {
      console.warn("Reaction failed:", error);
    } finally {
      setIsReacting(false);
    }
  }, [postId, currentReaction, isReacting, reactToPost, updateReaction]);

  const handleUnreact = useCallback(async () => {
    if (isReacting) return;
    
    setIsReacting(true);
    
    try {
      await unreactToPost(postId).unwrap();
    } catch (error) {
      console.warn("Unreact failed:", error);
    } finally {
      setIsReacting(false);
    }
  }, [postId, isReacting, unreactToPost]);

  return {
    handleReact,
    handleUnreact,
    isReacting,
    reactionTrigger
  };
}