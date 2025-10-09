"use client";

import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, Users, TrendingUp, Filter } from "lucide-react";
import Link from "next/link";

export default function TestsPage() {
  const tests = [
    {
      id: "1",
      title: "Full Stack Development Assessment",
      company: "Google",
      difficulty: "Medium",
      duration: "90 min",
      questions: 50,
      topics: ["React", "Node.js", "MongoDB", "System Design"],
      attempted: 1240,
      avgScore: 72,
      badge: "Popular"
    },
    {
      id: "2",
      title: "Data Structures & Algorithms",
      company: "Amazon",
      difficulty: "Hard",
      duration: "120 min",
      questions: 40,
      topics: ["Arrays", "Trees", "DP", "Graphs"],
      attempted: 2150,
      avgScore: 65,
      badge: "Trending"
    },
    {
      id: "3",
      title: "System Design Fundamentals",
      company: "Microsoft",
      difficulty: "Medium",
      duration: "60 min",
      questions: 30,
      topics: ["Scalability", "Databases", "Caching", "Load Balancing"],
      attempted: 980,
      avgScore: 78,
      badge: null
    },
    {
      id: "4",
      title: "Frontend Development Challenge",
      company: "Meta",
      difficulty: "Easy",
      duration: "45 min",
      questions: 25,
      topics: ["JavaScript", "CSS", "React", "Accessibility"],
      attempted: 1680,
      avgScore: 81,
      badge: "Beginner Friendly"
    },
    {
      id: "5",
      title: "Advanced Python & ML",
      company: "DeepMind",
      difficulty: "Hard",
      duration: "150 min",
      questions: 35,
      topics: ["Python", "NumPy", "TensorFlow", "Algorithms"],
      attempted: 450,
      avgScore: 58,
      badge: "Expert"
    },
    {
      id: "6",
      title: "Cloud Architecture & DevOps",
      company: "AWS",
      difficulty: "Medium",
      duration: "75 min",
      questions: 40,
      topics: ["AWS", "Docker", "Kubernetes", "CI/CD"],
      attempted: 820,
      avgScore: 70,
      badge: "Popular"
    },
  ];

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        <section className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Practice Tests</h1>
          <p className="text-muted-foreground text-lg">Challenge yourself with company-specific assessments</p>
        </section>

        {/* Search & Filters */}
        <section className="mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tests..." 
                  className="pl-10 bg-background"
                />
              </div>
              <Select defaultValue="all-difficulty">
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-difficulty">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all-companies">
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-companies">All Companies</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="microsoft">Microsoft</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </Card>
        </section>

        {/* Test Grid */}
        <section>
          <div className="grid gap-4">
            {tests.map((test) => (
              <Card key={test.id} className="p-6 hover:border-primary transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{test.company}</Badge>
                      {test.badge && (
                        <Badge variant="secondary" className="gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {test.badge}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-xl mb-2">{test.title}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {test.topics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {test.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {test.questions} questions
                      </div>
                      <div>
                        {test.attempted.toLocaleString()} attempted
                      </div>
                      <div>
                        Avg Score: <span className="text-foreground font-semibold">{test.avgScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant={test.difficulty === "Easy" ? "default" : test.difficulty === "Medium" ? "secondary" : "destructive"}
                      className="mb-2"
                    >
                      {test.difficulty}
                    </Badge>
                    <Link href={`/tests/${test.id}/take`}>
                      <Button size="lg">Start Test</Button>
                    </Link>
                    <Button variant="ghost" size="sm">View Details</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}