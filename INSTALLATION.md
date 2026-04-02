# 🚀 OMMI - GUIDE COMPLET D'INSTALLATION

## 📋 TABLE DES MATIÈRES
1. [Prérequis](#prérequis)
2. [Installation Locale](#installation-locale)
3. [Configuration Supabase](#configuration-supabase)
4. [Configuration Stripe](#configuration-stripe)
5. [Configuration APIs IA](#configuration-apis-ia)
6. [Déploiement Vercel](#déploiement-vercel)
7. [Tests](#tests)

---

## 🔧 PRÉREQUIS

- Node.js 18+ installé
- Compte GitHub
- Compte Vercel (gratuit)
- Compte Supabase (gratuit)
- Compte Stripe (gratuit)

---

## 💻 INSTALLATION LOCALE

### Étape 1 : Cloner le projet

```bash
mkdir ommi
cd ommi
```

### Étape 2 : Installer les dépendances

```bash
npm install
```

### Étape 3 : Configurer les variables d'environnement

```bash
cp .env.example .env
```

Ouvrir `.env` et remplir les clés (voir sections suivantes).

---

## 🗄️ CONFIGURATION SUPABASE

### Étape 1 : Créer un projet

1. Aller sur https://supabase.com
2. Cliquer sur "New Project"
3. Choisir un nom : `ommi-prod`
4. Choisir région : Europe (Paris)
5. Créer le projet (2-3 minutes)

### Étape 2 : Récupérer les clés

1. Aller dans **Settings > API**
2. Copier `Project URL` → `SUPABASE_URL`
3. Copier `anon public` → `SUPABASE_KEY`

### Étape 3 : Créer les tables

1. Aller dans **SQL Editor**
2. Copier/coller le contenu de `supabase-schema.sql`
3. Cliquer "Run"

### Étape 4 : Créer le bucket Storage

1. Aller dans **Storage**
2. Créer un nouveau bucket : `uploads`
3. Rendre public : ✅
4. Les policies sont déjà créées via le SQL

### Étape 5 : Activer l'authentification

1. Aller dans **Authentication > Providers**
2. Activer **Email** (déjà activé par défaut)
3. Optionnel : Activer **Google OAuth** pour login social

---

## 💳 CONFIGURATION STRIPE

### Étape 1 : Créer un compte

1. Aller sur https://stripe.com
2. S'inscrire (gratuit)
3. Activer le mode TEST

### Étape 2 : Récupérer les clés

1. Aller dans **Developers > API Keys**
2. Copier `Publishable key` → `STRIPE_PUBLISHABLE_KEY`
3. Copier `Secret key` → `STRIPE_SECRET_KEY`

### Étape 3 : Créer les produits

1. Aller dans **Products > Add product**

**Produit 1 : Pro**
- Nom : OMMI Pro
- Prix : 39€/mois
- Récurrent
- Copier `Price ID` → noter pour le code

**Produit 2 : Agency**
- Nom : OMMI Agency
- Prix : 149€/mois
- Récurrent
- Copier `Price ID` → noter pour le code

### Étape 4 : Configurer le Webhook

1. Aller dans **Developers > Webhooks**
2. Ajouter un endpoint : `https://votre-domaine.vercel.app/api/webhook/stripe`
3. Sélectionner événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copier `Signing secret` → `STRIPE_WEBHOOK_SECRET`

---

## 🤖 CONFIGURATION APIs IA

### Option A : GRATUIT (Pour tester)

#### Haiper AI (Image → Vidéo)
1. Aller sur https://haiper.ai
2. S'inscrire
3. Générer une API key
4. Ajouter à `.env` : `HAIPER_API_KEY=xxx`

#### Replicate (Home Staging)
1. Aller sur https://replicate.com
2. S'inscrire (5$ gratuits)
3. Aller dans **Account > API tokens**
4. Créer un token
5. Ajouter à `.env` : `REPLICATE_API_KEY=r8_xxx`

### Option B : PAYANT (Production)

#### Kling AI (Meilleure qualité Image→Vidéo)
1. Aller sur https://klingai.com
2. S'inscrire
3. Acheter des crédits (~10€ minimum)
4. Récupérer API key
5. **Coût** : ~0,10€ par vidéo 5s

#### Luma AI (Alternative)
1. Aller sur https://lumalabs.ai
2. S'inscrire
3. API en beta (demander accès)
4. **Coût** : ~0,08€ par vidéo 5s

### Recommandation

**Phase MVP (0-100 utilisateurs)** :
- Haiper (gratuit) + Replicate (5$ gratuits)
- Budget : 0€

**Phase Croissance (100-1000 utilisateurs)** :
- Kling AI ou Luma
- Budget : ~50-200€/mois selon usage

---

## 🌐 DÉPLOIEMENT VERCEL

### Étape 1 : Préparer GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/votre-username/ommi.git
git push -u origin main
```

### Étape 2 : Connecter Vercel

1. Aller sur https://vercel.com
2. Cliquer **New Project**
3. Importer depuis GitHub
4. Sélectionner le repo `ommi`

### Étape 3 : Configurer les variables d'environnement

Dans Vercel, aller dans **Settings > Environment Variables** et ajouter :

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
HAIPER_API_KEY=xxx
REPLICATE_API_KEY=r8_xxx
FRONTEND_URL=https://ommi.vercel.app
```

### Étape 4 : Déployer

1. Cliquer **Deploy**
2. Attendre 2-3 minutes
3. Votre app est en ligne ! 🎉

### Étape 5 : Configurer le domaine personnalisé

1. Acheter domaine : `ommi.fr` (OVH, Gandi, etc.)
2. Dans Vercel : **Settings > Domains**
3. Ajouter `ommi.fr`
4. Suivre instructions DNS

---

## ✅ TESTS

### Test 1 : Backend API

```bash
curl https://ommi.vercel.app/health
```

Résultat attendu : `{"status":"OK","service":"OMMI API"}`

### Test 2 : Création compte

1. Ouvrir https://ommi.vercel.app
2. Créer un compte
3. Vérifier email
4. Se connecter

### Test 3 : Génération Image→Vidéo

1. Upload une photo
2. Choisir mouvement
3. Cliquer "Générer"
4. Attendre 30-60s
5. Télécharger vidéo

### Test 4 : Paiement Stripe

1. Aller dans Tarifs
2. Choisir Pro
3. Utiliser carte test : `4242 4242 4242 4242`
4. Date : n'importe quelle date future
5. CVC : n'importe quel 3 chiffres
6. Valider
7. Vérifier crédits passent à 500

---

## 📊 MONITORING

### Logs Vercel

```bash
vercel logs
```

### Logs Supabase

1. Aller dans **Logs**
2. Voir requêtes en temps réel

### Analytics Stripe

1. Dashboard Stripe
2. Voir paiements, revenus

---

## 🐛 DÉPANNAGE

### Erreur : "Crédits insuffisants"

- Vérifier table `profiles` dans Supabase
- Vérifier colonne `credits`

### Erreur : "API IA timeout"

- Vérifier clés API dans `.env`
- Vérifier crédits API (Haiper/Replicate)

### Vidéo ne se génère pas

- Vérifier logs Vercel : `vercel logs`
- Vérifier statut API IA

---

## 💰 ESTIMATION COÛTS

### Phase MVP (0-100 users)

- Vercel : 0€ (plan gratuit)
- Supabase : 0€ (plan gratuit)
- APIs IA : 0€ (Haiper + Replicate gratuits)
- Stripe : 0€ (pas de frais fixes)
- **TOTAL : 0€/mois**

### Phase Croissance (100-1000 users)

- Vercel : 0€ (toujours gratuit)
- Supabase : 25€/mois (plan Pro)
- APIs IA : 100-300€/mois selon usage
- Stripe : 0€ + 1,5% par transaction
- **TOTAL : ~150-350€/mois**

### Phase Scale (1000+ users)

- Vercel Pro : 20$/mois
- Supabase Pro : 25€/mois
- APIs IA : négociation volume
- Stripe : 1,5% transactions
- **TOTAL : variable selon revenus**

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Installation locale
2. ✅ Configuration services
3. ✅ Déploiement Vercel
4. ⏳ Acquisition premiers utilisateurs
5. ⏳ Feedback & itérations
6. ⏳ Marketing & croissance

---

## 📞 SUPPORT

Questions ? Problèmes ?

- GitHub Issues
- Email : support@ommi.fr
- Twitter : @ommi_ai

---

**Bon courage et bon lancement ! 🎬🚀**