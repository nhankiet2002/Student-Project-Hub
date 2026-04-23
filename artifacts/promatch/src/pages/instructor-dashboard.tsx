import { useGetInstructorDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, Users, AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function InstructorDashboard() {
  const { data: dashboard, isLoading } = useGetInstructorDashboard();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!dashboard) return <div>Không tìm thấy dữ liệu</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý lớp học</h1>
        <p className="text-muted-foreground mt-1">Theo dõi tiến độ, đánh giá và hỗ trợ các nhóm dự án.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng dự án hướng dẫn</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalProjects}</div>
          </CardContent>
        </Card>
        
        <Card className={dashboard.atRiskCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dự án rủi ro</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${dashboard.atRiskCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dashboard.atRiskCount > 0 ? "text-destructive" : ""}`}>
              {dashboard.atRiskCount}
            </div>
            {dashboard.atRiskCount > 0 && (
              <p className="text-xs text-destructive mt-1">Cần can thiệp khẩn cấp</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành học kỳ này</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.completedThisSemester || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách dự án</CardTitle>
              <CardDescription>Các nhóm sinh viên bạn đang trực tiếp hướng dẫn.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.projects.map(project => (
                  <div key={project.id} className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${project.status === 'at_risk' ? 'border-destructive/30 bg-destructive/5' : 'hover:bg-muted/50'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{project.name}</h3>
                        {project.status === 'at_risk' && <Badge variant="destructive" className="text-[10px] h-5">Rủi ro cao</Badge>}
                        {project.status === 'completed' && <Badge variant="default" className="text-[10px] h-5 bg-green-500 hover:bg-green-600">Đã xong</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{project.topicTitle}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {project.memberCount} tv</span>
                        <span>Tiến độ: {Math.round(project.progress)}%</span>
                      </div>
                    </div>
                    <Button asChild variant={project.status === 'at_risk' ? 'default' : 'outline'} size="sm">
                      <Link href={`/projects/${project.id}`}>Chi tiết</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mốc thời gian sắp tới</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.upcomingDeadlines?.map((deadline, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center justify-center bg-muted rounded p-2 min-w-[3rem]">
                      <span className="text-xs text-muted-foreground uppercase">{format(new Date(deadline.dueDate), "MMM")}</span>
                      <span className="font-bold">{format(new Date(deadline.dueDate), "dd")}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium line-clamp-1">{deadline.milestone}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{deadline.projectName}</p>
                    </div>
                  </div>
                ))}
                {(!dashboard.upcomingDeadlines || dashboard.upcomingDeadlines.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Không có sự kiện sắp tới</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}