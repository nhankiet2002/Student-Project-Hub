import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { Mail, Calendar, ExternalLink, MessageSquare, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Application {
  id: string;
  callId: string;
  applicantId: string;
  applicantName: string;
  applicantAvatar: string | null;
  message: string;
  status: string;
  appliedAt: string;
  call: {
    title: string;
  };
  applicant: {
    email: string;
    organization: string | null;
    Portfolio: {
      bio: string;
      major: string | null;
      year: number | null;
      skills: any[];
    } | null;
  };
}

export default function EnterpriseApplications() {
  const [, setLocation] = useLocation();
  
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["enterprise", "applications"],
    queryFn: () => customFetch("/api/enterprise/applications"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Ứng tuyển đã nhận</h1>
        <p className="text-muted-foreground">
          Quản lý các hồ sơ sinh viên ứng tuyển vào các dự án/đặt hàng của doanh nghiệp bạn.
        </p>
      </div>

      {(!applications || applications.length === 0) ? (
        <Card className="border-dashed flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Chưa có ứng tuyển nào</CardTitle>
          <CardDescription className="max-w-xs mt-2">
            Khi sinh viên ứng tuyển vào các đặt hàng của bạn, hồ sơ của họ sẽ xuất hiện tại đây.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((app) => (
            <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <Avatar className="h-14 w-14 border-2 border-primary/10 shadow-sm">
                        <AvatarImage src={app.applicantAvatar || ''} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xl">
                          {app.applicantName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{app.applicantName}</h3>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                            {app.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {app.applicant.email}
                        </p>
                        {app.applicant.Portfolio?.major && (
                          <p className="text-sm font-medium">
                            {app.applicant.Portfolio.major} • Năm {app.applicant.Portfolio.year}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground flex items-center justify-end gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(app.appliedAt), "HH:mm, dd/MM/yyyy", { locale: vi })}
                      </div>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                        {app.call.title}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <p className="text-sm italic text-foreground/80">
                      &quot;{app.message || "Không có lời nhắn đi kèm."}&quot;
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {app.applicant.Portfolio?.skills?.slice(0, 6).map((s: any) => (
                      <Badge key={s.name} variant="secondary" className="text-[10px] py-0 h-5">
                        {s.name}
                      </Badge>
                    ))}
                    {(app.applicant.Portfolio?.skills?.length || 0) > 6 && (
                      <Badge variant="outline" className="text-[10px] py-0 h-5">
                        +{(app.applicant.Portfolio?.skills?.length || 0) - 6}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-muted/10 border-t md:border-t-0 md:border-l p-6 flex flex-col gap-3 justify-center min-w-[200px]">
                  <Button 
                    className="w-full justify-between" 
                    onClick={() => setLocation(`/portfolio/public/${app.applicantId}`)}
                  >
                    Xem CV / Hồ sơ
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    Phỏng vấn / Chat
                    <MessageSquare className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground h-8">
                    Đánh dấu: Đang xem xét
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
