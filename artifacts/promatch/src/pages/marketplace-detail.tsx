import { useGetCall, useApplyToCall, getGetCallQueryKey, getListCallsQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Calendar, Users, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";

export default function MarketplaceDetail() {
  const { callId } = useParams<{ callId: string }>();
  const { data: call, isLoading } = useGetCall(callId || "", { query: { enabled: !!callId, queryKey: getGetCallQueryKey(callId || "") } });
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const applyMutation = useApplyToCall({
    mutation: {
      onSuccess: () => {
        toast.success("Đã gửi đơn ứng tuyển thành công!");
        setMessage("");
        queryClient.invalidateQueries({ queryKey: getGetCallQueryKey(callId || "") });
        queryClient.invalidateQueries({ queryKey: getListCallsQueryKey() });
      },
      onError: () => {
        toast.error("Có lỗi xảy ra khi ứng tuyển.");
      }
    }
  });

  const handleApply = () => {
    applyMutation.mutate({ callId: callId || "", data: { message } });
  };

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

  if (!call) return <div>Không tìm thấy thông tin đặt hàng.</div>;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-sm py-1">
              <Briefcase className="w-4 h-4" />
              {call.enterpriseName}
            </Badge>
            <Badge variant={call.status === 'published' ? 'default' : 'secondary'} className="text-sm py-1">
              {call.status === 'published' ? 'Đang mở' : 'Đã đóng'}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{call.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Đăng ngày {format(new Date(call.postedAt), "dd/MM/yyyy")}
            </div>
            {call.deadline && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Hạn chót: {formatDistanceToNow(new Date(call.deadline), { locale: vi, addSuffix: true })}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {call.applicationCount} lượt ứng tuyển
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mô tả bài toán</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed">{call.problemDescription}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {call.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {call.skillTags && call.skillTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Kỹ năng cần thiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {call.skillTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Thông tin bổ sung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Lộ trình dự kiến</h4>
              <p className="font-medium">{call.timeline}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Ngân sách / Hỗ trợ
              </h4>
              <p className="font-medium">{call.budget || "Thỏa thuận"}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Quyền lợi</h4>
              <p className="text-sm whitespace-pre-wrap">{call.benefits}</p>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h4 className="font-semibold">Ứng tuyển ngay</h4>
              <Textarea 
                placeholder="Giới thiệu ngắn về nhóm của bạn và lý do phù hợp..." 
                className="min-h-[120px]"
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={call.status !== 'published'}
              />
              <Button 
                className="w-full" 
                onClick={handleApply}
                disabled={applyMutation.isPending || call.status !== 'published' || !message.trim()}
              >
                {applyMutation.isPending ? "Đang gửi..." : "Ứng tuyển"}
              </Button>
              {call.status !== 'published' && (
                <p className="text-xs text-center text-destructive">Đơn đặt hàng này đã đóng.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}