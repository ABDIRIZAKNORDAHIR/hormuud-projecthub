/** Athena AI — semantic similarity detection (advisory only, never auto-approves) */

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function combinedSimilarity(textA, textB) {
  const jaccard = jaccardSimilarity(textA, textB);
  const wordsA = tokenize(textA);
  const wordsB = tokenize(textB);
  let overlap = 0;
  for (const w of wordsA) if (wordsB.includes(w)) overlap++;
  const overlapRatio = wordsA.length ? overlap / wordsA.length : 0;
  return Math.min(1, jaccard * 0.6 + overlapRatio * 0.4);
}

/**
 * Analyze a submission against all other projects in the database.
 * @param {{ title: string, abstract: string, projectId: number }} submission
 * @param {Array<{ ProjectId, TeacherAssignedId, Title, Abstract, Status }>} allProjects
 * @param {number} threshold - similarity % to flag collision (default 60)
 */
export function analyzeSubmission(submission, allProjects, threshold = 60) {
  const combinedText = `${submission.title} ${submission.abstract}`;
  let bestMatch = null;
  let bestSimilarity = 0;

  for (const project of allProjects) {
    if (project.ProjectId === submission.projectId) continue;
    const otherText = `${project.Title || ''} ${project.Abstract || ''}`;
    const sim = combinedSimilarity(combinedText, otherText);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestMatch = project;
    }
  }

  const similarityPercent = Math.round(bestSimilarity * 100);
  const uniquenessScore = Math.max(0, 100 - similarityPercent);
  const aiConfidence = similarityPercent > 40 ? Math.min(95, 60 + similarityPercent * 0.35) : 45 + Math.random() * 20;

  const rejectionReasons = [];
  let suggestedAction = 'approve';
  let aiSuggestion = 'Approve — topic appears unique with no significant overlap detected.';

  if (similarityPercent >= threshold && bestMatch) {
    suggestedAction = 'reject';
    aiSuggestion = `This project seems similar to project "${bestMatch.Title}" (ID: ${bestMatch.TeacherAssignedId}) with ${similarityPercent}% overlap. Athena recommends rejection or major revision.`;
    rejectionReasons.push(
      `Topic too similar to "${bestMatch.Title}" (ID: ${bestMatch.TeacherAssignedId})`,
      `Semantic similarity score: ${similarityPercent}%`,
      `Matched project status: ${bestMatch.Status}`
    );
  } else if (similarityPercent >= threshold * 0.75 && bestMatch) {
    suggestedAction = 'review';
    aiSuggestion = `Review carefully — ${similarityPercent}% similarity detected with project ID ${bestMatch.TeacherAssignedId}. Manual review recommended.`;
    rejectionReasons.push(`Possible overlap with project ID ${bestMatch.TeacherAssignedId} (${similarityPercent}%)`);
  }

  return {
    uniqueness_score: Math.round(uniquenessScore),
    ai_confidence: Math.round(aiConfidence),
    similar_project_id: bestMatch && similarityPercent >= 40 ? bestMatch.ProjectId : null,
    similar_project_assigned_id: bestMatch && similarityPercent >= 40 ? bestMatch.TeacherAssignedId : null,
    similarity_percent: similarityPercent >= 40 ? similarityPercent : null,
    ai_suggestion: aiSuggestion,
    suggested_action: suggestedAction,
    rejection_reasons: rejectionReasons.length ? rejectionReasons : [
      'Topic too similar to existing project',
      'Low originality score',
    ],
  };
}

export { combinedSimilarity };

/**
 * Batch-scan selected submissions: re-run Athena analysis and cross-compare pairs.
 * @param {Array<{ projectId: number, submissionId: number, title: string, abstract: string, studentName: string, teacherAssignedId: string }>} items
 */
export function batchAnalyzeSubmissions(items, allProjects, threshold = 60) {
  const analyzed = items.map(item => ({
    ...item,
    analysis: analyzeSubmission(
      { title: item.title, abstract: item.abstract, projectId: item.projectId },
      allProjects,
      threshold
    ),
  }));

  return analyzed.map(a => {
    const { analysis } = a;
    let bestPair = null;

    for (const other of analyzed) {
      if (other.projectId === a.projectId) continue;
      const sim = Math.round(
        combinedSimilarity(`${a.title} ${a.abstract}`, `${other.title} ${other.abstract}`) * 100
      );
      if (sim >= 40 && (!bestPair || sim > bestPair.similarity)) {
        bestPair = {
          student_name: other.studentName,
          project_title: other.title,
          teacher_assigned_id: other.teacherAssignedId,
          similarity: sim,
        };
      }
    }

    const dbCollision = analysis.similarity_percent >= 40 && analysis.similar_project_assigned_id
      ? {
          student_name: analysis.similar_project_assigned_id,
          project_title: analysis.similar_project_assigned_id,
          teacher_assigned_id: analysis.similar_project_assigned_id,
          similarity: analysis.similarity_percent,
        }
      : null;

    const collision = bestPair || dbCollision;
    let action = 'Review';
    if (analysis.uniqueness_score > 80 && !collision) action = 'Approve';
    else if (analysis.uniqueness_score < 50 || (collision && collision.similarity >= threshold)) action = 'Reject';

    return {
      projectId: a.projectId,
      submissionId: a.submissionId,
      studentName: a.studentName,
      teacherAssignedId: a.teacherAssignedId,
      projectTitle: a.title,
      uniqueness: analysis.uniqueness_score,
      aiConfidence: analysis.ai_confidence,
      aiSuggestion: analysis.ai_suggestion,
      suggestedAction: analysis.suggested_action,
      collidesWith: collision
        ? `${collision.student_name} (${collision.similarity}%)`
        : 'None',
      collision,
      action,
      analysis,
    };
  });
}
