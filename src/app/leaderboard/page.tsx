"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Crown,
  Zap,
  Target,
  Award,
  Users
} from "lucide-react";
import { testsApi } from "@/lib/api/tests";
import { dashboardApi } from "@/lib/api/dashboard";

type HistoryEntry = Awaited<ReturnType<typeof testsApi.getHistory>>["history"][number];
const HISTORY_LIMIT = 12;

type LeaderboardEntry = {
  id?: string;
  name: string;
  avatar?: string;
  rank: number;
  totalScore: number;
  testsCompleted: number;
  accuracy?: number | null;
};

type LeaderboardResponse = {
  top: LeaderboardEntry[];
};

type DashboardSummary = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
  stats?: {
    rank?: number | null;
    totalScore?: number;
    testsCompleted?: number;
    questionsSolved?: number;
    studyHours?: number;
    accuracy?: number | null;
    avgTime?: number | null;
  } | null;
  metrics?: {
    overall?: {
      testsCompleted?: number;
      avgScore?: number;
    } | null;
  } | null;
};

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState("weekly");
  const [category, setCategory] = useState("overall");
  const [selectedTab, setSelectedTab] = useState("global");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLeaderboard = async () => {
      try {
        const [leaderboardResult, summaryResult] = await Promise.allSettled([
          dashboardApi.getLeaderboard(50),
          dashboardApi.getSummary()
        ]);

        if (!isMounted) {
          return;
        }

        if (leaderboardResult.status === "fulfilled") {
          const parsedLeaderboard = ((leaderboardResult.value as LeaderboardResponse | undefined)?.top) ?? [];
          setLeaderboardEntries(parsedLeaderboard);
          setLeaderboardError(null);
        } else {
          console.warn("Unable to load leaderboard data:", leaderboardResult.reason);
          setLeaderboardEntries([]);
          setLeaderboardError(
            leaderboardResult.reason instanceof Error
              ? leaderboardResult.reason.message
              : "Unable to load leaderboard data."
          );
        }

        if (summaryResult.status === "fulfilled") {
          setSummary((summaryResult.value as DashboardSummary) ?? null);
        } else {
          console.warn("Unable to load summary data:", summaryResult.reason);
          setSummary(null);
        }
      } finally {
        if (isMounted) {
          setLeaderboardLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const response = await testsApi.getHistory(HISTORY_LIMIT);
        if (!isMounted) return;
        setHistory(response.history);
        setHistoryError(null);
      } catch (err) {
        if (!isMounted) return;
        console.warn("Unable to load leaderboard history:", err);
        setHistoryError(err instanceof Error ? err.message : "Unable to load recent assessments.");
      } finally {
        if (isMounted) {
          setHistoryLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const personalStats = useMemo(() => {
    if (!history.length) {
      return null;
    }

    const sortedDesc = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latest = sortedDesc[0];
    const totalTests = sortedDesc.length;
    const bestScore = sortedDesc.reduce((max, entry) => Math.max(max, entry.score), 0);
    const averageScore = sortedDesc.reduce((sum, entry) => sum + entry.score, 0) / totalTests;
    const averageAccuracy = sortedDesc.reduce((sum, entry) => sum + entry.accuracy, 0) / totalTests;

    return {
      latest,
      totalTests,
      bestScore,
      averageScore,
      averageAccuracy
    };
  }, [history]);

  const recentAssessments = useMemo(() => {
    if (!history.length) {
      return [] as HistoryEntry[];
    }
    return [...history]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [history]);

  const latestScoreDisplay = personalStats ? Math.round(personalStats.latest.score) : null;
  const averageScoreDisplay = personalStats
    ? Math.round(personalStats.averageScore)
    : summary?.metrics?.overall?.avgScore != null
    ? Math.round(summary.metrics.overall.avgScore)
    : null;
  const averageAccuracyDisplay = personalStats
    ? Math.round(personalStats.averageAccuracy * 100)
    : summary?.stats?.accuracy != null
    ? Math.round((summary.stats.accuracy <= 1 ? summary.stats.accuracy * 100 : summary.stats.accuracy))
    : null;
  const bestScoreDisplay = personalStats
    ? Math.round(personalStats.bestScore)
    : summary?.stats?.totalScore != null
    ? Math.round(summary.stats.totalScore)
    : null;
  const totalTestsCompleted = personalStats?.totalTests
    ?? summary?.metrics?.overall?.testsCompleted
    ?? summary?.stats?.testsCompleted
    ?? 0;

  const currentUserRank = summary?.stats?.rank ?? null;

  const topPerformers = useMemo(() => leaderboardEntries.slice(0, 3), [leaderboardEntries]);
  const tableEntries = leaderboardEntries;

  const achievements = useMemo(() => {
    if (!leaderboardEntries.length) {
      return [] as Array<{ name: string; icon: typeof Trophy; color: string; count: number }>;
    }

    const totalCompetitors = leaderboardEntries.length;
    const totalScore = leaderboardEntries.reduce((sum, entry) => sum + entry.totalScore, 0);
    const avgScore = totalCompetitors ? Math.round(totalScore / totalCompetitors) : 0;
    const highestScore = leaderboardEntries.reduce((max, entry) => Math.max(max, entry.totalScore), 0);
    const totalTests = leaderboardEntries.reduce((sum, entry) => sum + entry.testsCompleted, 0);

    return [
      { name: "Total Competitors", icon: Trophy, color: "text-yellow-500", count: totalCompetitors },
      { name: "Average Score", icon: Zap, color: "text-[#6633FF]", count: avgScore },
      { name: "Top Score", icon: Target, color: "text-[#00CC66]", count: highestScore },
      { name: "Combined Tests", icon: Award, color: "text-[#AA66FF]", count: totalTests }
    ];
  }, [leaderboardEntries]);

  const getInitials = (name?: string | null, fallback?: string | null) => {
    const source = name && name.trim().length ? name : fallback ? fallback.split("@")[0] : "";
    if (!source) {
      return "--";
    }
    const parts = source.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  };

  const formatAccuracy = (value?: number | null) => {
    if (value == null) {
      return "—";
    }
    const percent = value <= 1 ? value * 100 : value;
    return `${Math.round(percent)}%`;
  };

  const currentUserName = summary?.user?.name || summary?.user?.email?.split("@")[0] || "You";
  const currentUserAvatar = summary?.user?.avatar;
  const currentUserInitials = getInitials(summary?.user?.name, summary?.user?.email);

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
                <div className="text-4xl font-bold mb-1">{currentUserRank != null ? `#${currentUserRank}` : "—"}</div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-12 h-12">
                    {currentUserAvatar ? (
                      <AvatarImage src={currentUserAvatar} alt={currentUserName} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {currentUserInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{currentUserName}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Avg score: {averageScoreDisplay != null ? Math.round(averageScoreDisplay) : "—"}</Badge>
                      <Badge variant="outline">Avg accuracy: {averageAccuracyDisplay != null ? `${averageAccuracyDisplay}%` : "—"}</Badge>
                      <Badge variant="secondary">Sessions: {totalTestsCompleted}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-[#00CC66] mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Best: {bestScoreDisplay != null ? bestScoreDisplay : "—"}</span>
              </div>
              <p className="text-sm text-muted-foreground">Latest score {latestScoreDisplay != null ? latestScoreDisplay : "—"}</p>
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
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Your recent assessments</h3>
                  <p className="text-sm text-muted-foreground">Latest sessions feeding your leaderboard position.</p>
                </div>
                {historyLoading ? (
                  <Badge variant="outline" className="text-xs">Syncing…</Badge>
                ) : null}
              </div>
              {historyError ? (
                <div className="rounded-lg border border-dashed border-red-200 bg-red-500/5 p-4 text-sm text-red-500">
                  {historyError}
                </div>
              ) : historyLoading ? (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Progress value={45} className="h-2 w-32" />
                  Calculating momentum…
                </div>
              ) : recentAssessments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No scored assessments yet. Launch one from the Tests tab to join the leaderboard.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recentAssessments.map((entry) => (
                    <div key={entry.sessionId} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="capitalize">{entry.topic.replace("-", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="text-2xl font-semibold">{Math.round(entry.score)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Accuracy</p>
                          <p className="text-lg font-semibold">{Math.round(entry.accuracy * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-3">
              {leaderboardLoading
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <Card key={`leaderboard-skeleton-${idx}`} className="p-6 space-y-4 animate-pulse">
                      <div className="h-6 w-16 mx-auto rounded bg-muted"></div>
                      <div className="h-20 w-20 mx-auto rounded-full bg-muted" />
                      <div className="h-4 w-32 mx-auto rounded bg-muted"></div>
                      <div className="space-y-2 pt-2">
                        <div className="h-3 w-full rounded bg-muted"></div>
                        <div className="h-3 w-full rounded bg-muted"></div>
                        <div className="h-3 w-2/3 rounded bg-muted"></div>
                      </div>
                    </Card>
                  ))
                : leaderboardError
                ? (
                    <Card className="col-span-full p-6 text-center text-sm text-red-500 border-red-200 bg-red-500/5">
                      {leaderboardError}
                    </Card>
                  )
                : topPerformers.length
                ? topPerformers.map((performer) => {
                    const gradientClass =
                      performer.rank === 1
                        ? "bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/50"
                        : performer.rank === 2
                        ? "bg-gradient-to-b from-gray-400/20 to-transparent border-gray-400/50"
                        : "bg-gradient-to-b from-orange-600/20 to-transparent border-orange-600/50";
                    return (
                      <Card key={performer.rank} className={`p-6 text-center ${gradientClass}`}>
                        <div className="flex justify-center mb-4">{getRankIcon(performer.rank)}</div>
                        <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-background">
                          {performer.avatar ? <AvatarImage src={performer.avatar} alt={performer.name} /> : null}
                          <AvatarFallback className="text-2xl font-bold">
                            {getInitials(performer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-xl mb-2">{performer.name}</h3>
                        {getRankBadge(performer.rank)}
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Score</span>
                            <span className="font-semibold">{performer.totalScore.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Accuracy</span>
                            <span className="font-semibold">{formatAccuracy(performer.accuracy)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tests</span>
                            <span className="font-semibold">{performer.testsCompleted}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                : (
                    <Card className="col-span-full p-6 text-center text-sm text-muted-foreground">
                      No leaderboard data yet. Complete assessments to appear here.
                    </Card>
                  )}
            </div>

            {/* Full Leaderboard Table */}
            <Card className="overflow-hidden">
              {leaderboardLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading leaderboard…</div>
              ) : leaderboardError ? (
                <div className="p-6 text-sm text-red-500">{leaderboardError}</div>
              ) : tableEntries.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No leaderboard data available yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Total Score</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Tests Completed</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableEntries.map((entry) => {
                        const isCurrentUser = summary?.user?.id && entry.id === summary.user.id;
                        return (
                          <tr
                            key={entry.id ?? entry.rank}
                            className={`border-b border-border hover:bg-muted/30 transition-colors ${
                              isCurrentUser ? "bg-primary/5" : ""
                            }`}
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
                                  {entry.avatar ? <AvatarImage src={entry.avatar} alt={entry.name} /> : null}
                                  <AvatarFallback className="font-semibold">
                                    {getInitials(entry.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold">{entry.name}</div>
                                  {getRankBadge(entry.rank) ? (
                                    <div className="mt-1">{getRankBadge(entry.rank)}</div>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-lg">{entry.totalScore.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-muted-foreground">{entry.testsCompleted}</span>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline">{formatAccuracy(entry.accuracy)}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
            {leaderboardLoading ? (
              <Card className="p-6 text-sm text-muted-foreground">Loading leaderboard insights…</Card>
            ) : achievements.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground">No leaderboard insights yet.</Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
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
                            Value: {achievement.count.toLocaleString()}
                          </p>
                          <Badge variant="outline">Leaderboard metric</Badge>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}