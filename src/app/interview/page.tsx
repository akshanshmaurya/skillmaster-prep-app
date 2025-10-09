"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  Pause
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
}

export default function InterviewPage() {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"intro" | "technical" | "behavioral" | "questions">("intro");
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState("google");
  const [selectedRole, setSelectedRole] = useState("swe");
  const [difficulty, setDifficulty] = useState("medium");
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "interviewer",
      content: "Hello! Welcome to your mock interview session. I'm your AI interviewer today. Let me know when you're ready to begin.",
      timestamp: "10:00 AM"
    }
  ]);

  const [candidateResponse, setCandidateResponse] = useState("");

  // Timer for interview
  useEffect(() => {
    if (!interviewStarted) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = () => {
    setInterviewStarted(true);
    const newMessage: Message = {
      role: "interviewer",
      content: "Great! Let's start with a brief introduction. Tell me about yourself and your background in software development.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendResponse = () => {
    if (!candidateResponse.trim()) return;

    const candidateMsg: Message = {
      role: "candidate",
      content: candidateResponse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, candidateMsg]);
    setCandidateResponse("");

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's impressive! Now, let's move to a technical question. Can you explain the difference between process and thread in operating systems?",
        "Interesting perspective. Let me ask you about algorithms - how would you approach finding the kth largest element in an unsorted array?",
        "Good answer. Now for a system design question - How would you design a URL shortening service like bit.ly?",
        "I see. Let's discuss your experience with databases. What's your approach to optimizing slow queries?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const aiMsg: Message = {
        role: "interviewer",
        content: randomResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 2000);
  };

  const interviewSetup = {
    companies: [
      { value: "google", label: "Google", color: "bg-[#6633FF]" },
      { value: "amazon", label: "Amazon", color: "bg-[#AA66FF]" },
      { value: "microsoft", label: "Microsoft", color: "bg-cyan-500" },
      { value: "meta", label: "Meta", color: "bg-[#6633FF]" },
      { value: "apple", label: "Apple", color: "bg-gray-500" }
    ],
    roles: [
      { value: "swe", label: "Software Engineer" },
      { value: "senior-swe", label: "Senior Software Engineer" },
      { value: "frontend", label: "Frontend Developer" },
      { value: "backend", label: "Backend Developer" },
      { value: "fullstack", label: "Full Stack Developer" },
      { value: "devops", label: "DevOps Engineer" }
    ],
    difficulties: [
      { value: "easy", label: "Entry Level (0-2 years)" },
      { value: "medium", label: "Mid Level (2-5 years)" },
      { value: "hard", label: "Senior Level (5+ years)" }
    ]
  };

  const aiAnalysis = {
    strengths: [
      "Clear communication style",
      "Good problem-solving approach",
      "Structured thinking"
    ],
    improvements: [
      "Could elaborate more on edge cases",
      "Time complexity analysis needs depth",
      "Consider mentioning trade-offs"
    ],
    score: 78,
    confidence: 72,
    pace: 85
  };

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {!interviewStarted ? (
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
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Company</label>
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
                      <label className="text-sm font-medium mb-2 block">Role</label>
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
                      <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
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
                        onClick={() => setMicEnabled(!micEnabled)}
                      >
                        {micEnabled ? "Enabled" : "Disabled"}
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
                        onClick={() => setVideoEnabled(!videoEnabled)}
                      >
                        {videoEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {audioEnabled ? <Volume2 className="w-5 h-5 text-[#00CC66]" /> : <VolumeX className="w-5 h-5 text-red-500" />}
                        <span>Audio</span>
                      </div>
                      <Button 
                        variant={audioEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAudioEnabled(!audioEnabled)}
                      >
                        {audioEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full mt-6"
                    onClick={startInterview}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Interview
                  </Button>
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
        ) : (
          <>
            {/* Interview Screen */}
            <div className="fixed top-16 left-64 right-0 bottom-0 bg-background flex flex-col">
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
                  <Button variant="outline" size="sm">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="destructive" size="sm">
                    End Interview
                  </Button>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 grid grid-cols-[1fr_350px] overflow-hidden">
                {/* Chat Area */}
                <div className="flex flex-col">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{message.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-border p-4">
                    <div className="flex gap-3">
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
                        >
                          {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </Button>
                        <Button onClick={sendResponse} size="icon">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side Panel */}
                <div className="border-l border-border bg-card p-4 overflow-y-auto">
                  <Tabs defaultValue="analysis">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="analysis" className="space-y-4 mt-4">
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3 text-sm">Live Performance</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Communication</span>
                              <span className="font-semibold">{aiAnalysis.score}%</span>
                            </div>
                            <Progress value={aiAnalysis.score} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Confidence</span>
                              <span className="font-semibold">{aiAnalysis.confidence}%</span>
                            </div>
                            <Progress value={aiAnalysis.confidence} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Speaking Pace</span>
                              <span className="font-semibold">{aiAnalysis.pace}%</span>
                            </div>
                            <Progress value={aiAnalysis.pace} className="h-2" />
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-[#00CC66]" />
                          <h4 className="font-semibold text-sm">Strengths</h4>
                        </div>
                        <ul className="space-y-2 text-xs">
                          {aiAnalysis.strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-[#00CC66]">✓</span>
                              <span className="text-muted-foreground">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          <h4 className="font-semibold text-sm">Areas to Improve</h4>
                        </div>
                        <ul className="space-y-2 text-xs">
                          {aiAnalysis.improvements.map((improvement, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-yellow-500">!</span>
                              <span className="text-muted-foreground">{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-4">
                      <Textarea
                        placeholder="Take notes during your interview..."
                        className="min-h-[400px] bg-background"
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}