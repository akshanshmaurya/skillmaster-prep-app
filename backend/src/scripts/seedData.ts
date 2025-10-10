import { getDatabase } from '../config/database';
import { Question, CompanyProfile } from '../models/Interview';

const questions: Omit<Question, '_id'>[] = [
  // DSA Questions
  {
    id: 'dsa-001',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    type: 'dsa',
    difficulty: 'easy',
    category: 'arrays',
    tags: ['hashmap', 'array', 'two-pointer'],
    companies: ['google', 'amazon', 'microsoft', 'meta', 'apple'],
    roles: ['swe', 'frontend', 'backend', 'fullstack'],
    testCases: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        expectedOutput: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        expectedOutput: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      }
    ],
    hints: [
      'Think about using a hash map to store complements',
      'What if you iterate through the array and check if target - current exists?',
      'Consider the time complexity trade-off between nested loops and hash map'
    ],
    timeLimit: 20,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'dsa-002',
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    type: 'dsa',
    difficulty: 'easy',
    category: 'stacks',
    tags: ['stack', 'string', 'matching'],
    companies: ['google', 'amazon', 'microsoft', 'meta'],
    roles: ['swe', 'frontend', 'backend', 'fullstack'],
    testCases: [
      {
        input: 's = "()"',
        expectedOutput: 'true',
        explanation: 'Valid parentheses'
      },
      {
        input: 's = "()[]{}"',
        expectedOutput: 'true',
        explanation: 'Valid parentheses'
      },
      {
        input: 's = "(]"',
        expectedOutput: 'false',
        explanation: 'Invalid parentheses'
      }
    ],
    hints: [
      'Use a stack to keep track of opening brackets',
      'When you encounter a closing bracket, check if it matches the most recent opening bracket',
      'Consider edge cases like empty string and odd length strings'
    ],
    timeLimit: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'dsa-003',
    title: 'Merge Two Sorted Lists',
    description: 'Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.',
    type: 'dsa',
    difficulty: 'medium',
    category: 'linked-lists',
    tags: ['linked-list', 'merge', 'recursion'],
    companies: ['google', 'amazon', 'microsoft', 'meta', 'apple'],
    roles: ['swe', 'backend', 'fullstack'],
    testCases: [
      {
        input: 'l1 = [1,2,4], l2 = [1,3,4]',
        expectedOutput: '[1,1,2,3,4,4]',
        explanation: 'Merged sorted linked list'
      },
      {
        input: 'l1 = [], l2 = [0]',
        expectedOutput: '[0]',
        explanation: 'One list is empty'
      }
    ],
    hints: [
      'Use a dummy head node to simplify the merge process',
      'Compare the values of the current nodes in both lists',
      'Handle the case where one list is exhausted before the other'
    ],
    timeLimit: 25,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'dsa-004',
    title: 'Maximum Subarray (Kadane\'s Algorithm)',
    description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    type: 'dsa',
    difficulty: 'medium',
    category: 'dynamic-programming',
    tags: ['dp', 'array', 'kadane'],
    companies: ['google', 'amazon', 'microsoft', 'meta', 'apple'],
    roles: ['swe', 'backend', 'fullstack'],
    testCases: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        expectedOutput: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.'
      },
      {
        input: 'nums = [1]',
        expectedOutput: '1',
        explanation: 'Single element array'
      }
    ],
    hints: [
      'Think about what happens when you add a negative number to a positive sum',
      'Consider keeping track of the maximum sum ending at each position',
      'What if all numbers are negative?'
    ],
    timeLimit: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'dsa-005',
    title: 'Longest Common Subsequence',
    description: 'Given two strings text1 and text2, return the length of their longest common subsequence.',
    type: 'dsa',
    difficulty: 'hard',
    category: 'dynamic-programming',
    tags: ['dp', 'string', '2d-array'],
    companies: ['google', 'amazon', 'microsoft', 'meta'],
    roles: ['swe', 'backend', 'fullstack'],
    testCases: [
      {
        input: 'text1 = "abcde", text2 = "ace"',
        expectedOutput: '3',
        explanation: 'The longest common subsequence is "ace" and its length is 3.'
      },
      {
        input: 'text1 = "abc", text2 = "abc"',
        expectedOutput: '3',
        explanation: 'The longest common subsequence is "abc" and its length is 3.'
      }
    ],
    hints: [
      'Use a 2D DP table where dp[i][j] represents LCS of first i chars of text1 and first j chars of text2',
      'If characters match, dp[i][j] = dp[i-1][j-1] + 1',
      'If characters don\'t match, dp[i][j] = max(dp[i-1][j], dp[i][j-1])'
    ],
    timeLimit: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // System Design Questions
  {
    id: 'system-001',
    title: 'Design a URL Shortener',
    description: 'Design a URL shortening service like bit.ly. Discuss the requirements, high-level architecture, database design, and scaling considerations.',
    type: 'system-design',
    difficulty: 'medium',
    category: 'web-services',
    tags: ['url-shortener', 'caching', 'database', 'scaling'],
    companies: ['google', 'amazon', 'microsoft', 'meta'],
    roles: ['swe', 'backend', 'fullstack', 'senior-swe'],
    timeLimit: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'system-002',
    title: 'Design a Chat Application',
    description: 'Design a real-time chat application like WhatsApp or Slack. Consider real-time messaging, user management, message persistence, and scalability.',
    type: 'system-design',
    difficulty: 'hard',
    category: 'real-time-systems',
    tags: ['websockets', 'real-time', 'messaging', 'scaling'],
    companies: ['google', 'meta', 'microsoft', 'apple'],
    roles: ['swe', 'backend', 'fullstack', 'senior-swe'],
    timeLimit: 60,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'system-003',
    title: 'Design a Social Media Feed',
    description: 'Design a social media feed system like Facebook or Twitter. Consider timeline generation, content ranking, and real-time updates.',
    type: 'system-design',
    difficulty: 'hard',
    category: 'social-systems',
    tags: ['feed', 'ranking', 'real-time', 'caching'],
    companies: ['meta', 'twitter', 'google', 'microsoft'],
    roles: ['swe', 'backend', 'fullstack', 'senior-swe'],
    timeLimit: 60,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Behavioral Questions
  {
    id: 'behavioral-001',
    title: 'Tell me about a challenging project',
    description: 'Describe a challenging project you worked on. What was the problem, how did you approach it, and what was the outcome?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'project-management',
    tags: ['challenge', 'problem-solving', 'leadership'],
    companies: ['google', 'amazon', 'microsoft', 'meta', 'apple'],
    roles: ['swe', 'senior-swe', 'frontend', 'backend', 'fullstack', 'devops'],
    timeLimit: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'behavioral-002',
    title: 'Describe a time you failed',
    description: 'Tell me about a time when you failed or made a mistake. How did you handle it and what did you learn?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'failure-handling',
    tags: ['failure', 'learning', 'resilience'],
    companies: ['google', 'amazon', 'microsoft', 'meta', 'apple'],
    roles: ['swe', 'senior-swe', 'frontend', 'backend', 'fullstack', 'devops'],
    timeLimit: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'behavioral-003',
    title: 'How do you handle conflicting priorities?',
    description: 'Describe a situation where you had to manage multiple conflicting priorities. How did you prioritize and manage your time?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'time-management',
    tags: ['priorities', 'time-management', 'decision-making'],
    companies: ['google', 'amazon', 'microsoft', 'meta', 'apple'],
    roles: ['swe', 'senior-swe', 'frontend', 'backend', 'fullstack', 'devops'],
    timeLimit: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const companyProfiles: Omit<CompanyProfile, '_id'>[] = [
  {
    id: 'google',
    name: 'Google',
    logo: '/logos/google.svg',
    color: '#4285F4',
    focusAreas: ['algorithms', 'system-design', 'machine-learning'],
    interviewStyle: 'technical-heavy',
    questionTypes: ['dsa', 'system-design', 'behavioral'],
    difficulty: 'hard',
    timeLimit: 60,
    description: 'Google focuses on algorithmic thinking, system design, and problem-solving skills.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: '/logos/amazon.svg',
    color: '#FF9900',
    focusAreas: ['algorithms', 'system-design', 'leadership'],
    interviewStyle: 'balanced',
    questionTypes: ['dsa', 'system-design', 'behavioral'],
    difficulty: 'medium',
    timeLimit: 60,
    description: 'Amazon emphasizes both technical skills and leadership principles.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: '/logos/microsoft.svg',
    color: '#00BCF2',
    focusAreas: ['algorithms', 'system-design', 'product-thinking'],
    interviewStyle: 'balanced',
    questionTypes: ['dsa', 'system-design', 'behavioral'],
    difficulty: 'medium',
    timeLimit: 60,
    description: 'Microsoft values technical excellence and product thinking.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'meta',
    name: 'Meta',
    logo: '/logos/meta.svg',
    color: '#1877F2',
    focusAreas: ['algorithms', 'system-design', 'scaling'],
    interviewStyle: 'technical-heavy',
    questionTypes: ['dsa', 'system-design', 'behavioral'],
    difficulty: 'hard',
    timeLimit: 60,
    description: 'Meta focuses on scalable systems and algorithmic problem-solving.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'apple',
    name: 'Apple',
    logo: '/logos/apple.svg',
    color: '#000000',
    focusAreas: ['algorithms', 'system-design', 'user-experience'],
    interviewStyle: 'balanced',
    questionTypes: ['dsa', 'system-design', 'behavioral'],
    difficulty: 'medium',
    timeLimit: 60,
    description: 'Apple values technical skills combined with user experience thinking.',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function seedDatabase() {
  try {
    const db = await getDatabase();
    
    // Clear existing data
    await db.collection('questions').deleteMany({});
    await db.collection('company_profiles').deleteMany({});
    
    // Insert questions
    const questionsResult = await db.collection('questions').insertMany(questions as any);
    console.log(`✅ Inserted ${questionsResult.insertedCount} questions`);
    
    // Insert company profiles
    const companiesResult = await db.collection('company_profiles').insertMany(companyProfiles as any);
    console.log(`✅ Inserted ${companiesResult.insertedCount} company profiles`);
    
    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
