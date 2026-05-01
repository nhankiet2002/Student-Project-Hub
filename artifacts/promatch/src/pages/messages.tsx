import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListConversations,
  useListConversationMessages,
  useSendMessage,
  useDeleteMessage,
  useCreateConversation,
  useSearchUsers,
  useGetSession,
  getListConversationsQueryKey,
  getListConversationMessagesQueryKey,
  getSearchUsersQueryKey,
} from "@workspace/api-client-react";
import type { Conversation, ChatMessage, UserSearchResult } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search,
  Send,
  Users,
  User,
  Plus,
  MoreVertical,
  Trash2,
  MessageSquare,
  ChevronLeft,
  X,
  Check,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Hôm qua " + format(d, "HH:mm");
  return format(d, "dd/MM HH:mm");
}

function formatLastTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatDistanceToNow(new Date(iso), { addSuffix: false, locale: vi });
}

function avatarInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

function Avatar({ name, id, size = "md" }: { name: string; id: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClass} ${avatarColor(id)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {avatarInitials(name)}
    </div>
  );
}

function ConversationItem({
  conv,
  isActive,
  onSelect,
  currentUserId,
}: {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
  currentUserId: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${isActive ? "bg-primary/10 border-r-4 border-primary" : ""}`}
    >
      <div className="relative">
        <Avatar name={conv.name} id={conv.id} />
        {conv.type === "group" && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-background rounded-full flex items-center justify-center">
            <Users className="w-2.5 h-2.5 text-muted-foreground" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}>
            {conv.name}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatLastTime(conv.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-xs text-muted-foreground truncate">{conv.lastMessage ?? "Chưa có tin nhắn"}</span>
          {conv.unreadCount > 0 && (
            <Badge className="h-4 min-w-[16px] px-1 text-[10px] bg-primary text-primary-foreground rounded-full flex-shrink-0">
              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({
  msg,
  isMe,
  showName,
  onDelete,
}: {
  msg: ChatMessage;
  isMe: boolean;
  showName: boolean;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isMe && <Avatar name={msg.senderName} id={msg.senderId} size="sm" />}
      <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {showName && !isMe && (
          <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">{msg.senderName}</span>
        )}
        <div className={`relative group px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
          isMe
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted rounded-bl-sm"
        }`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 mx-1">{formatMsgTime(msg.sentAt)}</span>
      </div>
      {isMe && hovered && (
        <div className="self-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xóa tin nhắn</TooltipContent>
          </Tooltip>
        </div>
      )}
    </motion.div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  student: "Sinh viên",
  instructor: "Giảng viên",
  enterprise: "Doanh nghiệp",
  alumni: "Cựu sinh viên",
  admin: "Quản trị",
};

function UserRow({
  user,
  onClick,
  selected,
}: {
  user: UserSearchResult;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-accent text-left transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
        {avatarInitials(user.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{user.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {user.organization ?? ROLE_LABELS[user.role] ?? user.role}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {user.known && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
            Đã quen
          </span>
        )}
        {selected !== undefined && (
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected ? "bg-primary border-primary" : "border-muted-foreground/40"
            }`}
          >
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>
        )}
      </div>
    </button>
  );
}

function NewConversationDialog({
  onCreated,
  conversations,
}: {
  onCreated: (conv: Conversation) => void;
  conversations: Conversation[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"group" | "direct">("direct");
  const [groupName, setGroupName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<UserSearchResult[]>([]);
  const qc = useQueryClient();
  const { toast } = useToast();

  const searchParams = memberSearch.trim() ? { q: memberSearch.trim() } : undefined;
  const { data: userResults = [], isLoading: usersLoading } = useSearchUsers(searchParams, {
    query: {
      queryKey: getSearchUsersQueryKey(searchParams),
      enabled: open,
    },
  });

  const knownUsers = userResults.filter((u) => u.known);
  const suggestedUsers = userResults.filter((u) => !u.known);

  const createMut = useCreateConversation({
    mutation: {
      onSuccess: (conv) => {
        qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setOpen(false);
        resetForm();
        onCreated(conv);
        toast({ title: "Tạo cuộc trò chuyện thành công" });
      },
      onError: () =>
        toast({ title: "Không thể tạo cuộc trò chuyện", variant: "destructive" }),
    },
  });

  function resetForm() {
    setGroupName("");
    setMemberSearch("");
    setSelectedMembers([]);
    setType("direct");
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) resetForm();
  }

  function handleSelectDirect(user: UserSearchResult) {
    const existing = conversations.find(
      (c) => c.type === "direct" && c.memberIds.includes(user.id),
    );
    if (existing) {
      setOpen(false);
      resetForm();
      onCreated(existing);
      return;
    }
    createMut.mutate({
      data: { type: "direct", name: user.name, memberIds: [user.id] },
    });
  }

  function toggleMember(user: UserSearchResult) {
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === user.id)
        ? prev.filter((m) => m.id !== user.id)
        : [...prev, user],
    );
  }

  function handleCreateGroup() {
    createMut.mutate({
      data: {
        type: "group",
        name: groupName.trim(),
        memberIds: selectedMembers.map((m) => m.id),
      },
    });
  }

  function renderUserSection(
    label: string,
    users: UserSearchResult[],
    showIfEmpty: boolean = false,
  ) {
    if (!showIfEmpty && users.length === 0) return null;
    return (
      <>
        <div className="text-xs font-medium text-muted-foreground px-3 pt-2 pb-1">{label}</div>
        {users.length === 0 ? (
          <p className="text-xs text-muted-foreground px-3 pb-2">Chưa có</p>
        ) : (
          users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              onClick={() => (type === "direct" ? handleSelectDirect(u) : toggleMember(u))}
              selected={type === "group" ? selectedMembers.some((m) => m.id === u.id) : undefined}
            />
          ))
        )}
      </>
    );
  }

  const canCreateGroup = groupName.trim().length > 0 && selectedMembers.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cuộc trò chuyện mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2">
            <Button
              variant={type === "direct" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => {
                setType("direct");
                setSelectedMembers([]);
              }}
            >
              <User className="w-3.5 h-3.5" />
              Cá nhân
            </Button>
            <Button
              variant={type === "group" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setType("group")}
            >
              <Users className="w-3.5 h-3.5" />
              Nhóm
            </Button>
          </div>

          {/* Group name input */}
          {type === "group" && (
            <Input
              placeholder="Tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          )}

          {/* Selected member chips */}
          {type === "group" && selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full"
                >
                  <span>{m.name.split(" ").pop()}</span>
                  <button
                    type="button"
                    onClick={() => toggleMember(m)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder={
                type === "direct"
                  ? "Tìm tên hoặc tổ chức..."
                  : "Thêm thành viên..."
              }
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
          </div>

          {/* User list */}
          <ScrollArea className="h-60 border rounded-lg">
            {usersLoading ? (
              <div className="text-center text-sm text-muted-foreground py-10">
                Đang tải...
              </div>
            ) : userResults.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-10">
                Không tìm thấy người dùng
              </div>
            ) : (
              <div className="p-1">
                {memberSearch.trim() ? (
                  userResults.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      onClick={() =>
                        type === "direct" ? handleSelectDirect(u) : toggleMember(u)
                      }
                      selected={
                        type === "group"
                          ? selectedMembers.some((m) => m.id === u.id)
                          : undefined
                      }
                    />
                  ))
                ) : (
                  <>
                    {renderUserSection("Đã quen", knownUsers)}
                    {renderUserSection(
                      knownUsers.length > 0 ? "Gợi ý thêm" : "Gợi ý",
                      suggestedUsers,
                    )}
                  </>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Create group button */}
          {type === "group" && (
            <Button
              className="w-full"
              disabled={!canCreateGroup || createMut.isPending}
              onClick={handleCreateGroup}
            >
              {createMut.isPending
                ? "Đang tạo..."
                : selectedMembers.length > 0
                  ? `Tạo nhóm (${selectedMembers.length} thành viên)`
                  : "Chọn ít nhất 1 thành viên"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Messages() {
  const { data: session } = useGetSession();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "group" | "direct">("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations = [] } = useListConversations({
    query: { queryKey: getListConversationsQueryKey(), refetchInterval: 5000 },
  });

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  const { data: messages = [], refetch: refetchMsgs } = useListConversationMessages(
    selectedId ?? "",
    {
      query: {
        queryKey: getListConversationMessagesQueryKey(selectedId ?? ""),
        enabled: !!selectedId,
        refetchInterval: 3000,
      },
    }
  );

  const sendMut = useSendMessage({
    mutation: {
      onSuccess: () => {
        refetchMsgs();
        qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setDraft("");
        textareaRef.current?.focus();
      },
      onError: () => toast({ title: "Không thể gửi tin nhắn", variant: "destructive" }),
    },
  });

  const deleteMut = useDeleteMessage({
    mutation: {
      onSuccess: () => {
        refetchMsgs();
        qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      },
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !selectedId || sendMut.isPending) return;
    sendMut.mutate({ conversationId: selectedId, data: { content: text } });
  }, [draft, selectedId, sendMut]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSelectConv = (id: string) => {
    setSelectedId(id);
    setMobileSidebarOpen(false);
  };

  const filtered = conversations.filter((c) => {
    if (tab === "group" && c.type !== "group") return false;
    if (tab === "direct" && c.type !== "direct") return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const currentUserId = session?.id ?? "";

  const Sidebar = (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Tin nhắn</h2>
          <NewConversationDialog
            conversations={conversations}
            onCreated={(conv) => setSelectedId(conv.id)}
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-3">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">Tất cả</TabsTrigger>
            <TabsTrigger value="group" className="flex-1 text-xs">Nhóm</TabsTrigger>
            <TabsTrigger value="direct" className="flex-1 text-xs">Riêng tư</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <span>Không có cuộc trò chuyện</span>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={selectedId === conv.id}
              onSelect={() => handleSelectConv(conv.id)}
              currentUserId={currentUserId}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );

  const ChatArea = selectedConv ? (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 h-16 border-b bg-card flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden w-8 h-8"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Avatar name={selectedConv.name} id={selectedConv.id} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{selectedConv.name}</p>
          <p className="text-xs text-muted-foreground">
            {selectedConv.type === "group"
              ? `${selectedConv.memberIds.length} thành viên`
              : "Tin nhắn riêng tư"}
          </p>
        </div>
        {selectedConv.projectId && (
          <Badge variant="outline" className="text-xs hidden sm:flex">
            Dự án
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
              <MessageSquare className="w-10 h-10 opacity-20" />
              <span>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</span>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderId === currentUserId;
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showName = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  showName={showName}
                  onDelete={() =>
                    deleteMut.mutate({
                      conversationId: selectedConv.id,
                      messageId: msg.id,
                    })
                  }
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t bg-card flex-shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            className="h-11 w-11 flex-shrink-0"
            onClick={handleSend}
            disabled={!draft.trim() || sendMut.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <MessageSquare className="w-8 h-8 opacity-40" />
      </div>
      <p className="font-medium">Chọn cuộc trò chuyện để bắt đầu</p>
      <p className="text-sm">Hoặc tạo cuộc trò chuyện mới bằng nút + ở góc trái</p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-4 sm:-m-6">
      <div
        className={`w-full md:w-80 flex-shrink-0 flex flex-col ${
          mobileSidebarOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {Sidebar}
      </div>

      <div
        className={`flex-1 flex flex-col min-w-0 ${
          mobileSidebarOpen ? "hidden md:flex" : "flex"
        }`}
      >
        {ChatArea}
      </div>
    </div>
  );
}
