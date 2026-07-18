import type { Internship } from './types';

// Most recent first (resume convention).
export const internships: Internship[] = [
  {
    id: 'edunext-analytics',
    company: 'Edunext Technologies Pvt. Ltd.',
    role: 'Software Engineer Intern — AI-Powered Analytics Systems',
    location: 'Delhi NCR, India',
    startDate: 'Apr 2026',
    endDate: 'May 2026',
    bullets: [
      'Built an AI-powered finance analytics platform integrating Power BI dashboards with a hybrid rule-based and LLM-driven conversational chatbot for natural language analytics.',
      'Designed and tested 10+ scalable FastAPI endpoints and JSON-based data pipelines processing 50,000+ student fee records across collections, concessions, waivers, and pending fees.',
      'Implemented intelligent query planning, context-aware follow-up handling, and automated chart generation, cutting manual reporting effort by 80% across a multi-tenant deployment spanning 20+ schools.',
    ],
    tech: ['Python', 'FastAPI', 'Power BI', 'LLM', 'RAG', 'JSON pipelines'],
    milestoneId: 'internship-edunext',
    link: 'https://github.com/adieladaniel/FinnBot-Financial-AI-Analytics-Engine',
  },
  {
    id: 'ieee-oncovision',
    company: 'IEEE Bangalore Section',
    role: 'Artificial Intelligence Intern — OncoVision, Early Cancer Detection',
    location: 'Bengaluru, India',
    startDate: 'Apr 2025',
    endDate: 'Aug 2025',
    bullets: [
      'Developed a dual-output deep learning model using EfficientNetB0 to classify eight cancer types and detect malignancy from histopathological images.',
      'Achieved 97.99% accuracy in cancer classification and 98.13% in malignancy detection through transfer learning, regularization, and two-phase training.',
      'Ran systematic model experimentation and performance evaluation (accuracy, precision, recall) across transfer learning configurations.',
    ],
    tech: ['Python', 'TensorFlow', 'EfficientNetB0', 'Transfer Learning', 'Deep Learning'],
    milestoneId: 'internship-ieee',
    link: 'https://github.com/adieladaniel/OncoVision',
  },
];
