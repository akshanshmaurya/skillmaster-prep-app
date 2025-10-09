"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Crown,
  Zap,
  Target,
  Clock,
  Award,
  Users,
  Filter
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  testsCompleted: number;
  accuracy: number;
  streak: number;
  change: number;
  badges: string[];
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState("weekly");
  const [category, setCategory] = useState("overall");
  const [selectedTab, setSelectedTab] = useState("global");

  const currentUserRank = 127;

  const topPerformers: LeaderboardEntry[] = [
    {
      rank: 1,
      name: "Sarah Chen",
      avatar: "SC",
      score: 2450,
      testsCompleted: 48,
      accuracy: 94,
      streak: 28,
      change: 2,
      badges: ["Top Performer", "100 Day Streak", "Problem Solver"]
    },
    {
      rank: 2,
      name: "Rahul Sharma",
      avatar: "RS",
      score: 2380,
      testsCompleted: 52,
      accuracy: 92,
      streak: 21,
      change: -1,
      badges: ["Algorithm Master", "Speed Demon"]
    },
    {
      rank: 3,
      name: "Emily Johnson",
      avatar: "EJ",
      score: 2290,
      testsCompleted: 45,
      accuracy: 91,
      streak: 19,
      change: 1,
      badges: ["System Design Pro", "Full Stack"]
    }
  ];

  const leaderboardData: LeaderboardEntry[] = [
    ...topPerformers,
    {
      rank: 4,
      name: "Michael Park",
      avatar: "MP",
      score: 2180,
      testsCompleted: 41,
      accuracy: 89,
      streak: 15,
      change: 3,
      badges: ["Data Structures"]
    },
    {
      rank: 5,
      name: "Priya Patel",
      avatar: "PP",
      score: 2120,
      testsCompleted: 38,
      accuracy: 90,
      streak: 12,
      change: -2,
      badges: ["Frontend Guru"]
    },
    {
      rank: 6,
      name: "David Lee",
      avatar: "DL",
      score: 2050,
      testsCompleted: 44,
      accuracy: 87,
      streak: 18,
      change: 0,
      badges: ["Backend Expert"]
    },
    {
      rank: 7,
      name: "Anna Martinez",
      avatar: "AM",
      score: 1980,
      testsCompleted: 36,
      accuracy: 88,
      streak: 10,
      change: 4,
      badges: ["Rising Star"]
    },
    {
      rank: 8,
      name: "James Wilson",
      avatar: "JW",
      score: 1920,
      testsCompleted: 40,
      accuracy: 86,
      streak: 14,
      change: -1,
      badges: ["Consistent"]
    }
  ];

  const achievements = [
    { name: "Top 100", icon: Trophy, color: "text-yellow-500", count: 1240 },
    { name: "Speed Run", icon: Zap, color: "text-blue-500", count: 856 },
    { name: "Perfect Score", icon: Target, color: "text-green-500", count: 432 },
    { name: "100 Tests", icon: Award, color: "text-purple-500", count: 2180 }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 Champion</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 Runner-up</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600">🥉 Third Place</Badge>;
    if (rank <= 10) return <Badge variant="default">Top 10</Badge>;
    if (rank <= 100) return <Badge variant="secondary">Top 100</Badge>;
    return null;
  };

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
              <p className="text-muted-foreground text-lg">
                Compete with thousands of candidates worldwide
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Score</SelectItem>
                  <SelectItem value="algorithms">Algorithms</SelectItem>
                  <SelectItem value="system-design">System Design</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Your Rank Card */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">#{currentUserRank}</div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      AK
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">Alex Kumar (You)</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Score: 1685</Badge>
                      <Badge variant="outline">Accuracy: 78%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-500 mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">+12 positions</span>
              </div>
              <p className="text-sm text-muted-foreground">↑ from last week</p>
              <Button className="mt-3">
                <Zap className="w-4 h-4 mr-2" />
                Boost Your Rank
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="global">
              <Users className="w-4 h-4 mr-2" />
              Global Leaderboard
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Global Leaderboard */}
          <TabsContent value="global" className="space-y-6">
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {topPerformers.map((performer) => (
                <Card
                  key={performer.rank}
                  className={`p-6 text-center ${
                    performer.rank === 1
                      ? "bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/50"
                      : performer.rank === 2
                      ? "bg-gradient-to-b from-gray-400/20 to-transparent border-gray-400/50"
                      : "bg-gradient-to-b from-orange-600/20 to-transparent border-orange-600/50"
                  }`}
                >
                  <div className="flex justify-center mb-4">
                    {getRankIcon(performer.rank)}
                  </div>
                  <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-background">
                    <AvatarFallback className="text-2xl font-bold">
                      {performer.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-xl mb-2">{performer.name}</h3>
                  {getRankBadge(performer.rank)}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-semibold">{performer.score}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Accuracy</span>
                      <span className="font-semibold">{performer.accuracy}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Streak</span>
                      <span className="font-semibold">{performer.streak} days 🔥</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Full Leaderboard Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Score</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Tests</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Accuracy</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Streak</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Change</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, index) => (
                      <tr
                        key={index}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {entry.rank <= 3 ? (
                              getRankIcon(entry.rank)
                            ) : (
                              <span className="font-semibold text-lg">#{entry.rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="font-semibold">
                                {entry.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{entry.name}</div>
                              {getRankBadge(entry.rank) && (
                                <div className="mt-1">{getRankBadge(entry.rank)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-lg">{entry.score}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground">{entry.testsCompleted}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline">{entry.accuracy}%</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{entry.streak}</span>
                            <span className="text-orange-500">🔥</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {entry.change !== 0 && (
                            <div
                              className={`flex items-center gap-1 ${
                                entry.change > 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {entry.change > 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="font-semibold">{Math.abs(entry.change)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {entry.badges.slice(0, 2).map((badge, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                            {entry.badges.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.badges.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Connect with Friends</h3>
              <p className="text-muted-foreground mb-6">
                Add friends to compete and compare your progress
              </p>
              <Button size="lg">
                <Users className="w-4 h-4 mr-2" />
                Find Friends
              </Button>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-2 gap-6">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <Card key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-lg ${achievement.color.replace('text-', 'bg-')}/10`}>
                        <Icon className={`w-8 h-8 ${achievement.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Earned by {achievement.count.toLocaleString()} users
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Unlocked</Badge>
                          <span className="text-xs text-muted-foreground">
                            Earned on Nov 15, 2024
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}