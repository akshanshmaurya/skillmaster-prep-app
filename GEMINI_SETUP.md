# AI Interview Simulator - Gemini Setup Guide

## 🚀 Quick Start

### 1. Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   PORT=5000
   ```

3. **Get Gemini API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Create a new project
   - Generate an API key
   - Add it to your `.env` file

4. **Start Backend**
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🎯 Features Implemented

### ✅ AI Interviewer (Gemini Integration)
- **Dynamic Conversations**: AI generates contextual responses based on interview context
- **Follow-up Questions**: Intelligent follow-up questions based on candidate answers
- **Realistic Interaction**: Natural conversation flow with professional tone
- **Context Awareness**: Remembers conversation history and adapts accordingly

### ✅ Code Execution System
- **Monaco Editor**: Professional code editor with syntax highlighting
- **Multi-language Support**: JavaScript, Python, Java, C++, C#, Go, Rust
- **Real-time Execution**: Execute code and see results instantly
- **Test Case Support**: Automatic test case execution and validation
- **Sandboxed Environment**: Safe code execution with timeouts

### ✅ Advanced Evaluation System
- **Multi-dimensional Scoring**: Technical, behavioral, and system design evaluation
- **AI-Enhanced Feedback**: Gemini-powered detailed feedback generation
- **Real-time Analysis**: Live performance tracking during interviews
- **Comprehensive Metrics**: Time management, confidence, and skill assessment

### ✅ Interview Management
- **Session Tracking**: Complete interview session management
- **Progress Monitoring**: Real-time progress tracking and analytics
- **Question Bank**: Curated questions for different roles and companies
- **Profile Management**: User profile setup with preferences

## 🔧 Configuration

### Gemini AI Configuration

The AI interviewer is configured in `backend/src/services/geminiAI.ts`:

```typescript
// Model configuration
this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Customize prompts for different interview types
private buildInterviewPrompt(context: any): string {
  // Customize based on your needs
}
```

### Code Execution Configuration

Code execution is configured in `backend/src/services/codeExecution.ts`:

```typescript
// Supported languages
const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  // ... more languages
];

// Execution timeout (10 seconds)
timeout: 10000
```

## 📊 Usage Examples

### 1. Starting an Interview

```typescript
// Frontend API call
const sessionResponse = await interviewSessionApi.createSession({
  profile: {
    role: 'Software Engineer',
    experienceLevel: 'mid-level',
    targetCompany: 'Google',
    preferredLanguage: 'JavaScript',
    interviewType: 'technical'
  },
  questionCount: 5
});
```

### 2. Getting AI Response

```typescript
// Get AI interviewer response
const aiResponse = await messagesApi.getAIResponse(sessionId, {
  question: "Explain the difference between let and const in JavaScript",
  questionType: "dsa",
  difficulty: "medium",
  company: "Google",
  role: "Software Engineer",
  candidateAnswer: "let allows reassignment, const doesn't",
  currentPhase: "technical"
});
```

### 3. Code Execution

```typescript
// Execute code
const result = await codeExecutionApi.executeCode({
  code: "function solution(n) { return n * 2; }",
  language: "javascript",
  testCases: [
    { input: "5", expectedOutput: "10" },
    { input: "3", expectedOutput: "6" }
  ]
});
```

## 🎨 Customization

### Custom Interview Prompts

Modify `backend/src/services/geminiAI.ts` to customize AI behavior:

```typescript
private buildInterviewPrompt(context: any): string {
  // Add your custom prompt logic here
  const basePrompt = `You are an AI interviewer conducting a ${context.difficulty} level ${context.role} interview at ${context.company}.`;
  
  // Customize based on company culture, role requirements, etc.
  if (context.company === 'Google') {
    basePrompt += '\nFocus on algorithmic thinking and system design.';
  }
  
  return basePrompt;
}
```

### Custom Scoring Criteria

Modify `backend/src/services/scoring.ts` to adjust evaluation criteria:

```typescript
static evaluateQuestion(
  questionId: string,
  response: string,
  code?: string,
  language?: string,
  executionResult?: any,
  timeSpent?: number,
  hintsUsed?: number
): QuestionEvaluation {
  // Customize scoring logic
  const scores = {
    correctness: this.evaluateResponseCorrectness(response),
    efficiency: code ? this.evaluateCodeEfficiency(code, language) : this.evaluateResponseEfficiency(response),
    clarity: this.evaluateClarity(response),
    communication: this.evaluateCommunication(response),
    edgeCases: this.evaluateEdgeCaseHandling(response, code)
  };
  
  // Add custom scoring criteria
  return {
    scores,
    totalScore: this.calculateTotalScore(scores),
    feedback: this.generateFeedback(scores, response),
    timeSpent: timeSpent || 0,
    hintsUsed: hintsUsed || 0
  };
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Gemini API Key Not Working**
   - Verify API key is correct
   - Check API key permissions
   - Ensure billing is enabled

2. **Code Execution Failing**
   - Verify language compilers are installed
   - Check file permissions in temp directory
   - Review execution timeout settings

3. **MongoDB Connection Issues**
   - Verify MongoDB URI is correct
   - Check network connectivity
   - Ensure MongoDB is running

### Debug Mode

Enable debug logging:

```typescript
// In backend/src/services/geminiAI.ts
console.log('Gemini AI request:', prompt);
console.log('Gemini AI response:', response.text());
```

## 📈 Performance Optimization

### Gemini API Optimization

1. **Rate Limiting**: Implement rate limiting to avoid API limits
2. **Caching**: Cache common responses to reduce API calls
3. **Prompt Optimization**: Keep prompts concise but informative

### Code Execution Optimization

1. **Resource Limits**: Set appropriate memory and CPU limits
2. **Cleanup**: Ensure temporary files are cleaned up
3. **Timeout Management**: Set reasonable timeouts for different languages

## 🔒 Security Considerations

1. **API Key Security**: Never commit API keys to version control
2. **Code Execution**: Sandboxed environment prevents malicious code execution
3. **Input Validation**: Validate all user inputs before processing
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## 📚 API Documentation

### Backend Endpoints

- `POST /api/interview/profile` - Create/update user profile
- `GET /api/interview/profile` - Get user profile
- `POST /api/interview/sessions` - Create interview session
- `POST /api/interview/sessions/:id/ai-response` - Get AI response
- `POST /api/interview/sessions/:id/answer` - Submit answer
- `POST /api/interview/execute-code` - Execute code
- `GET /api/interview/analytics` - Get analytics

### Frontend API

- `interviewProfileApi` - Profile management
- `interviewSessionApi` - Session management
- `messagesApi` - AI responses and messaging
- `codeExecutionApi` - Code execution
- `analyticsApi` - Analytics and reporting

## 🎉 Next Steps

1. **Customize Prompts**: Adapt AI prompts for your specific use case
2. **Add More Languages**: Extend code execution support
3. **Enhanced Analytics**: Add more detailed performance metrics
4. **Integration**: Integrate with your existing systems
5. **Testing**: Add comprehensive test coverage

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the GitHub issues
4. Contact the development team

---

**Happy Interviewing! 🚀**
