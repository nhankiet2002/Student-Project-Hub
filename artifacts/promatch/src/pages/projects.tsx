import { useState } from "react";
import { useListProjects, useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, Users, CalendarClock, Plus } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newTopicId, setNewTopicId] = useState("");
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const createMutation = useCreateProject({
    mutation: {
      onSuccess: (data) => {
        toast.success("Đã tạo dự án thành công!");
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setLocation(`/projects/${data.id}`);
      },
      onError: () => {
        toast.error("Có lỗi xảy ra khi tạo dự án.");
      }
    }
  });

  const handleCreate = () => {
    if (!newProjectName.trim() || !newTopicId.trim()) {
      toast.error("Vui lòng điền đủ thông tin");
      return;
    }
    createMutation.mutate({
      data: {
        name: newProjectName,
        topicId: newTopicId,
        memberIds: []
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'planning': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100/80">Kế hoạch</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80">Đang làm</Badge>;
      case 'review': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100/80">Review</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100/80">Hoàn thành</Badge>;
      case 'at_risk': return <Badge variant="destructive">Rủi ro</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dự án của tôi</h1>
          <p className="text-muted-foreground mt-1">Quản lý các dự án nhóm bạn đang tham gia.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo dự án mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo dự án mới</DialogTitle>
              <DialogDescription>Tạo không gian làm việc cho nhóm của bạn.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tên dự án</Label>
                <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Nhập tên dự án..." />
              </div>
              <div className="space-y-2">
                <Label>ID Đề tài</Label>
                <Input value={newTopicId} onChange={e => setNewTopicId(e.target.value)} placeholder="Nhập ID đề tài..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Đang tạo..." : "Tạo dự án"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)
        ) : projects?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl flex flex-col items-center">
            <FolderKanban className="w-12 h-12 mb-4 text-muted-foreground/50" />
            <p>Bạn chưa tham gia dự án nào.</p>
            <Button variant="link" onClick={() => setIsCreateOpen(true)}>Tạo dự án đầu tiên</Button>
          </div>
        ) : (
          projects?.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    {getStatusBadge(project.status)}
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project.memberCount}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{project.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-3 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.topicTitle}</p>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tiến độ ({project.completedMilestones}/{project.milestoneCount} mốc)</span>
                      <span className="font-medium">{Math.round(project.progress)}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t mt-auto border-border/50 bg-muted/20 flex justify-between py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{project.instructorName}</span> (GVHD)
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    {format(new Date(project.dueDate), "dd/MM/yyyy")}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}