import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetSession, useGetPortfolio, useUpdatePortfolio, useListSkills, useListProjects, getGetPortfolioQueryKey, getGetSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Save, FolderKanban, Trophy, Calendar, Star, ArrowRight } from "lucide-react";
import InstructorPortfolio from "./portfolio-instructor";
import EnterprisePortfolio from "./portfolio-enterprise";

export default function Portfolio() {
  const { data: session } = useGetSession();
  const userId = session?.id || "";
  const role = session?.role;
  if (role === "instructor") return <InstructorPortfolio userId={userId} />;
  if (role === "enterprise") return <EnterprisePortfolio userId={userId} />;
  return <StudentPortfolio userId={userId} />;
}

function StudentPortfolio({ userId }: { userId: string }) {
  const { data: portfolio, isLoading } = useGetPortfolio(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioQueryKey(userId) } });
  const { data: skills } = useListSkills();
  const { data: activeProjects } = useListProjects();
  const queryClient = useQueryClient();

  const updateMutation = useUpdatePortfolio({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
        toast.success('Đã lưu hồ sơ thành công');
      },
      onError: () => {
        toast.error('Có lỗi xảy ra khi lưu hồ sơ');
      }
    }
  });

  const [formData, setFormData] = useState<any>({
    bio: "",
    major: "",
    year: new Date().getFullYear(),
    interests: [],
    skills: [],
    publicVisible: false
  });

  const [newInterest, setNewInterest] = useState("");
  const [newSkillId, setNewSkillId] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  useEffect(() => {
    if (portfolio) {
      setFormData({
        bio: portfolio.bio || "",
        major: portfolio.major || "",
        year: portfolio.year || new Date().getFullYear(),
        interests: portfolio.interests || [],
        skills: portfolio.skills || [],
        publicVisible: portfolio.publicVisible || false
      });
    }
  }, [portfolio]);

  const [isUploading, setIsUploading] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!portfolio) {
    return <div className="text-center py-12">Không tìm thấy hồ sơ</div>;
  }

  const handleSave = () => {
    updateMutation.mutate({
      userId,
      data: {
        bio: formData.bio,
        major: formData.major,
        year: Number(formData.year),
        interests: formData.interests,
        skills: formData.skills,
        publicVisible: formData.publicVisible
      }
    });
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({ ...formData, interests: [...formData.interests, newInterest.trim()] });
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setFormData({ ...formData, interests: formData.interests.filter((i: string) => i !== interest) });
  };

  const addSkill = () => {
    if (newSkillId && newSkillLevel) {
      const skillObj = skills?.find(s => s.id === newSkillId);
      if (skillObj && !formData.skills.find((s: any) => s.skillId === newSkillId)) {
        setFormData({
          ...formData,
          skills: [...formData.skills, { skillId: newSkillId, name: skillObj.name, level: newSkillLevel }]
        });
        setNewSkillId("");
      }
    }
  };

  const removeSkill = (skillId: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s: any) => s.skillId !== skillId) });
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hồ sơ năng lực</h1>
          <p className="text-muted-foreground mt-1">Cập nhật thông tin để thu hút nhà tuyển dụng và đồng đội.</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu thay đổi
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="relative mb-4 group">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={portfolio.avatarUrl || ''} />
                  <AvatarFallback className="text-2xl">{portfolio.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity disabled:cursor-not-allowed">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="text-xs font-semibold">Đổi ảnh</span>}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUploading} />
                </label>
              </div>
              <h2 className="text-xl font-bold">{portfolio.name}</h2>
              <div className="flex items-center gap-2 mt-4 w-full">
                <Switch 
                  id="public-visible" 
                  checked={formData.publicVisible} 
                  onCheckedChange={(c) => setFormData({ ...formData, publicVisible: c })} 
                />
                <Label htmlFor="public-visible" className="cursor-pointer">Hiển thị công khai</Label>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dự án hoàn thành</span>
                <span className="font-bold">{portfolio.completedProjects}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Điểm đóng góp</span>
                <span className="font-bold">{portfolio.contributionScore}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Giới thiệu bản thân</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                  placeholder="Viết vài dòng giới thiệu về bản thân..."
                  className="h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chuyên ngành</Label>
                  <Input 
                    value={formData.major} 
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })} 
                    placeholder="VD: Khoa học máy tính"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Khóa học (Năm)</Label>
                  <Input 
                    type="number" 
                    value={formData.year} 
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lĩnh vực quan tâm</CardTitle>
              <CardDescription>Thêm các chủ đề bạn hứng thú để hệ thống gợi ý tốt hơn.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.interests.map((interest: string) => (
                  <Badge key={interest} variant="secondary" className="px-3 py-1">
                    {interest}
                    <X className="w-3 h-3 ml-2 cursor-pointer hover:text-destructive" onClick={() => removeInterest(interest)} />
                  </Badge>
                ))}
                {formData.interests.length === 0 && <span className="text-sm text-muted-foreground">Chưa có thông tin</span>}
              </div>
              <div className="flex gap-2">
                <Input 
                  value={newInterest} 
                  onChange={(e) => setNewInterest(e.target.value)} 
                  placeholder="VD: Trí tuệ nhân tạo..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                />
                <Button type="button" onClick={addInterest} variant="secondary">Thêm</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kỹ năng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                {formData.skills.map((skill: any) => (
                  <div key={skill.skillId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">Mức độ: {
                        skill.level === 'beginner' ? 'Cơ bản' : 
                        skill.level === 'intermediate' ? 'Trung bình' : 'Nâng cao'
                      }</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeSkill(skill.skillId)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {formData.skills.length === 0 && <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">Chưa có kỹ năng nào</div>}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={newSkillId} onValueChange={setNewSkillId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Chọn kỹ năng" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills?.map(s => (
                      <SelectItem key={s.id} value={s.id} disabled={formData.skills.some((fs: any) => fs.skillId === s.id)}>
                        {s.name} <span className="text-muted-foreground ml-2">({s.domain})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newSkillLevel} onValueChange={(val: any) => setNewSkillLevel(val)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Cơ bản</SelectItem>
                    <SelectItem value="intermediate">Trung bình</SelectItem>
                    <SelectItem value="advanced">Nâng cao</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addSkill}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-primary" />
                    Dự án đang thực hiện
                  </CardTitle>
                  <CardDescription>Các dự án bạn đang là thành viên trong học kỳ này.</CardDescription>
                </div>
                <Badge variant="secondary">{activeProjects?.length ?? 0}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!activeProjects || activeProjects.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground">
                  <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <div className="text-sm">Chưa tham gia dự án nào trong học kỳ này</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeProjects.map((p) => {
                    const statusLabel: Record<string, string> = {
                      planning: "Đang lên kế hoạch",
                      in_progress: "Đang thực hiện",
                      review: "Đang review",
                      completed: "Hoàn thành",
                      at_risk: "Có nguy cơ chậm",
                    };
                    const statusColor: Record<string, string> = {
                      planning: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
                      in_progress: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
                      review: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                      completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      at_risk: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
                    };
                    return (
                      <Link key={p.id} href={`/projects/${p.id}`}>
                        <div className="group p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold truncate group-hover:text-primary transition-colors">{p.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.topicTitle}</div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor[p.status] || "bg-muted"}`}>
                              {statusLabel[p.status] || p.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <Progress value={p.progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{p.progress}%</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Hạn {new Date(p.dueDate).toLocaleDateString("vi-VN")}</span>
                            <span>·</span>
                            <span>{p.completedMilestones}/{p.milestoneCount} mốc</span>
                            <span>·</span>
                            <span>{p.memberCount} thành viên</span>
                            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Kinh nghiệm dự án
                  </CardTitle>
                  <CardDescription>Những dự án bạn đã hoàn thành — phần quan trọng để gây ấn tượng với nhà tuyển dụng.</CardDescription>
                </div>
                <Badge variant="secondary">{(portfolio as any).pastProjects?.length ?? 0}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!((portfolio as any).pastProjects) || (portfolio as any).pastProjects.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <div className="text-sm">Chưa có kinh nghiệm dự án nào được ghi nhận</div>
                </div>
              ) : (
                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {((portfolio as any).pastProjects as any[]).map((pp) => (
                    <div key={pp.id} className="relative">
                      <span className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full bg-primary border-4 border-background" />
                      <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="font-semibold">{pp.title}</div>
                          {pp.rating != null && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {pp.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                          <span className="font-medium text-foreground">{pp.role}</span>
                          <span>·</span>
                          <span>{pp.semester || pp.year}</span>
                          {pp.contributionPct != null && (
                            <>
                              <span>·</span>
                              <span>Đóng góp {pp.contributionPct}%</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-2.5">{pp.summary}</p>
                        <div className="flex flex-wrap gap-1">
                          {(pp.technologies as string[]).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] font-normal">{t}</Badge>
                          ))}
                        </div>
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