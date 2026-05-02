import { useRecommendTeammates, useSendTeamInvitation, useGetSession, useListTopics, useListProjects, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useSearch, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Star, CheckCircle2, MessageSquare, Loader2, Sparkles, ExternalLink, UserCheck, Briefcase } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Teams() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const topicId = searchParams.get("topicId") || undefined;
  const [, setLocation] = useLocation();

  const { data: candidates, isLoading } = useRecommendTeammates({ topicId });
  const { data: session } = useGetSession();
  const { data: topics } = useListTopics();
  const { data: projectsData } = useListProjects();
  const queryClient = useQueryClient();

  const [selectedCandidate, setSelectedCandidate] = useState<{ id: string, name: string } | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const { toast } = useToast();
  const inviteMutation = useSendTeamInvitation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({
          title: "Đã gửi lời mời",
          description: "Lời mời tham gia nhóm đã được gửi thành công.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Lỗi",
          description: err.message || "Không thể gửi lời mời. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      },
    },
  });

  const handleInviteClick = (userId: string, name: string) => {
    setSelectedCandidate({ id: userId, name });
    setIsInviteDialogOpen(true);
  };

  const handleConfirmInvite = (projectId: string, projectTitle: string) => {
    if (!selectedCandidate) return;

    inviteMutation.mutate({
      data: {
        userId: selectedCandidate.id,
        projectId: projectId,
        topicTitle: projectTitle,
        inviterName: session?.name || "Một sinh viên",
        message: `Xin chào ${selectedCandidate.name}, mình muốn mời bạn tham gia vào dự án "${projectTitle}".`,
      },
    }, {
      onSuccess: () => {
        setIsInviteDialogOpen(false);
        setSelectedCandidate(null);
      }
    });
  };

  const handleMessage = (userId: string) => {
    // Redirect to messages page
    setLocation(`/messages?userId=${userId}`);
  };

  const handleAddFriend = (name: string) => {
    toast({
      title: "Yêu cầu kết bạn",
      description: `Đã gửi lời mời kết bạn đến ${name}.`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Tính năng AI</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Tìm kiếm cộng sự
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Khám phá những sinh viên có kỹ năng bổ trợ hoàn hảo cho dự án của bạn.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden border-none shadow-md">
              <Skeleton className="h-80 w-full" />
            </Card>
          ))
        ) : candidates?.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-muted/30">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">Chưa tìm thấy ứng viên phù hợp</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">Thử thay đổi tiêu chí hoặc đề tài để có nhiều kết quả hơn.</p>
          </div>
        ) : (
          candidates?.map((candidate) => (
            <Card key={candidate.user.id} className="flex flex-col h-full overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 group rounded-2xl bg-card">
              <CardHeader className="pb-4 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex justify-between items-start">
                  <Link href={`/portfolio/public/${candidate.user.id}`} className="flex items-center gap-3 cursor-pointer group-hover:translate-x-1 transition-transform">
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
                        <AvatarImage src={candidate.user.avatarUrl || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                          {candidate.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors flex items-center gap-1">
                        {candidate.user.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-medium">{candidate.user.organization || 'ĐH Bách Khoa'}</p>
                    </div>
                  </Link>
                  <div className="flex flex-col items-end">
                    <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-black shadow-sm">
                      {Math.round(candidate.complementarityScore * 100)}%
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-tighter">Phù hợp</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-5 pt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-semibold px-3 py-1 rounded-lg">
                    Vai trò đề xuất: {candidate.suggestedRole}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> Gợi ý từ PROMATCH AI
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 italic">
                      "{candidate.gapAnalysis}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {candidate.sharedSkills && candidate.sharedSkills.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> Kỹ năng chung
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {candidate.sharedSkills.slice(0, 3).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-[9px] font-medium py-0 px-1.5">{skill}</Badge>
                          ))}
                          {candidate.sharedSkills.length > 3 && <span className="text-[10px] text-muted-foreground">+{candidate.sharedSkills.length - 3}</span>}
                        </div>
                      </div>
                    )}

                    {candidate.complementarySkills && candidate.complementarySkills.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-widest">
                          <Star className="w-3 h-3 text-amber-500" /> Kỹ năng bổ trợ
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {candidate.complementarySkills.slice(0, 3).map(skill => (
                            <Badge key={skill} variant="outline" className="text-[9px] font-medium py-0 px-1.5 bg-amber-50/50 text-amber-700 border-amber-200">{skill}</Badge>
                          ))}
                          {candidate.complementarySkills.length > 3 && <span className="text-[10px] text-muted-foreground">+{candidate.complementarySkills.length - 3}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-4 pb-6 px-6 gap-2 border-t bg-muted/10">
                <div className="flex flex-col w-full gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="rounded-xl h-10 border-slate-200 hover:bg-slate-50 transition-all font-semibold"
                      onClick={() => handleAddFriend(candidate.user.name)}
                    >
                      <UserCheck className="w-4 h-4 mr-2 text-primary" />
                      Kết bạn
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-xl h-10 border-slate-200 hover:bg-slate-50 transition-all font-semibold"
                      onClick={() => handleMessage(candidate.user.id)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2 text-primary" />
                      Nhắn tin
                    </Button>
                  </div>
                  <Button 
                    className="w-full rounded-xl h-11 font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all" 
                    onClick={() => handleInviteClick(candidate.user.id, candidate.user.name)}
                    disabled={inviteMutation.isPending}
                  >
                    {inviteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    {inviteMutation.isPending ? "Đang gửi yêu cầu..." : "Mời vào nhóm ngay"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              Chọn dự án mời tham gia
            </DialogTitle>
            <DialogDescription>
              Chọn một trong các dự án hiện tại của bạn để gửi lời mời cho <span className="font-semibold text-foreground">{selectedCandidate?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {projectsData && projectsData.length > 0 ? (
                  projectsData.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleConfirmInvite(project.id, project.name)}
                      className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-primary transition-colors">{project.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] py-0">{project.topicTitle}</Badge>
                          <span className="text-[10px] text-muted-foreground">Tiến độ: {project.progress}%</span>
                        </div>
                      </div>
                      <UserPlus className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Bạn chưa có dự án nào đang tham gia.</p>
                    <Link href="/topics">
                      <Button variant="link" className="text-primary font-bold mt-2">Tìm đề tài ngay</Button>
                    </Link>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}