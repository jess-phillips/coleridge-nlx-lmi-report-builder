// O*NET skill importance profiles by SOC major group (first two digits of O*NET code).
// Derived from O*NET 25.0 Skills data (scale: Importance, threshold >= 3.0).
//
// Three tiers per group determine how many postings in the group "require" each skill:
//   essential  (~95% of occupations) — always included
//   common     (~70% of occupations) — included when occupation hash passes threshold
//   secondary  (~35% of occupations) — 2–5 selected deterministically per occupation

const PROFILES: Record<string, { essential: string[]; common: string[]; secondary: string[] }> = {
  '11': { // Management Occupations
    essential: ['Active Listening', 'Speaking', 'Critical Thinking', 'Coordination'],
    common: ['Monitoring', 'Social Perceptiveness', 'Complex Problem Solving', 'Time Management',
      'Management of Personnel Resources', 'Reading Comprehension', 'Writing'],
    secondary: ['Active Learning', 'Persuasion', 'Negotiation', 'Systems Analysis',
      'Systems Evaluation', 'Management of Financial Resources'],
  },
  '13': { // Business and Financial Operations
    essential: ['Reading Comprehension', 'Active Listening', 'Critical Thinking', 'Time Management'],
    common: ['Writing', 'Active Learning', 'Monitoring', 'Management of Financial Resources',
      'Speaking', 'Mathematics'],
    secondary: ['Social Perceptiveness', 'Complex Problem Solving', 'Systems Analysis',
      'Systems Evaluation', 'Persuasion'],
  },
  '15': { // Computer and Mathematical
    essential: ['Critical Thinking', 'Active Learning', 'Complex Problem Solving'],
    common: ['Reading Comprehension', 'Writing', 'Mathematics', 'Programming',
      'Systems Analysis', 'Systems Evaluation'],
    secondary: ['Speaking', 'Active Listening', 'Technology Design', 'Operations Analysis',
      'Troubleshooting', 'Time Management', 'Monitoring'],
  },
  '17': { // Architecture and Engineering
    essential: ['Critical Thinking', 'Active Learning', 'Mathematics', 'Reading Comprehension'],
    common: ['Complex Problem Solving', 'Operations Analysis', 'Technology Design',
      'Equipment Selection', 'Quality Control Analysis', 'Systems Analysis'],
    secondary: ['Writing', 'Science', 'Programming', 'Installation', 'Troubleshooting', 'Systems Evaluation'],
  },
  '19': { // Life, Physical, and Social Science
    essential: ['Critical Thinking', 'Active Learning', 'Reading Comprehension'],
    common: ['Writing', 'Mathematics', 'Science', 'Complex Problem Solving'],
    secondary: ['Speaking', 'Active Listening', 'Operations Analysis', 'Systems Analysis',
      'Systems Evaluation', 'Monitoring'],
  },
  '21': { // Community and Social Service
    essential: ['Active Listening', 'Social Perceptiveness', 'Service Orientation'],
    common: ['Speaking', 'Active Learning', 'Instructing', 'Reading Comprehension', 'Writing'],
    secondary: ['Coordination', 'Monitoring', 'Complex Problem Solving', 'Critical Thinking'],
  },
  '23': { // Legal Occupations
    essential: ['Reading Comprehension', 'Writing', 'Critical Thinking'],
    common: ['Speaking', 'Active Listening', 'Persuasion', 'Negotiation'],
    secondary: ['Active Learning', 'Social Perceptiveness', 'Complex Problem Solving', 'Time Management'],
  },
  '25': { // Educational Instruction and Library
    essential: ['Active Listening', 'Instructing', 'Speaking'],
    common: ['Reading Comprehension', 'Writing', 'Learning Strategies', 'Active Learning',
      'Social Perceptiveness'],
    secondary: ['Critical Thinking', 'Monitoring', 'Service Orientation', 'Coordination'],
  },
  '27': { // Arts, Design, Entertainment, Sports, and Media
    essential: ['Active Listening', 'Speaking', 'Critical Thinking'],
    common: ['Reading Comprehension', 'Active Learning', 'Writing'],
    secondary: ['Social Perceptiveness', 'Coordination', 'Technology Design',
      'Service Orientation', 'Monitoring'],
  },
  '29': { // Healthcare Practitioners and Technical
    essential: ['Active Listening', 'Critical Thinking', 'Service Orientation'],
    common: ['Reading Comprehension', 'Speaking', 'Social Perceptiveness', 'Complex Problem Solving'],
    secondary: ['Writing', 'Active Learning', 'Coordination', 'Monitoring', 'Systems Analysis'],
  },
  '31': { // Healthcare Support
    essential: ['Active Listening', 'Service Orientation', 'Social Perceptiveness'],
    common: ['Coordination', 'Speaking', 'Reading Comprehension'],
    secondary: ['Monitoring', 'Active Learning', 'Critical Thinking'],
  },
  '33': { // Protective Service
    essential: ['Active Listening', 'Monitoring', 'Critical Thinking'],
    common: ['Speaking', 'Social Perceptiveness', 'Coordination'],
    secondary: ['Service Orientation', 'Writing', 'Operations and Control', 'Systems Analysis'],
  },
  '35': { // Food Preparation and Serving Related
    essential: ['Active Listening', 'Service Orientation', 'Coordination'],
    common: ['Social Perceptiveness', 'Monitoring'],
    secondary: ['Speaking', 'Management of Material Resources', 'Operations and Control'],
  },
  '37': { // Building and Grounds Cleaning and Maintenance
    essential: ['Active Listening', 'Monitoring', 'Equipment Maintenance'],
    common: ['Troubleshooting', 'Coordination'],
    secondary: ['Service Orientation', 'Operations and Control', 'Management of Material Resources'],
  },
  '39': { // Personal Care and Service
    essential: ['Active Listening', 'Service Orientation', 'Social Perceptiveness'],
    common: ['Speaking', 'Coordination'],
    secondary: ['Monitoring', 'Reading Comprehension', 'Active Learning'],
  },
  '41': { // Sales and Related
    essential: ['Active Listening', 'Speaking', 'Service Orientation'],
    common: ['Social Perceptiveness', 'Persuasion', 'Active Learning', 'Negotiation'],
    secondary: ['Reading Comprehension', 'Writing', 'Coordination', 'Monitoring'],
  },
  '43': { // Office and Administrative Support
    essential: ['Active Listening', 'Reading Comprehension', 'Writing'],
    common: ['Speaking', 'Social Perceptiveness', 'Coordination', 'Time Management'],
    secondary: ['Active Learning', 'Monitoring', 'Service Orientation', 'Management of Material Resources'],
  },
  '45': { // Farming, Fishing, and Forestry
    essential: ['Monitoring', 'Operations and Control', 'Active Listening'],
    common: ['Equipment Maintenance', 'Coordination'],
    secondary: ['Troubleshooting', 'Management of Material Resources', 'Quality Control Analysis'],
  },
  '47': { // Construction and Extraction
    essential: ['Active Listening', 'Monitoring', 'Equipment Maintenance'],
    common: ['Troubleshooting', 'Repairing', 'Installation', 'Equipment Selection'],
    secondary: ['Operations and Control', 'Coordination', 'Quality Control Analysis',
      'Management of Material Resources'],
  },
  '49': { // Installation, Maintenance, and Repair
    essential: ['Equipment Maintenance', 'Troubleshooting', 'Repairing'],
    common: ['Active Listening', 'Equipment Selection', 'Installation', 'Operations and Control'],
    secondary: ['Monitoring', 'Operations Monitoring', 'Quality Control Analysis',
      'Management of Material Resources'],
  },
  '51': { // Production Occupations
    essential: ['Monitoring', 'Quality Control Analysis', 'Operations and Control'],
    common: ['Operations Monitoring', 'Equipment Maintenance', 'Coordination'],
    secondary: ['Troubleshooting', 'Critical Thinking', 'Active Listening',
      'Management of Material Resources'],
  },
  '53': { // Transportation and Material Moving
    essential: ['Monitoring', 'Operations and Control', 'Active Listening'],
    common: ['Coordination', 'Operations Monitoring'],
    secondary: ['Management of Material Resources', 'Troubleshooting', 'Service Orientation'],
  },
  '55': { // Military Specific
    essential: ['Active Listening', 'Coordination', 'Monitoring'],
    common: ['Speaking', 'Critical Thinking'],
    secondary: ['Systems Analysis', 'Operations and Control', 'Management of Personnel Resources'],
  },
}

function simpleHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h, 31) + s.charCodeAt(i)
  }
  return Math.abs(h)
}

function pickN(arr: string[], n: number, seed: number): string[] {
  const result: string[] = []
  const used = new Set<number>()
  let s = seed
  while (result.length < Math.min(n, arr.length)) {
    s = Math.abs(Math.imul(s, 1103515245) + 12345)
    const idx = s % arr.length
    if (!used.has(idx)) {
      used.add(idx)
      result.push(arr[idx])
    }
  }
  return result
}

/**
 * Returns the list of O*NET skill names considered "important" for a given
 * occupation code. Uses a deterministic, tiered algorithm based on the major
 * group profile so results are stable across calls and create realistic
 * posting-count variation within a group.
 */
export function getOnetSkills(onetCode: string): string[] {
  const majorGroup = onetCode.slice(0, 2)
  const profile = PROFILES[majorGroup]
  if (!profile) return []

  const hash = simpleHash(onetCode)
  const skills: string[] = []

  // Essential tier: include unless a rare hash excludes it (~95% inclusion)
  for (let i = 0; i < profile.essential.length; i++) {
    if ((simpleHash(onetCode + i) % 20) >= 1) { // exclude ~5%
      skills.push(profile.essential[i])
    }
  }

  // Common tier: include when hash passes a ~70% threshold per skill
  for (let i = 0; i < profile.common.length; i++) {
    if ((simpleHash(onetCode + 'c' + i) % 10) < 7) { // include ~70%
      skills.push(profile.common[i])
    }
  }

  // Secondary tier: pick 2–4 deterministically
  const numSecondary = 2 + (hash % 3)
  skills.push(...pickN(profile.secondary, numSecondary, hash))

  return skills
}
