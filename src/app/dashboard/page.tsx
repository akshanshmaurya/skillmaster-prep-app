"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, getAuthUser } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Clock, Users, CheckCircle2, Target, Zap } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      const user = getAuthUser();
      
      if (!token || !user) {
        router.push('/login');
        return;
      }

      // Check if profile is complete, redirect if not
      if (!user.isProfileComplete) {
        router.push('/complete-profile');
        return;
      }
    };

    checkAuth();
  }, [router]);
  const stats = [
    { label: "Tests Taken", value: "24", icon: Target, color: "text-[#6633FF]" },
    { label: "Questions Solved", value: "342", icon: CheckCircle2, color: "text-[#00CC66]" },
    { label: "Study Hours", value: "48", icon: Clock, color: "text-[#AA66FF]" },
    { label: "Rank", value: "#127", icon: TrendingUp, color: "text-[#6633FF]" },
  ];

  const trendingTopics = [
    "Dynamic Programming", "System Design", "React Hooks", "Database Indexing",
    "Binary Trees", "REST APIs", "Docker", "AWS Services"
  ];

  const companies = [
    { name: "Google", tests: 12, logo: "🔵" },
    { name: "Amazon", tests: 18, logo: "🟠" },
    { name: "Microsoft", tests: 15, logo: "🔷" },
    { name: "Meta", tests: 10, logo: "🔵" },
  ];

  const recommendedTests = [
    {
      id: 1,
      title: "Full Stack Development Assessment",
      company: "Google",
      difficulty: "Medium",
      duration: "90 min",
      topics: ["React", "Node.js", "MongoDB"],
      attempted: 1240,
    },
    {
      id: 2,
      title: "Data Structures & Algorithms",
      company: "Amazon",
      difficulty: "Hard",
      duration: "120 min",
      topics: ["Arrays", "Trees", "DP"],
      attempted: 2150,
    },
    {
      id: 3,
      title: "System Design Fundamentals",
      company: "Microsoft",
      difficulty: "Medium",
      duration: "60 min",
      topics: ["Scalability", "Databases", "Caching"],
      attempted: 980,
    },
    {
      id: 4,
      title: "Frontend Development Challenge",
      company: "Meta",
      difficulty: "Easy",
      duration: "45 min",
      topics: ["JavaScript", "CSS", "React"],
      attempted: 1680,
    },
  ];

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Hero Section */}
        <section className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, Akshansh!</h1>
          <p className="text-muted-foreground text-lg">Continue your placement preparation journey</p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold">{stat.value}</div>
              </Card>
            );
          })}
        </section>

        {/* Search & Filter Section */}
        <section className="mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Search for tests, topics, or companies..." 
                  className="pl-11 h-12 text-lg bg-background"
                />
              </div>
              <Button size="lg" className="h-12 px-8">
                <Zap className="w-4 h-4 mr-2" />
                Quick Match
              </Button>
            </div>

            {/* Trending Topics */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Trending Topics</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Top Companies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Top Companies</h2>
          <div className="grid grid-cols-4 gap-4">
            {companies.map((company) => (
              <Card key={company.name} className="p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{company.logo}</span>
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">{company.tests} tests</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recommended Tests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recommended Tests</h2>
            <Button variant="ghost">View All →</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {recommendedTests.map((test) => (
              <Card key={test.id} className="p-6 hover:border-primary transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="outline" className="mb-2">{test.company}</Badge>
                    <h3 className="font-semibold text-lg">{test.title}</h3>
                  </div>
                  <Badge 
                    variant={test.difficulty === "Easy" ? "default" : test.difficulty === "Medium" ? "secondary" : "destructive"}
                  >
                    {test.difficulty}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {test.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {test.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {test.attempted.toLocaleString()} attempted
                  </div>
                </div>

                <Button className="w-full">Start Test</Button>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}


