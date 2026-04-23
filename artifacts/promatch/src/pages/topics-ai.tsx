import { useState } from "react";
import { useAiGenerateTopics, useCreateTopic, getListTopicsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, Check } from "lucide-react";

export default function TopicsAI() {
  const [interestsStr, setInterestsStr] = useState("");
  const [domain, setDomain] = useState("");
  const [savedTopics, setSavedTopics] = useState<string[]>([]);
  
  const queryClient = useQueryClient();
  
  const generateMutation = useAiGenerateTopics({
    mutation: {
      onError: () => {
        toast.error("Đã hết lượt sinh đề tài (Quota exhausted). Vui lòng thử lại sau.");
      }
    }
  });

  const createTopicMutation = useCreateTopic({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey() });
        toast.success("Đã lưu đề tài thành công!");
        setSavedTopics([...savedTopics, data.id]);
      },
      onError: () => {
        toast.error("Lỗi khi lưu đề tài.");
      }
    }
  });

  const handleGenerate = () => {
    if (!domain) {
      toast.error("Vui lòng chọn lĩnh vực.");
      return;
    }
    const interests = interestsStr.split(",").map(s => s.trim()).filter(Boolean);
    generateMutation.mutate({ data: { interests, domain } });
  };

  const handleSaveTopic = (topic: any) => {
    createTopicMutation.mutate({
      data: {
        title: topic.title,
        problemDescription: topic.problemDescription,
        objectives: topic.objectives,
        technologies: topic.technologies,
        domain: topic.domain,
        difficulty: topic.difficulty,
        requiredSkills: topic.requiredSkills,
        teamSize: topic.teamSize || 3
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sinh đề tài bằng AI</h1>
        <p className="text-muted-foreground mt-1">Trợ lý AI sẽ giúp bạn tạo ra các đề tài phù hợp với sở thích.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nhập thông tin</CardTitle>
          <CardDescription>Cung cấp các từ khóa để AI có thể gợi ý đề tài tốt nhất.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Lĩnh vực <span className="text-destructive">*</span></label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lĩnh vực" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AI/ML">Trí tuệ nhân tạo / Học máy</SelectItem>
                <SelectItem value="Web">Phát triển Web</SelectItem>
                <SelectItem value="Mobile">Phát triển Ứng dụng Di động</SelectItem>
                <SelectItem value="IoT">Internet of Things</SelectItem>
                <SelectItem value="Blockchain">Blockchain</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Sở thích / Từ khóa (phân cách bằng dấu phẩy)</label>
            <Textarea 
              placeholder="VD: Nhận diện khuôn mặt, y tế, chat bot..." 
              value={interestsStr}
              onChange={(e) => setInterestsStr(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={generateMutation.isPending || !domain}
            className="w-full sm:w-auto"
          >
            {generateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Sinh đề tài bằng AI
          </Button>

          {generateMutation.isSuccess && generateMutation.data?.remainingQuota !== undefined && (
            <div className="text-sm text-muted-foreground mt-2">
              Lượt sinh còn lại: <span className="font-semibold text-foreground">{generateMutation.data.remainingQuota}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {generateMutation.isSuccess && generateMutation.data?.items && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold">Kết quả ({generateMutation.data.items.length})</h2>
          
          <div className="grid gap-4">
            {generateMutation.data.items.map((topic, idx) => (
              <Card key={topic.id || idx}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{topic.title}</CardTitle>
                    <Badge variant={topic.difficulty === 'advanced' ? 'destructive' : topic.difficulty === 'intermediate' ? 'default' : 'secondary'}>
                      {topic.difficulty}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{topic.problemDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {topic.technologies?.map((tech: string) => (
                      <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Nhóm: {topic.teamSize} người | Lĩnh vực: {topic.domain}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSaveTopic(topic)}
                    disabled={savedTopics.includes(topic.id) || createTopicMutation.isPending}
                  >
                    {savedTopics.includes(topic.id) ? (
                      <><Check className="w-4 h-4 mr-2 text-green-500" /> Đã lưu</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> Lưu vào danh sách đề tài</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}