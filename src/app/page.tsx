"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { useInView } from "@/hooks/useInView";
import { 
  Target, Brain, Trophy, MessageSquare, User, Settings, BookOpen, 
  Rocket, BarChart3, Zap, Code, LineChart, Award, Users, TrendingUp, 
  CheckCircle, Star, ArrowRight, Play, Clock, Shield, Globe, 
  Smartphone, Database, Server, Layers3, Home as HomeIcon, LogIn, UserPlus,
  ChevronDown, Sparkles, Lightbulb, Target as TargetIcon, 
  BookOpen as BookIcon, Brain as BrainIcon, Trophy as TrophyIcon,
  MessageSquare as MessageIcon, User as UserIcon, Settings as SettingsIcon
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const prefersReduced = usePrefersReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleGetStarted() {
    const loggedIn = isAuthenticated();
    router.push(loggedIn ? "/dashboard" : "/signup");
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 underline">Skip to content</a>
      <Nav scrolled={scrolled} />
      
      <main id="content" className="relative z-10">
        {/* Hero Section */}
        <section ref={heroRef} className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center">
          
          <h1 className="mx-auto max-w-5xl text-6xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Master Placements
            </span>
            <br />
            <span className="text-gray-900">
              with AI-Powered Practice
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-600 leading-relaxed">
            The only platform that combines adaptive practice, realistic company tests, 
            AI insights, and interview preparation to get you placed faster.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={handleGetStarted} 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Learning Free
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: "50K+", label: "Students" },
              { number: "95%", label: "Success Rate" },
              { number: "500+", label: "Companies" },
              { number: "24/7", label: "Support" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Everything you need to get placed
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our comprehensive platform covers every aspect of placement preparation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: "Smart Dashboard",
                  description: "Track your progress, identify strengths, and get personalized recommendations",
                  href: "/dashboard",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: BookOpen,
                  title: "Practice Tests",
                  description: "1000+ questions across all topics with adaptive difficulty and instant feedback",
                  href: "/practice",
                  color: "from-green-500 to-emerald-500"
                },
                {
                  icon: Brain,
                  title: "AI Insights",
                  description: "Get detailed analytics on your performance with actionable improvement tips",
                  href: "/insights",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: Trophy,
                  title: "Leaderboard",
                  description: "Compete with peers and see how you rank globally and in your college",
                  href: "/leaderboard",
                  color: "from-yellow-500 to-orange-500"
                },
                {
                  icon: MessageSquare,
                  title: "Interview Prep",
                  description: "Mock interviews, group discussions, and HR round preparation",
                  href: "/interview",
                  color: "from-red-500 to-rose-500"
                },
                {
                  icon: User,
                  title: "Profile & Resume",
                  description: "Build your professional profile and get resume optimization tips",
                  href: "/profile",
                  color: "from-indigo-500 to-purple-500"
                }
              ].map((feature, index) => (
                <Card key={index} className="group p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                  <Button asChild variant="outline" className="group-hover:bg-gray-900 group-hover:text-white transition-colors">
                    <Link href={feature.href}>
                      Explore <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trusted By Companies */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Trusted by top companies
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Students from our platform have successfully landed jobs at these amazing companies
              </p>
            </div>

            <div className="relative overflow-hidden">
              {/* First row - scrolling left */}
              <div className="flex gap-8 animate-scroll-left mb-8">
                {[
                  { name: "Google", logo: "G" },
                  { name: "Microsoft", logo: "M" },
                  { name: "Amazon", logo: "A" },
                  { name: "Meta", logo: "M" },
                  { name: "Apple", logo: "A" },
                  { name: "Netflix", logo: "N" },
                  { name: "Uber", logo: "U" },
                  { name: "Airbnb", logo: "A" },
                  { name: "Google", logo: "G" },
                  { name: "Microsoft", logo: "M" },
                  { name: "Amazon", logo: "A" },
                  { name: "Meta", logo: "M" }
                ].map((company, i) => (
                  <div 
                    key={`row1-${i}`}
                    className="flex-shrink-0 flex items-center gap-4 px-8 py-6 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 min-w-[200px] group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white text-xl group-hover:scale-110 transition-transform duration-300">
                      {company.logo}
                    </div>
                    <span className="text-white/90 font-semibold text-lg whitespace-nowrap">{company.name}</span>
                  </div>
                ))}
              </div>
              
              {/* Second row - scrolling right */}
              <div className="flex gap-8 animate-scroll-right">
                {[
                  { name: "TCS", logo: "T" },
                  { name: "Infosys", logo: "I" },
                  { name: "Wipro", logo: "W" },
                  { name: "Accenture", logo: "A" },
                  { name: "Cognizant", logo: "C" },
                  { name: "Deloitte", logo: "D" },
                  { name: "Capgemini", logo: "C" },
                  { name: "IBM", logo: "I" },
                  { name: "TCS", logo: "T" },
                  { name: "Infosys", logo: "I" },
                  { name: "Wipro", logo: "W" },
                  { name: "Accenture", logo: "A" }
                ].map((company, i) => (
                  <div 
                    key={`row2-${i}`}
                    className="flex-shrink-0 flex items-center gap-4 px-8 py-6 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 min-w-[200px] group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white text-xl group-hover:scale-110 transition-transform duration-300">
                      {company.logo}
                    </div>
                    <span className="text-white/90 font-semibold text-lg whitespace-nowrap">{company.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                What our students say
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join thousands of successful students who got placed with PrepPro
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Priya Sharma",
                  role: "Software Engineer at Google",
                  content: "PrepPro's AI insights helped me identify my weak areas and improve my coding speed by 40%. Got placed in just 2 months!",
                  rating: 5,
                  avatar: "PS"
                },
                {
                  name: "Arjun Patel",
                  role: "Data Scientist at Microsoft",
                  content: "The practice tests are exactly like real company tests. The detailed explanations helped me understand concepts I was missing.",
                  rating: 5,
                  avatar: "AP"
                },
                {
                  name: "Sneha Reddy",
                  role: "Product Manager at Amazon",
                  content: "The interview preparation section is amazing. Mock interviews with real feedback helped me ace my actual interviews.",
                  rating: 5,
                  avatar: "SR"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="p-8 bg-white hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
                ))}
              </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to get placed?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join thousands of students who are already on their way to their dream jobs. 
              Start your placement journey today!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              <Button 
                asChild
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold"
              >
                <Link href="/login">
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </main>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 30s linear infinite;
        }
        .animate-scroll-left:hover,
        .animate-scroll-right:hover {
          animation-play-state: paused;
        }
      `}</style>
                </div>
  );
}

function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <div className={cn(
      "fixed inset-x-0 top-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-lg" : "bg-transparent"
    )}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            PrepPro
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
            Features
          </Link>
          <Link href="#testimonials" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
            Testimonials
          </Link>
          <Link href="/practice" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
            Practice
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            asChild
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            <Link href="/login">Sign In</Link>
          </Button>

          <Button
            asChild
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
              <span className="text-2xl font-bold">PrepPro</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              The ultimate platform for placement preparation. Master coding, aptitude, 
              and interview skills with AI-powered insights and personalized practice.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Practice", href: "/practice" },
                { name: "Tests", href: "/tests" },
                { name: "Leaderboard", href: "/leaderboard" },
                { name: "Profile", href: "/profile" }
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {[
                { name: "Help Center", href: "#" },
                { name: "Contact Us", href: "#" },
                { name: "Privacy Policy", href: "#" },
                { name: "Terms of Service", href: "#" },
                { name: "FAQ", href: "#" }
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} PrepPro. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-gray-400 text-sm">Made with ❤️ for students</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function usePrefersReducedMotion() {
  const [val, setVal] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setVal(mq.matches);
    const onChange = () => setVal(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return val;
}