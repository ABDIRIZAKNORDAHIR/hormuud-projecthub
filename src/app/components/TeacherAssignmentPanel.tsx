import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { UserCheck, UserX, Bell, GraduationCap } from 'lucide-react';
import { Link } from 'react-router';
import { api } from '../api/client';

export function TeacherAssignmentPanel() {
  const [requests, setRequests] = useState<Array<Record<string, unknown>>>([]);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getTeacherAssignmentRequests()
      .then(r => setRequests(r.requests))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const respond = async (projectId: number, action: 'accept' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) return;
    await api.respondToAssignment(projectId, {
      action,
      rejectionReason: action === 'reject' ? rejectReason : undefined,
    });
    setRejectId(null);
    setRejectReason('');
    load();
  };

  if (loading) return null;
  if (!requests.length) return null;

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bell size={18} className="text-purple-600" />
        <h2 className="font-bold text-purple-900">New Assignment Requests ({requests.length})</h2>
      </div>
      <p className="text-sm text-purple-700">Students assigned projects to you — approve or reject with a description.</p>
      {requests.map(r => (
        <motion.div key={String(r.ProjectId)} className="bg-white rounded-xl border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs text-green-700 font-bold">{String(r.TeacherAssignedId)}</span>
              <h3 className="font-bold">{String(r.Title)}</h3>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <GraduationCap size={14} /> {String(r.StudentName)} ({String(r.StudentUniversityId)}) · {String(r.StudentDepartment)}
              </p>
              {r.Abstract && <p className="text-sm text-gray-500 mt-2">{String(r.Abstract)}</p>}
              {r.Description && <p className="text-xs text-gray-400 mt-1">{String(r.Description)}</p>}
            </div>
          </div>
          {rejectId === r.ProjectId ? (
            <div className="space-y-2">
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Describe why you are rejecting this project (required)..."
                className="w-full px-3 py-2 rounded-lg border text-sm" rows={3} />
              <div className="flex gap-2">
                <button onClick={() => respond(Number(r.ProjectId), 'reject')} disabled={!rejectReason.trim()}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50">Confirm Reject</button>
                <button onClick={() => setRejectId(null)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => respond(Number(r.ProjectId), 'accept')}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold">
                <UserCheck size={14} /> Accept Supervision
              </button>
              <button onClick={() => setRejectId(Number(r.ProjectId))}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold">
                <UserX size={14} /> Reject
              </button>
              <Link to={`/projects/${r.ProjectId}`} className="px-4 py-2 rounded-lg border text-sm font-semibold text-blue-600">View Details</Link>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
