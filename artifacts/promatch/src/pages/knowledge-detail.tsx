import { useGetKnowledge , getGetKnowledgeQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Download, Eye, ExternalLink, Calendar, Users, GraduationCap } from "lucide-react";

export default function KnowledgeDetail() {
  const { archiveId } = useParams<{ archiveId: string }>();
  const { data: item, isLoading } = useGetKnowledge(archiveId || "", { query: { enabled: !!archiveId, queryKey: getGetKnowledgeQueryKey(archiveId || "") } });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!item) return <div>Không tìm thấy tài liệu</div>;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {item.year}
            </Badge>
            <Badge>{item.domain}</Badge>
            {item.featured && <Badge className="bg-amber-500 hover:bg-amber-600">Nổi bật</Badge>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              {item.rating?.toFixed(1) || "Chưa có đánh giá"}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tóm tắt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed">{item.summary}</p>
          </CardContent>
        </Card>

        {item.technologies && item.technologies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Công nghệ sử dụng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {item.technologies.map(tech => (
                  <Badge key={tech} variant="secondary">{tech}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Thông tin dự án</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase">
                <Users className="w-4 h-4" /> Nhóm tác giả
              </h4>
              <ul className="space-y-1">
                {item.teamMembers.map((member, i) => (
                  <li key={i} className="font-medium">{member}</li>
                ))}
              </ul>
            </div>

            {item.instructorName && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase">
                  <GraduationCap className="w-4 h-4" /> Giảng viên hướng dẫn
                </h4>
                <p className="font-medium">{item.instructorName}</p>
              </div>
            )}

            <div className="pt-4 border-t grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-center text-muted-foreground mb-1"><Eye className="w-4 h-4" /></div>
                <div className="font-bold">{item.viewCount}</div>
                <div className="text-xs text-muted-foreground">Lượt xem</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-center text-muted-foreground mb-1"><Download className="w-4 h-4" /></div>
                <div className="font-bold">{item.downloadCount}</div>
                <div className="text-xs text-muted-foreground">Tải xuống</div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Tải báo cáo chi tiết
              </Button>
              {item.demoUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={item.demoUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Xem Demo
                  </a>
                </Button>
              )}
            </div>

            {item.keywords && item.keywords.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Từ khóa</h4>
                <div className="flex flex-wrap gap-1">
                  {item.keywords.map(kw => (
                    <Badge key={kw} variant="outline" className="text-xs font-normal">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}