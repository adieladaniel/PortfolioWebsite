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
      'Developed an AI-powered finance analytics platform for a multi-tenant enterprise deployment, integrating Power BI dashboards with the chatbot, architected as a LangGraph state-machine pipeline with conditional rule-based/LLM-fallback routing to balance reliability and flexibility in a live business system.',
      'Designed and tested 10+ scalable FastAPI endpoints (validated via Postman) and JSON-based data pipelines to process 50,000+ student fee records, enabling dynamic queries across business-critical processes including collections, concessions, waivers, and pending fees.',
      'Implemented intelligent query planning with LangChain structured LLM output, a deterministic RapidFuzz-based typo-correction layer, and context-aware follow-up handling, reducing manual reporting effort by 80% across a multi-tenant deployment spanning 20+ client organizations in India.',
    ],
    tech: ['Python', 'FastAPI', 'LangGraph', 'LangChain', 'RapidFuzz', 'Power BI', 'Postman'],
    link: 'https://github.com/adieladaniel/FinnBot-Financial-AI-Analytics-Engine',
  },
  {
    id: 'ieee-oncovision',
    company: 'IEEE Bangalore Section',
    role: 'Artificial Intelligence Intern — OncoVision, Early Cancer Detection',
    location: 'Bengaluru, India',
    startDate: 'Apr 2025',
    endDate: 'Jul 2025',
    bullets: [
      'Developed a dual-output deep learning model using EfficientNetB0 to classify eight cancer types and detect malignancy from histopathological images.',
      'Achieved 97.99% accuracy in cancer classification and 98.13% in malignancy detection through transfer learning, regularization, and two-phase training.',
      'Ran systematic model experimentation and performance evaluation (accuracy, precision, recall) across transfer learning configurations.',
    ],
    tech: ['Python', 'TensorFlow', 'EfficientNetB0', 'Transfer Learning', 'Deep Learning'],
    link: 'https://github.com/adieladaniel/OncoVision',
  },
];
