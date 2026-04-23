import { useState } from "react";
import { useListKnowledge, ListKnowledgeParams } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, Download, Eye, Sparkles } from "lucide-react";

export default function Knowledge() {
  const [params, setParams] = useState<ListKnowledgeParams>({});
  const { data: items, isLoading } = useListKnowledge(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kho tri thức</h1>
          <p className="text-muted-foreground mt-1">Tra cứu tài liệu, báo cáo từ các dự án xuất sắc của cựu sinh viên.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm tài liệu, dự án..." 
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
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)
        ) : items?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            Không tìm thấy tài liệu phù hợp.
          </div>
        ) : (
          items?.map((item) => (
            <Link key={item.id} href={`/knowledge/${item.id}`}>
              <Card className={`h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden ${item.featured ? 'border-primary/20' : ''}`}>
                {item.featured && (
                  <div className="absolute top-3 right-[-30px] rotate-45 bg-primary text-primary-foreground text-[10px] font-bold py-1 px-10 shadow-sm flex items-center justify-center gap-1 z-10">
                    <Sparkles className="w-3 h-3" /> NỔI BẬT
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2 mb-2 pr-6">
                    <Badge variant="outline">{item.year}</Badge>
                    <Badge variant="secondary" className="truncate max-w-[120px]">{item.domain}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-3 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.summary}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {item.technologies?.slice(0, 3).map((tech, i) => (
                      <span key={i} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {tech}
                      </span>
                    ))}
                    {(item.technologies?.length || 0) > 3 && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        +{(item.technologies?.length || 0) - 3}
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t mt-auto border-border/50 bg-muted/10 flex justify-between py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 font-medium text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    {item.rating?.toFixed(1) || "Chưa có đánh giá"}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.viewCount}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {item.downloadCount}</span>
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