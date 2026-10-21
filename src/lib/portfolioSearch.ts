import { certifications } from '@/data/certifications';
import { codingStats } from '@/data/codingStats';
import { contact } from '@/data/contact';
import { education } from '@/data/education';
import { internships } from '@/data/internships';
import { profile } from '@/data/profile';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';

/**
 * A small keyword search over the site's own data, used by the "Ask my
 * portfolio" box. It is not a language model: it scores chunks of the
 * portfolio's content against the question, answers from the best match,
 * and cites where each answer came from. If nothing matches it says so.
 */

type Kind = 'profile' | 'project' | 'internship' | 'education' | 'certification' | 'skills' | 'contact';

export interface Chunk {
  id: string;
  kind: Kind;
  title: string;
  /** One-line answer when this chunk is the best match. */
  summary: string;
  /** Extra supporting lines shown under the summary. */
  details: string[];
  /** Everything searchable about this chunk. */
  text: string;
  /** What counts as the chunk's name when ranking, if more than `title` (an internship is also its role). */
  rankTitle?: string;
  /** Page element to scroll to when the source chip is clicked. */
  sectionId: string;
  href?: string;
}

export interface Answer {
  summary: string;
  details: string[];
  sources: Array<{ title: string; sectionId: string; href?: string }>;
}

const range = (start: string, end: string) => (start === end ? start : `${start} – ${end}`);

const CATEGORY_LABEL: Record<string, string> = {
  languages: 'Languages and databases',
  frameworks: 'Frameworks and libraries',
  'ai-ml': 'AI and ML',
  tools: 'Developer tools',
  concepts: 'Core concepts',
};

function buildChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  chunks.push({
    id: 'profile',
    kind: 'profile',
    title: `About ${profile.shortName}`,
    summary: `${profile.name}: ${profile.headline} Based in ${profile.location}.`,
    details: [profile.bio],
    text: `${profile.name} ${profile.headline} ${profile.bio} ${profile.location} ${profile.roles.join(' ')} yourself bio background introduction`,
    sectionId: 'about-me',
  });

  for (const job of internships) {
    chunks.push({
      id: `internship-${job.id}`,
      kind: 'internship',
      title: job.company,
      rankTitle: `${job.company} ${job.role}`,
      summary: `${job.role} at ${job.company}, ${job.location} (${range(job.startDate, job.endDate)}).`,
      details: job.bullets,
      text: `${job.role} ${job.company} ${job.location} ${job.startDate} ${job.endDate} ${job.bullets.join(' ')} ${job.tech.join(' ')} internship work experience`,
      sectionId: 'experience',
      href: job.link,
    });
  }

  for (const project of projects) {
    chunks.push({
      id: `project-${project.id}`,
      kind: 'project',
      title: project.name,
      summary: `${project.name}: ${project.tagline}`,
      details: project.bullets,
      text: `${project.name} ${project.tagline} ${project.bullets.join(' ')} ${project.tech.join(' ')} ${project.startDate} ${project.endDate} project built`,
      sectionId: 'projects',
      href: project.link ?? project.repo,
    });
  }

  for (const entry of education) {
    chunks.push({
      id: `education-${entry.institution}`,
      kind: 'education',
      title: entry.institution,
      summary: `${entry.institution}: ${entry.detail}${entry.gpa ? `, ${entry.gpa}` : ''} (${range(entry.startDate, entry.endDate)}).`,
      details: [],
      text: `${entry.institution} ${entry.detail} ${entry.gpa ?? ''} ${entry.location ?? ''} ${entry.startDate} ${entry.endDate} education degree school university college studied graduating`,
      sectionId: 'education',
    });
  }

  for (const cert of certifications) {
    chunks.push({
      id: `cert-${cert.name}`,
      kind: 'certification',
      title: cert.name,
      summary: `${cert.name}, from ${cert.issuer}${cert.date ? ` (${cert.date})` : ''}.`,
      details: [],
      text: `${cert.name} ${cert.issuer} ${cert.date ?? ''} certificate certification course`,
      sectionId: 'education',
    });
  }

  const categories = [...new Set(skills.map((skill) => skill.category))];
  for (const category of categories) {
    const names = skills.filter((skill) => skill.category === category).map((skill) => skill.name);
    chunks.push({
      id: `skills-${category}`,
      kind: 'skills',
      title: CATEGORY_LABEL[category] ?? category,
      summary: `${CATEGORY_LABEL[category] ?? category}: ${names.join(', ')}.`,
      details: [],
      text: `${CATEGORY_LABEL[category] ?? category} ${names.join(' ')} skills technologies stack tools`,
      sectionId: 'about-me',
    });
  }

  const solved = `${codingStats.totalSolved}+ problems solved (${codingStats.languages.map((l) => `${l.solved} in ${l.name}`).join(', ')}).`;
  chunks.push({
    id: 'coding',
    kind: 'skills',
    title: 'Problem solving',
    summary: solved,
    details: [],
    text: `${solved} ${codingStats.topics.map((t) => t.name).join(' ')} dsa leetcode coding algorithms data structures problems solved`,
    sectionId: 'about-me',
    href: codingStats.codolioUrl,
  });

  chunks.push({
    id: 'contact',
    kind: 'contact',
    title: 'Contact',
    summary: `Email ${contact.email}, or find ${profile.shortName} on GitHub (${contact.github}) and LinkedIn (${contact.linkedin}).`,
    details: [],
    text: `${contact.email} ${contact.github} ${contact.linkedin} contact reach email hire resume cv github linkedin`,
    sectionId: 'contact',
  });

  return chunks;
}

const STOPWORDS = new Set(
  'a an the of in on at to for and or is are was were be do did does you your yours i me my mine what which who whom how when where why can could would should tell about with from have has had any it its this that these those there their them as by'.split(
    ' ',
  ),
);

/** Words that only say what kind of thing is being asked about, or ask for a list. */
const FRAMING = new Set('list show all every many much give name names top best main some other more one done'.split(' '));

/** Query words that also mean other words in the content. */
const SYNONYMS: Record<string, string[]> = {
  intern: ['internship', 'work', 'experience'],
  job: ['internship', 'experience', 'work'],
  work: ['internship', 'experience'],
  career: ['internship', 'experience'],
  hire: ['contact', 'email', 'resume'],
  reach: ['contact', 'email'],
  cv: ['resume'],
  gpa: ['cgpa'],
  grade: ['cgpa'],
  study: ['education', 'university', 'degree'],
  college: ['education', 'university'],
  degree: ['education', 'university'],
  certificate: ['certification'],
  course: ['certification'],
  built: ['project'],
  build: ['project'],
  made: ['project'],
  stack: ['skills', 'tools'],
  tech: ['skills', 'tools'],
  language: ['languages'],
  leetcode: ['problems', 'solved'],
  dsa: ['problems', 'solved'],
  llm: ['llm', 'generative', 'rag'],
  ai: ['ai', 'ml'],
};

const KIND_WORDS: Record<string, Kind> = {
  project: 'project',
  internship: 'internship',
  intern: 'internship',
  certificate: 'certification',
  certification: 'certification',
  cert: 'certification',
  skill: 'skills',
  education: 'education',
  contact: 'contact',
};

/** Just enough stemming to match plurals and common endings: certificates to certificate, building to build. */
function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (/(ss|us|is)$/.test(word)) return word;
  if (/(sses|xes|ches|shes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  return word;
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#.]+/g) ?? [])
    .map((word) => word.replace(/^\.+|\.+$/g, ''))
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
}

interface Index {
  chunks: Chunk[];
  counts: Array<Map<string, number>>;
  idf: Map<string, number>;
}

let cached: Index | null = null;

function getIndex(): Index {
  if (cached) return cached;
  const chunks = buildChunks();
  const counts = chunks.map((chunk) => {
    const map = new Map<string, number>();
    for (const token of tokenize(chunk.text)) map.set(token, (map.get(token) ?? 0) + 1);
    // Title words count extra, so asking for a project by name finds it first.
    for (const token of tokenize(chunk.rankTitle ?? chunk.title)) map.set(token, (map.get(token) ?? 0) + 3);
    return map;
  });
  const df = new Map<string, number>();
  for (const map of counts) for (const token of map.keys()) df.set(token, (df.get(token) ?? 0) + 1);
  const idf = new Map<string, number>();
  for (const [token, n] of df) idf.set(token, Math.log(1 + chunks.length / n));
  cached = { chunks, counts, idf };
  return cached;
}

const KIND_LABEL: Record<Kind, string> = {
  profile: 'About',
  project: 'Projects',
  internship: 'Internships',
  education: 'Education',
  certification: 'Certificates',
  skills: 'Skills',
  contact: 'Contact',
};

const toSource = (chunk: Chunk) => ({ title: chunk.title, sectionId: chunk.sectionId, href: chunk.href });

/** Answers a question from the portfolio's own content, or returns null when nothing in it matches. */
export function askPortfolio(question: string): Answer | null {
  const { chunks, counts, idf } = getIndex();
  const base = tokenize(question);
  if (base.length === 0) return null;

  const expanded = new Set(base);
  for (const token of base) for (const extra of SYNONYMS[token] ?? []) expanded.add(stem(extra));

  // "list my projects" style questions: nothing left once the kind word and
  // framing words are removed, so answer with the whole group.
  const kinds = new Set(base.map((token) => KIND_WORDS[token]).filter((kind): kind is Kind => Boolean(kind)));
  const specific = base.filter((token) => !KIND_WORDS[token] && !FRAMING.has(token));
  if (kinds.size === 1 && specific.length === 0) {
    const kind = [...kinds][0] as Kind;
    const group = chunks.filter((chunk) => chunk.kind === kind || (kind === 'skills' && chunk.kind === 'skills'));
    if (group.length === 1 && group[0]) {
      return { summary: group[0].summary, details: group[0].details, sources: [toSource(group[0])] };
    }
    if (group.length > 0) {
      return {
        summary: `${KIND_LABEL[kind]} (${group.length}): ${group.map((chunk) => chunk.title).join(', ')}.`,
        details: kind === 'skills' || kind === 'contact' ? group.map((chunk) => chunk.summary) : [],
        sources: group.slice(0, 6).map(toSource),
      };
    }
  }

  const scored = chunks
    .map((chunk, i) => {
      const map = counts[i];
      let score = 0;
      for (const token of expanded) {
        const tf = map?.get(token) ?? 0;
        if (tf > 0) score += (idf.get(token) ?? 0) * (1 + Math.log(tf));
      }
      // The words that were actually typed count for more than the guessed synonyms.
      for (const token of base) if ((map?.get(token) ?? 0) > 0) score += 0.5;
      if (kinds.has(chunk.kind)) score *= 1.4;
      return { chunk, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 1.2) return null;

  const strongest = scored.filter((entry) => entry.score >= best.score * 0.45).slice(0, 3);
  return {
    summary: best.chunk.summary,
    details: best.chunk.details.slice(0, 3),
    sources: strongest.map((entry) => toSource(entry.chunk)),
  };
}
