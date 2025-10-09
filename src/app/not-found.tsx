"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Home, 
  ArrowLeft, 
  Search, 
  RefreshCw,
  AlertTriangle,
  Compass,
  BookOpen,
  Target,
  Zap
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6633FF] to-[#AA66FF] animate-pulse">
            404
          </div>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-red-400 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute top-1/2 -right-8 w-4 h-4 bg-green-400 rounded-full animate-bounce delay-500"></div>
        </div>

        {/* Error Message */}
        <Card className="p-8 mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
          </div>
          
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Oops! The page you're looking for seems to have wandered off into the digital void. 
            Don't worry, even the best developers get lost sometimes! 🚀
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
            <span>Error Code: 404</span>
            <span>•</span>
            <span>Page Not Found</span>
            <span>•</span>
            <span>Lost in Space</span>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Go Home</h3>
            <p className="text-sm text-gray-600 mb-4">Return to the main dashboard</p>
            <Link href="/dashboard">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Search</h3>
            <p className="text-sm text-gray-600 mb-4">Find what you're looking for</p>
            <Link href="/practice">
              <Button className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Refresh</h3>
            <p className="text-sm text-gray-600 mb-4">Try reloading the page</p>
            <Button 
              className="w-full" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </Card>
        </div>

        {/* Popular Pages */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-[#6633FF]/5 to-[#AA66FF]/5 border-[#6633FF]/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-center">
            <Compass className="w-5 h-5 mr-2 text-[#6633FF]" />
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard" className="group">
              <div className="p-4 rounded-lg border border-gray-200 hover:border-[#6633FF] hover:bg-[#6633FF]/5 transition-all duration-300 group">
                <Target className="w-6 h-6 text-[#6633FF] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Dashboard</p>
              </div>
            </Link>
            <Link href="/practice" className="group">
              <div className="p-4 rounded-lg border border-gray-200 hover:border-[#6633FF] hover:bg-[#6633FF]/5 transition-all duration-300 group">
                <BookOpen className="w-6 h-6 text-[#6633FF] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Practice</p>
              </div>
            </Link>
            <Link href="/profile" className="group">
              <div className="p-4 rounded-lg border border-gray-200 hover:border-[#6633FF] hover:bg-[#6633FF]/5 transition-all duration-300 group">
                <Home className="w-6 h-6 text-[#6633FF] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Profile</p>
              </div>
            </Link>
            <Link href="/settings" className="group">
              <div className="p-4 rounded-lg border border-gray-200 hover:border-[#6633FF] hover:bg-[#6633FF]/5 transition-all duration-300 group">
                <Zap className="w-6 h-6 text-[#6633FF] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Settings</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-6 bg-white/60 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you think this is a mistake, please contact our support team or try one of the options above.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Link>
            </Button>
          </div>
        </Card>

        {/* Fun ASCII Art */}
        <div className="mt-8 text-xs text-gray-400 font-mono">
          <pre className="hidden md:block">
{`
    ┌─────────────────────────────────────┐
    │  🚀 Lost in the digital universe?   │
    │     Don't worry, we'll find you!    │
    └─────────────────────────────────────┘
`}
          </pre>
        </div>
      </div>
    </div>
  );
}
