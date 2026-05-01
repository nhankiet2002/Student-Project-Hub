import { useState, useEffect } from "react";
import {
  useGetSession,
  useUpdateProfile,
  useGetPortfolio,
  useUpdatePortfolio,
  getGetSessionQueryKey,
  getGetPortfolioQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, X, Check, Loader2, User } from "lucide-react";

const roleLabels: Record<string, string> = {
  student: "Sinh viên",
  instructor: "Giảng viên",
  enterprise: "Doanh nghiệp",
  alumni: "Cựu sinh viên",
  admin: "Quản trị viên",
};

export default function Profile() {
  const { data: session, isLoading: sessionLoading } = useGetSession();
  const userId = session?.id ?? "";
  const { data: portfolio, isLoading: portfolioLoading } = useGetPortfolio(userId, {
    query: { enabled: !!userId, queryKey: getGetPortfolioQueryKey(userId) },
  });

  const queryClient = useQueryClient();

  const updateProfileMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(userId) });
        toast.success("Đã cập nhật thông tin cá nhân");
        setEditingName(false);
        setEditingAvatar(false);
      },
      onError: () => {
        toast.error("Cập nhật thất bại. Vui lòng thử lại.");
      },
    },
  });

  const updatePortfolioMutation = useUpdatePortfolio({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(userId) });
        toast.success("Đã cập nhật tiểu sử");
        setEditingBio(false);
      },
      onError: () => {
        toast.error("Cập nhật thất bại. Vui lòng thử lại.");
      },
    },
  });

  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);

  const [nameValue, setNameValue] = useState("");
  const [bioValue, setBioValue] = useState("");
  const [avatarValue, setAvatarValue] = useState("");

  useEffect(() => {
    if (session) setNameValue(session.name);
  }, [session]);

  useEffect(() => {
    if (portfolio !== undefined) {
      setBioValue(portfolio.bio ?? "");
    }
  }, [portfolio]);

  useEffect(() => {
    if (session || portfolio) {
      setAvatarValue(session?.avatarUrl || portfolio?.avatarUrl || "");
    }
  }, [session, portfolio]);

  const handleSaveName = () => {
    if (!nameValue.trim()) return;
    updateProfileMutation.mutate({ data: { name: nameValue.trim() } });
  };

  const handleSaveBio = () => {
    if (!portfolio) return;
    updatePortfolioMutation.mutate({
      userId,
      data: {
        bio: bioValue,
        skills: portfolio.skills,
        interests: portfolio.interests,
        publicVisible: portfolio.publicVisible,
      },
    });
  };

  const handleSaveAvatar = () => {
    updateProfileMutation.mutate({ data: { avatarUrl: avatarValue || null } });
  };

  const isLoading = sessionLoading || portfolioLoading;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!session) return null;

  const displayAvatar = session.avatarUrl || portfolio?.avatarUrl || "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground mt-1">Xem và chỉnh sửa thông tin cá nhân của bạn.</p>
      </div>

      {/* Avatar & Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Ảnh đại diện</CardTitle>
          <CardDescription>URL ảnh đại diện hiển thị trên hồ sơ của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-5">
            <Avatar className="w-20 h-20 ring-2 ring-border">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {session.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{session.name}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {roleLabels[session.role] ?? session.role}
              </Badge>
            </div>
          </div>

          {editingAvatar ? (
            <div className="space-y-3">
              <Label htmlFor="avatarUrl">URL ảnh đại diện</Label>
              <Input
                id="avatarUrl"
                value={avatarValue}
                onChange={(e) => setAvatarValue(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveAvatar}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  Lưu
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAvatarValue(session.avatarUrl || portfolio?.avatarUrl || "");
                    setEditingAvatar(false);
                  }}
                  disabled={updateProfileMutation.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Huỷ
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditingAvatar(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Đổi ảnh đại diện
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Chỉnh sửa tên hiển thị và tiểu sử của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label>Họ và tên</Label>
            {editingName ? (
              <div className="space-y-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={updateProfileMutation.isPending || !nameValue.trim()}
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Lưu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNameValue(session.name);
                      setEditingName(false);
                    }}
                    disabled={updateProfileMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Huỷ
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex-1 text-sm py-2 px-3 rounded-md border bg-background">
                  {session.name}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setEditingName(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={session.email} readOnly disabled className="bg-muted/50" />
          </div>

          {/* Role (read-only) */}
          <div className="space-y-2">
            <Label>Vai trò</Label>
            <Input
              value={roleLabels[session.role] ?? session.role}
              readOnly
              disabled
              className="bg-muted/50"
            />
          </div>

          {session.organization && (
            <div className="space-y-2">
              <Label>Tổ chức / Đơn vị</Label>
              <Input value={session.organization} readOnly disabled className="bg-muted/50" />
            </div>
          )}

          <Separator />

          {/* Bio */}
          <div className="space-y-2">
            <Label>Tiểu sử</Label>
            {editingBio ? (
              <div className="space-y-2">
                <Textarea
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value)}
                  placeholder="Viết vài dòng giới thiệu về bản thân..."
                  rows={4}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveBio}
                    disabled={updatePortfolioMutation.isPending}
                  >
                    {updatePortfolioMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Lưu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBioValue(portfolio?.bio ?? "");
                      setEditingBio(false);
                    }}
                    disabled={updatePortfolioMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Huỷ
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-1 text-sm py-2 px-3 rounded-md border bg-background min-h-[60px] whitespace-pre-wrap">
                  {portfolio?.bio ? (
                    portfolio.bio
                  ) : (
                    <span className="text-muted-foreground italic">Chưa có tiểu sử.</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingBio(true)}
                  className="mt-0.5 shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account meta */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 shrink-0" />
            <span>ID tài khoản: <span className="font-mono text-foreground">{session.id}</span></span>
          </div>
          {session.createdAt && (
            <div className="flex items-center gap-2">
              <span>
                Tham gia từ:{" "}
                <span className="text-foreground">
                  {new Date(session.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
