import { useState, useEffect } from "react";
import {
  useGetPortfolio,
  useUpdatePortfolio,
  useListTopics,
  useListProjects,
  getGetPortfolioQueryKey,
  getGetSessionQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Save,
  Loader2,
  Plus,
  X,
  GraduationCap,
  Users,
  Lightbulb,
  Star,
  BookOpen,
  Mail,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function InstructorPortfolio({ userId }: { userId: string }) {
  const { data: portfolio, isLoading } = useGetPortfolio(userId, {
    query: { enabled: !!userId, queryKey: getGetPortfolioQueryKey(userId) },
  });
  const { data: topicsData } = useListTopics();
  const { data: projects } = useListProjects();
  const queryClient = useQueryClient();

  const updateMutation = useUpdatePortfolio({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
        toast.success("Đã lưu hồ sơ thành công");
      },
      onError: () => toast.error("Có lỗi xảy ra khi lưu hồ sơ"),
    },
  });

  const [form, setForm] = useState({
    bio: "",
    publicVisible: false,
    title: "",
    department: "",
    yearsTeaching: 0,
    mentoringStatement: "",
    officeHours: "",
    contactEmail: "",
    expertise: [] as string[],
    focusDomains: [] as string[],
    availableSlots: 0,
  });
  const [newExp, setNewExp] = useState("");
  const [newDomain, setNewDomain] = useState("");

  useEffect(() => {
    if (portfolio) {
      const ip: any = (portfolio as any).instructorProfile || {};
      setForm({
        bio: portfolio.bio || "",
        publicVisible: portfolio.publicVisible || false,
        title: ip.title || "",
        department: ip.department || "",
        yearsTeaching: ip.yearsTeaching || 0,
        mentoringStatement: ip.mentoringStatement || "",
        officeHours: ip.officeHours || "",
        contactEmail: ip.contactEmail || "",
        expertise: ip.expertise || [],
        focusDomains: ip.focusDomains || [],
        availableSlots: ip.availableSlots || 0,
      });
    }
  }, [portfolio]);

  if (isLoading || !portfolio) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const ip: any = (portfolio as any).instructorProfile || {
    publications: [],
    expertise: [],
    focusDomains: [],
    mentoredTeamCount: 0,
    advisedTopicCount: 0,
  };

  const myTopics = (topicsData?.items || []).filter(
    (t: any) => t.source === "instructor" && (t.sourceLabel === portfolio.name || !t.sourceLabel),
  );
  const myProjects = (projects || []).filter((p: any) => p.instructorName === portfolio.name);

  const handleSave = () => {
    updateMutation.mutate({
      userId,
      data: {
        bio: form.bio,
        publicVisible: form.publicVisible,
        instructorProfile: {
          title: form.title,
          department: form.department,
          yearsTeaching: Number(form.yearsTeaching) || 0,
          mentoringStatement: form.mentoringStatement,
          officeHours: form.officeHours,
          contactEmail: form.contactEmail,
          expertise: form.expertise,
          focusDomains: form.focusDomains,
          availableSlots: Number(form.availableSlots) || 0,
          mentoredTeamCount: ip.mentoredTeamCount || 0,
          advisedTopicCount: ip.advisedTopicCount || 0,
          avgTeamRating: ip.avgTeamRating ?? null,
          publications: ip.publications || [],
        },
      } as any,
    });
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/session/me/avatar", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(userId) });
      toast.success("Đã cập nhật ảnh đại diện");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const addExpertise = () => {
    const v = newExp.trim();
    if (v && !form.expertise.includes(v)) {
      setForm({ ...form, expertise: [...form.expertise, v] });
      setNewExp("");
    }
  };
  const addDomain = () => {
    const v = newDomain.trim();
    if (v && !form.focusDomains.includes(v)) {
      setForm({ ...form, focusDomains: [...form.focusDomains, v] });
      setNewDomain("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hồ sơ giảng viên hướng dẫn</h1>
          <p className="text-muted-foreground mt-1">
            Hồ sơ của bạn giúp sinh viên hiểu định hướng và chọn nhóm phù hợp.
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Lưu thay đổi
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="relative mb-4 group">
                <Avatar className="w-24 h-24">
                  <img src={portfolio.avatarUrl || ''} className="object-cover w-full h-full" alt="Avatar" style={{ display: portfolio.avatarUrl ? 'block' : 'none' }} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {portfolio.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity disabled:cursor-not-allowed">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="text-xs font-semibold">Đổi ảnh</span>}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUploading} />
                </label>
              </div>
              <h2 className="text-xl font-bold">{portfolio.name}</h2>
              {(form.title || form.department) && (
                <p className="text-sm text-muted-foreground mt-1">
                  {[form.title, form.department].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="flex items-center gap-2 mt-4 w-full">
                <Switch
                  id="public-visible"
                  checked={form.publicVisible}
                  onCheckedChange={(c) => setForm({ ...form, publicVisible: c })}
                />
                <Label htmlFor="public-visible" className="cursor-pointer">
                  Hiển thị công khai cho sinh viên
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Số liệu hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Stat icon={<Users className="w-4 h-4" />} label="Nhóm đã hướng dẫn" value={ip.mentoredTeamCount ?? 0} />
              <Stat
                icon={<Lightbulb className="w-4 h-4" />}
                label="Đề tài đã đề xuất"
                value={ip.advisedTopicCount ?? 0}
              />
              <Stat
                icon={<Star className="w-4 h-4 text-amber-500" />}
                label="Đánh giá trung bình"
                value={ip.avgTeamRating != null ? `${ip.avgTeamRating.toFixed(1)} / 5` : "—"}
              />
              <Stat
                icon={<GraduationCap className="w-4 h-4" />}
                label="Số năm giảng dạy"
                value={form.yearsTeaching || "—"}
              />
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Còn nhận thêm
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {form.availableSlots} nhóm
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4" /> Lịch tiếp sinh viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.officeHours}
                onChange={(e) => setForm({ ...form, officeHours: e.target.value })}
                placeholder="VD: Thứ 3 & Thứ 5, 14:00 - 16:30 — Phòng 502, nhà B1"
                className="min-h-[80px] text-sm"
              />
              <div className="mt-3 space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email liên hệ
                </Label>
                <Input
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="email@edu.vn"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Học hàm / học vị</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="VD: Tiến sĩ, Phó Giáo sư"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số năm giảng dạy</Label>
                  <Input
                    type="number"
                    value={form.yearsTeaching}
                    onChange={(e) => setForm({ ...form, yearsTeaching: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Khoa / Bộ môn</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="VD: Khoa Công nghệ Thông tin"
                />
              </div>
              <div className="space-y-2">
                <Label>Giới thiệu ngắn</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Vài dòng giới thiệu định hướng và kinh nghiệm..."
                  className="h-24"
                />
              </div>
              <div className="space-y-2">
                <Label>Số nhóm còn nhận trong học kỳ này</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.availableSlots}
                  onChange={(e) => setForm({ ...form, availableSlots: Number(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Triết lý hướng dẫn</CardTitle>
              <CardDescription>
                Cho sinh viên biết bạn ưu tiên điều gì khi hướng dẫn đồ án — họ sẽ tự chọn nhóm phù hợp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.mentoringStatement}
                onChange={(e) => setForm({ ...form, mentoringStatement: e.target.value })}
                placeholder="VD: Tôi ưu tiên các nhóm có sản phẩm chạy được, có người dùng thật và có dữ liệu đo lường..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chuyên môn & Lĩnh vực quan tâm</CardTitle>
              <CardDescription>
                Sinh viên dùng các từ khoá này để tìm giảng viên phù hợp với đề tài của họ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-sm font-medium mb-2 block">Chuyên môn</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.expertise.map((s) => (
                    <Badge key={s} variant="secondary" className="px-3 py-1">
                      {s}
                      <X
                        className="w-3 h-3 ml-2 cursor-pointer hover:text-destructive"
                        onClick={() =>
                          setForm({ ...form, expertise: form.expertise.filter((x) => x !== s) })
                        }
                      />
                    </Badge>
                  ))}
                  {form.expertise.length === 0 && (
                    <span className="text-sm text-muted-foreground">Chưa có thông tin</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newExp}
                    onChange={(e) => setNewExp(e.target.value)}
                    placeholder="VD: Machine Learning"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
                  />
                  <Button type="button" onClick={addExpertise} variant="secondary">
                    <Plus className="w-4 h-4 mr-1" /> Thêm
                  </Button>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Lĩnh vực ứng dụng</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.focusDomains.map((s) => (
                    <Badge key={s} variant="outline" className="px-3 py-1">
                      {s}
                      <X
                        className="w-3 h-3 ml-2 cursor-pointer hover:text-destructive"
                        onClick={() =>
                          setForm({ ...form, focusDomains: form.focusDomains.filter((x) => x !== s) })
                        }
                      />
                    </Badge>
                  ))}
                  {form.focusDomains.length === 0 && (
                    <span className="text-sm text-muted-foreground">Chưa có thông tin</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="VD: Y tế thông minh"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDomain())}
                  />
                  <Button type="button" onClick={addDomain} variant="secondary">
                    <Plus className="w-4 h-4 mr-1" /> Thêm
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" /> Đề tài đang đề xuất
              </CardTitle>
              <CardDescription>Các đề tài bạn đã đăng để sinh viên đăng ký.</CardDescription>
            </CardHeader>
            <CardContent>
              {myTopics.length === 0 ? (
                <EmptyState text="Bạn chưa đề xuất đề tài nào trong học kỳ này" />
              ) : (
                <div className="space-y-2">
                  {myTopics.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="p-3 border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{t.domain}</span>
                        <span>·</span>
                        <span>Nhóm {t.teamSize} người</span>
                        <span>·</span>
                        <span className="capitalize">
                          {t.difficulty === "beginner"
                            ? "Cơ bản"
                            : t.difficulty === "intermediate"
                              ? "Trung bình"
                              : "Nâng cao"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Nhóm đang hướng dẫn
              </CardTitle>
              <CardDescription>Các nhóm sinh viên bạn phụ trách trong học kỳ này.</CardDescription>
            </CardHeader>
            <CardContent>
              {myProjects.length === 0 ? (
                <EmptyState text="Chưa có nhóm nào đang được bạn hướng dẫn" />
              ) : (
                <div className="space-y-2">
                  {myProjects.map((p: any) => (
                    <div key={p.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.topicTitle}</div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                        {p.memberCount} thành viên · {p.progress}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" /> Công bố tiêu biểu
              </CardTitle>
              <CardDescription>Các nghiên cứu, bài báo hoặc dự án nổi bật của bạn.</CardDescription>
            </CardHeader>
            <CardContent>
              {!ip.publications || ip.publications.length === 0 ? (
                <EmptyState text="Chưa có công bố nào được liệt kê" />
              ) : (
                <div className="space-y-3">
                  {ip.publications.map((pub: any) => (
                    <div key={pub.id} className="p-3 border-l-2 border-primary/40 bg-muted/30 rounded-r">
                      <div className="font-medium text-sm leading-snug">{pub.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {pub.venue} · {pub.year}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
      {text}
    </div>
  );
}
