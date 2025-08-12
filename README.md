# Application de Récupération - Next.js

Une application de récupération sécurisée avec authentification à deux facteurs (2FA) et codes de récupération.

## 🚀 Fonctionnalités

- **Authentification sécurisée** : Inscription et connexion avec JWT
- **Authentification à deux facteurs (2FA)** : Utilisation de TOTP avec Google Authenticator
- **Codes de récupération** : 16 codes uniques pour accès d'urgence
- **Interface moderne** : UI basée sur shadcn/ui et Tailwind CSS
- **Validation robuste** : Validation des données avec Zod
- **Base de données MongoDB** : Stockage sécurisé avec Mongoose

## 📋 Prérequis

- Node.js 18+ 
- MongoDB (local ou cloud)
- npm ou yarn

## 🛠️ Installation

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd my-recovery-app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration des variables d'environnement**
   
   Créer un fichier `.env.local` à la racine du projet :
   ```env
   # Base de données MongoDB
   MONGODB_URL=mongodb://127.0.0.1:27017/next-js-app
   
   # Clé secrète JWT (générer une clé forte)
   JWT_SECRET=votre_cle_secrete_jwt_tres_longue_et_securisee_ici
   
   # Environnement
   NODE_ENV=development
   ```

4. **Démarrer MongoDB**
   
   Sur Windows :
   ```powershell
   net start MongoDB
   ```
   
   Sur macOS/Linux :
   ```bash
   sudo systemctl start mongod
   # ou
   brew services start mongodb/brew/mongodb-community
   ```

5. **Lancer l'application**
   ```bash
   npm run dev
   ```

   L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 🔧 Résolution des problèmes

### Erreur `ECONNREFUSED 127.0.0.1:27017`

Cette erreur signifie que MongoDB n'est pas démarré. Solutions :

1. **Vérifier si MongoDB fonctionne :**
   ```powershell
   netstat -an | findstr 27017
   ```

2. **Démarrer MongoDB :**
   ```powershell
   net start MongoDB
   ```

3. **Vérifier le service MongoDB :**
   ```powershell
   Get-Service MongoDB
   ```

### Variables d'environnement manquantes

Assurez-vous que le fichier `.env.local` contient toutes les variables requises et qu'il est à la racine du projet.

### Erreurs de connexion à la base de données

1. Vérifiez que MongoDB est démarré
2. Vérifiez l'URL de connexion dans `MONGODB_URL`
3. Redémarrez le serveur de développement après modification des variables d'environnement

## 📁 Structure du projet

```
src/
├── app/
│   ├── (auth)/          # Pages d'authentification
│   ├── (dashboard)/     # Pages du tableau de bord
│   └── api/            # Routes API
├── components/
│   ├── forms/          # Composants de formulaires
│   ├── modals/         # Composants modaux
│   ├── sections/       # Sections de page
│   └── ui/            # Composants UI (shadcn)
├── lib/
│   ├── actions/        # Actions serveur
│   ├── database/       # Configuration et modèles MongoDB
│   ├── utils.ts        # Utilitaires
│   └── validations.ts  # Schémas de validation Zod
└── types/              # Types TypeScript
```

## 🔐 Sécurité

### Authentification à deux facteurs (2FA)

1. L'utilisateur active la 2FA depuis son tableau de bord
2. Un QR code est généré pour Google Authenticator
3. L'utilisateur scanne le code et confirme avec un token TOTP
4. La 2FA est obligatoire pour les connexions futures

### Codes de récupération

- 16 codes uniques générés automatiquement
- Utilisables une seule fois
- Permettent l'accès en cas de perte du dispositif 2FA
- Stockés de manière sécurisée en base de données

### Sécurisation des mots de passe

- Hachage avec bcrypt (10 rounds)
- Validation de force minimale (8 caractères)
- Pas de stockage en clair

## 📊 API Routes

### Authentification
- `POST /api/register` - Inscription d'un nouvel utilisateur
- `POST /api/login` - Connexion utilisateur
- `GET /api/profile` - Profil utilisateur (authentifié)

### 2FA
- `POST /api/twofa` - Générer une clé 2FA
- `PUT /api/twofa` - Vérifier et activer la 2FA
- `GET /api/twofa` - Statut 2FA de l'utilisateur
- `DELETE /api/twofa` - Désactiver la 2FA
- `POST /api/twofa-by-email` - Récupérer le statut 2FA par email
- `PUT /api/twofa-by-email` - Vérifier un token 2FA par email

### Codes de récupération
- `POST /api/recovery-codes` - Générer de nouveaux codes
- `GET /api/recovery-codes` - Lister les codes utilisateur
- `PUT /api/recovery-codes` - Vérifier un code de récupération

## 🧪 Tests

Pour tester l'application :

1. **Inscription** : Créez un compte sur `/register`
2. **Connexion** : Connectez-vous sur `/login`
3. **Configuration 2FA** : Activez la 2FA depuis le tableau de bord
4. **Codes de récupération** : Générez et testez les codes de récupération

## 🚀 Déploiement

### Variables d'environnement de production

```env
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/production
JWT_SECRET=cle_secrete_production_tres_forte
NODE_ENV=production
```

### Étapes de déploiement

1. Configurez MongoDB Atlas ou une instance MongoDB de production
2. Définissez les variables d'environnement
3. Buildez l'application : `npm run build`
4. Déployez sur Vercel, Netlify, ou votre plateforme préférée

## 🛡️ Bonnes pratiques de sécurité

- Changez la clé JWT_SECRET régulièrement
- Utilisez HTTPS en production
- Surveillez les tentatives de connexion suspectes
- Sauvegardez régulièrement la base de données
- Gardez les dépendances à jour

## 📞 Support

En cas de problème, vérifiez :
1. La console du navigateur pour les erreurs frontend
2. Les logs du serveur pour les erreurs backend
3. Le statut de MongoDB
4. Les variables d'environnement