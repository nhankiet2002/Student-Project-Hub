import { useState, useEffect } from "react";
import { useGetSession, useGetPortfolio, useUpdatePortfolio, useListSkills, getGetPortfolioQueryKey, getGetSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Save } from "lucide-react";

export default function Portfolio() {
  const { data: session } = useGetSession();
  const userId = session?.id || "";
  const { data: portfolio, isLoading } = useGetPortfolio(userId, { query: { enabled: !!userId, queryKey: getGetPortfolioQueryKey(userId) } });
  const { data: skills } = useListSkills();
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
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={portfolio.avatarUrl || ''} />
                <AvatarFallback className="text-2xl">{portfolio.name.charAt(0)}</AvatarFallback>
              </Avatar>
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
        </div>
      </div>
    </div>
  );
}