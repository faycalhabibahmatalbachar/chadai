# App v2 — audit senior + design system unifié (niveau startup)

## 1. Audit des pages actuelles (toumaiai.com)

**Constat n°1 — schisme d'identité (bloquant).** La landing v3 a une identité
éditoriale forte (ivoire/terracotta/Fraunces) mais l'application (/chat,
/settings, /agent, /library, /login) tourne encore sur la palette
bleu-nuit/violet (#0a0e27 / #6c63ff) — le look « template Tailwind » par
défaut. Cliquer « Ouvrir Toumaï AI » donne l'impression de changer de
produit. Google/OpenAI/Anthropic ont UNE identité, de la landing au produit.

**Constat n°2 — bug de thème clair.** 35+ occurrences de `hover:bg-white/5`
dans l'app : en thème clair, survol blanc sur fond blanc = aucun retour
visuel. Bug réel, pas une opinion.

**Constat n°3 — violets codés en dur.** 3 endroits (`ProfileTab`,
`PreferencesTab` ×2) utilisent `rgba(108,99,255,…)` au lieu du jeton —
cassent toute retinte.

**Constat n°4 — /chat sans moment d'accueil.** L'état vide se résume à un
petit « Bonsoir ». Claude/Gemini ouvrent sur un grand accueil typographique
personnalisé + suggestions d'action. C'est LE moment de personnalité du
produit.

**Constat n°5 — /settings** : structure récente solide (carte profil, grille
connecteurs) mais icônes d'onglets en emoji (👤⚙️🔌🛟) — un produit sérieux
utilise des icônes monochromes dessinées.

**Constat n°6 — /agent, /library** : fonctionnels, hériteront proprement de
la nouvelle palette (tout passe par les variables CSS — bonne architecture,
rien à réécrire).

## 2. Design (maquette validée)

Maquette [docs/design/app-v2.html](design/app-v2.html) — chat clair + sombre
côte à côte, validée dans le navigateur :

| Jeton | Sombre (défaut) | Clair |
|---|---|---|
| `--primary` | `#D97757` | `#C2562F` |
| `--primary-light` | `#E8956F` | `#D97757` |
| `--primary-dark` | `#B85C3E` | `#9C4526` |
| `--accent` / `--thinking` | `#D9A441` (or) | `#D9A441` |
| `--background` | `#211D18` | `#FAF7F2` |
| `--surface` | `#2A251F` | `#FFFFFF` |
| `--card` | `#322C25` | `#F3EFE7` |
| `--border` | `#3F382F` | `#E5DFD3` |
| `--text-primary` | `#EDE7DB` | `#1F1B16` |
| `--text-secondary` | `#B5AC9C` | `#5C564B` |
| `--text-tertiary` | `#857C6B` | `#98907F` |
| `--hover` (nouveau) | `rgba(237,231,219,.07)` | `rgba(31,27,22,.06)` |

- Les dégradés avatar `--primary → --thinking` deviennent terracotta→or :
  exactement les couleurs du logo.
- Fraunces chargée globalement (layout) : accueil du chat et titres d'auth
  en serif ; le reste de l'app reste en sans (lisibilité).

## 3. Plan d'implémentation

1. `app/globals.css` — remplacer la palette globale (sombre + clair),
   ajouter `--hover`.
2. `app/layout.tsx` — charger Fraunces (`--font-display`) au niveau racine ;
   retirer le chargement local de la landing.
3. Remplacement mécanique `hover:bg-white/5` → `hover:bg-[var(--hover)]`
   (+ `focus-within:`) dans toute l'app ; les `bg-white/10` du lightbox
   image (fond noir) restent inchangés.
4. Purger les 3 `rgba(108,99,255,…)` → `color-mix(in srgb, var(--primary)
   12%, transparent)`.
5. `/chat` état vide → accueil serif « {Bonsoir}, *{prénom}.* » + sous-titre
   + 4 puces de suggestion qui préremplissent la saisie (capacités réelles :
   expliquer, générer une image, coder, résumer un document).
6. `/settings` — icônes d'onglets emoji → SVG monochromes.
7. Vérification navigateur de chaque page (clair + sombre), `tsc`, build,
   commit, push.

## 4. Ce qui ne change PAS (et pourquoi)

- La structure des pages (sidebar, onglets settings, launcher agent) — déjà
  saine, revalidée cette session ; le problème était la peau, pas le squelette.
- Les verts/rouges de statut — déjà des jetons, lisibles sur fond chaud.
- Aucun contenu inventé, aucune fonctionnalité annoncée non livrée.
