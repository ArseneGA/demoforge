# 09 — Product Plan — Epics · Features · User Stories

> Généré le 2026-04-27 · Basé sur docs/00 à 08
> Convention US : **"En tant que [persona], je veux [capacité] afin de [bénéfice]."**
> Personas : **PMM** (Léa), **Owner** (CTO/Admin), **Viewer** (spectateur du lien partagé)

---

## Vue d'ensemble des phases

| Phase | Nom | Durée estimée | Objectif |
|---|---|---|---|
| **P0** | Foundation | ✅ Terminé | Scaffold, design system, UI, DB schema |
| **P1** | MVP V1 | ~8 semaines | Produit complet fonctionnel · 1er lien partageable |
| **P2** | V1.5 | ~5 semaines | Stripe, analytics, auto-rescan, team features |
| **P3** | V2 | ~10 semaines | Export vidéo, voix-off, branchements, GitLab |

---

## PHASE 0 — Foundation ✅

> Tout ce qui est déjà construit.

### E0.1 — Scaffold & design system ✅
- Next.js 15 App Router + TypeScript strict + Tailwind 4 + shadcn/ui
- Design tokens DemoForge (globals.css, brand/surface/agent tokens)
- Layout fonts (Plus Jakarta Sans + Geist + Geist Mono)
- Composants landing (Nav, Hero, HeroVisual, AgentsSection, WorkflowSection, PricingSection, CtaSection, Footer)

### E0.2 — Pages UI ✅
- `/` Landing complète (6 sections, fidèle wireframe)
- `/login` Auth (email+password, Google OAuth, split layout + mock agents)
- `/onboarding` Wizard 4 étapes (Source, Repo, Analyse avec terminal animé, Récap)
- `/dashboard` Dashboard projets (rail, KPIs, filtres, grille de cartes)
- `/chat` Chat 4 agents (3 panneaux, 8 types de messages, composer, right panel)
- `/storyboard` Éditeur (rail outils, preview + mock app, transport, inspector, steps strip)

### E0.3 — Infrastructure DB ✅
- 4 migrations Supabase (init schema, RLS, storage buckets, auth trigger org auto-création)
- 18 tables : orgs, org_members, invitations, github_installations, projects, routes, design_tokens, screen_specs, data_models, api_endpoints, code_chunks (pgvector), demos, steps, mocks, annotations, themes, assets, agent_messages, jobs, share_links, demo_views
- RLS helper function `user_org_ids()`
- Trigger `handle_new_user()` → auto-création Org + rôle owner au signup
- Realtime activé sur `agent_messages`, `jobs`, `demos`

---

## PHASE 1 — MVP V1

> **Objectif** : un utilisateur peut s'inscrire, connecter son repo GitHub, laisser les 4 agents scripter une démo, l'ajuster dans le storyboard, et partager un lien jouable.
> **SLA** : 30 minutes de signup à premier lien partageable.

---

### E1 — Authentication & Org Management

**Goal** : l'utilisateur crée son compte, une Org est créée automatiquement, il peut inviter des membres.

#### F1.1 — Email magic link
- US-001 : En tant que PMM, je veux recevoir un magic link par email afin de me connecter sans mot de passe.
- US-002 : En tant que PMM, je veux être redirigé vers `/onboarding` à ma première connexion afin de démarrer le setup immédiatement.
- US-003 : En tant que PMM, je veux être redirigé vers `/dashboard` aux connexions suivantes afin d'accéder directement à mes projets.

#### F1.2 — Google OAuth
- US-004 : En tant que PMM, je veux me connecter avec mon compte Google afin de ne pas avoir à créer un mot de passe.
- US-005 : En tant que PMM, je veux que mon nom soit pré-rempli depuis mon profil Google afin de gagner du temps à l'inscription.

#### F1.3 — Org auto-création & rôles
- US-006 : En tant que nouveau user, je veux qu'une Org personnelle soit créée automatiquement à ma première connexion afin de pouvoir démarrer sans configuration.
- US-007 : En tant qu'Owner, je veux voir mes membres avec leur rôle (owner/editor/viewer) afin de gérer les accès.
- US-008 : En tant qu'Owner, je veux modifier le rôle d'un membre afin d'ajuster ses permissions.

#### F1.4 — Invitation email
- US-009 : En tant que PMM (Case B), je veux inviter mon CTO par email afin qu'il connecte le GitHub App sans que je doive y accéder.
- US-010 : En tant qu'Owner invité, je veux recevoir un email avec un lien d'invitation afin d'accepter en un clic.
- US-011 : En tant que PMM, je veux voir un état "En attente d'install" afin de savoir que la GitHub App n'est pas encore connectée.
- US-012 : En tant que PMM, je veux être notifié quand l'Owner accepte et connecte la GitHub App afin de reprendre le setup.

#### F1.5 — Signout / session
- US-013 : En tant que user, je veux un bouton "Se déconnecter" afin de fermer ma session.
- US-014 : En tant que user, je veux rester connecté entre les sessions afin de ne pas me reconnecter à chaque visite.

---

### E2 — GitHub App Integration

**Goal** : connecter le repo du user à DemoForge de façon sécurisée, lecture seule.

#### F2.1 — GitHub App OAuth flow
- US-015 : En tant qu'Owner, je veux cliquer "Autoriser sur GitHub" afin de lancer le flow OAuth de la GitHub App.
- US-016 : En tant qu'Owner, je veux être redirigé vers le callback DemoForge après autorisation GitHub afin que l'installation soit enregistrée automatiquement.
- US-017 : En tant qu'Owner, je veux voir un message de confirmation afin de savoir que la GitHub App est installée.

#### F2.2 — Repo listing
- US-018 : En tant que PMM, je veux voir la liste des repos accessibles via la GitHub App afin de choisir celui à indexer.
- US-019 : En tant que PMM, je veux filtrer les repos par org et visibilité (public/privé) afin de trouver rapidement le bon projet.
- US-020 : En tant que PMM, je veux voir la branche par défaut et le dernier commit afin de choisir en connaissance de cause.

#### F2.3 — Monorepo support
- US-021 : En tant que PMM, je veux voir un dropdown de packages si un monorepo est détecté afin de choisir le frontend à scanner.
- US-022 : En tant que PMM, je veux voir quels formats de monorepo sont supportés (Turborepo, Nx, pnpm workspace) afin de vérifier la compatibilité.

#### F2.4 — Framework guard
- US-023 : En tant que PMM, je veux voir un message clair si mon framework n'est pas supporté (Vue, Svelte, etc.) afin de comprendre pourquoi le scan est bloqué.
- US-024 : En tant que PMM, je veux m'inscrire sur une waitlist framework-spécifique afin d'être notifié quand mon stack sera supporté.

---

### E3 — Scout — Repo Scan

**Goal** : Scanner le repo et persister tous les artefacts nécessaires à la génération de démo.

#### F3.1 — Inngest job scan.repo
- US-025 : En tant que système, je veux déclencher un job Inngest `scan.repo` au lancement de l'analyse afin de traiter le scan de façon asynchrone.
- US-026 : En tant que PMM, je veux voir la progression du scan en temps réel (terminal animé + %) afin de savoir que ça avance.
- US-027 : En tant que PMM, je veux que le scan continue en arrière-plan si je ferme le wizard afin de ne pas devoir rester sur la page.

#### F3.2 — AST parsing & route extraction
- US-028 : En tant que PMM, je veux que Scout détecte toutes les routes de mon app Next.js/React afin d'avoir un sitemap complet.
- US-029 : En tant que PMM, je veux que les routes dynamiques (`[id]`, `[...slug]`) soient détectées afin d'avoir un mapping fidèle.

#### F3.3 — Design token extraction
- US-030 : En tant que PMM, je veux que mes couleurs de marque (via Tailwind, CSS vars, ou theme.ts) soient extraites automatiquement afin que ma démo ressemble à mon vrai produit.
- US-031 : En tant que PMM, je veux que mon logo soit détecté depuis `public/` ou `app/icon.*` afin qu'il apparaisse dans la démo.
- US-032 : En tant que PMM, je veux que la lib UI de mon projet (shadcn, MUI, Chakra, etc.) soit identifiée afin que les composants soient rendus correctement.

#### F3.4 — Screen spec & data model inference (Claude)
- US-033 : En tant que PMM, je veux que la structure de chaque écran (layout, sections, données consommées) soit inférée par Claude afin que la démo soit fidèle à l'UI réelle.
- US-034 : En tant que Faker, je veux avoir les entités et leurs champs (depuis types TS, Zod, Prisma) afin de générer des données cohérentes avec le vrai schéma.

#### F3.5 — Backend summary MD
- US-035 : En tant que Faker, je veux un fichier `backend-summary.md` décrivant chaque endpoint en langage naturel afin de mocker les API fidèlement à leur sémantique réelle.

#### F3.6 — Embeddings Voyage AI
- US-036 : En tant que Scout (runtime), je veux que les chunks de code soient vectorisés (Voyage `voyage-3`) afin de pouvoir faire du retrieval sémantique au moment du brief.

#### F3.7 — Scan recap & validation
- US-037 : En tant que PMM, je veux voir le récap de l'analyse (routes, composants, stack, endpoints) afin de valider que Scout a bien compris mon projet avant de créer des démos.
- US-038 : En tant que PMM, je veux voir les parcours utilisateur inférés (A, B, C) afin de choisir le point de départ de ma première démo.

---

### E4 — Demo Management

**Goal** : créer, gérer et organiser les démos au niveau de l'Org.

#### F4.1 — Création démo
- US-039 : En tant que PMM, je veux cliquer "+ Nouvelle démo" depuis le dashboard afin d'accéder au chat de scripting.
- US-040 : En tant que PMM, je veux choisir un template (Onboarding, Feature launch, Pitch) afin de démarrer avec un script pré-structuré.
- US-041 : En tant que PMM, je veux dupliquer une démo existante afin de la réutiliser comme base pour une nouvelle.

#### F4.2 — Dashboard réel (données Supabase)
- US-042 : En tant que PMM, je veux voir mes vraies démos (depuis Supabase) dans le dashboard afin d'avoir un tableau de bord vivant.
- US-043 : En tant que PMM, je veux filtrer mes démos par statut (brouillon, en cours, publiée, review) afin de retrouver rapidement ce dont j'ai besoin.
- US-044 : En tant que PMM, je veux chercher une démo par nom afin de la retrouver dans une longue liste.

#### F4.3 — Cycle de vie démo
- US-045 : En tant que PMM, je veux archiver une démo obsolète afin de garder mon dashboard propre.
- US-046 : En tant que PMM, je veux supprimer un brouillon que je n'utilise plus afin de libérer mon quota de démos.
- US-047 : En tant que PMM, je veux savoir combien de démos publiées il me reste ce mois (quota) afin de gérer mon usage.

---

### E5 — Director — Script Generation

**Goal** : le PMM brief en chat et Director construit le storyboard étape par étape avec validation interactive.

#### F5.1 — Inngest function agents.run
- US-048 : En tant que système, je veux qu'un job Inngest `agents.run` soit déclenché à l'envoi du brief afin d'orchestrer les 4 agents de façon asynchrone.
- US-049 : En tant que système, je veux que Director, Faker et Narrator écrivent leurs messages dans `agent_messages` afin que le client reçoive le stream via Supabase Realtime.

#### F5.2 — Director chat streaming
- US-050 : En tant que PMM, je veux que Director streame le storyboard étape par étape afin de valider chaque étape sans attendre le script complet.
- US-051 : En tant que PMM, je veux répondre "ok" ou "skippe l'étape 3" en chat afin que Director adapte le script à la volée.
- US-052 : En tant que PMM, je veux que Director me rappelle les contraintes (durée, persona, format) afin que le script reste cohérent avec mon brief.

#### F5.3 — Scout retrieval (pgvector)
- US-053 : En tant que Director, je veux appeler Scout via tool use (Anthropic) pour récupérer les routes pertinentes (top-K par similarité vectorielle) afin de scripter un parcours réaliste.
- US-054 : En tant que PMM, je veux voir les pages sélectionnées par Scout avec leur taux de pertinence afin de comprendre les choix de Director.

#### F5.4 — Storyboard JSON persisté
- US-055 : En tant que système, je veux que le storyboard final soit persisté dans `demos.storyboard` (JSONB) afin d'être accessible dans l'éditeur et le player.
- US-056 : En tant que système, je veux valider le storyboard avec un schéma Zod afin d'éviter des formats invalides en base.

#### F5.5 — Templates
- US-057 : En tant que PMM, je veux choisir "Feature launch" comme template afin que Director utilise le playbook adapté (problème → solution → proof → CTA).
- US-058 : En tant que PMM, je veux choisir "Onboarding produit" afin que le script suive le parcours guidé pour un nouveau client.
- US-059 : En tant que PMM, je veux choisir "Pitch investisseur" afin d'avoir un script avec hook fort + vision produit + traction.

---

### E6 — Faker — Mock Generation

**Goal** : générer des données cohérentes et des handlers MSW pour chaque démo.

#### F6.1 — Inngest step parallèle
- US-060 : En tant que système, je veux que Faker tourne en parallèle de Narrator (après Director) via Inngest `step.run` afin d'optimiser le temps de génération.

#### F6.2 — Génération de fixtures cohérentes
- US-061 : En tant que PMM, je veux que les données mockées restent cohérentes entre les étapes (même persona, mêmes KPIs qui s'additionnent) afin que la démo soit crédible.
- US-062 : En tant que PMM, je veux que Faker utilise le `backend-summary.md` de Scout afin que les mocks respectent les contraintes sémantiques réelles des API.
- US-063 : En tant que PMM, je veux que la locale française soit appliquée par défaut (noms, devises, dates) afin que les données aient l'air naturelles.

#### F6.3 — Bundle MSW
- US-064 : En tant que player, je veux charger un bundle de handlers MSW depuis Supabase afin d'intercepter tous les fetch de la mock app pendant la présentation.
- US-065 : En tant que PMM, je veux voir les latences mockées (120–340ms) afin que la démo ressemble à un vrai produit et non à un site statique.

#### F6.4 — Régénération
- US-066 : En tant que PMM, je veux un bouton "Régénérer les données" dans l'éditeur afin d'obtenir un nouveau set de fixtures sans repartir de zéro.
- US-067 : En tant que PMM, je veux configurer le volume de données par étape (5–10 lignes par défaut) afin d'adapter la densité à chaque écran.

---

### E7 — Narrator — Annotations

**Goal** : générer des annotations contextuelles (bulles d'écran) pour guider le spectateur.

#### F7.1 — Inngest step parallèle
- US-068 : En tant que système, je veux que Narrator tourne en parallèle de Faker afin de minimiser le temps total de génération.

#### F7.2 — Playbooks par template
- US-069 : En tant que PMM, je veux que Narrator suive le playbook "Feature launch" (problème/bénéfice/proof) afin que les annotations racontent une histoire.
- US-070 : En tant que PMM, je veux overrider le texte d'une annotation en chat afin de personnaliser le message sans régénérer tout.

#### F7.3 — Contraintes
- US-071 : En tant que PMM, je veux que Narrator place max 3 annotations par étape afin que l'écran ne soit pas surchargé.
- US-072 : En tant que PMM, je veux que les annotations restent sous 80 caractères afin qu'elles soient lisibles sur tous les écrans.

---

### E8 — Storyboard Editor (real data)

**Goal** : l'éditeur est branché sur les vraies données Supabase — lecture, sauvegarde, modif.

#### F8.1 — Chargement réel
- US-073 : En tant que PMM, je veux que le storyboard chargé soit le vrai storyboard de ma démo (depuis Supabase) afin d'éditer les bonnes données.
- US-074 : En tant que PMM, je veux voir les mocks et annotations réels de chaque étape dans l'inspecteur afin de les modifier.

#### F8.2 — Sauvegarde auto
- US-075 : En tant que PMM, je veux que mes modifications soient sauvegardées automatiquement afin de ne pas perdre mon travail.
- US-076 : En tant que PMM, je veux voir "Auto-sauvegardé · il y a Xs" afin d'avoir la confirmation que c'est enregistré.

#### F8.3 — Réordonner les étapes
- US-077 : En tant que PMM, je veux glisser-déposer les étapes dans le strip bas afin de réordonner le parcours.

#### F8.4 — CRUD étapes
- US-078 : En tant que PMM, je veux ajouter une étape vide afin de la remplir manuellement.
- US-079 : En tant que PMM, je veux supprimer une étape dont je n'ai pas besoin afin d'alléger le parcours.

#### F8.5 — Inspecteur fonctionnel
- US-080 : En tant que PMM, je veux changer le type d'action (click, type, nav, wait) d'une étape dans l'inspecteur afin de corriger le comportement.
- US-081 : En tant que PMM, je veux ajuster la durée d'une étape via un slider afin de calibrer le timing.
- US-082 : En tant que PMM, je veux modifier le texte d'une annotation dans l'inspecteur afin de personnaliser le message.

#### F8.6 — Theme editor
- US-083 : En tant que PMM, je veux overrider les couleurs extraites par Scout (couleur primaire, logo) afin que la démo reflète mon branding exact.
- US-084 : En tant que PMM, je veux créer un 2ème thème "dark" pour une même démo afin de proposer deux variantes visuelles.

#### F8.7 — Upload assets
- US-085 : En tant que PMM, je veux uploader un logo HD afin de remplacer le logo auto-extrait de moins bonne qualité.
- US-086 : En tant que PMM, je veux uploader un screenshot d'un graphe complexe afin de l'insérer comme image figée dans une étape.

#### F8.8 — Ask agents depuis l'éditeur
- US-087 : En tant que PMM, je veux ouvrir un mini-chat "Demander aux agents" depuis le storyboard afin de retoucher une séquence précise sans quitter l'éditeur.

---

### E9 — Demo Player & Share Links

**Goal** : le spectateur reçoit un lien et voit la démo jouer dans son browser — c'est le wow-moment.

#### F9.1 — Route publique `/d/[token]`
- US-088 : En tant que Viewer, je veux ouvrir un lien `demoforge.app/d/abc123` sans m'authentifier afin de voir la démo instantanément.
- US-089 : En tant que Viewer, je veux voir un message "Démo expirée" si le lien a expiré afin de comprendre pourquoi je ne peux pas l'ouvrir.

#### F9.2 — MSW initialization
- US-090 : En tant que player, je veux charger et initialiser MSW avec les handlers de la démo afin d'intercepter tous les appels API de la mock app.

#### F9.3 — Player engine
- US-091 : En tant que Viewer, je veux que la démo joue automatiquement (auto-advance) afin de ne rien avoir à faire.
- US-092 : En tant que Viewer, je veux cliquer "Suivant" manuellement (click-to-advance) afin de contrôler le rythme.
- US-093 : En tant que Viewer, je veux que les actions scriptées (highlight, type, navigate) se jouent dans l'ordre afin de comprendre le parcours produit.

#### F9.4 — Mock app renderer
- US-094 : En tant que Viewer, je veux voir une app qui ressemble au vrai produit (couleurs, logo, layout) afin de me projeter dans l'outil.
- US-095 : En tant que Viewer, je veux que les données affichées soient cohérentes (même persona, mêmes chiffres) afin que la démo soit crédible.

#### F9.5 — Annotations overlay
- US-096 : En tant que Viewer, je veux voir les annotations apparaître au bon moment (trigger_at_ms) afin que les points clés soient mis en valeur.
- US-097 : En tant que Viewer, je veux que les annotations disparaissent après leur durée configurée afin de ne pas polluer l'écran.

#### F9.6 — Share link creation
- US-098 : En tant que PMM, je veux générer un lien public en un clic afin de le partager immédiatement sur ma landing.
- US-099 : En tant que PMM, je veux générer un lien protégé par mot de passe afin de partager une démo sensible à un client spécifique.
- US-100 : En tant que PMM, je veux générer un lien team-only (auth Supabase) afin de partager une démo en revue interne.
- US-101 : En tant que PMM, je veux copier le lien en un clic (bouton copy) afin de le coller rapidement dans Slack ou Webflow.

#### F9.7 — Analytics basique
- US-102 : En tant que PMM, je veux voir le nombre de vues de ma démo afin de savoir si elle a été consultée.
- US-103 : En tant que PMM, je veux voir la durée moyenne de consultation afin de savoir si les gens regardent jusqu'au bout.
- US-104 : En tant que système, je veux enregistrer chaque `demo_view` (session_id, duration_ms, device) afin de nourrir l'analytics.

---

## PHASE 2 — V1.5

---

### E10 — Stripe Billing

**Goal** : monétiser avec des plans Free/Forge/Studio, gérer les quotas, abonnements et overages.

#### F10.1 — Configuration Stripe
- US-105 : En tant qu'Owner, je veux passer de Free à Forge/Studio via Stripe Checkout afin de débloquer plus de démos.
- US-106 : En tant qu'Owner, je veux démarrer un trial Studio 14 jours sans CB afin de tester sans risque.
- US-107 : En tant qu'Owner, je veux accéder au portail Stripe pour upgrader/downgrader/annuler afin de gérer mon abonnement.

#### F10.2 — Enforcement des quotas
- US-108 : En tant que PMM (plan Free), je veux être bloqué quand j'essaie de publier ma 2ème démo du mois afin d'être incité à upgrader.
- US-109 : En tant que PMM (plan Forge), je veux voir un message d'overage (+€5/démo) avant de publier au-delà du quota afin de décider en connaissance.
- US-110 : En tant que PMM (plan Free), je veux voir le watermark "Powered by DemoForge" sur ma démo partagée afin de comprendre la valeur du plan payant.

#### F10.3 — Annual billing
- US-111 : En tant qu'Owner, je veux choisir la facturation annuelle (-20%) afin de réduire mon coût mensuel.

#### F10.4 — Webhooks Stripe
- US-112 : En tant que système, je veux traiter les webhooks `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted` afin de mettre à jour le plan en base en temps réel.

---

### E11 — Analytics Avancées

#### F11.1 — Drop-off par étape
- US-113 : En tant que PMM, je veux voir à quelle étape les viewers arrêtent de regarder afin d'identifier le point faible de ma démo.

#### F11.2 — Géo & device
- US-114 : En tant que PMM, je veux voir d'où viennent les viewers (pays) afin de confirmer la cible géographique.
- US-115 : En tant que PMM, je veux voir la répartition desktop/mobile afin d'adapter le format de démo si nécessaire.

#### F11.3 — PostHog
- US-116 : En tant qu'équipe DemoForge, je veux tracker les events clés (signup, first_demo_created, demo_shared, upgrade) via PostHog afin d'analyser le funnel de conversion.

---

### E12 — Auto Re-scan sur Push

#### F12.1 — GitHub webhook
- US-117 : En tant que système, je veux recevoir les events `push` de la branche trackée via GitHub webhook afin de détecter automatiquement les nouveaux commits.
- US-118 : En tant que système, je veux vérifier la signature du webhook (`X-Hub-Signature-256`) afin de sécuriser l'endpoint.

#### F12.2 — Détection de démos obsolètes
- US-119 : En tant que PMM, je veux voir une notification "Votre démo X a été créée avant un nouveau commit — re-générer ?" afin d'être averti que la démo peut être désynchronisée.
- US-120 : En tant que PMM, je veux re-scanner en un clic depuis la notification afin de mettre à jour ma démo rapidement.

---

### E13 — Team Features

#### F13.1 — Commentaires async
- US-121 : En tant que PMM, je veux envoyer un lien de revue interne (team-only) à mon Head of Product afin qu'il commente avant publication.
- US-122 : En tant que Reviewer, je veux laisser un commentaire sur une étape spécifique afin de donner un feedback précis.
- US-123 : En tant que PMM, je veux voir les commentaires dans l'éditeur afin de les traiter sans sortir du workflow.

#### F13.2 — Email notifications
- US-124 : En tant que Owner/Editor, je veux recevoir un email à chaque invitation d'un nouveau membre afin d'être informé des accès.
- US-125 : En tant que PMM, je veux recevoir un email "Re-scan disponible" quand la branche trackée a été mise à jour afin de ne pas manquer une mise à jour.
- US-126 : En tant que nouveau user, je veux recevoir un email de bienvenue avec 3 tips pour créer ma première démo afin de démarrer vite.

---

## PHASE 3 — V2

---

### E14 — Export Vidéo MP4

**Goal** : exporter la démo en vidéo pour LinkedIn, YouTube, salons.

#### F14.1 — Playwright headless + render queue
- US-127 : En tant que PMM, je veux cliquer "Exporter en vidéo" afin de lancer le rendu de ma démo en MP4.
- US-128 : En tant que PMM, je veux voir la progression du rendu (queue Inngest + %) afin de savoir quand le fichier sera disponible.
- US-129 : En tant que PMM, je veux recevoir une notification quand le rendu est prêt afin de le télécharger immédiatement.
- US-130 : En tant que PMM, je veux télécharger le MP4 depuis Supabase Storage afin de l'uploader sur LinkedIn ou YouTube.

#### F14.2 — Formats d'export
- US-131 : En tant que PMM, je veux exporter en 1080p (16:9) pour YouTube/LinkedIn afin d'avoir la qualité standard.
- US-132 : En tant que PMM (Studio), je veux exporter en 4K afin d'avoir la meilleure qualité pour les salons.

---

### E15 — Voix-off TTS (Narrator V2)

#### F15.1 — Génération TTS
- US-133 : En tant que PMM, je veux que Narrator génère une voix-off (ElevenLabs ou OpenAI TTS) synchronisée avec le timing des étapes afin que la démo vidéo soit complète.
- US-134 : En tant que PMM, je veux choisir parmi 3-4 voix (ton pro, startup, technique) afin d'adapter à mon branding.
- US-135 : En tant que PMM, je veux désactiver la voix-off pour un lien partageable (garder annotations seulement) afin de garder la flexibilité.

---

### E16 — Branchements

**Goal** : le spectateur peut cliquer pour explorer un chemin alternatif dans la démo.

#### F16.1 — Branch node en storyboard
- US-136 : En tant que PMM, je veux ajouter un nœud de branchement entre deux étapes afin de créer un choix pour le spectateur.
- US-137 : En tant que PMM, je veux configurer les labels des branches ("Voir le dashboard" / "Voir les analytics") afin de guider le spectateur.

#### F16.2 — Player branching
- US-138 : En tant que Viewer, je veux cliquer sur un bouton de branchement afin de choisir ma propre direction dans la démo.
- US-139 : En tant que PMM, je veux voir dans l'analytics quel chemin de branchement est le plus emprunté afin d'identifier le parcours le plus convaincant.

---

### E17 — GitLab & Bitbucket

#### F17.1 — GitLab
- US-140 : En tant que PMM (utilisateur GitLab), je veux connecter mon instance GitLab (SaaS ou self-hosted) afin d'utiliser DemoForge avec mon stack.
- US-141 : En tant que PMM, je veux utiliser un Personal Access Token GitLab (scope `read_repository`) si OAuth n'est pas disponible sur mon instance afin de ne pas être bloqué.

#### F17.2 — Bitbucket
- US-142 : En tant que PMM (utilisateur Bitbucket), je veux connecter mon repo Bitbucket via OAuth afin d'utiliser DemoForge.

---

## Tableau récapitulatif

| Phase | Epics | Features | User Stories | Priorité |
|---|---|---|---|---|
| P0 | 3 | — | — | ✅ Done |
| P1 MVP | E1→E9 | ~50 features | US-001 → US-104 | 🔴 Critique |
| P2 V1.5 | E10→E13 | ~25 features | US-105 → US-126 | 🟡 Important |
| P3 V2 | E14→E17 | ~15 features | US-127 → US-142 | 🟢 Valeur ajoutée |

---

## Ordre de dev recommandé (P1)

> Principe : chaque sprint livrable doit être testable de bout en bout.

| Sprint | Durée | Focus | Résultat livrable |
|---|---|---|---|
| S1 | 1 sem | E1 (Auth) + E2 (GitHub OAuth callback) | Login → GitHub App installé → Org créée |
| S2 | 1.5 sem | E3 (Scout scan) | Repo scanné → artefacts en base + terminal animé live |
| S3 | 1 sem | E4 (Demo management) + E5 (Director streaming) | Brief → Director streame le storyboard en chat |
| S4 | 1 sem | E6 (Faker) + E7 (Narrator) | Storyboard complet + mocks + annotations générés |
| S5 | 1.5 sem | E8 (Storyboard editor real data) | Édition réelle du storyboard persisté |
| S6 | 1.5 sem | E9 (Player + share links) | **Lien `/d/[token]` fonctionnel = wow-moment** |

→ À l'issue de S6 : MVP V1 livrable. L'utilisateur peut faire les 30 minutes de démo.
