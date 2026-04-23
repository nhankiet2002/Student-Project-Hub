import { useGetSession, useGetPortfolio, useUpdatePortfolio, getGetPortfolioQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { data: session, isLoading: sessionLoading } = useGetSession();
  const userId = session?.id || "";
  const { data: portfolio, isLoading: portfolioLoading } = useGetPortfolio(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioQueryKey(userId) } });
  
  const queryClient = useQueryClient();
  const updateMutation = useUpdatePortfolio({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(userId) });
        toast.success("Đã cập nhật quyền riêng tư");
      }
    }
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    updates: false,
    marketing: false
  });

  const handlePrivacyToggle = (checked: boolean) => {
    if (!portfolio) return;
    updateMutation.mutate({ 
      userId, 
      data: { 
        publicVisible: checked,
        bio: portfolio.bio,
        skills: portfolio.skills,
        interests: portfolio.interests
      } 
    });
  };

  if (sessionLoading || portfolioLoading) {
    return <div className="space-y-6 max-w-3xl mx-auto"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground mt-1">Quản lý tùy chọn tài khoản và hệ thống của bạn.</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="account">Tài khoản</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="privacy">Riêng tư</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="account" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Thông tin cơ bản lấy từ hệ thống trung tâm. Liên hệ admin để thay đổi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Họ và tên</Label>
                  <Input value={session?.name || ""} readOnly disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={session?.email || ""} readOnly disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Vai trò</Label>
                  <Input value={session?.role || ""} readOnly disabled className="bg-muted/50 capitalize" />
                </div>
                {session?.organization && (
                  <div className="space-y-2">
                    <Label>Tổ chức / Đơn vị</Label>
                    <Input value={session.organization} readOnly disabled className="bg-muted/50" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Tùy chọn thông báo</CardTitle>
                <CardDescription>Chọn cách hệ thống liên lạc với bạn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo qua Email</Label>
                    <p className="text-sm text-muted-foreground">Nhận cập nhật quan trọng qua email đăng ký.</p>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={(c) => { setNotifications({...notifications, email: c}); toast.success("Đã lưu thiết lập thông báo"); }} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thông báo đẩy (Push)</Label>
                    <p className="text-sm text-muted-foreground">Nhận thông báo trực tiếp trên trình duyệt.</p>
                  </div>
                  <Switch 
                    checked={notifications.push} 
                    onCheckedChange={(c) => { setNotifications({...notifications, push: c}); toast.success("Đã lưu thiết lập thông báo"); }} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cập nhật hệ thống</Label>
                    <p className="text-sm text-muted-foreground">Thông báo khi có tính năng mới.</p>
                  </div>
                  <Switch 
                    checked={notifications.updates} 
                    onCheckedChange={(c) => { setNotifications({...notifications, updates: c}); toast.success("Đã lưu thiết lập thông báo"); }} 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Quyền riêng tư hồ sơ</CardTitle>
                <CardDescription>Quản lý việc ai có thể xem hồ sơ năng lực của bạn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-6">
                    <Label className="text-base">Hiển thị hồ sơ công khai</Label>
                    <p className="text-sm text-muted-foreground">
                      Khi bật, các nhà tuyển dụng và doanh nghiệp có thể tìm thấy bạn qua kỹ năng và xem hồ sơ chi tiết. 
                      Giảng viên vẫn luôn có thể xem hồ sơ để phân công nhóm.
                    </p>
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <Switch 
                      checked={portfolio?.publicVisible || false} 
                      onCheckedChange={handlePrivacyToggle} 
                      disabled={updateMutation.isPending}
                    />
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mt-2 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                
                {portfolio?.publicVisible && (
                  <div className="bg-muted p-4 rounded-lg mt-4 text-sm">
                    <span className="font-semibold">Link hồ sơ công khai: </span>
                    <a href={`/portfolio/public/${userId}`} className="text-primary hover:underline ml-2" target="_blank" rel="noreferrer">
                      /portfolio/public/{userId}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}