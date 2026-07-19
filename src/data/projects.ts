import type { Project } from './types';

// Most recent first (resume convention).
export const projects: Project[] = [
  {
    id: 'scholarsync',
    name: 'ScholarSync',
    tagline: 'Full-stack school management platform handling records, attendance, and curriculum tracking.',
    tech: ['Node.js', 'Express', 'MySQL', 'Railway'],
    startDate: 'Dec 2025',
    endDate: 'Jan 2026',
    bullets: [
      'Architected and deployed a scalable backend with Node.js and Express.js managing 75+ student records, attendance tracking, and curriculum progress with full CRUD operations.',
      'Designed RESTful APIs with dynamic branch/class-based query filtering, backed by a cloud-hosted MySQL database on Railway using connection pooling and environment-based configuration.',
    ],
    repo: 'https://github.com/adieladaniel/Student_Progress_Tracker-v2',
  },
  {
    id: 'bank-management-system',
    name: 'Bank Management System',
    tagline: 'Desktop banking suite for accounts, transactions, and loan processing.',
    tech: ['Java', 'Swing', 'AWT', 'MySQL'],
    startDate: 'Aug 2024',
    endDate: 'Nov 2024',
    bullets: [
      'Built user-friendly Swing/AWT interfaces enabling seamless customer interactions for account management, transactions, and loan processing.',
      'Integrated a MySQL database for real-time data storage and retrieval, ensuring data integrity and efficient operations for customer records.',
    ],
    repo: 'https://github.com/adieladaniel/Bank-Management-System',
  },
];
