# FitLog Workout Tracker

A responsive bodybuilding workout tracker prepared for iPhone home-screen use. The repository contains a React and TypeScript web app, not a native Android or iOS app.

## Features

- Log workouts and sets, including warmups, drop sets, failure sets, RPE, and rest timers
- Build routines and browse or add exercises
- Track workout history, bodyweight, volume, estimated strength progress, and PRs
- Use plate-loading and one-rep-max calculators
- Export and import local data backups
- Install from Safari on iPhone and use the cached app shell offline after the first visit

## Local development

Requires Node.js 20.19+ or 22.12+.

1. `npm install --legacy-peer-deps`
2. `npm run dev`
3. `npm run build`

Workout data is stored in the browser's local storage and does not sync between devices. Export backups regularly.

## GitHub Pages

The included workflow builds and deploys to GitHub Pages when Pages is configured to use **GitHub Actions**. The repository can remain private, but page visibility depends on the GitHub plan and Pages access settings. Review those settings before enabling deployment if the app should not be publicly reachable.
