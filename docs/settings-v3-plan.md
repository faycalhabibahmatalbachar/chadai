# Paramètres v3 — console « grande entreprise » + parité mobile

## 0. Méthode

Demande : page Paramètres professionnelle niveau Google/OpenAI/Claude, avec
toutes les personnalisations de l'app mobile, connecteurs fonctionnels, et
rebrand de la page de retour OAuth (« Vous pouvez revenir dans ChadGPT »).
Claude Design (DesignSync) restant inaccessible ici (auth interactive),
même méthode que les refontes précédentes : maquette HTML haute-fidélité
([docs/design/settings-v3.html](design/settings-v3.html)) validée dans le
navigateur → ce plan → implémentation.

## 1. Audit de la page actuelle

- Structure « onglets + formulaires empilés max-w-lg » : correcte mais
  artisanale — les consoles pro (Google Account, paramètres Claude/OpenAI)
  utilisent des **rangées** : libellé + description à gauche, contrôle à
  droite, groupées en panneaux hairline.
- Personnalisations du mobile absentes du web : **sélection de voix TTS**
  (catalogue `/preferences/voices` : Vivienne, Rémy, Denise, Henri, Éloïse,
  voix arabes… avec échantillon jouable), **vitesse de voix**, thème dans la
  page (pas seulement l'icône du header), langue de l'assistant.
- Page de callback OAuth Google : HTML brut bleu nuit « revenir dans
  ChadGPT » — hors marque et hors palette.

## 2. Design (maquette validée)

Console à deux colonnes, palette chaude v2 :

- **Navigation gauche** : carte identité (avatar dégradé terracotta→or, nom,
  formule) puis sections — Général, Personnalisation, Apparence, Voix,
  Notifications, Connecteurs, séparateur, Aide & Support. Icônes SVG
  monochromes.
- **Contenu** : titre de section + sous-titre, puis panneaux
  (`--surface`, bord `--line`, rayon 14px) composés de rangées :
  - texte : input aligné à droite (nom de l'assistant, instructions) ;
  - choix : contrôle segmenté (ton, taille de texte, thème) ;
  - booléens : interrupteurs (notifications) ;
  - voix : liste avec bouton ▶ (échantillon réel via `/voice/synthesize`),
    libellé + description du catalogue, radio de sélection, badge
    « Recommandée ».
- **Connecteurs** : la grille fonctionnelle existante (Google/Mail/WhatsApp/
  Météo + recherche + journal d'activité) est conservée telle quelle — elle
  marche, seul le conteneur adopte le nouveau shell.

## 3. Périmètre fonctionnel (réel uniquement)

| Fonctionnalité mobile | Web v3 | Source backend |
|---|---|---|
| Nom de l'assistant | ✔ rangée texte | `PUT /preferences` `ai_name` |
| Ton | ✔ segmenté | `ai_tone` |
| Instructions persona | ✔ textarea | `ai_persona` |
| Sélection de voix + écoute | ✔ NOUVEAU | `GET /preferences/voices` + `POST /voice/synthesize` |
| Vitesse de voix | ✔ NOUVEAU segmenté (0.75×/1×/1.25×) | `tts_speed` |
| Thème clair/sombre/système | ✔ NOUVEAU dans la page | contexte thème local |
| Taille du texte | ✔ segmenté | `font_size` |
| Notifications (suggestions/WA/agenda) | ✔ interrupteurs | `notif_*` |
| Profil (photo, nom, email, formule, usage) | ✔ section Général | `/user/profile`, `/user/usage` |
| Connecteurs fonctionnels | ✔ déjà en prod, conservés | `/google`, `/mail`, `/whatsapp` |
| Déconnexion | ✔ section Général | contexte auth |

Rien d'affiché qui ne soit pas branché sur un vrai endpoint.

## 4. Backend

- `routers/google.py` `/google/callback` : page de confirmation redessinée
  aux couleurs Toumaï AI (charbon chaud, coche verte SVG, « Vous pouvez
  fermer cette fenêtre et revenir dans Toumaï AI »), fermeture auto après 4s.
- Note : l'avertissement Google « n'a pas validé cette application » vient
  de l'état « en test » de l'écran de consentement OAuth — cela se règle
  uniquement dans la Google Cloud Console (publier l'application ou passer
  la vérification), pas dans le code.

## 5. Fichiers web

- `app/settings/page.tsx` — nouveau shell (nav sections + rendu par section).
- `components/settings/GeneralSection.tsx` (profil + compte + usage).
- `components/settings/PersonalizationSection.tsx` (ai_name, ton, persona).
- `components/settings/AppearanceSection.tsx` (thème, taille de texte).
- `components/settings/VoiceSection.tsx` (catalogue + lecture d'échantillon
  + vitesse).
- `components/settings/NotificationsSection.tsx`.
- `ConnectorsTab` conservé (renommé visuellement « Connecteurs »).
- `SupportTab` conservé.
- `lib/preferences-api.ts` — `listVoices()`.

## 6. Vérification

`tsc` + build, test navigateur de chaque section (clair + sombre), lecture
réelle d'un échantillon de voix, sauvegarde effective des préférences
(PUT), commit + push des deux dépôts.
