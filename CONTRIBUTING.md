# Contributing to Simple Kanban

Thanks for your interest in contributing! This project is a small, focused kanban board for dev teams, and we welcome improvements of all kinds — bug fixes, features, documentation, and tests.

## Getting Set Up

1. **Fork and clone** the repository:

   ```bash
   git clone https://github.com/<your-username>/simple-kanban.git
   cd simple-kanban
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Firebase:**

   ```bash
   cp src/firebase.example.js src/firebase.js
   ```

   Edit `src/firebase.js` with your own Firebase project credentials (Firestore + Google Auth enabled).

4. **Start the dev server:**

   ```bash
   npm run dev
   ```

## Submitting a Pull Request

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feat/your-feature
   ```

2. Make your changes with clear, focused commits.

3. Test locally — make sure the app builds and runs:

   ```bash
   npm run build
   ```

4. Push your branch and open a PR against `main`.

5. Describe what your PR does and why. Screenshots are appreciated for UI changes.

## Code Style

- **Vue 3 Composition API** with `<script setup>` — no Options API
- **Tailwind CSS** for styling — avoid custom CSS where Tailwind utilities suffice
- **Composables** for reusable logic (`src/composables/`)
- **Services** for Firestore operations (`src/services/`)
- Keep components small and focused

## What to Work On

Check the [issues](https://github.com/kevhaitch/simple-kanban/issues) for ideas. Issues labeled `good first issue` are great starting points.

If you have a larger idea, open an issue first so we can discuss the approach before you invest time building it.

## Issue & PR Templates

We don't have formal templates yet — if you'd like to create them, that's a welcome contribution too!

## Code of Conduct

Be kind, be constructive, be respectful. We're all here to build something useful.
