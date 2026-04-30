import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

const POLL_MS = 5000;

export function NotificationWatcher() {
  const { data: notifications } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: POLL_MS,
      refetchOnWindowFocus: true,
    },
  });
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!notifications) return;

    // First load: snapshot existing IDs without firing toasts.
    if (seenIdsRef.current === null) {
      seenIdsRef.current = new Set(notifications.map((n) => n.id));
      return;
    }

    const seen = seenIdsRef.current;
    const fresh = notifications.filter((n) => !seen.has(n.id));

    for (const n of fresh) {
      seen.add(n.id);
      toast({
        title: n.title,
        description: n.body,
        duration: 7000,
        action: n.link ? (
          <ToastAction
            altText="Xem chi tiết"
            onClick={() => setLocation(n.link!)}
          >
            Xem
          </ToastAction>
        ) : undefined,
      });
    }
  }, [notifications, toast, setLocation]);

  return null;
}
