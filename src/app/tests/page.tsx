"use client";

import { useEffect, useMemo, useState, useCallback, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code,
  Compass,
  Cpu,
  Database,
  History,
  Layers,
  Network,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  CircuitBoard,
  Clock
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

import { getAuthToken, getAuthUser } from "@/lib/auth";
import {
  testsApi,
  type AssessmentTrack,
  type AssessmentTopic,
  type AssessmentDifficulty,
  type AssessmentQuestion,
  type AssessmentEvaluation,
  type AssessmentSummary,
  type AssessmentTrackDefinition
} from "@/lib/api/tests";
import { cn } from "@/lib/utils";

type TrackMeta = {
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  label: string;
  blurb: string;
};

const TRACK_META: Record<AssessmentTrack, TrackMeta> = {
  "soft-skills": {
    icon: Brain,
    gradient: "from-rose-500 to-orange-500",
    label: "Soft Skills Aptitude",
    blurb: "Quantitative, verbal, and logical agility drills"
  },
  "technical-skills": {
    icon: Layers,
    gradient: "from-indigo-500 to-blue-500",
    label: "Technical Core Sprint",
    blurb: "Coding, cloud, databases, OS, networks, and design"
  }
};

const TOPIC_ICONS: Record<AssessmentTopic, ComponentType<{ className?: string }>> = {
  quant: Calculator,
  verbal: Brain,
  aptitude: Compass,
  coding: Code,
  cloud: Cloud,
  dbms: Database,
  "operating-systems": Cpu,
  networks: Network,
  "system-design": CircuitBoard
};

const DIFFICULTY_META: Record<AssessmentDifficulty, { label: string; blurb: string; accent: string }> = {
  beginner: {
    label: "Beginner",
    blurb: "Warm up fundamentals with scaffolded prompts.",
    accent: "bg-emerald-100 text-emerald-700 border-emerald-200"
  },
  intermediate: {
    label: "Intermediate",
    blurb: "Timed reasoning and multi-step logic challenges.",
    accent: "bg-amber-100 text-amber-700 border-amber-200"
  },
  advanced: {
    label: "Advanced",
    blurb: "Interview-level pressure with applied problem solving.",
    accent: "bg-rose-100 text-rose-700 border-rose-200"
  }
};

const DEFAULT_TRACKS: AssessmentTrackDefinition[] = [
  {
    track: "soft-skills",
    label: "Soft Skills Aptitude",
    description: "Blend of quantitative aptitude, verbal reasoning, and analytical puzzles to strengthen interview readiness.",
    topics: [
      {
        id: "quant",
        label: "Quantitative Aptitude",
        description: "Speed maths, ratios, percentages, and core numeracy drills.",
        difficulties: ["beginner", "intermediate", "advanced"]
      },
      {
        id: "verbal",
        label: "Verbal Ability",
        description: "Vocabulary, grammar, tone detection, and paraphrasing mastery.",
        difficulties: ["beginner", "intermediate", "advanced"]
      },
      {
        id: "aptitude",
        label: "Logical Aptitude",
        description: "Series, direction sense, time & work, and critical thinking mixers.",
        difficulties: ["beginner", "intermediate", "advanced"]
      }
    ]
  },
  {
    track: "technical-skills",
    label: "Technical Core Sprint",
    description: "Coding, cloud, and CS fundamentals commonly probed by top product companies.",
    topics: [
      {
        id: "coding",
        label: "Coding Fundamentals",
        description: "Data structures, algorithmic complexity, and system design patterns.",
        difficulties: ["beginner", "intermediate", "advanced"]
      },
      {
        id: "cloud",
        label: "Cloud & DevOps",
        description: "Cloud models, AWS basics, deployment patterns, and reliability.",
        difficulties: ["beginner", "intermediate", "advanced"]
      },
      {
        id: "dbms",
        label: "Databases",
        description: "Relational design, SQL, indexing, and transactions.",
        difficulties: ["beginner", "intermediate", "advanced"]
      },
      {
        id: "operating-systems",
        label: "Operating Systems",
        description: "Scheduling, memory management, and architecture concepts.",
        difficulties: ["beginner", "intermediate", "advanced"]
      },
      {
        id: "networks",
        label: "Computer Networks",
        description: "Protocol stacks, routing, performance, and scaling on the wire.",
        difficulties: ["beginner", "intermediate", "advanced"]
      },
      {
        id: "system-design",
        label: "System Design",
        description: "Scalability patterns, consistency, and real-world architecture trade-offs.",
        difficulties: ["beginner", "intermediate", "advanced"]
      }
    ]
  }
];

type HistoryEntry = {
  sessionId: string;
  track: AssessmentTrack;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  score: number;
  accuracy: number;
  createdAt: string;
};

const HISTORY_LIMIT = 6;

const formatAnswer = (answer: string | string[], type: AssessmentQuestion["answerType"]): string => {
  if (type === "multiple-choice") {
    if (Array.isArray(answer) && answer.length) {
      return answer.join(", ");
    }
    return "—";
  }

  return typeof answer === "string" && answer.trim() ? answer : "—";
};

const percentage = (value: number) => `${Math.round(value * 100)}%`;

export default function TestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<AssessmentTrackDefinition[]>(DEFAULT_TRACKS);
  const [selectedTrack, setSelectedTrack] = useState<AssessmentTrack>("soft-skills");
  const [selectedTopic, setSelectedTopic] = useState<AssessmentTopic>("quant");
  const [selectedDifficulty, setSelectedDifficulty] = useState<AssessmentDifficulty>("beginner");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [evaluation, setEvaluation] = useState<AssessmentEvaluation | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"idle" | "active" | "completed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getAuthToken();
      const user = getAuthUser();

      if (!token || !user) {
        router.push("/login");
        return;
      }

      if (!user.isProfileComplete) {
        router.push("/complete-profile");
        return;
      }

      try {
        const trackResponse = await testsApi.getTracks();
        if (trackResponse.tracks?.length) {
          setTracks(trackResponse.tracks);
          const firstTrack = trackResponse.tracks[0];
          setSelectedTrack(firstTrack.track);
          const firstTopic = firstTrack.topics[0];
          setSelectedTopic(firstTopic.id);
          setSelectedDifficulty(firstTopic.difficulties[0] ?? "beginner");
        }
      } catch (err) {
        console.warn("Falling back to default test tracks:", err);
        setError("Using fallback test tracks until we reconnect to the server.");
        setTracks(DEFAULT_TRACKS);
        setSelectedTrack(DEFAULT_TRACKS[0].track);
        setSelectedTopic(DEFAULT_TRACKS[0].topics[0].id);
        setSelectedDifficulty(DEFAULT_TRACKS[0].topics[0].difficulties[0]);
      } finally {
        setLoading(false);
      }

      try {
        const historyResponse = await testsApi.getHistory(HISTORY_LIMIT);
        setHistory(historyResponse.history);
      } catch (err) {
        console.warn("Unable to fetch assessment history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    bootstrap();
  }, [router]);

  const currentTrack = useMemo(() => tracks.find((track) => track.track === selectedTrack) ?? tracks[0], [tracks, selectedTrack]);
  const currentTopic = useMemo(
    () => currentTrack?.topics.find((topic) => topic.id === selectedTopic) ?? currentTrack?.topics[0],
    [currentTrack, selectedTopic]
  );

  const orderedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => a.order - b.order);
  }, [questions]);

  const activeQuestion = orderedQuestions[currentQuestionIndex] ?? orderedQuestions[0];

  const resetSession = useCallback(() => {
    setSessionId(null);
    setQuestions([]);
    setAnswers({});
    setEvaluation(null);
    setSessionStatus("idle");
    setCurrentQuestionIndex(0);
    setIsSubmitting(false);
  }, []);

  const handleTrackChange = useCallback(
    (track: AssessmentTrack) => {
      setSelectedTrack(track);
      const nextTrack = tracks.find((candidate) => candidate.track === track);
      const nextTopic = nextTrack?.topics[0];
      setSelectedTopic(nextTopic?.id ?? selectedTopic);
      setSelectedDifficulty(nextTopic?.difficulties[0] ?? "beginner");
      resetSession();
    },
    [resetSession, selectedTopic, tracks]
  );

  const handleTopicChange = useCallback(
    (topic: AssessmentTopic) => {
      setSelectedTopic(topic);
      const nextTopic = currentTrack?.topics.find((candidate) => candidate.id === topic);
      setSelectedDifficulty(nextTopic?.difficulties[0] ?? selectedDifficulty);
      resetSession();
    },
    [currentTrack, resetSession, selectedDifficulty]
  );

  const handleDifficultyChange = useCallback(
    (difficulty: AssessmentDifficulty) => {
      setSelectedDifficulty(difficulty);
      resetSession();
    },
    [resetSession]
  );

  const handleGenerateSession = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await testsApi.generateSession({
        track: selectedTrack,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        count: 10
      });

      const sortedQuestions = [...response.questions].sort((a, b) => a.order - b.order);

      setSessionId(response.sessionId);
      setQuestions(sortedQuestions);
      setAnswers({});
      setSessionStatus("active");
      setCurrentQuestionIndex(0);
    } catch (err) {
      console.error("Failed to generate assessment session:", err);
      setError(err instanceof Error ? err.message : "Unable to start assessment session.");
      resetSession();
    } finally {
      setIsGenerating(false);
    }
  }, [resetSession, selectedDifficulty, selectedTopic, selectedTrack]);

  const handleQuestionSelect = useCallback(
    (index: number) => {
      if (index >= 0 && index < orderedQuestions.length) {
        setCurrentQuestionIndex(index);
      }
    },
    [orderedQuestions.length]
  );

  const handlePrevQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.min(orderedQuestions.length - 1, prev + 1));
  }, [orderedQuestions.length]);

  const handleSingleChoice = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const handleMultipleChoice = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => {
      const currentValue = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const isSelected = currentValue.includes(value);
      const nextValue = isSelected ? currentValue.filter((item) => item !== value) : [...currentValue, value];
      return {
        ...prev,
        [questionId]: nextValue
      };
    });
  }, []);

  const handleShortText = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const isQuestionAnswered = useCallback(
    (question: AssessmentQuestion) => {
      const answer = answers[question.id];

      if (question.answerType === "multiple-choice") {
        return Array.isArray(answer) && answer.length > 0;
      }

      return typeof answer === "string" && answer.trim().length > 0;
    },
    [answers]
  );

  const answeredCount = useMemo(
    () => orderedQuestions.filter((question) => isQuestionAnswered(question)).length,
    [isQuestionAnswered, orderedQuestions]
  );

  const progress = orderedQuestions.length ? Math.round((answeredCount / orderedQuestions.length) * 100) : 0;

  const allAnswered = orderedQuestions.length > 0 && answeredCount === orderedQuestions.length;

  const handleSubmitSession = useCallback(async () => {
    if (!sessionId || !orderedQuestions.length) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = orderedQuestions.map((question) => {
        const answer = answers[question.id];

        if (question.answerType === "multiple-choice") {
          return {
            questionId: question.id,
            answer: Array.isArray(answer) ? answer : []
          };
        }

        return {
          questionId: question.id,
          answer: typeof answer === "string" ? answer : ""
        };
      });

      const evaluationResponse = await testsApi.submitSession(sessionId, payload);

      setEvaluation(evaluationResponse);
      setSessionStatus("completed");
      setHistory((prev) => {
        const nextEntry: HistoryEntry = {
          sessionId: evaluationResponse.sessionId,
          track: evaluationResponse.track,
          topic: evaluationResponse.topic,
          difficulty: evaluationResponse.difficulty,
          score: evaluationResponse.score,
          accuracy: evaluationResponse.accuracy,
          createdAt: evaluationResponse.createdAt
        };

        const merged = [nextEntry, ...prev.filter((entry) => entry.sessionId !== nextEntry.sessionId)];
        return merged.slice(0, HISTORY_LIMIT);
      });
    } catch (err) {
      console.error("Failed to submit assessment session:", err);
      setError(err instanceof Error ? err.message : "Unable to submit assessment session.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, orderedQuestions, sessionId]);

  const handleStartOver = useCallback(() => {
    resetSession();
  }, [resetSession]);

  const renderAnswerInput = useCallback(
    (question: AssessmentQuestion) => {
      const answer = answers[question.id];

      if (question.answerType === "single-choice") {
        return (
          <RadioGroup
            value={typeof answer === "string" ? answer : ""}
            onValueChange={(value) => handleSingleChoice(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div
                key={option}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-border bg-background p-4 transition hover:border-primary",
                  typeof answer === "string" && answer === option ? "border-primary shadow-sm" : ""
                )}
              >
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`} className="text-sm leading-relaxed">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      }

      if (question.answerType === "multiple-choice") {
        const checkedValues = Array.isArray(answer) ? answer : [];
        return (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const optionId = `${question.id}-${option}`;
              const checked = checkedValues.includes(option);
              return (
                <div
                  key={option}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border border-border bg-background p-4 transition hover:border-primary",
                    checked ? "border-primary shadow-sm" : ""
                  )}
                >
                  <Checkbox
                    id={optionId}
                    checked={checked}
                    onCheckedChange={() => handleMultipleChoice(question.id, option)}
                  />
                  <Label htmlFor={optionId} className="text-sm leading-relaxed">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );
      }

      return (
        <Textarea
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => handleShortText(question.id, event.target.value)}
          placeholder="Write your answer here..."
          rows={6}
          className="resize-none"
        />
      );
    },
    [answers, handleMultipleChoice, handleShortText, handleSingleChoice]
  );

  const handleRefreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const historyResponse = await testsApi.getHistory(HISTORY_LIMIT);
      setHistory(historyResponse.history);
    } catch (err) {
      console.warn("Unable to refresh history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const currentTrackMeta = TRACK_META[selectedTrack];

  const topicIcon = currentTopic ? TOPIC_ICONS[currentTopic.id] : null;
  const TopicIcon = topicIcon ?? Brain;

  useEffect(() => {
    if (!historyLoading) {
      return;
    }
    handleRefreshHistory();
  }, [handleRefreshHistory, historyLoading]);

  const completedResults = evaluation?.results ?? [];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-6 sm:p-8">
        <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <TopicIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge>{currentTrackMeta.label}</Badge>
                <Badge variant="secondary" className={DIFFICULTY_META[selectedDifficulty].accent}>
                  {DIFFICULTY_META[selectedDifficulty].label}
                </Badge>
              </div>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Assessment Lab</h1>
              <p className="text-muted-foreground">{currentTrackMeta.blurb}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRefreshHistory} disabled={historyLoading}>
              {historyLoading ? <Spinner className="mr-2 h-4 w-4" /> : <History className="mr-2 h-4 w-4" />}
              Refresh History
            </Button>
            <Button onClick={handleGenerateSession} disabled={isGenerating || loading}>
              {isGenerating ? <Spinner className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {sessionStatus === "active" ? "Regenerate" : "Start new assessment"}
            </Button>
          </div>
        </header>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <Card className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="h-6 w-6 text-primary" />
              <p className="text-muted-foreground">Preparing your personalized assessment workspace...</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
            <aside className="space-y-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg">Assessment configuration</CardTitle>
                  <CardDescription>Select the focus area for your next assessment run.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-0">
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Track</Label>
                    <div className="mt-3 space-y-3">
                      {tracks.map((track) => {
                        const Icon = TRACK_META[track.track]?.icon ?? Brain;
                        const active = track.track === selectedTrack;
                        return (
                          <button
                            key={track.track}
                            type="button"
                            onClick={() => handleTrackChange(track.track)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-xl border border-border bg-background p-4 text-left transition",
                              active ? "border-primary shadow-sm" : "hover:border-primary/60"
                            )}
                          >
                            <span className="rounded-lg bg-primary/10 p-2 text-primary">
                              <Icon className="h-5 w-5" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold">{track.label}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{track.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {currentTrack ? (
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">Topic</Label>
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        {currentTrack.topics.map((topic) => {
                          const Icon = TOPIC_ICONS[topic.id] ?? Brain;
                          const active = topic.id === selectedTopic;
                          return (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => handleTopicChange(topic.id)}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-xl border border-border bg-background p-4 text-left transition",
                                active ? "border-primary shadow-sm" : "hover:border-primary/60"
                              )}
                            >
                              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                                <Icon className="h-5 w-5" />
                              </span>
                              <span>
                                <span className="block text-sm font-semibold">{topic.label}</span>
                                <span className="mt-1 block text-xs text-muted-foreground">{topic.description}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <Separator />

                  {currentTopic ? (
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">Difficulty</Label>
                      <div className="mt-3 flex flex-col gap-2">
                        {currentTopic.difficulties.map((difficulty) => {
                          const meta = DIFFICULTY_META[difficulty];
                          const active = difficulty === selectedDifficulty;
                          return (
                            <button
                              key={difficulty}
                              type="button"
                              onClick={() => handleDifficultyChange(difficulty)}
                              className={cn(
                                "rounded-xl border border-border bg-background p-4 text-left transition",
                                active ? "border-primary shadow-sm" : "hover:border-primary/60"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{meta.label}</span>
                                <Badge variant={active ? "default" : "outline"}>{meta.blurb}</Badge>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-3 px-0 pb-0">
                  <Button onClick={handleGenerateSession} disabled={isGenerating} className="w-full">
                    {isGenerating ? <Spinner className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    {sessionStatus === "active" ? "Regenerate assessment" : "Create assessment"}
                  </Button>
                  {sessionStatus === "completed" ? (
                    <Button variant="outline" onClick={handleStartOver} className="w-full">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reset workspace
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>

              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg">Recent sessions</CardTitle>
                  <CardDescription>Your last {HISTORY_LIMIT} scored assessments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  {historyLoading ? (
                    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      <Spinner className="h-4 w-4" />
                      Loading assessment history...
                    </div>
                  ) : history.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No historical assessments yet. Start a session to unlock insights.
                    </div>
                  ) : (
                    history.map((entry) => {
                      const Icon = TOPIC_ICONS[entry.topic] ?? Target;
                      return (
                        <div key={entry.sessionId} className="flex items-start justify-between rounded-lg border border-border p-4">
                          <div className="flex items-start gap-3">
                            <span className="rounded-full bg-primary/10 p-2 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold capitalize">{entry.topic.replace("-", " ")}</span>
                                <Badge variant="outline">{DIFFICULTY_META[entry.difficulty].label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.createdAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{Math.round(entry.score)} pts</div>
                            <div className="text-xs text-muted-foreground">{percentage(entry.accuracy)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </aside>

            <section className="space-y-6">
              {sessionStatus === "idle" && !evaluation ? (
                <Card className="p-8">
                  <div className="mx-auto max-w-2xl text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Target className="h-7 w-7" />
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold">Build your adaptive assessment</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Configure track, topic, and difficulty to generate an interview-grade assessment. Navigate questions,
                      capture answers, and submit to receive instant scoring and AI insights.
                    </p>
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <Button onClick={handleGenerateSession} size="lg">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate session
                      </Button>
                      <Button variant="outline" size="lg" onClick={handleRefreshHistory}>
                        <History className="mr-2 h-5 w-5" />
                        View past performance
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : null}

              {sessionStatus === "active" && activeQuestion ? (
                <Card className="p-6">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <Badge variant="secondary" className="capitalize">
                          {selectedTopic.replace("-", " ")}
                        </Badge>
                        <h2 className="mt-2 text-2xl font-semibold">
                          Question {currentQuestionIndex + 1} of {orderedQuestions.length}
                        </h2>
                        <p className="text-sm text-muted-foreground">Stay focussed, you can move freely between questions before submitting.</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Estimated {activeQuestion.estimatedTime} min
                      </div>
                    </div>

                    <div>
                      <Progress value={progress} className="h-2" />
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{answeredCount} answered</span>
                        <span>{orderedQuestions.length - answeredCount} remaining</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {orderedQuestions.map((question, index) => {
                        const isCurrent = index === currentQuestionIndex;
                        const answered = isQuestionAnswered(question);
                        return (
                          <Button
                            key={question.id}
                            variant={isCurrent ? "default" : answered ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => handleQuestionSelect(index)}
                            className={cn("w-10 flex-1 basis-12 text-xs", isCurrent ? "shadow-sm" : "")}
                          >
                            {index + 1}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {activeQuestion.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs uppercase tracking-wide">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-lg font-medium leading-relaxed">{activeQuestion.prompt}</p>
                      <div>{renderAnswerInput(activeQuestion)}</div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Previous
                        </Button>
                        <Button variant="outline" onClick={handleNextQuestion} disabled={currentQuestionIndex === orderedQuestions.length - 1}>
                          Next
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={handleSubmitSession} disabled={!allAnswered || isSubmitting} variant={allAnswered ? "default" : "secondary"}>
                        {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Submit assessment
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : null}

              {sessionStatus === "completed" && evaluation ? (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="outline">{evaluation.track.replace("-", " ")}</Badge>
                          <Badge variant="secondary">{evaluation.topic.replace("-", " ")}</Badge>
                          <Badge variant="outline">{DIFFICULTY_META[evaluation.difficulty].label}</Badge>
                        </div>
                        <h2 className="mt-4 text-2xl font-semibold">Assessment results</h2>
                        <p className="text-sm text-muted-foreground">
                          Great job! Review performance insights below and queue up another session to keep momentum.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-border bg-background p-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            Score
                          </div>
                          <div className="mt-2 text-3xl font-bold">{Math.round(evaluation.score)}</div>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Target className="h-4 w-4 text-primary" />
                            Accuracy
                          </div>
                          <div className="mt-2 text-3xl font-bold">{percentage(evaluation.accuracy)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button onClick={handleStartOver} variant="outline">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Launch another session
                      </Button>
                      <Button variant="ghost" onClick={() => setSessionStatus("active")}>
                        Review questions
                      </Button>
                    </div>
                  </Card>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="p-6">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg">Strengths</CardTitle>
                        <CardDescription className="leading-relaxed">
                          Areas where you demonstrated mastery. Keep reinforcing these patterns with spaced repetition.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 px-0">
                        {evaluation.summary.strengths.length ? (
                          evaluation.summary.strengths.map((item, index) => (
                            <div key={index} className="flex items-start gap-3 rounded-lg border border-border p-3">
                              <BadgeCheck className="h-4 w-4 text-primary" />
                              <p className="text-sm leading-snug">{item}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No strengths surfaced this time. Try another assessment to build the profile.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="p-6">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg">Opportunities</CardTitle>
                        <CardDescription>Target these gaps in your next practice sprint.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 px-0">
                        {evaluation.summary.opportunities.length ? (
                          evaluation.summary.opportunities.map((item, index) => (
                            <div key={index} className="flex items-start gap-3 rounded-lg border border-border p-3">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <p className="text-sm leading-snug">{item}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No critical opportunities identified. Review other topics for fresh challenges.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide">#</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide">Prompt</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide">Your answer</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide">Correct answer</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completedResults.map((result) => (
                            <tr key={result.questionId} className="border-b border-border">
                              <td className="px-6 py-4 text-sm text-muted-foreground">{result.order + 1}</td>
                              <td className="px-6 py-4 text-sm">{result.prompt}</td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                {formatAnswer(result.userAnswer, result.answerType)}
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                {formatAnswer(result.correctAnswer, result.answerType)}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={result.isCorrect ? "default" : "destructive"}>
                                  {result.isCorrect ? "Correct" : "Incorrect"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}