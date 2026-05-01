import { useState, useEffect } from "react";
import {
  useGetPortfolio,
  useUpdatePortfolio,
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
  Building2,
  Globe,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  Award,
  Gift,
  Mail,
  Phone,
  CheckCircle2,
  Handshake,
} from "lucide-react";

export default function EnterprisePortfolio({ userId }: { userId: string }) {
  const { data: portfolio, isLoading } = useGetPortfolio(userId, {
    query: { enabled: !!userId, queryKey: getGetPortfolioQueryKey(userId) },
  });
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
    industry: "",
    size: "",
    foundedYear: 0,
    headquarters: "",
    website: "",
    about: "",
    partnerSince: 0,
    focusAreas: [] as string[],
    offeredBenefits: [] as string[],
    contactName: "",
    contactRole: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [newArea, setNewArea] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  useEffect(() => {
    if (portfolio) {
      const ep: any = (portfolio as any).enterpriseProfile || {};
      const cp: any = ep.contactPerson || {};
      setForm({
        bio: portfolio.bio || "",
        publicVisible: portfolio.publicVisible || false,
        industry: ep.industry || "",
        size: ep.size || "",
        foundedYear: ep.foundedYear || 0,
        headquarters: ep.headquarters || "",
        website: ep.website || "",
        about: ep.about || "",
        partnerSince: ep.partnerSince || 0,
        focusAreas: ep.focusAreas || [],
        offeredBenefits: ep.offeredBenefits || [],
        contactName: cp.name || "",
        contactRole: cp.role || "",
        contactEmail: cp.email || "",
        contactPhone: cp.phone || "",
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

  const ep: any = (portfolio as any).enterpriseProfile || {
    sponsoredBriefCount: 0,
    adoptedProjectCount: 0,
    placedStudentCount: 0,
  };

  const handleSave = () => {
    updateMutation.mutate({
      userId,
      data: {
        bio: form.bio,
        publicVisible: form.publicVisible,
        enterpriseProfile: {
          industry: form.industry,
          size: form.size,
          foundedYear: Number(form.foundedYear) || null,
          headquarters: form.headquarters,
          website: form.website,
          about: form.about,
          partnerSince: Number(form.partnerSince) || null,
          focusAreas: form.focusAreas,
          offeredBenefits: form.offeredBenefits,
          sponsoredBriefCount: ep.sponsoredBriefCount || 0,
          adoptedProjectCount: ep.adoptedProjectCount || 0,
          placedStudentCount: ep.placedStudentCount || 0,
          contactPerson: {
            name: form.contactName,
            role: form.contactRole,
            email: form.contactEmail,
            phone: form.contactPhone || null,
          },
        },
      } as any,
    });
  };

  const addArea = () => {
    const v = newArea.trim();
    if (v && !form.focusAreas.includes(v)) {
      setForm({ ...form, focusAreas: [...form.focusAreas, v] });
      setNewArea("");
    }
  };
  const addBenefit = () => {
    const v = newBenefit.trim();
    if (v && !form.offeredBenefits.includes(v)) {
      setForm({ ...form, offeredBenefits: [...form.offeredBenefits, v] });
      setNewBenefit("");
    }
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
      toast.success("Đã cập nhật logo");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hồ sơ doanh nghiệp đối tác</h1>
          <p className="text-muted-foreground mt-1">
            Hồ sơ này hiển thị cho sinh viên và giảng viên khi họ xem các đề bài bạn đăng.
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
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary/10 text-primary flex items-center justify-center">
                  {portfolio.avatarUrl ? (
                    <img src={portfolio.avatarUrl} className="object-cover w-full h-full" alt="Avatar" />
                  ) : (
                    <Building2 className="w-12 h-12" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity disabled:cursor-not-allowed">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="text-xs font-semibold">Đổi Logo</span>}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUploading} />
                </label>
              </div>
              <h2 className="text-xl font-bold">{portfolio.name}</h2>
              {form.industry && (
                <p className="text-sm text-muted-foreground mt-1">{form.industry}</p>
              )}
              <div className="flex items-center gap-2 mt-4 w-full justify-center">
                <Switch
                  id="public-visible"
                  checked={form.publicVisible}
                  onCheckedChange={(c) => setForm({ ...form, publicVisible: c })}
                />
                <Label htmlFor="public-visible" className="cursor-pointer">
                  Hiển thị công khai
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Đóng góp với cộng đồng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Stat
                icon={<Briefcase className="w-4 h-4" />}
                label="Đề bài đã đăng"
                value={ep.sponsoredBriefCount || 0}
              />
              <Stat
                icon={<Award className="w-4 h-4" />}
                label="Dự án đã bảo trợ"
                value={ep.adoptedProjectCount || 0}
              />
              <Stat
                icon={<Users className="w-4 h-4" />}
                label="Sinh viên đã tuyển"
                value={ep.placedStudentCount || 0}
              />
              {form.partnerSince ? (
                <div className="pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                  <Handshake className="w-3.5 h-3.5" />
                  Đối tác PROMATCH từ năm {form.partnerSince}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {form.headquarters && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <span>{form.headquarters}</span>
                </div>
              )}
              {form.size && (
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <span>{form.size}</span>
                </div>
              )}
              {form.foundedYear ? (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <span>Thành lập {form.foundedYear}</span>
                </div>
              ) : null}
              {form.website && (
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <a
                    href={form.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {form.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin doanh nghiệp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mô tả ngắn (tagline)</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Vài câu giới thiệu về công ty bạn..."
                  className="h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lĩnh vực</Label>
                  <Input
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    placeholder="VD: Công nghệ thông tin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quy mô</Label>
                  <Input
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    placeholder="VD: 1.000 - 5.000 nhân sự"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Năm thành lập</Label>
                  <Input
                    type="number"
                    value={form.foundedYear || ""}
                    onChange={(e) => setForm({ ...form, foundedYear: Number(e.target.value) })}
                    placeholder="VD: 2010"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Đối tác từ năm</Label>
                  <Input
                    type="number"
                    value={form.partnerSince || ""}
                    onChange={(e) => setForm({ ...form, partnerSince: Number(e.target.value) })}
                    placeholder="VD: 2022"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trụ sở</Label>
                  <Input
                    value={form.headquarters}
                    onChange={(e) => setForm({ ...form, headquarters: e.target.value })}
                    placeholder="VD: Hà Nội, Việt Nam"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Giới thiệu chi tiết</Label>
                <Textarea
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  placeholder="Mô tả về sản phẩm, dịch vụ và cam kết hợp tác với sinh viên..."
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lĩnh vực muốn hợp tác</CardTitle>
              <CardDescription>
                Hệ thống dùng các từ khoá này để gợi ý đúng nhóm sinh viên cho các đề bài bạn đăng.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {form.focusAreas.map((s) => (
                  <Badge key={s} variant="secondary" className="px-3 py-1">
                    {s}
                    <X
                      className="w-3 h-3 ml-2 cursor-pointer hover:text-destructive"
                      onClick={() =>
                        setForm({ ...form, focusAreas: form.focusAreas.filter((x) => x !== s) })
                      }
                    />
                  </Badge>
                ))}
                {form.focusAreas.length === 0 && (
                  <span className="text-sm text-muted-foreground">Chưa có thông tin</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="VD: AI & Generative AI"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArea())}
                />
                <Button type="button" onClick={addArea} variant="secondary">
                  <Plus className="w-4 h-4 mr-1" /> Thêm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" /> Quyền lợi cho nhóm sinh viên
              </CardTitle>
              <CardDescription>
                Liệt kê những gì bạn cam kết hỗ trợ — đây là yếu tố quan trọng để sinh viên chọn nhận đề bài.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {form.offeredBenefits.map((b) => (
                  <div
                    key={b}
                    className="flex items-center justify-between p-3 border rounded-lg group hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{b}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm({
                          ...form,
                          offeredBenefits: form.offeredBenefits.filter((x) => x !== b),
                        })
                      }
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {form.offeredBenefits.length === 0 && (
                  <div className="text-center py-6 border border-dashed rounded-lg text-sm text-muted-foreground">
                    Chưa có quyền lợi nào được liệt kê
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="VD: Mentor 1-1 từ kỹ sư cấp cao"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" onClick={addBenefit}>
                  <Plus className="w-4 h-4 mr-1" /> Thêm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đầu mối liên hệ</CardTitle>
              <CardDescription>Người sinh viên / giảng viên có thể liên lạc khi muốn hợp tác.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Họ và tên</Label>
                  <Input
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="VD: Nguyễn Thanh Bình"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vai trò / Chức vụ</Label>
                  <Input
                    value={form.contactRole}
                    onChange={(e) => setForm({ ...form, contactRole: e.target.value })}
                    placeholder="VD: Head of University Relations"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Label>
                  <Input
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="email@congty.vn"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Số điện thoại
                  </Label>
                  <Input
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="VD: +84 24 ..."
                  />
                </div>
              </div>
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
