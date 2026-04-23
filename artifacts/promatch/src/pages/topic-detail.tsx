import { useGetTopic, useCreateProject, useGetPortfolio, useGetSession , getGetTopicQueryKey, getGetPortfolioQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export default function TopicDetail() {
  const { topicId } = useParams<{ topicId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: session } = useGetSession();
  const { data: topic, isLoading: topicLoading } = useGetTopic(topicId || "", { query: { enabled: !!topicId, queryKey: getGetTopicQueryKey(topicId || "") } });
  const { data: portfolio } = useGetPortfolio(session?.id || "", { query: { enabled: !!session?.id, queryKey: getGetPortfolioQueryKey(session?.id || "") } });

  const createProject = useCreateProject({
    mutation: {
      onSuccess: (data) => {
        toast.success("Tạo nhóm thành công!");
        setLocation(`/projects/${data.id}`);
      }
    }
  });

  if (topicLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!topic) return <div>Không tìm thấy đề tài</div>;

  const userSkills = portfolio?.skills.map(s => s.name) || [];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{topic.sourceLabel || topic.source}</Badge>
            <Badge>{topic.domain}</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{topic.title}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mô tả vấn đề</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">{topic.problemDescription}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mục tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-decimal pl-5 space-y-2">
              {topic.objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Công nghệ & Khả thi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Công nghệ đề xuất</h4>
              <div className="flex flex-wrap gap-2">
                {topic.technologies.map(tech => (
                  <Badge key={tech} variant="secondary">{tech}</Badge>
                ))}
              </div>
            </div>
            {topic.feasibility && (
              <div>
                <h4 className="font-semibold mb-2">Đánh giá khả thi</h4>
                <p className="text-muted-foreground">{topic.feasibility}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Thông tin nhóm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Kích thước nhóm</span>
              <span className="font-semibold">{topic.teamSize} người</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Độ khó</span>
              <Badge variant={topic.difficulty === 'advanced' ? 'destructive' : topic.difficulty === 'intermediate' ? 'default' : 'secondary'}>
                {topic.difficulty}
              </Badge>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold">Kỹ năng yêu cầu</h4>
              <div className="space-y-2">
                {topic.requiredSkills.map(skill => {
                  const hasSkill = userSkills.includes(skill);
                  return (
                    <div key={skill} className="flex items-center justify-between text-sm">
                      <span>{skill}</span>
                      {hasSkill ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive/50" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => createProject.mutate({ data: { name: `Dự án: ${topic.title}`, topicId: topic.id, memberIds: [session?.id || ""] } })}
                disabled={createProject.isPending}
              >
                {createProject.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Tạo nhóm với đề tài này
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setLocation(`/teams?topicId=${topic.id}`)}>
                Tìm thành viên phù hợp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}