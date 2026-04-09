import { z } from "zod";

const resumeExperienceSectionSchema = z.object({
  headline: z.string().min(1).max(320),
  bullets: z.array(z.string().min(1).max(520)).min(1).max(12),
});

const resumeProjectSectionSchema = z.object({
  name: z.string().min(1).max(200),
  bullets: z.array(z.string().min(1).max(520)).min(1).max(8),
});

/** Validated resume body from the model. Header (name, contact) is applied by the server renderer from profile. */
export const resumeDocumentSchema = z.object({
  summary: z.string().min(1).max(2200),
  skills: z.array(z.string().min(1).max(200)).min(3).max(45),
  experience: z.array(resumeExperienceSectionSchema).min(1).max(8),
  projects: z.array(resumeProjectSectionSchema).min(1).max(8),
  education: z.string().min(1).max(1400),
});

export type ResumeDocument = z.infer<typeof resumeDocumentSchema>;

/** Three body paragraphs between salutation and sign-off. */
export const coverLetterDocumentSchema = z.object({
  salutation: z.string().min(1).max(240),
  paragraphs: z.tuple([
    z.string().min(1).max(2000),
    z.string().min(1).max(2000),
    z.string().min(1).max(2000),
  ]),
  signOff: z.string().min(1).max(420),
});

export type CoverLetterDocument = z.infer<typeof coverLetterDocumentSchema>;
