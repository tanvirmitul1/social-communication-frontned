"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { useGetCurrentUserQuery } from "@/lib/api";
import { setUser } from "@/lib/store/slices/auth.slice";
import { storage } from "@/lib/utils/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchChatList, fetchUserGroups } from "@/lib/store/slices/conversations.slice";
import {
  fetchDirectMessages,
  fetchGroupMessages,
  sendMessage as sendMessageAction,
  addMessage,
  updateMessage,
  removeMessage,
  setTyping,
} from "@/lib/store/slices/messages.slice";
import type { SendMessagePayload } from "@/types";
import { setActiveConversation } from "@/lib/store/slices/ui.slice";
import { resetUnreadCount } from "@/lib/store/slices/conversations.slice";
import { 
  MessageCircle, 
  Users, 
  Phone, 
  Settings, 
  Search, 
  Plus, 
  UserPlus,
  MoreHorizontal,
  ArrowLeft,
  Info,
  Video,
  Smile,
  Paperclip,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils/format";
import { ConversationItem } from "@/components/messages/conversation-item";
import { MessageThread } from "@/components/messages/message-thread";
import { MessageInput } from "@/components/messages/message-input";
import { NewConversationModal } from "@/components/messages/new-conversation-modal";
import { CreateGroupModal } from "@/components/messages/create-group-modal";
import { AddMembersModal } from "@/components/messages/add-members-modal";
import { FriendRequestsModal } from "@/components/messages/friend-requests-modal";
import { FriendsListModal } from "@/components/messages/friends-list-modal";
import { UserMenu } from "@/components/shared/user-menu";
import { usePendingFriendRequests } from "@/hooks/use-pending-friend-requests";
import { socketManager } from "@/lib/socket/socket-manager";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { conversations } = useAppSelector((state) => state.conversations);
  const { messagesByConversation } = useAppSelector((state) => state.messages);
  const { activeConversationId: activeConversation } = useAppSelector((state) => state.ui);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"messages" | "groups" | "calls">("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [friendRequestsOpen, setFriendRequestsOpen] = useState(false);
  const [friendsListOpen, setFriendsListOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { pendingCount } = usePendingFriendRequests();

  const {
    data: currentUser,
    isLoading,
    error,
  } = useGetCurrentUserQuery(undefined, {
    skip: !!user,
  });

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (currentUser && !user) {
      dispatch(
        setUser({
          user: currentUser,
          accessToken: storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN) || "",
          refreshToken: storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN) || "",
        })
      );
    }
  }, [currentUser, user, dispatch]);

  useEffect(() => {
    dispatch(fetchChatList({}));
  }, [dispatch]);

  const handleConversationClick = (conversationId: string, type: "direct" | "group") => {
    dispatch(setActiveConversation(conversationId));
    dispatch(resetUnreadCount(conversationId));

    // Close sidebar on mobile when conversation is selected
    if (isMobile) {
      setSidebarOpen(false);
    }

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

    dispatch(sendMessageAction(payload));
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

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv) => {
        if (activeTab === "groups" && conv.type !== "group") return false;
        if (activeTab === "messages" && conv.type !== "direct") return false;
        if (activeTab === "calls") return false;

        if (searchQuery) {
          return conv.title.toLowerCase().includes(searchQuery.toLowerCase());
        }

        return true;
      }),
    [conversations, activeTab, searchQuery]
  );

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConversation),
    [conversations, activeConversation]
  );

  const currentMessages = useMemo(
    () => (activeConversation ? messagesByConversation[activeConversation] || [] : []),
    [activeConversation, messagesByConversation]
  );

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r border-border/50 bg-card/80 backdrop-blur-sm glass transition-all duration-300 ease-out",
          // Desktop: Always show with fixed width
          "hidden md:flex md:w-80",
          // Mobile: Full screen overlay when open
          isMobile && sidebarOpen && "fixed inset-0 z-50 flex w-full bg-background md:relative md:inset-auto md:z-auto md:w-80"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/30 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Messages
            </h1>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted/50 transition-colors"
              onClick={() => setFriendsListOpen(true)}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted/50 transition-colors relative"
              onClick={() => setFriendRequestsOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-medium">
                  {pendingCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted/50 transition-colors"
              onClick={() => setNewConversationOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/30 bg-muted/20">
          {[
            { id: "messages", icon: MessageCircle, label: "Chats" },
            { id: "groups", icon: Users, label: "Groups" },
            { id: "calls", icon: Phone, label: "Calls" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          <div className="p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">No conversations yet</h3>
                <p className="mb-4 text-sm text-muted-foreground max-w-48">
                  Start a new conversation to get started
                </p>
                <Button 
                  size="sm" 
                  onClick={() => setNewConversationOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
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
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col bg-background min-w-0">
        {activeConv && user ? (
          <>
            {/* Chat Header */}
            <div className="flex h-16 items-center justify-between border-b border-border/30 glass backdrop-blur-sm px-4 bg-card/50">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <Avatar className="h-10 w-10 ring-2 ring-border/30">
                  <AvatarImage src={activeConv.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                    {getInitials(activeConv.title)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-foreground truncate">{activeConv.title}</h2>
                  {activeConv.isTyping ? (
                    <p className="text-xs text-primary animate-pulse">Typing...</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {activeConv.type === "group" ? `${activeConv.participants?.length || 0} members` : "Active now"}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <MessageThread
              messages={currentMessages}
              currentUser={user}
              otherUser={
                activeConv.type === "direct"
                  ? { id: activeConv.id, username: activeConv.title, avatar: activeConv.avatar }
                  : undefined
              }
            />

            {/* Message Input */}
            <div className="border-t border-border/30 bg-card/30 backdrop-blur-sm p-4">
              <MessageInput
                onSend={handleSendMessage}
                onTyping={handleTyping}
                placeholder={`Message ${activeConv.title}...`}
              />
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background to-muted/20">
            <div className="text-center max-w-md px-6">
              <div className="mb-8 flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/20 ring-1 ring-primary/20">
                  <MessageCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
              
              <h2 className="mb-3 text-2xl font-bold text-foreground">Start Messaging</h2>
              <p className="mb-8 text-muted-foreground leading-relaxed">
                Select a conversation from the sidebar or start a new chat to begin messaging with your contacts.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button 
                  onClick={() => setNewConversationOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Conversation
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCreateGroupOpen(true)}
                  className="border-border/50 hover:bg-muted/50"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </div>
              
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  onClick={() => setSidebarOpen(true)}
                  className="mt-4 text-muted-foreground hover:text-foreground md:hidden"
                >
                  Open conversations
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modals */}
      <NewConversationModal open={newConversationOpen} onOpenChange={setNewConversationOpen} />
      <CreateGroupModal open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
      <FriendRequestsModal open={friendRequestsOpen} onOpenChange={setFriendRequestsOpen} />
      <FriendsListModal open={friendsListOpen} onOpenChange={setFriendsListOpen} />
      {activeConv && activeConv.type === "group" && (
        <AddMembersModal
          open={addMembersOpen}
          onOpenChange={setAddMembersOpen}
          groupId={activeConv.id}
          groupTitle={activeConv.title}
          existingMemberIds={activeConv.participants}
        />
      )}
    </div>
  );
}