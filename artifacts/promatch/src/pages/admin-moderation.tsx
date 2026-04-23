import { useState } from "react";
import { useListModeration, useResolveModeration, getListModerationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, Check, X, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function AdminModeration() {
  const { data: items, isLoading } = useListModeration();
  const queryClient = useQueryClient();

  const resolveMutation = useResolveModeration({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListModerationQueryKey() });
        toast.success("Đã xử lý nội dung vi phạm");
      }
    }
  });

  const handleResolve = (id: string, action: "approve" | "delete" | "hide") => {
    resolveMutation.mutate({ reportId: id, data: { action } });
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'topic': return "Đề tài";
      case 'project': return "Dự án";
      case 'comment': return "Bình luận";
      case 'call': return "Đặt hàng";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kiểm duyệt nội dung</h1>
        <p className="text-muted-foreground mt-1">Xử lý các báo cáo vi phạm từ cộng đồng.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Nội dung chờ xử lý
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nội dung</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Lý do báo cáo</TableHead>
                <TableHead>Người báo cáo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : !items || items.filter(i => i.status === 'pending').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Không có nội dung nào cần kiểm duyệt.</TableCell>
                </TableRow>
              ) : (
                items.filter(i => i.status === 'pending').map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-[300px]">
                      <div className="font-medium truncate" title={item.contentTitle}>{item.contentTitle}</div>
                      {item.excerpt && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.excerpt}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getContentTypeLabel(item.contentType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-destructive">{item.reason}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.reportedBy}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.reportedAt), { locale: vi, addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleResolve(item.id, "approve")}
                          disabled={resolveMutation.isPending}
                          title="Bỏ qua (Giữ nội dung)"
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleResolve(item.id, "hide")}
                          disabled={resolveMutation.isPending}
                          title="Ẩn nội dung"
                        >
                          <EyeOff className="w-4 h-4 text-amber-500" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleResolve(item.id, "delete")}
                          disabled={resolveMutation.isPending}
                          title="Xóa nội dung"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}