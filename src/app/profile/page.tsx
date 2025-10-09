"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  Code,
  Calendar,
  MapPin,
  Briefcase,
  Mail,
  Github,
  Linkedin,
  Globe,
  Edit,
  Settings
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  const userProfile = {
    name: "Alex Kumar",
    username: "@alexkumar",
    email: "alex.kumar@example.com",
    location: "San Francisco, CA",
    role: "Software Engineer",
    company: "Tech Startup",
    bio: "Passionate about algorithms and system design. Preparing for FAANG interviews. Love solving complex problems and building scalable systems.",
    joinDate: "January 2024",
    avatar: "AK"
  };

  const stats = {
    rank: 127,
    totalScore: 1685,
    testsCompleted: 24,
    questionsSolved: 342,
    studyHours: 89,
    streak: 12,
    accuracy: 78,
    avgTime: 45
  };

  const activityData = [
    { date: "Mon", questions: 8, hours: 2.5 },
    { date: "Tue", questions: 12, hours: 3.2 },
    { date: "Wed", questions: 6, hours: 1.8 },
    { date: "Thu", questions: 15, hours: 4.1 },
    { date: "Fri", questions: 10, hours: 2.9 },
    { date: "Sat", questions: 18, hours: 5.2 },
    { date: "Sun", questions: 14, hours: 3.8 }
  ];

  const skillsProgress = [
    { skill: "Data Structures", level: 85, total: 100, badge: "Advanced" },
    { skill: "Algorithms", level: 72, total: 100, badge: "Intermediate" },
    { skill: "System Design", level: 68, total: 100, badge: "Intermediate" },
    { skill: "Frontend", level: 88, total: 100, badge: "Advanced" },
    { skill: "Backend", level: 75, total: 100, badge: "Intermediate" },
    { skill: "Databases", level: 70, total: 100, badge: "Intermediate" }
  ];

  const achievements = [
    { name: "100 Day Streak", icon: "🔥", date: "Nov 2024", rarity: "Legendary" },
    { name: "Speed Demon", icon: "⚡", date: "Nov 2024", rarity: "Epic" },
    { name: "Problem Solver", icon: "🧩", date: "Oct 2024", rarity: "Rare" },
    { name: "Early Bird", icon: "🌅", date: "Oct 2024", rarity: "Common" },
    { name: "Night Owl", icon: "🦉", date: "Oct 2024", rarity: "Common" },
    { name: "Perfectionist", icon: "✨", date: "Sep 2024", rarity: "Epic" }
  ];

  const recentTests = [
    { name: "Google SWE Assessment", score: 82, date: "2 days ago", difficulty: "Hard" },
    { name: "Amazon Backend Challenge", score: 78, date: "5 days ago", difficulty: "Medium" },
    { name: "Meta Frontend Test", score: 85, date: "1 week ago", difficulty: "Medium" },
    { name: "Microsoft System Design", score: 75, date: "1 week ago", difficulty: "Hard" }
  ];

  const certifications = [
    { name: "Algorithm Expert", issuer: "PlacementPrep", date: "Nov 2024" },
    { name: "System Design Fundamentals", issuer: "PlacementPrep", date: "Oct 2024" }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Legendary": return "text-yellow-500 bg-yellow-500/10 border-yellow-500";
      case "Epic": return "text-purple-500 bg-purple-500/10 border-purple-500";
      case "Rare": return "text-blue-500 bg-blue-500/10 border-blue-500";
      default: return "text-gray-500 bg-gray-500/10 border-gray-500";
    }
  };

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Profile Header */}
        <Card className="p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarFallback className="text-3xl font-bold">
                  {userProfile.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{userProfile.name}</h1>
                  <Badge variant="outline" className="text-sm">
                    Rank #{stats.rank}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">{userProfile.username}</p>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{userProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{userProfile.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{userProfile.role} at {userProfile.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Joined {userProfile.joinDate}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground max-w-2xl">{userProfile.bio}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button variant="ghost" size="sm">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
            <Button variant="ghost" size="sm">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
            <Button variant="ghost" size="sm">
              <Globe className="w-4 h-4 mr-2" />
              Portfolio
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Score</span>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold">{stats.totalScore}</div>
            <div className="flex items-center gap-1 text-sm text-green-500 mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>+125 this week</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tests Completed</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold">{stats.testsCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">342 questions solved</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Study Hours</span>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{stats.studyHours}h</div>
            <Progress value={74} className="h-2 mt-2" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Streak</span>
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold">{stats.streak} days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it going! 🔥</p>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="history">Test History</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Weekly Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="questions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Study Time Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Recent Submissions</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Two Sum Problem</h4>
                        <p className="text-sm text-muted-foreground">Arrays • Easy</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">Accepted</Badge>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {skillsProgress.map((skill, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{skill.skill}</h4>
                    <Badge variant={skill.level >= 80 ? "default" : "secondary"}>
                      {skill.badge}
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-3" />
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    <Target className="w-4 h-4 mr-2" />
                    Practice {skill.skill}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <Card key={index} className={`p-6 border-2 ${getRarityColor(achievement.rarity)}`}>
                  <div className="text-center">
                    <div className="text-5xl mb-3">{achievement.icon}</div>
                    <h3 className="font-semibold text-lg mb-1">{achievement.name}</h3>
                    <Badge variant="outline" className="mb-2">{achievement.rarity}</Badge>
                    <p className="text-xs text-muted-foreground">Earned {achievement.date}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Test History Tab */}
          <TabsContent value="history" className="space-y-4">
            {recentTests.map((test, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{test.name}</h3>
                      <Badge variant={test.difficulty === "Hard" ? "destructive" : "secondary"}>
                        {test.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{test.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold mb-1">{test.score}%</div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {certifications.map((cert, index) => (
                <Card key={index} className="p-6 bg-gradient-to-br from-primary/10 to-blue-500/10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{cert.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Issued by {cert.issuer} • {cert.date}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Download</Button>
                        <Button variant="ghost" size="sm">Share</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-12 text-center border-2 border-dashed">
              <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Earn More Certificates</h3>
              <p className="text-muted-foreground mb-6">
                Complete courses and assessments to unlock certifications
              </p>
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}