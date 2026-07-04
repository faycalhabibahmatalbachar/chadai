# Plan de refonte de la page d'accueil — style startup SaaS

## 1. Ce que propose la maquette ChatGPT

Structure observée (dans l'ordre) :

1. Navbar sombre : logo, liens (Accueil, Fonctionnalités, Modèles, Tarifs,
   Développeurs, Ressources), Connexion + CTA "Commencer gratuitement".
2. Hero : badge "NOUVEAU — Toumai Voice", titre + sous-titre, deux CTA
   ("Commencer gratuitement" / "Ouvrir Toumai AI"), et à droite une vraie
   maquette de conversation (fenêtre de chat avec sidebar, bulle utilisateur,
   réponse IA, actions copier/régénérer/like).
3. Barre de confiance "Réduit par des milliers d'utilisateurs" avec logos
   GitHub / Hugging Face / Meta / Google Cloud / Vercel / AWS / Microsoft.
4. Grille de fonctionnalités (6 cartes) : Conversation naturelle,
   Développement, Documents, Recherche intelligente, Vision & Images, Voix
   temps réel.
5. "Conçu pour tous les profils" : 5 cartes persona (Développeurs, Étudiants,
   Entreprises, Chercheurs, Créateurs) avec mini-mockup visuel par carte.
6. "Choisissez le modèle adapté à votre tâche" : cartes modèles (Sao, Sao
   Code, Sao Vision, Sao Reason).
7. Section mode vocal dédiée : liste de points forts + visuel d'onde
   circulaire animée + démo de conversation vocale à droite.
8. Bandeau CTA final + footer multi-colonnes (Produit, Développeurs,
   Ressources, Entreprise, Légal) avec sélecteur langue/thème.

## 2. Ce qu'on adapte, ce qu'on écarte

**À reprendre tel quel** (bon pattern SaaS, aucun problème d'honnêteté) :
- Structure globale : hero → confiance → fonctionnalités → personas → modèles
  → voix → CTA final → footer riche. Bien plus convaincant que notre simple
  hero + grille actuelle ([app/page.tsx](app/page.tsx)).
- La maquette de conversation en direct dans le hero (on a déjà
  `TypewriterDemo`, à faire évoluer vers un rendu plus proche d'une vraie
  fenêtre de chat avec sidebar miniature).
- Les cartes persona avec mini-mockup — bon moyen de montrer la polyvalence
  sans mur de texte.
- La section vocale dédiée avec anneau animé — on a déjà construit cet
  anneau dégradé pour `VoiceModeOverlay`, réutilisable ici en version
  statique/décorative.

**À exclure ou remplacer — "on ne ment pas" :**
- **La barre de logos GitHub/Meta/Google Cloud/Vercel/AWS/Microsoft** laisse
  entendre que ces entreprises utilisent ou sponsorisent Toumaï AI, ce qui
  est faux. Je ne mettrai pas ces logos. Alternative honnête : soit on
  retire complètement cette barre, soit on la remplace par quelque chose de
  vrai et vérifiable (ex : "Hébergé sur Render, Cloudflare, Supabase" —
  outils qu'on utilise réellement en interne — ou simplement l'omettre tant
  qu'on n'a pas de vrais utilisateurs/clients à citer).
- **Les 4 cartes "modèle"** (Sao / Sao Code / Sao Vision / Sao Reason) : chez
  nous il n'existe que 2 modèles réels exposés (Sao 4, Toumaï 5 — voir
  `ModelSelector.tsx`). Je garde 2 cartes, pas 4, pour rester exact.
- **"Interruption intelligente"** dans les points forts vocaux : pas encore
  implémenté (l'utilisateur ne peut pas encore couper la parole de Toumaï en
  cours de synthèse). Je le marque "à venir" plutôt que de l'annoncer comme
  acquis, ou je le retire jusqu'à implémentation réelle.
- **"Futur avatar animé"** : passe en "à venir" — cohérent avec l'échange
  qu'on vient d'avoir sur les avatars (VRM/Live2D), qui n'est pas encore
  construit.

## 3. Plan de mise en œuvre (si on lance l'implémentation)

1. `components/Navbar.tsx` — ajouter liens Fonctionnalités/Modèles/Tarifs/
   Développeurs (ancres vers les sections de la page, pas de nouvelles
   routes pour l'instant).
2. `app/page.tsx` — restructurer en sections : Hero (existant, léger
   ajustement du badge "Nouveau"), Fonctionnalités (6 cartes, contenu déjà
   réel), Personas (nouveau), Modèles (2 cartes réelles), Voix (nouveau,
   réutilise l'anneau de `VoiceModeOverlay`), CTA final, Footer enrichi.
3. Nouveau composant `components/landing/PersonaCard.tsx` et
   `components/landing/VoiceShowcase.tsx` pour garder `page.tsx` lisible.
4. Contenu 100% réel : aucune fonctionnalité listée qui ne soit pas déjà
   livrée et testée, aucun chiffre d'utilisateurs inventé.
5. Test navigateur (desktop + mobile), typecheck, build, avant commit/push.

## 4. Décision à prendre

Le plan ci-dessus est prêt à être implémenté directement (aucune permission
supplémentaire nécessaire de mon côté) — dites-moi si vous voulez que je
lance la construction maintenant, ou si vous voulez d'abord ajuster la
liste des sections/contenu ci-dessus.
