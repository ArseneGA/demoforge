# 01 — Vision & pitch

> Statut : 🟢 validé · v1

## One-liner

> **DemoForge transforme votre repo GitHub en démo SaaS scriptée et jouable, en 30 minutes, sans toucher à votre backend.**

## Problème résolu

Trois douleurs cumulatives chez les équipes produit / marketing / sales :

1. **(A) Préparer une démo personnalisée par prospect prend du temps.** Chaque rendez-vous demande un set-up, un compte de test, des données crédibles. Les commerciaux n'ont pas la bande passante pour le faire correctement.
2. **(C) Les démos live cassent.** Bugs en prod ou staging, données moches, latence, features désactivées, edge cases imprévus. Le jour J, ça part en vrille.
3. **(E) Les démos enregistrées (Loom, Tella) sont mortes.** Le prospect ne peut pas naviguer, pas cliquer, pas explorer. Pas de capitalisation : chaque démo est un one-shot vidéo qu'on ne peut pas mettre à jour quand le produit évolue.

**DemoForge propose** : une démo **scriptée**, **fidèle au produit** (parce qu'elle est dérivée du code), avec **données mockées cohérentes**, **partageable par lien**, **rejouable à l'infini**, **mise à jour en 1 clic** quand le repo bouge.

## Pour qui (priorité MVP)

**Persona principal : Marketing Produit / Product Marketing Manager**

- Lance des features publiquement (launch, blog post, landing page)
- A besoin de démos visuelles pour : landing pages, posts LinkedIn, vidéos YouTube, salons, présentations investisseurs
- N'est **pas** dev — ne peut pas faire tourner le produit en local
- Doit produire **vite et beaucoup** (cadence de launch hebdo / mensuelle)
- Aujourd'hui : screenshots Figma + Loom + bricolage avec l'équipe produit

**Personas secondaires** (V1.5+) : Sales / SE, Founders early-stage, Customer Success.

## Cas d'usage du repo : les deux

DemoForge supporte deux modes :

- **Mode "produit interne"** : l'utilisateur connecte **son propre repo** pour faire des démos de **son produit**. Tarification individuelle / équipe.
- **Mode "agence / studio"** : l'utilisateur connecte le repo **de ses clients** pour leur livrer des démos. Multi-org, branding par client, tarification dégressive par client géré.

→ Implications : Org → Projets → Démos (multi-tenant), GitHub App avec scopes minimaux, branding personnalisable au niveau Projet.

## Différenciation

### Concurrent le plus proche : **Arcade.software** (et Storylane / Navattic)

| Dimension | Arcade / Storylane | DemoForge |
|---|---|---|
| Source de la démo | **Capture écran** du vrai produit (extension Chrome) | **Lecture du code** du repo |
| Pré-requis | Le produit doit **tourner** et être **utilisable** | Juste un repo GitHub |
| Format démo | Suite de screenshots avec hotspots cliquables | Wireframes réactifs thémés (un mini-app jouable) |
| Mise à jour | Re-capturer toute la démo manuellement | Re-scanner le repo → la démo se met à jour |
| Production | "Use the product to capture flow" | "Décris la démo en chat, les agents la construisent" |
| Données | Celles affichées au moment de la capture | Mockées par Faker, cohérentes par scénario |

**Le pitch positionnement** :
> *"Arcade pour les produits qui ne peuvent pas encore être démontrés en live — ou qui changent trop vite pour être recapturés à chaque release."*

Cas où DemoForge gagne :
- Produit en cours de dev (founder qui pitche avant la GA)
- Produit avec données sensibles (santé, finance, B2B critique) qu'on ne peut pas afficher en démo
- Produit qui release vite (chaque feature = re-capture chez Arcade ; chez DemoForge = re-scan)
- Marketing qui veut **N variantes** de démo par persona (e-commerce vs SaaS vs services) sans rejouer le scénario à la main

Cas où Arcade gagne :
- Produit déjà en prod, pixel-perfect requis
- Démos courtes, one-shot, pas besoin de variantes

## Wow-moment

> **L'utilisateur clique "Présenter" et voit son produit jouer un parcours fluide avec des données qui ont l'air vraies.**

Tout le produit est conçu autour de ce moment. Conséquences :
- La **fidélité visuelle** est non-négociable → Scout doit extraire les design tokens (couleurs, typo, logo, lib UI) avec précision
- Le **timing du parcours** doit être pro (transitions, cursor smooth, latences mock crédibles) → Director / Faker
- Les **données mockées** doivent être cohérentes (un user "Marie Cuvelier" reste "Marie Cuvelier" entre deux écrans, ses chiffres s'additionnent) → Faker

## Anti-promesses (ce que DemoForge n'est PAS)

- ❌ Un éditeur vidéo (Loom, Final Cut)
- ❌ Un mockup tool (Figma, Sketch, Framer)
- ❌ Un outil de QA / tests E2E (Playwright, Cypress)
- ❌ Une plateforme de capture du vrai produit (Arcade, Storylane)
- ❌ Un générateur de site no-code (Webflow, Bubble)
- ❌ Un outil de prototypage design-first

DemoForge est un **studio de démos scriptées générées depuis le code**, point.
