import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import type {
  AssessmentAnswerType,
  AssessmentDifficulty,
  AssessmentSummary,
  AssessmentTopic,
  AssessmentTrack
} from '../models/Assessment';
import type {
  PracticeAIResponse,
  PracticeAnswerType,
  PracticeDifficulty,
  PracticeTopic
} from '../models/Practice';
import type { Question, TestCase } from '../models/Interview';

export type ConversationMessage = {
  role: string;
  content: string;
};

export type GenerateInterviewerResponseContext = {
  question: string;
  questionType: string;
  difficulty: string;
  company?: string;
  role: string;
  candidateAnswer?: string;
  conversationHistory: ConversationMessage[];
  currentPhase: string;
  performance?: number;
  strengths?: string[];
  weaknesses?: string[];
};

export type GenerateFollowUpQuestionContext = {
  originalQuestion: string;
  questionType: string;
  candidateAnswer: string;
  difficulty: string;
  company?: string;
  role: string;
};

export type GenerateFeedbackContext = {
  question: string;
  questionType: string;
  candidateAnswer: string;
  code?: string;
  language?: string;
  difficulty: string;
  timeSpent: number;
};

export type StructuredQuestion = {
  id: string;
  title: string;
  description: string;
  type: Question['type'];
  difficulty: Question['difficulty'];
  category: string;
  tags: string[];
  companies: string[];
  roles: string[];
  purpose?: Question['purpose'];
  source: 'ai';
  timeLimit: number;
  testCases?: TestCase[];
  samples?: Array<{ input: string; expectedOutput: string; explanation?: string }>;
  expectedAnswer?: string;
  hints?: string[];
};

export type GenerateStructuredQuestionsContext = {
  company?: string;
  role: string;
  interviewType: 'technical' | 'system-design' | 'behavioral' | 'mixed';
  difficulty?: 'easy' | 'medium' | 'hard';
  count: number;
};

export type PracticeQuestionDraft = {
  id: string;
  prompt: string;
  answerType: PracticeAnswerType;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  tags: string[];
  estimatedTime: number;
};

export type GeneratePracticeQuestionsContext = {
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  count: number;
  preferredAnswerType?: PracticeAnswerType;
};

export type GeneratePracticeFeedbackContext = {
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  accuracy: number;
  results: Array<{
    prompt: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    explanation: string;
  }>;
};

export type AssessmentQuestionDraft = {
  id: string;
  prompt: string;
  answerType: AssessmentAnswerType;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  tags: string[];
  estimatedTime: number;
};

export type GenerateAssessmentQuestionsContext = {
  track: AssessmentTrack;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  count: number;
  preferredAnswerType?: AssessmentAnswerType;
};

export type GenerateAssessmentFeedbackContext = {
  track: AssessmentTrack;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  accuracy: number;
  results: Array<{
    prompt: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    explanation: string;
  }>;
};

type FeedbackSections = Pick<PracticeAIResponse, 'strengths' | 'weaknesses' | 'improvements' | 'suggestions'>;

export class GeminiAIService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    const modelName = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  private isTimeoutError(error: unknown): boolean {
    return error instanceof Error && /timed out/i.test(error.message);
  }

  private getMaxAttempts(): number {
    const raw = Number(process.env.GEMINI_MAX_ATTEMPTS ?? '3');
    if (!Number.isFinite(raw) || raw < 1) {
      return 3;
    }
    return Math.min(Math.trunc(raw), 6);
  }

  private getTimeoutMs(): number {
    const base = Number(process.env.GEMINI_TIMEOUT_MS ?? '18000');
    if (!Number.isFinite(base) || base <= 0) {
      return 18000;
    }
    return Math.min(Math.max(base, 8000), 30000);
  }

  private async runWithRetries<T>(task: () => Promise<T>): Promise<T> {
    const attempts = this.getMaxAttempts();
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await task();
      } catch (error) {
        lastError = error;
        if (attempt === attempts) {
          break;
        }
        const delay = 400 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error('Gemini request failed');
  }

  private async generateContentWithTimeout(request: Parameters<GenerativeModel['generateContent']>[0]) {
    const timeoutMs = this.getTimeoutMs();
    let timeoutId: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Gemini request timed out')), timeoutMs);
    });

    try {
      const result = await Promise.race([
        this.model.generateContent(request),
        timeoutPromise
      ]) as Awaited<ReturnType<GenerativeModel['generateContent']>>;
      return result;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async generateText(prompt: string, generationConfig?: GenerationConfig): Promise<string> {
    const response = await this.runWithRetries(async () => {
      const result = await this.generateContentWithTimeout({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      });
      const res = await result.response;
      if (!res) {
        throw new Error('Gemini response was empty');
      }
      return res.text();
    });
    return response;
  }

  private async fetchJsonArray(prompt: string, generationConfig?: GenerationConfig): Promise<any[]> {
    const text = await this.generateText(prompt, generationConfig);
    const parsed = this.extractJson(text);
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response was not a JSON array');
    }
    return parsed;
  }

  private extractJson(text?: string): any {
    if (!text) {
      throw new Error('Empty model response');
    }

    let unwrapped = text.replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1');
    unwrapped = unwrapped.replace(/\uFEFF/g, '');
    unwrapped = unwrapped.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    unwrapped = unwrapped.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ');
    unwrapped = unwrapped.trim();

    let candidate = unwrapped;
    if (!(candidate.startsWith('[') || candidate.startsWith('{'))) {
      const arrayStart = candidate.indexOf('[');
      const arrayEnd = candidate.lastIndexOf(']');
      const objStart = candidate.indexOf('{');
      const objEnd = candidate.lastIndexOf('}');
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        candidate = candidate.slice(arrayStart, arrayEnd + 1);
      } else if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
        candidate = candidate.slice(objStart, objEnd + 1);
      }
    }

    candidate = candidate.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(candidate);
  }

  async generateInterviewerResponse(context: GenerateInterviewerResponseContext): Promise<string> {
    const prompt = this.buildInterviewPrompt(context);
    try {
      return await this.generateText(prompt);
    } catch (error) {
      if (!this.isTimeoutError(error)) {
        console.error('Gemini interviewer response error:', error);
      }
      return this.getFallbackResponse(context);
    }
  }

  async generateFollowUpQuestion(context: GenerateFollowUpQuestionContext): Promise<string> {
    const prompt = this.buildFollowUpPrompt(context);
    try {
      return await this.generateText(prompt);
    } catch (error) {
      if (!this.isTimeoutError(error)) {
        console.error('Gemini follow-up error:', error);
      }
      return this.getFallbackFollowUp();
    }
  }

  async generateFeedback(context: GenerateFeedbackContext): Promise<PracticeAIResponse> {
    const prompt = this.buildFeedbackPrompt(context);
    try {
      const text = await this.generateText(prompt);
      return this.parseFeedbackResponse(text);
    } catch (error) {
      if (!this.isTimeoutError(error)) {
        console.error('Gemini feedback error:', error);
      }
      return this.getFallbackFeedback();
    }
  }

  async generateInterviewIntroduction(context: {
    experienceLevel: string;
    role: string;
    company: string;
    interviewType: string;
  }): Promise<string> {
    const prompt = `You are an AI interviewer conducting a ${context.experienceLevel} level ${context.role} interview at ${context.company}.

Generate a professional and welcoming introduction that:
1. Welcomes the candidate
2. Introduces yourself as the AI interviewer
3. Explains the interview format (${context.interviewType})
4. Sets expectations for the session
5. Asks for a brief introduction

Keep it concise (2-3 sentences) and professional.`;

    try {
      return await this.generateText(prompt);
    } catch (error) {
      if (!this.isTimeoutError(error)) {
        console.error('Gemini introduction error:', error);
      }
      return `Hello! Welcome to your ${context.company} ${context.role} interview. I'm your AI interviewer today. Let's start with a quick introduction�tell me about yourself.`;
    }
  }

  async generateStructuredQuestions(context: GenerateStructuredQuestionsContext): Promise<StructuredQuestion[]> {
    const mapTypes: Record<GenerateStructuredQuestionsContext['interviewType'], Array<Question['type']>> = {
      technical: ['dsa', 'coding'],
      'system-design': ['system-design'],
      behavioral: ['behavioral'],
      mixed: ['dsa', 'coding', 'system-design', 'behavioral']
    };

    const allowedTypes = mapTypes[context.interviewType];
    const prompt = `Generate ${context.count} ${context.difficulty || 'medium'} difficulty interview questions for a ${context.role} role${context.company ? ' at ' + context.company : ''}.

Return JSON ONLY, as an array where each item has exactly these fields:
id, title, description, type, difficulty, category, tags, companies, roles, timeLimit, testCases.

testCases must contain FIVE entries per question. Each entry has:
- input (string): the exact STDIN the program will receive
- expectedOutput (string): the EXACT final STDOUT the program must produce (trimmed), with no labels or extra words
- explanation (string): short reasoning

Strict IO rules for coding/dsa questions (HackerEarth-friendly):
- The input must be raw values only, no variable labels (NOT like "nums=[1,2], k=2").
- Use space-separated tokens and/or newlines. Prefer simple formats like:
  - Single integer: "5"
  - Array: first the length, then the elements on one line: "4\n2 5 1 8"
  - String: just the string (no quotes)
  - Multiple params: put each on a new line, e.g., "4\n2 5 1 8\n3"
- The expectedOutput must be exactly what should be printed (or returned and then printed), with no brackets unless the answer is truly a list printed as e.g. "1 2 3" or JSON-like if specified by problem. Avoid trailing spaces.

General rules:
- type is one of: dsa, system-design, behavioral, coding
- Prefer types in [${allowedTypes.join(', ')}]
- difficulty is one of: easy, medium, hard
- companies should include ${context.company || 'common tech companies'}
- roles should include ${context.role}
- timeLimit is an integer minutes between 5 and 60.`;

    try {
      const text = await this.generateText(prompt);
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('Gemini structured questions: invalid format');
      }

      const timestamp = Date.now();
      return parsed.map((item: any, index: number) => {
        const rawType = String(item.type || allowedTypes[0] || 'coding');
        const type = (['dsa', 'system-design', 'behavioral', 'coding'].includes(rawType) ? rawType : allowedTypes[0] || 'coding') as Question['type'];
        return {
          id: String(item.id || `ai-${timestamp}-${index + 1}`),
          title: String(item.title || 'Interview question'),
          description: String(item.description || ''),
          type,
          difficulty: String(item.difficulty || context.difficulty || 'medium') as Question['difficulty'],
          category: String(item.category || 'general'),
          tags: Array.isArray(item.tags) ? item.tags.map((tag: any) => String(tag)) : [],
          companies: Array.isArray(item.companies)
            ? item.companies.map((company: any) => String(company))
            : context.company
            ? [context.company]
            : ['google', 'amazon'],
          roles: Array.isArray(item.roles) ? item.roles.map((role: any) => String(role)) : [context.role],
          purpose: type === 'behavioral' ? 'behavioral' : type === 'system-design' ? 'system-design' : type === 'coding' ? 'coding' : 'technical',
          source: 'ai',
          timeLimit: Number.isFinite(item.timeLimit) ? Math.max(5, Math.min(60, Number(item.timeLimit))) : 30,
          testCases: Array.isArray(item.testCases)
            ? item.testCases.map((tc: any) => ({
                input: String(tc.input ?? ''),
                expectedOutput: String(tc.expectedOutput ?? ''),
                explanation: typeof tc.explanation === 'string' ? tc.explanation : undefined
              }))
            : undefined,
          samples: Array.isArray(item.samples)
            ? item.samples.map((sample: any) => ({
                input: String(sample.input ?? ''),
                expectedOutput: String(sample.expectedOutput ?? ''),
                explanation: typeof sample.explanation === 'string' ? sample.explanation : undefined
              }))
            : undefined,
          expectedAnswer: typeof item.expectedAnswer === 'string' ? item.expectedAnswer : undefined,
          hints: Array.isArray(item.hints) ? item.hints.map((hint: any) => String(hint)) : undefined
        };
      });
    } catch (error) {
      if (!this.isTimeoutError(error)) {
        console.error('Gemini structured questions error:', error);
      }
      const timestamp = Date.now();
      const types = allowedTypes.length ? allowedTypes : ['coding'];
      return Array.from({ length: context.count }).map((_, index) => {
        const fallbackType = types[index % types.length] as 'coding' | 'system-design' | 'dsa' | 'behavioral';
        return {
          id: `ai-${timestamp}-${index + 1}`,
          title:
            fallbackType === 'system-design'
              ? 'Design a URL shortener'
              : fallbackType === 'behavioral'
              ? 'Tell me about a challenging project'
              : 'Two Sum',
          description:
            fallbackType === 'system-design'
              ? 'Discuss requirements, high-level design, data model, scaling, and trade-offs.'
              : fallbackType === 'behavioral'
              ? 'Describe a challenging project, your approach, and the outcome.'
              : 'Given an array and a target, return indices of two numbers that sum to the target.',
          type: fallbackType,
          difficulty: (context.difficulty || 'medium') as Question['difficulty'],
          category: fallbackType === 'behavioral' ? 'communication' : fallbackType === 'system-design' ? 'architecture' : 'arrays',
          tags: fallbackType === 'system-design' ? ['design'] : ['practice'],
          companies: context.company ? [context.company] : ['google', 'amazon'],
          roles: [context.role],
          purpose: fallbackType === 'behavioral' ? 'behavioral' : fallbackType === 'system-design' ? 'system-design' : fallbackType === 'coding' ? 'coding' : 'technical',
          source: 'ai',
          timeLimit: 30
        };
      });
    }
  }

  async generatePracticeQuestions(context: GeneratePracticeQuestionsContext): Promise<PracticeQuestionDraft[]> {
    const topicLabels: Record<PracticeTopic, string> = {
      quant: 'quantitative aptitude',
      verbal: 'verbal ability',
      aptitude: 'logical aptitude',
      reasoning: 'analytical reasoning',
      games: 'brain games'
    };

    const difficultyLabels: Record<PracticeDifficulty, string> = {
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced'
    };

    const preferred = context.preferredAnswerType ?? 'single-choice';
    const prompt = `You are an interview coach. Create ${context.count} ${difficultyLabels[context.difficulty]}-level ${topicLabels[context.topic]} practice questions for job interview preparation.

Return JSON only (no prose) representing an array. Each object must include:
- id (string)
- prompt (string)
- answerType ("single-choice" | "multiple-choice" | "short-text")
- options (array of four concise strings when answerType is choice-based; omit for short-text)
- correctAnswer (string for single-choice/short-text; array of strings for multiple-choice with exact option text)
- explanation (<=2 sentences)
- tags (array of 2-4 keywords)
- estimatedTime (integer minutes between 1 and 5)

Prioritise ${preferred} format unless another is clearly superior. Avoid numbering or commentary.`;

    try {
      const parsed = await this.fetchJsonArray(prompt);
      const timestamp = Date.now();
      return parsed.slice(0, context.count).map((item: any, index: number) => {
        const answerType = String(item.answerType || preferred) as PracticeAnswerType;
        const normalizedOptions = Array.isArray(item.options)
          ? item.options.map((opt: any) => String(opt))
          : undefined;
        const normalizedAnswer = answerType === 'multiple-choice'
          ? (Array.isArray(item.correctAnswer)
              ? item.correctAnswer.map((ans: any) => String(ans))
              : (normalizedOptions ?? []).filter((opt) => opt === String(item.correctAnswer)))
          : String(item.correctAnswer ?? '');

        return {
          id: String(item.id || `practice-ai-${timestamp}-${index + 1}`),
          prompt: String(item.prompt || 'Practice question'),
          answerType,
          options: answerType === 'short-text' ? undefined : normalizedOptions,
          correctAnswer: normalizedAnswer,
          explanation: String(item.explanation || 'Review the core concept and eliminate distractors.'),
          tags: Array.isArray(item.tags) && item.tags.length ? item.tags.map((tag: any) => String(tag)) : [topicLabels[context.topic]],
          estimatedTime: Number.isFinite(item.estimatedTime) ? Math.max(1, Math.min(5, Number(item.estimatedTime))) : 3
        };
      });
    } catch (error) {
      console.error('Gemini practice question generation failed:', error);
      throw error;
    }
  }

  async generatePracticeFeedback(context: GeneratePracticeFeedbackContext): Promise<PracticeAIResponse> {
    const topicLabels: Record<PracticeTopic, string> = {
      quant: 'quantitative aptitude',
      verbal: 'verbal ability',
      aptitude: 'logical aptitude',
      reasoning: 'analytical reasoning',
      games: 'brain games'
    };

    const difficultyLabels: Record<PracticeDifficulty, string> = {
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced'
    };

    const formattedResults = context.results
      .map((result, idx) => {
        const userAnswer = Array.isArray(result.userAnswer) ? result.userAnswer.join(', ') : result.userAnswer;
        const correctAnswer = Array.isArray(result.correctAnswer) ? result.correctAnswer.join(', ') : result.correctAnswer;
        return `Q${idx + 1}: ${result.prompt}\nChosen: ${userAnswer}\nCorrect: ${correctAnswer}\nCorrect? ${result.isCorrect ? 'Yes' : 'No'}\nExplanation: ${result.explanation}`;
      })
      .join('\n\n');

    const prompt = `You are an encouraging interview mentor helping a candidate improve ${topicLabels[context.topic]} skills.

Candidate difficulty level: ${difficultyLabels[context.difficulty]}
Overall accuracy: ${(context.accuracy * 100).toFixed(1)}%

Provide feedback in this exact structure with 2-3 bullets per section (max 16 words per bullet):

STRENGTHS:
- ...

WEAKNESSES:
- ...

IMPROVEMENTS:
- ...

SUGGESTIONS:
- ...

Keep tone supportive and focus on interview preparation. Reference concepts, not option letters.

Here are the question outcomes:
${formattedResults}`;

    try {
      const text = await this.generateText(prompt);
      const parsed = this.parseFeedbackResponse(text);
      if (
        parsed.strengths.length === 0 &&
        parsed.weaknesses.length === 0 &&
        parsed.improvements.length === 0 &&
        parsed.suggestions.length === 0
      ) {
        throw new Error('Gemini practice feedback returned empty sections');
      }
      return parsed;
    } catch (error) {
      console.error('Gemini practice feedback failed:', error);
      throw error;
    }
  }

  async generateAssessmentQuestions(context: GenerateAssessmentQuestionsContext): Promise<AssessmentQuestionDraft[]> {
    const trackLabels: Record<AssessmentTrack, string> = {
      'soft-skills': 'soft skills aptitude (quantitative, verbal, logical) interviews',
      'technical-skills': 'technical fundamentals (coding, cloud, CS core) interviews'
    };

    const topicLabels: Record<AssessmentTopic, string> = {
      quant: 'quantitative aptitude',
      verbal: 'verbal ability',
      aptitude: 'logical aptitude',
      coding: 'coding fundamentals',
      cloud: 'cloud computing and DevOps',
      dbms: 'database management systems',
      'operating-systems': 'operating systems',
      networks: 'computer networks',
      'system-design': 'system design'
    };

    const difficultyLabels: Record<AssessmentDifficulty, string> = {
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced'
    };

    const preferred = context.preferredAnswerType ?? 'single-choice';
    const prompt = `You are designing a rigorous ${trackLabels[context.track]} assessment. Create ${context.count} ${difficultyLabels[context.difficulty]}-level questions targeting ${topicLabels[context.topic]} as asked in top company tests.

Return JSON only (no prose) as an array. Each object must include exactly:
- id (string)
- prompt (string)
- answerType ("single-choice" | "multiple-choice" | "short-text")
- options (array of four concise strings when answerType is choice-based; omit for short-text)
- correctAnswer (string for single-choice/short-text; array of exact option strings for multiple-choice)
- explanation (<=2 sentences)
- tags (array of 2-4 keywords)
- estimatedTime (integer minutes between 1 and 6)

Balance conceptual understanding and applied reasoning. Avoid numbering, markdown, or commentary.`;

    try {
      const parsed = await this.fetchJsonArray(prompt);
      const timestamp = Date.now();
      return parsed.slice(0, context.count).map((item: any, index: number) => {
        const answerType = String(item.answerType || preferred) as AssessmentAnswerType;
        const normalizedOptions = Array.isArray(item.options)
          ? item.options.map((opt: any) => String(opt))
          : undefined;
        const normalizedAnswer = answerType === 'multiple-choice'
          ? (Array.isArray(item.correctAnswer)
              ? item.correctAnswer.map((ans: any) => String(ans))
              : (normalizedOptions ?? []).filter((opt) => opt === String(item.correctAnswer)))
          : String(item.correctAnswer ?? '');

        return {
          id: String(item.id || `assessment-ai-${timestamp}-${index + 1}`),
          prompt: String(item.prompt || 'Assessment question'),
          answerType,
          options: answerType === 'short-text' ? undefined : normalizedOptions,
          correctAnswer: normalizedAnswer,
          explanation: String(item.explanation || 'Review the concept and eliminate distractors carefully.'),
          tags: Array.isArray(item.tags) && item.tags.length ? item.tags.map((tag: any) => String(tag)) : [topicLabels[context.topic]],
          estimatedTime: Number.isFinite(item.estimatedTime) ? Math.max(1, Math.min(6, Number(item.estimatedTime))) : 4
        };
      });
    } catch (error) {
      console.error('Gemini assessment question generation failed:', error);
      throw error;
    }
  }

  async generateAssessmentFeedback(context: GenerateAssessmentFeedbackContext): Promise<AssessmentSummary> {
    const trackLabels: Record<AssessmentTrack, string> = {
      'soft-skills': 'soft skills aptitude readiness',
      'technical-skills': 'technical fundamentals readiness'
    };

    const topicLabels: Record<AssessmentTopic, string> = {
      quant: 'quantitative aptitude',
      verbal: 'verbal ability',
      aptitude: 'logical aptitude',
      coding: 'coding fundamentals',
      cloud: 'cloud computing and DevOps',
      dbms: 'database management systems',
      'operating-systems': 'operating systems',
      networks: 'computer networks',
      'system-design': 'system design'
    };

    const difficultyLabels: Record<AssessmentDifficulty, string> = {
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced'
    };

    const formattedResults = context.results
      .map((result, idx) => {
        const userAnswer = Array.isArray(result.userAnswer) ? result.userAnswer.join(', ') : result.userAnswer;
        const correctAnswer = Array.isArray(result.correctAnswer) ? result.correctAnswer.join(', ') : result.correctAnswer;
        return `Q${idx + 1}: ${result.prompt}\nChosen: ${userAnswer}\nCorrect: ${correctAnswer}\nCorrect? ${result.isCorrect ? 'Yes' : 'No'}\nExplanation: ${result.explanation}`;
      })
      .join('\n\n');

    const prompt = `You are an interview analytics coach summarising a ${trackLabels[context.track]} report.

Candidate focus area: ${topicLabels[context.topic]}
Difficulty: ${difficultyLabels[context.difficulty]}
Overall accuracy: ${(context.accuracy * 100).toFixed(1)}%

Provide feedback in this exact structure with 2-3 bullets per section (max 16 words per bullet):

STRENGTHS:
- ...

WEAKNESSES:
- ...

IMPROVEMENTS:
- ...

SUGGESTIONS:
- ...

Be concise, supportive, and concept focused.

Assessment outcomes:
${formattedResults}`;

    try {
      const text = await this.generateText(prompt);
      const parsed = this.parseFeedbackResponse(text);
      if (
        parsed.strengths.length === 0 &&
        parsed.weaknesses.length === 0 &&
        parsed.improvements.length === 0 &&
        parsed.suggestions.length === 0
      ) {
        throw new Error('Gemini assessment feedback returned empty sections');
      }
      return {
        strengths: parsed.strengths,
        opportunities: parsed.weaknesses,
        improvements: parsed.improvements,
        suggestions: parsed.suggestions
      };
    } catch (error) {
      console.error('Gemini assessment feedback failed:', error);
      throw error;
    }
  }

  private buildInterviewPrompt(context: GenerateInterviewerResponseContext): string {
    const { question, questionType, difficulty, company, role, candidateAnswer, conversationHistory, currentPhase, performance, strengths, weaknesses } = context;
    let base = `You are an AI interviewer conducting a ${difficulty} level ${role} interview${company ? ` at ${company}` : ''}.

Current question: ${question}
Question type: ${questionType}
Current phase: ${currentPhase}`;

    if (candidateAnswer) {
      base += `\n\nCandidate's answer: ${candidateAnswer}`;
    }

    const history = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
    base += `\n\nConversation history:\n${history}`;

    if (typeof performance === 'number') {
      base += `\n\nRecent performance score: ${performance}/100`;
    }
    if (Array.isArray(strengths) && strengths.length) {
      base += `\nStrengths observed: ${strengths.join(', ')}`;
    }
    if (Array.isArray(weaknesses) && weaknesses.length) {
      base += `\nAreas to probe: ${weaknesses.join(', ')}`;
    }

    if (candidateAnswer) {
      base += `\n\nBased on the candidate's answer, provide a natural follow-up response that:
  1. Acknowledges their answer
  2. Asks a clarifying question or transitions smoothly
  3. Maintains a professional but conversational tone
  4. Keeps the interview flowing naturally
  5. Adjusts depth using performance (offer hints if low, dig deeper if high).`;
    } else {
      base += `\n\nProvide a natural introduction to this question that:
  1. Presents the question clearly
  2. Sets relevant context
  3. Encourages the candidate to think out loud
  4. Maintains a supportive tone
  5. Calibrates difficulty using performance if provided.`;
    }

    // For coding/DSA questions: include explicit I/O format guidance for HackerEarth-style STDIN/STDOUT
    if (/^(coding|dsa)$/i.test(String(questionType))) {
      base += `\n\nAdditionally, include two short sections in your response:\n\nInput Format:\n- Spell out, line-by-line, what the candidate should read from STDIN. For example:\n  - Line 1: integer n (array length)\n  - Line 2: n space-separated integers (the array)\n  - Line 3: integer k (window size)\n\nOutput Format:\n- Describe exactly what to print to STDOUT (no extra labels or punctuation; trim whitespace).`;
    }

    return base;
  }

  private buildFollowUpPrompt(context: GenerateFollowUpQuestionContext): string {
    const { originalQuestion, questionType, candidateAnswer, difficulty, company, role } = context;
    return `You are an AI interviewer conducting a ${difficulty} level ${role} interview${company ? ` at ${company}` : ''}.

Original question: ${originalQuestion}
Question type: ${questionType}
Candidate's answer: ${candidateAnswer}

Generate a thoughtful follow-up question that:
1. Builds on their answer
2. Tests deeper understanding
3. Fits ${difficulty} level
4. Maintains interview flow
5. Is specific to ${questionType} questions

Keep it concise and natural.`;
  }

  private buildFeedbackPrompt(context: GenerateFeedbackContext): string {
    const { question, questionType, candidateAnswer, code, language, difficulty, timeSpent } = context;
    let prompt = `You are an AI interviewer providing feedback for a ${difficulty} level ${questionType} question.

Question: ${question}
Candidate's answer: ${candidateAnswer}`;

    if (code && language) {
      prompt += `\n\nCode submitted (${language}):\n${code}`;
    }

    prompt += `\n\nTime spent: ${timeSpent} seconds

Provide structured feedback in this exact format:

STRENGTHS:
- [List 2-3 specific strengths]

WEAKNESSES:
- [List 2-3 specific areas for improvement]

IMPROVEMENTS:
- [List 2-3 specific actionable improvements]

SUGGESTIONS:
- [List 2-3 specific next steps]`;

    return prompt;
  }

  private parseFeedbackResponse(text: string): FeedbackSections {
    const lines = text.split('\n');
    const result: FeedbackSections = {
      strengths: [],
      weaknesses: [],
      improvements: [],
      suggestions: []
    };

    let current: keyof FeedbackSections | '' = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('STRENGTHS:')) {
        current = 'strengths';
      } else if (trimmed.startsWith('WEAKNESSES:')) {
        current = 'weaknesses';
      } else if (trimmed.startsWith('IMPROVEMENTS:')) {
        current = 'improvements';
      } else if (trimmed.startsWith('SUGGESTIONS:')) {
        current = 'suggestions';
      } else if (trimmed.startsWith('- ') && current) {
        result[current].push(trimmed.substring(2));
      }
    }

    return result;
  }

  private getFallbackResponse(context: GenerateInterviewerResponseContext): string {
    if (context.candidateAnswer) {
      return "Thank you for your answer. Let's move on to the next question.";
    }
    return `Let's discuss this ${context.questionType} question: ${context.question}`;
  }

  private getFallbackFollowUp(): string {
    return 'Can you elaborate on that approach? What would you do differently?';
  }

  private getFallbackFeedback(): PracticeAIResponse {
    return {
      strengths: ['Good attempt at the problem'],
      weaknesses: ['Add more detail to explanations'],
      improvements: ['Practice explaining your thought process'],
      suggestions: ['Continue practicing similar problems']
    };
  }
}
