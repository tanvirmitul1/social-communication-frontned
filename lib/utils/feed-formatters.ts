/**
 * Feed-specific formatting utilities
 */

/**
 * Format relative time (2 hours ago, 3 days ago)
 */
export const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now.getTime() - postDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  
  return postDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Format reaction count (1.2K, 5.3M)
 */
export const formatCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
};

/**
 * Get reaction emoji for reaction type
 */
export const getReactionEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    LIKE: '👍',
    LOVE: '❤️',
    HAHA: '😂',
    WOW: '😮',
    SAD: '😢',
    ANGRY: '😠',
  };
  return emojis[type] || '👍';
};

/**
 * Get reaction label
 */
export const getReactionLabel = (type: string): string => {
  const labels: Record<string, string> = {
    LIKE: 'Like',
    LOVE: 'Love',
    HAHA: 'Haha',
    WOW: 'Wow',
    SAD: 'Sad',
    ANGRY: 'Angry',
  };
  return labels[type] || 'Like';
};

/**
 * Parse mentions from text (@username)
 */
export const parseMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.matchAll(mentionRegex);
  return Array.from(matches, match => match[1]);
};

/**
 * Highlight mentions in text
 */
export const highlightMentions = (text: string): string => {
  return text.replace(/@(\w+)/g, '<span class="text-primary font-medium">@$1</span>');
};