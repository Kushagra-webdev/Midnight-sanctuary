import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send, Heart, MessageCircle, Loader2, ArrowLeft, X, Search, Users, UserPlus, Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { SkeletonGrid, SkeletonList } from '../../components/SkeletonCard';

const SEED = [
  { _id: 'night-walkers', name: 'Night Walkers', description: 'For those who find peace in the late hours.', memberCount: 1247, color: 'bg-indigo-500/10 text-indigo-400', isDemo: true },
  { _id: 'minimalist-tech', name: 'Minimalist Tech', description: 'Intentional use of technology for deeper living.', memberCount: 853, color: 'bg-teal-500/10 text-teal-400', isDemo: true },
  { _id: 'deep-reading', name: 'Deep Reading Hub', description: 'Slow reading. Real comprehension. No summaries.', memberCount: 2412, color: 'bg-purple-500/10 text-purple-400', isDemo: true },
  { _id: 'silent-mornings', name: 'Silent Mornings', description: 'Screen-free first hour. Every day.', memberCount: 988, color: 'bg-orange-500/10 text-orange-400', isDemo: true },
];

// Comment Component
function CommentSection({ post, onUpdate }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { text: text.trim() });
      setText('');
      onUpdate(data);
      toast.success('Comment added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add comment');
    } finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${post._id}/comments/${commentId}`);
      onUpdate({ ...post, comments: post.comments.filter(c => c._id !== commentId) });
      toast.success('Comment removed');
    } catch { toast.error('Could not delete comment'); }
  };

  const comments = post.comments || [];
  const shown = expanded ? comments : comments.slice(0, 2);

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {shown.map((c) => (
            <div key={c._id} className="flex gap-2 group">
              <img src={c.authorId?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(c.authorId?.name || 'u')}`}
                alt="" className="w-5 h-5 rounded-full shrink-0 mt-0.5 border border-white/10" />
              <div className="flex-1 bg-surface-dim rounded-xl px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-white">{c.authorId?.name || 'User'}</span>
                  {c.authorId?._id === user?._id && (
                    <button onClick={() => handleDeleteComment(c._id)}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-main mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
          {comments.length > 2 && (
            <button onClick={() => setExpanded(e => !e)} className="text-[10px] text-text-muted hover:text-white flex items-center gap-1 transition-colors ml-7">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Show less' : `+${comments.length - 2} more comments`}
            </button>
          )}
        </div>
      )}

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input type="text" value={text} onChange={e => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-surface-dim border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-text-muted/50 focus:outline-none focus:border-white/15 transition-colors" />
        <button type="submit" disabled={submitting || !text.trim()}
          className="w-7 h-7 bg-primary/15 text-primary border border-primary/20 rounded-lg flex items-center justify-center hover:bg-primary/25 transition-colors disabled:opacity-50">
          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </button>
      </form>
    </div>
  );
}

// User Search for follow system
function UserSearch() {
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [following, setFollowing] = useState({});
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!q || q.trim().length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(q.trim())}`);
        setResults(data);
      } catch { toast.error('Search failed'); }
      finally { setSearching(false); }
    }, 400);
  }, [q]);

  const handleFollow = async (userId) => {
    try {
      const { data } = await api.post(`/users/${userId}/follow`);
      setFollowing(prev => ({ ...prev, [userId]: data.following }));
      setResults(prev => prev.map(u => u._id === userId
        ? { ...u, followerCount: data.followerCount, isFollowing: data.following }
        : u
      ));
      toast.success(data.following ? 'Now following' : 'Unfollowed');
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="glass-panel p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-lg text-white">Find & Follow</h3>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full bg-surface-dim border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/15" />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />}
      </div>
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(u => (
            <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-dim border border-white/5">
              <img src={u.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(u.name)}`}
                alt="" className="w-8 h-8 rounded-full border border-white/10 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.name}</p>
                <p className="text-[10px] text-text-muted">{u.followerCount || 0} followers · {u.currentStreak || 0}🔥</p>
              </div>
              <button onClick={() => handleFollow(u._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  (following[u._id] !== undefined ? following[u._id] : u.isFollowing)
                    ? 'bg-surface-bright border-white/10 text-text-muted hover:text-red-400'
                    : 'bg-primary/15 border-primary/20 text-primary hover:bg-primary/25'
                }`}>
                {(following[u._id] !== undefined ? following[u._id] : u.isFollowing)
                  ? <><Check className="w-3 h-3" /> Following</>
                  : <><UserPlus className="w-3 h-3" /> Follow</>}
              </button>
            </div>
          ))}
        </div>
      )}
      {q.length >= 2 && !searching && results.length === 0 && (
        <p className="text-text-muted text-sm text-center py-4">No users found</p>
      )}
    </div>
  );
}

export default function Communities() {
  const { user } = useAuth();
  const { data: communities, loading: commLoading, refetch: refetchComms } = useFetch('/communities');
  const [selected, setSelected] = useState(null);
  const [localPosts, setLocalPosts] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [newComm, setNewComm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('circles'); // 'circles' | 'people'
  const [joiningId, setJoiningId] = useState(null);

  const isPro = user?.planType === 'Pro' || user?.planType === 'Premium';
  const realCommunities = communities || [];
  const allCommunities = realCommunities.length > 0 ? realCommunities : SEED;

  const isDemo = selected?.isDemo || false;

  const { data: posts, loading: postsLoading, refetch: refetchPosts } = useFetch(
    selected && !isDemo ? `/posts?communityId=${selected._id}` : null,
    { enabled: !!selected && !isDemo }
  );

  // Sync remote posts to local (for real-time comment updates without full refetch)
  useEffect(() => {
    if (posts) setLocalPosts(posts);
  }, [posts]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() || !selected) return;
    if (isDemo) { toast.error('Create a real circle to post!'); return; }
    setPosting(true);
    try {
      const { data } = await api.post('/posts', {
        communityId: selected._id,
        title: postContent.slice(0, 60),
        content: postContent,
      });
      setPostContent('');
      setLocalPosts(prev => [data, ...(prev || [])]);
      toast.success('Posted to the circle');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post');
    } finally { setPosting(false); }
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await api.post(`/posts/${postId}/like`);
      setLocalPosts(prev => prev?.map(p => p._id === postId
        ? { ...p, likes: data.liked ? [...(p.likes || []), user._id] : (p.likes || []).filter(id => id !== user._id) }
        : p
      ));
    } catch { toast.error('Could not like post'); }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setLocalPosts(prev => prev?.filter(p => p._id !== postId));
      toast.success('Post removed');
    } catch { toast.error('Could not delete post'); }
  };

  const updatePost = (updated) => {
    setLocalPosts(prev => prev?.map(p => p._id === updated._id ? updated : p));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newComm.name.trim()) return;
    setCreating(true);
    try {
      await api.post('/communities', {
        name: newComm.name.trim(),
        description: newComm.description.trim() || 'A sanctuary circle.',
      });
      setNewComm({ name: '', description: '' });
      setShowCreate(false);
      refetchComms();
      toast.success('Circle created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create community');
    } finally { setCreating(false); }
  };

  const handleJoin = async (commId, e) => {
    e.stopPropagation();
    setJoiningId(commId);
    try {
      await api.post(`/communities/${commId}/join`);
      refetchComms();
      toast.success('Joined circle!');
    } catch { toast.error('Could not join'); }
    finally { setJoiningId(null); }
  };

  /* ── Detail View ── */
  if (selected) return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h2 className="font-heading text-xl sm:text-2xl text-white">{selected.name}</h2>
          <p className="text-xs text-text-muted">{selected.memberCount || (selected.members?.length) || 0} members</p>
        </div>
        {selected.isDemo && (
          <span className="text-[10px] px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full">Demo Circle</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Post composer */}
          {!isDemo ? (
            <div className="glass-panel p-4 sm:p-6">
              <form onSubmit={handlePost} className="space-y-3">
                <textarea value={postContent} onChange={e => setPostContent(e.target.value)}
                  placeholder="Share your reflection with the circle..."
                  rows={3}
                  className="w-full bg-surface-dim border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/15 resize-none" />
                <button type="submit" disabled={posting || !postContent.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:scale-[0.98] transition-transform disabled:opacity-50">
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Share to Circle
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel p-4 border-dashed border-yellow-500/20 text-center">
              <p className="text-text-muted text-sm">This is a demo circle. <button onClick={() => { setSelected(null); setShowCreate(true); }} className="text-tertiary hover:underline">Create your own</button> to post.</p>
            </div>
          )}

          {/* Posts */}
          {postsLoading ? (
            <SkeletonList count={3} />
          ) : isDemo ? (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted text-sm">Demo circles have no posts. Create your own circle to start conversations.</p>
            </div>
          ) : !localPosts || localPosts.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted text-sm">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {localPosts.map((post) => {
                const liked = post.likes?.some(id => id === user._id || id?._id === user._id || id?.toString() === user._id?.toString());
                return (
                  <div key={post._id} className="glass-panel p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={post.authorId?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(post.authorId?.name || 'u')}`}
                          alt="" className="w-8 h-8 rounded-full border border-white/10 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{post.authorId?.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-text-muted">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                      {post.authorId?._id === user?._id && (
                        <button onClick={() => handleDeletePost(post._id)} className="text-text-muted hover:text-red-400 transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-text-main leading-relaxed mb-3">{post.content}</p>
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-400' : 'text-text-muted hover:text-red-400'}`}>
                        <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
                        <span>{post.likes?.length || 0}</span>
                      </button>
                      <span className="flex items-center gap-1.5 text-xs text-text-muted">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments?.length || 0}
                      </span>
                    </div>
                    <CommentSection post={post} onUpdate={updatePost} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-4 sm:p-6">
            <h3 className="font-heading text-base text-white mb-2">{selected.name}</h3>
            <p className="text-sm text-text-muted mb-4">{selected.description}</p>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
              <Users className="w-3.5 h-3.5" />
              <span>{selected.memberCount || selected.members?.length || 0} members</span>
            </div>
            {!isDemo && (
              <button onClick={async () => {
                try { await api.delete(`/communities/${selected._id}/leave`); refetchComms(); setSelected(null); toast.success('Left circle'); }
                catch { toast.error('Could not leave'); }
              }} className="w-full py-2 border border-red-500/20 text-red-400 rounded-xl text-xs hover:bg-red-500/10 transition-colors">
                Leave Circle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── List View ── */
  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-white mb-2">Sanctuary Circles</h1>
          <p className="text-text-muted text-sm">Find your people. Share your journey.</p>
        </div>
        {isPro && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:scale-[0.98] transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Plus className="w-4 h-4" /> New Circle
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-dim rounded-2xl w-fit border border-white/5 mb-6">
        <button onClick={() => setActiveTab('circles')} className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'circles' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
          Circles
        </button>
        <button onClick={() => setActiveTab('people')} className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'people' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
          Find People
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-panel p-5 mb-6 border-primary/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg text-white">Create a Circle</h3>
            <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input type="text" value={newComm.name} onChange={e => setNewComm({ ...newComm, name: e.target.value })}
              placeholder="Circle name"
              className="w-full bg-surface-dim border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/20" />
            <textarea value={newComm.description} onChange={e => setNewComm({ ...newComm, description: e.target.value })}
              placeholder="What is this circle about?" rows={2}
              className="w-full bg-surface-dim border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none focus:border-white/20 resize-none" />
            <div className="flex gap-2">
              <button type="submit" disabled={creating || !newComm.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:scale-[0.98] transition-transform disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Circle
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'people' ? (
        <UserSearch />
      ) : (
        <>
          {commLoading ? (
            <SkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {allCommunities.map((comm) => {
                const isMember = !comm.isDemo && comm.members?.some(m => m._id === user?._id || m === user?._id || m?.toString() === user?._id?.toString());
                const color = comm.isDemo ? comm.color : 'bg-primary/10 text-primary';
                return (
                  <div key={comm._id} onClick={() => setSelected(comm)}
                    className="glass-panel p-4 sm:p-5 cursor-pointer hover:border-white/10 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${color || 'bg-primary/10 text-primary'} flex items-center justify-center font-bold text-lg shrink-0`}>
                        {comm.name[0]}
                      </div>
                      {isMember && (
                        <span className="text-[10px] bg-tertiary/10 text-tertiary border border-tertiary/20 px-2 py-0.5 rounded-full">Joined</span>
                      )}
                      {comm.isDemo && (
                        <span className="text-[10px] text-text-muted/60">Demo</span>
                      )}
                    </div>
                    <h3 className="font-heading text-base sm:text-lg text-white mb-1 group-hover:text-tertiary transition-colors">{comm.name}</h3>
                    <p className="text-xs text-text-muted mb-3 line-clamp-2">{comm.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Users className="w-3 h-3" />
                        <span>{comm.memberCount ?? comm.members?.length ?? 0} members</span>
                      </div>
                      {!comm.isDemo && !isMember && (
                        <button onClick={e => handleJoin(comm._id, e)}
                          disabled={joiningId === comm._id}
                          className="text-[10px] px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-colors disabled:opacity-50">
                          {joiningId === comm._id ? <Loader2 className="w-3 h-3 animate-spin" /> : '+ Join'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
