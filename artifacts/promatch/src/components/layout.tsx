import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetSession, useSwitchRole, useListNotifications, useListConversations } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
type UserRole = "student" | "instructor" | "enterprise" | "alumni" | "admin";
import { 
  Bell, 
  BookOpen, 
  Briefcase, 
  ChartBar, 
  ChevronDown, 
  Compass, 
  Home, 
  LayoutDashboard, 
  Lightbulb, 
  LogOut,
  Menu, 
  MessageSquare, 
  Settings, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  Users,
  FolderKanban,
  UserCircle,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { NotificationWatcher } from "@/components/notification-watcher";
import { getListNotificationsQueryKey, getListConversationsQueryKey } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isError: sessionError, isLoading: sessionLoading } = useGetSession();
  const { data: notifications } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    },
  });
  const { logout } = useAuth();
  const switchRole = useSwitchRole();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleRoleSwitch = (role: UserRole) => {
    switchRole.mutate({ data: { role } }, {
      onSuccess: () => queryClient.invalidateQueries(),
    });
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const { data: conversations } = useListConversations({
    query: { queryKey: getListConversationsQueryKey(), refetchInterval: 5000 },
  });
  const totalMsgUnread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  const roleLabels: Record<string, string> = {
    student: "Sinh viên",
    instructor: "Giảng viên",
    enterprise: "Doanh nghiệp",
    alumni: "Cựu sinh viên",
    admin: "Quản trị viên",
  };

  const getNavItems = () => {
    const baseItems = [
      { href: "/", label: "Trang chủ", icon: Home },
      { href: "/settings", label: "Cài đặt", icon: Settings },
    ];

    if (!session) return baseItems;

    switch (session.role) {
      case "student":
        return [
          { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
          { href: "/topics/recommended", label: "Đề tài gợi ý", icon: Lightbulb },
          { href: "/topics", label: "Khám phá đề tài", icon: Compass },
          { href: "/topics/ai", label: "Sinh đề tài AI", icon: Sparkles },
          { href: "/projects", label: "Dự án của tôi", icon: FolderKanban },
          { href: "/teams", label: "Tìm thành viên", icon: Users },
          { href: "/messages", label: "Tin nhắn", icon: MessageSquare, badge: totalMsgUnread },
          { href: "/marketplace", label: "Đặt hàng từ DN", icon: Briefcase },
          { href: "/portfolio", label: "Hồ sơ năng lực", icon: BookOpen },
        ];
      case "instructor":
        return [
          { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
          { href: "/instructor", label: "Quản lý lớp", icon: Users },
          { href: "/messages", label: "Tin nhắn", icon: MessageSquare, badge: totalMsgUnread },
          { href: "/analytics", label: "Phân tích & Xu hướng", icon: ChartBar },
          { href: "/knowledge", label: "Kho tri thức", icon: BookOpen },
          { href: "/portfolio", label: "Hồ sơ giảng viên", icon: UserCircle },
        ];
      case "enterprise":
        return [
          { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
          { href: "/marketplace", label: "Tất cả đặt hàng", icon: Briefcase },
          { href: "/marketplace/new", label: "Tạo đặt hàng mới", icon: Briefcase },
          { href: "/messages", label: "Tin nhắn", icon: MessageSquare, badge: totalMsgUnread },
          { href: "/portfolio", label: "Hồ sơ doanh nghiệp", icon: Building2 },
        ];
      case "admin":
        return [
          { href: "/", label: "Thống kê", icon: ChartBar },
          { href: "/admin/users", label: "Quản lý người dùng", icon: Users },
          { href: "/admin/moderation", label: "Kiểm duyệt", icon: ShieldAlert },
          { href: "/analytics", label: "Phân tích hệ thống", icon: TrendingUp },
        ];
      case "alumni":
        return [
          { href: "/", label: "Trang chủ", icon: Home },
          { href: "/knowledge", label: "Kho tri thức", icon: BookOpen },
          { href: "/topics", label: "Khám phá đề tài", icon: Compass },
          { href: "/messages", label: "Tin nhắn", icon: MessageSquare, badge: totalMsgUnread },
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  const NavLinks = () => (
    <div className="space-y-1 py-4">
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        const badge = (item as { badge?: number }).badge;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
              isActive 
                ? "bg-primary/10 text-primary border-r-4 border-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {badge != null && badge > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Sparkles className="w-6 h-6" />
          PROMATCH
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <div className="p-6 pb-2">
              <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight">
                <Sparkles className="w-6 h-6" />
                PROMATCH
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/">
            <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight hover:opacity-90 transition-opacity">
              <Sparkles className="w-6 h-6" />
              PROMATCH
            </div>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          <NavLinks />
        </div>
        
        <div className="p-4 border-t">
          <Link href="/settings" className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-5 h-5" />
            Cài đặt
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center justify-end px-4 sm:px-6 sticky top-0 z-40 gap-4">
          
          <Button variant="ghost" size="icon" className="relative" onClick={() => setLocation('/notifications')}>
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full" />
            )}
          </Button>

          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-2 pr-4 h-10 flex items-center gap-3 rounded-full border border-transparent hover:border-border hover:bg-muted/50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={session.avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start hidden sm:flex">
                    <span className="text-sm font-medium leading-none">{session.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {roleLabels[session.role]}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{session.name}</div>
                  <div className="text-muted-foreground text-xs">{session.email}</div>
                </div>
                <div className="px-2 pb-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {roleLabels[session.role]}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Chuyển đổi vai trò (Demo)</DropdownMenuLabel>
                {Object.entries(roleLabels).map(([role, label]) => (
                  <DropdownMenuItem 
                    key={role} 
                    onClick={() => handleRoleSwitch(role as UserRole)}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    {label}
                    {session.role === role && <Badge variant="secondary" className="ml-2 text-[10px]">Hiện tại</Badge>}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-50/50 dark:bg-transparent">
          {children}
        </div>
      </main>

      <ChatbotWidget />
      <NotificationWatcher />
    </div>
  );
}