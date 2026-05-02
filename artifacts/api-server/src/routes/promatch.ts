import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import { prisma } from "@workspace/db";
import {
  skills,
  users,
  portfolios,
  topics,
  calls,
  projects,
  projectDetails,
  tasks,
  taskAttachments,
  contributions,
  archived,
  notifications,
  moderation,
  aiQuotaByUser,
  userPasswords,
  conversations,
  chatMessages,
} from "../data/store.js";

import type {
  Topic,
  CallForProject,
  Project,
  Task,
  TaskAttachmentFile,
  Notification,
  Portfolio,
} from "../data/types.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const router: IRouter = Router();

function currentUser(req: Request) {
  const userId = req.session.userId;
  if (!userId) return null;
  return users.find((u) => u.id === userId) ?? null;
}

function safeCurrentUser(req: Request) {
  return currentUser(req) ?? users[0]!;
}

async function getPrismaUser(req: Request) {
  const userId = req.session.userId;
  if (!userId) return null;
  return await prisma.user.findUnique({ where: { id: userId } });
}

// ===== Session =====
router.get("/session/me", async (req, res) => {
  const user = await getPrismaUser(req);
  if (!user) { res.status(401).json({ error: "Chưa đăng nhập" }); return; }
  res.json(user);
});

router.post("/session/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) { res.status(400).json({ error: "Email và mật khẩu không được để trống" }); return; }
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.password !== password) { res.status(401).json({ error: "Email hoặc mật khẩu không đúng" }); return; }
  req.session.userId = user.id;
  res.json(user);
});

router.post("/session/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.patch("/session/password", async (req, res) => {
  const user = await getPrismaUser(req);
  if (!user) { res.status(401).json({ error: "Chưa đăng nhập" }); return; }
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) { res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" }); return; }
  if (newPassword.trim().length < 6) { res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" }); return; }
  if (user.password !== currentPassword) { res.status(401).json({ error: "Mật khẩu hiện tại không đúng" }); return; }
  await prisma.user.update({ where: { id: user.id }, data: { password: newPassword.trim() } });
  res.json({ ok: true });
});

// Mock storage for verification codes (email -> code)
const verificationCodes = new Map<string, string>();

router.post("/session/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Vui lòng nhập email" }); return; }
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) { res.status(404).json({ error: "Email không tồn tại trong hệ thống" }); return; }
  
  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email.trim().toLowerCase(), code);
  
  console.log(`[AUTH] Verification code for ${email}: ${code}`);
  
  // Send REAL email if configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: `"PROMATCH Support" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Mã xác minh khôi phục mật khẩu - PROMATCH",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; letter-spacing: 2px;">PROMATCH</h1>
            </div>
            <div style="padding: 30px; line-height: 1.6; color: #334155;">
              <h2 style="color: #1e293b; text-align: center;">Xác minh khôi phục mật khẩu</h2>
              <p>Chào bạn,</p>
              <p>Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác minh dưới đây để hoàn tất quá trình:</p>
              <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${code}</span>
              </div>
              <p style="font-size: 14px; color: #64748b;">Mã này sẽ hết hạn sau 10 phút. Nếu bạn không yêu cầu thay đổi này, hãy bỏ qua email này.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 PROMATCH - Hệ thống quản lý đồ án sinh viên</p>
            </div>
          </div>
        `,
      });
      res.json({ ok: true, message: "Mã xác minh đã được gửi về email của bạn" });
    } catch (error) {
      console.error("Failed to send email:", error);
      res.json({ ok: true, message: "Đã tạo mã thành công (Gửi mail thất bại)", code: code });
    }
  } else {
    // Fallback to demo mode if no SMTP config
    res.json({ ok: true, message: "Mã xác minh đã được gửi (Chế độ Demo)", code: code });
  }
});

router.post("/session/verify-code", async (req, res) => {
  const { email, code } = req.body as { email?: string, code?: string };
  if (!email || !code) { res.status(400).json({ error: "Thiếu thông tin" }); return; }
  
  const storedCode = verificationCodes.get(email.trim().toLowerCase());
  if (storedCode === code) {
    res.json({ ok: true, message: "Mã xác minh chính xác" });
  } else {
    res.status(400).json({ error: "Mã xác minh không chính xác" });
  }
});

router.post("/session/reset-password", async (req, res) => {
  const { email, newPassword, code } = req.body as { email?: string, newPassword?: string, code?: string };
  if (!email || !newPassword || !code) { res.status(400).json({ error: "Thiếu thông tin" }); return; }
  
  // Final verification check
  const storedCode = verificationCodes.get(email.trim().toLowerCase());
  if (storedCode !== code) {
    res.status(401).json({ error: "Phiên làm việc đã hết hạn hoặc mã không đúng" });
    return;
  }

  if (newPassword.trim().length < 6) { res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" }); return; }
  
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) { res.status(404).json({ error: "Người dùng không tồn tại" }); return; }
  
  await prisma.user.update({ where: { id: user.id }, data: { password: newPassword.trim() } });
  
  // Clear the code after successful reset
  verificationCodes.delete(email.trim().toLowerCase());
  
  res.json({ ok: true, message: "Đổi mật khẩu thành công" });
});

router.put("/session/me", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const role = req.body?.role as string;
  const map: Record<string, string> = {
    student: "u_student",
    instructor: "u_instructor",
    enterprise: "u_enterprise",
    admin: "u_admin",
  };
  if (map[role]) {
    req.session.userId = map[role]!;
  }
  res.json(await getPrismaUser(req));
});

router.patch("/session/me", async (req, res) => {
  const user = await getPrismaUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { name, avatarUrl } = req.body as { name?: string; avatarUrl?: string | null };
  const updateData: any = {};
  if (name !== undefined && name.trim()) updateData.name = name.trim();
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  
  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    await prisma.portfolio.update({ where: { userId: user.id }, data: updateData }).catch(() => {});
  }
  res.json(await getPrismaUser(req));
});

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "894226558641913",
  api_secret: process.env.CLOUDINARY_API_SECRET || "1bNfT2f8M1z2Z2yN8a-o3mI5y7M",
});

router.post("/session/me/avatar", upload.single("file"), async (req, res) => {
  const user = await getPrismaUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "promatch_avatars",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
    });

    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: result.secure_url } });
    await prisma.portfolio.update({ where: { userId: user.id }, data: { avatarUrl: result.secure_url } }).catch(() => {});

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

router.post("/users", async (req, res) => {
  const { name, email, password, role } = req.body as { name?: string; email?: string; password?: string; role?: string; };
  if (!name || !email || !password || !role) { res.status(400).json({ error: "Thiếu thông tin bắt buộc" }); return; }
  const normalizedEmail = email.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) { res.status(409).json({ error: "Email đã được sử dụng" }); return; }
  const validRoles = ["student", "instructor", "enterprise", "admin"];
  if (!validRoles.includes(role)) { res.status(400).json({ error: "Vai trò không hợp lệ" }); return; }
  
  const newUser = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password,
      role,
      status: "active",
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
    }
  });

  await prisma.portfolio.create({
    data: {
      userId: newUser.id,
      name: newUser.name,
      avatarUrl: newUser.avatarUrl,
      bio: "",
    }
  });

  req.session.userId = newUser.id;
  res.status(201).json(newUser);
});

// ===== Skills & Portfolio =====
router.get("/skills", (_req, res) => {
  res.json(skills);
});

router.get("/portfolios/:userId", async (req, res) => {
  const userId = req.params.userId;
  const p = await prisma.portfolio.findUnique({ where: { userId }, include: { user: true } });
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  // Fetch real projects that are completed
  const projectMemberships = await prisma.projectMember.findMany({
    where: { userId, project: { status: 'completed' } },
    include: { project: true }
  });

  const completedDbProjects = projectMemberships.map(pm => ({
    id: pm.project.id,
    title: pm.project.name,
    role: pm.role,
    year: parseInt(pm.project.dueDate.split('-')[0]) || new Date().getFullYear(),
    summary: pm.project.description || "",
    contributionPct: pm.contributionPct,
    isRealProject: true
  }));

  const pastProjects = (p.pastProjects as any[] || []);
  const allCompletedProjects = [...completedDbProjects, ...pastProjects];

  res.json({ 
    ...p, 
    role: p.user.role,
    allCompletedProjects 
  });
});


router.put("/portfolios/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (req.session.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  
  const p = await prisma.portfolio.findUnique({ where: { userId }, include: { user: true } });
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  
  const data = req.body;
  const updated = await prisma.portfolio.update({
    where: { userId },
    data: {
      bio: data.bio ?? p.bio,
      major: data.major ?? p.major,
      year: data.year ?? p.year,
      interests: data.interests ?? p.interests ?? [],
      skills: data.skills ?? p.skills ?? [],
      publicVisible: data.publicVisible ?? p.publicVisible,
      instructorProfile: data.instructorProfile
        ? { ...((p.instructorProfile as any) || { expertise: [], focusDomains: [], mentoredTeamCount: 0, advisedTopicCount: 0, publications: [] }), ...data.instructorProfile }
        : p.instructorProfile ?? undefined,
      enterpriseProfile: data.enterpriseProfile
        ? { ...((p.enterpriseProfile as any) || { sponsoredBriefCount: 0, adoptedProjectCount: 0, placedStudentCount: 0, focusAreas: [], offeredBenefits: [] }), ...data.enterpriseProfile }
        : p.enterpriseProfile ?? undefined,
    }
  });
  
  res.json({ ...updated, role: p.user.role });
});

// ===== Topics =====
router.get("/topics", async (req, res) => {
  const q = (req.query.q as string | undefined)?.toLowerCase();
  const domain = req.query.domain as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const source = req.query.source as string | undefined;
  const sort = (req.query.sort as string | undefined) || "relevance";

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { problemDescription: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (domain && domain !== "all") where.domain = domain;
  if (difficulty && difficulty !== "all") where.difficulty = difficulty;
  if (source && source !== "all") where.source = source;

  const orderBy: any = {};
  if (sort === "recent") orderBy.createdAt = 'desc';
  else if (sort === "popular") orderBy.popularity = 'desc';
  else if (sort === "score") orderBy.completeness = 'desc';

  const user = await getPrismaUser(req);
  const items = await prisma.topic.findMany({ where, orderBy });
  
  // Mark bookmarked items
  const bookmarks = user ? await prisma.bookmark.findMany({ where: { userId: user.id } }) : [];
  const bookmarkIds = new Set(bookmarks.map(b => b.topicId));
  
  const itemsWithBookmarks = items.map(item => ({
    ...item,
    isBookmarked: bookmarkIds.has(item.id)
  }));

  res.json({ items: itemsWithBookmarks, total: items.length });
});

router.post("/topics/:topicId/bookmark", async (req, res) => {
  const user = await getPrismaUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  const topicId = req.params.topicId;

  const existing = await prisma.bookmark.findUnique({
    where: { userId_topicId: { userId: user.id, topicId } }
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    res.json({ bookmarked: false });
  } else {
    await prisma.bookmark.create({ data: { userId: user.id, topicId } });
    res.json({ bookmarked: true });
  }
});

router.get("/topics/bookmarks", async (req, res) => {
  const user = await getPrismaUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    include: { topic: true }
  });

  res.json(bookmarks.map(b => ({ ...b.topic, isBookmarked: true })));
});

router.post("/topics", async (req, res) => {
  const body = req.body || {};
  const user = await getPrismaUser(req);
  const newTopic = await prisma.topic.create({
    data: {
      title: body.title || "Đề tài mới",
      problemDescription: body.problemDescription || "",
      objectives: body.objectives || [],
      technologies: body.technologies || [],
      domain: body.domain || "Web Development",
      difficulty: body.difficulty || "intermediate",
      source: "student",
      sourceLabel: user?.name || "Anonymous",
      requiredSkills: body.requiredSkills || [],
      teamSize: body.teamSize || 3,
      feasibility: "Khả thi",
      popularity: 0,
      completeness: 0.7,
    }
  });
  res.status(201).json(newTopic);
});

router.get("/topics/recommend", async (req, res) => {
  const user = await getPrismaUser(req);
  const domainFilter = req.query.domain as string | undefined;
  const difficultyFilter = req.query.difficulty as string | undefined;

  const where: any = {};
  if (domainFilter && domainFilter !== "all") where.domain = domainFilter;
  if (difficultyFilter && difficultyFilter !== "all") where.difficulty = difficultyFilter;

  const items = await prisma.topic.findMany({ where, orderBy: { popularity: 'desc' }, take: 24 });

  // Get user bookmarks
  const bookmarks = user ? await prisma.bookmark.findMany({ where: { userId: user.id } }) : [];
  const bookmarkIds = new Set(bookmarks.map(b => b.topicId));

  // Get user skills and interests from portfolio
  const portfolio = user ? await prisma.portfolio.findUnique({ where: { userId: user.id } }) : null;
  const userSkills = new Set<string>((portfolio?.skills as any[] || []).map((s: any) => s.name?.toLowerCase() || ''));
  const userInterests = new Set<string>((portfolio?.interests as string[] || []).map((i) => i.toLowerCase()));

  const scored = items.map((t) => {
    const domainMatch = [...userInterests].some(i => t.domain.toLowerCase().includes(i) || i.includes(t.domain.toLowerCase()));
    const techArray: string[] = (t.technologies as string[] || []);
    const reqSkills: string[] = (t.requiredSkills as string[] || []);
    const matchingSkills = reqSkills.filter(s => userSkills.has(s.toLowerCase()));
    const sms = reqSkills.length === 0 ? 0.5 : matchingSkills.length / reqSkills.length;
    const ias = domainMatch ? 0.85 : 0.45;
    const pqs = Math.min(1, (t.completeness as number) * 0.7 + Math.min(t.popularity / 200, 1) * 0.3);
    const hybrid = 0.4 * sms + 0.35 * ias + 0.25 * pqs;
    return {
      topic: {
        ...t,
        isBookmarked: bookmarkIds.has(t.id)
      },
      hybridScore: Math.round(hybrid * 1000) / 1000,
      skillMatchScore: Math.round(sms * 1000) / 1000,
      interestAlignmentScore: Math.round(ias * 1000) / 1000,
      projectQualityScore: Math.round(pqs * 1000) / 1000,
      matchingSkills,
      missingSkills: reqSkills.filter(s => !userSkills.has(s.toLowerCase())),
      difficultyEstimate: t.difficulty === "advanced" ? "Nâng cao" : t.difficulty === "intermediate" ? "Trung bình" : "Cơ bản",
    };
  });
  scored.sort((a, b) => b.hybridScore - a.hybridScore);
  res.json(scored);
});

router.get("/topics/:topicId", async (req, res) => {
  const t = await prisma.topic.findUnique({ where: { id: req.params.topicId } });
  if (!t) return res.status(404).json({ error: "Not found" });
  return res.json(t);
});

router.post("/topics/ai-generate", (req, res) => {
  const u = safeCurrentUser(req);
  const used = aiQuotaByUser[u.id] || 0;
  if (used >= 10) {
    return res.status(429).json({ error: "Đã đạt giới hạn 10 lần/tháng" });
  }
  aiQuotaByUser[u.id] = used + 1;

  const interests: string[] = req.body?.interests || ["AI", "Web"];
  const domain: string = req.body?.domain || "AI/ML";
  const portfolio = portfolios[u.id];
  const skillNames = (portfolio?.skills || []).map((s) => s.name);

  const baseTopics = [
    {
      title: `Hệ thống ${interests[0] || "AI"} cá nhân hóa cho sinh viên Việt Nam`,
      tech: skillNames.slice(0, 3).concat(["FastAPI", "PostgreSQL"]),
    },
    {
      title: `Nền tảng ${domain.toLowerCase()} ứng dụng vào ${interests[1] || "giáo dục"}`,
      tech: ["Python", "React", "Docker"],
    },
    {
      title: `Phân tích xu hướng ${interests[0] || "thị trường"} với mô hình LLM`,
      tech: ["LangChain", "OpenAI API", "Next.js"],
    },
    {
      title: `Ứng dụng cộng đồng học tập theo sở thích ${interests[0] || "công nghệ"}`,
      tech: ["React Native", "Node.js", "MongoDB"],
    },
    {
      title: `Trợ lý AI tự động cá nhân hóa lộ trình ${interests[1] || "học tập"}`,
      tech: ["Python", "PyTorch", "FastAPI", "React"],
    },
    {
      title: `Marketplace dịch vụ ${domain.toLowerCase()} cho doanh nghiệp nhỏ Việt Nam`,
      tech: ["Next.js", "TypeScript", "Stripe", "PostgreSQL"],
    },
  ];

  const generated: Topic[] = baseTopics.map((b, i) => ({
    id: `tp_ai_${Date.now()}_${i}`,
    title: b.title,
    problemDescription: `Đây là đề tài được sinh tự động bởi AI dựa trên hồ sơ năng lực của bạn (${skillNames.slice(0, 3).join(", ") || "kỹ năng đa dạng"}) và các xu hướng thị trường mới nhất từ GitHub Trending, Stack Overflow Survey và Job Market APIs. Bài toán tập trung vào: ${b.title.toLowerCase()}. Hệ thống cần đảm bảo trải nghiệm người dùng phù hợp với sinh viên Việt Nam, có khả năng mở rộng và bảo mật dữ liệu cá nhân theo quy định pháp luật. Đề tài có tính khả thi cao trong khuôn khổ một học kỳ với đội nhóm 3-4 thành viên có kỹ năng phù hợp.`,
    objectives: [
      `Nghiên cứu và phân tích nhu cầu thị trường liên quan tới ${interests[0] || "AI"}`,
      "Thiết kế và xây dựng MVP với các tính năng cốt lõi",
      "Triển khai và đo lường mức độ chấp nhận của người dùng",
    ],
    technologies: b.tech,
    domain,
    difficulty: i % 2 === 0 ? "intermediate" : "advanced",
    source: "ai",
    sourceLabel: "Sinh bởi AI - Claude/GPT-4o",
    requiredSkills: (portfolio?.skills || []).slice(0, 4).map((s) => s.skillId),
    teamSize: 3 + (i % 2),
    feasibility: "Khả thi - phù hợp với năng lực hiện tại",
    popularity: 0,
    createdAt: new Date().toISOString(),
    completeness: 0.85,
  }));

  return res.json({ items: generated, remainingQuota: 10 - aiQuotaByUser[u.id]! });
});

router.get("/topic-trends", (_req, res) => {
  res.json([
    { id: "tr_1", title: "AI Agents & Multi-step Reasoning", source: "GitHub Trending", score: 95, tags: ["AI", "LLM", "Agents"], url: "https://github.com/trending", cached: false },
    { id: "tr_2", title: "Vector Databases for RAG", source: "Stack Overflow Survey", score: 91, tags: ["AI", "Database", "RAG"], url: null, cached: false },
    { id: "tr_3", title: "Edge Computing & WebAssembly", source: "Google Trends", score: 88, tags: ["WASM", "Cloud"], url: null, cached: false },
    { id: "tr_4", title: "Sustainable Software Engineering", source: "Job Market API", score: 85, tags: ["Green Tech"], url: null, cached: false },
    { id: "tr_5", title: "Realtime Collaboration Tools", source: "GitHub Trending", score: 84, tags: ["WebSocket", "CRDT"], url: null, cached: false },
    { id: "tr_6", title: "Quantum-safe Cryptography", source: "Job Market API", score: 79, tags: ["Security", "Crypto"], url: null, cached: true },
    { id: "tr_7", title: "Robotics Process Automation", source: "Google Trends", score: 76, tags: ["Automation", "RPA"], url: null, cached: false },
    { id: "tr_8", title: "Privacy-preserving ML", source: "Stack Overflow Survey", score: 74, tags: ["AI", "Privacy"], url: null, cached: false },
    { id: "tr_9", title: "AR/VR for Education", source: "Google Trends", score: 71, tags: ["AR", "VR", "Edu"], url: null, cached: true },
    { id: "tr_10", title: "Low-code/No-code Platforms", source: "Job Market API", score: 68, tags: ["LowCode"], url: null, cached: false },
  ]);
});

// ===== Calls =====
router.get("/calls", async (req, res) => {
  const status = req.query.status as string | undefined;
  const where: any = {};
  if (status && status !== "all") where.status = status;
  const items = await prisma.callForProject.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(items);
});

router.post("/calls", async (req, res) => {
  const body = req.body || {};
  const user = await getPrismaUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  const newCall = await prisma.callForProject.create({
    data: {
      title: body.title || "Đặt hàng mới",
      enterpriseName: user.organization || user.name,
      problemDescription: body.problemDescription || "",
      requirements: body.requirements || [],
      timeline: body.timeline || "12 tuần",
      benefits: body.benefits || "",
      budget: body.budget || null,
      status: user.role === "enterprise" ? "published" : "pending",
      postedAt: new Date().toISOString(),
      deadline: body.deadline || null,
      applicationCount: 0,
      skillTags: body.skillTags || [],
    }
  });
  res.status(201).json(newCall);
});

router.get("/calls/:callId", async (req, res) => {
  const c = await prisma.callForProject.findUnique({ where: { id: req.params.callId } });
  if (!c) return res.status(404).json({ error: "Not found" });
  return res.json(c);
});

router.post("/calls/:callId/apply", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) return res.status(401).json({ error: "Not authenticated" });
  
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return res.status(401).json({ error: "User not found" });

  const c = await prisma.callForProject.findUnique({ where: { id: req.params.callId } });
  if (!c) return res.status(404).json({ error: "Call not found" });

  // Create real application record
  const app = await prisma.application.create({
    data: {
      callId: c.id,
      applicantId: user.id,
      applicantName: user.name,
      applicantAvatar: user.avatarUrl,
      message: req.body?.message || "",
      status: "submitted",
    }
  });

  // Update count
  await prisma.callForProject.update({
    where: { id: c.id },
    data: { applicationCount: { increment: 1 } }
  });

  // Notify enterprise (find enterprise user by organization name or just find users with role enterprise and organization matching)
  const enterpriseUsers = await prisma.user.findMany({
    where: { role: 'enterprise', organization: c.enterpriseName }
  });

  for (const eu of enterpriseUsers) {
    await prisma.notification.create({
      data: {
        userId: eu.id,
        title: "Ứng tuyển mới",
        body: `${user.name} đã ứng tuyển vào đề tài "${c.title}"`,
        type: "call",
        link: `/enterprise/applications`,
      }
    });
  }

  return res.json(app);
});

router.get("/enterprise/applications", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) return res.status(401).json({ error: "Not authenticated" });
  
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user || user.role !== 'enterprise') return res.status(403).json({ error: "Forbidden" });

  // Get all calls by this enterprise
  const myCalls = await prisma.callForProject.findMany({
    where: { enterpriseName: user.organization || user.name }
  });

  const callIds = myCalls.map(c => c.id);

  const applications = await prisma.application.findMany({
    where: { callId: { in: callIds } },
    include: { 
      call: true,
      applicant: {
        include: { Portfolio: true }
      }
    },
    orderBy: { appliedAt: 'desc' }
  });

  res.json(applications);
});


// ===== Teams =====
router.get("/teams/recommend", async (req, res) => {
  const user = await getPrismaUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const myPortfolio = await prisma.portfolio.findUnique({ where: { userId: user.id } });
  const mySkills = new Set<string>((myPortfolio?.skills as any[] || []).map((s: any) => (s.name || '').toLowerCase()));

  const topicId = req.query.topicId as string | undefined;
  const topic = topicId ? await prisma.topic.findUnique({ where: { id: topicId } }) : null;
  const required = new Set<string>((topic?.requiredSkills as string[] || []).map(s => s.toLowerCase()));

  const candidates = await prisma.user.findMany({
    where: { role: 'student', id: { not: user.id } },
    include: { Portfolio: true },
    take: 20,
  });

  const recs = candidates
    .filter(c => c.Portfolio)
    .map((c) => {
      const cp = c.Portfolio!;
      const cSkillsArr: any[] = cp.skills as any[] || [];
      const cSkills = new Set<string>(cSkillsArr.map((s: any) => (s.name || '').toLowerCase()));
      
      const shared = [...cSkills].filter(s => mySkills.has(s));
      const complementary = [...cSkills].filter(s => !mySkills.has(s));
      const missingSkills = topic ? [...required].filter(s => !mySkills.has(s) && cSkills.has(s)) : [];
      
      const score = Math.min(1, complementary.length / 5) * 0.4 + (missingSkills.length > 0 ? 0.5 : 0.1) + Math.min(1, cp.contributionScore / 100) * 0.1;
      
      const suggestedRole = cSkillsArr.some((s: any) => /figma|ux|ui/i.test(s.name || ''))
        ? 'UI/UX Designer'
        : cSkillsArr.some((s: any) => /node|express|backend/i.test(s.name || ''))
          ? 'Backend Developer'
          : cSkillsArr.some((s: any) => /flutter|react native|mobile/i.test(s.name || ''))
            ? 'Mobile Developer'
            : cSkillsArr.some((s: any) => /python|ml|machine/i.test(s.name || ''))
              ? 'ML Engineer'
              : 'Full-stack Developer';
              
      let aiInsight = "";
      if (topic) {
        if (missingSkills.length > 0) {
          aiInsight = `Thành viên này sở hữu ${missingSkills.length} kỹ năng then chốt đang thiếu trong nhóm: ${missingSkills.slice(0, 3).join(', ')}. Đây là mảnh ghép hoàn hảo để hoàn thiện yêu cầu của đề tài.`;
        } else {
          aiInsight = `Có sự tương đồng cao về kỹ năng cơ bản. Thành viên này có thể hỗ trợ tốt ở vai trò ${suggestedRole} và mang lại kinh nghiệm từ ${cp.completedProjects} dự án đã thực hiện.`;
        }
      } else {
        aiInsight = `Bổ sung ${complementary.length} kỹ năng mới cho mạng lưới của bạn. Phù hợp để hợp tác trong các dự án về ${cp.major || 'CNTT'}.`;
      }

      return {
        user: { id: c.id, name: c.name, role: c.role, organization: c.organization, avatarUrl: c.avatarUrl },
        complementarityScore: Math.round(score * 100) / 100,
        sharedSkills: shared,
        complementarySkills: complementary,
        suggestedRole,
        gapAnalysis: aiInsight,
      };
    });

  recs.sort((a, b) => b.complementarityScore - a.complementarityScore);
  res.json(recs);
});

// ===== Projects =====
router.get("/projects", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Filter projects where the user is a member
  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId: userId
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json(projects);
});


router.post("/projects", async (req, res) => {
  const body = req.body || {};
  const topic = body.topicId ? await prisma.topic.findUnique({ where: { id: body.topicId } }) : null;
  const currentUser = await getPrismaUser(req);
  
  const newProject = await prisma.project.create({
    data: {
      name: body.name || "Dự án mới",
      topicId: body.topicId || null,
      topicTitle: topic?.title || "Đề tài tự do",
      status: "planning",
      progress: 0,
      memberCount: (body.memberIds || []).length || 1,
      instructorName: "TS. Trần Quốc Bảo",
      dueDate: body.dueDate || new Date(Date.now() + 90 * 86400000).toISOString(),
      milestoneCount: 5,
      completedMilestones: 0,
      description: `Dự án mới được tạo với đề tài: ${topic?.title || "Tự do"}`,
    }
  });

  // Add members
  const memberIds = body.memberIds || [currentUser?.id];
  for (let i = 0; i < memberIds.length; i++) {
    const uid = memberIds[i];
    const u = await prisma.user.findUnique({ where: { id: uid } });
    await prisma.projectMember.create({
      data: {
        projectId: newProject.id,
        userId: uid,
        name: u?.name || "Thành viên",
        role: i === 0 ? "Trưởng nhóm" : "Thành viên",
        contributionPct: 100 / memberIds.length,
      }
    });
  }

  // Add initial activity
  await prisma.projectActivity.create({
    data: {
      projectId: newProject.id,
      message: "Đã tạo workspace dự án",
      actor: currentUser?.name || "System",
      timestamp: new Date().toISOString(),
    }
  });

  res.status(201).json(newProject);
});

router.get("/projects/:projectId", async (req, res) => {
  const p = await prisma.project.findUnique({ 
    where: { id: req.params.projectId },
    include: {
      members: true,
      milestones: true,
      activities: true,
    }
  });
  if (!p) return res.status(404).json({ error: "Not found" });
  return res.json({
    project: p,
    members: p.members,
    milestones: p.milestones,
    description: p.description,
    recentActivity: p.activities,
  });
});

router.get("/projects/:projectId/tasks", async (req, res) => {
  const items = await prisma.task.findMany({ 
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(items);
});

router.post("/projects/:projectId/tasks", async (req, res) => {
  const projectId = req.params.projectId!;
  const body = req.body || {};
  const assignee = body.assigneeId ? await prisma.user.findUnique({ where: { id: body.assigneeId } }) : null;
  const newTask = await prisma.task.create({
    data: {
      projectId,
      title: body.title || "Công việc mới",
      description: body.description || null,
      status: body.status || "todo",
      assigneeId: body.assigneeId || null,
      assigneeName: assignee?.name || "Chưa giao",
      dueDate: body.dueDate || null,
    }
  });
  res.status(201).json(newTask);
});

router.put("/tasks/:taskId", async (req, res) => {
  const body = req.body || {};
  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
  if (body.assigneeId !== undefined) {
    const assignee = await prisma.user.findUnique({ where: { id: body.assigneeId } });
    updateData.assigneeId = body.assigneeId;
    updateData.assigneeName = assignee?.name || "Chưa giao";
  }
  const t = await prisma.task.update({ where: { id: req.params.taskId }, data: updateData }).catch(() => null);
  if (!t) return res.status(404).json({ error: "Not found" });
  return res.json(t);
});

// ===== Task Attachments =====
router.get("/tasks/:taskId/attachments", (req, res) => {
  const taskId = req.params.taskId!;
  const list = (taskAttachments.get(taskId) ?? []).map(({ buffer: _buffer, ...meta }) => meta);
  res.json(list);
});

router.post(
  "/tasks/:taskId/attachments",
  upload.single("file"),
  (req, res) => {
    const taskId = String(req.params["taskId"] ?? "");
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const entry: TaskAttachmentFile = {
      id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      taskId,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: safeCurrentUser(req).name,
      buffer: req.file.buffer,
    };

    const list = taskAttachments.get(taskId) ?? [];
    list.push(entry);
    taskAttachments.set(taskId, list);

    const { buffer: _buffer, ...meta } = entry;
    return res.status(201).json(meta);
  },
);

router.delete("/tasks/:taskId/attachments/:attachmentId", (req, res) => {
  const { taskId, attachmentId } = req.params as { taskId: string; attachmentId: string };
  const list = taskAttachments.get(taskId);
  if (!list) return res.status(404).json({ error: "Not found" });
  const idx = list.findIndex((a) => a.id === attachmentId);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  list.splice(idx, 1);
  return res.status(204).send();
});

router.get("/tasks/:taskId/attachments/:attachmentId/download", (req, res) => {
  const { taskId, attachmentId } = req.params as { taskId: string; attachmentId: string };
  const list = taskAttachments.get(taskId);
  const entry = list?.find((a) => a.id === attachmentId);
  if (!entry) return res.status(404).json({ error: "Not found" });
  res.setHeader("Content-Type", entry.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(entry.filename)}`);
  res.setHeader("Content-Length", entry.size);
  return res.send(entry.buffer);
});

router.get("/conversations/:conversationId/messages", async (req, res) => {
  const items = await prisma.message.findMany({
    where: { conversationId: req.params.conversationId },
    orderBy: { sentAt: 'asc' }
  });
  res.json(items);
});

router.get("/projects/:projectId/contributions", async (req, res) => {
  const members = await prisma.projectMember.findMany({ where: { projectId: req.params.projectId } });
  const tasks = await prisma.task.findMany({ where: { projectId: req.params.projectId } });
  const items = members.map(m => {
    const doneTasks = tasks.filter(t => t.assigneeId === m.userId && t.status === 'done').length;
    return {
      userId: m.userId,
      name: m.name,
      avatarUrl: m.avatarUrl,
      tasksCompleted: doneTasks,
      commits: 0,
      documents: 0,
      meetingsAttended: 0,
      percentage: m.contributionPct,
      peerRating: 0,
    };
  });
  res.json(items);
});

router.get("/instructor/dashboard", async (_req, res) => {
  const allProjects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
  const atRiskCount = allProjects.filter((p) => p.status === "at_risk").length;
  const completedCount = allProjects.filter((p) => p.status === "completed").length;
  res.json({
    totalProjects: allProjects.length,
    atRiskCount,
    completedThisSemester: completedCount,
    upcomingDeadlines: allProjects.slice(0, 5).map((p) => ({
      projectId: p.id,
      projectName: p.name,
      milestone: "Phát triển MVP",
      dueDate: p.dueDate,
    })),
    projects: allProjects,
  });
});

// ===== Knowledge =====
router.get("/knowledge", (req, res) => {
  const q = (req.query.q as string | undefined)?.toLowerCase();
  const domain = req.query.domain as string | undefined;
  let items = archived.slice();
  if (q) {
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }
  if (domain && domain !== "all") items = items.filter((a) => a.domain === domain);
  res.json(items);
});

router.get("/knowledge/:archiveId", (req, res) => {
  const a = archived.find((x) => x.id === req.params.archiveId);
  if (!a) return res.status(404).json({ error: "Not found" });
  a.viewCount += 1;
  return res.json(a);
});

// ===== Notifications =====
async function pushNotification(userId: string, input: { title: string, body: string, type: string, link?: string }): Promise<any> {
  const n = await prisma.notification.create({
    data: {
      userId,
      title: input.title,
      body: input.body,
      type: input.type,
      link: input.link || null,
      read: false,
    }
  });
  return n;
}

router.get("/notifications", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) return res.json([]);
  const items = await prisma.notification.findMany({ 
    where: { userId: uid },
    orderBy: { createdAt: 'desc' }
  });
  res.json(items);
});

router.post("/notifications/:notificationId/read", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  
  try {
    const n = await prisma.notification.update({
      where: { id: req.params.notificationId, userId: uid },
      data: { read: true }
    });
    res.json(n);
  } catch (err) {
    res.status(404).json({ error: "Not found or not authorized" });
  }
});

router.post("/notifications/read-all", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  
  const result = await prisma.notification.updateMany({
    where: { userId: uid, read: false },
    data: { read: true }
  });
  
  res.json({ count: result.count });
});

// Push notification: team invitation
router.post("/teams/invite", async (req, res) => {
  const body = req.body || {};
  const targetUserId = body.userId;
  if (!targetUserId) return res.status(400).json({ error: "Target userId is required" });

  const topicTitle = String(body.topicTitle || "đề tài").slice(0, 200);
  const inviterName = String(body.inviterName || "Một sinh viên").slice(0, 100);
  const message = body.message ? String(body.message).slice(0, 200) : null;
  const projectId = body.projectId;
  
  const n = await pushNotification(targetUserId, {
    title: "Lời mời tham gia nhóm",
    body: message
      ? `${inviterName} mời bạn tham gia nhóm cho đề tài "${topicTitle}". Lời nhắn: ${message}`
      : `${inviterName} mời bạn tham gia nhóm cho đề tài "${topicTitle}".`,
    type: "team",
    link: projectId ? `/projects/${projectId}?invite=true` : "/teams",
  });
  res.status(201).json(n);
});

router.post("/teams/respond-invite", async (req, res) => {
  const user = await getPrismaUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { projectId, action, notificationId } = req.body as { projectId: string, action: 'accept' | 'reject', notificationId?: string };
  if (!projectId || !action) return res.status(400).json({ error: "Missing data" });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: "Project not found" });

  const projectMembers = await prisma.projectMember.findMany({ where: { projectId } });
  const inviter = projectMembers[0];

  if (action === 'accept') {
    // Check if already a member
    const existing = await prisma.projectMember.findFirst({ where: { projectId, userId: user.id } });
    if (!existing) {
      await prisma.projectMember.create({
        data: {
          projectId,
          userId: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: "Thành viên",
          contributionPct: 0,
        }
      });

      await prisma.project.update({
        where: { id: projectId },
        data: { memberCount: { increment: 1 } }
      });

      if (inviter) {
        await pushNotification(inviter.userId, {
          title: "Lời mời đã được chấp nhận",
          body: `${user.name} đã đồng ý tham gia dự án "${project.name}".`,
          type: "team",
          link: `/project-detail/${projectId}`,
        });
      }
    }
  } else {
    if (inviter) {
      await pushNotification(inviter.userId, {
        title: "Lời mời bị từ chối",
        body: `${user.name} đã từ chối tham gia dự án "${project.name}".`,
        type: "team",
      });
    }
  }

  if (notificationId) {
    await prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
  }

  res.json({ ok: true });
});

// Push notification: project status update
router.put("/projects/:projectId/status", async (req, res) => {
  const id = req.params.projectId!;
  const newStatus = String(req.body?.status || "") as Project["status"];
  const allowed: Project["status"][] = ["planning", "in_progress", "review", "completed", "at_risk"];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const project = await prisma.project.update({
    where: { id },
    data: { status: newStatus },
    include: { members: true }
  });

  if (!project) return res.status(404).json({ error: "Not found" });

  const statusLabels: Record<string, string> = {
    planning: "Đang lập kế hoạch",
    in_progress: "Đang triển khai",
    review: "Chờ đánh giá",
    completed: "Đã hoàn thành",
    at_risk: "Cảnh báo trễ tiến độ",
  };

  const note = req.body?.note ? ` Ghi chú: ${String(req.body.note).slice(0, 200)}` : "";
  const currentUser = await getPrismaUser(req);

  // Notify all members
  for (const m of project.members) {
    await pushNotification(m.userId, {
      title: `Cập nhật trạng thái: ${project.name}`,
      body: `Trạng thái dự án đã chuyển sang "${statusLabels[newStatus]}".${note}`,
      type: "milestone",
      link: `/projects/${id}`,
    });
  }

  // Add activity
  await prisma.projectActivity.create({
    data: {
      projectId: id,
      message: `Trạng thái dự án chuyển sang "${statusLabels[newStatus]}"`,
      actor: currentUser?.name || "System",
      timestamp: new Date().toISOString(),
    }
  });

  return res.json(project);
});

// ===== Admin =====
router.get("/admin/stats", (_req, res) => {
  const usersByRole = ["student", "instructor", "enterprise", "admin"].map((r) => ({
    role: r,
    count: users.filter((u) => u.role === r).length + (r === "student" ? 230 : r === "instructor" ? 28 : r === "enterprise" ? 47 : 5),
  }));
  const projectsByStatus = ["planning", "in_progress", "review", "completed", "at_risk"].map((s) => ({
    status: s,
    count: projects.filter((p) => p.status === s).length + (s === "completed" ? 42 : 0),
  }));
  res.json({
    totalUsers: usersByRole.reduce((a, b) => a + b.count, 0),
    activeProjects: projects.length + 24,
    totalTopics: topics.length + 156,
    dailyActiveUsers: 1247,
    pendingApprovals: users.filter((u) => u.status === "pending").length,
    openReports: moderation.filter((m) => m.status === "pending").length,
    errorRate: 0.4,
    usersByRole,
    projectsByStatus,
    recentActivity: [
      { id: "ev_1", event: "Đăng ký mới: VNG Corporation (chờ duyệt)", timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: "ev_2", event: "Tạo dự án mới: EduPath", timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
      { id: "ev_3", event: "Báo cáo nội dung: 'Bình luận trên dự án EduPath'", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: "ev_4", event: "Sync GitHub Trending hoàn tất", timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: "ev_5", event: "FPT Software phát hành đề tài mới", timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
    ],
  });
});

router.get("/admin/users", (req, res) => {
  const status = req.query.status as string | undefined;
  let items = users.slice();
  if (status && status !== "all") items = items.filter((u) => u.status === status);
  res.json(items);
});

router.put("/admin/users/:userId/status", (req, res) => {
  const u = users.find((x) => x.id === req.params.userId);
  if (!u) return res.status(404).json({ error: "Not found" });
  u.status = req.body?.status || u.status;
  return res.json(u);
});

router.get("/admin/moderation", (_req, res) => {
  res.json(moderation);
});

router.put("/admin/moderation/:reportId", (req, res) => {
  const m = moderation.find((x) => x.id === req.params.reportId);
  if (!m) return res.status(404).json({ error: "Not found" });
  m.status = req.body?.action === "approve" ? "dismissed" : "resolved";
  return res.json(m);
});

// ===== Analytics =====
router.get("/analytics/overview", (_req, res) => {
  res.json({
    popularDomains: [
      { domain: "AI/ML", count: 87 },
      { domain: "Web Development", count: 76 },
      { domain: "Mobile", count: 54 },
      { domain: "Data Science", count: 48 },
      { domain: "IoT", count: 32 },
      { domain: "Blockchain", count: 19 },
      { domain: "Game Development", count: 15 },
    ],
    trendingSkills: [
      { skill: "LLM/Prompt Engineering", growth: 248 },
      { skill: "Next.js", growth: 187 },
      { skill: "Vector Databases", growth: 165 },
      { skill: "TypeScript", growth: 124 },
      { skill: "Rust", growth: 98 },
      { skill: "Flutter", growth: 76 },
      { skill: "Tailwind CSS", growth: 64 },
    ],
    projectSuccessRate: 87.4,
    skillGaps: [
      { skill: "Kubernetes", gap: 64 },
      { skill: "MLOps", gap: 58 },
      { skill: "Cybersecurity", gap: 51 },
      { skill: "System Design", gap: 47 },
      { skill: "Cloud Architecture", gap: 42 },
    ],
    semesterTrend: [
      { period: "HK1 2023", projects: 87, success: 78 },
      { period: "HK2 2023", projects: 102, success: 82 },
      { period: "HK1 2024", projects: 124, success: 85 },
      { period: "HK2 2024", projects: 138, success: 87 },
      { period: "HK1 2025", projects: 156, success: 89 },
      { period: "HK2 2025", projects: 171, success: 88 },
    ],
  });
});

// ── Users search ────────────────────────────────────────────────────────────
router.get("/users/search", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const q = typeof req.query.q === "string" ? req.query.q.toLowerCase().trim() : "";

  const where: any = { id: { not: uid } };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { organization: { contains: q, mode: 'insensitive' } },
    ];
  }

  const results = await prisma.user.findMany({ where, take: 30 });

  // Get conversations of current user to mark "known" contacts
  const allConvs = await prisma.conversation.findMany({ where: {} });
  const myConvs = allConvs.filter(c => (c.memberIds as string[]).includes(uid));
  const knownIds = new Set(myConvs.flatMap(c => (c.memberIds as string[]).filter(id => id !== uid)));

  res.json(results.map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    organization: u.organization ?? null,
    avatarUrl: u.avatarUrl ?? null,
    known: knownIds.has(u.id),
  })));
});

// ── Conversations ───────────────────────────────────────────────────────────
router.get("/conversations", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }

  // Filter conversations where current user is a member (stored as JSON array)
  const all = await prisma.conversation.findMany({ orderBy: { lastMessageAt: 'desc' } });
  const mine = all.filter(c => {
    const ids = c.memberIds as string[];
    return Array.isArray(ids) && ids.includes(uid);
  });
  res.json(mine);
});

router.post("/conversations", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const body = req.body as { type?: string; name?: string; memberIds?: string[]; projectId?: string };
  
  // Ensure creator is always in memberIds
  const memberIds = Array.from(new Set([...(body.memberIds || []), uid]));

  const conv = await prisma.conversation.create({
    data: {
      type: body.type === "direct" ? "direct" : "group",
      name: body.name || "Cuộc trò chuyện mới",
      memberIds,
      projectId: body.projectId || null,
      lastMessageAt: new Date().toISOString(),
      // Store creator as first member
    }
  });
  res.status(201).json(conv);
});

router.get("/conversations/:conversationId/members", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }

  const conv = await prisma.conversation.findUnique({ where: { id: req.params.conversationId } });
  if (!conv) return res.status(404).json({ error: "Not found" });

  const memberIds = conv.memberIds as string[];
  if (!memberIds.includes(uid)) return res.status(403).json({ error: "Forbidden" });

  const members = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, avatarUrl: true, role: true, organization: true },
  });

  // First member in array is the creator
  const creatorId = memberIds[0];
  const result = members.map(m => ({
    ...m,
    isCreator: m.id === creatorId,
  }));
  res.json(result);
});

router.get("/conversations/:conversationId/messages", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }

  // Check membership before returning messages
  const conv = await prisma.conversation.findUnique({ where: { id: req.params.conversationId } });
  if (!conv) return res.status(404).json({ error: "Conversation not found" });
  const memberIds = conv.memberIds as string[];
  if (!memberIds.includes(uid)) return res.status(403).json({ error: "Forbidden: you are not a member" });

  const msgs = await prisma.message.findMany({
    where: { conversationId: req.params.conversationId },
    orderBy: { sentAt: 'asc' }
  });
  res.json(msgs);
});

router.post("/conversations/:conversationId/messages", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const convId = req.params.conversationId!;
  const content = req.body?.content;
  if (!content) { res.status(400).json({ error: "content is required" }); return; }
  
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return res.status(401).json({ error: "User not found" });

  const msg = await prisma.message.create({
    data: {
      conversationId: convId,
      senderId: uid,
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      content,
    }
  });

  await prisma.conversation.update({
    where: { id: convId },
    data: {
      lastMessage: content,
      lastMessageAt: new Date().toISOString(),
    }
  });

  res.status(201).json(msg);
});

router.delete("/conversations/:conversationId/messages/:messageId", async (req, res) => {
  const uid = req.session.userId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { conversationId, messageId } = req.params as { conversationId: string; messageId: string };

  // Check membership
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return res.status(404).json({ error: "Conversation not found" });
  if (!(conv.memberIds as string[]).includes(uid)) return res.status(403).json({ error: "Forbidden" });

  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg) return res.status(404).json({ error: "Message not found" });
  if (msg.senderId !== uid) return res.status(403).json({ error: "Not your message" });

  await prisma.message.delete({ where: { id: messageId } });

  // Update lastMessage on conversation
  const last = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { sentAt: 'desc' }
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: last?.content ?? null, lastMessageAt: last ? last.sentAt.toISOString() : null }
  });

  res.status(204).end();
});

export default router;
