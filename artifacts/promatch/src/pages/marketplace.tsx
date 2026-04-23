import { useState } from "react";
import { useListCalls, ListCallsParams, useGetSession } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Clock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function Marketplace() {
  const { data: session } = useGetSession();
  const [params, setParams] = useState<ListCallsParams>({});
  const { data: calls, isLoading } = useListCalls(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thị trường Đặt hàng</h1>
          <p className="text-muted-foreground mt-1">Các bài toán thực tế từ doanh nghiệp cần sinh viên giải quyết.</p>
        </div>
        <div className="flex items-center gap-2">
          {session?.role === 'enterprise' && (
            <Button asChild>
              <Link href="/marketplace/new">Đăng đặt hàng mới</Link>
            </Button>
          )}
          <Select value={params.status || "all"} onValueChange={(val) => setParams({ ...params, status: val === "all" ? undefined : val })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="published">Đang mở</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)
        ) : calls?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            Chưa có đơn đặt hàng nào.
          </div>
        ) : (
          calls?.map((call) => (
            <Link key={call.id} href={`/marketplace/${call.id}`}>
              <Card className="h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {call.enterpriseName}
                    </Badge>
                    <Badge variant={call.status === 'published' ? 'default' : 'secondary'}>
                      {call.status === 'published' ? 'Đang mở' : 'Đã đóng'}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{call.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-3 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">{call.problemDescription}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {call.skillTags?.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal bg-muted">
                        {tag}
                      </Badge>
                    ))}
                    {(call.skillTags?.length || 0) > 3 && (
                      <Badge variant="secondary" className="text-xs font-normal bg-muted">
                        +{(call.skillTags?.length || 0) - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t mt-auto border-border/50 bg-muted/20 flex justify-between py-3">
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Clock className="w-3 h-3" />
                    {call.deadline ? `Còn ${formatDistanceToNow(new Date(call.deadline), { locale: vi })}` : 'Không thời hạn'}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Users className="w-3 h-3" />
                    {call.applicationCount} ứng tuyển
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