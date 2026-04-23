import { useGetSession, useGetInstructorDashboard, useGetAdminStats, useListTopics, useListProjects, useListCalls } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Briefcase, ChevronRight, FolderKanban, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function StudentDashboard() {
  const { data: topics, isLoading: topicsLoading } = useListTopics({ limit: 3 } as any);
  const { data: projects, isLoading: projectsLoading } = useListProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan học tập</h1>
        <p className="text-muted-foreground mt-2">Chào mừng trở lại! Dưới đây là hoạt động gần đây của bạn.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dự án đang tham gia</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              +1 từ học kỳ trước
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Đề tài mới nhất</CardTitle>
            <CardDescription>Các đề tài vừa được đăng tải trên hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topicsLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : topics?.items?.slice(0, 3).map(topic => (
                <div key={topic.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{topic.title}</p>
                    <p className="text-xs text-muted-foreground">{topic.domain}</p>
                  </div>
                  <Link href={`/topics/${topic.id}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/topics">Xem tất cả đề tài</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InstructorDashboardView() {
  const { data: dashboard, isLoading } = useGetInstructorDashboard();

  if (isLoading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển Giảng viên</h1>
        <p className="text-muted-foreground mt-2">Theo dõi tiến độ các dự án do bạn hướng dẫn.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số dự án</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalProjects || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Cảnh báo rủi ro</CardTitle>
            <Users className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboard?.atRiskCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dự án đang hướng dẫn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard?.projects?.map(project => (
              <div key={project.id} className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.topicTitle}</p>
                </div>
                <Link href={`/projects/${project.id}`}>
                  <Button variant="outline">Chi tiết</Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EnterpriseDashboard() {
  const { data: calls, isLoading } = useListCalls({});

  if (isLoading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển Doanh nghiệp</h1>
          <p className="text-muted-foreground mt-2">Quản lý các đơn đặt hàng và ứng viên dự án.</p>
        </div>
        <Link href="/marketplace/new">
          <Button>
            <Briefcase className="w-4 h-4 mr-2" />
            Tạo đặt hàng mới
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Các đặt hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calls?.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center border rounded-lg bg-slate-50 border-dashed">Chưa có đặt hàng nào</p>
            ) : calls?.map(call => (
              <div key={call.id} className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <h3 className="font-semibold">{call.title}</h3>
                  <p className="text-sm text-muted-foreground">Có {call.applicationCount} ứng tuyển</p>
                </div>
                <Link href={`/marketplace/${call.id}`}>
                  <Button variant="outline">Chi tiết</Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản trị hệ thống</h1>
        <p className="text-muted-foreground mt-2">Tổng quan thống kê nền tảng PROMATCH.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dự án hoạt động</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đề tài</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTopics || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: session, isLoading } = useGetSession();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Skeleton className="h-8 w-64" /></div>;
  }

  if (!session) {
    return <div>Không có phiên đăng nhập.</div>;
  }

  switch (session.role) {
    case "student":
      return <StudentDashboard />;
    case "instructor":
      return <InstructorDashboardView />;
    case "enterprise":
      return <EnterpriseDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "alumni":
      return <StudentDashboard />; // Fallback cho demo
    default:
      return <div>Vai trò không xác định.</div>;
  }
}