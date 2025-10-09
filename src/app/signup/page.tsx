"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setAuthToken, setAuthUser } from "@/lib/auth";
import { Eye, EyeOff, Home } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Store user data and token
      setAuthToken(data.token);
      setAuthUser(data.user);

      // Redirect to profile completion
      router.push("/complete-profile");
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Please ensure backend server is running.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Sidebar - Branding */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#6633FF] to-[#AA66FF] items-center justify-center p-12 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6633FF]/90 to-[#AA66FF]/90" />
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute top-32 right-16 w-16 h-16 bg-white/5 rounded-full animate-bounce" />
        <div className="absolute bottom-20 left-8 w-24 h-24 bg-white/10 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-32 right-12 w-12 h-12 bg-white/5 rounded-full animate-bounce delay-500" />
        
        <div className="relative z-10 text-center text-white">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-3xl">P</span>
            </div>
            <span className="text-3xl font-bold">PrepPro</span>
          </Link>
          
          <div className="mb-6">
            <Button 
              variant="outline" 
              asChild
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <h2 className="text-4xl font-bold mb-4">Join thousands of students!</h2>
          <p className="text-xl text-white/80 mb-8">Start your journey to success today</p>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm">🚀</span>
              </div>
              <span>Get personalized study plans</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm">📊</span>
              </div>
              <span>Track your progress in real-time</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm">🎯</span>
              </div>
              <span>Land your dream job</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Create your account</h1>
            <p className="text-gray-600 text-lg">Start your placement prep journey</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                {error}
              </p>
            </div>
          )}

          {/* Signup Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</label>
                <Input 
                  id="name" 
                  name="name" 
                  type="text" 
                  placeholder="Enter your full name"
                  className="h-14 border-2 border-gray-200 bg-gray-50 focus:border-[#6633FF] focus:ring-4 focus:ring-[#6633FF]/10 focus:bg-white transition-all duration-200 text-lg"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="Enter your email"
                  className="h-14 border-2 border-gray-200 bg-gray-50 focus:border-[#6633FF] focus:ring-4 focus:ring-[#6633FF]/10 focus:bg-white transition-all duration-200 text-lg"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    required 
                    placeholder="Create a strong password"
                    className="h-14 border-2 border-gray-200 bg-gray-50 focus:border-[#6633FF] focus:ring-4 focus:ring-[#6633FF]/10 focus:bg-white transition-all duration-200 text-lg pr-12"
                    disabled={loading}
                    minLength={6}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
              </div>

              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  required
                  className="mt-1 rounded border-gray-300 text-[#6633FF] focus:ring-[#6633FF]" 
                />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the <Link href="#" className="text-[#6633FF] hover:underline">Terms of Service</Link> and <Link href="#" className="text-[#6633FF] hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-[#6633FF] to-[#AA66FF] hover:from-[#7744FF] hover:to-[#BB77FF] text-white font-bold text-lg rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  "Create your account"
                )}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account? <Link className="text-[#6633FF] hover:text-[#7744FF] font-semibold transition-colors" href="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

