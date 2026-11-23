# APEX — Diecast Model Car Collection Manager

A fast, minimalist React + Vite web app for cataloging a diecast model car collection, designed to run locally or as an installed desktop PWA with direct `cars.json` disk sync.

## Features
- **The Showroom**: Left marque sidebar with live model counts, instant search across models/makers/years, scale filter pills (`1:18` to `1:64`), and inline edit access.
- **Libraries**: Manage standardized vehicle brands and diecast manufacturers.
- **Vehicle Intake & Editing**: Clean modal to register, edit, or delete vehicles (`Model`, `Marque`, `Maker`, `Scale`, `Year`).
- **Local Disk Sync (`cars.json`)**: Uses the browser's File System Access API to read from and auto-save directly to a `cars.json` file on your laptop, plus one-click JSON **Import** / **Export** backups.
- **Keyboard Shortcuts**: `1` (Showroom), `2` (Libraries), `N` (New Vehicle), `Esc` (Close modal).

## Getting Started
```bash
npm install
npm run dev
```
