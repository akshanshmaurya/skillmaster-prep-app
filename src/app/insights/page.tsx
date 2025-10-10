"use client";

import { useEffect, useMemo, useState } from "react";
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
import { testsApi } from "@/lib/api/tests";
import { insightsApi } from "@/lib/api/insights";

type HistoryEntry = Awaited<ReturnType<typeof testsApi.getHistory>>["history"][number];
type ProgressPoint = { week: string; score: number; testsTaken: number; hoursStudied: number };
type WeaknessView = {
  area: string;
  severity: 'high' | 'medium' | 'low';
  currentScore: number;
  attempts: number;
  avgScore: number;
  improvement: number;
  recommendation: string;
  resources: string[];
};
const HISTORY_LIMIT = 12;

export default function InsightsPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);

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
        console.warn("Unable to load assessment history for insights:", err);
        setHistoryError(err instanceof Error ? err.message : "Unable to load assessment history.");
      } finally {
        if (isMounted) {
          setHistoryLoading(false);
        }
      }
    };

    loadHistory();

    const loadOverview = async () => {
      try {
        const data = await insightsApi.getOverview();
        if (!isMounted) return;
        setInsights(data);
        setInsightsError(null);
      } catch (err) {
        if (!isMounted) return;
        console.warn('Unable to load insights overview:', err);
        setInsightsError(err instanceof Error ? err.message : 'Unable to load insights.');
      }
    };

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const derivedHistory = useMemo(() => {
    if (!history.length) {
      return null;
    }

    const sortedDesc = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sortedAsc = [...sortedDesc].reverse();
    const latest = sortedDesc[0];
    const previous = sortedDesc[1];

    const scoreSum = sortedDesc.reduce((acc, entry) => acc + entry.score, 0);
    const accuracySum = sortedDesc.reduce((acc, entry) => acc + entry.accuracy, 0);

  const improvement = previous ? latest.score - previous.score : 0;
  const velocity = previous ? ((latest.score - previous.score) / (previous.score || 1)) * 100 : 0;
    const progressSeries = sortedAsc.map((entry, index) => ({
      week: new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: Math.round(entry.score),
      testsTaken: index + 1,
      hoursStudied: Math.max(6, Math.round(entry.accuracy * 20))
    }));

    return {
      latestScore: Math.round(latest.score),
      averageScore: scoreSum / sortedDesc.length,
      averageAccuracy: accuracySum / sortedDesc.length,
  improvement,
  velocity,
      sortedDesc,
      progressSeries
    };
  }, [history]);

  const overallScore = insights?.overview?.latestScore ?? derivedHistory?.latestScore ?? 0;
  const learningVelocity = insights?.overview?.velocity ?? (derivedHistory ? Math.round(derivedHistory.velocity) : 0);
  const predictedScore = insights?.overview?.predictedScore ?? (derivedHistory ? Math.min(100, Math.round(derivedHistory.averageScore + Math.max(0, derivedHistory.improvement * 1.5))) : 0);
  const improvementDelta = insights?.overview?.improvement ?? (derivedHistory ? Math.round(derivedHistory.improvement) : 0);
  const velocityIsPositive = learningVelocity >= 0;
  const velocityTextClass = velocityIsPositive ? "text-[#00CC66]" : "text-red-500";

  const skillsData = (insights?.skillHeatmap || []).map((x: any) => ({
    skill: x.topic,
    current: x.score ?? 0,
    target: Math.min(100, Math.max((x.score ?? 0) + 10, 0)),
    industry: 75
  }));

  const weaknessAnalysis: WeaknessView[] = (insights?.weaknesses || []).map((w: any) => ({
    area: w.area,
    severity: (w.currentScore ?? 0) < 50 ? 'high' : (w.currentScore ?? 0) < 70 ? 'medium' : 'low',
    currentScore: w.currentScore ?? 0,
    attempts: w.attempts ?? 0,
    avgScore: w.avgScore ?? 0,
    improvement: w.improvement ?? 0,
    recommendation: w.recommendation || `Practice more on ${w.area}`,
    resources: [] as string[]
  }));

  const progressHistory: ProgressPoint[] = (insights?.progressSeries || []).map((p: any, idx: number) => ({
    week: new Date(p.label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: p.score ?? 0,
    testsTaken: p.testsTaken ?? (idx + 1),
    hoursStudied: p.hoursStudied ?? 0,
  }));

  const recentAssessments = useMemo(() => derivedHistory?.sortedDesc.slice(0, 5) ?? [], [derivedHistory]);

  const topicMastery: any[] = [];

  const learningPath: any[] = [];

  const aiInsights: any[] = [];

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
            <div
              className={`flex items-center gap-1 text-sm ${improvementDelta >= 0 ? "text-[#00CC66]" : "text-red-500"}`}
            >
              {improvementDelta >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{improvementDelta >= 0 ? "+" : "-"}{Math.abs(improvementDelta)} pts vs last session</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Learning Velocity</span>
              <Zap className="w-5 h-5 text-[#6633FF]" />
            </div>
            <div className={`text-3xl font-bold mb-1 ${velocityTextClass}`}>
              {`${velocityIsPositive ? "+" : "-"}${Math.abs(learningVelocity)}%`}
            </div>
            <p className="text-xs text-muted-foreground">Change vs previous session</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Study Goal</span>
              <Target className="w-5 h-5 text-[#6633FF]" />
            </div>
            <div className="text-3xl font-bold mb-1">{insights?.goals?.targetScore ?? 0}%</div>
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
                  <RadarChart data={skillsData.length ? skillsData : [{ skill: 'No data', current: 0, target: 0, industry: 0 }] }>
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
                  <ComposedChart data={progressHistory.length ? progressHistory : [{ week: 'No data', score: 0, testsTaken: 0, hoursStudied: 0 }] }>
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

            {/* Skills Heatmap (simple grid) */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Skills Heatmap</h3>
              {insightsError && (
                <div className="text-sm text-red-500 mb-2">{insightsError}</div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {(insights?.skillHeatmap || []).map((s: any, idx: number) => {
                  const score = s.score ?? 0;
                  const intensity = Math.min(100, Math.max(0, score));
                  return (
                    <div key={idx} className="p-3 rounded border" style={{
                      background: `rgba(102, 51, 255, ${0.1 + intensity/200})`,
                      borderColor: 'hsl(var(--border))'
                    }}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{String(s.topic || 'unknown').replace('-', ' ')}</span>
                        <span className="font-semibold">{score}</span>
                      </div>
                    </div>
                  );
                })}
                {(!insights?.skillHeatmap || insights.skillHeatmap.length === 0) && (
                  <div className="text-sm text-muted-foreground">No skill data yet</div>
                )}
              </div>
            </Card>

            {/* Recent Assessments */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Recent Assessments</h3>
                  <p className="text-sm text-muted-foreground">Live scores from your latest practice sessions.</p>
                </div>
                {historyLoading ? (
                  <Badge variant="outline" className="text-xs">Loading…</Badge>
                ) : null}
              </div>
              {historyError ? (
                <div className="rounded-lg border border-dashed border-red-200 bg-red-500/5 p-4 text-sm text-red-500">
                  {historyError}
                </div>
              ) : historyLoading ? (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Progress value={35} className="h-2 w-32" />
                  Syncing insights…
                </div>
              ) : recentAssessments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Complete an assessment in the Tests hub to unlock personalized insights here.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(recentAssessments || []).map((entry) => (
                    <div key={entry.sessionId} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="capitalize">{entry.topic.replace("-", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString(undefined, {
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
                    Our AI has identified {weaknessAnalysis.filter((w: WeaknessView) => w.severity === 'high').length} high-priority areas 
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
              {weaknessAnalysis.map((weakness: WeaknessView, index: number) => (
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
                          {weakness.resources.map((resource: string, idx: number) => (
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
                <LineChart data={progressHistory.length ? progressHistory : [{ week: 'No data', score: 0, hoursStudied: 0 }]}>
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
              {(() => {
                const totalHours = progressHistory.reduce<number>((sum: number, d: ProgressPoint) => sum + (d.hoursStudied || 0), 0);
                const testsCompleted = history.length;
                const firstScore = progressHistory[0]?.score ?? 0;
                const lastScore = progressHistory[progressHistory.length - 1]?.score ?? 0;
                const totalImprovement = (progressHistory.length > 1) ? (lastScore - firstScore) : 0;
                const hoursGoal = (insights?.goals?.weeklyHours ?? 0) * 4;
                const hoursPct = hoursGoal ? Math.min(100, Math.round((totalHours / hoursGoal) * 100)) : 0;
                const testsPct = 0;
                return (
                  <>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-8 h-8 text-[#6633FF]" />
                  <div>
                        <div className="text-2xl font-bold">{totalHours}h</div>
                        <div className="text-sm text-muted-foreground">Total Study Time</div>
                  </div>
                </div>
                    <Progress value={hoursPct} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">{hoursPct}% towards {hoursGoal}h goal</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-8 h-8 text-[#00CC66]" />
                  <div>
                        <div className="text-2xl font-bold">{testsCompleted}</div>
                        <div className="text-sm text-muted-foreground">Tests Completed</div>
                  </div>
                </div>
                    <Progress value={testsPct} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">{testsPct}% towards goal</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-8 h-8 text-[#AA66FF]" />
                  <div>
                        <div className="text-2xl font-bold">{totalImprovement >= 0 ? '+' : ''}{totalImprovement}%</div>
                        <div className="text-sm text-muted-foreground">Total Improvement</div>
                  </div>
                </div>
                    <Progress value={Math.min(100, Math.max(0, totalImprovement))} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">On track for target</p>
              </Card>
                  </>
                );
              })()}
            </div>
          </TabsContent>

          {/* Topic Mastery Tab */}
          <TabsContent value="mastery" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Topic-wise Mastery Levels (Upcoming)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topicMastery.length ? topicMastery : [{ topic: 'No data', mastery: 0 }]} layout="vertical">
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
                    This feature is coming soon. Your tailored learning plan will appear here once available.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}