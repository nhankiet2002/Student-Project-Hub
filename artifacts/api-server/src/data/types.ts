export type UserRole = "student" | "instructor" | "enterprise" | "alumni" | "admin";
export type UserStatus = "active" | "suspended" | "pending";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  organization: string | null;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  domain: string;
}

export interface PortfolioSkill {
  skillId: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
}

export interface PastProject {
  id: string;
  title: string;
  role: string;
  year: number;
  semester?: string | null;
  technologies: string[];
  summary: string;
  contributionPct?: number | null;
  rating?: number | null;
  archiveId?: string | null;
}

export interface Publication {
  id: string;
  title: string;
  venue: string;
  year: number;
  url?: string | null;
}

export interface InstructorProfile {
  title?: string | null;
  department?: string | null;
  yearsTeaching?: number | null;
  mentoringStatement?: string | null;
  officeHours?: string | null;
  contactEmail?: string | null;
  expertise: string[];
  focusDomains: string[];
  mentoredTeamCount: number;
  advisedTopicCount: number;
  avgTeamRating?: number | null;
  publications: Publication[];
  availableSlots?: number | null;
}

export interface EnterpriseContact {
  name: string;
  role: string;
  email: string;
  phone?: string | null;
}

export interface EnterpriseProfile {
  industry?: string | null;
  size?: string | null;
  foundedYear?: number | null;
  headquarters?: string | null;
  website?: string | null;
  about?: string | null;
  partnerSince?: number | null;
  sponsoredBriefCount: number;
  adoptedProjectCount: number;
  placedStudentCount: number;
  focusAreas: string[];
  offeredBenefits: string[];
  contactPerson?: EnterpriseContact;
}

export interface Portfolio {
  userId: string;
  role?: UserRole;
  name: string;
  avatarUrl: string | null;
  bio: string;
  major: string | null;
  year: number | null;
  interests: string[];
  skills: PortfolioSkill[];
  certifications: string[];
  completedProjects: number;
  contributionScore: number;
  publicVisible: boolean;
  portfolioUrl: string | null;
  pastProjects?: PastProject[];
  instructorProfile?: InstructorProfile;
  enterpriseProfile?: EnterpriseProfile;
}

export type TopicSource = "instructor" | "enterprise" | "alumni" | "student" | "ai" | "knowledge" | "trend";

export interface Topic {
  id: string;
  title: string;
  problemDescription: string;
  objectives: string[];
  technologies: string[];
  domain: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  source: TopicSource;
  sourceLabel: string | null;
  requiredSkills: string[];
  teamSize: number;
  feasibility: string | null;
  popularity: number;
  createdAt: string;
  completeness: number;
}

export interface CallForProject {
  id: string;
  title: string;
  enterpriseName: string;
  enterpriseLogo: string | null;
  problemDescription: string;
  requirements: string[];
  timeline: string;
  benefits: string;
  budget: string | null;
  status: "pending" | "published" | "closed";
  postedAt: string;
  deadline: string | null;
  applicationCount: number;
  skillTags: string[];
}

export interface ProjectMember {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  contributionPct: number;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  feedback: string | null;
}

export interface Project {
  id: string;
  name: string;
  topicTitle: string;
  status: "planning" | "in_progress" | "review" | "completed" | "at_risk";
  progress: number;
  memberCount: number;
  instructorName: string;
  dueDate: string;
  milestoneCount: number;
  completedMilestones: number;
}

export interface ProjectActivity {
  id: string;
  message: string;
  timestamp: string;
  actor: string | null;
}

export interface ProjectDetail {
  project: Project;
  members: ProjectMember[];
  milestones: Milestone[];
  description?: string;
  recentActivity: ProjectActivity[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done";
  assigneeId: string | null;
  assigneeName: string;
  dueDate: string | null;
  createdAt: string;
}

export interface ContributionMetric {
  userId: string;
  name: string;
  avatarUrl: string | null;
  tasksCompleted: number;
  commits: number;
  documents: number;
  meetingsAttended: number;
  percentage: number;
  peerRating?: number;
}

export interface ArchivedProject {
  id: string;
  title: string;
  year: number;
  domain: string;
  summary: string;
  technologies: string[];
  teamMembers: string[];
  instructorName: string | null;
  rating: number;
  viewCount: number;
  downloadCount: number;
  demoUrl: string | null;
  coverUrl: string | null;
  keywords: string[];
  featured: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "milestone" | "call" | "team" | "moderation" | "system";
  read: boolean;
  createdAt: string;
  link: string | null;
}

export interface ModerationItem {
  id: string;
  contentType: "topic" | "project" | "comment" | "call";
  contentTitle: string;
  excerpt: string;
  reason: string;
  reportedBy: string;
  reportedAt: string;
  status: "pending" | "resolved" | "dismissed";
}
