"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Clock,
  Brain,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Play,
  Pause,
  Save,
  BarChart3
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { interviewProfileApi, interviewSessionApi, questionsApi, messagesApi, analyticsApi, codeExecutionApi } from "@/lib/api/interview";
import CodeEditor from "@/components/CodeEditor";
import React, { ReactNode, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id?: string;
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
  questionId?: string;
  metadata?: any;
}

// Markdown renderer using react-markdown with GFM
function renderMarkdown(text: string): React.ReactElement {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
  );
}

interface Question {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  category: string;
  tags: string[];
  companies: string[];
  roles: string[];
  testCases?: any[];
  expectedAnswer?: string;
  hints?: string[];
  timeLimit?: number;
}

interface QuestionSnapshot {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  category?: string;
  tags?: string[];
  timeLimit?: number;
  samples?: any[];
  testCases?: any[];
}

interface InterviewSession {
  id: string;
  userId: string;
  status: string;
  currentPhase: string;
  questionIds: string[];
  questionSnapshots?: QuestionSnapshot[];
  currentQuestionIndex: number;
  startTime?: string;
  endTime?: string;
  totalDuration?: number;
  score?: any;
  createdAt: string;
  updatedAt: string;
}

interface InterviewEvaluation {
  id?: string;
  questionId: string;
  question?: QuestionSnapshot | null;
  scores: {
    correctness: number;
    efficiency: number;
    clarity: number;
    communication: number;
    edgeCases: number;
  };
  totalScore: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    suggestions: string[];
  };
  timeSpent: number;
  hintsUsed: number;
  codeSubmitted?: string;
  language?: string;
  executionResult?: any;
  createdAt?: string;
}

interface InterviewResults {
  session: InterviewSession;
  score: any;
  evaluations: InterviewEvaluation[];
}

interface UserProfile {
  id: string;
  userId: string;
  role: string;
  experienceLevel: string;
  targetCompany?: string;
  preferredLanguage: string;
  interviewType: string;
}

export default function InterviewPage() {
  // UI State
  const [currentView, setCurrentView] = useState<"setup" | "profile" | "interview" | "results">("setup");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"intro" | "technical" | "behavioral" | "questions">("intro");
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Interview Configuration
  const [selectedCompany, setSelectedCompany] = useState("google");
  const [selectedRole, setSelectedRole] = useState("swe");
  const [difficulty, setDifficulty] = useState("medium");
  const [preferredLanguage, setPreferredLanguage] = useState("javascript");
  const [interviewType, setInterviewType] = useState("mixed");
  const [experienceLevel, setExperienceLevel] = useState("mid-level");
  
  // Data State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [candidateResponse, setCandidateResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codingInviteShown, setCodingInviteShown] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [isAwaitingAI, setIsAwaitingAI] = useState(false);
  const [askedQuestionIds, setAskedQuestionIds] = useState<Set<string>>(new Set());
  const [shownPromptIds, setShownPromptIds] = useState<Set<string>>(new Set());
  const [sessionResults, setSessionResults] = useState<InterviewResults | null>(null);
  
  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  
  // Code execution state
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const aggregatedFeedback = useMemo(() => {
    if (!sessionResults?.evaluations?.length) return null;
    const aggregate = {
      strengths: new Set<string>(),
      weaknesses: new Set<string>(),
      improvements: new Set<string>(),
      suggestions: new Set<string>()
    };

    sessionResults.evaluations.forEach(evaluation => {
      evaluation.feedback?.strengths?.forEach((item: string) => aggregate.strengths.add(item));
      evaluation.feedback?.weaknesses?.forEach((item: string) => aggregate.weaknesses.add(item));
      evaluation.feedback?.improvements?.forEach((item: string) => aggregate.improvements.add(item));
      evaluation.feedback?.suggestions?.forEach((item: string) => aggregate.suggestions.add(item));
    });

    return {
      strengths: Array.from(aggregate.strengths),
      weaknesses: Array.from(aggregate.weaknesses),
      improvements: Array.from(aggregate.improvements),
      suggestions: Array.from(aggregate.suggestions)
    };
  }, [sessionResults]);

  const scoreData = sessionResults?.score ?? currentSession?.score;

  const questionLookup = useMemo(() => {
    const map = new Map<string, QuestionSnapshot>();
    (sessionResults?.session?.questionSnapshots || currentSession?.questionSnapshots || []).forEach((snapshot) => {
      if (snapshot?.id) {
        map.set(snapshot.id, snapshot);
      }
    });
    return map;
  }, [sessionResults, currentSession]);

  // Load user profile and analytics on component mount
  useEffect(() => {
    loadUserProfile();
    loadAnalytics();
    loadSessionHistory();
  }, []);

  // Timer for interview
  useEffect(() => {
    if (!interviewStarted) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewStarted]);

  // Manage coding panel visibility based on current question type
  useEffect(() => {
    const isCodingQuestion = currentQuestion?.type === 'dsa' || currentQuestion?.type === 'coding';
    if (isCodingQuestion) {
      setCodingInviteShown(true);
      setShowCodePanel(false);
    } else {
      setCodingInviteShown(false);
      setShowCodePanel(false);
    }
  }, [currentQuestion]);

  // Load user profile
  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await interviewProfileApi.getProfile();
      setUserProfile(response.profile);
      
      // Set form values from profile
      if (response.profile) {
        setSelectedRole(response.profile.role);
        setExperienceLevel(response.profile.experienceLevel);
        setSelectedCompany(response.profile.targetCompany || "google");
        setPreferredLanguage(response.profile.preferredLanguage);
        setInterviewType(response.profile.interviewType);
      }
    } catch (error) {
      console.log('No existing profile found');
    } finally {
      setIsLoading(false);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const response = await analyticsApi.getAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Load session history
  const loadSessionHistory = async () => {
    try {
      const response = await interviewSessionApi.getHistory(5);
      setSessionHistory(response.sessions);
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  };

  // Load interview results for a session
  const loadSessionResults = async (sessionId: string) => {
    try {
      const response = await interviewSessionApi.getResults(sessionId);
      setSessionResults(response);
      setCurrentSession(prev => prev ? { ...prev, ...response.session } : response.session);
    } catch (error) {
      console.error('Failed to load interview results:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save user profile
  const saveProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profileData = {
        role: selectedRole,
        experienceLevel,
        targetCompany: selectedCompany,
        preferredLanguage,
        interviewType
      };

      const response = await interviewProfileApi.updateProfile(profileData);
      setUserProfile(response.profile);
      setCurrentView("profile");
    } catch (error) {
      setError('Failed to save profile. Please try again.');
      console.error('Profile save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create and start interview session
  const startInterview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // reset UI/session state to avoid carrying previous session
      setMessages([]);
      setCurrentSession(null);
      setCurrentQuestion(null);
      setQuestions([]);
      setCodingInviteShown(false);
      setShowCodePanel(false);
  setSessionResults(null);
  setAskedQuestionIds(new Set());
  setShownPromptIds(new Set());
  setTimeElapsed(0);
  setCandidateResponse("");
  setExecutionResult(null);
  setCode("");

      // First save profile if not already saved
      if (!userProfile) {
        await saveProfile();
      }

      // Create interview session
      const sessionResponse = await interviewSessionApi.createSession({
        profile: {
          role: selectedRole,
          experienceLevel,
          targetCompany: selectedCompany,
          preferredLanguage,
          interviewType
        },
        questionCount: 5
      });

      setCurrentSession(sessionResponse.session);

      // Start the session
      try {
        await interviewSessionApi.startSession(sessionResponse.session.id);
      } catch (e: any) {
        // If start times out or fails, continue with a soft-start
        console.warn('Start session fast-fallback:', e?.message || e);
      }
      
      // Load questions: prefer questions bundled in session creation response
      const typeMap: Record<string, string[] | undefined> = {
        technical: ['dsa', 'coding'],
        'system-design': ['system-design'],
        behavioral: ['behavioral'],
        mixed: undefined
      };
      const mapped = typeMap[interviewType as keyof typeof typeMap];
      const typeParam = mapped && mapped.length === 1 ? mapped[0] : undefined;

      const bundledQuestions = (sessionResponse as any).questions as any[] | undefined;
      let loadedList: Question[] = [] as any;
      if (bundledQuestions && bundledQuestions.length) {
        loadedList = bundledQuestions as any;
      } else {
        const questionsResponse = await questionsApi.getQuestions({
          role: selectedRole,
          company: selectedCompany,
          difficulty,
          type: typeParam,
          limit: 5
        });
        loadedList = questionsResponse.questions as any;
      }
      // De-duplicate by id and try to diversify types
      const unique: Record<string, Question> = {} as any;
      for (const q of loadedList) { unique[q.id] = q; }
      const deduped = Object.values(unique);
      setQuestions(deduped);
      
      // Set first question
      // Prefer a non-coding question to simulate a realistic intro; fallback to first
      const firstNonCoding = deduped.find(q => q.type !== 'dsa' && q.type !== 'coding');
      const first = firstNonCoding || (deduped && deduped.length ? deduped[0] : undefined);
      if (first) {
        const q = first;
        setCurrentQuestion(q);
        setAskedQuestionIds(new Set([q.id]));
      }

      // If first question is coding/DSA, show that question first; otherwise, show AI welcome
      const firstQ = first;
      if (firstQ && (firstQ.type === 'dsa' || firstQ.type === 'coding')) {
        // Announce coding question once with a direct prompt (debounced by id)
        setMessages(prev => {
          if (shownPromptIds.has(firstQ.id)) return prev;
          const promptMsg: Message = {
            role: "interviewer",
            content: `Please solve the following coding problem: ${firstQ.title}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            questionId: firstQ.id
          };
          setShownPromptIds(new Set([...Array.from(shownPromptIds), firstQ.id]));
          return [promptMsg];
        });
      } else {
        try {
          setIsAwaitingAI(true);
          const aiResponse = await messagesApi.getAIResponse(sessionResponse.session.id, {
            question: "Introduction",
            questionType: "behavioral",
            difficulty,
            company: selectedCompany,
            role: selectedRole,
            currentPhase: "intro"
          });
          const welcomeMessage: Message = {
            role: "interviewer",
            content: aiResponse.response.content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages([welcomeMessage]);
        } catch (error) {
          console.error('Failed to get AI welcome message:', error);
          const welcomeMessage: Message = {
            role: "interviewer",
            content: `Hello! Welcome to your ${selectedCompany} ${selectedRole} interview. Let's start with a brief introduction.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages([welcomeMessage]);
        } finally {
          setIsAwaitingAI(false);
        }
      }
      setInterviewStarted(true);
      setCurrentView("interview");
    } catch (error: any) {
      setError(error?.message || 'Failed to start interview. Please try again.');
      console.error('Start interview error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeExecution = async (codeToRun: string, language: string) => {
    setIsCodeRunning(true);
    setExecutionResult(null);
    
    try {
      const result = await codeExecutionApi.executeCode({
        code: codeToRun,
        language,
        testCases: currentQuestion?.testCases
      });
      
      setExecutionResult(result.result);
    } catch (error) {
      console.error('Code execution error:', error);
      setExecutionResult({
        success: false,
        error: 'Failed to execute code. Please try again.'
      });
    } finally {
      setIsCodeRunning(false);
    }
  };

  const sendResponse = async () => {
    if (!currentSession) {
      setError('No active session. Please start the interview again.');
      return;
    }
    if (!currentQuestion) {
      setError('No current question available.');
      return;
    }
    if (!candidateResponse.trim()) {
      setError('Please type a response before sending.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Add candidate message to UI immediately
      const candidateMsg: Message = {
        role: "candidate",
        content: candidateResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, candidateMsg]);
      setCandidateResponse("");

      // Submit answer to backend
      const answerResponse = await messagesApi.submitAnswer(currentSession.id, {
        questionId: currentQuestion.id,
        answer: candidateResponse,
        timeSpent: timeElapsed,
        hintsUsed: 0 // TODO: Track hints used
      });

      // Move to next question or complete interview
      // Find current index by id and pick next unseen
      const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
      let nextQuestion: Question | null = null;
      // scan forward
      for (let i = currentIndex + 1; i < questions.length; i++) {
        const q = questions[i];
        if (!askedQuestionIds.has(q.id)) { nextQuestion = q; break; }
      }
      // if nothing forward, scan from start
      if (!nextQuestion) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (!askedQuestionIds.has(q.id)) { nextQuestion = q; break; }
        }
      }
      
      if (nextQuestion) {
        // Move to next question
        setCurrentQuestion(nextQuestion);
        setAskedQuestionIds(prev => new Set([...Array.from(prev), nextQuestion!.id]));
        
        // Next question prompt: If coding, announce coding question; else, get AI interviewer prompt
        if (nextQuestion.type === 'dsa' || nextQuestion.type === 'coding') {
          // For coding questions, don't re-announce if already asked for same id
          const promptMsg: Message = {
            role: "interviewer",
            content: `Please solve the following coding problem: ${nextQuestion.title}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            questionId: nextQuestion.id
          };
          setTimeout(() => {
            setMessages(prev => {
              const alreadyAsked = shownPromptIds.has(nextQuestion.id) || prev.some(m => m.role === 'interviewer' && m.questionId === nextQuestion.id && m.content.includes(nextQuestion.title));
              if (alreadyAsked) return prev;
              setShownPromptIds(new Set([...Array.from(shownPromptIds), nextQuestion.id]));
              return [...prev, promptMsg];
            });
          }, 500);
        } else {
          try {
            setIsAwaitingAI(true);
            const aiResponse = await messagesApi.getAIResponse(currentSession.id, {
              question: nextQuestion.description,
              questionType: nextQuestion.type,
              difficulty: nextQuestion.difficulty,
              company: selectedCompany,
              role: selectedRole,
              candidateAnswer: candidateResponse,
              currentPhase: nextQuestion.type === 'behavioral' ? 'behavioral' : nextQuestion.type === 'system-design' ? 'system-design' : 'technical'
            });
            const aiMsg: Message = {
              role: "interviewer",
              content: aiResponse.response.content,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              questionId: nextQuestion.id
            };
            setTimeout(() => {
              setMessages(prev => [...prev, aiMsg]);
            }, 800);
          } catch (error) {
            console.error('Failed to get AI response:', error);
            const aiMsg: Message = {
              role: "interviewer",
              content: `Now let's discuss: ${nextQuestion.description}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              questionId: nextQuestion.id
            };
            setTimeout(() => {
              setMessages(prev => [...prev, aiMsg]);
            }, 800);
          } finally {
            setIsAwaitingAI(false);
          }
        }

        // Update session state locally
        setCurrentSession(prev => prev ? { ...prev, currentQuestionIndex: (prev.currentQuestionIndex || 0) + 1 } : prev);
      } else {
        // Complete interview
        const completeResponse = await interviewSessionApi.completeSession(currentSession.id);
        setCurrentSession(prev => prev ? { ...prev, ...completeResponse.session } : completeResponse.session);
        await loadSessionResults(currentSession.id);
        
        const completionMsg: Message = {
          role: "interviewer",
          content: "Thank you for your time! The interview is now complete. Let me calculate your results...",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setTimeout(() => {
          setMessages(prev => [...prev, completionMsg]);
          setCurrentView("results");
          setInterviewStarted(false);
          loadAnalytics();
          loadSessionHistory();
        }, 2000);
      }

    } catch (error: any) {
      setError(error?.message || 'Failed to submit answer. Please try again.');
      console.error('Send response error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttemptCoding = () => {
    setShowCodePanel(true);
  };

  const handleSkipCoding = async () => {
    if (!currentQuestion || !currentSession) return;
    setCandidateResponse("I don't feel confident solving this one right now. Could we move on?");
    await sendResponse();
  };

  const togglePause = () => {
    if (!currentView.startsWith('interview')) return;
    setIsPaused(prev => !prev);
    setInterviewStarted(prev => !prev);
  };

  const endInterview = async () => {
    if (!currentSession) return;
    try {
      setIsLoading(true);
      const sessionId = currentSession.id;
      const complete = await interviewSessionApi.completeSession(sessionId);
      setCurrentSession(prev => prev ? { ...prev, ...complete.session } : complete.session);
      await loadSessionResults(sessionId);
      const completionMsg: Message = {
        role: "interviewer",
        content: "Interview ended. Calculating your results...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, completionMsg]);
      setInterviewStarted(false);
      setCurrentView("results");
      // hard reset of question state to avoid accidental reuse
      setCurrentQuestion(null);
      setQuestions([]);
      setShowCodePanel(false);
      setCodingInviteShown(false);
      loadAnalytics();
      loadSessionHistory();
    } catch (e) {
      console.error('End interview error:', e);
      // Soft-complete on client if backend completion fails
      setCurrentView("results");
      setInterviewStarted(false);
      setCurrentQuestion(null);
      setQuestions([]);
      setShowCodePanel(false);
      setCodingInviteShown(false);
      if (currentSession?.id) {
        await loadSessionResults(currentSession.id);
      }
      loadAnalytics();
      loadSessionHistory();
    } finally {
      setIsLoading(false);
    }
  };

  const interviewSetup = {
    companies: [
      { value: "google", label: "Google", color: "bg-blue-500" },
      { value: "amazon", label: "Amazon", color: "bg-orange-500" },
      { value: "microsoft", label: "Microsoft", color: "bg-blue-600" },
      { value: "meta", label: "Meta", color: "bg-blue-700" },
      { value: "apple", label: "Apple", color: "bg-gray-800" }
    ],
    roles: [
      { value: "swe", label: "Software Engineer" },
      { value: "senior-swe", label: "Senior Software Engineer" },
      { value: "frontend", label: "Frontend Developer" },
      { value: "backend", label: "Backend Developer" },
      { value: "fullstack", label: "Full Stack Developer" },
      { value: "devops", label: "DevOps Engineer" },
      { value: "ml-engineer", label: "ML Engineer" }
    ],
    difficulties: [
      { value: "easy", label: "Entry Level (0-2 years)" },
      { value: "medium", label: "Mid Level (2-5 years)" },
      { value: "hard", label: "Senior Level (5+ years)" }
    ],
    languages: [
      { value: "javascript", label: "JavaScript" },
      { value: "python", label: "Python" },
      { value: "java", label: "Java" },
      { value: "c++", label: "C++" },
      { value: "c#", label: "C#" },
      { value: "go", label: "Go" },
      { value: "rust", label: "Rust" }
    ],
    interviewTypes: [
      { value: "technical", label: "Technical Only" },
      { value: "system-design", label: "System Design" },
      { value: "behavioral", label: "Behavioral" },
      { value: "mixed", label: "Mixed (Recommended)" }
    ],
    experienceLevels: [
      { value: "fresher", label: "Fresher (0-1 years)" },
      { value: "mid-level", label: "Mid Level (2-5 years)" },
      { value: "senior", label: "Senior (5+ years)" }
    ]
  };

  // Real-time analysis will be calculated from backend data

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {currentView === "setup" && (
          <>
            {/* Setup Screen */}
            <section className="mb-8">
              <h1 className="text-4xl font-bold mb-2">AI Interview Simulator</h1>
              <p className="text-muted-foreground text-lg">
                Practice with realistic company-specific interview scenarios
              </p>
            </section>

            <div className="grid grid-cols-[2fr_1fr] gap-6">
              <div className="space-y-6">
                {/* Interview Configuration */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Configure Your Interview</h2>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Target Company</Label>
                      <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {interviewSetup.companies.map(company => (
                            <SelectItem key={company.value} value={company.value}>
                              {company.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {interviewSetup.roles.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Experience Level</Label>
                      <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {interviewSetup.experienceLevels.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Difficulty Level</Label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {interviewSetup.difficulties.map(diff => (
                            <SelectItem key={diff.value} value={diff.value}>
                              {diff.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Preferred Language</Label>
                      <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {interviewSetup.languages.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Interview Type</Label>
                      <Select value={interviewType} onValueChange={setInterviewType}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {interviewSetup.interviewTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Setup Check */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Equipment Check</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {micEnabled ? <Mic className="w-5 h-5 text-[#00CC66]" /> : <MicOff className="w-5 h-5 text-red-500" />}
                        <span>Microphone</span>
                      </div>
                      <Button
                        variant={micEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={async () => {
                          try {
                            await navigator.mediaDevices.getUserMedia({ audio: true });
                            setMicEnabled(true);
                          } catch {
                            setMicEnabled(false);
                          }
                        }}
                      >
                        {micEnabled ? "Tested" : "Test Mic"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {videoEnabled ? <Video className="w-5 h-5 text-[#00CC66]" /> : <VideoOff className="w-5 h-5 text-red-500" />}
                        <span>Camera</span>
                      </div>
                      <Button
                        variant={videoEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={async () => {
                          try {
                            await navigator.mediaDevices.getUserMedia({ video: true });
                            setVideoEnabled(true);
                          } catch {
                            setVideoEnabled(false);
                          }
                        }}
                      >
                        {videoEnabled ? "Tested" : "Test Camera"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {audioEnabled ? <Volume2 className="w-5 h-5 text-[#00CC66]" /> : <VolumeX className="w-5 h-5 text-red-500" />}
                        <span>Audio Output</span>
                      </div>
                      <Button
                        variant={audioEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={async () => {
                          try {
                            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = ctx.createOscillator();
                            osc.connect(ctx.destination);
                            osc.start();
                            setTimeout(() => {
                              osc.stop();
                              ctx.close();
                            }, 200);
                            setAudioEnabled(true);
                          } catch {
                            setAudioEnabled(false);
                          }
                        }}
                      >
                        {audioEnabled ? "Tested" : "Test Sound"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setCurrentView("profile")}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={saveProfile}
                      disabled={isLoading}
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save Profile
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={startInterview}
                      disabled={isLoading}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Interview
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Tips Panel */}
              <div>
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold">Interview Tips</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium mb-1">🎯 Structure Your Answers</p>
                      <p className="text-muted-foreground text-xs">Use STAR method for behavioral questions</p>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium mb-1">💡 Think Out Loud</p>
                      <p className="text-muted-foreground text-xs">Explain your thought process clearly</p>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium mb-1">⏱️ Time Management</p>
                      <p className="text-muted-foreground text-xs">Keep answers concise (2-3 minutes)</p>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium mb-1">❓ Ask Questions</p>
                      <p className="text-muted-foreground text-xs">Clarify requirements before solving</p>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium mb-1">🔄 Practice Regularly</p>
                      <p className="text-muted-foreground text-xs">Consistency improves confidence</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 mt-6">
                  <h3 className="font-semibold mb-3">Recent Sessions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>Google SWE</span>
                      <Badge>78%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>Amazon Backend</span>
                      <Badge>82%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>Meta Frontend</span>
                      <Badge>75%</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}

        {currentView === "profile" && userProfile && (
          <>
            {/* Profile View */}
            <section className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Your Interview Profile</h1>
              <p className="text-muted-foreground text-lg">
                Manage your interview preferences and track your progress
              </p>
            </section>

            <div className="grid grid-cols-[2fr_1fr] gap-6">
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                      <p className="text-lg font-semibold">{userProfile.role}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Experience Level</Label>
                      <p className="text-lg font-semibold">{userProfile.experienceLevel}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Target Company</Label>
                      <p className="text-lg font-semibold">{userProfile.targetCompany || 'Any'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Preferred Language</Label>
                      <p className="text-lg font-semibold">{userProfile.preferredLanguage}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Interview Type</Label>
                      <p className="text-lg font-semibold">{userProfile.interviewType}</p>
                    </div>
                  </div>
                  <Button 
                    className="mt-6"
                    onClick={() => setCurrentView("setup")}
                  >
                    Edit Profile
                  </Button>
                </Card>

                {analytics && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Sessions</Label>
                        <p className="text-2xl font-bold">{analytics.totalSessions}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Average Score</Label>
                        <p className="text-2xl font-bold">{analytics.averageScore}%</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Current Streak</Label>
                        <p className="text-2xl font-bold">{analytics.streak} days</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Time Spent</Label>
                        <p className="text-2xl font-bold">{analytics.timeSpent} min</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              <div>
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Recent Sessions</h3>
                  <div className="space-y-3">
                    {sessionHistory.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{session.status}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {session.score && (
                          <Badge variant="outline">
                            {session.score.overall}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}

        {currentView === "interview" && (
          <>
            {/* Interview Screen */}
            <div className="fixed top-16 left-64 right-0 bottom-0 bg-background flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <Badge className="bg-red-500">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                    Recording
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono font-semibold">{formatTime(timeElapsed)}</span>
                  </div>
                  <Badge variant="outline">
                    {selectedCompany} • {selectedRole}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={togglePause} disabled={isLoading}>
                    <Pause className="w-4 h-4 mr-2" />
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={endInterview} disabled={isLoading}>
                    End Interview
                  </Button>
                </div>
              </div>

              {/* Main Content */}
              <div className={`flex-1 grid ${showCodePanel ? 'grid-cols-[1fr_520px]' : 'grid-cols-[1fr_350px]'} overflow-hidden min-h-0`}>
                {/* Chat Area */}
                <div className="flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                    {error && (
                      <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.role === "candidate" ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${message.role === "interviewer" ? "bg-primary" : "bg-[#00CC66]"}`}>
                          {message.role === "interviewer" ? (
                            <Brain className="w-5 h-5 text-primary-foreground" />
                          ) : (
                            <span className="text-white font-semibold">You</span>
                          )}
                        </div>
                        <div className={`flex-1 max-w-2xl ${message.role === "candidate" ? "text-right" : ""}`}>
                          <div className={`inline-block p-4 rounded-lg ${message.role === "interviewer" ? "bg-card" : "bg-primary text-primary-foreground"}`}>
                            {message.role === 'interviewer' ? (
                              <div className="prose prose-sm max-w-none">
                                {renderMarkdown(message.content)}
                              </div>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{message.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coding invite bar */}
                  {codingInviteShown && !showCodePanel && (
                    <div className="border-t border-border px-6 py-3 bg-muted/60 flex items-center justify-between">
                      <div className="text-sm">Interviewer asked you to solve a coding problem. Would you like to attempt it now?</div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAttemptCoding}>Attempt now</Button>
                        <Button size="sm" variant="outline" onClick={handleSkipCoding}>Skip</Button>
                      </div>
                    </div>
                  )}

                  {/* Coding editor moved to right column when visible */}

                  {/* Input Area */}
                  <div className="border-t border-border p-4 shrink-0">
                    <form className="flex gap-3" onSubmit={(e) => { e.preventDefault(); sendResponse(); }}>
                      <Textarea
                        value={candidateResponse}
                        onChange={(e) => setCandidateResponse(e.target.value)}
                        placeholder="Type your response here or use voice input..."
                        className="min-h-[80px] bg-background"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendResponse();
                          }
                        }}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          variant={micEnabled ? "default" : "outline"}
                          size="icon"
                          onClick={() => setMicEnabled(!micEnabled)}
                          aria-pressed={micEnabled}
                          title={micEnabled ? 'Mute mic' : 'Unmute mic'}
                          type="button"
                        >
                          {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </Button>
                        <Button type="submit" size="icon" disabled={isLoading || !candidateResponse.trim()} title="Send (Enter)">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right Column: Side Panel or Code Panel */}
                {!showCodePanel && (
                <div className="border-l border-border bg-card p-4 overflow-y-auto min-h-0">
                  <Tabs defaultValue="analysis">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="analysis" className="space-y-4 mt-4">
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3 text-sm">Interview Progress</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Questions Answered</span>
                              <span className="font-semibold">{currentSession?.currentQuestionIndex || 0} / {questions.length}</span>
                            </div>
                            <Progress value={((currentSession?.currentQuestionIndex || 0) / questions.length) * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Time Elapsed</span>
                              <span className="font-semibold">{formatTime(timeElapsed)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Current Question</span>
                              <span className="font-semibold">{currentQuestion?.type || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {currentQuestion && (
                        <Card className="p-4">
                          <h4 className="font-semibold mb-3 text-sm">Current Question</h4>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{currentQuestion.title}</p>
                            <p className="text-xs text-muted-foreground">{currentQuestion.description}</p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">{currentQuestion.difficulty}</Badge>
                              <Badge variant="outline" className="text-xs">{currentQuestion.category}</Badge>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Moved code editor inline when attempting; keep side panel clean */}
                    </TabsContent>

                    <TabsContent value="notes" className="mt-4">
                      <Textarea
                        placeholder="Take notes during your interview..."
                        className="min-h-[400px] bg-background"
                      />
                    </TabsContent>
                  </Tabs>
                </div>
                )}
                {showCodePanel && currentQuestion && (currentQuestion.type === 'dsa' || currentQuestion.type === 'coding') && (
                <div className="border-l border-border bg-card p-4 overflow-y-auto min-h-0">
                  <Card className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Coding Workspace</h4>
                    <div className="prose prose-sm max-w-none mb-4">
                      {renderMarkdown((() => {
                        const title = `### ${currentQuestion.title}`;
                        const meta = `\n\n**Type:** ${currentQuestion.type}  \
**Difficulty:** ${currentQuestion.difficulty}  \
**Category:** ${currentQuestion.category || 'general'}`;
                        const desc = `\n\n${currentQuestion.description || ''}`;
                        // Try to extract Input/Output/Constraints if present; else add a minimal structure
                        const hasStructure = /input\s*format|output\s*format|constraints/i.test(currentQuestion.description || '');
                        const structure = hasStructure ? '' : `\n\n#### Input Format\n- As described in the problem.\n\n#### Output Format\n- As described in the problem.\n\n#### Constraints\n- Reasonable limits for the given difficulty.`;
                        const samples = (currentQuestion as any).samples && (currentQuestion as any).samples.length
                          ? `\n\n#### Sample Tests\n${(currentQuestion as any).samples.slice(0,3).map((s:any,i:number)=>`Test ${i+1}:\n- Input: \`${s.input}\`\n- Expected: \`${s.expectedOutput}\`\n- Explanation: ${s.explanation || ''}`).join('\n\n')}`
                          : (currentQuestion.testCases && currentQuestion.testCases.length
                            ? `\n\n#### Sample Tests\n${currentQuestion.testCases.slice(0,3).map((t:any,i:number)=>`Test ${i+1}:\n- Input: \`${t.input}\`\n- Expected: \`${t.expectedOutput}\``).join('\n\n')}`
                            : '');
                        const hiddenTests = currentQuestion.testCases && currentQuestion.testCases.length > 3
                          ? `\n\n> Additional hidden tests: ${currentQuestion.testCases.length - 3}`
                          : '';
                        return `${title}${meta}${desc}${structure}${samples}${hiddenTests}`;
                      })())}
                    </div>
                    <CodeEditor
                      language={selectedLanguage}
                      onLanguageChange={setSelectedLanguage}
                      onCodeChange={setCode}
                      onRunCode={handleCodeExecution}
                      initialCode={code}
                      isRunning={isCodeRunning}
                      executionResult={executionResult}
                    />
                  </Card>
                </div>
                )}
              </div>
            </div>
          </>
        )}

        {currentView === "results" && (
          <>
            {/* Results View */}
            <section className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Interview Results</h1>
              <p className="text-muted-foreground text-lg">
                Your performance analysis and feedback
              </p>
            </section>

            {!scoreData ? (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Calculating your results... If this takes too long, try refreshing your profile or check your recent sessions.</p>
              </Card>
            ) : (
            <div className="grid grid-cols-[2fr_1fr] gap-6">
              <div className="space-y-6">
                {/* Overall Score */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold text-primary mb-2">
                      {scoreData.overall}%
                    </div>
                    <p className="text-muted-foreground">Overall Score</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Technical</span>
                        <span>{scoreData.technical}%</span>
                      </div>
                      <Progress value={scoreData.technical} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Communication</span>
                        <span>{scoreData.communication}%</span>
                      </div>
                      <Progress value={scoreData.communication} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Problem Solving</span>
                        <span>{scoreData.problemSolving}%</span>
                      </div>
                      <Progress value={scoreData.problemSolving} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Time Management</span>
                        <span>{scoreData.timeManagement}%</span>
                      </div>
                      <Progress value={scoreData.timeManagement} className="h-2" />
                    </div>
                  </div>
                </Card>

                {/* Feedback */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Feedback</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Overall</h3>
                      <p className="text-sm text-muted-foreground">{scoreData.feedback.overall}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Technical</h3>
                      <p className="text-sm text-muted-foreground">{scoreData.feedback.technical}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Recommendations</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {scoreData.feedback.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* Question-level feedback */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Question-by-Question Feedback</h2>
                  {!(sessionResults?.evaluations?.length) ? (
                    <p className="text-sm text-muted-foreground">Complete an interview to see detailed question feedback.</p>
                  ) : (
                  <div className="space-y-4">
                    {sessionResults.evaluations.map((evaluation) => {
                      const questionMeta = evaluation.question || questionLookup.get(evaluation.questionId);
                      const strengths = evaluation.feedback?.strengths?.length ? evaluation.feedback.strengths : ["No key strengths captured for this answer yet."];
                      const weaknesses = evaluation.feedback?.weaknesses?.length ? evaluation.feedback.weaknesses : ["No major weaknesses recorded."];
                      const improvements = evaluation.feedback?.improvements?.length ? evaluation.feedback.improvements : ["Keep practicing to unlock tailored improvements."];

                      return (
                        <div key={evaluation.id || evaluation.questionId} className="rounded-lg border border-border p-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-base">{questionMeta?.title || 'Interview Question'}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {questionMeta?.type && (
                                  <Badge variant="outline" className="capitalize">
                                    {questionMeta.type.replace('-', ' ')}
                                  </Badge>
                                )}
                                {questionMeta?.difficulty && (
                                  <Badge variant="secondary" className="capitalize">
                                    {questionMeta.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right min-w-[72px]">
                              <div className="text-2xl font-bold">{Math.round(evaluation.totalScore)}%</div>
                              <p className="text-xs text-muted-foreground">Score</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(evaluation.timeSpent || 0)} spent</span>
                            <span>•</span>
                            <span>{evaluation.hintsUsed || 0} hints used</span>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
                            <div>
                              <h4 className="font-medium text-foreground mb-1">Strengths</h4>
                              <ul className="space-y-1 list-disc list-inside">
                                {strengths.slice(0,3).map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground mb-1">Opportunities</h4>
                              <ul className="space-y-1 list-disc list-inside">
                                {weaknesses.slice(0,3).map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground mb-1">Action Items</h4>
                              <ul className="space-y-1 list-disc list-inside">
                                {improvements.slice(0,3).map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </Card>
              </div>

              <div className="space-y-6">
                {/* Focus Areas */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Focus Areas</h3>
                  {aggregatedFeedback ? (
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Top Weaknesses</h4>
                        <ul className="space-y-1 list-disc list-inside">
                          {aggregatedFeedback.weaknesses.slice(0,4).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Suggested Improvements</h4>
                        <ul className="space-y-1 list-disc list-inside">
                          {aggregatedFeedback.improvements.slice(0,4).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Once you complete more questions, we’ll highlight the areas that need your attention the most.</p>
                  )}
                </Card>

                {/* Topic Breakdown */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Topic Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(scoreData.breakdown || {}).map(([topic, rawScore]) => {
                      const score = Number(rawScore as any);
                      return (
                      <div key={topic}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{topic}</span>
                          <span>{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Actions */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Next Steps</h3>
                  <div className="space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setCurrentView("setup");
                        setCurrentSession(null);
                        setMessages([]);
                        setCurrentQuestion(null);
                        setQuestions([]);
                        setSessionResults(null);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Take Another Interview
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setCurrentView("profile")}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}