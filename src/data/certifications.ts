import type { Certification } from './types';

// Order is deliberate (set by Adiel): newest additions first, earlier ones last.
// Dates are optional; the EY and Anthropic PDFs carry none, so theirs come from Adiel.
export const certifications: Certification[] = [
  { name: 'AWS Academy Cloud Foundations', issuer: 'AWS Academy Graduate', date: 'Sep 2025' },
  { name: 'Generative AI: From Prompts to Partnership', issuer: 'LinkedIn Learning', date: 'Oct 2026' },
  { name: 'Claude Code in Action', issuer: 'Anthropic', date: 'Oct 2026' },
  { name: 'Configure and Test Basic Network Connectivity', issuer: 'Coursera', date: 'Feb 2025' },
  { name: 'AI Skills Passport', issuer: 'EY and Microsoft', date: 'Oct 2026' },
  { name: 'Prompt Engineering', issuer: 'Infosys Springboard', date: 'Sep 2026' },
  { name: 'Intro to Modern AI', issuer: 'Cisco Networking Academy', date: 'Oct 2026' },
  { name: 'Networking Essentials', issuer: 'Cisco Networking Academy', date: 'Feb 2025' },
  { name: 'Fundamentals of Operating Systems', issuer: 'Scaler', date: 'Jan 2025' },
];
