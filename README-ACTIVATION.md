# 🚀 OMMI - Guide d'Activation des Features

## 📋 STATUS DES FEATURES

### ✅ ACTIVES (Gratuites - 0€)
1. **🏠 Furnish AI** - Home Staging IA
2. **✨ Ultra Sharp** - Rendu HDR
3. **📍 Area Intel** - Carte quartier
4. **🚇 Transit Time** - Temps de trajet

### 🔒 WAITLIST (À activer progressivement)
5. **🎬 Motion Blend** - Vidéo 2 photos
6. **☀️ Shadow Play** - Ombres animées
7. **🎙️ Voice Tour** - Visite vocale
8. **🎞️ Reel Maker** - Trailer cinématique
9. **🏗️ Renov Vision** - Before/After
10. **🌙 Day & Night** - Mode jour/nuit

---

## 🔑 CLÉS API NÉCESSAIRES

### Phase 1 (Actives maintenant) - 0€

```bash
REPLICATE_API_KEY=r8_xxx  # 5$ gratuits à l'inscription
GOOGLE_PLACES_API_KEY=xxx  # 200$/mois gratuits
```

### Phase 2 (Quand tu gagnes 100€)

```bash
ELEVENLABS_API_KEY=xxx  # 10k chars/mois gratuits
```

### Phase 3 (Quand tu gagnes 500€)

```bash
RUNWAY_API_KEY=xxx  # 35$/mois
KLING_API_KEY=xxx  # Pay-as-you-go
```

---

## 📝 OBTENIR LES CLÉS

### 1. Replicate (OBLIGATOIRE)
```
1. Va sur https://replicate.com
2. Sign up with GitHub
3. Account > API tokens > Create
4. Copie r8_xxxxx
5. Ajoute à Vercel Environment Variables
```

### 2. Google Places (OBLIGATOIRE)
```
1. Va sur https://console.cloud.google.com
2. Create Project "OMMI"
3. Enable "Places API"
4. Credentials > Create API Key
5. Copie la clé
6. Ajoute à Vercel Environment Variables
```

### 3. ElevenLabs (OPTIONNEL - Phase 2)
```
1. Va sur https://elevenlabs.io
2. Sign up
3. Profile > API Keys > Create
4. Copie la clé
```

---

## 🎯 PLAN D'ACTIVATION

### SEMAINE 1 (Maintenant - 0€)
✅ Features 1-4 actives
✅ Waitlist pour features 5-10
✅ Acquisition premiers users

### SEMAINE 2-4 (100€ revenus)
🔓 Active **Voice Tour** (ElevenLabs gratuit)
🔓 Active **Motion Blend** (Replicate)
🔓 Active **Day & Night** (Replicate)

**Coût** : 10€ recharge Replicate

### MOIS 2+ (500€ revenus)
🔓 Active **Shadow Play** (Runway 35$/mois)
🔓 Active **Reel Maker** (Kling)
🔓 Active **Renov Vision** (Replicate)

**Coût** : ~100€/mois d'APIs

---

## 🔧 ACTIVER UNE NOUVELLE FEATURE

### Étape 1 : Créer l'API route
Les fichiers sont déjà prêts dans `/api/` :
- `motion-blend.js`
- `shadow-play.js`
- `voice-tour.js`
- etc.

### Étape 2 : Ajouter la clé API
Dans Vercel > Settings > Environment Variables

### Étape 3 : Modifier le frontend
Dans `ommi-app.html`, change :
```javascript
// DE :
<div class="feature-card locked" onclick="showWaitlist('Motion Blend')">

// À :
<div class="feature-card" onclick="openFeature('motion-blend')">
```

Et change le badge :
```javascript
// DE :
<div class="feature-badge badge-soon">SOON 🔒</div>

// À :
<div class="feature-badge badge-active">BETA 🚀</div>
```

### Étape 4 : Push sur GitHub
```bash
git add .
git commit -m "Activate Motion Blend"
git push
```

Vercel redéploie automatiquement ! ✅

---

## 💰 ESTIMATION COÛTS

### MVP (0-100 users) - 0€/mois
- Replicate : 5$ gratuits (500 générations)
- Google Places : Gratuit (< 1000 requêtes/mois)
- **TOTAL : 0€**

### Croissance (100-1000 users) - ~100€/mois
- Replicate : 50€/mois
- ElevenLabs : Gratuit (plan gratuit suffit)
- Runway : 35€/mois
- Google Places : Gratuit
- **TOTAL : 85€/mois**

### Scale (1000+ users) - ~200€/mois
- Replicate : 100€/mois
- ElevenLabs Pro : 22€/mois
- Runway : 35€/mois
- Kling AI : 50€/mois
- **TOTAL : 207€/mois**

---

## 📊 WAITLIST ANALYTICS

Les inscriptions waitlist sont stockées dans `state.waitlist` (frontend).

Pour envoyer les emails, tu peux :

### Option A : Manuelle
1. Ouvre la console navigateur
2. Tape : `console.log(state.waitlist)`
3. Copie les emails
4. Envoie via Gmail/Mailchimp

### Option B : Automatique (backend)
Crée `/api/waitlist-submit.js` qui envoie vers :
- Mailchimp
- SendGrid
- Notion
- Google Sheets

---

## 🚀 ROADMAP SUGGESTED

**Jour 1-7** : Lancement Beta
- 4 features actives
- 0€ dépensé
- Objectif : 50 users beta

**Jour 8-30** : Premiers revenus
- Activer Voice Tour dès 5 clients payants
- Réinvestir dans Replicate
- Objectif : 100€ revenus

**Jour 30-60** : Scale
- Activer toutes les features premium
- Investir 100€/mois dans APIs
- Objectif : 500€ revenus/mois

---

## ❓ FAQ

**Q : Combien coûte 1 génération ?**
- Furnish AI : ~0.01€
- Ultra Sharp : ~0.01€
- Motion Blend : ~0.10€
- Shadow Play : ~0.15€

**Q : Replicate me charge comment ?**
- Tu payes SEULEMENT ce que tu utilises
- 5$ gratuits au départ
- Puis $0.001 à $0.05 par seconde de compute

**Q : Je dois payer tout de suite ?**
- NON ! Use les 5$ gratuits Replicate
- Recharge seulement quand épuisés
- Réinvestis tes premiers revenus

---

## 📞 SUPPORT

Questions ? Problèmes ?
- GitHub Issues
- Email : tech@ommi.fr

**BON LANCEMENT ! 🎉**