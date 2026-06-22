import { query } from '../db.js';

export async function createNotification({ userId, title, message, type = 'info', relatedProjectId = null }) {
  await query(
    `INSERT INTO Notifications (UserId, Title, Message, Type, RelatedProjectId)
     VALUES (@userId, @title, @message, @type, @relatedProjectId)`,
    { userId, title, message, type, relatedProjectId }
  );
}

export async function notifyMessageReceived({ receiverId, senderName, projectId, preview, conversationId }) {
  const title = conversationId ? 'New chat message' : 'New project message';
  const message = `${senderName}: ${preview.slice(0, 120)}${preview.length > 120 ? '…' : ''}`;
  await createNotification({
    userId: receiverId,
    title,
    message,
    type: 'message',
    relatedProjectId: projectId || null,
  });
}

export async function notifyEvaluation({ studentId, projectTitle, grade, teacherName, projectId }) {
  await createNotification({
    userId: studentId,
    title: 'Project evaluation received',
    message: `${teacherName} graded "${projectTitle}"${grade != null ? ` — Score: ${grade}%` : ''}. Open Feedback to view remarks.`,
    type: 'evaluation',
    relatedProjectId: projectId,
  });
}

/** Notify assigned teacher that AI has read a student submission */
export async function notifyTeacherProjectBriefing({ teacherId, studentName, projectTitle, projectId, summaryPreview }) {
  const preview = summaryPreview.replace(/\*\*/g, '').slice(0, 160);
  await createNotification({
    userId: teacherId,
    title: 'New project submission — AI briefing ready',
    message: `${studentName} submitted "${projectTitle}". AI read the project: ${preview}${summaryPreview.length > 160 ? '…' : ''}`,
    type: 'ai_briefing',
    relatedProjectId: projectId,
  });
}
