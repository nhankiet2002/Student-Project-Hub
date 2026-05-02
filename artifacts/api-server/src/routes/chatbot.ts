import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  users,
  portfolios,
  topics,
} from "../data/store.js";

const router: IRouter = Router();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildSystemPrompt(currentUserId: string | null | undefined): string {
  const user = currentUserId ? users.find((u) => u.id === currentUserId) : undefined;
  const portfolio = user ? portfolios[user.id] : undefined;

  const intro = `Bạn là PROMATCH AI — trợ lý ảo thân thiện cho sinh viên trên nền tảng PROMATCH (hỗ trợ đồ án tốt nghiệp đại học). Luôn trả lời bằng TIẾNG VIỆT, ngắn gọn, dùng dấu đầu dòng khi liệt kê. Không dùng emoji. Giọng văn ấm áp, khích lệ, định hướng hành động cụ thể.

Nhiệm vụ chính của bạn:
1. Tư vấn cách chọn hướng đề tài đồ án phù hợp với năng lực và sở thích của sinh viên.
2. Phân tích Digital Portfolio để chỉ ra kỹ năng còn thiếu so với đề tài / vị trí mong muốn, kèm gợi ý lộ trình bổ sung.
3. Trả lời các câu hỏi thường gặp về quy trình đồ án (đăng ký đề tài, tìm giảng viên hướng dẫn, lập nhóm, đặt hàng từ doanh nghiệp, mốc nộp báo cáo, đánh giá điểm, v.v.).

Quy trình đồ án trên PROMATCH (tóm tắt):
- Bước 1: Sinh viên hoàn thiện Hồ sơ năng lực (kỹ năng, dự án, chứng chỉ).
- Bước 2: Khám phá đề tài (Đề tài gợi ý theo AI, Khám phá đề tài, Sinh đề tài AI, hoặc Đặt hàng từ doanh nghiệp).
- Bước 3: Lập nhóm 3–5 thành viên qua mục "Tìm thành viên".
- Bước 4: Đăng ký đề tài và chọn giảng viên hướng dẫn phù hợp chuyên môn.
- Bước 5: Triển khai theo các giai đoạn: đề cương → giữa kỳ → cuối kỳ. Cập nhật tiến độ trong "Dự án của tôi".
- Bước 6: Bảo vệ và lưu sản phẩm vào Kho tri thức để khoá sau tham khảo.

Khi sinh viên hỏi về đề tài, hãy ưu tiên tham chiếu các đề tài có sẵn trên hệ thống (nếu được cung cấp ở phần ngữ cảnh bên dưới).
Khi phân tích kỹ năng còn thiếu, hãy so sánh trực tiếp với phần kỹ năng trong hồ sơ của sinh viên (nếu có) và đề xuất 2–4 mục cụ thể có thể bổ sung trong 4–8 tuần.`;

  if (!user) return intro;

  const ctx: string[] = [];
  ctx.push(`\n--- Ngữ cảnh người dùng hiện tại ---`);
  ctx.push(`Tên: ${user.name}`);
  ctx.push(`Vai trò: ${user.role}`);
  if (user.organization) ctx.push(`Đơn vị: ${user.organization}`);

  if (portfolio) {
    if (portfolio.major) ctx.push(`Ngành: ${portfolio.major}`);
    if (portfolio.year) ctx.push(`Năm học: ${portfolio.year}`);
    if (portfolio.bio) ctx.push(`Giới thiệu: ${portfolio.bio}`);
    if (portfolio.skills?.length) {
      const skillNames = portfolio.skills
        .map((s: any) => `${s.name} (${s.level || "?"}/5)`)
        .join(", ");
      ctx.push(`Kỹ năng hiện có: ${skillNames}`);
    }
    if (portfolio.interests?.length) {
      ctx.push(`Lĩnh vực quan tâm: ${portfolio.interests.join(", ")}`);
    }
    if (portfolio.certifications?.length) {
      ctx.push(`Chứng chỉ: ${portfolio.certifications.join(", ")}`);
    }
    if ((portfolio as any).pastProjects?.length) {
      const past = (portfolio as any).pastProjects
        .slice(0, 3)
        .map((p: any) => `${p.title} (${p.role || "?"})`)
        .join("; ");
      ctx.push(`Dự án đã làm: ${past}`);
    }
  }

  // 5 đề tài nổi bật để gợi ý
  const featured = topics
    .slice(0, 6)
    .map(
      (t) =>
        `- ${t.title} [${t.domain || "?"}, ${t.difficulty || "?"}, kỹ năng: ${(t.requiredSkills || []).slice(0, 4).join(", ")}]`,
    )
    .join("\n");
  ctx.push(`\n--- Một số đề tài đang mở trên hệ thống ---\n${featured}`);

  return intro + "\n" + ctx.join("\n");
}

router.post("/chatbot/message", async (req, res) => {
  const messages = (req.body?.messages || []) as ChatMessage[];
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const systemPrompt = buildSystemPrompt(req.session.userId);

    const stream = await openai.chat.completions.create({
      model: "gemini-3-flash-preview",
      max_completion_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log?.error({ err }, "chatbot stream error");
    res.write(
      `data: ${JSON.stringify({ error: err?.message || "unknown error" })}\n\n`,
    );
    res.end();
  }
});

export default router;
