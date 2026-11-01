# Master Agent Delegation Framework

This document specifies the multi-agent delegation matrix and coordination protocol for AI-assisted engineering on Baithak.

---

## 1. Multi-Agent Delegation Hierarchy

```
                      ┌─────────────────────────┐
                      │    Human Product Lead   │
                      └────────────┬────────────┘
                                   │ User Request / Strategic Goal
                                   ▼
                      ┌─────────────────────────┐
                      │     Product Manager     │
                      │  (Scope & Requirements) │
                      └────────────┬────────────┘
                                   │ PRD & Acceptance Criteria
                                   ▼
                      ┌─────────────────────────┐
                      │   Engineering Manager   │
                      │  (Pacing & Risk Matrix) │
                      └────────────┬────────────┘
                                   │ Execution Milestones
                                   ▼
                      ┌─────────────────────────┐
                      │     Staff Engineer      │
                      │  (Architecture & ADRs)  │
                      └────────────┬────────────┘
                                   │ Architectural Directives
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐
       │ Anti-Duplication Agent│       │ Specialized Engineers │
       │ (Code Index & Reuse)  │       │ (Frontend / ASR / DB) │
       └───────────┬───────────┘       └───────────┬───────────┘
                   │                               │
                   └───────────────┬───────────────┘
                                   │ Pull Request / Code Change
                                   ▼
                   ┌───────────────────────────────┐
                   │    Verification & Security    │
                   │  - QA & Integration Tester    │
                   │  - CSO Security Auditor       │
                   └───────────────┬───────────────┘
                                   │ Signed Off
                                   ▼
                   ┌───────────────────────────────┐
                   │  Distribution & Visibility    │
                   │  - SEO Specialist             │
                   │  - Documentation Writer       │
                   └───────────────────────────────┘
```

---

## 2. Agent Routing & Handoff Matrix

| Incoming Task | Primary Agent | Supporting Agents | Handoff Artifact |
|---|---|---|---|
| New feature idea / user feedback | Product Manager | Engineering Manager | PRD & Acceptance Checklist |
| Architecture change / refactor | Staff Engineer | Anti-Duplication, CSO | Architecture Decision Record (ADR) |
| Sprint delivery & task breakdown | Engineering Manager | Product Manager, Staff | Implementation Checklist |
| Implementing components / routes | Specialized Engineer | Anti-Duplication Agent | Git Commit & Typecheck |
| Edge case / test coverage | QA & Integration Tester | Staff Engineer | Vitest Test Suite (`*.test.ts`) |
| Vulnerability & secret review | CSO Auditor | Staff Engineer | Security Audit Report |
| Web visibility & discoverability | SEO Specialist | Product Manager | Meta tags, Sitemap, JSON-LD |
| Documentation & guides | Documentation Writer | Staff Engineer | Markdown Guides (`docs/`) |

---

## 3. Operational Protocol for AI Prompts

When invoking an agent workflow:
1. **Declare Persona**: State the active role and primary constraint upfront.
2. **Consult Capability Index**: Check `docs/agents/CODE_INDEX.md` before generating any new functions or abstractions.
3. **Apply Associated Skills**: Cross-reference engineering skills in `docs/skills/` (UI/UX, Next.js, TypeScript, Distributed Systems, Testing, Security).
4. **Enforce Boundary Invariants**: Ensure client-server separation, Zod validation, and zero em-dash compliance.
5. **Handoff Verification**: No pull request is merged without verification from QA and CSO Auditor.

