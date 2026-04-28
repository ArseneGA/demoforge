# 03 — Parcours utilisateur

> Statut : 🟢 v1

## Vue d'ensemble : 5 phases

```
[1] Découverte    →  [2] Onboarding Org  →  [3] Création démo  →  [4] Édition  →  [5] Partage / présentation
   landing             signup + GitHub      chat 4 agents         storyboard       lien + analytics
```

**SLA cible time-to-first-demo : 30 minutes** depuis signup → première démo livrée et partageable.

---

## Phase 1 — Découverte

L'utilisateur arrive sur `demoforge.app` (landing). Il :
- Comprend la promesse en < 10s
- Voit une **meta-démo** (DemoForge fait par DemoForge) sur la landing
- Clique "Démarrer · gratuit"

> ✅ **Fait** : le landing HTML de référence (`Downloads/Demo Forge/demoforge/01-landing.html`) est entièrement corrigé — hero, agents, workflow, storyboard et pricing alignés avec la vision.

---

## Phase 2 — Onboarding Org

### 2.1 — Auth (Supabase)
- Email magic link **OU** Google OAuth
- Première connexion → création automatique d'une **Org perso**
- Possibilité de rejoindre une Org existante via invitation email

### 2.2 — Wizard 4 étapes (cf. templates `03-onboarding-*.html`)

1. **Source** : GitHub seul au MVP (GitLab/Bitbucket grisés "bientôt")
2. **Repo + branche** : install GitHub App au niveau Org → liste des repos → sélection repo + branche tracked (défaut `main`)
3. **Analyse** : Scout scanne en live (terminal-style), 1-3 min selon taille
4. **Récap** : routes, composants, tokens design, lib UI, langage détectés

### 2.3 — Cas d'erreur scan

**Décision MVP :** si le framework n'est pas supporté ou si Scout ne trouve pas de routes exploitables, on **bloque** avec un message clair :

> _"Framework non supporté pour l'instant. DemoForge gère React et Next.js au MVP. Notifie-moi quand [Vue/Svelte/etc.] sera supporté → [bouton]"_

**Frameworks supportés MVP :** React (CRA, Vite) + Next.js (Pages Router + App Router). Tout le reste = waitlist.

### 2.4 — Multi-flow d'install GitHub App

Deux cas réels :
- **Cas A** — PMM a accès direct au repo → il installe la GitHub App lui-même
- **Cas B** — PMM n'a pas accès → il **invite par email** un `owner` (CTO/dev) qui termine l'install

Dans le cas B, le PMM voit un état "En attente d'install" et reçoit une notif quand c'est prêt.

---

## Phase 3 — Création d'une démo

### 3.1 — Trois portes d'entrée

1. **Chat libre** (le défaut) : prompt initiale, les 4 agents bossent
2. **Templates** (3-4 pré-faits au MVP) :
   - 📦 *Onboarding produit* — parcours guidé pour nouveau client
   - 🚀 *Feature launch* — focus sur une feature, pour landing/social
   - 💼 *Pitch investisseur* — vue d'ensemble produit, narratif business
   - (potentiellement un 4ème, à définir)
3. **Duplication d'une démo existante** — clone d'un projet récent comme base

### 3.2 — Les 4 agents en live (chat Realtime)

Stream parallèle :
- **Scout** confirme les routes pertinentes
- **Director** propose un script en N étapes
- **Faker** génère les données mockées cohérentes
- **Narrator** pose les annotations clés

L'user peut interrompre / ajuster par phrases en chat.

### 3.3 — Validation → storyboard
Bouton "Ouvrir le storyboard" → phase 4.

---

## Phase 4 — Édition (storyboard)

Cf. `06-editor.html`. Capacités MVP :
- Aperçu écran (mock app rendu avec tokens du repo + données Faker)
- Liste d'étapes (storyboard) — route, action, durée, mocks, annotation
- Inspecteur (édite l'étape sélectionnée)
- Rail outils (sélection, ajout étape, annotation, mock data)
- Bouton "Demander aux agents" pour retoucher par chat sans quitter le storyboard
- Réordonner / éditer / supprimer étapes
- "Présenter" en local pour tester

### 4.1 — Personnalisation visuelle (override + multi-thèmes)

Le PMM peut :
- **Override** les tokens auto-extraits (couleur primaire, logo, font, radius)
- **Créer plusieurs thèmes** par démo (ex: `default` / `dark` / `brand-client-X`)
- Choisir le thème à appliquer à la présentation / au lien partagé

→ Critique pour le **mode agence** (un studio démo qui livre la même démo brandée pour plusieurs clients).

### 4.2 — Upload d'assets (MVP)

Le PMM peut uploader :
- Logos HD (override du logo extrait)
- Images de fond, hero visuals
- Screenshots de graphes complexes que Scout ne sait pas régénérer (insérés comme "asset frozen" dans une étape)

Stockage : Supabase Storage, namespace par Org/Projet.

### 4.3 — Capacités V2 (hors MVP)
- Branchements (parcours alternatifs selon clic spectateur)
- Édition fine transitions / vitesse curseur
- A/B variants

---

## Phase 5 — Partage et présentation

### 5.1 — Modes de partage (les 3 au MVP)

| Mode | URL | Auth | Cas d'usage |
|---|---|---|---|
| **Public** | `demoforge.app/d/abc123` | Aucune | Landing, social, embed |
| **Password** | même URL + prompt | Mot de passe partagé | Démo client sensible |
| **Team-only** | même URL + login | Membres de l'Org | Revue interne |

### 5.2 — Mode présentation
Bouton "Présenter" → plein écran, joue auto OU click-to-advance.

### 5.3 — Analytics MVP

Pour chaque lien :
- **Nombre de vues**
- **Durée moyenne**
- (V1.5 : drop-off par étape, géo, device)

### 5.4 — Commentaires (V1.5)

Stakeholders internes peuvent commenter sur une démo avant publication. Reporté V1.5.

---

## Cycle de vie post-création

- **Re-scan automatique** (V1.5) : webhook GitHub sur push branche tracked → notif "votre démo X peut être obsolète, re-générer ?"
- **Versions** (V2) : historique d'une démo
- **Archivage** (V1.5) : démos non vues depuis N jours

---

## Récap décisions MVP

| Sujet | Décision |
|---|---|
| Time-to-first-demo cible | 30 min |
| Frameworks supportés | React (CRA/Vite) + Next.js (Pages + App) |
| Templates de démarrage | 3-4 (Onboarding, Feature launch, Pitch, +1) |
| Duplication de démo | ✅ MVP |
| Override thèmes + multi-thèmes | ✅ MVP |
| Upload d'assets | ✅ MVP |
| Modes de partage | Public + Password + Team-only |
| Analytics | Vues + durée moyenne |
| Commentaires async | V1.5 |
| Branchements | V2 |
| Re-scan auto sur push | V1.5 |
