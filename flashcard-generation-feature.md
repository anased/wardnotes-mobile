# WardNotes – AI Flashcard Generation (Phase 1) – Implementation Spec

## 0. Context & Goal

We’re adding a **Phase 1 MVP** for AI flashcard generation in the WardNotes **mobile app**.

### Goal

From the user’s perspective:

- From a **note detail screen**, they tap `✨ Generate flashcards`.
- A **modal** appears:
  - Choose deck
  - If no deck is available, allows the user to create a deck
  - Choose “how many cards”
  - (Optional) choose focus styles
- They tap **Generate** → AI generates flashcards from the **entire note**.
- They see a **review screen**:
  - Can inspect cards, select/deselect, edit front/back.
  - Then tap **Add to deck** to save.
- Success toast + optional CTA to start a quick review.

This is the MVP. No section detection or adaptive logic yet.

---

## 1. Assumptions

- Please review the files related to flash card generation feature in the web app directory. 
- The web app uses openAI API to generate the flash card. Please use the same prompt. 
- I want consistency between the web app and the mobile app.

---


