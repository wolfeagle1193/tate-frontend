# 🚀 Guide de déploiement Taté — GitHub + Render + Vercel

> Suis ces étapes dans l'ordre. Durée estimée : 30 minutes.

---

## Étape 1 — Créer les dépôts GitHub

1. Va sur [github.com](https://github.com) → **New repository**
2. Crée **deux** dépôts (privés recommandé) :
   - `tate-backend`
   - `tate-frontend`
3. **Ne coche rien** (pas de README, pas de .gitignore) → clic "Create repository"

---

## Étape 2 — Pousser le Backend

Ouvre un terminal dans le dossier `tate-backend` :

```bash
# Initialiser git
cd tate-backend
git init
git add -A
git commit -m "feat: initialisation Taté backend"

# Connecter à GitHub (remplace TON_PSEUDO par ton pseudo GitHub)
git remote add origin https://github.com/TON_PSEUDO/tate-backend.git
git branch -M main
git push -u origin main
```

---

## Étape 3 — Pousser le Frontend

```bash
cd tate-frontend
git init
git add -A
git commit -m "feat: initialisation Taté frontend"

git remote add origin https://github.com/TON_PSEUDO/tate-frontend.git
git branch -M main
git push -u origin main
```

---

## Étape 4 — Déployer le Backend sur Render

1. Va sur [render.com](https://render.com) → **New → Web Service**
2. Connecte ton compte GitHub
3. Choisis le repo `tate-backend`
4. Render détecte `render.yaml` automatiquement → clique **Deploy**
5. Va dans **Environment → Add Environment Variable** et saisis :

| Variable | Valeur |
|----------|--------|
| `MONGODB_URI` | Ton URI MongoDB Atlas (ex: `mongodb+srv://...`) |
| `ANTHROPIC_API_KEY` | Ta clé API Claude (`sk-ant-...`) |
| `ADMIN_EMAIL` | `admin@tate.sn` |
| `ADMIN_PASSWORD` | Ton mot de passe admin |
| `FRONTEND_URL` | *(laisser vide pour l'instant, tu remplis après l'étape 5)* |

6. Clique **Save Changes** → le backend se redéploie
7. Note l'URL de ton backend : `https://tate-backend.onrender.com`

---

## Étape 5 — Déployer le Frontend sur Vercel

1. Va sur [vercel.com](https://vercel.com) → **New Project**
2. Importe le repo `tate-frontend` depuis GitHub
3. Vercel détecte automatiquement Vite
4. Dans **Environment Variables**, ajoute :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://tate-backend.onrender.com/api` |

5. Clique **Deploy**
6. Note l'URL de ton frontend : `https://tate-frontend.vercel.app`

---

## Étape 6 — Mettre à jour FRONTEND_URL sur Render

1. Retourne sur Render → ton service `tate-backend`
2. **Environment → Edit** → mets `FRONTEND_URL = https://tate-frontend.vercel.app`
3. Clique **Save Changes** → le backend se redéploie

---

## Étape 7 — Initialiser la base de données

Après le premier déploiement Render, crée le compte admin :

```bash
# Depuis ton terminal local, avec les variables d'env correctes :
cd tate-backend
node src/db/seed.js
```

Ou si ton backend est déjà en ligne, utilise l'endpoint :
```
POST https://tate-backend.onrender.com/api/auth/seed
```

---

## ✅ Vérification finale

Ouvre ton URL Vercel → tu devrais voir la page de connexion Taté.

Connecte-toi avec :
- Email : `admin@tate.sn`
- Mot de passe : celui que tu as défini

---

## ⚠️ Remarques importantes

- **Render Free Tier** : le serveur "s'endort" après 15 min d'inactivité → premier chargement lent (~30s). Upgrades possible si besoin.
- **Variables d'env** : ne jamais committer le fichier `.env` (déjà dans `.gitignore` ✅)
- **MongoDB Atlas** : assure-toi d'autoriser les IPs de Render dans Atlas → **Network Access → Add 0.0.0.0/0** (allow everywhere)

---

*Taté — Plateforme éducative sénégalaise 🇸🇳*
