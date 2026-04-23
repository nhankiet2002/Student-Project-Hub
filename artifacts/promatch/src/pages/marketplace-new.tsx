import { useCreateCall, getListCallsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(5, "Tiêu đề quá ngắn"),
  problemDescription: z.string().min(20, "Mô tả cần ít nhất 20 ký tự"),
  requirements: z.string().min(5, "Vui lòng nhập yêu cầu"),
  timeline: z.string().min(5, "Vui lòng nhập lộ trình"),
  benefits: z.string().min(5, "Vui lòng nhập quyền lợi"),
  budget: z.string().optional(),
  deadline: z.string().optional(),
  skillTags: z.string().optional()
});

export default function MarketplaceNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      problemDescription: "",
      requirements: "",
      timeline: "",
      benefits: "",
      budget: "",
      deadline: "",
      skillTags: ""
    }
  });

  const createMutation = useCreateCall({
    mutation: {
      onSuccess: () => {
        toast.success("Đã tạo đặt hàng thành công!");
        queryClient.invalidateQueries({ queryKey: getListCallsQueryKey() });
        setLocation("/marketplace");
      },
      onError: () => {
        toast.error("Có lỗi xảy ra khi tạo đặt hàng.");
      }
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const requirements = values.requirements.split('\n').map(s => s.trim()).filter(Boolean);
    const skillTags = values.skillTags ? values.skillTags.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    createMutation.mutate({
      data: {
        title: values.title,
        problemDescription: values.problemDescription,
        requirements,
        timeline: values.timeline,
        benefits: values.benefits,
        budget: values.budget,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
        skillTags
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tạo đặt hàng mới</h1>
        <p className="text-muted-foreground mt-1">Đăng tải bài toán thực tế của doanh nghiệp để tìm kiếm nhóm sinh viên phù hợp.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin đặt hàng</CardTitle>
          <CardDescription>Điền đầy đủ thông tin để sinh viên hiểu rõ yêu cầu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiêu đề bài toán <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Xây dựng hệ thống chatbot AI cho CSKH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="problemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả chi tiết <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Trình bày rõ bối cảnh, vấn đề cần giải quyết..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yêu cầu chuyên môn <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Mỗi dòng một yêu cầu..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="timeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lộ trình dự kiến <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="VD: 3 tháng (T9 - T11/2025)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hạn ứng tuyển</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngân sách / Hỗ trợ</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: 5.000.000 VNĐ / Thỏa thuận" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skillTags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Từ khóa kỹ năng</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: React, Node.js, AI (phân cách bằng dấu phẩy)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quyền lợi <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Sinh viên nhận được gì khi tham gia..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation('/marketplace')}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Đăng đặt hàng
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}