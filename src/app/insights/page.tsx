"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  BookOpen,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trophy,
  ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";

export default function InsightsPage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // AI-powered data
  const overallScore = 76;
  const learningVelocity = 12; // % improvement per week
  const predictedScore = 85;

  const skillsData = [
    { skill: "Data Structures", current: 85, target: 95, industry: 80 },
    { skill: "Algorithms", current: 72, target: 90, industry: 75 },
    { skill: "System Design", current: 68, target: 85, industry: 70 },
    { skill: "Frontend Dev", current: 88, target: 95, industry: 82 },
    { skill: "Backend Dev", current: 75, target: 90, industry: 78 },
    { skill: "Databases", current: 70, target: 85, industry: 72 },
  ];

  const weaknessAnalysis = [
    {
      area: "Dynamic Programming",
      severity: "high",
      currentScore: 45,
      attempts: 12,
      avgScore: 68,
      improvement: -8,
      recommendation: "Focus on memoization patterns and classic DP problems",
      resources: ["LeetCode DP Patterns", "MIT OCW Algorithms", "AlgoExpert DP Course"]
    },
    {
      area: "Graph Algorithms",
      severity: "medium",
      currentScore: 62,
      attempts: 18,
      avgScore: 72,
      improvement: 5,
      recommendation: "Practice BFS/DFS variations and shortest path algorithms",
      resources: ["Graph Theory Basics", "Dijkstra's Algorithm Tutorial"]
    },
    {
      area: "Concurrency & Threading",
      severity: "high",
      currentScore: 48,
      attempts: 8,
      avgScore: 65,
      improvement: -12,
      recommendation: "Study race conditions, locks, and async patterns",
      resources: ["Java Concurrency in Practice", "OS Concepts - Threading"]
    },
    {
      area: "API Design",
      severity: "low",
      currentScore: 78,
      attempts: 15,
      avgScore: 75,
      improvement: 15,
      recommendation: "Explore REST best practices and GraphQL fundamentals",
      resources: ["REST API Design Guide", "GraphQL Documentation"]
    }
  ];

  const progressHistory = [
    { week: "Week 1", score: 58, testsTaken: 2, hoursStudied: 8 },
    { week: "Week 2", score: 62, testsTaken: 3, hoursStudied: 12 },
    { week: "Week 3", score: 65, testsTaken: 4, hoursStudied: 15 },
    { week: "Week 4", score: 70, testsTaken: 5, hoursStudied: 18 },
    { week: "Week 5", score: 73, testsTaken: 4, hoursStudied: 14 },
    { week: "Week 6", score: 76, testsTaken: 6, hoursStudied: 20 },
  ];

  const topicMastery = [
    { topic: "Arrays & Strings", mastery: 92, questions: 45, timeSpent: 12 },
    { topic: "Linked Lists", mastery: 85, questions: 28, timeSpent: 8 },
    { topic: "Trees & Graphs", mastery: 68, questions: 32, timeSpent: 15 },
    { topic: "Dynamic Programming", mastery: 45, questions: 18, timeSpent: 10 },
    { topic: "Sorting & Searching", mastery: 88, questions: 35, timeSpent: 9 },
    { topic: "Hash Tables", mastery: 90, questions: 30, timeSpent: 7 },
    { topic: "Recursion", mastery: 75, questions: 25, timeSpent: 11 },
    { topic: "System Design", mastery: 68, questions: 15, timeSpent: 14 },
  ];

  const learningPath = [
    {
      phase: "Current Week",
      focus: "Dynamic Programming Fundamentals",
      tasks: [
        { title: "Complete Fibonacci variations", completed: true },
        { title: "Master 0/1 Knapsack pattern", completed: true },
        { title: "Solve 10 medium DP problems", completed: false },
        { title: "Review memoization vs tabulation", completed: false }
      ]
    },
    {
      phase: "Next 2 Weeks",
      focus: "Advanced Algorithms & System Design",
      tasks: [
        { title: "Study graph traversal algorithms", completed: false },
        { title: "Practice distributed systems concepts", completed: false },
        { title: "Complete system design case studies", completed: false }
      ]
    },
    {
      phase: "Month 2",
      focus: "Mock Interviews & Real-world Projects",
      tasks: [
        { title: "Complete 15 mock interviews", completed: false },
        { title: "Build full-stack project portfolio", completed: false },
        { title: "Review top 100 company questions", completed: false }
      ]
    }
  ];

  const aiInsights = [
    {
      type: "strength",
      icon: CheckCircle2,
      color: "text-[#00CC66]",
      title: "Strong Foundation in Data Structures",
      description: "You consistently score 85%+ on array, string, and hash table problems. This solid foundation will help you tackle more complex challenges."
    },
    {
      type: "weakness",
      icon: AlertTriangle,
      color: "text-red-500",
      title: "Dynamic Programming Gap",
      description: "Your DP score (45%) is 23 points below average. This is a common pain point but critical for top-tier companies. Immediate focus recommended."
    },
    {
      type: "opportunity",
      icon: TrendingUp,
      color: "text-[#6633FF]",
      title: "Rapid Improvement in API Design",
      description: "15% improvement in just 2 weeks! Your learning velocity here suggests you're ready for advanced backend topics."
    },
    {
      type: "prediction",
      icon: Target,
      color: "text-[#AA66FF]",
      title: "85% Score Achievable in 4 Weeks",
      description: "Based on your current trajectory, maintaining 20 hours/week study will get you to target score by next month."
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-500 bg-red-500/10 border-red-500";
      case "medium": return "text-yellow-500 bg-yellow-500/10 border-yellow-500";
      case "low": return "text-[#00CC66] bg-[#00CC66]/10 border-[#00CC66]";
      default: return "";
    }
  };

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">AI-Powered Insights</h1>
              <p className="text-muted-foreground text-lg">Personalized analysis to accelerate your preparation</p>
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Score</span>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold mb-1">{overallScore}%</div>
            <div className="flex items-center gap-1 text-sm text-[#00CC66]">
              <TrendingUp className="w-4 h-4" />
              <span>+8% this week</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Learning Velocity</span>
              <Zap className="w-5 h-5 text-[#6633FF]" />
            </div>
            <div className="text-3xl font-bold mb-1">{learningVelocity}%</div>
            <p className="text-xs text-muted-foreground">Improvement per week</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Study Goal</span>
              <Target className="w-5 h-5 text-[#6633FF]" />
            </div>
            <div className="text-3xl font-bold mb-1">90%</div>
            <p className="text-xs text-muted-foreground">Target accuracy</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Predicted Score</span>
              <Brain className="w-5 h-5 text-[#AA66FF]" />
            </div>
            <div className="text-3xl font-bold mb-1">{predictedScore}%</div>
            <p className="text-xs text-muted-foreground">In 4 weeks</p>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="weaknesses">Fix My Weakness</TabsTrigger>
            <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
            <TabsTrigger value="mastery">Topic Mastery</TabsTrigger>
            <TabsTrigger value="path">Learning Path</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Skills Radar */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Skills Assessment</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={skillsData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="skill" className="text-xs" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    <Radar name="Target" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Radar name="Industry Avg" dataKey="industry" stroke="#6b7280" fill="#6b7280" fillOpacity={0.2} />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              {/* Progress Over Time */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Progress Over Time</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={progressHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="score" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} name="Score %" />
                    <Bar yAxisId="right" dataKey="testsTaken" fill="#10b981" name="Tests Taken" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* AI Insights Cards */}
            <div className="grid grid-cols-2 gap-4">
              {aiInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <Card key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${insight.color.replace('text-', 'bg-')}/10`}>
                        <Icon className={`w-6 h-6 ${insight.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Fix My Weakness Tab */}
          <TabsContent value="weaknesses" className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Critical Areas Needing Attention</h3>
                  <p className="text-muted-foreground mb-4">
                    Our AI has identified {weaknessAnalysis.filter(w => w.severity === 'high').length} high-priority areas 
                    where focused practice can significantly boost your score.
                  </p>
                  <Button>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Generate Custom Practice Plan
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {weaknessAnalysis.map((weakness, index) => (
                <Card key={index} className={`p-6 border-2 ${getSeverityColor(weakness.severity)}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{weakness.area}</h3>
                        <Badge variant={weakness.severity === 'high' ? 'destructive' : weakness.severity === 'medium' ? 'secondary' : 'default'}>
                          {weakness.severity.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Your Score</span>
                          <div className="text-2xl font-bold">{weakness.currentScore}%</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Attempts</span>
                          <div className="text-2xl font-bold">{weakness.attempts}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Average</span>
                          <div className="text-2xl font-bold">{weakness.avgScore}%</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Trend</span>
                          <div className={`text-2xl font-bold flex items-center gap-1 ${weakness.improvement > 0 ? 'text-[#00CC66]' : 'text-red-500'}`}>
                            {weakness.improvement > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            {Math.abs(weakness.improvement)}%
                          </div>
                        </div>
                      </div>
                      <Progress value={weakness.currentScore} className="h-2 mb-4" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Brain className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <span className="font-semibold">AI Recommendation:</span>
                        <p className="text-sm text-muted-foreground mt-1">{weakness.recommendation}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold">Recommended Resources:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {weakness.resources.map((resource, idx) => (
                            <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1">
                      <Target className="w-4 h-4 mr-2" />
                      Practice Now
                    </Button>
                    <Button variant="outline">
                      View Study Plan
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Progress Tracking Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Study Hours & Performance</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={progressHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} name="Score %" />
                  <Line yAxisId="right" type="monotone" dataKey="hoursStudied" stroke="#10b981" strokeWidth={3} name="Hours Studied" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-8 h-8 text-[#6633FF]" />
                  <div>
                    <div className="text-2xl font-bold">89h</div>
                    <div className="text-sm text-muted-foreground">Total Study Time</div>
                  </div>
                </div>
                <Progress value={74} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">74% towards 120h goal</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-8 h-8 text-[#00CC66]" />
                  <div>
                    <div className="text-2xl font-bold">24</div>
                    <div className="text-sm text-muted-foreground">Tests Completed</div>
                  </div>
                </div>
                <Progress value={80} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">80% towards 30 test goal</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-8 h-8 text-[#AA66FF]" />
                  <div>
                    <div className="text-2xl font-bold">+18%</div>
                    <div className="text-sm text-muted-foreground">Total Improvement</div>
                  </div>
                </div>
                <Progress value={60} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">On track for target</p>
              </Card>
            </div>
          </TabsContent>

          {/* Topic Mastery Tab */}
          <TabsContent value="mastery" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Topic-wise Mastery Levels</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topicMastery} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="topic" type="category" width={150} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="mastery" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {topicMastery.map((topic, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{topic.topic}</h4>
                    <Badge variant={topic.mastery >= 80 ? 'default' : topic.mastery >= 60 ? 'secondary' : 'destructive'}>
                      {topic.mastery}%
                    </Badge>
                  </div>
                  <Progress value={topic.mastery} className="h-2 mb-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Questions:</span>
                      <span className="font-semibold ml-2">{topic.questions}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-semibold ml-2">{topic.timeSpent}h</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Learning Path Tab */}
          <TabsContent value="path" className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#6633FF]/10">
                  <Lightbulb className="w-8 h-8 text-[#6633FF]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Personalized Learning Roadmap</h3>
                  <p className="text-muted-foreground">
                    AI-generated path optimized for your learning style, weaknesses, and target companies.
                    Follow this plan to reach 85% score in 4 weeks.
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              {learningPath.map((phase, phaseIndex) => (
                <Card key={phaseIndex} className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{phase.phase}</h3>
                        {phaseIndex === 0 && <Badge>Active</Badge>}
                      </div>
                      <p className="text-muted-foreground mb-4">Focus: {phase.focus}</p>
                      
                      <div className="space-y-2">
                        {phase.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-[#00CC66] border-[#00CC66]' : 'border-muted-foreground'}`}>
                              {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </div>
                            <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </span>
                            {!task.completed && (
                              <Button size="sm" variant="ghost">
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">
                            {phase.tasks.filter(t => t.completed).length}/{phase.tasks.length} completed
                          </span>
                        </div>
                        <Progress 
                          value={(phase.tasks.filter(t => t.completed).length / phase.tasks.length) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}