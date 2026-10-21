import type { HeroLabel } from './types';

/** What each knife tool stands for: a tool of the trade, taken from the resume's skills. */
export const knifeLabels: Record<string, HeroLabel> = {
  L_blade: { name: 'RAG', note: 'Answers from your own data' },
  L_saw: { name: 'Vector search', note: 'ChromaDB, Qdrant' },
  L_driver: { name: 'Agents', note: 'LangGraph workflows' },
  L_opener: { name: 'Prompting', note: 'Prompts that hold up' },
  R_serrated: { name: 'LLM apps', note: 'Claude and open models' },
  R_file: { name: 'NLP', note: 'spaCy to transformers' },
  R_awl: { name: 'APIs', note: 'FastAPI services' },
  R_small: { name: 'Deep learning', note: 'PyTorch, TensorFlow' },
};
