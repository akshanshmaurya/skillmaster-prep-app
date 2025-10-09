"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2,
  AlertCircle,
  Code
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Question {
  id: number;
  type: "mcq" | "code";
  question: string;
  options?: string[];
  code?: string;
  language?: string;
}

export default function TakeTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(5400); // 90 minutes in seconds
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      type: "mcq",
      question: "What is the time complexity of binary search in a sorted array?",
      options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"]
    },
    {
      id: 2,
      type: "mcq",
      question: "Which React hook is used for side effects?",
      options: ["useState", "useEffect", "useContext", "useMemo"]
    },
    {
      id: 3,
      type: "code",
      question: "Write a function to reverse a linked list. Implement the solution in the language of your choice.",
      language: "javascript"
    },
    {
      id: 4,
      type: "mcq",
      question: "What does REST stand for in web services?",
      options: [
        "Representational State Transfer",
        "Remote Execution State Transfer",
        "Resource Execution Service Tool",
        "Rapid External Service Transaction"
      ]
    },
    {
      id: 5,
      type: "code",
      question: "Implement a function to find the maximum depth of a binary tree.",
      language: "python"
    },
  ];

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentQuestion)) {
      newFlagged.delete(currentQuestion);
    } else {
      newFlagged.add(currentQuestion);
    }
    setFlagged(newFlagged);
  };

  const handleSubmit = () => {
    router.push(`/tests/${params.id}/results`);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const currentQ = questions[currentQuestion];

  return (
    <div className="dark min-h-screen bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-bold text-lg">Full Stack Development Assessment</h1>
            <p className="text-sm text-muted-foreground">Google • 50 Questions</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${timeLeft < 600 ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className={`font-mono text-lg font-semibold ${timeLeft < 600 ? 'text-destructive' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            
            <div className="text-sm">
              <span className="text-muted-foreground">Progress: </span>
              <span className="font-semibold">{answeredCount}/{questions.length}</span>
            </div>

            <Button onClick={() => setShowSubmitDialog(true)} size="lg">
              Submit Test
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      <div className="pt-24 pb-8 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-[1fr_300px] gap-6">
          {/* Main Question Area */}
          <div>
            <Card className="p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    Question {currentQuestion + 1}
                  </Badge>
                  {currentQ.type === "code" && (
                    <Badge variant="secondary" className="gap-1">
                      <Code className="w-3 h-3" />
                      Coding
                    </Badge>
                  )}
                </div>
                <Button
                  variant={flagged.has(currentQuestion) ? "default" : "outline"}
                  size="sm"
                  onClick={toggleFlag}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {flagged.has(currentQuestion) ? "Flagged" : "Flag"}
                </Button>
              </div>

              <h2 className="text-xl font-semibold mb-6">{currentQ.question}</h2>

              {currentQ.type === "mcq" && currentQ.options && (
                <RadioGroup
                  value={answers[currentQuestion]}
                  onValueChange={handleAnswer}
                  className="space-y-4"
                >
                  {currentQ.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQ.type === "code" && (
                <div>
                  <div className="mb-4">
                    <Label className="mb-2 block">Your Solution:</Label>
                    <div className="bg-muted rounded-lg p-1 mb-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-xs">JavaScript</Button>
                        <Button variant="ghost" size="sm" className="text-xs">Python</Button>
                        <Button variant="ghost" size="sm" className="text-xs">Java</Button>
                        <Button variant="ghost" size="sm" className="text-xs">C++</Button>
                      </div>
                    </div>
                  </div>
                  <Textarea
                    value={answers[currentQuestion] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="// Write your code here..."
                    className="font-mono min-h-[400px] bg-background"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline">
                      Run Code
                    </Button>
                    <Button variant="outline">
                      Test Against Examples
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </span>

              <Button
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === questions.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div>
            <Card className="p-4 sticky top-24">
              <h3 className="font-semibold mb-4">Question Navigator</h3>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`
                      aspect-square rounded flex items-center justify-center text-sm font-medium transition-colors relative
                      ${currentQuestion === index ? 'bg-primary text-primary-foreground' : ''}
                      ${answers[index] && currentQuestion !== index ? 'bg-green-500/20 text-green-500 border border-green-500' : ''}
                      ${!answers[index] && currentQuestion !== index ? 'bg-muted hover:bg-accent' : ''}
                    `}
                  >
                    {index + 1}
                    {flagged.has(index) && (
                      <Flag className="w-3 h-3 absolute -top-1 -right-1 fill-current" />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Answered</span>
                  </div>
                  <span className="font-semibold">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span>Not Answered</span>
                  </div>
                  <span className="font-semibold">{questions.length - answeredCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-primary" />
                    <span>Flagged</span>
                  </div>
                  <span className="font-semibold">{flagged.size}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-destructive">
                  You have {questions.length - answeredCount} unanswered question(s).
                </span>
              )}
              <span className="block mt-2">
                Are you sure you want to submit your test? This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}