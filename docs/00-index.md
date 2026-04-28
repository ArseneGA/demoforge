# DemoForge — Documentation produit

Documentation de cadrage avant tout développement. À remplir au fur et à mesure des sessions de travail avec Arsène.

## État

| # | Doc | Statut |
|---|---|---|
| 01 | [Vision & pitch](./01-vision.md) | 🟢 v1 |
| 02 | [Personas & use cases](./02-personas.md) | 🟢 v1 |
| 03 | [Parcours utilisateur](./03-user-journey.md) | 🟢 v1 |
| 04 | [Les 4 agents](./04-agents.md) | 🟢 v1 |
| 05 | [Modèle de données](./05-data-model.md) | 🟢 v1 |
| 06 | [Hors-scope MVP](./06-out-of-scope.md) | 🟢 v1 |
| 07 | [Pricing](./07-pricing.md) | 🟢 v1 |
| 08 | [Stack technique](./08-stack.md) | 🟢 v1 |
| 09 | [Product plan — Epics/Features/US](./09-product-plan.md) | 🟢 v1 |

## Décisions clés actées (récap toutes docs)

### Vision & cible
- **Pitch** : transformer un repo GitHub en démo SaaS scriptée jouable, en 30 min, sans toucher au backend
- **Persona principal** : PMM en scale-up Série B-C (Léa)
- **Top 3 cas d'usage** : landing feature launch · post social · onboarding clients
- **Wow-moment** : clic "Présenter" → produit joue un parcours fluide avec données crédibles
- **Concurrent** : Arcade.software / Storylane / Navattic — différenciation = on part du **code**, pas de l'écran

### Produit
- **Format de sortie** principal MVP = **lien partageable** (vidéo MP4 = V2)
- **4 agents** : Scout (code) · Director (script) · Faker (mocks) · Narrator (annotations)
- **Approche rendu** : (a+) wireframes thémés avec design tokens extraits du repo
- **Frameworks** : React (CRA/Vite) + Next.js (Pages/App) — autres = waitlist
- **Modes de partage** : public + password + team-only au MVP
- **Templates** : 3-4 (Onboarding, Feature launch, Pitch, +1)
- **Duplication** + **multi-thèmes par démo** + **upload assets** = MVP

### Tech
- **Stack** : Next.js 15 + Vercel + Supabase + Inngest + Anthropic Claude Sonnet 4.6 + Voyage AI + GitHub App
- **Multi-tenant** : Org → Projets → Démos · rôles owner/editor/viewer
- **Mocks runtime** : MSW (Mock Service Worker)
- **Auth** : Supabase (email magic link + Google OAuth)
- **Embeddings** : Voyage AI `voyage-3` (1024d)

### Pricing
- **Free** 0 € · 1 démo/mois · watermark visible (lead magnet)
- **Forge** 39 €/mois · 5 démos · solo
- **Studio** 149 €/mois · 30 démos · 5 sièges · trial 14j sans CB · plan-cible
- **Atelier** sur devis · agences / grandes orgs
- Annual billing -20% (V1.5 avec Stripe), € MVP, pas de crédits LLM

### V2 / hors-scope
- Export vidéo MP4
- Voix-off TTS (Narrator V2)
- Branchements parcours
- Sandbox build vrai frontend
- Stripe + plans payants opérationnels
- GitLab / Bitbucket
- Frameworks autres que React/Next.js
