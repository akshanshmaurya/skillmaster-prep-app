"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Calculator, MessageCircle, Compass, Brain, Gamepad2, Sparkles, Target, ArrowRight, ChevronLeft, ChevronRight, Clock, ListChecks, CheckCircle2, XCircle, Trophy } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { practiceApi, type PracticeQuestion, type PracticeEvaluation, type PracticeSummary, type PracticeTopic, type PracticeDifficulty } from "@/lib/api/practice";
import { getAuthToken, getAuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

type TopicMeta = {
  label: string;
  description: string;
  gradient: string;
  icon: ComponentType<{ className?: string }>;
};

const TOPIC_META: Record<PracticeTopic, TopicMeta> = {
  quant: {
    label: "Quantitative Aptitude",
    description: "Percentages, ratios, rate-time puzzles, and number agility drills.",
    gradient: "from-sky-500 to-indigo-500",
    icon: Calculator
  },
  verbal: {
    label: "Verbal Ability",
    description: "Grammar, vocabulary, tone detection, and communication clarity.",
    gradient: "from-rose-500 to-orange-500",
    icon: MessageCircle
  },
  aptitude: {
    label: "General Aptitude",
    description: "Series, coding-decoding, probability, and data interpretation." ,
    gradient: "from-emerald-500 to-teal-500",
    icon: Compass
  },
  reasoning: {
    label: "Logical Reasoning",
    description: "Syllogisms, direction sense, seating, and critical thinking drills.",
    gradient: "from-purple-500 to-fuchsia-500",
    icon: Brain
  },
  games: {
    label: "Brain Games",
    description: "Puzzles, strategy games, anagrams, and mental agility boosters.",
    gradient: "from-amber-500 to-red-500",
    icon: Gamepad2
  }
};

const DIFFICULTY_META: Record<PracticeDifficulty, { label: string; blurb: string; accent: string }> = {
  beginner: {
    label: "Beginner",
    blurb: "Build fluency with guided fundamentals.",
    accent: "bg-emerald-100 text-emerald-700 border-emerald-200"
  },
  intermediate: {
    label: "Intermediate",
    blurb: "Challenge your pattern recognition and timing.",
    accent: "bg-amber-100 text-amber-700 border-amber-200"
  },
  advanced: {
    label: "Advanced",
    blurb: "Simulate pressure with multi-step interview puzzles.",
    accent: "bg-rose-100 text-rose-700 border-rose-200"
  }
};

const DEFAULT_TOPICS = (Object.keys(TOPIC_META) as PracticeTopic[]).map((id) => ({
  id,
  name: TOPIC_META[id].label,
  difficulties: ["beginner", "intermediate", "advanced"] as PracticeDifficulty[]
}));

const formatAnswer = (answer: string | string[], type: PracticeQuestion["answerType"]): string => {
  if (type === "multiple-choice") {
    if (Array.isArray(answer) && answer.length) {
      return answer.join(", ");
    }
    return "—";
  }

  return typeof answer === "string" && answer.trim() ? answer : "—";
};

const percentage = (value: number) => `${Math.round(value * 100)}%`;

export default function PracticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState(DEFAULT_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState<PracticeTopic>("quant");
  const [selectedDifficulty, setSelectedDifficulty] = useState<PracticeDifficulty>("beginner");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [evaluation, setEvaluation] = useState<PracticeEvaluation | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'active' | 'completed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
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

      try {
        const data = await practiceApi.getTopics();
        if (data.topics?.length) {
          const [firstTopic] = data.topics;
          setTopics(data.topics);
          setSelectedTopic(firstTopic.id);
          if (firstTopic.difficulties?.length) {
            setSelectedDifficulty(firstTopic.difficulties[0]);
          }
        }
      } catch (err) {
        console.warn('Falling back to default practice topics:', err);
        setError('Using fallback topics until we reconnect to the server.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [router]);

  const activeQuestion = questions[currentQuestionIndex];
  const answerProgress = useMemo(() => {
    if (!questions.length) return 0;
    const answered = questions.filter((question) => {
      const answer = answers[question.id];
      if (question.answerType === 'multiple-choice') {
        return Array.isArray(answer) && answer.length;
      }
      if (question.answerType === 'short-text') {
        return typeof answer === 'string' && answer.trim().length > 0;
      }
      return typeof answer === 'string' && answer.length > 0;
    }).length;
    return Math.round((answered / questions.length) * 100);
  }, [answers, questions]);

  const handleStartSession = async () => {
    setIsGenerating(true);
    setError(null);
    setEvaluation(null);
    try {
      const { sessionId: newSessionId, questions: generatedQuestions, topic, difficulty, status } = await practiceApi.generateSession({
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        count: 10
      });

      setSessionId(newSessionId);
      setQuestions(generatedQuestions.sort((a, b) => a.order - b.order));
      setAnswers({});
      setSessionStatus(status === 'completed' ? 'completed' : 'active');
      setEvaluation(null);
      setCurrentQuestionIndex(0);
      setSelectedTopic(topic);
      setSelectedDifficulty(difficulty);
    } catch (err: any) {
      console.error('Failed to create practice session', err);
      setError(err?.message || 'Unable to start a practice session right now.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitSession = async () => {
    if (!sessionId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = questions.map((question) => {
        const answer = answers[question.id];
        if (question.answerType === 'multiple-choice') {
          return {
            questionId: question.id,
            answer: Array.isArray(answer) ? answer : []
          };
        }
        return {
          questionId: question.id,
          answer: typeof answer === 'string' ? answer : ''
        };
      });

      const result = await practiceApi.submitSession(sessionId, payload);
      setEvaluation(result);
      setSessionStatus('completed');
    } catch (err: any) {
      console.error('Failed to submit practice session', err);
      setError(err?.message || 'Unable to submit answers right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRadioAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxAnswer = (questionId: string, option: string, checked: boolean | "indeterminate") => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? [...(prev[questionId] as string[])] : [];
      const exists = current.includes(option);
      if (checked && !exists) {
        current.push(option);
      }
      if (!checked && exists) {
        return { ...prev, [questionId]: current.filter((item) => item !== option) };
      }
      return { ...prev, [questionId]: current };
    });
  };

  const handleTextAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const resetSession = () => {
    setSessionId(null);
    setQuestions([]);
    setAnswers({});
    setEvaluation(null);
    setSessionStatus('idle');
    setCurrentQuestionIndex(0);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <Spinner className="size-8 text-primary" />
            <p className="text-sm text-muted-foreground">Loading your personalised practice hub…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const topicMeta = TOPIC_META[selectedTopic];
  const difficultyMeta = DIFFICULTY_META[selectedDifficulty];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              Interview practice studio
            </div>
            <h1 className="text-balance text-3xl font-semibold sm:text-4xl">
              Practice smarter with topic-focused interview drills
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Choose a track, answer curated questions, and get actionable AI feedback in minutes. Replay sessions to see measurable progress before your next interview.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="max-w-2xl">
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-2xl">Configure your next practice sprint</CardTitle>
                <CardDescription>
                  Pick a topic and difficulty to generate a fresh set of interview-style questions instantly.
                </CardDescription>
              </div>
              <div className="flex flex-col items-start gap-1 text-left text-sm text-muted-foreground lg:items-end lg:text-right">
                <span className="font-medium text-card-foreground">Selected</span>
                <div>{topicMeta.label}</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{difficultyMeta.label}</div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-8">
              <div className="grid gap-4 lg:grid-cols-5">
                {topics.map((topic) => {
                  const meta = TOPIC_META[topic.id];
                  const active = topic.id === selectedTopic;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopic(topic.id)}
                      className={cn(
                        'group relative flex h-full flex-col gap-3 rounded-2xl border p-4 text-left transition duration-200 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                        active && 'border-primary shadow-lg'
                      )}
                    >
                      <div className={cn(
                        'flex size-10 items-center justify-center rounded-xl text-white transition-all group-hover:scale-105',
                        `bg-gradient-to-br ${meta.gradient}`
                      )}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-card-foreground">{meta.label}</span>
                        <span className="text-xs leading-5 text-muted-foreground">{meta.description}</span>
                      </div>
                      {active && (
                        <Badge className="absolute right-4 top-4 bg-primary/90">Selected</Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-card-foreground">Difficulty</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(topics.find((topic) => topic.id === selectedTopic)?.difficulties ?? ['beginner', 'intermediate', 'advanced']).map((difficulty) => {
                    const meta = DIFFICULTY_META[difficulty];
                    const active = difficulty === selectedDifficulty;
                    return (
                      <button
                        key={difficulty}
                        type="button"
                        onClick={() => setSelectedDifficulty(difficulty)}
                        className={cn(
                          'flex flex-col gap-1 rounded-2xl border p-4 text-left transition hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          active && 'border-primary bg-primary/5 shadow-lg'
                        )}
                      >
                        <span className="text-sm font-semibold text-card-foreground">{meta.label}</span>
                        <span className="text-xs text-muted-foreground">{meta.blurb}</span>
                        <Badge className={cn('mt-3 w-fit border text-xs font-medium', meta.accent)}>
                          {meta.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ListChecks className="size-4" />
                Questions adapt to your performance. Expect targeted explanations after you submit.
              </div>
              <div className="flex items-center gap-2">
                {sessionStatus !== 'idle' && (
                  <Button variant="ghost" onClick={resetSession} className="text-muted-foreground">
                    Reset
                  </Button>
                )}
                <Button onClick={handleStartSession} disabled={isGenerating} className="gap-2">
                  {isGenerating ? (
                    <>
                      <Spinner className="size-4" />
                      Generating…
                    </>
                  ) : (
                    <>
                      Start session
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {sessionStatus !== 'idle' && questions.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="col-span-1">
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="size-4 text-primary" />
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                <CardTitle className="text-lg sm:text-xl">{activeQuestion?.prompt}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Badge variant="outline">{TOPIC_META[selectedTopic].label}</Badge>
                  <Badge variant="outline">{DIFFICULTY_META[selectedDifficulty].label}</Badge>
                  <Badge variant="outline">{activeQuestion?.estimatedTime ?? 3} min</Badge>
                </CardDescription>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Answer progress</span>
                    <span>{answerProgress}%</span>
                  </div>
                  <Progress value={answerProgress} className="h-2" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {activeQuestion?.answerType === 'single-choice' && (
                  <RadioGroup
                    value={typeof answers[activeQuestion.id] === 'string' ? (answers[activeQuestion.id] as string) : ''}
                    onValueChange={(value) => handleRadioAnswer(activeQuestion.id, value)}
                    className="flex flex-col gap-3"
                  >
                    {activeQuestion.options?.map((option) => (
                      <Label
                        key={option}
                        htmlFor={`${activeQuestion.id}-${option}`}
                        className={cn(
                          'group flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm transition hover:border-primary/60 hover:shadow-md',
                          answers[activeQuestion.id] === option && 'border-primary bg-primary/5 shadow-md'
                        )}
                      >
                        <RadioGroupItem
                          id={`${activeQuestion.id}-${option}`}
                          value={option}
                          className="border-primary"
                        />
                        <span className="text-sm text-card-foreground">{option}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                {activeQuestion?.answerType === 'multiple-choice' && (
                  <div className="flex flex-col gap-3">
                    {activeQuestion.options?.map((option) => {
                      const selected = Array.isArray(answers[activeQuestion.id]) && (answers[activeQuestion.id] as string[]).includes(option);
                      return (
                        <Label
                          key={option}
                          htmlFor={`${activeQuestion.id}-${option}`}
                          className={cn(
                            'group flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm transition hover:border-primary/60 hover:shadow-md',
                            selected && 'border-primary bg-primary/5 shadow-md'
                          )}
                        >
                          <Checkbox
                            id={`${activeQuestion.id}-${option}`}
                            checked={selected}
                            onCheckedChange={(checked) => handleCheckboxAnswer(activeQuestion.id, option, checked)}
                          />
                          <span className="text-sm text-card-foreground">{option}</span>
                        </Label>
                      );
                    })}
                  </div>
                )}

                {activeQuestion?.answerType === 'short-text' && (
                  <Textarea
                    value={typeof answers[activeQuestion.id] === 'string' ? (answers[activeQuestion.id] as string) : ''}
                    onChange={(event) => handleTextAnswer(activeQuestion.id, event.target.value)}
                    placeholder="Outline your answer here…"
                    className="min-h-[120px]"
                  />
                )}

                {activeQuestion?.tags?.length ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {activeQuestion.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-4" />
                  Aim to reason aloud and commit to an answer before checking solutions.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button onClick={handleSubmitSession} disabled={isSubmitting || sessionStatus === 'completed'} className="gap-2">
                    {isSubmitting ? (
                      <>
                        <Spinner className="size-4" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit answers
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="size-4 text-primary" />
                    Session snapshot
                  </CardTitle>
                  <CardDescription>
                    Stay aware of your momentum as you progress.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">Topic</span>
                    <span className="font-medium text-card-foreground">{topicMeta.label}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span className="font-medium text-card-foreground">{difficultyMeta.label}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-medium text-card-foreground">{questions.length}</span>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2 text-sm">
                    <span className="text-muted-foreground">Answered</span>
                    <Progress value={answerProgress} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">{answerProgress}% of questions have a draft answer.</span>
                  </div>
                </CardContent>
              </Card>

              {evaluation && (
                <Card className="border-primary/40 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="size-5 text-primary" />
                      Session complete
                    </CardTitle>
                    <CardDescription>Your personalised feedback is ready.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-semibold text-card-foreground">{evaluation.score}</span>
                      <span className="text-sm uppercase tracking-wide text-muted-foreground">Score</span>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <span className="text-muted-foreground">Accuracy</span>
                      <Progress value={evaluation.accuracy * 100} className="h-1.5" />
                      <span className="text-xs text-muted-foreground">{percentage(evaluation.accuracy)} of responses matched the expected answer.</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{topicMeta.label}</Badge>
                    <Badge variant="outline">{difficultyMeta.label}</Badge>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        )}

        {evaluation && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">AI feedback centre</CardTitle>
                <CardDescription>
                  Key takeaways from this session. Use them to tailor your next practice sprint.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                {renderSummaryColumn('Strengths', evaluation.summary, 'strengths', 'text-emerald-600')}
                {renderSummaryColumn('Opportunities', evaluation.summary, 'weaknesses', 'text-rose-600')}
                {renderSummaryColumn('Improvements', evaluation.summary, 'improvements', 'text-primary')}
                {renderSummaryColumn('Next actions', evaluation.summary, 'suggestions', 'text-slate-600')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Question review</CardTitle>
                <CardDescription>
                  Compare your responses against model solutions and revisit explanations where needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {evaluation.results
                  .sort((a, b) => a.order - b.order)
                  .map((result) => {
                    const isCorrect = result.isCorrect;
                    return (
                      <div
                        key={result.questionId}
                        className={cn(
                          'flex flex-col gap-4 rounded-2xl border p-4 transition hover:shadow-md',
                          isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                            {isCorrect ? (
                              <CheckCircle2 className="size-4 text-emerald-600" />
                            ) : (
                              <XCircle className="size-4 text-rose-600" />
                            )}
                            Question {result.order + 1}
                          </div>
                          <Badge variant="outline">
                            {isCorrect ? 'Correct' : 'Review'}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium text-card-foreground">{result.prompt}</div>
                        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs uppercase tracking-wide">Your answer</span>
                            <span className="font-medium text-card-foreground">{formatAnswer(result.userAnswer, result.answerType)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs uppercase tracking-wide">Expected answer</span>
                            <span className="font-medium text-card-foreground">{formatAnswer(result.correctAnswer, result.answerType)}</span>
                          </div>
                        </div>
                        <div className="text-sm leading-relaxed text-muted-foreground">
                          {result.explanation}
                        </div>
                        {result.tags?.length ? (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {result.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function renderSummaryColumn(
  title: string,
  summary: PracticeSummary,
  key: keyof PracticeSummary,
  accentClass: string
) {
  const list = summary[key];

  if (!list?.length) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border bg-muted/30 p-4">
        <span className="text-sm font-semibold text-card-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">No notes available yet.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-4">
      <span className="text-sm font-semibold text-card-foreground">{title}</span>
      <ul className="flex list-disc flex-col gap-2 pl-4 text-sm">
        {list.map((item, index) => (
          <li key={index} className={cn('leading-relaxed', accentClass)}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
