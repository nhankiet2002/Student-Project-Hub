import { useState, useEffect } from "react";
import { 
  useListTopics, 
  ListTopicsParams, 
  useAiGenerateTopics, 
  useCreateTopic, 
  getListTopicsQueryKey,
  useGetSession,
  useGetPortfolio
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Search, Sparkles, Loader2, Save, Check, Filter } from "lucide-react";

export default function TopicDiscovery() {
  const { data: session } = useGetSession();
  const userId = session?.id || "";
  const { data: portfolio } = useGetPortfolio(userId, { query: { enabled: !!userId } });
  
  const [activeTab, setActiveTab] = useState("all");
  const [params, setParams] = useState<ListTopicsParams>({ sort: "recent" });
  const { data: topicsData, isLoading: isLoadingTopics } = useListTopics(params);

  // AI State
  const [interestsStr, setInterestsStr] = useState("");
  const [domain, setDomain] = useState("");
  const [savedTopics, setSavedTopics] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  // Pre-fill AI interests from portfolio
  useEffect(() => {
    if (portfolio) {
      if (portfolio.interests && portfolio.interests.length > 0) {
        setInterestsStr(portfolio.interests.join(", "));
      }
      if (portfolio.major) {
        // Simple mapping or just use as keyword
        if (portfolio.major.toLowerCase().includes("ai") || portfolio.major.toLowerCase().includes("trí tuệ")) setDomain("AI/ML");
        else if (portfolio.major.toLowerCase().includes("web")) setDomain("Web");
        else if (portfolio.major.toLowerCase().includes("di động") || portfolio.major.toLowerCase().includes("mobile")) setDomain("Mobile");
      }
    }
  }, [portfolio]);

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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Khám phá đề tài</h1>
          <p className="text-muted-foreground mt-1">Tìm kiếm đề tài truyền thống hoặc sử dụng AI để gợi ý theo năng lực.</p>
        </div>
        
        {session?.role === "student" && (
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            AI Ready
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
          <TabsTrigger value="all">Tất cả đề tài</TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Gợi ý AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm đề tài theo tiêu đề, từ khóa..." 
                className="pl-10 h-11"
                onChange={(e) => setParams({ ...params, q: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={params.domain || "all"} onValueChange={(val) => setParams({ ...params, domain: val === "all" ? undefined : val })}>
                <SelectTrigger className="w-[160px] h-11">
                  <SelectValue placeholder="Lĩnh vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                  <SelectItem value="AI/ML">AI/ML</SelectItem>
                  <SelectItem value="Web">Web Dev</SelectItem>
                  <SelectItem value="Mobile">Mobile App</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={params.difficulty || "all"} onValueChange={(val) => setParams({ ...params, difficulty: val === "all" ? undefined : val })}>
                <SelectTrigger className="w-[140px] h-11">
                  <SelectValue placeholder="Độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mọi độ khó</SelectItem>
                  <SelectItem value="beginner">Cơ bản</SelectItem>
                  <SelectItem value="intermediate">Trung bình</SelectItem>
                  <SelectItem value="advanced">Nâng cao</SelectItem>
                </SelectContent>
              </Select>

              <Select value={params.sort} onValueChange={(val: any) => setParams({ ...params, sort: val })}>
                <SelectTrigger className="w-[160px] h-11">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Sắp xếp" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mới nhất</SelectItem>
                  <SelectItem value="popular">Phổ biến nhất</SelectItem>
                  <SelectItem value="score">Điểm cao nhất</SelectItem>
                  <SelectItem value="relevance">Phù hợp nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingTopics ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : topicsData?.items?.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                <Search className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-semibold">Không tìm thấy đề tài</h3>
                <p className="text-muted-foreground">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
              </div>
            ) : (
              topicsData?.items?.map((topic) => (
                <Link key={topic.id} href={`/topics/${topic.id}`}>
                  <Card className="h-full flex flex-col hover:shadow-lg transition-all border-border/50 group cursor-pointer relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <Badge variant="outline" className="bg-background/50 font-medium">
                          {topic.sourceLabel || topic.source}
                        </Badge>
                        <Badge 
                          className={
                            topic.difficulty === 'advanced' ? 'bg-red-500/10 text-red-600 border-red-200' : 
                            topic.difficulty === 'intermediate' ? 'bg-blue-500/10 text-blue-600 border-blue-200' : 
                            'bg-slate-500/10 text-slate-600 border-slate-200'
                          }
                        >
                          {topic.difficulty === 'advanced' ? 'Nâng cao' : topic.difficulty === 'intermediate' ? 'Trung bình' : 'Cơ bản'}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {topic.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{topic.domain}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                        {topic.problemDescription || "Không có mô tả chi tiết cho đề tài này."}
                      </p>
                      
                      {topic.completeness !== undefined && (
                        <div className="space-y-1.5 mt-auto">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-muted-foreground uppercase tracking-tight">Độ hoàn thiện</span>
                            <span className="text-primary">{topic.completeness}%</span>
                          </div>
                          <Progress value={topic.completeness} className="h-1.5" />
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-4 border-t border-border/40 bg-muted/10">
                      <div className="flex flex-wrap gap-1">
                        {topic.requiredSkills?.slice(0, 3).map((skill, i) => (
                          <span key={i} className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">
                            {skill}
                          </span>
                        ))}
                        {(topic.requiredSkills?.length || 0) > 3 && (
                          <span className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">
                            +{(topic.requiredSkills?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-background to-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Sinh đề tài thông minh</CardTitle>
                    <CardDescription>Trợ lý AI sẽ dựa trên hồ sơ và sở thích của bạn để gợi ý đề tài tối ưu.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      Lĩnh vực quan tâm <span className="text-destructive">*</span>
                    </label>
                    <Select value={domain} onValueChange={setDomain}>
                      <SelectTrigger className="h-11">
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
                    <label className="text-sm font-semibold">Sở thích / Từ khóa mở rộng</label>
                    <Input 
                      placeholder="VD: Y tế, Giáo dục, Chatbot, ..." 
                      value={interestsStr}
                      onChange={(e) => setInterestsStr(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={handleGenerate} 
                      disabled={generateMutation.isPending || !domain}
                      size="lg"
                      className="px-8 shadow-md hover:shadow-lg transition-all"
                    >
                      {generateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Sinh đề tài ngay
                    </Button>
                    
                    {generateMutation.isSuccess && generateMutation.data?.remainingQuota !== undefined && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs border border-border/50">
                        <span className="text-muted-foreground">Lượt còn lại:</span>
                        <span className="font-bold text-primary">{generateMutation.data.remainingQuota}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-muted-foreground italic">
                    * AI sẽ ưu tiên sử dụng các kỹ năng: {portfolio?.skills?.slice(0, 3).map((s: any) => s.name).join(", ") || "Chưa cập nhật"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {generateMutation.isSuccess && generateMutation.data?.items && (
              <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Kết quả gợi ý ({generateMutation.data.items.length})</h2>
                  <Badge variant="secondary">Gemini 1.5 Pro</Badge>
                </div>
                
                <div className="grid gap-6">
                  {generateMutation.data.items.map((topic, idx) => (
                    <Card key={topic.id || idx} className="overflow-hidden border-l-4 border-l-primary/30">
                      <div className="md:flex">
                        <div className="p-6 flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <CardTitle className="text-xl mb-1">{topic.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] uppercase">{topic.domain}</Badge>
                                <Badge variant="outline" className="text-[10px]">{topic.difficulty}</Badge>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                            {topic.problemDescription}
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2">Công nghệ đề xuất</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {topic.technologies?.map((tech: string) => (
                                  <Badge key={tech} variant="outline" className="bg-primary/5 border-primary/10 text-[11px]">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/30 border-t md:border-t-0 md:border-l p-6 flex flex-col justify-center items-center gap-4 min-w-[200px]">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter">Nhóm dự kiến</div>
                            <div className="text-2xl font-bold text-primary">{topic.teamSize} người</div>
                          </div>
                          
                          <Button 
                            className="w-full" 
                            variant={savedTopics.includes(topic.id) ? "secondary" : "default"}
                            onClick={() => handleSaveTopic(topic)}
                            disabled={savedTopics.includes(topic.id) || createTopicMutation.isPending}
                          >
                            {savedTopics.includes(topic.id) ? (
                              <><Check className="w-4 h-4 mr-2" /> Đã lưu</>
                            ) : (
                              <><Save className="w-4 h-4 mr-2" /> Lưu đề tài</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!generateMutation.isSuccess && (
              <div className="py-20 text-center">
                <Sparkles className="w-16 h-16 mx-auto text-primary/20 mb-4" />
                <h3 className="text-xl font-medium text-muted-foreground">Chưa có gợi ý nào</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Hãy nhập thông tin phía trên và nhấn nút "Sinh đề tài" để khám phá các ý tưởng mới từ AI.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
