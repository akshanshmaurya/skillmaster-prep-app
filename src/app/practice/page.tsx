"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, getAuthUser } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Star, 
  TrendingUp, 
  Target, 
  Zap,
  BookOpen,
  Code,
  Database,
  Globe,
  Smartphone,
  Server,
  Brain,
  CheckCircle2,
  Play,
  Award,
  Timer
} from "lucide-react";

export default function PracticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      const user = getAuthUser();
      
      if (!token || !user) {
        router.push('/login');
        return;
      }

      if (!user.isProfileComplete) {
        router.push('/complete-profile');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const categories = [
    { id: "all", name: "All Topics", icon: BookOpen, color: "bg-blue-500" },
    { id: "dsa", name: "Data Structures", icon: Database, color: "bg-green-500" },
    { id: "algorithms", name: "Algorithms", icon: Brain, color: "bg-purple-500" },
    { id: "frontend", name: "Frontend", icon: Globe, color: "bg-orange-500" },
    { id: "backend", name: "Backend", icon: Server, color: "bg-red-500" },
    { id: "mobile", name: "Mobile", icon: Smartphone, color: "bg-pink-500" },
    { id: "system-design", name: "System Design", icon: Code, color: "bg-indigo-500" },
  ];

  const difficulties = [
    { id: "all", name: "All Levels", color: "bg-gray-500" },
    { id: "easy", name: "Easy", color: "bg-green-500" },
    { id: "medium", name: "Medium", color: "bg-yellow-500" },
    { id: "hard", name: "Hard", color: "bg-red-500" },
  ];

  const practiceTests = [
    {
      id: 1,
      title: "Array Manipulation Mastery",
      category: "dsa",
      difficulty: "easy",
      duration: 45,
      questions: 20,
      completed: 1250,
      rating: 4.8,
      description: "Master the fundamentals of array operations and manipulations",
      topics: ["Arrays", "Two Pointers", "Sliding Window"],
      company: "Google",
      featured: true
    },
    {
      id: 2,
      title: "Dynamic Programming Deep Dive",
      category: "algorithms",
      difficulty: "hard",
      duration: 90,
      questions: 15,
      completed: 890,
      rating: 4.9,
      description: "Advanced dynamic programming patterns and optimization techniques",
      topics: ["DP", "Memoization", "Tabulation", "State Space"],
      company: "Amazon",
      featured: true
    },
    {
      id: 3,
      title: "React Hooks & State Management",
      category: "frontend",
      difficulty: "medium",
      duration: 60,
      questions: 25,
      completed: 2100,
      rating: 4.7,
      description: "Comprehensive React hooks and modern state management patterns",
      topics: ["useState", "useEffect", "Context", "Redux"],
      company: "Meta",
      featured: false
    },
    {
      id: 4,
      title: "RESTful API Design",
      category: "backend",
      difficulty: "medium",
      duration: 75,
      questions: 18,
      completed: 1650,
      rating: 4.6,
      description: "Design and implement scalable REST APIs",
      topics: ["REST", "HTTP", "Authentication", "Rate Limiting"],
      company: "Microsoft",
      featured: false
    },
    {
      id: 5,
      title: "Database Optimization",
      category: "backend",
      difficulty: "hard",
      duration: 80,
      questions: 22,
      completed: 980,
      rating: 4.8,
      description: "Advanced database query optimization and indexing strategies",
      topics: ["SQL", "Indexing", "Query Optimization", "NoSQL"],
      company: "Oracle",
      featured: true
    },
    {
      id: 6,
      title: "System Design Fundamentals",
      category: "system-design",
      difficulty: "hard",
      duration: 120,
      questions: 12,
      completed: 750,
      rating: 4.9,
      description: "Design scalable and distributed systems from scratch",
      topics: ["Scalability", "Load Balancing", "Caching", "Microservices"],
      company: "Netflix",
      featured: true
    }
  ];

  const recentTests = [
    { name: "Binary Tree Traversal", score: 85, date: "2 hours ago", difficulty: "Medium" },
    { name: "Graph Algorithms", score: 78, date: "1 day ago", difficulty: "Hard" },
    { name: "JavaScript Fundamentals", score: 92, date: "2 days ago", difficulty: "Easy" },
  ];

  const filteredTests = practiceTests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || test.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || test.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800 border-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading practice tests...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Practice Tests</h1>
          <p className="text-gray-600 text-lg">Sharpen your skills with our comprehensive test collection</p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                placeholder="Search tests, topics, or companies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-lg"
              />
            </div>
            <Button size="lg" className="h-12 px-8">
              <Zap className="w-4 h-4 mr-2" />
              Quick Match
            </Button>
          </div>

          {/* Category Filters */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`h-10 px-4 ${selectedCategory === category.id ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Filters */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Difficulty</h3>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((difficulty) => (
                <Button
                  key={difficulty.id}
                  variant={selectedDifficulty === difficulty.id ? "default" : "outline"}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  className={`h-10 px-4 capitalize ${selectedDifficulty === difficulty.id ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {difficulty.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Tests */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentTests.map((test, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{test.name}</h3>
                  <Badge className={getDifficultyColor(test.difficulty)}>
                    {test.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Score: {test.score}%</span>
                  <span>{test.date}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  <Play className="w-4 h-4 mr-2" />
                  Retake
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Practice Tests Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {selectedCategory === "all" ? "All Tests" : categories.find(c => c.id === selectedCategory)?.name}
              <span className="text-lg font-normal text-gray-500 ml-2">({filteredTests.length} tests)</span>
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Sort by: Popularity</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTests.map((test) => {
              const categoryInfo = categories.find(c => c.id === test.category);
              const Icon = categoryInfo?.icon || BookOpen;
              
              return (
                <Card key={test.id} className={`p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group ${test.featured ? 'ring-2 ring-primary/20' : ''}`}>
                  {test.featured && (
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Badge variant="secondary" className="text-xs">Featured</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${categoryInfo?.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{test.title}</h3>
                        <p className="text-sm text-gray-600">{test.description}</p>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(test.difficulty)}>
                      {test.difficulty}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {test.topics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{test.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>{test.questions} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{test.completed.toLocaleString()} completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{test.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{test.company}</span>
                    </div>
                    <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white">
                      <Play className="w-4 h-4 mr-2" />
                      Start Test
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredTests.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tests found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <Button onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedDifficulty("all");
            }}>
              Clear Filters
            </Button>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
