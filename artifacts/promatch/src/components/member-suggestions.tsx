import { useRecommendTeammates, useSendTeamInvitation, useGetSession, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Star, CheckCircle2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MemberSuggestionsProps {
  topicId: string;
  topicTitle: string;
}

export function MemberSuggestions({ topicId, topicTitle }: MemberSuggestionsProps) {
  const { data: candidates, isLoading } = useRecommendTeammates({ topicId });
  const { data: session } = useGetSession();
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
    inviteMutation.mutate({
      data: {
        topicTitle: topicTitle,
        inviterName: session?.name || "Một sinh viên",
        message: `Xin chào ${name}, mình muốn mời bạn cùng làm đồ án cho đề tài "${topicTitle}".`,
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ứng viên tiềm năng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!candidates || candidates.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          Ứng viên tiềm năng
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {candidates.slice(0, 5).map((candidate) => (
            <div key={candidate.user.id} className="p-4 space-y-3 hover:bg-muted/30 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={candidate.user.avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs">
                      {candidate.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{candidate.user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                      {candidate.user.organization || 'Sinh viên'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-primary">{Math.round(candidate.complementarityScore * 100)}%</span>
                  <span className="text-[8px] text-muted-foreground uppercase">Hợp</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[9px] h-4 py-0 font-normal">
                  {candidate.suggestedRole}
                </Badge>
                {candidate.complementarySkills.slice(0, 2).map(skill => (
                  <Badge key={skill} variant="secondary" className="text-[9px] h-4 py-0 font-normal bg-amber-50 text-amber-700 border-amber-100">
                    +{skill}
                  </Badge>
                ))}
              </div>

              <Button 
                size="sm" 
                variant="default"
                className="w-full h-8 text-[11px] hover-elevate active-elevate-2"
                onClick={() => handleInvite(candidate.user.name)}
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3 h-3 mr-1.5" />
                )}
                Mời vào nhóm
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
