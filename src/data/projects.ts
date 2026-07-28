import type { Project } from './types';

// Most recent first (resume convention).
export const projects: Project[] = [
  {
    id: 'medreasonai',
    name: 'MedReasonAI',
    tagline: 'Agentic multimodal system fusing chest X-ray imaging, clinical labs, and radiology text for disease diagnosis.',
    tech: ['Python', 'PyTorch', 'DuckDB', 'spaCy', 'torchxrayvision'],
    startDate: 'Jul 2026',
    endDate: 'Present',
    bullets: [
      'Designing an agentic diagnostic assistant that fuses chest X-ray imaging, clinical lab values, and radiology text through an orchestrator-driven pipeline with belief-state tracking and cross-modality consistency checks.',
      'Engineered the data foundation for the pipeline: linked 53,000+ MIMIC-CXR chest X-ray studies to MIMIC-IV clinical/lab records via a custom subject-timestamp relational-join algorithm, using DuckDB to query an 18GB+ lab-events dataset without full in-memory loading.',
      'Built a custom negation-aware clinical NLP labeler (spaCy + negspacy) to cross-validate ICD diagnosis codes against radiology report text, producing a leakage-free, patient-stratified dataset of 15,453 samples.',
    ],
  },
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
];
