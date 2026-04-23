import { useState } from "react";
import { useRecommendTopics, RecommendTopicsParams } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function TopicsRecommended() {
  const [params, setParams] = useState<RecommendTopicsParams>({});
  const { data, isLoading } = useRecommendTopics(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đề tài gợi ý cho bạn</h1>
          <p className="text-muted-foreground mt-1">Được cá nhân hóa dựa trên kỹ năng và sở thích của bạn.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={params.domain || "all"} onValueChange={(val) => setParams({ ...params, domain: val === "all" ? undefined : val })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lĩnh vực" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
              <SelectItem value="AI/ML">AI/ML</SelectItem>
              <SelectItem value="Web">Web Development</SelectItem>
              <SelectItem value="Mobile">Mobile App</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
        ) : (data?.length ?? 0) === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">Không có gợi ý nào phù hợp.</div>
        ) : (
          data?.map((rec: any, index: number) => (
            <Card key={rec.topic.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">Top {index + 1}</Badge>
                      <Badge variant="secondary" className="text-xs">{rec.topic.domain}</Badge>
                      {rec.difficultyEstimate && <Badge variant="outline" className="text-xs">{rec.difficultyEstimate}</Badge>}
                    </div>
                    <h3 className="text-xl font-bold">{rec.topic.title}</h3>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    {rec.matchingSkills.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {rec.matchingSkills.map((s: string) => <span key={s} className="bg-green-500/10 text-green-700 px-1.5 py-0.5 rounded text-xs">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {rec.missingSkills.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {rec.missingSkills.map((s: string) => <span key={s} className="bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded text-xs">{s}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-3 p-4 bg-muted/30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-primary">Điểm phù hợp</span>
                    <span className="text-2xl font-bold text-primary">{Math.round(rec.hybridScore)}%</span>
                  </div>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Kỹ năng (SMS)</span>
                          <span>{Math.round(rec.skillMatchScore)}%</span>
                        </div>
                        <Progress value={rec.skillMatchScore} className="h-1" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Skill Match Score: Độ phù hợp kỹ năng</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Sở thích (IAS)</span>
                          <span>{Math.round(rec.interestAlignmentScore)}%</span>
                        </div>
                        <Progress value={rec.interestAlignmentScore} className="h-1" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Interest Alignment Score: Độ phù hợp sở thích</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex md:flex-col gap-2 w-full md:w-auto">
                  <Button asChild className="w-full whitespace-nowrap">
                    <Link href={`/topics/${rec.topic.id}`}>
                      Xem chi tiết
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}