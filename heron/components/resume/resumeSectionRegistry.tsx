import type { ComponentType } from "react";
import type { ResumeDocument } from "@/lib/resume/types";
import { SECTION_LABELS, type StandardSectionId } from "@/lib/resume/defaults";
import type { SectionEditorProps } from "@/components/admin/resumeEditorShared";
import { WorkSectionView, WorkSectionEditor } from "./sections/WorkSection";
import { ProjectsSectionView, ProjectsSectionEditor } from "./sections/ProjectsSection";
import { SkillsSectionView, SkillsSectionEditor } from "./sections/SkillsSection";
import { EducationSectionView, EducationSectionEditor } from "./sections/EducationSection";
import {
    CertificatesSectionView,
    CertificatesSectionEditor
} from "./sections/CertificatesSection";

export type ResumeSectionDef = {
    label: string;
    View: ComponentType<{ doc: ResumeDocument }>;
    Editor: ComponentType<SectionEditorProps>;
    /** True when the section holds no content and should be skipped on render. */
    isEmpty: (doc: ResumeDocument) => boolean;
};

export const RESUME_SECTION_REGISTRY: Record<StandardSectionId, ResumeSectionDef> = {
    work: {
        label: SECTION_LABELS.work,
        View: WorkSectionView,
        Editor: WorkSectionEditor,
        isEmpty: (doc) => doc.work.length === 0
    },
    projects: {
        label: SECTION_LABELS.projects,
        View: ProjectsSectionView,
        Editor: ProjectsSectionEditor,
        isEmpty: (doc) => doc.projects.length === 0
    },
    skills: {
        label: SECTION_LABELS.skills,
        View: SkillsSectionView,
        Editor: SkillsSectionEditor,
        isEmpty: (doc) => doc.skills.length === 0
    },
    education: {
        label: SECTION_LABELS.education,
        View: EducationSectionView,
        Editor: EducationSectionEditor,
        isEmpty: (doc) => doc.education.length === 0
    },
    certificates: {
        label: SECTION_LABELS.certificates,
        View: CertificatesSectionView,
        Editor: CertificatesSectionEditor,
        isEmpty: (doc) => doc.certificates.length === 0
    }
};
