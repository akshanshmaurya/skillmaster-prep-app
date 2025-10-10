import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use a currently supported model identifier
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Generate AI interviewer response based on context
   */
  async generateInterviewerResponse(
    context: {
      question: string;
      questionType: 'dsa' | 'system-design' | 'behavioral' | 'coding';
      difficulty: 'easy' | 'medium' | 'hard';
      company: string;
      role: string;
      candidateAnswer?: string;
      conversationHistory: Array<{ role: 'interviewer' | 'candidate'; content: string }>;
      currentPhase: 'intro' | 'technical' | 'behavioral' | 'system-design' | 'questions';
      performance?: number;
      strengths?: string[];
      weaknesses?: string[];
    }
  ): Promise<string> {
    const prompt = this.buildInterviewPrompt(context);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini AI error:', error);
      return this.getFallbackResponse(context);
    }
  }

  /**
   * Generate follow-up questions based on candidate's answer
   */
  async generateFollowUpQuestion(
    context: {
      originalQuestion: string;
      questionType: 'dsa' | 'system-design' | 'behavioral' | 'coding';
      candidateAnswer: string;
      difficulty: 'easy' | 'medium' | 'hard';
      company: string;
      role: string;
    }
  ): Promise<string> {
    const prompt = this.buildFollowUpPrompt(context);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini AI follow-up error:', error);
      return this.getFallbackFollowUp(context);
    }
  }

  /**
   * Generate AI feedback for candidate's answer
   */
  async generateFeedback(
    context: {
      question: string;
      questionType: 'dsa' | 'system-design' | 'behavioral' | 'coding';
      candidateAnswer: string;
      code?: string;
      language?: string;
      difficulty: 'easy' | 'medium' | 'hard';
      timeSpent: number;
    }
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    suggestions: string[];
  }> {
    const prompt = this.buildFeedbackPrompt(context);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response to extract structured feedback
      return this.parseFeedbackResponse(text);
    } catch (error) {
      console.error('Gemini AI feedback error:', error);
      return this.getFallbackFeedback();
    }
  }

  /**
   * Generate interview introduction
   */
  async generateInterviewIntroduction(
    context: {
      company: string;
      role: string;
      experienceLevel: string;
      interviewType: string;
    }
  ): Promise<string> {
    const prompt = `You are an AI interviewer conducting a ${context.experienceLevel} level ${context.role} interview at ${context.company}. 
    
    Generate a professional and welcoming introduction that:
    1. Welcomes the candidate
    2. Introduces yourself as the AI interviewer
    3. Explains the interview format (${context.interviewType})
    4. Sets expectations for the session
    5. Asks them to introduce themselves
    
    Keep it concise (2-3 sentences) and professional.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini AI introduction error:', error);
      return `Hello! Welcome to your ${context.company} ${context.role} interview. I'm your AI interviewer today. Let's start with a brief introduction - tell me about yourself and your background in software development.`;
    }
  }

  /**
   * Generate structured interview questions when DB has none
   */
  async generateStructuredQuestions(
    context: {
      company?: string;
      role: string;
      interviewType: 'technical' | 'system-design' | 'behavioral' | 'mixed';
      difficulty?: 'easy' | 'medium' | 'hard';
      count: number;
    }
  ): Promise<Array<{
    id: string;
    title: string;
    description: string;
    type: 'dsa' | 'system-design' | 'behavioral' | 'coding';
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    tags: string[];
    companies: string[];
    roles: string[];
    purpose?: 'technical' | 'coding' | 'system-design' | 'behavioral';
    source?: 'seed' | 'ai';
    timeLimit?: number;
  }>> {
    const mapTypes: Record<string, string[]> = {
      technical: ['dsa', 'coding'],
      'system-design': ['system-design'],
      behavioral: ['behavioral'],
      mixed: ['dsa', 'coding', 'system-design', 'behavioral']
    };

    const allowedTypes = mapTypes[context.interviewType];
    const prompt = `Generate ${context.count} ${context.difficulty || 'medium'} difficulty interview questions for a ${context.role} role${context.company ? ' at ' + context.company : ''}.

Return JSON ONLY, NO prose, as an array where each item has exactly these fields:
id, title, description, type, difficulty, category, tags, companies, roles, timeLimit, testCases.

testCases MUST be exactly 5 items per question: first 3 are simple sanity tests, last 2 are edge cases. Each test case has fields: input (string), expectedOutput (string), explanation (string).

Rules:
- type must be one of: dsa, system-design, behavioral, coding
- Prefer types in [${allowedTypes.join(', ')}]
- difficulty must be one of: easy, medium, hard
- companies should include ${context.company || 'common tech companies'}
- roles should include ${context.role}
- timeLimit is an integer minutes between 5 and 60.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Invalid AI format');
      const timestamp = Date.now();
      return parsed.map((q: any, i: number) => ({
        id: q.id || `ai-${timestamp}-${i + 1}`,
        title: q.title,
        description: q.description,
        type: q.type,
        difficulty: q.difficulty || (context.difficulty || 'medium'),
        category: q.category || 'general',
        tags: Array.isArray(q.tags) ? q.tags : [],
        companies: Array.isArray(q.companies) ? q.companies : (context.company ? [context.company] : []),
        roles: Array.isArray(q.roles) ? q.roles : [context.role],
        purpose: q.purpose || (q.type === 'behavioral' ? 'behavioral' : q.type === 'system-design' ? 'system-design' : q.type === 'coding' ? 'coding' : 'technical'),
        source: 'ai',
        timeLimit: typeof q.timeLimit === 'number' ? q.timeLimit : 30
      }));
    } catch (error) {
      // Fallback: synthesize simple placeholders
      const timestamp = Date.now();
      const types = allowedTypes;
      return Array.from({ length: context.count }).map((_, i) => {
        const t = types[i % types.length] as any;
        return {
          id: `ai-${timestamp}-${i + 1}`,
          title: t === 'system-design' ? 'Design a URL Shortener' : t === 'behavioral' ? 'Tell me about a challenging project' : 'Two Sum',
          description: t === 'system-design'
            ? 'Discuss requirements, high-level design, data model, scaling, and trade-offs.'
            : t === 'behavioral'
            ? 'Describe a challenging project, your approach, and the outcome.'
            : 'Given an array and a target, return indices of two numbers adding to target.',
          type: t,
          difficulty: (context.difficulty || 'medium') as any,
          category: t === 'behavioral' ? 'communication' : t === 'system-design' ? 'architecture' : 'arrays',
          tags: t === 'system-design' ? ['design'] : ['practice'],
          companies: context.company ? [context.company] : ['google', 'amazon'],
          roles: [context.role],
          purpose: t === 'behavioral' ? 'behavioral' : t === 'system-design' ? 'system-design' : t === 'coding' ? 'coding' : 'technical',
          source: 'ai',
          timeLimit: 30
        };
      });
    }
  }

  /**
   * Build interview prompt based on context
   */
  private buildInterviewPrompt(context: any): string {
    const { question, questionType, difficulty, company, role, candidateAnswer, conversationHistory, currentPhase, performance, strengths, weaknesses } = context;
    
    let basePrompt = `You are an AI interviewer conducting a ${difficulty} level ${role} interview at ${company}. 
    
    Current question: ${question}
    Question type: ${questionType}
    Current phase: ${currentPhase}`;

    if (candidateAnswer) {
      basePrompt += `\n\nCandidate's answer: ${candidateAnswer}`;
    }

    basePrompt += `\n\nConversation history:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

    if (typeof performance === 'number') {
      basePrompt += `\n\nRecent performance score: ${performance}/100`;
    }
    if (Array.isArray(strengths) && strengths.length) {
      basePrompt += `\nStrengths observed: ${strengths.join(', ')}`;
    }
    if (Array.isArray(weaknesses) && weaknesses.length) {
      basePrompt += `\nAreas to probe/improve: ${weaknesses.join(', ')}`;
    }

    if (candidateAnswer) {
      basePrompt += `\n\nBased on the candidate's answer, provide a natural follow-up response that:
      1. Acknowledges their answer
      2. Asks a clarifying question or moves to the next topic
      3. Maintains a professional but conversational tone
      4. Keeps the interview flowing naturally
      5. Personalize difficulty: if performance is high, increase depth; if low, offer hints.`;
    } else {
      basePrompt += `\n\nProvide a natural introduction to this question that:
      1. Introduces the question clearly
      2. Sets appropriate context
      3. Encourages the candidate to think out loud
      4. Maintains a professional but supportive tone
      5. Calibrate to candidate level using performance if provided.`;
    }

    return basePrompt;
  }

  /**
   * Build follow-up question prompt
   */
  private buildFollowUpPrompt(context: any): string {
    const { originalQuestion, questionType, candidateAnswer, difficulty, company, role } = context;
    
    return `You are an AI interviewer conducting a ${difficulty} level ${role} interview at ${company}.
    
    Original question: ${originalQuestion}
    Question type: ${questionType}
    Candidate's answer: ${candidateAnswer}
    
    Generate a thoughtful follow-up question that:
    1. Builds on their answer
    2. Tests deeper understanding
    3. Is appropriate for ${difficulty} level
    4. Maintains interview flow
    5. Is specific to ${questionType} questions
    
    Keep it concise and natural.`;
  }

  /**
   * Build feedback prompt
   */
  private buildFeedbackPrompt(context: any): string {
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
    - [List 2-3 specific suggestions for next steps]`;

    return prompt;
  }

  /**
   * Parse feedback response into structured format
   */
  private parseFeedbackResponse(text: string): {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    suggestions: string[];
  } {
    const lines = text.split('\n');
    const result = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      improvements: [] as string[],
      suggestions: [] as string[]
    };

    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('STRENGTHS:')) {
        currentSection = 'strengths';
      } else if (trimmed.startsWith('WEAKNESSES:')) {
        currentSection = 'weaknesses';
      } else if (trimmed.startsWith('IMPROVEMENTS:')) {
        currentSection = 'improvements';
      } else if (trimmed.startsWith('SUGGESTIONS:')) {
        currentSection = 'suggestions';
      } else if (trimmed.startsWith('- ') && currentSection) {
        result[currentSection as keyof typeof result].push(trimmed.substring(2));
      }
    }

    return result;
  }

  /**
   * Get fallback response when AI fails
   */
  private getFallbackResponse(context: any): string {
    if (context.candidateAnswer) {
      return "Thank you for that answer. Let's move on to the next question.";
    } else {
      return `Let's discuss this ${context.questionType} question: ${context.question}`;
    }
  }

  /**
   * Get fallback follow-up when AI fails
   */
  private getFallbackFollowUp(context: any): string {
    return "Can you elaborate on that approach? What would you do differently?";
  }

  /**
   * Get fallback feedback when AI fails
   */
  private getFallbackFeedback(): {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    suggestions: string[];
  } {
    return {
      strengths: ['Good attempt at the problem'],
      weaknesses: ['Could use more detail in explanation'],
      improvements: ['Practice explaining your thought process'],
      suggestions: ['Continue practicing similar problems']
    };
  }
}
