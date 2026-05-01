import { Router, type IRouter } from "express";
import multer from "multer";
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
  sessionState,
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

const router: IRouter = Router();

function currentUser() {
  if (!sessionState.currentUserId) return null;
  return users.find((u) => u.id === sessionState.currentUserId) ?? null;
}

function safeCurrentUser() {
  return currentUser() ?? users[0]!;
}

// ===== Session =====
router.get("/session/me", (_req, res) => {
  const user = currentUser();
  if (!user) { res.status(401).json({ error: "Chưa đăng nhập" }); return; }
  res.json(user);
});

router.post("/session/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) { res.status(400).json({ error: "Email và mật khẩu không được để trống" }); return; }
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) { res.status(401).json({ error: "Email hoặc mật khẩu không đúng" }); return; }
  const storedPassword = userPasswords[user.email];
  if (!storedPassword || storedPassword !== password) { res.status(401).json({ error: "Email hoặc mật khẩu không đúng" }); return; }
  sessionState.currentUserId = user.id;
  res.json(user);
});

router.post("/session/logout", (_req, res) => {
  sessionState.currentUserId = null;
  res.json({ ok: true });
});

router.put("/session/me", (req, res) => {
  if (!sessionState.currentUserId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const role = req.body?.role as string;
  const map: Record<string, string> = {
    student: "u_student",
    instructor: "u_instructor",
    enterprise: "u_enterprise",
    alumni: "u_alumni",
    admin: "u_admin",
  };
  if (map[role]) {
    sessionState.currentUserId = map[role]!;
  }
  res.json(currentUser());
});

router.post("/users", (req, res) => {
  const { name, email, password, role } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    return;
  }
  const exists = users.find((u) => u.email === email);
  if (exists) {
    res.status(409).json({ error: "Email đã được sử dụng" });
    return;
  }
  const validRoles = ["student", "instructor", "enterprise", "alumni", "admin"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: "Vai trò không hợp lệ" });
    return;
  }
  const newUser = {
    id: `u_new_${Date.now()}`,
    name,
    email,
    role: role as "student" | "instructor" | "enterprise" | "alumni" | "admin",
    status: "active" as const,
    avatarUrl: null,
    organization: null,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  userPasswords[email] = password;
  sessionState.currentUserId = newUser.id;
  res.status(201).json(newUser);
});

// ===== Skills & Portfolio =====
router.get("/skills", (_req, res) => {
  res.json(skills);
});

router.get("/portfolios/:userId", (req, res) => {
  const userId = req.params.userId;
  const u = users.find((x) => x.id === userId);
  let p = portfolios[userId];
  if (!p) {
    if (!u) return res.status(404).json({ error: "Not found" });
    p = {
      userId: u.id,
      role: u.role,
      name: u.name,
      avatarUrl: null,
      bio: "",
      major: null,
      year: null,
      interests: [],
      skills: [],
      certifications: [],
      completedProjects: 0,
      contributionScore: 0,
      publicVisible: false,
      portfolioUrl: null,
    };
    portfolios[userId] = p;
  }
  return res.json({ ...p, role: u?.role ?? p.role });
});

router.put("/portfolios/:userId", (req, res) => {
  const userId = req.params.userId;
  const u = users.find((x) => x.id === userId);
  const existing = portfolios[userId] || {
    userId,
    role: u?.role,
    name: u?.name || "Người dùng",
    avatarUrl: null,
    bio: "",
    major: null,
    year: null,
    interests: [],
    skills: [],
    certifications: [],
    completedProjects: 0,
    contributionScore: 0,
    publicVisible: true,
    portfolioUrl: null,
  };
  const updated: Portfolio = {
    ...existing,
    role: u?.role ?? existing.role,
    bio: req.body?.bio ?? existing.bio,
    major: req.body?.major ?? existing.major,
    year: req.body?.year ?? existing.year,
    interests: req.body?.interests ?? existing.interests,
    skills: req.body?.skills ?? existing.skills,
    publicVisible: req.body?.publicVisible ?? existing.publicVisible,
    instructorProfile: req.body?.instructorProfile
      ? { ...(existing.instructorProfile || { expertise: [], focusDomains: [], mentoredTeamCount: 0, advisedTopicCount: 0, publications: [] }), ...req.body.instructorProfile }
      : existing.instructorProfile,
    enterpriseProfile: req.body?.enterpriseProfile
      ? { ...(existing.enterpriseProfile || { sponsoredBriefCount: 0, adoptedProjectCount: 0, placedStudentCount: 0, focusAreas: [], offeredBenefits: [] }), ...req.body.enterpriseProfile }
      : existing.enterpriseProfile,
  };
  portfolios[userId] = updated;
  res.json(updated);
});

// ===== Topics =====
router.get("/topics", (req, res) => {
  const q = (req.query.q as string | undefined)?.toLowerCase();
  const domain = req.query.domain as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const source = req.query.source as string | undefined;
  const sort = (req.query.sort as string | undefined) || "relevance";

  let items = topics.slice();
  if (q) {
    items = items.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.problemDescription.toLowerCase().includes(q) ||
        t.technologies.some((x) => x.toLowerCase().includes(q)),
    );
  }
  if (domain && domain !== "all") items = items.filter((t) => t.domain === domain);
  if (difficulty && difficulty !== "all") items = items.filter((t) => t.difficulty === difficulty);
  if (source && source !== "all") items = items.filter((t) => t.source === source);

  if (sort === "recent") items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  else if (sort === "popular") items.sort((a, b) => b.popularity - a.popularity);
  else if (sort === "score") items.sort((a, b) => b.completeness - a.completeness);

  res.json({ items, total: items.length });
});

router.post("/topics", (req, res) => {
  const body = req.body || {};
  const newTopic: Topic = {
    id: `tp_${String(topics.length + 1).padStart(3, "0")}`,
    title: body.title || "Đề tài mới",
    problemDescription: body.problemDescription || "",
    objectives: body.objectives || [],
    technologies: body.technologies || [],
    domain: body.domain || "Web Development",
    difficulty: body.difficulty || "intermediate",
    source: "student",
    sourceLabel: safeCurrentUser().name,
    requiredSkills: body.requiredSkills || [],
    teamSize: body.teamSize || 3,
    feasibility: "Khả thi",
    popularity: 0,
    createdAt: new Date().toISOString(),
    completeness:
      0.6 +
      (body.problemDescription?.length > 200 ? 0.15 : 0) +
      ((body.objectives || []).length >= 2 ? 0.1 : 0) +
      ((body.technologies || []).length >= 3 ? 0.15 : 0),
  };
  topics.unshift(newTopic);
  res.status(201).json(newTopic);
});

router.get("/topics/recommend", (req, res) => {
  const u = safeCurrentUser();
  const portfolio = portfolios[u.id];
  const userSkills = new Set((portfolio?.skills || []).map((s) => s.skillId));
  const userInterests = new Set((portfolio?.interests || []).map((i) => i.toLowerCase()));
  const domainFilter = req.query.domain as string | undefined;
  const difficultyFilter = req.query.difficulty as string | undefined;

  let items = topics.slice();
  if (domainFilter && domainFilter !== "all") items = items.filter((t) => t.domain === domainFilter);
  if (difficultyFilter && difficultyFilter !== "all")
    items = items.filter((t) => t.difficulty === difficultyFilter);

  const scored = items.map((t) => {
    const matchingSkills = t.requiredSkills.filter((s) => userSkills.has(s));
    const missingSkills = t.requiredSkills.filter((s) => !userSkills.has(s));
    const sms = t.requiredSkills.length === 0 ? 0.5 : matchingSkills.length / t.requiredSkills.length;
    const ias =
      [...userInterests].filter((i) => t.domain.toLowerCase().includes(i) || i.includes(t.domain.toLowerCase()))
        .length > 0
        ? 0.85
        : 0.45;
    const pqs = Math.min(1, t.completeness * 0.7 + Math.min(t.popularity / 200, 1) * 0.3);
    const hybrid = 0.4 * sms + 0.35 * ias + 0.25 * pqs;
    const matchingNames = matchingSkills.map(
      (sid) => skills.find((s) => s.id === sid)?.name || sid,
    );
    const missingNames = missingSkills.map((sid) => skills.find((s) => s.id === sid)?.name || sid);
    return {
      topic: t,
      hybridScore: Math.round(hybrid * 1000) / 1000,
      skillMatchScore: Math.round(sms * 1000) / 1000,
      interestAlignmentScore: Math.round(ias * 1000) / 1000,
      projectQualityScore: Math.round(pqs * 1000) / 1000,
      matchingSkills: matchingNames,
      missingSkills: missingNames,
      difficultyEstimate:
        t.difficulty === "advanced" ? "Nâng cao" : t.difficulty === "intermediate" ? "Trung bình" : "Cơ bản",
    };
  });
  scored.sort((a, b) => b.hybridScore - a.hybridScore);
  res.json(scored.slice(0, 24));
});

router.get("/topics/:topicId", (req, res) => {
  const t = topics.find((x) => x.id === req.params.topicId);
  if (!t) return res.status(404).json({ error: "Not found" });
  return res.json(t);
});

router.post("/topics/ai-generate", (req, res) => {
  const u = safeCurrentUser();
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
router.get("/calls", (req, res) => {
  const status = req.query.status as string | undefined;
  let items = calls.slice();
  if (status && status !== "all") items = items.filter((c) => c.status === status);
  res.json(items);
});

router.post("/calls", (req, res) => {
  const body = req.body || {};
  const u = safeCurrentUser();
  const newCall: CallForProject = {
    id: `cf_${String(calls.length + 1).padStart(3, "0")}`,
    title: body.title || "Đặt hàng mới",
    enterpriseName: u.organization || u.name,
    enterpriseLogo: null,
    problemDescription: body.problemDescription || "",
    requirements: body.requirements || [],
    timeline: body.timeline || "12 tuần",
    benefits: body.benefits || "",
    budget: body.budget || null,
    status: u.role === "enterprise" && u.status === "active" ? "published" : "pending",
    postedAt: new Date().toISOString(),
    deadline: body.deadline || null,
    applicationCount: 0,
    skillTags: body.skillTags || [],
  };
  calls.unshift(newCall);
  res.status(201).json(newCall);
});

router.get("/calls/:callId", (req, res) => {
  const c = calls.find((x) => x.id === req.params.callId);
  if (!c) return res.status(404).json({ error: "Not found" });
  return res.json(c);
});

router.post("/calls/:callId/apply", (req, res) => {
  const c = calls.find((x) => x.id === req.params.callId);
  if (!c) return res.status(404).json({ error: "Not found" });
  c.applicationCount += 1;
  return res.json({
    id: `ap_${Date.now()}`,
    callId: c.id,
    applicantName: safeCurrentUser().name,
    message: req.body?.message || "",
    status: "submitted",
    appliedAt: new Date().toISOString(),
  });
});

// ===== Teams =====
router.get("/teams/recommend", (req, res) => {
  const u = safeCurrentUser();
  const myPortfolio = portfolios[u.id];
  const mySkills = new Set((myPortfolio?.skills || []).map((s) => s.skillId));
  const topicId = req.query.topicId as string | undefined;
  const topic = topicId ? topics.find((t) => t.id === topicId) : null;
  const required = new Set(topic?.requiredSkills || []);

  const candidates = users.filter(
    (x) => x.role === "student" && x.id !== u.id && portfolios[x.id],
  );
  const recs = candidates.map((c) => {
    const cp = portfolios[c.id]!;
    const cSkills = new Set(cp.skills.map((s) => s.skillId));
    const shared = [...cSkills].filter((s) => mySkills.has(s));
    const complementary = [...cSkills].filter((s) => !mySkills.has(s));
    const fillsGap = topic ? [...required].filter((s) => !mySkills.has(s) && cSkills.has(s)).length : 0;
    const score =
      Math.min(1, complementary.length / 5) * 0.5 + (fillsGap > 0 ? 0.4 : 0.1) + Math.min(1, cp.contributionScore / 100) * 0.1;
    const sharedNames = shared.map((s) => skills.find((sk) => sk.id === s)?.name || s);
    const compNames = complementary.map((s) => skills.find((sk) => sk.id === s)?.name || s);
    const role =
      cp.skills.some((s) => s.skillId === "sk_figma" || s.skillId === "sk_uxui")
        ? "UI/UX Designer"
        : cp.skills.some((s) => s.skillId === "sk_node" || s.skillId === "sk_express")
          ? "Backend Developer"
          : cp.skills.some((s) => s.skillId === "sk_flutter" || s.skillId === "sk_reactnative")
            ? "Mobile Developer"
            : cp.skills.some((s) => s.skillId === "sk_python" && cp.skills.some((y) => y.skillId === "sk_ml"))
              ? "ML Engineer"
              : "Full-stack Developer";
    return {
      user: c,
      complementarityScore: Math.round(score * 100) / 100,
      sharedSkills: sharedNames,
      complementarySkills: compNames,
      suggestedRole: role,
      gapAnalysis: fillsGap > 0
        ? `Lấp được ${fillsGap} kỹ năng còn thiếu cho đề tài này`
        : `Bổ sung ${complementary.length} kỹ năng mới cho nhóm`,
    };
  });
  recs.sort((a, b) => b.complementarityScore - a.complementarityScore);
  res.json(recs);
});

// ===== Projects =====
router.get("/projects", (_req, res) => {
  res.json(projects);
});

router.post("/projects", (req, res) => {
  const body = req.body || {};
  const topic = topics.find((t) => t.id === body.topicId);
  const newProject: Project = {
    id: `pj_${String(projects.length + 1).padStart(3, "0")}`,
    name: body.name || "Dự án mới",
    topicTitle: topic?.title || "Đề tài",
    status: "planning",
    progress: 0,
    memberCount: (body.memberIds || []).length || 1,
    instructorName: "TS. Trần Quốc Bảo",
    dueDate: body.dueDate || new Date(Date.now() + 90 * 86400000).toISOString(),
    milestoneCount: 5,
    completedMilestones: 0,
  };
  projects.unshift(newProject);
  projectDetails[newProject.id] = {
    project: newProject,
    members: (body.memberIds || [safeCurrentUser().id]).map((uid: string, i: number) => {
      const u = users.find((x) => x.id === uid);
      return {
        userId: uid,
        name: u?.name || "Sinh viên",
        avatarUrl: null,
        role: i === 0 ? "Trưởng nhóm" : "Thành viên",
        contributionPct: Math.round((100 / (body.memberIds?.length || 1)) * 10) / 10,
      };
    }),
    milestones: [],
    description: `Dự án mới được tạo với đề tài: ${topic?.title || ""}`,
    recentActivity: [
      { id: `act_${Date.now()}`, message: "Đã tạo workspace dự án", timestamp: new Date().toISOString(), actor: safeCurrentUser().name },
    ],
  };
  contributions[newProject.id] = projectDetails[newProject.id]!.members.map((m) => ({
    userId: m.userId,
    name: m.name,
    avatarUrl: null,
    tasksCompleted: 0,
    commits: 0,
    documents: 0,
    meetingsAttended: 0,
    percentage: m.contributionPct,
    peerRating: 0,
  }));
  res.status(201).json(newProject);
});

router.get("/projects/:projectId", (req, res) => {
  const d = projectDetails[req.params.projectId!];
  if (!d) return res.status(404).json({ error: "Not found" });
  return res.json(d);
});

router.get("/projects/:projectId/tasks", (req, res) => {
  const items = tasks.filter((t) => t.projectId === req.params.projectId);
  res.json(items);
});

router.post("/projects/:projectId/tasks", (req, res) => {
  const projectId = req.params.projectId!;
  const body = req.body || {};
  const newTask: Task = {
    id: `tk_${projectId}_${Date.now()}`,
    projectId,
    title: body.title || "Công việc mới",
    description: body.description || null,
    status: body.status || "todo",
    assigneeId: body.assigneeId || null,
    assigneeName: users.find((u) => u.id === body.assigneeId)?.name || "Chưa giao",
    dueDate: body.dueDate || null,
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

router.put("/tasks/:taskId", (req, res) => {
  const t = tasks.find((x) => x.id === req.params.taskId);
  if (!t) return res.status(404).json({ error: "Not found" });
  const body = req.body || {};
  if (body.title !== undefined) t.title = body.title;
  if (body.description !== undefined) t.description = body.description;
  if (body.status !== undefined) t.status = body.status;
  if (body.assigneeId !== undefined) {
    t.assigneeId = body.assigneeId;
    t.assigneeName = users.find((u) => u.id === body.assigneeId)?.name || "Chưa giao";
  }
  if (body.dueDate !== undefined) t.dueDate = body.dueDate;
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
      uploadedBy: safeCurrentUser().name,
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

router.get("/projects/:projectId/contributions", (req, res) => {
  const items = contributions[req.params.projectId!] || [];
  res.json(items);
});

router.get("/instructor/dashboard", (_req, res) => {
  const atRiskCount = projects.filter((p) => p.status === "at_risk").length;
  res.json({
    totalProjects: projects.length,
    atRiskCount,
    completedThisSemester: 12,
    upcomingDeadlines: projects.slice(0, 5).map((p) => ({
      projectId: p.id,
      projectName: p.name,
      milestone: "Phát triển MVP",
      dueDate: p.dueDate,
    })),
    projects,
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
function pushNotification(input: Omit<Notification, "id" | "read" | "createdAt"> & { read?: boolean }): Notification {
  const n: Notification = {
    id: `nt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: input.title,
    body: input.body,
    type: input.type,
    read: input.read ?? false,
    createdAt: new Date().toISOString(),
    link: input.link ?? null,
  };
  notifications.unshift(n);
  return n;
}

router.get("/notifications", (_req, res) => {
  res.json(notifications);
});

router.post("/notifications/:notificationId/read", (req, res) => {
  const n = notifications.find((x) => x.id === req.params.notificationId) as Notification | undefined;
  if (!n) return res.status(404).json({ error: "Not found" });
  n.read = true;
  return res.json(n);
});

router.post("/notifications/read-all", (_req, res) => {
  let count = 0;
  for (const n of notifications) {
    if (!n.read) { n.read = true; count++; }
  }
  res.json({ count });
});

// Push notification: team invitation
router.post("/teams/invite", (req, res) => {
  const body = req.body || {};
  const topicTitle = String(body.topicTitle || "đề tài").slice(0, 200);
  const inviterName = String(body.inviterName || "Một sinh viên").slice(0, 100);
  const message = body.message ? String(body.message).slice(0, 200) : null;
  const n = pushNotification({
    title: "Lời mời tham gia nhóm",
    body: message
      ? `${inviterName} mời bạn tham gia nhóm cho đề tài "${topicTitle}". Lời nhắn: ${message}`
      : `${inviterName} mời bạn tham gia nhóm cho đề tài "${topicTitle}".`,
    type: "team",
    link: "/teams",
  });
  res.status(201).json(n);
});

// Push notification: project status update
router.put("/projects/:projectId/status", (req, res) => {
  const id = req.params.projectId!;
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const project = projects[idx]!;
  const newStatus = String(req.body?.status || "") as Project["status"];
  const allowed: Project["status"][] = ["planning", "in_progress", "review", "completed", "at_risk"];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const oldStatus = project.status;
  project.status = newStatus;
  if (projectDetails[id]) {
    projectDetails[id]!.project = project;
    projectDetails[id]!.recentActivity.unshift({
      id: `act_${Date.now()}`,
      message: `Trạng thái dự án chuyển từ "${oldStatus}" sang "${newStatus}"`,
      timestamp: new Date().toISOString(),
      actor: safeCurrentUser().name,
    });
  }
  const statusLabels: Record<string, string> = {
    planning: "Đang lập kế hoạch",
    in_progress: "Đang triển khai",
    review: "Chờ đánh giá",
    completed: "Đã hoàn thành",
    at_risk: "Cảnh báo trễ tiến độ",
  };
  const note = req.body?.note ? ` Ghi chú: ${String(req.body.note).slice(0, 200)}` : "";
  pushNotification({
    title: `Cập nhật trạng thái: ${project.name}`,
    body: `Trạng thái dự án đã chuyển sang "${statusLabels[newStatus]}".${note}`,
    type: "milestone",
    link: `/projects/${id}`,
  });
  return res.json(project);
});

// ===== Admin =====
router.get("/admin/stats", (_req, res) => {
  const usersByRole = ["student", "instructor", "enterprise", "alumni", "admin"].map((r) => ({
    role: r,
    count: users.filter((u) => u.role === r).length + (r === "student" ? 230 : r === "instructor" ? 28 : r === "enterprise" ? 47 : r === "alumni" ? 84 : 5),
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
router.get("/users/search", (req, res) => {
  const uid = sessionState.currentUserId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const q = typeof req.query.q === "string" ? req.query.q.toLowerCase().trim() : "";

  const knownIds = new Set<string>();
  conversations.forEach((conv) => {
    if (conv.memberIds.includes(uid)) {
      conv.memberIds.forEach((id) => {
        if (id !== uid) knownIds.add(id);
      });
    }
  });

  const results = users
    .filter((u) => u.id !== uid)
    .filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.organization ?? "").toLowerCase().includes(q),
    )
    .map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      organization: u.organization ?? null,
      avatarUrl: u.avatarUrl ?? null,
      known: knownIds.has(u.id),
    }))
    .sort((a, b) => Number(b.known) - Number(a.known));

  res.json(results);
});

// ── Conversations ───────────────────────────────────────────────────────────
router.get("/conversations", (_req, res) => {
  const uid = sessionState.currentUserId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const myConvs = conversations
    .filter((c) => c.memberIds.includes(uid))
    .sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
  res.json(myConvs);
});

router.post("/conversations", (req, res) => {
  const uid = sessionState.currentUserId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const body = req.body as { type?: string; name?: string; memberIds?: string[]; projectId?: string };
  const type = body.type === "direct" ? "direct" : "group";
  const memberIds: string[] = Array.isArray(body.memberIds) ? body.memberIds : [];
  if (!memberIds.includes(uid)) memberIds.push(uid);
  const name = body.name ? String(body.name).slice(0, 100) : "Cuộc trò chuyện mới";
  const conv = {
    id: `conv_${Date.now()}`,
    type: type as "group" | "direct",
    name,
    avatarUrl: null,
    memberIds,
    projectId: body.projectId ? String(body.projectId) : null,
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
  };
  conversations.push(conv);
  chatMessages.set(conv.id, []);
  res.status(201).json(conv);
});

router.get("/conversations/:conversationId/messages", (req, res) => {
  const uid = sessionState.currentUserId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const convId = String(req.params["conversationId"] ?? "");
  const conv = conversations.find((c) => c.id === convId);
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (!conv.memberIds.includes(uid)) { res.status(403).json({ error: "Forbidden" }); return; }
  conv.unreadCount = 0;
  const msgs = chatMessages.get(convId) ?? [];
  res.json(msgs);
});

router.post("/conversations/:conversationId/messages", (req, res) => {
  const uid = sessionState.currentUserId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const convId = String(req.params["conversationId"] ?? "");
  const conv = conversations.find((c) => c.id === convId);
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (!conv.memberIds.includes(uid)) { res.status(403).json({ error: "Forbidden" }); return; }
  const content = req.body?.content ? String(req.body.content).slice(0, 2000) : null;
  if (!content) { res.status(400).json({ error: "content is required" }); return; }
  const sender = users.find((u) => u.id === uid)!;
  const msg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId: convId,
    senderId: uid,
    senderName: sender.name,
    senderAvatar: sender.avatarUrl,
    content,
    sentAt: new Date().toISOString(),
    edited: false,
  };
  const list = chatMessages.get(convId) ?? [];
  list.push(msg);
  chatMessages.set(convId, list);
  conv.lastMessage = content;
  conv.lastMessageAt = msg.sentAt;
  res.status(201).json(msg);
});

router.delete("/conversations/:conversationId/messages/:messageId", (req, res) => {
  const uid = sessionState.currentUserId;
  if (!uid) { res.status(401).json({ error: "Not authenticated" }); return; }
  const convId = String(req.params["conversationId"] ?? "");
  const msgId = String(req.params["messageId"] ?? "");
  const conv = conversations.find((c) => c.id === convId);
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (!conv.memberIds.includes(uid)) { res.status(403).json({ error: "Forbidden" }); return; }
  const list = chatMessages.get(convId) ?? [];
  const idx = list.findIndex((m) => m.id === msgId);
  if (idx === -1) { res.status(404).json({ error: "Message not found" }); return; }
  if (list[idx]!.senderId !== uid) { res.status(403).json({ error: "Not your message" }); return; }
  list.splice(idx, 1);
  chatMessages.set(convId, list);
  const last = list[list.length - 1];
  conv.lastMessage = last?.content ?? null;
  conv.lastMessageAt = last?.sentAt ?? null;
  res.status(204).end();
});

export default router;
