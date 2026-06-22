const WORKING_BASE_KEY = 'projecthub_api_base';

function resolveApiBases(): string[] {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv?.trim()) return [fromEnv.trim().replace(/\/$/, '')];

  const saved =
    typeof window !== 'undefined' ? sessionStorage.getItem(WORKING_BASE_KEY) : null;
  const defaults = ['/api', 'http://localhost:3004/api', 'http://127.0.0.1:3004/api'];

  if (saved && defaults.includes(saved)) {
    return [saved, ...defaults.filter((b) => b !== saved)];
  }
  return defaults;
}

const API_BASES = resolveApiBases();

function rememberWorkingBase(base: string) {
  try {
    sessionStorage.setItem(WORKING_BASE_KEY, base);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

function getToken() {
  return localStorage.getItem('projecthub_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('projecthub_token', token);
  else localStorage.removeItem('projecthub_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let lastError: unknown;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${path}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ApiError(
          (data as { error?: string }).error || `Request failed (${res.status})`,
          (data as { code?: string }).code,
        );
      }
      rememberWorkingBase(base);
      return data as T;
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError) throw err;
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(
    'Cannot reach ProjectHub API. Double-click ProjectHub.bat and keep the API window open.',
    'NETWORK_ERROR',
  );
}

export async function checkApiConnection(): Promise<boolean> {
  try {
    const health = await request<{ status: string }>('/health');
    return health.status === 'ok';
  } catch {
    return false;
  }
}

export interface User {
  UserId: number;
  UniversityId: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: 'student' | 'teacher' | 'admin';
  Department?: string;
  ProfileImageUrl?: string | null;
  Phone?: string | null;
  Bio?: string | null;
  ContactInfo?: string | null;
  AccountStatus?: string;
  PlainPassword?: string | null;
  LastLoginAt?: string | null;
  IsOnline?: boolean;
}

export interface DocumentAnalysis {
  DocumentAnalysisId?: number;
  FileName: string;
  Summary?: string;
  MainTopic?: string;
  KeyPoints?: string | string[];
  Objectives?: string | string[];
  QualityScore?: number;
  RelatedToProject?: boolean | number;
  GrammarIssues?: string | string[];
  MissingSections?: string | string[];
  PlagiarismNote?: string;
  Suggestions?: string | string[];
}

export interface Project {
  ProjectId: number;
  TeacherAssignedId: string;
  Title: string;
  Abstract?: string;
  Description?: string;
  Status: string;
  AssignedAt: string;
  SubmittedAt?: string;
  UpdatedAt?: string;
  TeacherName?: string;
  TeacherUniversityId?: string;
  OwnerName?: string;
  OwnerUniversityId?: string;
}

export interface AIAnalysis {
  UniquenessScore: number;
  AIConfidence: number;
  SimilarProjectAssignedId?: string;
  SimilarityPercent?: number;
  AISuggestion: string;
  SuggestedAction: string;
  RejectionReasons?: string;
}

export const api = {
  health: () => request<{
    status: string;
    service: string;
    server?: string;
    database: string;
  }>('/health'),

  login: (universityId: string | undefined, email: string, password: string, portalRole?: User['Role']) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        ...(portalRole === 'admin'
          ? { portalRole: 'admin' }
          : { universityId: universityId || undefined }),
      }),
    }),

  register: (data: {
    universityId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    role?: 'student' | 'teacher';
  }) =>
    request<{ token?: string; user: User; pendingApproval?: boolean; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<{ user: User }>('/auth/me'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    department?: string;
    profileImageUrl?: string | null;
    phone?: string | null;
    bio?: string | null;
    contactInfo?: string | null;
  }) =>
    request<{ user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  updateCredentials: (data: {
    currentPassword: string;
    newPassword?: string;
    email?: string;
  }) =>
    request<{ user: User; token: string; message: string }>('/auth/credentials', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getProjects: () => request<{ projects: Project[] }>('/projects'),

  getProject: (id: number) =>
    request<{
      project: Project & {
        TeacherUserId?: number;
        TeacherEmail?: string;
        TeacherDepartment?: string;
        TeacherProfileImageUrl?: string | null;
        OwnerStudentId?: number;
        OwnerStudentUserId?: number;
        OwnerEmail?: string;
        OwnerProfileImageUrl?: string | null;
        AssignedByTeacherId?: number;
      };
      members: Array<{ UserId: number; UniversityId: string; FirstName: string; LastName: string }>;
      latestSubmission: { SubmissionId: number; SubmittedAt: string; Title: string; Abstract: string } | null;
      aiAnalysis: AIAnalysis | null;
    }>(`/projects/${id}`),

  createProject: (data: {
    teacherAssignedId: string;
    title: string;
    abstract?: string;
    ownerUniversityId?: string;
  }) => request<{ project: Project }>('/projects', { method: 'POST', body: JSON.stringify(data) }),

  updateProject: (id: number, data: { title?: string; abstract?: string; description?: string }) =>
    request<{ project: Project }>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  submitProject: (id: number, data: { title: string; abstract: string; content?: string }) =>
    request<{ submission: unknown; message: string }>(`/projects/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  inviteStudent: (id: number, data: { universityId?: string; email?: string }) =>
    request<{ message: string }>(`/projects/${id}/invite`, { method: 'POST', body: JSON.stringify(data) }),

  acceptInvite: (id: number) =>
    request<{ message: string }>(`/projects/${id}/accept-invite`, { method: 'POST' }),

  reviewProject: (id: number, data: { action: string; rejectionReason?: string; message?: string }) =>
    request<{ message: string; status: string }>(`/projects/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReviewQueue: () => request<{ queue: Array<Record<string, unknown>> }>('/projects/queue/review'),

  getMessages: (projectId: number) =>
    request<{
      messages: Array<{
        MessageId: number;
        Content: string;
        SentAt: string;
        SenderId: number;
        SenderName: string;
        SenderRole: string;
        AttachmentType?: string | null;
        AttachmentName?: string | null;
        AttachmentData?: string | null;
      }>;
    }>(`/projects/${projectId}/messages`),

  sendMessage: (
    projectId: number,
    data: {
      content?: string;
      receiverId?: number;
      attachmentType?: 'image' | 'video' | 'file';
      attachmentName?: string;
      attachmentData?: string;
      messageScope?: 'teacher_student' | 'project_group';
    }
  ) =>
    request<{ message: unknown; documentAnalysis?: DocumentAnalysis | null }>(`/projects/${projectId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAdminUsers: (role?: string, q?: string) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (q?.trim()) params.set('q', q.trim());
    const qs = params.toString();
    return request<{ users: User[] }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  deleteAdminUser: (userId: number) =>
    request<{ message: string; deletedUser: { userId: number; universityId: string; email: string; role: string } }>(
      `/admin/users/${userId}`,
      { method: 'DELETE' }
    ),

  updateAdminUserAccount: (userId: number, data: { universityId?: string; password?: string }) =>
    request<{ message: string; user: User }>(`/admin/users/${userId}/account`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAdminCharts: () =>
    request<{
      usersByRole: Array<{ Role: string; count: number }>;
      projectsByStatus: Array<{ Status: string; count: number }>;
      weeklyLogins: Array<{ day: string; count: number }>;
      studentsByDepartment: Array<{ dept: string; count: number }>;
    }>('/admin/charts'),

  batchScan: (projectIds: number[]) =>
    request<{
      message: string;
      results: Array<{
        projectId: number;
        student: string;
        project: string;
        teacherAssignedId: string;
        uniqueness: number;
        collidesWith: string;
        action: 'Approve' | 'Review' | 'Reject';
        aiSuggestion: string;
      }>;
    }>('/admin/batch-scan', { method: 'POST', body: JSON.stringify({ projectIds }) }),

  getPendingRegistrations: () =>
    request<{ pending: Array<{
      UserId: number; UniversityId: string; Email: string;
      FirstName: string; LastName: string; Role: string; Department?: string; CreatedAt: string;
    }> }>('/admin/pending-registrations'),

  approveAccount: (userId: number) =>
    request<{ message: string }>(`/admin/accounts/${userId}/approve`, { method: 'POST' }),

  rejectAccount: (userId: number, reason?: string) =>
    request<{ message: string }>(`/admin/accounts/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getAdminStats: () => request<Record<string, unknown>>('/admin/stats'),

  getSettings: () => request<{ settings: Array<{ SettingKey: string; SettingValue: string }> }>('/settings'),

  updateSettings: (settings: Record<string, string>) =>
    request<{ message: string }>('/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),

  getInvitations: () =>
    request<{ invitations: Array<{ InvitationId: number; ProjectId: number; Title: string; TeacherAssignedId: string; InvitedByName?: string; InvitedByUniversityId?: string; CreatedAt?: string }> }>(
      '/student/invitations'
    ),

  getTeam: () =>
    request<{ team: Array<Record<string, unknown>> }>('/student/team'),

  getSubmissionsList: () =>
    request<{ submissions: Array<Record<string, unknown>> }>('/projects/submissions/list'),

  getStatsSummary: () =>
    request<{ pendingReview: number; collisions: number }>('/projects/stats/summary'),

  getAtlasData: () =>
    request<{
      projects: Array<Record<string, unknown>>;
      departmentStats: Array<{ dept: string; count: number }>;
      statusCounts: Array<{ Status: string; count: number }>;
    }>('/atlas/data'),

  checkTopic: (q: string) =>
    request<{ result: 'available' | 'pending' | 'taken' | null; matches: Array<Record<string, unknown>> }>(
      `/atlas/check-topic?q=${encodeURIComponent(q)}`
    ),

  search: (q: string) =>
    request<{ projects: Array<Record<string, unknown>>; people: Array<Record<string, unknown>> }>(
      `/projects/search/query?q=${encodeURIComponent(q)}`
    ),

  getStudentDashboard: () =>
    request<{
      projects: Project[];
      feedback: Array<Record<string, unknown>>;
      achievements: Array<{ id: string; title: string; desc: string; earned: boolean }>;
      stats: { totalProjects: number; active: number; approved: number; pendingReview: number };
    }>('/student/dashboard'),

  getNotifications: () =>
    request<{ notifications: Array<{ id: number; title: string; description: string; time: string; type: string; RelatedProjectId?: number | null; unread: boolean }> }>(
      '/student/notifications'
    ),

  getTeachers: () =>
    request<{ teachers: Array<Record<string, unknown>>; byCategory: Record<string, Array<Record<string, unknown>>> }>(
      '/student/teachers'
    ),

  proposeProject: (data: { teacherId?: number; teacherUniversityId?: string; title: string; abstract?: string; description?: string }) =>
    request<{ project: Project; message: string; teacher?: Record<string, unknown> }>('/student/propose-project', {
      method: 'POST', body: JSON.stringify(data),
    }),

  lookupStudent: (universityId: string) =>
    request<{ student: Record<string, unknown>; projects: Array<Record<string, unknown>> }>(
      `/student/lookup/${encodeURIComponent(universityId)}`
    ),

  lookupTeacher: (universityId: string) =>
    request<{ teacher: Record<string, unknown> }>(
      `/student/lookup-teacher/${encodeURIComponent(universityId)}`
    ),

  inviteTeamMember: (data: { projectId: number; universityId: string; inviteNote?: string }) =>
    request<{ message: string }>('/student/invite-member', { method: 'POST', body: JSON.stringify(data) }),

  getTeacherAssignmentRequests: () =>
    request<{ requests: Array<Record<string, unknown>> }>('/teacher/assignment-requests'),

  respondToAssignment: (projectId: number, data: { action: 'accept' | 'reject'; rejectionReason?: string }) =>
    request<{ message: string; status: string }>(`/teacher/assignment-requests/${projectId}/respond`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  getTeacherNotifications: () =>
    request<{ notifications: Array<Record<string, unknown>> }>('/teacher/notifications'),

  getAdminLive: () =>
    request<{
      onlineUsers: Array<Record<string, unknown>>;
      onlineCount: number;
      recentLogins: Array<Record<string, unknown>>;
      students: Array<Record<string, unknown>>;
      recentActivity: Array<Record<string, unknown>>;
    }>('/admin/live'),

  getAdminConnections: () =>
    request<{
      teamInvites: Array<Record<string, unknown>>;
      teacherAssignments: Array<Record<string, unknown>>;
      teamMembers: Array<Record<string, unknown>>;
    }>('/admin/connections'),

  heartbeat: () => request<{ ok: boolean }>('/auth/heartbeat', { method: 'POST' }),

  getConversations: () =>
    request<{ conversations: Array<Record<string, unknown>> }>('/conversations'),

  syncProjectConversations: () =>
    request<{ ok: boolean; synced: number; created: number }>('/conversations/sync-projects', {
      method: 'POST',
    }),

  createConversation: (data: {
    type: 'teacher_student' | 'student_direct' | 'project_group';
    projectId?: number;
    participantIds?: number[];
    title?: string;
  }) =>
    request<{ conversationId: number; existing?: boolean }>('/conversations', {
      method: 'POST', body: JSON.stringify(data),
    }),

  startDirectMessage: (userId: number, title?: string) =>
    request<{ conversationId: number; existing?: boolean }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'student_direct',
        participantIds: [userId],
        title,
      }),
    }),

  getConversationMessages: (conversationId: number) =>
    request<{ messages: Array<Record<string, unknown>> }>(`/conversations/${conversationId}/messages`),

  sendConversationMessage: (
    conversationId: number,
    data: {
      content?: string;
      attachmentType?: 'image' | 'video' | 'file';
      attachmentName?: string;
      attachmentData?: string;
    }
  ) =>
    request<{ message: unknown; documentAnalysis?: DocumentAnalysis | null }>(
      `/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  searchUsers: (q: string) =>
    request<{ users: User[] }>(`/users/search?q=${encodeURIComponent(q)}`),

  getUserProfile: (userId: number) =>
    request<{ profile: User; currentProjects: Array<Record<string, unknown>> }>(`/users/${userId}/profile`),

  getProjectEvaluations: (projectId: number) =>
    request<{ evaluations: Array<Record<string, unknown>> }>(`/projects/${projectId}/evaluations`),

  submitProjectEvaluation: (projectId: number, data: {
    studentId?: number; grade?: number; feedback: string; remarks?: string;
  }) =>
    request<{ evaluation: Record<string, unknown> }>(`/projects/${projectId}/evaluations`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  getDocumentAnalyses: (projectId: number) =>
    request<{ analyses: DocumentAnalysis[] }>(`/projects/${projectId}/evaluations/document-analyses`),

  getProjectAIStatus: (projectId: number) =>
    request<{ configured: boolean; message: string; provider?: string | null; model?: string | null }>(
      `/projects/${projectId}/ai/status`
    ),

  getProjectAIBriefing: (projectId: number) =>
    request<{
      configured: boolean;
      provider?: string | null;
      model?: string | null;
      analysis: (DocumentAnalysis & {
        recommendedDecision?: string;
        decisionConfidence?: number;
        decisionReasoning?: string;
        decisionLabel?: string;
        whatProjectIsAbout?: string;
        whatShouldContain?: string[];
        featureSuggestions?: string[];
      }) | null;
    }>(`/projects/${projectId}/ai/briefing`),

  analyzeProjectAI: (projectId: number) =>
    request<{ analysis: Record<string, unknown>; provider?: string; model?: string }>(
      `/projects/${projectId}/ai/analyze`,
      { method: 'POST' }
    ),

  getProjectAIChat: (projectId: number) =>
    request<{ messages: Array<{ id: number; role: string; content: string; createdAt: string }>; configured: boolean }>(
      `/projects/${projectId}/ai/chat`
    ),

  askProjectAI: (projectId: number, question: string) =>
    request<{ answer: string }>(`/projects/${projectId}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};
