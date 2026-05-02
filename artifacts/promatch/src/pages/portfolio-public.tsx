import { useGetPortfolio, getGetPortfolioQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortfolioPublic() {
  const { userId } = useParams<{ userId: string }>();
  const { data: portfolio, isLoading } = useGetPortfolio(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioQueryKey(userId) } });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!portfolio) {
    return <div className="text-center py-12">Không tìm thấy hồ sơ</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-primary/5 border-none shadow-none">
        <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="w-32 h-32">
            <AvatarImage src={portfolio.avatarUrl || ''} />
            <AvatarFallback className="text-4xl">{portfolio.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left space-y-2 flex-1">
            <h1 className="text-3xl font-bold">{portfolio.name}</h1>
            <p className="text-muted-foreground text-lg">{portfolio.major} {portfolio.year ? `- Khóa ${portfolio.year}` : ''}</p>
            <p className="max-w-2xl">{portfolio.bio}</p>
          </div>
          {portfolio.portfolioUrl && (
            <Button asChild variant="outline">
              <a href={portfolio.portfolioUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Website cá nhân
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kỹ năng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Nâng cao</h3>
                  <div className="flex flex-wrap gap-2">
                    {portfolio.skills.filter(s => s.level === 'advanced').map(s => (
                      <Badge key={s.skillId} variant="default">{s.name}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Trung bình</h3>
                  <div className="flex flex-wrap gap-2">
                    {portfolio.skills.filter(s => s.level === 'intermediate').map(s => (
                      <Badge key={s.skillId} variant="secondary">{s.name}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Cơ bản</h3>
                  <div className="flex flex-wrap gap-2">
                    {portfolio.skills.filter(s => s.level === 'beginner').map(s => (
                      <Badge key={s.skillId} variant="outline">{s.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lĩnh vực quan tâm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {portfolio.interests.map(interest => (
                  <Badge key={interest} variant="secondary">{interest}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dự án đã tham gia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!portfolio.allCompletedProjects || portfolio.allCompletedProjects.length === 0) ? (
                <p className="text-muted-foreground text-sm italic">Chưa có dự án hoàn thành nào được ghi nhận.</p>
              ) : (
                <div className="grid gap-4">
                  {(portfolio.allCompletedProjects as any[]).map((project, idx) => (
                    <div key={project.id || idx} className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-lg">{project.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-primary/80">{project.role}</span>
                            <span>•</span>
                            <span>{project.year}</span>
                          </div>
                        </div>
                        {project.contributionPct && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Đóng góp: {project.contributionPct}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {project.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dự án hoàn thành</span>
                <span className="font-bold text-xl">{portfolio.completedProjects}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Điểm đóng góp</span>
                <span className="font-bold text-xl">{portfolio.contributionScore}</span>
              </div>
            </CardContent>
          </Card>

          {portfolio.certifications && portfolio.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chứng chỉ</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                  {portfolio.certifications.map((cert, i) => (
                    <li key={i}>{cert}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}