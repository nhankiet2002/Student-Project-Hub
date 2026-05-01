import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const now = new Date();
function daysAgo(d: number) {
  return new Date(now.getTime() - d * 86400000);
}
function daysFromNow(d: number) {
  return new Date(now.getTime() + d * 86400000).toISOString();
}

async function main() {
  console.log('Seeding demo data...');

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectActivity.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.callForProject.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const usersData = [
    { id: 'u_student', name: 'Nguyễn Minh Anh', email: 'minhanh@student.edu.vn', role: 'student', organization: 'Đại học Bách Khoa Hà Nội' },
    { id: 'u_instructor', name: 'TS. Trần Quốc Bảo', email: 'qbao@edu.vn', role: 'instructor', organization: 'Khoa Công nghệ Thông tin' },
    { id: 'u_enterprise', name: 'FPT Software', email: 'partner@fpt-software.vn', role: 'enterprise', organization: 'FPT Software' },
    { id: 'u_admin', name: 'Lê Văn Cường', email: 'admin@promatch.vn', role: 'admin', organization: 'PROMATCH' },
    { id: 'u_s2', name: 'Đỗ Hoàng Long', email: 'hoanglong@student.edu.vn', role: 'student', organization: 'Đại học Bách Khoa Hà Nội' },
    { id: 'u_s3', name: 'Vũ Thị Hương', email: 'huongvu@student.edu.vn', role: 'student', organization: 'Đại học Bách Khoa Hà Nội' },
    { id: 'u_s4', name: 'Bùi Đức Thắng', email: 'ducthang@student.edu.vn', role: 'student', organization: 'Đại học Bách Khoa Hà Nội' },
    { id: 'u_s5', name: 'Phan Mai Linh', email: 'mailinh@student.edu.vn', role: 'student', organization: 'Đại học Bách Khoa Hà Nội' },
  ];

  for (const u of usersData) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: 'password123',
        role: u.role,
        organization: u.organization,
        status: 'active',
        createdAt: daysAgo(100),
      }
    });
  }

  // 2. Create Portfolios
  await prisma.portfolio.create({
    data: {
      userId: 'u_student',
      name: 'Nguyễn Minh Anh',
      bio: 'Sinh viên năm 4 ngành Khoa học máy tính, đam mê phát triển sản phẩm AI ứng dụng vào giáo dục.',
      major: 'Khoa học Máy tính',
      year: 4,
      interests: ['AI/ML', 'Giáo dục', 'Phát triển web'],
      skills: [
        { name: 'React', level: 'advanced' },
        { name: 'TypeScript', level: 'intermediate' },
        { name: 'Python', level: 'advanced' },
      ],
      completedProjects: 3,
      contributionScore: 87,
    }
  });

  await prisma.portfolio.create({
    data: {
      userId: 'u_instructor',
      name: 'TS. Trần Quốc Bảo',
      bio: 'Tiến sĩ ngành Khoa học Máy tính, hơn 12 năm giảng dạy và hướng dẫn đồ án tốt nghiệp.',
      instructorProfile: {
        title: 'Tiến sĩ',
        department: 'Khoa Công nghệ Thông tin',
        yearsTeaching: 12,
        mentoringStatement: 'Tôi tin rằng đồ án tốt nghiệp là cơ hội để sinh viên giải quyết một bài toán có người dùng thật.',
        officeHours: 'Thứ 3 & Thứ 5, 14:00 - 16:30',
        contactEmail: 'qbao@edu.vn',
        expertise: ['Machine Learning', 'NLP', 'Hệ khuyến nghị'],
        focusDomains: ['AI giáo dục', 'Y tế thông minh'],
        mentoredTeamCount: 47,
        advisedTopicCount: 18,
        avgTeamRating: 4.7,
        availableSlots: 2,
      },
    }
  });

  await prisma.portfolio.create({
    data: {
      userId: 'u_enterprise',
      name: 'FPT Software',
      bio: 'FPT Software là công ty phần mềm hàng đầu Việt Nam.',
      enterpriseProfile: {
        industry: 'Công nghệ thông tin',
        size: '30.000+ nhân sự',
        website: 'https://fpt-software.com',
        partnerSince: 2019,
        sponsoredBriefCount: 24,
        adoptedProjectCount: 9,
        placedStudentCount: 31,
        focusAreas: ['AI & Generative AI', 'Cloud-native'],
      },
    }
  });

  // 3. Create Topics (10 items)
  const topicNames = [
    { title: 'Hệ thống gợi ý lộ trình học tập cá nhân hóa', domain: 'AI/ML', difficulty: 'advanced' },
    { title: 'Ứng dụng di động theo dõi sức khỏe tinh thần', domain: 'Mobile', difficulty: 'intermediate' },
    { title: 'Nền tảng IoT giám sát chất lượng không khí', domain: 'IoT', difficulty: 'intermediate' },
    { title: 'Hệ thống phát hiện gian lận thi cử bằng Computer Vision', domain: 'AI/ML', difficulty: 'advanced' },
    { title: 'Marketplace kết nối sinh viên freelance', domain: 'Web Development', difficulty: 'intermediate' },
    { title: 'Chatbot tư vấn tuyển sinh đa ngôn ngữ dùng LLM', domain: 'AI/ML', difficulty: 'intermediate' },
    { title: 'Trò chơi giáo dục AR học từ vựng tiếng Anh', domain: 'Game Development', difficulty: 'advanced' },
    { title: 'Hệ thống quản lý đồ án dựa trên blockchain', domain: 'Blockchain', difficulty: 'advanced' },
    { title: 'Dashboard phân tích dữ liệu học vụ thời gian thực', domain: 'Data Science', difficulty: 'intermediate' },
    { title: 'Ứng dụng web đặt phòng học nhóm', domain: 'Web Development', difficulty: 'beginner' },
  ];

  for (const t of topicNames) {
    await prisma.topic.create({
      data: {
        title: t.title,
        domain: t.domain,
        difficulty: t.difficulty,
        problemDescription: `Mô tả chi tiết bài toán cho ${t.title}. Giải quyết các thách thức về hiệu năng và trải nghiệm người dùng.`,
        source: 'instructor',
        sourceLabel: 'TS. Trần Quốc Bảo',
        teamSize: 3 + Math.floor(Math.random() * 2),
        objectives: ['Nghiên cứu yêu cầu', 'Thiết kế hệ thống', 'Phát triển MVP'],
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        popularity: Math.floor(Math.random() * 200),
        completeness: Math.random(),
      }
    });
  }

  // 4. Create Projects (10 items)
  for (let i = 1; i <= 10; i++) {
    const pj = await prisma.project.create({
      data: {
        id: `pj_${String(i).padStart(3, "0")}`,
        name: `Dự án Demo ${i}`,
        topicId: `demo_tp_${i}`,
        topicTitle: topicNames[i-1]?.title || 'Đề tài mẫu',
        status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in_progress' : 'planning',
        progress: i * 10,
        memberCount: 3,
        instructorName: 'TS. Trần Quốc Bảo',
        dueDate: daysFromNow(30 + i * 10),
        milestoneCount: 5,
        completedMilestones: Math.floor(i / 2),
        description: `Mô tả cho dự án demo số ${i}.`,
      }
    });

    // Members for each project
    await prisma.projectMember.createMany({
      data: [
        { projectId: pj.id, userId: 'u_student', name: 'Nguyễn Minh Anh', role: 'Trưởng nhóm', contributionPct: 34 },
        { projectId: pj.id, userId: 'u_s2', name: 'Đỗ Hoàng Long', role: 'Backend', contributionPct: 33 },
        { projectId: pj.id, userId: 'u_s3', name: 'Vũ Thị Hương', role: 'Frontend', contributionPct: 33 },
      ]
    });

    // Tasks for each project
    await prisma.task.createMany({
      data: [
        { projectId: pj.id, title: `Task 1 cho dự án ${i}`, status: 'done', assigneeId: 'u_s2', assigneeName: 'Đỗ Hoàng Long', dueDate: daysFromNow(5) },
        { projectId: pj.id, title: `Task 2 cho dự án ${i}`, status: 'in_progress', assigneeId: 'u_s3', assigneeName: 'Vũ Thị Hương', dueDate: daysFromNow(10) },
      ]
    });

    // Milestones for each project
    await prisma.milestone.createMany({
      data: [
        { projectId: pj.id, name: 'Khởi động', dueDate: daysFromNow(-10), status: 'completed' },
        { projectId: pj.id, name: 'Thiết kế', dueDate: daysFromNow(5), status: 'in_progress' },
      ]
    });
  }

  // 5. Create Calls for Projects (10 items)
  const callTitles = [
    'Xây dựng chatbot nội bộ cho FPT',
    'Hệ thống phân tích review cho Tiki',
    'App theo dõi năng lượng cho VNG',
    'Platform đào tạo AI cho Vietcombank',
    'App tour du lịch cho Vietravel',
    'Hệ thống kho vận cho Shopee',
    'Phân tích dữ liệu người dùng cho Grab',
    'App ngân hàng số cho MB Bank',
    'Hệ thống quản lý chuỗi cung ứng cho Vinamilk',
    'Nền tảng học trực tuyến cho Topica',
  ];

  for (let i = 0; i < 10; i++) {
    await prisma.callForProject.create({
      data: {
        title: callTitles[i]!,
        enterpriseName: i % 2 === 0 ? 'FPT Software' : 'Tiki Technology',
        problemDescription: `Bài toán thực tế số ${i+1} cần giải quyết.`,
        requirements: ['Kỹ năng React', 'Kỹ năng Node.js', 'Tiếng Anh tốt'],
        timeline: '12-16 tuần',
        benefits: 'Học bổng và cơ hội thực tập',
        budget: `${100 + i * 10} triệu VNĐ`,
        status: 'published',
        postedAt: daysAgo(10 + i).toISOString(),
        deadline: daysFromNow(30 + i),
        applicationCount: i + 5,
        skillTags: ['Web', 'AI', 'Database'],
      }
    });
  }

  // 6. Create Conversations & Messages
  const conv = await prisma.conversation.create({
    data: {
      id: 'conv_demo_1',
      type: 'group',
      name: 'Nhóm EduPath',
      memberIds: ['u_student', 'u_s2', 'u_s3'],
      lastMessage: 'Chào cả nhóm!',
      lastMessageAt: daysAgo(0).toISOString(),
    }
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conv.id, senderId: 'u_s2', senderName: 'Đỗ Hoàng Long', content: 'Chào mọi người, mình bắt đầu làm task backend nhé.' },
      { conversationId: conv.id, senderId: 'u_student', senderName: 'Nguyễn Minh Anh', content: 'Ok Long, mình sẽ phụ trách setup server.' },
    ]
  });

  // 7. Create Notifications
  for (let i = 1; i <= 10; i++) {
    await prisma.notification.create({
      data: {
        userId: 'u_student',
        title: `Thông báo ${i}`,
        body: `Đây là nội dung thông báo số ${i} dành cho bạn.`,
        type: i % 2 === 0 ? 'milestone' : 'system',
        read: false,
      }
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
