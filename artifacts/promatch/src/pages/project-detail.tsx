import { useState } from "react";
import { useGetProject, useListTasks, useCreateTask, useUpdateTask, useGetContributions, useUpdateProjectStatus, getListTasksQueryKey, getGetContributionsQueryKey , getGetProjectQueryKey, getListNotificationsQueryKey, getListProjectsQueryKey, useGetSession, useToggleBookmark } from "@workspace/api-client-react";
import { useParams, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, Calendar, AlertCircle, Plus, MoreHorizontal, Paperclip } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { TaskAttachmentDialog } from "@/components/task-attachment-dialog";
import type { Task } from "@workspace/api-client-react";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projectData, isLoading: projectLoading } = useGetProject(projectId || "", { query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId || "") } });
  const { data: tasks, isLoading: tasksLoading } = useListTasks(projectId || "", { query: { enabled: !!projectId, queryKey: getListTasksQueryKey(projectId || "") } });
  const { data: contributions } = useGetContributions(projectId || "", { query: { enabled: !!projectId, queryKey: getGetContributionsQueryKey(projectId || "") } });
  
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", assigneeId: "" });
  const [attachmentTask, setAttachmentTask] = useState<Task | null>(null);
  
  const queryClient = useQueryClient();

  const createTaskMutation = useCreateTask({
    mutation: {
      onSuccess: () => {
        toast.success("Tạo công việc thành công");
        setIsCreateTaskOpen(false);
        setNewTask({ title: "", description: "", assigneeId: "" });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId || "") });
      }
    }
  });

  const updateTaskMutation = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId || "") });
        toast.success("Đã cập nhật trạng thái");
      }
    }
  });

  const updateProjectStatusMutation = useUpdateProjectStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId || "") });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    },
  });

  const handleStatusChange = (status: string) => {
    if (!projectId) return;
    updateProjectStatusMutation.mutate({
      projectId,
      data: { status: status as "planning" | "in_progress" | "review" | "completed" | "at_risk" },
    });
  };

  const statusLabels: Record<string, string> = {
    planning: "Đang lập kế hoạch",
    in_progress: "Đang triển khai",
    review: "Chờ đánh giá",
    completed: "Đã hoàn thành",
    at_risk: "Cảnh báo trễ tiến độ",
  };

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;
    createTaskMutation.mutate({
      projectId: projectId || "",
      data: {
        title: newTask.title,
        description: newTask.description,
        assigneeId: newTask.assigneeId || undefined,
        status: "todo"
      }
    });
  };

  const handleUpdateTaskStatus = (taskId: string, status: any) => {
    updateTaskMutation.mutate({ taskId, data: { status } });
  };

  const { data: session } = useGetSession();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const isInvite = searchParams.get("invite") === "true";
  
  if (projectLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!projectData) return <div>Không tìm thấy dự án</div>;

  const { project, members, milestones, description, recentActivity } = projectData;
  const isMember = session?.id && members.some(m => m.userId === session.id);

  const handleInviteResponse = async (action: 'accept' | 'reject') => {
    try {
      const res = await fetch("/api/teams/respond-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action }),
      });
      if (res.ok) {
        toast.success(action === 'accept' ? "Đã tham gia dự án!" : "Đã từ chối lời mời");
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId || "") });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const taskColumns = [
    { id: "todo", title: "Cần làm" },
    { id: "in_progress", title: "Đang làm" },
    { id: "review", title: "Review" },
    { id: "done", title: "Hoàn thành" }
  ];

  return (
    <div className="space-y-6">
      {isInvite && !isMember && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-full">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-primary">Bạn có một lời mời tham gia nhóm!</h3>
              <p className="text-sm text-muted-foreground">Hãy xem qua chi tiết dự án bên dưới trước khi quyết định.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none border-primary/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={() => handleInviteResponse('reject')}>
              Từ chối
            </Button>
            <Button className="flex-1 md:flex-none font-bold" onClick={() => handleInviteResponse('accept')}>
              Chấp thuận tham gia
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
              {statusLabels[project.status] ?? project.status}
            </Badge>
            <span className="text-sm text-muted-foreground">{project.topicTitle}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="project-status" className="text-xs text-muted-foreground">
              Trạng thái dự án
            </Label>
            <Select
              value={project.status}
              onValueChange={handleStatusChange}
              disabled={updateProjectStatusMutation.isPending}
            >
              <SelectTrigger id="project-status" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Đang lập kế hoạch</SelectItem>
                <SelectItem value="in_progress">Đang triển khai</SelectItem>
                <SelectItem value="review">Chờ đánh giá</SelectItem>
                <SelectItem value="completed">Đã hoàn thành</SelectItem>
                <SelectItem value="at_risk">Cảnh báo trễ tiến độ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Tiến độ tổng thể</div>
            <div className="flex items-center gap-3">
              <Progress value={project.progress} className="w-32 h-2" />
              <span className="font-bold">{Math.round(project.progress)}%</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="kanban">Bảng công việc</TabsTrigger>
          <TabsTrigger value="milestones">Mốc tiến độ</TabsTrigger>
          <TabsTrigger value="contributions">Đóng góp</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="m-0 space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mô tả dự án</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-muted-foreground">{description || "Chưa có mô tả chi tiết."}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thành viên ({members.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {members.map(member => (
                        <div key={member.userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatarUrl || ''} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.role}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">{member.contributionPct}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin chung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">GVHD</span>
                      <span className="font-medium">{project.instructorName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Hạn chót</span>
                      <span className="font-medium">{format(new Date(project.dueDate), "dd/MM/yyyy")}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kanban" className="m-0">
            <div className="flex justify-end mb-4">
              <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Tạo Task</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tạo công việc mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Tên công việc</Label>
                      <Input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Người phụ trách</Label>
                      <Select value={newTask.assigneeId} onValueChange={v => setNewTask({...newTask, assigneeId: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn người phụ trách" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Chưa phân công</SelectItem>
                          {members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending || !newTask.title}>Tạo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              {taskColumns.map(col => (
                <Card key={col.id} className="bg-muted/30 border-dashed">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium">{col.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {tasks?.filter(t => t.status === col.id).length || 0}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-2 pt-0 space-y-2 min-h-[200px]">
                    {tasks?.filter(t => t.status === col.id).map(task => (
                      <Card key={task.id} className="shadow-sm">
                        <CardContent className="p-3 space-y-2">
                          <div className="font-medium text-sm line-clamp-2">{task.title}</div>
                          <div className="flex justify-between items-center mt-2 gap-1">
                            <span className="text-xs text-muted-foreground truncate flex-1" title={task.assigneeName}>
                              {task.assigneeName || "Chưa phân công"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-violet-600"
                              title="Tệp đính kèm"
                              onClick={() => setAttachmentTask(task)}
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                            </Button>
                            <Select value={task.status} onValueChange={(v) => handleUpdateTaskStatus(task.id, v)}>
                              <SelectTrigger className="w-[30px] h-6 p-0 border-none bg-transparent shadow-none">
                                <MoreHorizontal className="w-4 h-4" />
                              </SelectTrigger>
                              <SelectContent align="end">
                                {taskColumns.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="m-0">
            <Card>
              <CardContent className="p-6">
                <div className="relative border-l border-border ml-3 md:ml-6 space-y-8 pb-4">
                  {milestones.map((m, i) => (
                    <div key={m.id} className="relative pl-6 md:pl-8">
                      <div className={`absolute -left-3.5 top-1 w-7 h-7 rounded-full flex items-center justify-center border-4 border-background ${
                        m.status === 'completed' ? 'bg-green-500' : 
                        m.status === 'in_progress' ? 'bg-primary' : 
                        m.status === 'overdue' ? 'bg-destructive' : 'bg-muted-foreground'
                      }`}>
                        {m.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{m.name}</h3>
                        <Badge variant="outline" className="w-fit flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(m.dueDate), "dd/MM/yyyy")}
                        </Badge>
                      </div>
                      
                      {m.feedback && (
                        <div className="bg-muted/50 p-3 rounded-lg text-sm mt-3">
                          <div className="font-medium mb-1 text-primary text-xs">Phản hồi từ GVHD:</div>
                          <p className="text-muted-foreground">{m.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions" className="m-0 space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Tỷ lệ đóng góp</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contributions || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                        <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                          {contributions?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Chi tiết số liệu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thành viên</TableHead>
                          <TableHead className="text-right">Task hoàn thành</TableHead>
                          <TableHead className="text-right">Commits</TableHead>
                          <TableHead className="text-right">Tài liệu</TableHead>
                          <TableHead className="text-right">Đánh giá chéo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contributions?.map((c) => (
                          <TableRow key={c.userId}>
                            <TableCell className="font-medium flex items-center gap-2">
                              <Avatar className="w-6 h-6"><AvatarFallback>{c.name.charAt(0)}</AvatarFallback></Avatar>
                              {c.name}
                            </TableCell>
                            <TableCell className="text-right">{c.tasksCompleted}</TableCell>
                            <TableCell className="text-right">{c.commits}</TableCell>
                            <TableCell className="text-right">{c.documents}</TableCell>
                            <TableCell className="text-right">{c.peerRating ? `${c.peerRating}/5` : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="m-0">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-6 space-y-6">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary/40 shrink-0" />
                        <div>
                          <p className="text-sm">
                            {activity.actor && <span className="font-medium mr-1">{activity.actor}</span>}
                            <span className="text-muted-foreground">{activity.message}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp), { locale: vi, addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {attachmentTask && (
        <TaskAttachmentDialog
          open={!!attachmentTask}
          onOpenChange={(open) => { if (!open) setAttachmentTask(null); }}
          taskId={attachmentTask.id}
          taskTitle={attachmentTask.title}
          taskStatus={attachmentTask.status}
          taskDescription={attachmentTask.description}
          assigneeName={attachmentTask.assigneeName}
        />
      )}
    </div>
  );
}