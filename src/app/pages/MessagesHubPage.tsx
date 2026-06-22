import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router';
import { motion } from 'motion/react';
import { MessageSquare, Search, Users, UserPlus, Send, Paperclip, Loader2 } from 'lucide-react';
import { api, type User } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DocumentAnalysisPanel } from '../components/DocumentAnalysisPanel';
import { UserProfileModal } from '../components/UserProfileModal';
import { UserAvatar } from '../components/UserAvatar';
import { PageHero } from '../components/PageHero';
import { APP_IMAGES } from '../config/appImages';

type Conv = Record<string, unknown>;
type Msg = Record<string, unknown>;

export function MessagesHubPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [profileUser, setProfileUser] = useState<{ profile: User; projects: Array<Record<string, unknown>> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; data: string; type: 'image' | 'video' | 'file' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const r = await api.getConversations();
      setConversations(r.conversations);
      api.syncProjectConversations().catch(() => {}).then(() =>
        api.getConversations().then(r2 => setConversations(r2.conversations)).catch(() => {})
      );
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (id: number) => {
    const r = await api.getConversationMessages(id);
    setMessages(r.messages);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => {
    const openId = (location.state as { openConversationId?: number } | null)?.openConversationId;
    if (openId) setActiveId(openId);
  }, [location.state]);
  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      api.searchUsers(searchQ).then(r => setSearchResults(r.users)).catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const directChatType = (other: User): 'teacher_student' | 'student_direct' => {
    if (user?.Role === 'admin') return 'student_direct';
    const me = user?.Role;
    if ((me === 'student' && other.Role === 'teacher') || (me === 'teacher' && other.Role === 'student')) {
      return 'teacher_student';
    }
    return 'student_direct';
  };

  const startDirectChat = async (other: User) => {
    const r = await api.createConversation({
      type: directChatType(other),
      participantIds: [other.UserId],
      title: `${other.FirstName} ${other.LastName}`,
    });
    setActiveId(r.conversationId);
    setSearchQ('');
    setSearchResults([]);
    loadConversations();
  };

  const send = async () => {
    if (!activeId || (!text.trim() && !pendingFile)) return;
    setSending(true);
    try {
      await api.sendConversationMessage(activeId, {
        content: text.trim(),
        ...(pendingFile ? {
          attachmentType: pendingFile.type,
          attachmentName: pendingFile.name,
          attachmentData: pendingFile.data,
        } : {}),
      });
      setText('');
      setPendingFile(null);
      await loadMessages(activeId);
      loadConversations();
    } finally { setSending(false); }
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    let type: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    const reader = new FileReader();
    reader.onload = () => setPendingFile({ name: file.name, data: String(reader.result), type });
    reader.readAsDataURL(file);
  };

  const openProfile = async (userId: number) => {
    const r = await api.getUserProfile(userId);
    setProfileUser({ profile: r.profile, projects: r.currentProjects });
  };

  const activeConv = conversations.find(c => c.ConversationId === activeId);
  const convLabel = (c: Conv) => {
    const t = String(c.ConversationType);
    if (t === 'teacher_student') return `Teacher chat · ${c.ProjectTitle || 'Project'}`;
    if (t === 'project_group') return `Group · ${c.Title || c.ProjectTitle || 'Team'}`;
    return String(c.Title || 'Direct message');
  };

  return (
    <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto pb-mobile-nav space-y-4">
      <PageHero
        title="Messages & Chat"
        subtitle={user?.Role === 'admin'
          ? 'Message any student or teacher directly — search by name, HU ID, or email. Teacher↔student private chats stay hidden.'
          : 'Search by name, HU ID, or email — text chat with students, teachers, or admin'}
        image={APP_IMAGES.collaboration}
        gradient="linear-gradient(135deg, #2563EB 0%, #168055 100%)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[520px]">
        {/* Sidebar */}
        <div className="bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by name, email, or HU ID..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                {searchResults.filter(u => u.UserId !== user?.UserId).map(u => (
                  <button key={u.UserId} type="button" onClick={() => startDirectChat(u)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left text-sm border-b last:border-0">
                    <UserAvatar firstName={u.FirstName} lastName={u.LastName} role={u.Role} size="sm" />
                    <div className="min-w-0 flex-1">
                      <span className="block font-medium">{u.FirstName} {u.LastName}</span>
                      <span className="block text-[10px] text-gray-400 truncate capitalize">{u.Role} · {u.Email || u.UniversityId}</span>
                    </div>
                    <UserPlus size={12} className="ml-auto text-blue-600 shrink-0" title="Start direct chat" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-gray-400">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">No conversations yet. Search for a user to start chatting.</p>
            ) : conversations.map(c => (
              <button key={String(c.ConversationId)} type="button"
                onClick={() => setActiveId(Number(c.ConversationId))}
                className={`w-full p-4 text-left border-b hover:bg-gray-50 ${activeId === c.ConversationId ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-blue-600" />
                  <span className="font-semibold text-sm truncate">{convLabel(c)}</span>
                  {Number(c.UnreadCount) > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{String(c.UnreadCount)}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 capitalize">{String(c.ConversationType).replace(/_/g, ' ')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
          {!activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <Users size={40} className="mb-3 opacity-40" />
              <p className="text-sm">Select a conversation or search for a user</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-green-50">
                <h3 className="font-bold text-sm">{activeConv ? convLabel(activeConv) : 'Chat'}</h3>
                <p className="text-xs text-gray-500">Text chat · AI summarizes student uploads for teachers</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 min-h-[300px] max-h-[420px]">
                {messages.map(m => {
                  const mine = m.SenderId === user?.UserId;
                  const analysis = m.documentAnalysis as Record<string, unknown> | null;
                  const showAi = analysis && !mine && (user?.Role === 'teacher' || user?.Role === 'admin');
                  return (
                    <div key={String(m.ConversationMessageId)} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] space-y-2 ${mine ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                          {!mine && (
                            <button type="button" onClick={() => openProfile(Number(m.SenderId))}
                              className="text-xs font-bold mb-1 block hover:underline">{String(m.SenderName)}</button>
                          )}
                          <p>{String(m.Content)}</p>
                          {m.AttachmentName && (
                            <p className="text-xs opacity-80 mt-1">📎 {String(m.AttachmentName)}</p>
                          )}
                          <p className="text-[10px] opacity-60 mt-1">{new Date(String(m.SentAt)).toLocaleString()}</p>
                        </div>
                        {showAi && (
                          <DocumentAnalysisPanel analysis={analysis as never} compact={mine} teacherOnly />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t">
                {pendingFile && (
                  <p className="text-xs text-gray-500 mb-2">Attached: {pendingFile.name}
                    <button type="button" onClick={() => setPendingFile(null)} className="ml-2 text-red-500">Remove</button>
                  </p>
                )}
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
                    onChange={e => pickFile(e.target.files?.[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="p-2 rounded-lg border hover:bg-gray-50" title="Upload file for AI analysis">
                    <Paperclip size={18} className="text-gray-500" />
                  </button>
                  <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-xl text-sm" />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={send} disabled={sending}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50">
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {profileUser && (
        <UserProfileModal profile={profileUser.profile} currentProjects={profileUser.projects} onClose={() => setProfileUser(null)} />
      )}
    </div>
  );
}
