# 02 — Personas & use cases

> Statut : 🟢 v1 (persona principal lockée, secondaires reportés)

## Persona principal — Léa, PMM en scale-up Série B-C

### Profil type

- **Rôle** : Product Marketing Manager
- **Boîte** : SaaS B2B, Série B ou C, **50-200 personnes**, équipe marketing 5-10
- **Stade produit** : produit en prod, croissance forte, **release cadencée** (features hebdo / mensuelles)
- **Rapporte à** : VP Marketing ou Head of Product Marketing
- **Outils quotidiens** : Notion, Figma, Loom, Linear / Jira, Slack, HubSpot / Salesforce, Webflow ou Framer (landing), Canva
- **KPI** : adoption des features post-launch, conversion landing page, qualité des assets de launch, vélocité (nb de launches/mois)

### Contexte d'usage : top 3 (MVP)

1. 🥇 **Landing page de feature launch** — un nouveau module sort, il faut un visuel animé sur la landing dans la semaine
2. 🥈 **Posts social** (LinkedIn, X, YouTube) — vidéo courte (15-90s) qui montre la feature en action
3. 🥉 **Onboarding nouveaux clients** — parcours guidé interactif que le CS envoie après le kick-off

> Hors-scope MVP (mais sur la roadmap) : pitch deck, salons, sales enablement, doc interactive.

### Format de sortie privilégié

| Priorité | Format | Usage |
|---|---|---|
| 🥇 | **Lien partageable** (démo interactive jouable dans le browser) | Onboarding clients · embed landing · partage Slack interne · sales |
| 🥈 | **Vidéo MP4** (V2) | LinkedIn, YouTube, salons, vidéos asynchrones |
| 🟡 (V2+) | Embed iframe, GIF/WebM, screenshots HD | Webflow / Framer / Notion / README |

→ **Conséquence MVP** : tout le produit doit converger sur la qualité du **lien partageable**. La vidéo, c'est V2.

### Fréquence d'usage

**Quelques fois par mois**, principalement aligné sur le calendrier de **launches**.

→ Implications :
- **Pricing** : abonnement mensuel viable (pas de usage-based agressif au MVP)
- **Réactivation** : DemoForge doit prévenir le PMM quand le repo a bougé sur la branche tracked, sinon il oublie le produit entre deux launches
- **Onboarding** : la première démo doit être livrée vite (≤ 15 min promesse) sinon il décroche
- **Templates** : il faut pouvoir **dupliquer** une démo précédente comme base, pour ne pas repartir de zéro à chaque launch

### Accès au repo

Cas réel mixte :
- **Cas A** — PMM a accès lecture au GitHub de la boîte (startup early, équipe petite, repo non sensible)
- **Cas B** — PMM n'a pas accès → un dev / CTO doit connecter le repo une fois au niveau **Org**, et le PMM travaille ensuite sans toucher au GitHub

→ **Conséquence produit** :
- L'install de la GitHub App se fait au niveau **Org**, pas User
- Une fois installée, **n'importe quel membre de l'Org** peut créer des démos sur les repos autorisés
- Rôles Org : `owner` (admin facturation + GitHub App) · `editor` (crée/édite des démos) · `viewer` (lit/présente)
- Le PMM est typiquement `editor`, le CTO `owner`

### Sa journée idéale avec DemoForge

> *Lundi matin, Léa apprend qu'une nouvelle feature "Audiences segmentées" sort jeudi. Elle ouvre DemoForge, voit que le repo Stratus a été scanné automatiquement le week-end (la branche `main` a bougé). Elle clique "Nouvelle démo", écrit en chat : "Démo de la feature Audiences segmentées pour landing page, persona e-commerce, 6 étapes max, 90 secondes". Director lui propose un script en 30s. Faker peuple les écrans avec une boutique fictive cohérente. Narrator pose 4 annotations qui mettent en avant le bénéfice. Léa ajuste deux étapes en chat ("ajoute une étape sur le filtre par CA", "remplace l'audience B2B par une audience e-com mode"), ouvre le storyboard, valide, copie le lien partageable, le colle dans Webflow. Total : 22 minutes.*

### Ce qui la freine aujourd'hui (avant DemoForge)

- Les screencasts Loom sont **figés** : si le produit change, faut tout refaire
- Le **dev qui doit l'aider** à filmer le produit est sur d'autres priorités → le launch est repoussé
- Les **données de staging sont moches** ou cassées → impossible de filmer un parcours propre
- **Figma cliquable** : long à produire, jamais à jour avec le vrai produit, pas convaincant
- **Arcade / Storylane** : le produit doit tourner et être stable, et chaque release casse les démos enregistrées

---

## Personas secondaires (V1.5+)

À traiter plus tard. Candidats notés pour mémoire :
- Founder / CEO early-stage (pitch avant GA)
- Sales Engineer (créer des démos types pour AE)
- Customer Success (parcours d'onboarding)
- Developer Advocate (démos pour content technique)

---

## Cas d'usage MVP — récap priorisé

| # | Cas d'usage | Persona | Format | Priorité MVP |
|---|---|---|---|---|
| 1 | Landing page feature launch | PMM | Lien embed (+ MP4 V2) | 🟢 P0 |
| 2 | Post social LinkedIn / X / YT | PMM | MP4 (V2) ou GIF | 🟡 P1 (V2 vidéo) |
| 3 | Onboarding clients | PMM / CS | Lien partageable | 🟢 P0 |
| 4 | Duplication d'une démo existante comme base | PMM | — (feature) | 🟢 P0 |
| 5 | Re-scan auto du repo après push | PMM | — (feature) | 🟡 P1 |

> P0 = MVP V1 obligatoire · P1 = V1.5 · P2 = V2+
