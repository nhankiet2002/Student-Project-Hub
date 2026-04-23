import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Calendar, Users, Shield, Info, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "wouter";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const queryClient = useQueryClient();

  const markReadMutation = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    }
  });

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate({ notificationId: id });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'milestone': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'team': return <Users className="w-5 h-5 text-green-500" />;
      case 'call': return <Bell className="w-5 h-5 text-amber-500" />;
      case 'moderation': return <Shield className="w-5 h-5 text-destructive" />;
      default: return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  const unread = notifications?.filter(n => !n.read) || [];
  const read = notifications?.filter(n => n.read) || [];

  const NotificationList = ({ items }: { items: typeof notifications }) => {
    if (!items || items.length === 0) {
      return <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">Không có thông báo nào.</div>;
    }

    return (
      <div className="space-y-3">
        {items.map(notif => (
          <Card key={notif.id} className={`transition-colors ${notif.read ? 'bg-background' : 'bg-primary/5 border-primary/20'}`}>
            <CardContent className="p-4 flex gap-4 items-start">
              <div className="mt-1 bg-background p-2 rounded-full shadow-sm border shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className={`font-semibold ${notif.read ? '' : 'text-primary'}`}>{notif.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(notif.createdAt), { locale: vi, addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{notif.body}</p>
                {notif.link && (
                  <div className="pt-2">
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link href={notif.link}>Xem chi tiết</Link>
                    </Button>
                  </div>
                )}
              </div>
              {!notif.read && (
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleMarkRead(notif.id)} title="Đánh dấu đã đọc">
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Thông báo</h1>
        <p className="text-muted-foreground mt-1">Cập nhật hoạt động mới nhất từ hệ thống và các dự án.</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="unread">Chưa đọc <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">{unread.length}</Badge></TabsTrigger>
          <TabsTrigger value="read">Đã đọc</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="all" className="m-0">
            <NotificationList items={notifications} />
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            <NotificationList items={unread} />
          </TabsContent>
          <TabsContent value="read" className="m-0">
            <NotificationList items={read} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}