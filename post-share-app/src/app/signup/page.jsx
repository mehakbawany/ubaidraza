'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, UserPlus, Upload, Camera, Trash2, AlertCircle } from 'lucide-react';
import ImageCropper from '@/components/ImageCropper';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rawImageSrc, setRawImageSrc] = useState(null); // original image dataurl for cropper
  const [croppedImage, setCroppedImage] = useState(null); // cropped base64 image for submission
  const [showCropper, setShowCropper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dbWarning, setDbWarning] = useState(false);

  const fileInputRef = useRef(null);
  const router = useRouter();

  // Check if session is already active
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.push('/posts');
        }
      } catch (e) {
        // Not authenticated
      }
    }
    checkAuth();
  }, [router]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result);
      setShowCropper(true);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBase64) => {
    setCroppedImage(croppedBase64);
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    // Reset file input value so onChange triggers again for the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setCroppedImage(null);
    setRawImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setError(null);
    setLoading(true);
    setDbWarning(false);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          profileImage: croppedImage, // Cropped 3:4 image in base64
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503 || data.error?.includes('Database')) {
          setDbWarning(true);
        }
        throw new Error(data.error || 'Registration failed');
      }

      // Successful registration & login
      router.push('/posts');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg glass-panel p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Create Account
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            Sign up to get started. A 3:4 profile picture is required!
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex items-start space-x-3 text-red-200 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Registration Failed</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {dbWarning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-900/50 flex items-start space-x-3 text-amber-200 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">MongoDB Configuration Needed</p>
              <p className="opacity-90">
                To connect to the database, please edit the <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">.env</code> file in your project directory and set a valid <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">DATABASE_URL</code> connection string.
              </p>
            </div>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload with 3:4 ratio */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Profile Photo (3:4 ratio)
            </label>

            {croppedImage ? (
              <div className="relative group aspect-[3/4] w-32 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-md">
                <img
                  src={croppedImage}
                  alt="Cropped profile preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={() => setShowCropper(true)}
                    className="p-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white transition-colors"
                    title="Recrop Image"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] w-32 flex flex-col items-center justify-center bg-zinc-900/40 hover:bg-zinc-900/80 border-2 border-dashed border-zinc-700 hover:border-violet-500/50 rounded-xl transition-all duration-200 group relative cursor-pointer"
              >
                <div className="p-3 bg-zinc-800/80 rounded-2xl group-hover:scale-110 transition-transform duration-200 text-zinc-400 group-hover:text-violet-400">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-zinc-400 mt-2.5 font-medium px-2 text-center leading-tight">
                  Upload & Crop
                </span>
                <span className="text-[9px] text-zinc-600 mt-1">PNG, JPG up to 5MB</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 glow-border transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 glow-border transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 glow-border transition-all duration-200"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <UserPlus className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
          <p className="text-zinc-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && rawImageSrc && (
        <ImageCropper
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </main>
  );
}
