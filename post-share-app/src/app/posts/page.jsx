'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Image, Send, AlertCircle, Sparkles, MessageSquare, Heart, Share2, Calendar } from 'lucide-react';

export default function PostsPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [error, setError] = useState(null);
  const [dbWarning, setDbWarning] = useState(false);

  const fileInputRef = useRef(null);
  const router = useRouter();

  // Load user details & check authentication
  useEffect(() => {
    async function getSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setFetchingUser(false);
      }
    }
    getSession();
  }, [router]);

  // Load all posts
  const fetchPosts = async () => {
    setFetchingPosts(true);
    setDbWarning(false);
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503 || data.error?.includes('Database')) {
          setDbWarning(true);
        }
        throw new Error(data.error || 'Failed to fetch posts');
      }
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingPosts(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPostImage(reader.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !postImage) return;

    setSubmittingPost(true);
    setError(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          image: postImage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      // Prepend the new post with author data populated
      setPosts((prev) => [data.post, ...prev]);
      setContent('');
      setPostImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleRemoveAttachedImage = () => {
    setPostImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to format date nicely
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  if (fetchingUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <span className="animate-spin inline-block w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full"></span>
        <p className="text-zinc-400 text-sm font-medium animate-pulse">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-600/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-30 w-full glass-panel !rounded-none border-t-0 border-x-0 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 tracking-tight">
              DevShare
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 pr-4 border-r border-zinc-800">
              <div className="aspect-[3/4] w-7 h-9 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 hidden sm:block">
                <img
                  src={user?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name)}`}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-zinc-200 font-medium text-sm hidden sm:inline-block">
                {user?.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl transition-all flex items-center space-x-2 text-sm font-medium"
              title="Log Out"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span className="hidden md:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Wrapper */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column - User Profile Card */}
        <section className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
          <div className="glass-panel p-6 shadow-xl text-center flex flex-col items-center">
            {/* 3:4 profile image */}
            <div className="aspect-[3/4] w-28 h-37 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-lg mb-4">
              <img
                src={user?.profileImage}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <h3 className="text-xl font-bold text-zinc-100">{user?.name}</h3>
            <p className="text-zinc-400 text-xs mt-1 break-all">{user?.email}</p>

            <div className="w-full border-t border-zinc-800/80 my-5 pt-5 flex justify-around text-center">
              <div>
                <span className="block text-xl font-bold text-violet-400">{posts.length}</span>
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Posts</span>
              </div>
              <div className="border-r border-zinc-800/80 h-10 my-auto"></div>
              <div>
                <span className="block text-xl font-bold text-fuchsia-400">
                  {new Date(user?.createdAt).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                </span>
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Joined</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-center space-x-2 text-xs text-zinc-500 bg-zinc-900/40 py-2.5 px-4 rounded-xl border border-zinc-800/50 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Registered on {new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {dbWarning && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-900/50 text-amber-200 text-sm space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-semibold">Setup Pending</span>
              </div>
              <p className="opacity-90 leading-relaxed text-xs">
                To connect to MongoDB and query documents, please configure <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">DATABASE_URL</code> in your <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">.env</code> file.
              </p>
            </div>
          )}
        </section>

        {/* Right Column - Feed */}
        <section className="lg:col-span-8 space-y-6">
          {/* Create Post Form */}
          <div className="glass-panel p-5 shadow-xl">
            <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Share something new</span>
            </h4>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind today?"
                rows={3}
                className="w-full p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 resize-none text-sm leading-relaxed"
              />

              {/* Uploaded Post Image Preview */}
              {postImage && (
                <div className="relative inline-block rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden shadow-inner max-w-xs">
                  <img
                    src={postImage}
                    alt="Post attachment"
                    className="max-h-60 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAttachedImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white hover:text-red-400 rounded-lg transition-colors border border-zinc-800"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-zinc-300 hover:text-violet-400 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Image className="w-4 h-4" />
                  <span>Add Photo</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="submit"
                  disabled={submittingPost || (!content.trim() && !postImage)}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-[0.98] transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {submittingPost ? (
                    <>
                      <span className="animate-spin inline-block w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full"></span>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <span>Post</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed Header */}
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-violet-400" />
              <span>Feed Activity</span>
            </h3>
            <button
              onClick={fetchPosts}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Error Message */}
          {error && !dbWarning && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex items-start space-x-3 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Failed to load posts</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Feed List */}
          {fetchingPosts ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-panel p-6 space-y-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="aspect-[3/4] w-10 h-13 bg-zinc-800 rounded-lg"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                      <div className="h-3 bg-zinc-800 rounded w-1/6"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-zinc-800 rounded w-full"></div>
                  <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-panel p-12 text-center text-zinc-500 space-y-3">
              <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto" />
              <h5 className="text-zinc-300 font-semibold">No posts yet</h5>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Be the first to share something! Upload a picture or write a text post above.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="glass-panel p-6 shadow-xl glass-panel-hover flex flex-col space-y-4 animate-fade-in"
                >
                  {/* Post Author info */}
                  <div className="flex items-center space-x-3">
                    <div className="aspect-[3/4] w-10 h-13 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md">
                      <img
                        src={post.author?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.author?.name)}`}
                        alt={post.author?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer">
                        {post.author?.name}
                      </h4>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </div>

                  {/* Post Image */}
                  {post.image && (
                    <div className="rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950 max-h-[450px] flex items-center justify-center shadow-inner">
                      <img
                        src={post.image}
                        alt="Post media"
                        className="max-h-[450px] w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="flex items-center space-x-6 pt-3 border-t border-zinc-900 text-zinc-500 text-xs font-semibold">
                    <button className="flex items-center space-x-2 hover:text-violet-400 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>Like</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-violet-400 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span>Comment</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-violet-400 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
