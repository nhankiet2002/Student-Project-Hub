import { useRecommendTeammates, useSendTeamInvitation, useGetSession, useListTopics, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Star, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Teams() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const topicId = searchParams.get("topicId") || undefined;

  const { data: candidates, isLoading } = useRecommendTeammates({ topicId });
  const { data: session } = useGetSession();
  const { data: topics } = useListTopics();
  const queryClient = useQueryClient();

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
      onError: () => {
        toast({
          title: "Lỗi",
          description: "Không thể gửi lời mời. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      },
    },
  });

  const handleInvite = (name: string) => {
    const topic = topicId ? topics?.items?.find((t) => t.id === topicId) : undefined;
    inviteMutation.mutate({
      data: {
        topicTitle: topic?.title || "đề tài đang đề xuất",
        inviterName: session?.name || "Một sinh viên",
        message: `Xin chào ${name}, mình muốn mời bạn cùng làm đồ án.`,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tìm thành viên</h1>
        <p className="text-muted-foreground mt-1">Gợi ý các thành viên phù hợp để bổ sung kỹ năng cho nhóm của bạn.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-xl" />)
        ) : candidates?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            Không tìm thấy thành viên nào phù hợp.
          </div>
        ) : (
          candidates?.map((candidate) => (
            <Card key={candidate.user.id} className="flex flex-col h-full">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={candidate.user.avatarUrl || ''} />
                      <AvatarFallback>{candidate.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{candidate.user.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{candidate.user.organization || 'Sinh viên'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-primary">{Math.round(candidate.complementarityScore)}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Độ phù hợp</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <Badge variant="default" className="mb-2 w-fit">Vai trò: {candidate.suggestedRole}</Badge>
                </div>
                
                <div className="space-y-3">
                  {candidate.sharedSkills && candidate.sharedSkills.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Kỹ năng chung
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {candidate.sharedSkills.map(skill => (
                          <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidate.complementarySkills && candidate.complementarySkills.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" /> Kỹ năng bổ sung
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {candidate.complementarySkills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-[10px] bg-amber-50/50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {candidate.gapAnalysis && (
                    <div className="text-sm bg-muted/50 p-2 rounded text-muted-foreground flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary/70" />
                      <p className="text-xs">{candidate.gapAnalysis}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Button 
                  className="w-full" 
                  onClick={() => handleInvite(candidate.user.name)}
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {inviteMutation.isPending ? "Đang gửi..." : "Mời vào nhóm"}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}