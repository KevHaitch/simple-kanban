# Simple Kanban

> Simple kanban boards for small dev teams

A lightweight, real-time kanban board built with Vue 3 and Firebase. Designed for small development teams who want drag-and-drop task management without the bloat.

<!-- Screenshots coming soon — drop them here -->
<!-- ![Simple Kanban Screenshot](docs/screenshot.png) -->

## Features

- **Drag-and-drop columns** — Move tasks between Backlog, Ready, In Progress, Review, QA, and Done
- **Real-time sync** — Powered by Firestore; changes appear instantly for all collaborators
- **Board management** — Create and switch between multiple project boards
- **Task categories** — Color-coded labels to organize work by type
- **Assignees** — Assign tasks to team members with display name integration
- **Collaborators** — Invite others to your boards
- **Search** — Quickly find tasks across all columns
- **Changelog sidesheet** — Track what's changed
- **PWA support** — Install as a native app on desktop and mobile
- **Mobile-first** — Responsive design with breakpoint-aware layout
- **Google Auth** — Sign in with your Google account

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) |
| Build      | [Vite](https://vitejs.dev/)         |
| Database   | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Auth       | [Firebase Auth](https://firebase.google.com/docs/auth) (Google) |
| Styling    | [Tailwind CSS](https://tailwindcss.com/) v4 |
| Drag & Drop| [vuedraggable](https://github.com/SortableJS/vue.draggable.next) |
| UI Components | [Headless UI](https://headlessui.com/) + [Heroicons](https://heroicons.com/) |
| PWA        | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Firebase project](https://console.firebase.google.com/) with Firestore and Google Auth enabled

### Installation

```bash
# Clone the repo
git clone https://github.com/kevhaitch/simple-kanban.git
cd simple-kanban

# Install dependencies
npm install

# Set up Firebase config
cp src/firebase.example.js src/firebase.js
```

Edit `src/firebase.js` and replace the placeholder values with your Firebase project credentials. You can find these in your Firebase Console under **Project Settings > General > Your apps**.

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build locally
```

### Deploy Firestore Rules

The project includes security rules in `firestore.rules`. To deploy them:

```bash
# Install Firebase CLI (if you haven't already)
npm install -g firebase-tools

# Log in
firebase login

# Deploy rules
node deploy-rules.js
# — or —
firebase deploy --only firestore:rules
```

## Project Structure

```
src/
├── components/        # Vue components (TaskCard, DraggableColumn, etc.)
├── composables/       # Reusable logic (useBoards, useTasks, useAuth, etc.)
├── constants/         # Status definitions, messages
├── services/          # Firestore service layer
├── utils/             # Drag and search utilities
└── firebase.example.js  # Firebase config template
```

## Contributing

Contributions are welcome! Whether it's a bug fix, feature idea, or documentation improvement — we'd love your help.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up the dev environment and submitting PRs.

## License

[MIT](LICENSE) — use it, fork it, build something great.
