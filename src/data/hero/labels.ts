import type { HeroLabel } from './types';

/**
 * What each knife tool stands for: one thing I build with, and the project that
 * proves it. `note` is the short caption beside the tool in the opening scene;
 * `project` and `proof` fill the card shown when the knife sits beside the About
 * text. Every claim is taken from the project write-ups in projects.ts.
 */
export const knifeLabels: Record<string, HeroLabel> = {
  L_blade: {
    name: 'RAG',
    note: 'Answers from your own data',
    project: 'Obsidian RAG Assistant',
    proof: 'Retrieves, retries a weak search up to three times, and cites the notes it answered from. Runs fully on local models.',
  },
  L_saw: {
    name: 'Evals',
    note: 'Tests that catch regressions',
    project: 'OneForAll Agent',
    proof: '771 automated tests, and a 280-run load test that passed through a worker kill and an API restart.',
  },
  L_driver: {
    name: 'Agents',
    note: 'Plan, act, verify',
    project: 'OneForAll Agent',
    proof: 'Plans, drives a real browser, pauses for a human before any write, then re-checks the real systems before a run counts as done.',
  },
  L_opener: {
    name: 'Prompting',
    note: 'Prompts that hold up',
    project: 'PromptSense AI',
    proof: 'Scores a prompt on eight quality dimensions and rewrites it seven ways, with a benchmark harness to see if it helped.',
  },
  R_serrated: {
    name: 'Multimodal',
    note: 'Images, labs and text',
    project: 'MedReasonAI',
    proof: 'Fuses chest X-rays, lab values and radiology text into one diagnosis model, with an explanation for each modality.',
  },
  R_file: {
    name: 'Explainability',
    note: 'Why it decided',
    project: 'Prognix',
    proof: 'Every failure prediction comes with the SHAP drivers behind it, so a hospital team can see why a device ranks first.',
  },
  R_awl: {
    name: 'APIs',
    note: 'FastAPI services',
    project: 'Prognix',
    proof: 'A FastAPI backend behind an 11-page React and TypeScript frontend, plus a tool-based maintenance agent.',
  },
  R_small: {
    name: 'Data',
    note: 'Pandas, DuckDB, SQL',
    project: 'MedReasonAI',
    proof: 'Linked 53,000+ chest X-ray studies to an 18 GB lab dataset with DuckDB, without loading it all into memory.',
  },
};
