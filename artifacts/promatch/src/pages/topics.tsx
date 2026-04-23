import { useState } from "react";
import { useListTopics, ListTopicsParams } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function Topics() {
  const [params, setParams] = useState<ListTopicsParams>({ sort: "recent" });
  const { data, isLoading } = useListTopics(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Khám phá đề tài</h1>
          <p className="text-muted-foreground mt-1">Tìm kiếm và lọc các đề tài phù hợp với bạn.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={params.sort} onValueChange={(val: any) => setParams({ ...params, sort: val })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mới nhất</SelectItem>
              <SelectItem value="popular">Phổ biến nhất</SelectItem>
              <SelectItem value="score">Điểm cao nhất</SelectItem>
              <SelectItem value="relevance">Độ phù hợp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm đề tài..." 
            className="pl-9"
            onChange={(e) => setParams({ ...params, q: e.target.value })}
          />
        </div>
        <Select value={params.domain || "all"} onValueChange={(val) => setParams({ ...params, domain: val === "all" ? undefined : val })}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Lĩnh vực" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
            <SelectItem value="AI/ML">AI/ML</SelectItem>
            <SelectItem value="Web">Web Development</SelectItem>
            <SelectItem value="Mobile">Mobile App</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.difficulty || "all"} onValueChange={(val) => setParams({ ...params, difficulty: val === "all" ? undefined : val })}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Độ khó" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi độ khó</SelectItem>
            <SelectItem value="beginner">Cơ bản</SelectItem>
            <SelectItem value="intermediate">Trung bình</SelectItem>
            <SelectItem value="advanced">Nâng cao</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)
        ) : data?.items?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            Không tìm thấy đề tài nào phù hợp.
          </div>
        ) : (
          data?.items?.map((topic) => (
            <Link key={topic.id} href={`/topics/${topic.id}`}>
              <Card className="h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="outline">{topic.sourceLabel || topic.source}</Badge>
                    <Badge variant={topic.difficulty === 'advanced' ? 'destructive' : topic.difficulty === 'intermediate' ? 'default' : 'secondary'}>
                      {topic.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{topic.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs font-normal">{topic.domain}</Badge>
                  </div>
                  {topic.completeness !== undefined && (
                    <div className="space-y-1 mt-auto">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Mức độ hoàn thiện</span>
                        <span className="font-medium">{topic.completeness}%</span>
                      </div>
                      <Progress value={topic.completeness} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 border-t mt-4 border-border/50 bg-muted/20">
                  <div className="w-full mt-3 flex flex-wrap gap-1">
                    {topic.requiredSkills?.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-sm text-muted-foreground">
                        {skill}
                      </span>
                    ))}
                    {(topic.requiredSkills?.length || 0) > 3 && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-sm text-muted-foreground">
                        +{(topic.requiredSkills?.length || 0) - 3}
                      </span>
                    )}
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