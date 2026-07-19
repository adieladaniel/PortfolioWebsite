export interface EducationEntry {
  institution: string;
  detail: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
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
