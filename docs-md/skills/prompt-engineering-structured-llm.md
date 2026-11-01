# Prompt Engineering & Structured LLM Extraction Skill

Source: Derived from Google Gemini Structured Outputs and Anthropic Prompt Engineering Standards.

## Purpose & Scope
This skill governs prompt determinism, speaker diarization directives, schema-enforced JSON extraction, and hallucination prevention across Baithak.

---

## 1. Mathematical Schema Enforcement
- **Zero Free-Text Parsing:** Never ask an LLM to "reply in JSON" and then attempt `JSON.parse` on markdown code fences.
- Hand Zod schemas directly to AI SDK functions (`generateObject({ schema: analysisSchema, schemaName: 'MeetingAnalysis' })`).
- This guarantees the model's logits are constrained to the grammatical JSON schema at token generation time, completely eliminating formatting drift or broken quotes.

---

## 2. Field-Level Intent Injection
- Use `.describe()` on every Zod schema field. Field descriptions act as embedded system instructions guiding field extraction:
  - `task`: "The concrete action to be done, phrased as a short imperative."
  - `assignee`: "The person responsible, inferred from the conversation. Use exactly 'Unassigned' when no owner is stated or implied."
  - `dueDate`: "The due date or timeframe only if explicitly mentioned, copied as spoken (e.g. 'by Friday'). null when none is given. Never guess a date."
  - `priority`: "Urgency inferred from the language and stated consequences. Default to 'Medium' when there is no strong signal."

---

## 3. Speaker Diarization Directives
- Prompts for multimodal transcription must explicitly instruct timestamping and speaker attribution:
  - Format: `[MM:SS] Speaker N: ...`
  - Fallback: If single speaker, provide clean timestamps at natural sentence boundaries.
  - Silence Handling: If the audio contains no speech or ambient noise only, output exactly: `NO_SPEECH`.
