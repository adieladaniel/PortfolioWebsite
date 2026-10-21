export type Side = 'top' | 'right' | 'bottom' | 'left';
export type NodeKind = 'default' | 'accent' | 'planned';

export interface DiagramNode {
  id: string;
  /** Top-left corner in the shared 560 x 320 diagram space. */
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sub?: string;
  kind?: NodeKind;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  /** Not built yet, or optional. */
  dashed?: boolean;
  /** A failure or retry path, drawn in the warm highlight colour. */
  warn?: boolean;
  /** Override which side of a node the edge leaves or enters; by default it follows their relative positions. */
  fromSide?: Side;
  toSide?: Side;
  /** How far a looping edge swings out from its sides, in diagram units. */
  bulge?: number;
}

export interface DiagramSpec {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/**
 * Pipeline diagrams, keyed by project id. Each one is drawn from what the
 * project's own README describes, nothing invented: stages, loops and the
 * "planned" parts are as the repos state them.
 */
export const diagrams: Record<string, DiagramSpec> = {
  'oneforall-agent': {
    nodes: [
      { id: 'task', x: 10, y: 139, w: 110, label: 'Task', sub: 'plain words' },
      { id: 'plan', x: 150, y: 139, w: 120, label: 'Plan', sub: 'criteria + steps' },
      { id: 'act', x: 300, y: 139, w: 120, label: 'Act', sub: 'browser, files, HTTP', kind: 'accent' },
      { id: 'gate', x: 300, y: 30, w: 120, label: 'Approval gate', sub: 'human OKs writes' },
      { id: 'verify', x: 440, y: 139, w: 110, label: 'Verifier', sub: 'read-only re-check' },
      { id: 'report', x: 440, y: 30, w: 110, label: 'Report', sub: 'with evidence' },
    ],
    edges: [
      { from: 'task', to: 'plan' },
      { from: 'plan', to: 'act' },
      { from: 'act', to: 'gate', label: 'writes' },
      { from: 'act', to: 'verify', label: 'claims success' },
      { from: 'verify', to: 'report', label: 'passed' },
      { from: 'verify', to: 'plan', label: 'audit failed', warn: true, fromSide: 'bottom', toSide: 'bottom', bulge: 70 },
    ],
  },

  medreasonai: {
    nodes: [
      { id: 'xray', x: 10, y: 30, w: 130, label: 'Chest X-ray', sub: 'image model' },
      { id: 'labs', x: 10, y: 139, w: 130, label: 'Blood labs', sub: 'tabular model' },
      { id: 'text', x: 10, y: 248, w: 130, label: 'Radiology text', sub: 'ClinicalBERT' },
      { id: 'fusion', x: 215, y: 139, w: 110, label: 'Fusion', sub: 'macro F1 0.61', kind: 'accent' },
      { id: 'pred', x: 380, y: 139, w: 170, label: 'Prediction', sub: 'Normal, Pneumonia, Cancer' },
      { id: 'explain', x: 380, y: 248, w: 170, label: 'Explain', sub: 'SHAP + Grad-CAM' },
      { id: 'agent', x: 380, y: 30, w: 170, label: 'Agent layer + RAG', sub: 'planned', kind: 'planned' },
    ],
    edges: [
      { from: 'xray', to: 'fusion' },
      { from: 'labs', to: 'fusion' },
      { from: 'text', to: 'fusion' },
      { from: 'fusion', to: 'pred' },
      { from: 'pred', to: 'explain' },
      { from: 'pred', to: 'agent', dashed: true },
    ],
  },

  prognix: {
    nodes: [
      { id: 'data', x: 10, y: 40, w: 130, label: 'Device data', sub: 'registry + synthetic' },
      { id: 'predict', x: 215, y: 40, w: 130, label: 'Predict', sub: 'LogReg, recall 0.60', kind: 'accent' },
      { id: 'explain', x: 420, y: 40, w: 130, label: 'Explain', sub: 'SHAP drivers' },
      { id: 'cwp', x: 420, y: 200, w: 130, label: 'Prioritise', sub: 'criticality-weighted', kind: 'accent' },
      { id: 'prescribe', x: 215, y: 200, w: 130, label: 'Prescribe', sub: 'hours-limited plan' },
      { id: 'prevent', x: 10, y: 200, w: 130, label: 'Prevent', sub: 'human review loop' },
    ],
    edges: [
      { from: 'data', to: 'predict' },
      { from: 'predict', to: 'explain' },
      { from: 'explain', to: 'cwp', label: 'CWP score' },
      { from: 'cwp', to: 'prescribe' },
      { from: 'prescribe', to: 'prevent' },
    ],
  },

  'promptsense-ai': {
    nodes: [
      { id: 'prompt', x: 10, y: 139, w: 100, label: 'Prompt', sub: 'your input' },
      { id: 'rules', x: 140, y: 50, w: 120, label: 'Rule scorer', sub: 'regex patterns' },
      { id: 'deberta', x: 140, y: 228, w: 120, label: 'DeBERTa-v3', sub: 'zero-shot semantic' },
      { id: 'blend', x: 300, y: 139, w: 110, label: 'Blend 50/50', sub: '8 quality scores', kind: 'accent' },
      { id: 'opt', x: 438, y: 139, w: 118, label: '7 rewrites', sub: 'CoT, few-shot, more' },
      { id: 'judge', x: 438, y: 250, w: 118, label: 'Gemini judge', sub: 'optional eval', kind: 'planned' },
    ],
    edges: [
      { from: 'prompt', to: 'rules' },
      { from: 'prompt', to: 'deberta' },
      { from: 'rules', to: 'blend' },
      { from: 'deberta', to: 'blend' },
      { from: 'blend', to: 'opt' },
      { from: 'opt', to: 'judge', dashed: true },
    ],
  },

  'obsidian-rag-assistant': {
    nodes: [
      { id: 'q', x: 10, y: 139, w: 100, label: 'Question', sub: '#tag filter' },
      { id: 'retrieve', x: 140, y: 139, w: 120, label: 'Retrieve', sub: 'Chroma + wikilinks', kind: 'accent' },
      { id: 'check', x: 300, y: 139, w: 110, label: 'Enough?', sub: 'model decides' },
      { id: 'answer', x: 440, y: 139, w: 116, label: 'Answer', sub: 'streamed + cited' },
      { id: 'reform', x: 200, y: 30, w: 120, label: 'Rewrite query', sub: 'retry up to 3x' },
      { id: 'save', x: 440, y: 250, w: 116, label: 'Save note', sub: 'back to vault' },
      { id: 'vault', x: 140, y: 250, w: 120, label: 'Vault', sub: 'markdown notes' },
    ],
    edges: [
      { from: 'q', to: 'retrieve' },
      { from: 'retrieve', to: 'check' },
      { from: 'check', to: 'answer', label: 'yes' },
      { from: 'check', to: 'reform', label: 'no', warn: true },
      { from: 'reform', to: 'retrieve', warn: true },
      { from: 'answer', to: 'save' },
      { from: 'save', to: 'vault', label: 'reindex' },
      { from: 'vault', to: 'retrieve', label: 'embed' },
    ],
  },

  scholarsync: {
    nodes: [
      { id: 'client', x: 10, y: 139, w: 110, label: 'Client', sub: 'branch / class' },
      { id: 'api', x: 155, y: 139, w: 120, label: 'Express API', sub: 'REST + CRUD', kind: 'accent' },
      { id: 'pool', x: 310, y: 139, w: 110, label: 'Pool', sub: 'connections' },
      { id: 'db', x: 450, y: 139, w: 106, label: 'MySQL', sub: 'on Railway' },
    ],
    edges: [
      { from: 'client', to: 'api', label: 'filters' },
      { from: 'api', to: 'pool' },
      { from: 'pool', to: 'db' },
    ],
  },
};
