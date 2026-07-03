# ChadGPT — site officiel

Site web de ChadGPT (chadgpt.is-a.dev) : discutez avec ChadGPT directement
depuis votre navigateur — Sao 4 (code), Toumaï 5 (raisonnement avancé),
génération d'images, agent navigateur, connecteurs WhatsApp/Mail/Agenda.

Conçu et développé par Faycal Habib Ahmat.

## Stack

- Next.js 16 (App Router), export statique (`output: "export"`)
- Tailwind CSS
- Backend : même API que l'app mobile ChadGPT (`sayibiai_backend`)

## Développement local

```bash
npm install
npm run dev
```

## Build (export statique)

```bash
npm run build
# → dossier out/, prêt pour GitHub Pages
```

## Déploiement

Automatique via GitHub Actions (`.github/workflows/deploy.yml`) à chaque push
sur `main` → GitHub Pages. Domaine personnalisé configuré via `public/CNAME`
(`chadgpt.is-a.dev`, enregistré via [is-a.dev](https://is-a.dev)).
