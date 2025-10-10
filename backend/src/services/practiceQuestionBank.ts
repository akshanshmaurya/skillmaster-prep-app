import {
  PracticeQuestion,
  PracticeTopic,
  PracticeDifficulty,
  PracticeAnswerType
} from '../models/Practice';

export type PracticeQuestionTemplate = {
  difficulty: PracticeDifficulty;
  prompt: string;
  answerType: PracticeAnswerType;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  tags: string[];
  estimatedTime: number;
};

const makeQuestion = (
  topic: PracticeTopic,
  base: PracticeQuestionTemplate,
  index: number
): PracticeQuestion => ({
  id: `${topic}-${base.difficulty}-${index}`,
  topic,
  difficulty: base.difficulty,
  prompt: base.prompt,
  answerType: base.answerType,
  options: base.options,
  correctAnswer: base.correctAnswer,
  explanation: base.explanation,
  tags: base.tags,
  estimatedTime: base.estimatedTime,
  source: 'fallback'
});

const bankTemplates: Record<PracticeTopic, PracticeQuestionTemplate[]> = {
  quant: [
    {
      difficulty: 'beginner',
      prompt: 'A laptop is marked at $800 and sold at a discount of 15%. What is the selling price?',
      answerType: 'single-choice',
      options: ['$640', '$660', '$680', '$720'],
      correctAnswer: '$680',
      explanation: '15% of 800 is 120, so the selling price is 800 - 120 = 680.',
      tags: ['percentages', 'discount'],
      estimatedTime: 2
    },
    {
      difficulty: 'beginner',
      prompt: 'An item costing $450 is sold for $522. What is the profit percentage?',
      answerType: 'single-choice',
      options: ['12%', '14%', '16%', '18%'],
      correctAnswer: '16%',
      explanation: 'Profit = 72. Profit% = (72/450) × 100 = 16%.',
      tags: ['profit & loss'],
      estimatedTime: 2
    },
    {
      difficulty: 'intermediate',
      prompt: 'A value is increased by 25% and then decreased by 20%. What is the net percentage change?',
      answerType: 'single-choice',
      options: ['5% increase', 'No change', '4% decrease', '10% decrease'],
      correctAnswer: 'No change',
      explanation: '1.25 × 0.8 = 1.00, so the value returns to the original.',
      tags: ['successive changes'],
      estimatedTime: 2
    },
    {
      difficulty: 'intermediate',
      prompt: 'The ratio of two numbers is 3:5 and their sum is 160. What is the larger number?',
      answerType: 'single-choice',
      options: ['60', '90', '100', '120'],
      correctAnswer: '100',
      explanation: 'Total parts = 8 → each part = 20, so larger number = 5 × 20 = 100.',
      tags: ['ratios'],
      estimatedTime: 2
    },
    {
      difficulty: 'advanced',
      prompt: 'What is the compound interest on $5,000 at 8% per annum for 2 years (compounded annually)?',
      answerType: 'single-choice',
      options: ['$780', '$800', '$832', '$864'],
      correctAnswer: '$832',
      explanation: 'Amount = 5000 × (1.08)^2 = 5832, so interest = 832.',
      tags: ['compound interest'],
      estimatedTime: 3
    },
    {
      difficulty: 'advanced',
      prompt: 'A and B can finish a project in 12 and 18 days respectively. How long will they take together?',
      answerType: 'single-choice',
      options: ['6.5 days', '7.2 days', '7.5 days', '8 days'],
      correctAnswer: '7.2 days',
      explanation: 'Combined rate = 1/12 + 1/18 = 5/36. Time = 36/5 = 7.2 days.',
      tags: ['time and work'],
      estimatedTime: 3
    }
  ],
  verbal: [
    {
      difficulty: 'beginner',
      prompt: 'Choose the option that best replaces the underlined portion: "She insisted that he _be_ on time."',
      answerType: 'single-choice',
      options: ['be', 'is', 'was', 'being'],
      correctAnswer: 'be',
      explanation: 'After verbs like insist, the subjunctive uses the base form.',
      tags: ['grammar', 'subjunctive'],
      estimatedTime: 2
    },
    {
      difficulty: 'beginner',
      prompt: 'Select the word closest in meaning to "succinct".',
      answerType: 'single-choice',
      options: ['lengthy', 'brief', 'emotional', 'confusing'],
      correctAnswer: 'brief',
      explanation: 'Succinct means expressed clearly in few words.',
      tags: ['vocabulary'],
      estimatedTime: 2
    },
    {
      difficulty: 'intermediate',
      prompt: 'Choose the sentence with correct punctuation.',
      answerType: 'single-choice',
      options: [
        'Because it was raining we stayed indoors.',
        'Because it was raining, we stayed indoors.',
        'Because it was raining we, stayed indoors.',
        'Because it was raining; we stayed indoors.'
      ],
      correctAnswer: 'Because it was raining, we stayed indoors.',
      explanation: 'Introductory clauses take a comma for clarity.',
      tags: ['punctuation'],
      estimatedTime: 2
    },
    {
      difficulty: 'intermediate',
      prompt: 'Fill in the blank: "Her presentation was not only insightful but also __________."',
      answerType: 'single-choice',
      options: ['persuasive', 'persuading', 'to persuade', 'persuasion'],
      correctAnswer: 'persuasive',
      explanation: 'Parallel structure requires an adjective to match "insightful".',
      tags: ['sentence structure'],
      estimatedTime: 2
    },
    {
      difficulty: 'advanced',
      prompt: 'Identify the tone of the sentence: "While the launch was delayed, our roadmap keeps us optimistic."',
      answerType: 'single-choice',
      options: ['defensive', 'cautiously optimistic', 'sarcastic', 'indifferent'],
      correctAnswer: 'cautiously optimistic',
      explanation: 'Acknowledges a setback but highlights ongoing optimism.',
      tags: ['tone analysis'],
      estimatedTime: 2
    },
    {
      difficulty: 'advanced',
      prompt: 'Select the two words that best complete the sentence: "Her feedback was both _____ and _____, helping the team improve quickly."',
      answerType: 'multiple-choice',
      options: ['constructive', 'vague', 'actionable', 'dismissive'],
      correctAnswer: ['constructive', 'actionable'],
      explanation: 'The sentence implies positive, helpful feedback; constructive and actionable fit.',
      tags: ['context clues'],
      estimatedTime: 3
    }
  ],
  aptitude: [
    {
      difficulty: 'beginner',
      prompt: 'Complete the series: 4, 9, 16, 25, 36, ?.',
      answerType: 'single-choice',
      options: ['42', '45', '49', '52'],
      correctAnswer: '49',
      explanation: 'These are squares: 2^2, 3^2, 4^2, 5^2, 6^2 → next is 7^2 = 49.',
      tags: ['number series'],
      estimatedTime: 2
    },
    {
      difficulty: 'beginner',
      prompt: 'If GRAIN is coded as ITCKP (each letter shifted +2), how is CODED coded?',
      answerType: 'single-choice',
      options: ['EQFGF', 'EQFFG', 'EPFFG', 'EQFFE'],
      correctAnswer: 'EQFGF',
      explanation: 'Shift each letter +2: C→E, O→Q, D→F, E→G, D→F.',
      tags: ['coding-decoding'],
      estimatedTime: 2
    },
    {
      difficulty: 'intermediate',
      prompt: 'The average of five numbers is 26. Four numbers are 20, 24, 28, and 30. What is the fifth number?',
      answerType: 'single-choice',
      options: ['22', '24', '28', '32'],
      correctAnswer: '28',
      explanation: 'Total = 5 × 26 = 130. Sum of four numbers = 102, so the fifth is 28.',
      tags: ['averages'],
      estimatedTime: 2
    },
    {
      difficulty: 'intermediate',
      prompt: 'A bag has 6 red, 5 blue, and 3 green marbles. What is the probability of picking a blue marble?',
      answerType: 'single-choice',
      options: ['1/3', '5/14', '3/14', '2/7'],
      correctAnswer: '5/14',
      explanation: 'Total 14 marbles. Probability = 5/14.',
      tags: ['probability'],
      estimatedTime: 3
    },
    {
      difficulty: 'advanced',
      prompt: 'Pipes A, B, and C fill a tank in 10, 12, and 15 hours respectively. How long will they take working together?',
      answerType: 'single-choice',
      options: ['3 hours', '3 hours 30 min', '4 hours', '4 hours 30 min'],
      correctAnswer: '4 hours',
      explanation: 'Combined rate = 1/10 + 1/12 + 1/15 = 15/60 = 1/4 tank per hour ⇒ 4 hours.',
      tags: ['time and work'],
      estimatedTime: 3
    },
    {
      difficulty: 'advanced',
      prompt: 'In how many ways can the letters of "VECTOR" be arranged?',
      answerType: 'single-choice',
      options: ['120', '360', '720', '840'],
      correctAnswer: '720',
      explanation: 'VECTOR has 6 unique letters ⇒ 6! = 720.',
      tags: ['permutations'],
      estimatedTime: 3
    }
  ],
  reasoning: [
    {
      difficulty: 'beginner',
      prompt: 'Statements: All developers are coders. Some coders are testers. Conclusion: Some developers are testers. Evaluate the conclusion.',
      answerType: 'single-choice',
      options: ['Definitely true', 'Definitely false', 'Possibly true', 'Cannot be determined'],
      correctAnswer: 'Possibly true',
      explanation: 'Overlap could exist but is not guaranteed, so it is only possibly true.',
      tags: ['syllogism'],
      estimatedTime: 3
    },
    {
      difficulty: 'beginner',
      prompt: 'Find the odd pair: (2, 8), (3, 18), (4, 32), (5, 48).',
      answerType: 'single-choice',
      options: ['(2, 8)', '(3, 18)', '(4, 32)', '(5, 48)'],
      correctAnswer: '(3, 18)',
      explanation: 'Pattern is second number = first number × 4. Only 3 × 4 ≠ 18.',
      tags: ['pattern recognition'],
      estimatedTime: 2
    },
    {
      difficulty: 'intermediate',
      prompt: 'Facing east, you turn right, walk 4 metres, turn right again, walk 3 metres, then turn right once more. Which direction are you facing now?',
      answerType: 'single-choice',
      options: ['North', 'South', 'East', 'West'],
      correctAnswer: 'North',
      explanation: 'Right from east → south, next right → west, final right → north; walking does not change facing direction.',
      tags: ['direction sense'],
      estimatedTime: 3
    },
    {
      difficulty: 'intermediate',
      prompt: 'Raj is the brother of Meena. Meena is the mother of Arjun. How is Raj related to Arjun?',
      answerType: 'single-choice',
      options: ['Brother', 'Father', 'Uncle', 'Cousin'],
      correctAnswer: 'Uncle',
      explanation: 'Raj is Arjun’s mother’s brother, which makes him Arjun’s maternal uncle.',
      tags: ['blood relations'],
      estimatedTime: 2
    },
    {
      difficulty: 'advanced',
      prompt: 'Statement: "Launch day is tomorrow unless testing fails." Assumption: Testing will succeed. Identify the validity.',
      answerType: 'single-choice',
      options: ['Implicit', 'Explicit', 'Cannot be assumed', 'Contradictory'],
      correctAnswer: 'Cannot be assumed',
      explanation: 'The statement allows for failure; assuming success is not guaranteed.',
      tags: ['critical reasoning'],
      estimatedTime: 3
    },
    {
      difficulty: 'advanced',
      prompt: 'Six colleagues sit around a circular table. Anika sits opposite Rohan. Meera sits to the right of Anika. If Vikram sits between Rohan and Li, who is immediately left of Meera?',
      answerType: 'single-choice',
      options: ['Rohan', 'Vikram', 'Li', 'Cannot be determined'],
      correctAnswer: 'Li',
      explanation: 'Arranging the circle shows Li to Meera’s left.',
      tags: ['seating arrangement'],
      estimatedTime: 4
    }
  ],
  games: [
    {
      difficulty: 'beginner',
      prompt: 'You have three switches downstairs controlling three bulbs upstairs. You may go upstairs once. How can you determine which switch controls which bulb?',
      answerType: 'single-choice',
      options: [
        'Toggle each switch and run upstairs three times.',
        'Turn two on, leave one off, then check the bulbs.',
        'Turn one on for a few minutes, switch it off, turn the second on, leave the third off, then check heat and light.',
        'It is impossible with one trip.'
      ],
      correctAnswer: 'Turn one on for a few minutes, switch it off, turn the second on, leave the third off, then check heat and light.',
      explanation: 'Warm bulb maps to first switch, lit bulb to second, cold bulb to third.',
      tags: ['logic puzzle'],
      estimatedTime: 4
    },
    {
      difficulty: 'beginner',
      prompt: 'A logic game requires the minimum moves to solve a 4-disk Tower of Hanoi. How many moves are needed?',
      answerType: 'single-choice',
      options: ['8', '12', '15', '16'],
      correctAnswer: '15',
      explanation: 'Minimum moves = 2^n - 1 = 2^4 - 1 = 15.',
      tags: ['strategy'],
      estimatedTime: 3
    },
    {
      difficulty: 'intermediate',
      prompt: 'In a treasure game you can take $5 guaranteed or roll a die: 1-3 wins $2, 4-6 wins $10. Which has the higher expected value?',
      answerType: 'single-choice',
      options: ['$5 guaranteed', 'Rolling the die', 'Both equal', 'Cannot be determined'],
      correctAnswer: 'Rolling the die',
      explanation: 'Expected value = (3/6 × 2) + (3/6 × 10) = $6, which beats $5.',
      tags: ['expected value'],
      estimatedTime: 3
    },
    {
      difficulty: 'intermediate',
      prompt: 'In a memory challenge you see the sequence R, B, G, Y, G, R. Which strategy helps you recall it fastest?',
      answerType: 'single-choice',
      options: ['Repeat the colors silently.', 'Group them into pairs RB-GY-GR.', 'Focus only on the first and last colors.', 'Close your eyes and relax.'],
      correctAnswer: 'Group them into pairs RB-GY-GR.',
      explanation: 'Chunking reduces cognitive load and speeds recall.',
      tags: ['memory technique'],
      estimatedTime: 3
    },
    {
      difficulty: 'advanced',
      prompt: 'A puzzle locks with an anagram of "CIPHER" that forms an English word. What is the password?',
      answerType: 'single-choice',
      options: ['CERIPH', 'CHIPER', 'RICHPE', 'HERICP'],
      correctAnswer: 'CERIPH',
      explanation: 'CERIPH (variant of serif) is a valid anagram of CIPHER.',
      tags: ['anagram'],
      estimatedTime: 3
    },
    {
      difficulty: 'advanced',
      prompt: 'In a cooperative game three players must cross a river with a boat that holds one item plus one player. They have a wolf, goat, and cabbage. Minimum trips needed to get all across safely?',
      answerType: 'single-choice',
      options: ['5', '7', '9', '11'],
      correctAnswer: '7',
      explanation: 'Standard solution requires seven crossings to avoid leaving the goat with the cabbage or wolf.',
      tags: ['strategy', 'planning'],
      estimatedTime: 4
    }
  ]
};

export const PRACTICE_QUESTION_BANK: Record<PracticeTopic, PracticeQuestion[]> = Object.fromEntries(
  Object.entries(bankTemplates).map(([topic, templates]) => [
    topic,
    templates.map((template, index) => makeQuestion(topic as PracticeTopic, template, index + 1))
  ])
) as Record<PracticeTopic, PracticeQuestion[]>;
