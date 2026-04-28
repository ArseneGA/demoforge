# 06 — Hors-scope MVP

> Statut : 🟢 v1
> Liste explicite de ce qu'on **ne fait pas** au MVP V1, organisé par horizon. Référence quand on aura envie d'ajouter une feature : on vérifie d'abord qu'elle n'est pas ici.

## Principe

Le MVP V1 doit livrer **une seule promesse parfaitement** : *transformer un repo GitHub React/Next.js en démo SaaS scriptée jouable, partageable par lien*. Tout le reste attend.

---

## V1.5 — premier trimestre post-launch

| Feature | Doc source | Pourquoi V1.5 et pas MVP |
|---|---|---|
| **Re-scan automatique** sur push (webhook GitHub) | 03 | Nice-to-have, pas critique pour livrer la première démo |
| **Commentaires async** sur démos (revue stakeholders) | 03 | Ajoute du collab à débloquer après que le solo flow tourne |
| **Analytics détaillées** (drop-off par étape, géo, device) | 03 | MVP = vues + durée moyenne, le reste suit |
| **Archivage automatique** démos non vues > N jours | 03 | Pas de pression storage au début |
| **Stripe** + abonnements payants opérationnels | 05, 07 | MVP = waitlist gratuite ou manual billing |
| **Voix-off TTS** par Narrator | 04 | Chantier à part (timing, mux audio, ElevenLabs) |
| **Email notifications** (re-scan, invitations, alertes) | — | Trigger.dev / Resend, à câbler après MVP |
| **Personas secondaires** (Founder, SE, CS, DevRel) | 02 | MVP focus PMM strict |

## V2 — 6 mois post-launch

| Feature | Doc source | Pourquoi V2 |
|---|---|---|
| **Export vidéo MP4** | 03 | Playwright headless + render queue + audio mux. ~1 mois de boulot. |
| **Embed iframe** + GIF/WebM exports | 02 | Une fois que l'export vidéo tourne |
| **Branchements** (parcours alternatifs selon clic spectateur) | 03 | Complexifie le storyboard, l'éditeur, le player |
| **Édition fine transitions** (slide, zoom, easing custom) | 04 | Cut + fade suffit au MVP |
| **A/B variants** d'une même démo | 03 | Suit l'analytics détaillée |
| **Sandbox build du vrai frontend** (option b cf. discussion) | conversation | E2B / WebContainers, par framework supporté |
| **Versioning** des démos (historique + rollback) | 03 | Une fois qu'on a du trafic |
| **Snapshot complet** des artefacts Scout par démo | 05 | V2 si re-scan casse trop souvent les démos |
| **Templates user-created** (table `templates` en DB) | 05 | Les 3-4 du MVP suffisent au launch |
| **Challenging inter-agents** (Faker → Director, etc.) | 04 | Si on constate des soucis de cohérence en prod |
| **5ème agent superviseur** (orchestrator-worker pattern) | 04 | Idem |
| **Multi-package monorepos** | 04 | MVP = un seul package via dropdown |
| **GitLab + Bitbucket** support | 02 | GitHub seul couvre 80% de la cible |
| **SSO entreprise** (SAML, Okta) | — | Pour le plan Atelier futur |
| **Themes au niveau org** (presets réutilisables) | 05 | MVP par démo seulement |
| **Recording du spectateur** (heatmap, replay) | — | Hotjar-like sur les démos partagées |

## V3+ — long terme / nice-to-have lointain

- Frameworks supplémentaires : **Vue, Svelte, Solid, Remix, Astro, SvelteKit, Nuxt**
- **Mobile** (iOS/Android via React Native code)
- **Backend complet runtime** (Faker tourne un vrai serveur mock par démo, pas juste MSW client-side)
- **Live demos** (le spectateur peut interagir librement avec les écrans mockés, pas juste suivre le script)
- **Démos multi-tenant côté spectateur** (variabilisation : un lien = N démos personnalisées par destinataire)
- **API publique DemoForge** (créer démos par programmation depuis CI/CD)
- **CLI** `demoforge` pour publier une démo depuis le repo lui-même
- **White-label** complet pour le mode agence
- **Marketplace de templates** créés par la communauté
- **Intégrations** : Salesforce, HubSpot, Webflow, Framer, Notion, Slack
- **Multi-langue** UI + démos générées (DE, ES, EN au-delà du FR)

---

## Anti-features explicites (ne sera **jamais** fait)

- ❌ **Capture du vrai produit** (extension Chrome) — c'est Arcade/Storylane, pas notre angle
- ❌ **Éditeur vidéo généraliste** type Final Cut / Premiere
- ❌ **Outil de tests E2E** type Playwright/Cypress (même si la stack utilise Playwright en interne pour l'export V2)
- ❌ **Builder no-code** type Webflow/Bubble
- ❌ **Hosting du vrai produit du client** — DemoForge ne déploie pas le SaaS du user
- ❌ **Sondage / formulaires** intégrés dans les démos (gardons l'angle "démo", pas "lead capture")

---

## Limites techniques explicites du MVP

- Repo max **500k LOC**
- Frameworks supportés : **React (CRA, Vite) + Next.js (Pages, App)** uniquement
- Monorepos : un seul package scannable à la fois
- Démos : **6 étapes max** par défaut (configurable jusqu'à ~12)
- Annotations : **3 par étape max**
- Storage : **2 Go par Org** (uploads + scan artifacts)
- Concurrent jobs Inngest : **5 par Org** (si plus, queued)
- Démos publiées simultanées : **illimité** (mais quotas de génération mensuels selon plan)
