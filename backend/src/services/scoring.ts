import { QuestionEvaluation, InterviewScore } from '../models/Interview';

export class ScoringService {
  /**
   * Evaluate a single question response
   */
  static evaluateQuestion(
    questionId: string,
    response: string,
    code?: string,
    language?: string,
    executionResult?: any,
    timeSpent: number = 0,
    hintsUsed: number = 0
  ): QuestionEvaluation {
    // Base scores (will be adjusted based on response quality)
    let scores = {
      correctness: 0,
      efficiency: 0,
      clarity: 0,
      communication: 0,
      edgeCases: 0
    };

    let feedback = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      improvements: [] as string[],
      suggestions: [] as string[]
    };

    // Evaluate correctness based on execution results
    if (executionResult) {
      const passed = executionResult.testCasesPassed || 0;
      const total = executionResult.totalTestCases || 0;
      if (executionResult.success) {
        // Require at least 5 tests and passing >= 5 to be considered cleared
        const cleared = total >= 5 && passed >= 5;
        scores.correctness = cleared ? 40 : Math.min(35, 20 + (passed / Math.max(1, total)) * 15);
        if (cleared) {
          feedback.strengths.push('All required tests passed (including edge cases)');
        } else {
          feedback.weaknesses.push('Did not pass all required tests');
          feedback.improvements.push('Handle edge cases and ensure all tests pass');
        }
      } else {
        scores.correctness = Math.max(0, 15 - (executionResult.error ? 10 : 5));
        feedback.weaknesses.push('Code has execution errors');
        feedback.improvements.push('Debug and fix compilation/runtime errors');
      }
    } else {
      // For non-coding questions, evaluate based on response content
      scores.correctness = this.evaluateResponseCorrectness(response);
    }

    // Evaluate efficiency (time and space complexity)
    if (code) {
      scores.efficiency = this.evaluateCodeEfficiency(code, language);
    } else {
      scores.efficiency = this.evaluateResponseEfficiency(response);
    }

    // Evaluate clarity of explanation
    scores.clarity = this.evaluateClarity(response);

    // Evaluate communication skills
    scores.communication = this.evaluateCommunication(response);

    // Evaluate edge case handling
    scores.edgeCases = this.evaluateEdgeCaseHandling(response, code);

    // Calculate total score
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    // Generate feedback based on scores
    this.generateFeedback(scores, feedback, timeSpent, hintsUsed);

    return {
      questionId,
      scores,
      totalScore,
      feedback,
      timeSpent,
      hintsUsed
    };
  }

  /**
   * Calculate overall interview score from individual question evaluations
   */
  static calculateInterviewScore(evaluations: QuestionEvaluation[]): InterviewScore {
    if (evaluations.length === 0) {
      return this.getDefaultScore();
    }

    // Calculate average scores
    const avgCorrectness = evaluations.reduce((sum, evaluation) => sum + evaluation.scores.correctness, 0) / evaluations.length;
    const avgEfficiency = evaluations.reduce((sum, evaluation) => sum + evaluation.scores.efficiency, 0) / evaluations.length;
    const avgClarity = evaluations.reduce((sum, evaluation) => sum + evaluation.scores.clarity, 0) / evaluations.length;
    const avgCommunication = evaluations.reduce((sum, evaluation) => sum + evaluation.scores.communication, 0) / evaluations.length;
    const avgEdgeCases = evaluations.reduce((sum, evaluation) => sum + evaluation.scores.edgeCases, 0) / evaluations.length;

    // Calculate overall scores
    const technical = (avgCorrectness + avgEfficiency + avgEdgeCases) / 3;
    const behavioral = avgCommunication;
    const systemDesign = avgCorrectness; // For system design questions
    const communication = avgClarity;
    const problemSolving = (avgCorrectness + avgEfficiency) / 2;
    const timeManagement = this.calculateTimeManagementScore(evaluations);
    const confidence = this.calculateConfidenceScore(evaluations);

    const overall = (technical + behavioral + systemDesign + communication + problemSolving + timeManagement + confidence) / 7;

    // Calculate topic breakdown
    const breakdown = this.calculateTopicBreakdown(evaluations);

    // Generate feedback
    const feedback = this.generateOverallFeedback(evaluations, {
      technical,
      behavioral,
      systemDesign,
      communication,
      problemSolving,
      timeManagement,
      confidence
    });

    return {
      overall: Math.round(overall),
      technical: Math.round(technical),
      behavioral: Math.round(behavioral),
      systemDesign: Math.round(systemDesign),
      communication: Math.round(communication),
      problemSolving: Math.round(problemSolving),
      timeManagement: Math.round(timeManagement),
      confidence: Math.round(confidence),
      breakdown,
      feedback
    };
  }

  /**
   * Evaluate response correctness for non-coding questions
   */
  private static evaluateResponseCorrectness(response: string): number {
    const keywords = ['correct', 'right', 'accurate', 'valid', 'proper'];
    const hasKeywords = keywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    );
    
    const length = response.length;
    const hasExplanation = response.includes('because') || response.includes('since') || response.includes('due to');
    
    let score = 20; // Base score
    
    if (hasKeywords) score += 10;
    if (hasExplanation) score += 10;
    if (length > 100) score += 5;
    if (length > 200) score += 5;
    
    return Math.min(40, score);
  }

  /**
   * Evaluate code efficiency
   */
  private static evaluateCodeEfficiency(code: string, language?: string): number {
    let score = 10; // Base score
    
    // Check for efficient algorithms
    const efficientPatterns = [
      /hashmap|hash map|hash table/i,
      /binary search/i,
      /two pointer/i,
      /sliding window/i,
      /dynamic programming|dp/i,
      /memoization/i
    ];
    
    const hasEfficientPatterns = efficientPatterns.some(pattern => pattern.test(code));
    if (hasEfficientPatterns) score += 10;
    
    // Check for complexity comments
    if (code.includes('O(') || code.includes('time complexity') || code.includes('space complexity')) {
      score += 5;
    }
    
    // Check for optimization attempts
    if (code.includes('optimize') || code.includes('improve') || code.includes('better')) {
      score += 5;
    }
    
    return Math.min(20, score);
  }

  /**
   * Evaluate response efficiency
   */
  private static evaluateResponseEfficiency(response: string): number {
    let score = 10;
    
    if (response.includes('O(') || response.includes('time complexity')) score += 5;
    if (response.includes('space complexity')) score += 3;
    if (response.includes('optimize') || response.includes('efficient')) score += 2;
    
    return Math.min(20, score);
  }

  /**
   * Evaluate clarity of explanation
   */
  private static evaluateClarity(response: string): number {
    let score = 10;
    
    const clarityIndicators = [
      response.length > 50, // Sufficient length
      response.includes('step'), // Step-by-step explanation
      response.includes('first') || response.includes('then') || response.includes('finally'), // Sequential thinking
      response.includes('example'), // Examples provided
      response.includes('let me'), // Clear communication
    ];
    
    score += clarityIndicators.filter(Boolean).length * 2;
    
    return Math.min(20, score);
  }

  /**
   * Evaluate communication skills
   */
  private static evaluateCommunication(response: string): number {
    let score = 5;
    
    const communicationIndicators = [
      response.length > 20, // Not too brief
      response.includes('I think') || response.includes('I believe'), // Personal engagement
      response.includes('?'), // Asking questions
      response.includes('let me explain') || response.includes('let me clarify'), // Clear intent
    ];
    
    score += communicationIndicators.filter(Boolean).length * 1.25;
    
    return Math.min(10, score);
  }

  /**
   * Evaluate edge case handling
   */
  private static evaluateEdgeCaseHandling(response: string, code?: string): number {
    let score = 5;
    
    const edgeCaseKeywords = [
      'edge case', 'corner case', 'boundary', 'null', 'empty', 'zero',
      'negative', 'overflow', 'underflow', 'invalid input'
    ];
    
    const hasEdgeCaseMention = edgeCaseKeywords.some(keyword => 
      response.toLowerCase().includes(keyword) || (code && code.toLowerCase().includes(keyword))
    );
    
    if (hasEdgeCaseMention) score += 5;
    
    return Math.min(10, score);
  }

  /**
   * Calculate time management score
   */
  private static calculateTimeManagementScore(evaluations: QuestionEvaluation[]): number {
    const avgTimePerQuestion = evaluations.reduce((sum, evaluation) => sum + evaluation.timeSpent, 0) / evaluations.length;
    const expectedTimePerQuestion = 300; // 5 minutes per question
    
    if (avgTimePerQuestion <= expectedTimePerQuestion) return 100;
    if (avgTimePerQuestion <= expectedTimePerQuestion * 1.5) return 80;
    if (avgTimePerQuestion <= expectedTimePerQuestion * 2) return 60;
    return 40;
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidenceScore(evaluations: QuestionEvaluation[]): number {
    const avgScore = evaluations.reduce((sum, evaluation) => sum + evaluation.totalScore, 0) / evaluations.length;
    const hintsUsed = evaluations.reduce((sum, evaluation) => sum + evaluation.hintsUsed, 0);
    
    let confidence = avgScore;
    
    // Reduce confidence for excessive hint usage
    if (hintsUsed > evaluations.length * 0.5) {
      confidence -= 20;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Calculate topic breakdown
   */
  private static calculateTopicBreakdown(evaluations: QuestionEvaluation[]): any {
    // This would be more sophisticated in a real implementation
    // For now, return a basic breakdown
    return {
      dsa: 75,
      algorithms: 80,
      dataStructures: 70,
      systemDesign: 65,
      behavioral: 85,
      coding: 75
    };
  }

  /**
   * Generate feedback based on scores
   */
  private static generateFeedback(scores: any, feedback: any, timeSpent: number, hintsUsed: number): void {
    // Strengths
    if (scores.correctness >= 35) feedback.strengths.push('Strong problem-solving skills');
    if (scores.efficiency >= 15) feedback.strengths.push('Good algorithmic thinking');
    if (scores.clarity >= 15) feedback.strengths.push('Clear communication');
    if (scores.communication >= 8) feedback.strengths.push('Good interpersonal skills');
    if (scores.edgeCases >= 8) feedback.strengths.push('Thorough consideration of edge cases');

    // Weaknesses
    if (scores.correctness < 25) feedback.weaknesses.push('Needs improvement in problem-solving');
    if (scores.efficiency < 10) feedback.weaknesses.push('Consider optimizing time/space complexity');
    if (scores.clarity < 10) feedback.weaknesses.push('Work on explaining your thought process');
    if (scores.communication < 5) feedback.weaknesses.push('Practice articulating your ideas');
    if (scores.edgeCases < 5) feedback.weaknesses.push('Consider more edge cases');

    // Improvements
    if (timeSpent > 600) feedback.improvements.push('Work on time management');
    if (hintsUsed > 2) feedback.improvements.push('Try to solve problems independently first');
    if (scores.correctness < 30) feedback.improvements.push('Practice more coding problems');
    if (scores.clarity < 15) feedback.improvements.push('Practice explaining your approach out loud');

    // Suggestions
    feedback.suggestions.push('Practice regularly to improve consistency');
    feedback.suggestions.push('Review data structures and algorithms');
    feedback.suggestions.push('Practice explaining your thought process');
  }

  /**
   * Generate overall feedback
   */
  private static generateOverallFeedback(evaluations: QuestionEvaluation[], scores: any): any {
    const feedback = {
      overall: '',
      technical: '',
      behavioral: '',
      systemDesign: '',
      recommendations: [] as string[]
    };

    // Overall feedback
    if (scores.overall >= 80) {
      feedback.overall = 'Excellent performance! You demonstrated strong technical skills and clear communication.';
    } else if (scores.overall >= 70) {
      feedback.overall = 'Good performance with room for improvement in specific areas.';
    } else if (scores.overall >= 60) {
      feedback.overall = 'Satisfactory performance. Focus on strengthening your technical fundamentals.';
    } else {
      feedback.overall = 'Needs improvement. Consider more practice and preparation.';
    }

    // Technical feedback
    if (scores.technical >= 75) {
      feedback.technical = 'Strong technical foundation with good problem-solving approach.';
    } else {
      feedback.technical = 'Focus on strengthening technical fundamentals and algorithmic thinking.';
    }

    // Behavioral feedback
    if (scores.behavioral >= 80) {
      feedback.behavioral = 'Excellent communication and interpersonal skills.';
    } else {
      feedback.behavioral = 'Work on improving communication clarity and confidence.';
    }

    // System design feedback
    if (scores.systemDesign >= 70) {
      feedback.systemDesign = 'Good understanding of system design principles.';
    } else {
      feedback.systemDesign = 'Focus on learning system design patterns and scalability concepts.';
    }

    // Recommendations
    feedback.recommendations.push('Continue practicing coding problems daily');
    feedback.recommendations.push('Review system design fundamentals');
    feedback.recommendations.push('Practice explaining your solutions out loud');
    feedback.recommendations.push('Work on time management during interviews');

    return feedback;
  }

  /**
   * Get default score for new sessions
   */
  private static getDefaultScore(): InterviewScore {
    return {
      overall: 0,
      technical: 0,
      behavioral: 0,
      systemDesign: 0,
      communication: 0,
      problemSolving: 0,
      timeManagement: 0,
      confidence: 0,
      breakdown: {
        dsa: 0,
        algorithms: 0,
        dataStructures: 0,
        systemDesign: 0,
        behavioral: 0,
        coding: 0
      },
      feedback: {
        overall: 'No evaluations yet',
        technical: 'Start your interview to get technical feedback',
        behavioral: 'Start your interview to get behavioral feedback',
        systemDesign: 'Start your interview to get system design feedback',
        recommendations: ['Complete an interview to get personalized recommendations']
      }
    };
  }
}
