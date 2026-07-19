import type { CodingStats } from './types';

export const codingStats: CodingStats = {
  totalSolved: 200,
  codolioUrl: 'https://codolio.com/profile/adieladaniel',
  languages: [
    { name: 'C++', solved: 173 },
    { name: 'MySQL', solved: 75 },
  ],
  topics: [
    // Advanced
    { name: 'Dynamic Programming', count: 18, tier: 'advanced' },
    { name: 'Backtracking', count: 14, tier: 'advanced' },
    { name: 'Monotonic Stack', count: 12, tier: 'advanced' },
    { name: 'Divide and Conquer', count: 9, tier: 'advanced' },
    { name: 'Trie', count: 2, tier: 'advanced' },
    { name: 'Binary Indexed Tree', count: 2, tier: 'advanced' },
    { name: 'Segment Tree', count: 2, tier: 'advanced' },
    { name: 'Data Stream', count: 1, tier: 'advanced' },

    // Intermediate
    { name: 'Database', count: 75, tier: 'intermediate' },
    { name: 'Hash Table', count: 37, tier: 'intermediate' },
    { name: 'Binary Search', count: 34, tier: 'intermediate' },
    { name: 'Math', count: 23, tier: 'intermediate' },
    { name: 'Recursion', count: 14, tier: 'intermediate' },
    { name: 'Bit Manipulation', count: 13, tier: 'intermediate' },
    { name: 'Sliding Window', count: 11, tier: 'intermediate' },
    { name: 'Greedy', count: 9, tier: 'intermediate' },

    // Fundamental
    { name: 'Array', count: 103, tier: 'fundamental' },
    { name: 'String', count: 38, tier: 'fundamental' },
    { name: 'Two Pointers', count: 31, tier: 'fundamental' },
    { name: 'Stack', count: 26, tier: 'fundamental' },
    { name: 'Linked List', count: 20, tier: 'fundamental' },
    { name: 'Sorting', count: 18, tier: 'fundamental' },
    { name: 'Matrix', count: 11, tier: 'fundamental' },
    { name: 'Simulation', count: 6, tier: 'fundamental' },
  ],
};
