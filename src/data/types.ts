export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type MilestoneType =
  | 'hero'
  | 'education'
  | 'internship'
  | 'project'
  | 'skills'
  | 'coding-stats'
  | 'certifications'
  | 'contact';

export interface Milestone {
  id: string;
  type: MilestoneType;
  order: number;
  title: string;
  dateRange: string;
  /** 0..1 progress window along the scroll track this milestone owns */
  scrollRange: [number, number];
  /** hand-authored spine control point */
  anchor: Vec3;
  /** decorative node count for this cluster */
  density: number;
  /** 0 = dim/early, 1 = bright/current */
  brightness: number;
  accentColor: string;
  lookAtOverride?: Vec3;
}

export interface GraphNode {
  id: string;
  milestoneId: string;
  position: Vec3;
  color: string;
  size: number;
  brightness: number;
}

export interface GraphEdge {
  a: GraphNode;
  b: GraphNode;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface EducationEntry {
  institution: string;
  detail: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  milestoneId: string;
}

export interface Internship {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  tech: string[];
  milestoneId: string;
  /** Optional — case study, write-up, or repo for this internship's work. */
  link?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  tech: string[];
  startDate: string;
  endDate: string;
  bullets: string[];
  link?: string;
  repo?: string;
  milestoneId: string;
  geometryVariant: 'scholarsync' | 'bankms';
}

export type SkillCategory = 'languages' | 'frameworks' | 'ai-ml' | 'tools' | 'concepts';

export interface Skill {
  name: string;
  category: SkillCategory;
}

export type ProficiencyTier = 'advanced' | 'intermediate' | 'fundamental';

export interface CodingTopic {
  name: string;
  count: number;
  tier: ProficiencyTier;
}

export interface CodingLanguageStat {
  name: string;
  solved: number;
}

export interface CodingStats {
  totalSolved: number;
  topics: CodingTopic[];
  languages: CodingLanguageStat[];
  codolioUrl: string;
  leetcodeUrl?: string;
  milestoneId: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface ContactInfo {
  email: string;
  github: string;
  githubUrl: string;
  linkedin: string;
  linkedinUrl: string;
  resumeUrl: string;
}

export interface Profile {
  name: string;
  shortName: string;
  headline: string;
  bio: string;
  location: string;
  /** Rotates in the hero's role ticker. */
  roles: string[];
}
