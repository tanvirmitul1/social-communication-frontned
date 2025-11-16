"use client";

import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { getCurrentUser } from "@/lib/store/slices/auth.slice";
import { fetchUserGroups } from "@/lib/store/slices/conversations.slice";
import {
  fetchDirectMessages,
  fetchGroupMessages,
  sendMessage as sendMessageAction,
} from "@/lib/store/slices/messages.slice";
import { setActiveConversation } from "@/lib/store/slices/ui.slice";
import { resetUnreadCount } from "@/lib/store/slices/conversations.slice";
import { MessageCircle, Users, Phone, Settings, Moon, Sun, Menu, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils/format";
import { ConversationItem } from "@/components/messages/conversation-item";
import { MessageThread } from "@/components/messages/message-thread";
import { MessageInput } from "@/components/messages/message-input";
import { socketManager } from "@/lib/socket/socket-manager";
import type { SendMessagePayload } from "@/types";

export default function MessagesPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { conversations } = useAppSelector((state) => state.conversations);
  const { messagesByConversation } = useAppSelector((state) => state.messages);
  const { activeConversationId: activeConversation } = useAppSelector((state) => state.ui);
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"messages" | "groups" | "calls">("messages");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Fetch user's groups on mount
    dispatch(fetchUserGroups());
  }, [dispatch]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleConversationClick = (conversationId: string, type: "direct" | "group") => {
    dispatch(setActiveConversation(conversationId));
    dispatch(resetUnreadCount(conversationId));

    // Fetch messages if not already loaded
    if (!messagesByConversation[conversationId]) {
      if (type === "group") {
        dispatch(fetchGroupMessages({ groupId: conversationId }));
      } else {
        dispatch(fetchDirectMessages({ userId: conversationId }));
      }
    }
  };

  const handleSendMessage = (content: string) => {
    if (!activeConversation || !user) return;

    const activeConv = conversations.find((c) => c.id === activeConversation);
    if (!activeConv) return;

    const payload: SendMessagePayload = {
      content,
      type: "TEXT",
      ...(activeConv.type === "group"
        ? { groupId: activeConversation }
        : { receiverId: activeConversation }),
    };

    // Send via Redux (which will call the API)
    dispatch(sendMessageAction(payload));

    // Also emit via WebSocket for real-time delivery
    socketManager.sendMessage(payload);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeConversation || !user) return;

    const activeConv = conversations.find((c) => c.id === activeConversation);
    if (!activeConv) return;

    if (isTyping) {
      socketManager.startTyping(
        activeConv.type === "group"
          ? { groupId: activeConversation }
          : { receiverId: activeConversation }
      );
    } else {
      socketManager.stopTyping(
        activeConv.type === "group"
          ? { groupId: activeConversation }
          : { receiverId: activeConversation }
      );
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === "groups" && conv.type !== "group") return false;
    if (activeTab === "messages" && conv.type !== "direct") return false;
    if (activeTab === "calls") return false; // TODO: Filter for calls

    if (searchQuery) {
      return conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const activeConv = conversations.find((c) => c.id === activeConversation);
  const currentMessages = activeConversation ? messagesByConversation[activeConversation] || [] : [];

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out`}
      >
        {sidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <MessageCircle className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Messages</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-3 border-b border-border p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-semibold">{user.username}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.statusMessage || "Available"}
                  </p>
                </div>
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
            )}

            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "messages"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageCircle className="mx-auto h-5 w-5" />
              </button>
              <button
                onClick={() => setActiveTab("groups")}
                className={`flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "groups"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="mx-auto h-5 w-5" />
              </button>
              <button
                onClick={() => setActiveTab("calls")}
                className={`flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "calls"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone className="mx-auto h-5 w-5" />
              </button>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 font-semibold">No conversations yet</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Start a new conversation to get started
                    </p>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      New Message
                    </Button>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversation}
                      onClick={() => handleConversationClick(conversation.id, conversation.type)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Bottom Navigation */}
            <div className="flex border-t border-border p-2">
              <Button variant="ghost" size="icon" className="flex-1">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {activeConv ? (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeConv.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {getInitials(activeConv.title)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{activeConv.title}</h2>
                  {activeConv.isTyping && (
                    <p className="text-xs text-muted-foreground">Typing...</p>
                  )}
                </div>
              </>
            ) : (
              <h2 className="text-lg font-semibold">Welcome to Social Communication</h2>
            )}
          </div>
        </div>

        {/* Messages or Empty State */}
        {activeConv && user ? (
          <>
            <MessageThread
              messages={currentMessages}
              currentUser={user}
              otherUser={
                activeConv.type === "direct"
                  ? { id: activeConv.id, username: activeConv.title, avatar: activeConv.avatar }
                  : undefined
              }
            />
            <MessageInput
              onSend={handleSendMessage}
              onTyping={handleTyping}
              placeholder={`Message ${activeConv.title}...`}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-background">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h2 className="mb-3 text-2xl font-bold">Start Messaging</h2>
              <p className="mb-6 max-w-md text-muted-foreground">
                Select a conversation from the sidebar or start a new chat to begin messaging with
                your contacts.
              </p>
              <div className="flex justify-center gap-3">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Conversation
                </Button>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
