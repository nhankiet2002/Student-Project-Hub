import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Calendar,
  Users,
  Shield,
  Info,
  CheckCheck,
  ArrowRight,
  Briefcase,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "wouter";

const TYPE_CONFIG = {
  milestone: {
    icon: Calendar,
    bg: "bg-blue-100",
    fg: "text-blue-600",
  },
  call: {
    icon: Briefcase,
    bg: "bg-amber-100",
    fg: "text-amber-600",
  },
  team: {
    icon: Users,
    bg: "bg-emerald-100",
    fg: "text-emerald-600",
  },
  moderation: {
    icon: Shield,
    bg: "bg-red-100",
    fg: "text-red-600",
  },
  system: {
    icon: Info,
    bg: "bg-muted",
    fg: "text-muted-foreground",
  },
} as const;

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.system;
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  } catch {
    return "";
  }
}

interface NotificationPopoverProps {
  unreadCount: number;
}

export function NotificationPopover({ unreadCount }: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: open ? 3000 : 8000,
      refetchOnWindowFocus: true,
    },
  });

  const markReadMutation = useMarkNotificationRead({
    mutation: {
      onMutate: async ({ notificationId }) => {
        await queryClient.cancelQueries({ queryKey: getListNotificationsQueryKey() });
        const previous = queryClient.getQueryData(getListNotificationsQueryKey());
        queryClient.setQueryData(getListNotificationsQueryKey(), (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map(n => n.id === notificationId ? { ...n, read: true } : n);
        });
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) queryClient.setQueryData(getListNotificationsQueryKey(), context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    },
  });

  const markAllMutation = useMarkAllNotificationsRead({
    mutation: {
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: getListNotificationsQueryKey() });
        const previous = queryClient.getQueryData(getListNotificationsQueryKey());
        queryClient.setQueryData(getListNotificationsQueryKey(), (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map(n => ({ ...n, read: true }));
        });
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) queryClient.setQueryData(getListNotificationsQueryKey(), context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    },
  });

  const handleClickItem = (id: string, link: string | null) => {
    markReadMutation.mutate({ notificationId: id });
    setOpen(false);
    if (link) setLocation(link);
  };

  const handleMarkAll = () => {
    markAllMutation.mutate();
  };

  const displayed = notifications?.slice(0, 10) ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 shadow-2xl rounded-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-xl font-bold text-foreground">Thông báo</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            disabled={markAllMutation.isPending || unreadCount === 0}
            className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
            title="Đánh dấu tất cả là đã đọc"
          >
            <CheckCheck className="w-4.5 h-4.5" />
          </Button>
        </div>

        {unreadCount > 0 && (
          <div className="px-4 pb-1">
            <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
              Chưa đọc ({unreadCount})
            </span>
          </div>
        )}

        {/* Notification list */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Không có thông báo nào</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Khi có hoạt động mới, bạn sẽ thấy ở đây</p>
            </div>
          ) : (
            <div>
              {displayed.map((notif) => {
                const cfg = getTypeConfig(notif.type);
                const Icon = cfg.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClickItem(notif.id, notif.link ?? null)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/70 relative ${
                      !notif.read
                        ? "bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-950/30"
                        : ""
                    }`}
                  >
                    {/* Icon avatar */}
                    <div
                      className={`w-11 h-11 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon className={`w-5 h-5 ${cfg.fg}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm leading-snug">
                        <span className="font-semibold text-foreground">{notif.title}</span>{" "}
                        <span className="text-muted-foreground font-normal">{notif.body}</span>
                      </p>
                      <p className={`text-xs mt-1 ${!notif.read ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (notifications?.length ?? 0) > 0 && (
          <div className="border-t border-border">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              <button className="w-full flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-primary hover:bg-muted/60 transition-colors rounded-b-2xl">
                Xem tất cả thông báo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
