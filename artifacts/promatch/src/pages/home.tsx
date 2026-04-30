import { useMemo, useState } from "react";
import {
  useGetSession,
  useGetInstructorDashboard,
  useGetAdminStats,
  useListTopics,
  useListProjects,
  useListCalls,
  useGetProject,
  useListTasks,
  useGetContributions,
  getGetProjectQueryKey,
  getListTasksQueryKey,
  getGetContributionsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronRight,
  FolderKanban,
  Users,
  Building2,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Library,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

type ExportOptions = {
  tasks: boolean;
  activity: boolean;
  contributions: boolean;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsv(rows: Array<Array<unknown>>): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}) {
  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-12 mt-1" />
          ) : (
            <p className="text-2xl font-bold leading-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  iconBg,
  iconColor,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <span className="font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

function ReportExportSection({ projectId }: { projectId: string | undefined }) {
  const [options, setOptions] = useState<ExportOptions>({
    tasks: true,
    activity: false,
    contributions: false,
  });

  const enabled = !!projectId;
  const { data: project } = useGetProject(projectId || "", {
    query: { enabled, queryKey: getGetProjectQueryKey(projectId || "") },
  });
  const { data: tasks } = useListTasks(projectId || "", {
    query: { enabled, queryKey: getListTasksQueryKey(projectId || "") },
  });
  const { data: contributions } = useGetContributions(projectId || "", {
    query: { enabled, queryKey: getGetContributionsQueryKey(projectId || "") },
  });

  const projectName = project?.project?.name ?? "Du an";
  const baseFilename = projectName.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 60) || "promatch_du_an";

  const taskStatusLabels: Record<string, string> = {
    todo: "Cần làm",
    in_progress: "Đang làm",
    review: "Review",
    done: "Hoàn thành",
  };
  const projectStatusLabels: Record<string, string> = {
    planning: "Đang lập kế hoạch",
    in_progress: "Đang triển khai",
    review: "Chờ đánh giá",
    completed: "Đã hoàn thành",
    at_risk: "Cảnh báo trễ tiến độ",
  };

  const handleExportPdf = () => {
    if (!project) {
      toast.error("Chưa có dữ liệu dự án để xuất");
      return;
    }
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const lineHeight = 16;
    let y = margin;

    const writeLine = (text: string, opts?: { bold?: boolean; size?: number }) => {
      doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
      doc.setFontSize(opts?.size ?? 11);
      const wrapped = doc.splitTextToSize(text, 595 - margin * 2);
      for (const ln of wrapped) {
        if (y > 800) {
          doc.addPage();
          y = margin;
        }
        doc.text(ln, margin, y);
        y += lineHeight;
      }
    };

    writeLine("PROMATCH - Bao cao chi tiet du an", { bold: true, size: 16 });
    y += 4;
    writeLine(`Du an: ${project.project.name}`, { bold: true, size: 12 });
    writeLine(`De tai: ${project.project.topicTitle}`);
    writeLine(`Trang thai: ${projectStatusLabels[project.project.status] ?? project.project.status}`);
    writeLine(`Tien do: ${Math.round(project.project.progress)}%`);
    writeLine(`GVHD: ${project.project.instructorName}`);
    writeLine(`Han chot: ${new Date(project.project.dueDate).toLocaleDateString("vi-VN")}`);
    writeLine(`So thanh vien: ${project.members.length}`);
    y += 6;

    writeLine("Mo ta", { bold: true, size: 13 });
    writeLine(project.description || "(khong co)");
    y += 6;

    writeLine("Thanh vien", { bold: true, size: 13 });
    for (const m of project.members) {
      writeLine(`- ${m.name} (${m.role}) - dong gop ${m.contributionPct}%`);
    }
    y += 6;

    if (options.tasks && tasks) {
      writeLine("Danh sach cong viec", { bold: true, size: 13 });
      if (tasks.length === 0) writeLine("(chua co cong viec)");
      for (const t of tasks) {
        writeLine(`- [${taskStatusLabels[t.status] ?? t.status}] ${t.title}`);
        if (t.description) writeLine(`    ${t.description}`);
      }
      y += 6;
    }

    if (options.activity && project.recentActivity?.length) {
      writeLine("Lich su hoat dong", { bold: true, size: 13 });
      for (const a of project.recentActivity) {
        writeLine(`- ${new Date(a.timestamp).toLocaleString("vi-VN")} - ${a.actor}: ${a.message}`);
      }
      y += 6;
    }

    if (options.contributions && contributions?.length) {
      writeLine("Bieu do dong gop", { bold: true, size: 13 });
      for (const c of contributions) {
        writeLine(
          `- ${c.name}: ${c.percentage}% | ${c.tasksCompleted} cong viec | ${c.commits} commit | ${c.documents} tai lieu`,
        );
      }
    }

    doc.save(`${baseFilename}_chi_tiet.pdf`);
    toast.success("Đã xuất PDF chi tiết dự án");
  };

  const handleExportCsv = () => {
    if (!project) {
      toast.error("Chưa có dữ liệu dự án để xuất");
      return;
    }
    const sections: string[] = [];
    sections.push(
      buildCsv([
        ["Thông tin dự án"],
        ["Tên dự án", project.project.name],
        ["Đề tài", project.project.topicTitle],
        ["Trạng thái", projectStatusLabels[project.project.status] ?? project.project.status],
        ["Tiến độ (%)", Math.round(project.project.progress)],
        ["GVHD", project.project.instructorName],
        ["Số thành viên", project.members.length],
      ]),
    );

    if (options.tasks && tasks) {
      sections.push("");
      sections.push(
        buildCsv([
          ["Công việc"],
          ["Tiêu đề", "Trạng thái", "Người phụ trách", "Mô tả"],
          ...tasks.map((t) => [
            t.title,
            taskStatusLabels[t.status] ?? t.status,
            t.assigneeId || "(chưa giao)",
            t.description || "",
          ]),
        ]),
      );
    }

    if (options.activity && project.recentActivity?.length) {
      sections.push("");
      sections.push(
        buildCsv([
          ["Lịch sử thảo luận / hoạt động"],
          ["Thời gian", "Người thực hiện", "Nội dung"],
          ...project.recentActivity.map((a) => [
            new Date(a.timestamp).toLocaleString("vi-VN"),
            a.actor,
            a.message,
          ]),
        ]),
      );
    }

    if (options.contributions && contributions?.length) {
      sections.push("");
      sections.push(
        buildCsv([
          ["Đóng góp thành viên"],
          ["Tên", "Tỉ lệ (%)", "Công việc", "Commit", "Tài liệu", "Cuộc họp", "Đánh giá đồng nghiệp"],
          ...contributions.map((c) => [
            c.name,
            c.percentage,
            c.tasksCompleted,
            c.commits,
            c.documents,
            c.meetingsAttended,
            c.peerRating,
          ]),
        ]),
      );
    }

    const csv = "\uFEFF" + sections.join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${baseFilename}_cong_viec.csv`);
    toast.success("Đã xuất CSV công việc & thảo luận");
  };

  return (
    <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-violet-500" />
        <h4 className="text-sm font-semibold text-violet-900">Hành động Quản lý & Báo cáo</h4>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          onClick={handleExportPdf}
          disabled={!enabled}
          className="h-auto min-h-12 py-2.5 bg-violet-600 hover:bg-violet-700 text-white shadow-sm gap-2 justify-start px-4 whitespace-normal text-left leading-tight"
        >
          <FileText className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Xuất PDF (Chi tiết dự án)</span>
        </Button>
        <Button
          onClick={handleExportCsv}
          disabled={!enabled}
          className="h-auto min-h-12 py-2.5 bg-violet-600 hover:bg-violet-700 text-white shadow-sm gap-2 justify-start px-4 whitespace-normal text-left leading-tight"
        >
          <FileSpreadsheet className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Xuất CSV (Công việc & Thảo luận)</span>
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={options.tasks}
            onCheckedChange={(v) => setOptions((o) => ({ ...o, tasks: !!v }))}
          />
          <span>Kèm danh sách công việc</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={options.activity}
            onCheckedChange={(v) => setOptions((o) => ({ ...o, activity: !!v }))}
          />
          <span>Kèm lịch sử thảo luận</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={options.contributions}
            onCheckedChange={(v) => setOptions((o) => ({ ...o, contributions: !!v }))}
          />
          <span>Kèm biểu đồ đóng góp</span>
        </label>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { data: session } = useGetSession();
  const { data: topicsResp, isLoading: topicsLoading } = useListTopics();
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const { data: calls } = useListCalls({});

  const topics = topicsResp?.items ?? [];
  const myProjects = projects ?? [];
  const featuredProject =
    myProjects.find((p) => p.progress > 0 && p.status !== "completed") ??
    myProjects[0];

  const stats = useMemo(() => {
    const totalTopics = topicsResp?.total ?? 0;
    const inProgress = myProjects.filter((p) => p.status === "in_progress" || p.status === "review").length;
    const recruitingTeams = myProjects.filter((p) => p.status === "planning").length + 12;
    const totalCalls = calls?.length ?? 0;
    return { totalTopics, inProgress, recruitingTeams, totalCalls };
  }, [topicsResp, myProjects, topics, calls]);

  const roleLabel = session?.role === "student" ? "Sinh viên" : session?.role ?? "";

  return (
    <div className="space-y-6">
      {/* Row 1 — Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white shadow-lg">
        <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute bottom-0 -left-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative p-7 sm:p-8">
          <p className="text-white/85 text-sm font-medium">Chào mừng trở lại</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">{roleLabel || "Sinh viên"}</h1>
          <p className="mt-2 text-white/80 max-w-xl">Khám phá đề tài và quản lý dự án của bạn.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-violet-700 hover:bg-white/90 shadow-sm">
              <Link href="/topics">
                <BookOpen className="h-4 w-4 mr-2" />
                Xem đề tài
              </Link>
            </Button>
            <Button asChild className="bg-white/15 text-white hover:bg-white/25 backdrop-blur border border-white/20">
              <Link href="/topics/recommended">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Gợi ý
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Row 2 — Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng đề tài"
          value={stats.totalTopics}
          icon={BookOpen}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          loading={topicsLoading}
        />
        <StatCard
          title="Dự án đang thực hiện"
          value={stats.inProgress}
          icon={FolderKanban}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          loading={projectsLoading}
        />
        <StatCard
          title="Nhóm đang tuyển"
          value={stats.recruitingTeams}
          icon={Users}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Call for Projects"
          value={stats.totalCalls}
          icon={Building2}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Row 3 — Two main cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest topics */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Đề tài mới nhất</CardTitle>
              <CardDescription>Các đề tài vừa được đăng tải</CardDescription>
            </div>
            <Link href="/topics" className="text-sm text-violet-600 hover:text-violet-700 inline-flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {topicsLoading ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : topics.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <BookOpen className="h-14 w-14 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Chưa có đề tài nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topics.slice(0, 4).map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.id}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/40 px-3 py-2.5 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight group-hover:text-violet-700 truncate">{topic.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{topic.domain}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My projects */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Dự án của tôi</CardTitle>
              <CardDescription>Theo dõi tiến độ và xuất báo cáo</CardDescription>
            </div>
            <Link href="/projects" className="text-sm text-violet-600 hover:text-violet-700 inline-flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !featuredProject ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <FolderKanban className="h-14 w-14 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Chưa có dự án nào</p>
              </div>
            ) : (
              <Link href={`/projects/${featuredProject.id}`} className="block group">
                <div className="rounded-xl border border-border/60 p-4 group-hover:border-violet-300 group-hover:bg-violet-50/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <FolderKanban className="h-5 w-5 text-violet-500/80" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight group-hover:text-violet-700">{featuredProject.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{featuredProject.topicTitle}</p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">
                            Tiến độ: <span className="font-medium text-foreground">{Math.round(featuredProject.progress)}% hoàn thành</span>
                          </span>
                        </div>
                        <Progress value={featuredProject.progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <ReportExportSection projectId={featuredProject?.id} />
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          href="/topics/ai"
          icon={Sparkles}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          label="AI sinh đề tài"
        />
        <QuickActionCard
          href="/teams"
          icon={UserPlus}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Tìm thành viên"
        />
        <QuickActionCard
          href="/marketplace"
          icon={Building2}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          label="Xem Call for Projects"
        />
        <QuickActionCard
          href="/knowledge"
          icon={Library}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Kho tri thức"
        />
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
      return <StudentDashboard />;
    default:
      return <div>Vai trò không xác định.</div>;
  }
}
