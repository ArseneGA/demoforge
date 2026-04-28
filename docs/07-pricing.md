# 07 — Pricing

> Statut : 🟢 v1
> Stripe activé en V1.5. MVP = waitlist + manual billing. Le modèle est cale dès maintenant pour cohérence data model + landing.

## Contexte économique

### Coûts variables par démo livrée
- **LLM** (Claude Sonnet 4.6) : ~1,50 € à 2 € par démo (3-4 itérations chat)
- **Embeddings** (Voyage AI) : ~0,05 € par scan repo (one-shot, amorti sur N démos)
- **Storage Supabase** : négligeable au MVP (< 50 Mo par démo)
- **Bande passante** liens partagés : variable, à monitorer

### Coûts fixes /mois (cf. doc 08)
~110-225 €/mois au démarrage MVP.

### Persona = PMM, fréquence = quelques fois par mois
→ Mensuel marche. Pas d'usage-based agressif.

---

## Plans

### 🆓 Free — 0 €/mois (à vie)
> *Découverte, viralité, lead magnet*

- **1 démo publiée /mois** (reset J1)
- 1 projet, 1 utilisateur
- Lien public uniquement
- **Watermark "Powered by DemoForge"** sur chaque démo partagée (lead magnet)
- Pas d'export vidéo
- Re-scan manuel uniquement
- Storage 100 Mo
- Support communauté (Discord / docs)

> Le watermark est volontairement visible pour les spectateurs des démos publiées → acquisition virale via les démos réelles publiées par les utilisateurs Free.

### 🛠️ Forge — 39 €/mois (ou 374 €/an, soit 31 €/mois en annuel)
> *Solo PMM, prototypes, démos hebdo*

- **5 démos publiées /mois**
- 1 projet, 1 utilisateur
- Lien public uniquement
- Watermark optionnel (peut être désactivé)
- Export vidéo : 1 /mois (V2)
- Re-scan manuel
- Storage 500 Mo
- Support email best-effort

### 🎨 Studio — 149 €/mois (ou 1 430 €/an, soit 119 €/mois en annuel) — **plan-cible**
> *Équipes produit & marketing en cadence*

- **30 démos publiées /mois**
- 5 projets, 5 sièges (extension : +20 €/siège supplémentaire)
- **Tous les modes de partage** : public + password + team-only
- Pas de watermark · branding personnalisable
- **Multi-thèmes** par démo activé
- Export vidéo : 10 /mois (V2)
- **Re-scan automatique** sur push (V1.5)
- Analytics basique (vues + durée)
- Storage 5 Go
- Support email < 24h
- **Trial 14 jours** sans CB

### 🏛️ Atelier — sur devis (à partir de ~600 €/mois)
> *Studios démo, agences, grandes orgs, mode "agence"*

- Démos illimitées · projets illimités · sièges illimités
- **Mode agence** (multi-clients, branding par client, themes au niveau org en V2)
- SSO entreprise (V2) · audit trail · DPA
- Onboarding sur site · support dédié SLA
- Agents privés (V2 : fine-tuning sur la marque du client)

---

## Onboarding monétaire

```
Signup
   │
   ▼
[Free actif d'office, 1 démo/mois]
   │
   ├──► User publie 1 démo, watermark visible  →  acquisition virale
   │
   ├──► User a besoin de plus  →  Trial Studio 14 jours sans CB
   │       │
   │       ├── Convertit  →  Studio 149 €/mois (ou 119 €/mois en annuel)
   │       └── Ne convertit pas  →  Retour Free (1 démo/mois)
   │
   └──► User est solo et veut juste un peu plus  →  Forge 39 €/mois
```

---

## Modèle de billing

### Compteur principal : **démos publiées /mois**
- Un draft ne consomme rien
- Une démo passe à `published` → +1 dans le compteur du mois en cours
- Re-publier (modifier puis re-publier la même démo) ne re-incrémente pas
- Reset J1 du mois (UTC)

### Compteurs secondaires
- **Sièges actifs** : utilisateurs connectés ≥ 1 fois dans les 30 derniers jours
- **Storage** : somme `assets.size_bytes` par Org
- **Export vidéo** : compteur séparé (V2)

### Overages (V1.5+)
- Démo au-delà du quota :
  - Free → bloqué (must upgrade)
  - Forge → 5 €/démo supplémentaire
  - Studio → 3 €/démo supplémentaire
- Siège Studio supplémentaire : 20 €/siège/mois
- Storage : 0,02 €/Go au-delà du quota

### Pas de crédits LLM séparés
On absorbe la variabilité dans la marge. Cap technique : **50 messages chat /démo** pour éviter les abus. Si dépassé, message UI "limite d'itérations atteinte, ouvrez le storyboard pour finaliser".

---

## Devise

**Euros uniquement au MVP** (FR/EU first). Multi-devise (€/$/£) en V1.5 quand on attaque l'international.

---

## Annual billing

Activé **dès le go-live Stripe** (V1.5) :
- **-20% sur l'annuel** (Forge 374 €/an, Studio 1 430 €/an)
- Mensuel reste disponible
- Atelier toujours custom

---

## Économie unitaire

### Forge (39 €) à 5 démos /mois
- LLM : ~10 € (1,5-2 € × 5)
- Coût fixe alloué : ~1 € (110 €/100 orgs)
- **Marge brute : ~28 € (72%)**

### Studio (149 €) à 30 démos /mois (cas pessimiste = quota atteint)
- LLM : ~50 € (1,5-2 € × 30)
- Coût fixe alloué : ~2 € (110 €/50 orgs Studio)
- **Marge brute : ~97 € (65%)**

### Studio (149 €) à 10 démos /mois (cas réaliste)
- LLM : ~17 €
- **Marge brute : ~130 € (87%)**

### Free (0 €) à 1 démo /mois
- LLM : ~1,80 €
- **Coût net : -1,80 €/org/mois**
- Justifié si viralité du watermark génère 5%+ de conversion vers Forge/Studio

---

## Comparables

| Concurrent | Plan équivalent Studio | Prix /mois | Notre delta |
|---|---|---|---|
| Arcade.software | Pro 5 sièges | ~150 $ | aligné |
| Storylane | Solo | 50 $/user (= 250 $ pour 5) | -40% |
| Navattic | Custom | ~500-1000 $ | -50% à -80% |
| Loom | Business | ~90 $/user (= 450 $ pour 5) | mais c'est pas comparable (vidéo simple) |

→ Studio à 149 € est **agressif vs Storylane/Navattic, aligné Arcade**. Cohérent avec un produit nouveau qui doit gagner des parts.

---

## Récap décisions actées

| Sujet | Décision |
|---|---|
| Plans MVP | Free / Forge 39 € / Studio 149 € / Atelier custom |
| Stripe live | V1.5 (MVP = waitlist + manual billing) |
| Free tier | Permanent à vie · 1 démo/mois · watermark visible |
| Trial Studio | 14 jours sans CB |
| Devise | € uniquement MVP, multi-devise V1.5 |
| Annual billing | -20% dès Stripe activé |
| Compteur principal | Démos publiées /mois |
| Crédits LLM séparés | Non — absorbé en marge, cap 50 msg/démo |
| Watermark Free | Oui (lead magnet) |
| Watermark Forge | Désactivable |
| Watermark Studio | Pas de watermark |
| Reset compteur | J1 du mois UTC |

---

## À trancher plus tard (post-MVP)

- Pricing **mode agence** (par client géré · par siège · flat ?)
- **Discount éducation / non-profit**
- **Reseller / partenariats** agences
- Multi-devise et fiscalité internationale
