"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { useGetCurrentUserQuery } from "@/lib/api";
import { setUser } from "@/lib/store/slices/auth.slice";
import { storage } from "@/lib/utils/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchUserGroups } from "@/lib/store/slices/conversations.slice";
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
  Moon,
  Sun,
  Menu,
  Search,
  Plus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
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
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [friendRequestsOpen, setFriendRequestsOpen] = useState(false);
  const [friendsListOpen, setFriendsListOpen] = useState(false);
  const { pendingCount } = usePendingFriendRequests();

  const {
    data: currentUser,
    isLoading,
    error,
  } = useGetCurrentUserQuery(undefined, {
    skip: !!user, // Skip if user is already in state
  });

  useEffect(() => {
    if (currentUser && !user) {
      // For getCurrentUser, we only update the user info
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

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv) => {
        if (activeTab === "groups" && conv.type !== "group") return false;
        if (activeTab === "messages" && conv.type !== "direct") return false;
        if (activeTab === "calls") return false; // TODO: Filter for calls

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
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setFriendsListOpen(true)}>
                  <div className="relative">
                    <Users className="h-5 w-5" />
                  </div>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setFriendRequestsOpen(true)}>
                  <div className="relative">
                    <UserPlus className="h-5 w-5" />
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* User Profile */}
            {user && (
              <div className="border-b border-border p-4">
                <UserMenu />
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
                    <Button size="sm" onClick={() => setNewConversationOpen(true)}>
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
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
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
          {activeConv && activeConv.type === "group" && (
            <Button variant="outline" size="sm" onClick={() => setAddMembersOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Members
            </Button>
          )}
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
                <Button onClick={() => setNewConversationOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Conversation
                </Button>
                <Button variant="outline" onClick={() => setCreateGroupOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

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
