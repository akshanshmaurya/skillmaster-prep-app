"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  Target,
  Brain,
  Share2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import Link from "next/link";

export default function TestResultsPage({ params }: { params: { id: string } }) {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Mock result data
  const result = {
    score: 78,
    totalQuestions: 50,
    correctAnswers: 39,
    incorrectAnswers: 8,
    skipped: 3,
    timeTaken: "78:45",
    accuracy: 83,
    percentile: 87,
    rank: 127,
    totalParticipants: 1240
  };

  const topicPerformance = [
    { topic: "Data Structures", score: 85, questions: 15, correct: 13 },
    { topic: "Algorithms", score: 72, questions: 12, correct: 9 },
    { topic: "System Design", score: 80, questions: 10, correct: 8 },
    { topic: "React", score: 90, questions: 8, correct: 7 },
    { topic: "Node.js", score: 60, questions: 5, correct: 3 },
  ];

  const difficultyBreakdown = [
    { name: "Easy", value: 15, correct: 14 },
    { name: "Medium", value: 25, correct: 19 },
    { name: "Hard", value: 10, correct: 6 },
  ];

  const timeAnalysis = [
    { question: "Q1-10", avgTime: 45, yourTime: 52 },
    { question: "Q11-20", avgTime: 60, yourTime: 55 },
    { question: "Q21-30", avgTime: 75, yourTime: 82 },
    { question: "Q31-40", avgTime: 90, yourTime: 78 },
    { question: "Q41-50", avgTime: 80, yourTime: 95 },
  ];

  const skillRadarData = [
    { skill: "Problem Solving", score: 85, fullMark: 100 },
    { skill: "Coding Speed", score: 72, fullMark: 100 },
    { skill: "Code Quality", score: 78, fullMark: 100 },
    { skill: "Logic", score: 88, fullMark: 100 },
    { skill: "Optimization", score: 65, fullMark: 100 },
    { skill: "Testing", score: 70, fullMark: 100 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Test Results</h1>
              <p className="text-muted-foreground text-lg">Full Stack Development Assessment • Google</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
              <Link href="/tests">
                <Button>Take Another Test</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Score Overview Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Score</span>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{result.score}%</div>
            <Progress value={result.score} className="h-2" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{result.accuracy}%</div>
            <p className="text-xs text-muted-foreground">{result.correctAnswers}/{result.totalQuestions} correct</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Percentile</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{result.percentile}th</div>
            <p className="text-xs text-muted-foreground">Better than {result.percentile}% of users</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Time Taken</span>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{result.timeTaken}</div>
            <p className="text-xs text-muted-foreground">Out of 90:00 minutes</p>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="topics">Topic Analysis</TabsTrigger>
            <TabsTrigger value="skills">Skills Radar</TabsTrigger>
            <TabsTrigger value="questions">Question Review</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Answer Distribution */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Answer Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Correct', value: result.correctAnswers },
                        { name: 'Incorrect', value: result.incorrectAnswers },
                        { name: 'Skipped', value: result.skipped }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#6b7280" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Correct ({result.correctAnswers})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Incorrect ({result.incorrectAnswers})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-sm">Skipped ({result.skipped})</span>
                  </div>
                </div>
              </Card>

              {/* Difficulty Breakdown */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Difficulty Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={difficultyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" name="Total Questions" />
                    <Bar dataKey="correct" fill="#10b981" name="Correct Answers" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Time Analysis */}
              <Card className="p-6 col-span-2">
                <h3 className="font-semibold text-lg mb-4">Time Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="question" className="text-xs" />
                    <YAxis className="text-xs" label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="avgTime" stroke="#6b7280" strokeWidth={2} name="Average Time" />
                    <Line type="monotone" dataKey="yourTime" stroke="#3b82f6" strokeWidth={2} name="Your Time" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Performance by Topic</h3>
              <div className="space-y-4">
                {topicPerformance.map((topic) => (
                  <div key={topic.topic}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{topic.topic}</span>
                        <Badge variant="outline">{topic.correct}/{topic.questions} correct</Badge>
                      </div>
                      <span className="text-2xl font-bold">{topic.score}%</span>
                    </div>
                    <Progress value={topic.score} className="h-3" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Brain className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">AI Recommendations</h3>
                  <p className="text-muted-foreground mb-4">
                    Based on your performance, we recommend focusing on these areas:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Badge variant="destructive" className="mt-0.5">Needs Improvement</Badge>
                      <div>
                        <span className="font-medium">Node.js Concepts</span>
                        <p className="text-sm text-muted-foreground">Score: 60% • Practice middleware, async/await patterns</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5">Good Progress</Badge>
                      <div>
                        <span className="font-medium">Algorithms</span>
                        <p className="text-sm text-muted-foreground">Score: 72% • Focus on dynamic programming problems</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="mt-0.5 bg-green-500">Strong</Badge>
                      <div>
                        <span className="font-medium">React Development</span>
                        <p className="text-sm text-muted-foreground">Score: 90% • Excellent! Keep practicing advanced patterns</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <Link href="/insights">
                <Button className="w-full mt-4">
                  View Detailed AI Analysis
                </Button>
              </Link>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Skills Assessment</h3>
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={skillRadarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="skill" className="text-sm" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Your Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
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
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            {[1, 2, 3, 4, 5].map((q) => (
              <Card key={q} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Question {q}</Badge>
                    <Badge variant="secondary">Data Structures</Badge>
                  </div>
                  {q <= 3 ? (
                    <Badge className="bg-green-500 gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Correct
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="w-3 h-3" />
                      Incorrect
                    </Badge>
                  )}
                </div>
                <h4 className="font-medium mb-2">
                  What is the time complexity of binary search in a sorted array?
                </h4>
                <div className="space-y-2 text-sm">
                  <div className={`p-3 rounded-lg ${q <= 3 ? 'bg-green-500/10 border border-green-500' : 'bg-muted'}`}>
                    <span className="font-medium">Your Answer:</span> O(log n)
                  </div>
                  {q > 3 && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500">
                      <span className="font-medium">Correct Answer:</span> O(n log n)
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}