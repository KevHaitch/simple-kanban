# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Firestore Security Rules

This project uses Firestore security rules to control access to the database. The rules are defined in `firestore.rules`.

To deploy the rules, you need to have the Firebase CLI installed:

```bash
npm install -g firebase-tools
```

Then, log in to Firebase:

```bash
firebase login
```

Finally, deploy the rules:

```bash
node deploy-rules.js
```

Or manually:

```bash
firebase deploy --only firestore:rules
```

## User Display Names

The application stores user display names in Firestore to show them in the UI. When a user logs in, their display name is stored in the `userDisplayNames` collection. This allows the application to show the first name of assignees in task cards.
