import { AssessmentDifficulty, AssessmentQuestion, AssessmentTopic } from '../models/Assessment';

const makeChoice = (
  track: AssessmentQuestion['track'],
  topic: AssessmentTopic,
  difficulty: AssessmentDifficulty,
  id: string,
  prompt: string,
  options: string[],
  correctAnswer: string | string[],
  explanation: string,
  tags: string[],
  estimatedTime = 3
): AssessmentQuestion => ({
  id,
  track,
  topic,
  difficulty,
  prompt,
  answerType: Array.isArray(correctAnswer) ? 'multiple-choice' : 'single-choice',
  options,
  correctAnswer,
  explanation,
  tags,
  source: 'fallback',
  estimatedTime
});

const makeShort = (
  track: AssessmentQuestion['track'],
  topic: AssessmentTopic,
  difficulty: AssessmentDifficulty,
  id: string,
  prompt: string,
  correctAnswer: string,
  explanation: string,
  tags: string[],
  estimatedTime = 4
): AssessmentQuestion => ({
  id,
  track,
  topic,
  difficulty,
  prompt,
  answerType: 'short-text',
  correctAnswer,
  explanation,
  tags,
  source: 'fallback',
  estimatedTime
});

export const ASSESSMENT_QUESTION_BANK: Record<AssessmentTopic, AssessmentQuestion[]> = {
  quant: [
    makeChoice(
      'soft-skills',
      'quant',
      'beginner',
      'quant-1',
      'A train travels 180 km in 3 hours. What is its average speed?',
      ['50 km/h', '55 km/h', '60 km/h', '65 km/h'],
      '60 km/h',
      'Average speed = distance / time = 180 / 3 = 60 km/h.',
      ['speed', 'fundamentals']
    ),
    makeChoice(
      'soft-skills',
      'quant',
      'intermediate',
      'quant-2',
      'If a salary is increased by 20% and then decreased by 20%, what is the net change?',
      ['0%', '2% decrease', '4% decrease', '4% increase'],
      '4% decrease',
      'Net change = (1.2 * 0.8) - 1 = -0.04, i.e., 4% decrease.',
      ['percentage', 'compounding']
    ),
    makeShort(
      'soft-skills',
      'quant',
      'advanced',
      'quant-3',
      'A project requires an average of 6 people per day over 15 days. If the first 10 days had only 5 people per day, how many workers must work each day for the remaining period?',
      '8',
      'Total person-days = 6×15 = 90. Work completed = 5×10 = 50. Remaining = 40 over 5 days, so 40 / 5 = 8 workers per day.',
      ['work-time', 'ratios']
    )
  ],
  verbal: [
    makeChoice(
      'soft-skills',
      'verbal',
      'beginner',
      'verbal-1',
      'Choose the word closest in meaning to "succinct".',
      ['elaborate', 'concise', 'awkward', 'detailed'],
      'concise',
      'Succinct means expressed in a brief, concise manner.',
      ['synonyms', 'vocabulary']
    ),
    makeChoice(
      'soft-skills',
      'verbal',
      'intermediate',
      'verbal-2',
      'Identify the grammatically correct sentence.',
      [
        'Neither of the answers are correct.',
        'Each manager and engineer were in the meeting.',
        'The data show significant improvement.',
        'There goes the results you requested.'
      ],
      'The data show significant improvement.',
      '"Data" is plural; the correct verb is "show". Others have subject-verb agreement issues.',
      ['grammar', 'agreement']
    ),
    makeShort(
      'soft-skills',
      'verbal',
      'advanced',
      'verbal-3',
      'Rewrite the sentence "Although the plan was risky, we proceeded" using "despite" while keeping the meaning.',
      'Despite the riskiness of the plan, we proceeded.',
      'Using "despite" requires a noun phrase: "Despite the plan being risky" or similar restructuring.',
      ['paraphrasing', 'communication']
    )
  ],
  aptitude: [
    makeChoice(
      'soft-skills',
      'aptitude',
      'beginner',
      'aptitude-1',
      'Find the missing number: 3, 9, 27, ?, 243.',
      ['54', '81', '108', '162'],
      '81',
      'The pattern multiplies by 3 each step: 3×3=9, 9×3=27, 27×3=81.',
      ['series', 'patterns']
    ),
    makeChoice(
      'soft-skills',
      'aptitude',
      'intermediate',
      'aptitude-2',
      'Ravi starts facing North, turns 90° clockwise, then 180° anti-clockwise. Which direction is he facing now?',
      ['North', 'South', 'East', 'West'],
      'West',
      'Clockwise turn leads East; 180° anti-clockwise (i.e., clockwise) from East ends at West.',
      ['directions', 'reasoning']
    ),
    makeChoice(
      'soft-skills',
      'aptitude',
      'intermediate',
      'aptitude-3',
      'Two pipes can fill a tank in 12 min and 18 min respectively. A drain empties in 36 min. If all operate together, how long to fill?',
      ['9 min', '10 min', '12 min', '15 min'],
      '9 min',
      'Rates: 1/12 + 1/18 - 1/36 = (3 + 2 - 1)/36 = 4/36 = 1/9.',
      ['pipes', 'time-work']
    )
  ],
  coding: [
    makeChoice(
      'technical-skills',
      'coding',
      'beginner',
      'coding-1',
      'Which data structure offers O(1) average time for insertion and lookup by key?',
      ['Array', 'Linked List', 'Hash Map', 'Binary Search Tree'],
      'Hash Map',
      'Hash maps average O(1) for key-based insertion and lookup.',
      ['dsa', 'hashing']
    ),
    makeShort(
      'technical-skills',
      'coding',
      'intermediate',
      'coding-2',
      'What is the time complexity of merge sort in the average case?',
      'O(n log n)',
      'Merge sort splits and merges arrays, leading to O(n log n) complexity.',
      ['complexity', 'sorting']
    ),
    makeChoice(
      'technical-skills',
      'coding',
      'advanced',
      'coding-3',
      'For an LRU cache with capacity k implemented via doubly-linked list and hashmap, what is the time complexity of get()?',
      ['O(1)', 'O(log k)', 'O(k)', 'O(n)'],
      'O(1)',
      'Combined hashmap and linked list allow O(1) node access and updates.',
      ['lrucache', 'design']
    )
  ],
  cloud: [
    makeChoice(
      'technical-skills',
      'cloud',
      'beginner',
      'cloud-1',
      'Which cloud model gives users control over applications but not underlying infrastructure?',
      ['IaaS', 'PaaS', 'SaaS', 'FaaS'],
      'PaaS',
      'Platform-as-a-Service abstracts infrastructure while exposing app platform control.',
      ['deployment-models']
    ),
    makeChoice(
      'technical-skills',
      'cloud',
      'intermediate',
      'cloud-2',
      'What AWS service provides managed Kubernetes control planes?',
      ['ECS', 'EKS', 'Lambda', 'Lightsail'],
      'EKS',
      'Amazon Elastic Kubernetes Service (EKS) offers managed Kubernetes masters.',
      ['aws', 'kubernetes']
    ),
    makeShort(
      'technical-skills',
      'cloud',
      'advanced',
      'cloud-3',
      'Name one strategy to achieve zero-downtime deployments in a microservices environment.',
      'Blue-green deployment',
      'Blue-green, canary, or rolling strategies swap traffic gradually.',
      ['devops', 'deployment']
    )
  ],
  dbms: [
    makeChoice(
      'technical-skills',
      'dbms',
      'beginner',
      'dbms-1',
      'Which normal form removes partial dependencies on a primary key?',
      ['1NF', '2NF', '3NF', 'BCNF'],
      '2NF',
      'Second Normal Form eliminates partial dependency on primary key.',
      ['normalization']
    ),
    makeChoice(
      'technical-skills',
      'dbms',
      'intermediate',
      'dbms-2',
      'Which SQL command is used to grant privileges to a user?',
      ['GRANT', 'ALLOW', 'PERMIT', 'ASSIGN'],
      'GRANT',
      'GRANT assigns privileges; REVOKE removes them.',
      ['sql', 'security']
    ),
    makeShort(
      'technical-skills',
      'dbms',
      'advanced',
      'dbms-3',
      'Explain the difference between clustered and non-clustered indexes in a relational database.',
      'Clustered indexes dictate row order on disk; non-clustered indexes store separate key pointers.',
      'Clustered defines physical storage order; non-clustered maintains logical order with row locators.',
      ['indexing', 'performance']
    )
  ],
  'operating-systems': [
    makeChoice(
      'technical-skills',
      'operating-systems',
      'beginner',
      'os-1',
      'Which scheduling algorithm selects the process with the smallest burst time next?',
      ['FCFS', 'SJF', 'Round Robin', 'Priority'],
      'SJF',
      'Shortest Job First chooses smallest CPU burst next.',
      ['scheduling']
    ),
    makeChoice(
      'technical-skills',
      'operating-systems',
      'intermediate',
      'os-2',
      'What is a page fault?',
      ['CPU overheating', 'Missing process', 'Requested page not in main memory', 'Disk failure'],
      'Requested page not in main memory',
      'Page faults occur when data is absent from RAM and must be swapped in.',
      ['memory-management']
    ),
    makeShort(
      'technical-skills',
      'operating-systems',
      'advanced',
      'os-3',
      'Provide one advantage of using a microkernel architecture.',
      'Improved reliability due to isolation of services from kernel space.',
      'Microkernels isolate services in user space, enhancing stability.',
      ['architecture']
    )
  ],
  networks: [
    makeChoice(
      'technical-skills',
      'networks',
      'beginner',
      'net-1',
      'Which layer of the OSI model handles end-to-end communication reliability?',
      ['Network', 'Transport', 'Session', 'Presentation'],
      'Transport',
      'Transport layer ensures reliable data transfer via TCP.',
      ['osi', 'transport']
    ),
    makeChoice(
      'technical-skills',
      'networks',
      'intermediate',
      'net-2',
      'Which protocol resolves IP addresses to MAC addresses in IPv4?',
      ['DHCP', 'DNS', 'ARP', 'ICMP'],
      'ARP',
      'Address Resolution Protocol maps IP addresses to MAC addresses.',
      ['protocols']
    ),
    makeShort(
      'technical-skills',
      'networks',
      'advanced',
      'net-3',
      'State one benefit of using CDN for global users.',
      'Reduced latency by serving content from edge locations near users.',
      'CDNs cache content closer to end-users, improving latency and reliability.',
      ['cdn', 'performance']
    )
  ],
  'system-design': [
    makeChoice(
      'technical-skills',
      'system-design',
      'intermediate',
      'sd-1',
      'Which component primarily handles write amplification in highly write-intensive systems?',
      ['Load balancer', 'Write-ahead log', 'Content delivery network', 'DNS server'],
      'Write-ahead log',
      'WALs absorb writes sequentially to reduce random disk writes.',
      ['storage', 'durability']
    ),
    makeShort(
      'technical-skills',
      'system-design',
      'advanced',
      'sd-2',
      'Suggest one strategy to ensure eventual consistency in distributed microservices.',
      'Use event sourcing with idempotent consumers.',
      'Techniques include event sourcing, saga patterns, or CRDTs to reconcile state.',
      ['consistency', 'distributed-systems']
    ),
    makeChoice(
      'technical-skills',
      'system-design',
      'beginner',
      'sd-3',
      'Which tool distributes requests across servers to prevent overload?',
      ['Cache', 'Load balancer', 'Message queue', 'Database replica'],
      'Load balancer',
      'Load balancers route traffic across instances to maintain availability.',
      ['scalability']
    )
  ]
};
