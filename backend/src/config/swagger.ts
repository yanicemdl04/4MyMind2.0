import { env } from './env';

export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'ForMyMind API',
    description:
      'API backend pour le suivi du bien-être mental et le soutien émotionnel assisté par IA.\n\n' +
      '## Authentification\n' +
      'La plupart des endpoints nécessitent un **Bearer token**.\n\n' +
      '1. Utilisez `POST /api/auth/register` pour créer un compte\n' +
      '2. Utilisez `POST /api/auth/login` pour obtenir vos tokens\n' +
      '3. Cliquez sur le bouton **Authorize** 🔒 ci-dessus\n' +
      '4. Collez : `Bearer <votre_access_token>`\n\n' +
      '## Service IA Python\n' +
      'La documentation du microservice IA (FastAPI) est disponible sur [http://localhost:8000/docs](http://localhost:8000/docs)',
    version: '2.0.0',
    contact: { name: 'ForMyMind — Projet de thèse' },
  },
  servers: [
    { url: `http://localhost:${env.PORT}`, description: 'Développement local' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Entrez votre token JWT obtenu via /api/auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          avatarUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  tags: [
    { name: 'Santé', description: 'Vérification de l\'état du serveur' },
    { name: 'Authentification', description: 'Inscription, connexion, déconnexion, gestion du profil' },
    { name: 'Confidentialité', description: 'Endpoints RGPD — export, suppression et anonymisation des données' },
    { name: 'Journal', description: 'Entrées de journal personnel — CRUD avec suppression douce' },
    { name: 'Humeur', description: 'Suivi de l\'humeur — enregistrement, statistiques, tendances et détection d\'anomalies' },
    { name: 'Exercices', description: 'Exercices de bien-être — catalogue, suivi des complétions, recommandations' },
    { name: 'Chatbot IA', description: 'Assistant IA basé sur les principes TCC (Thérapie Cognitivo-Comportementale)' },
    { name: 'Contenu', description: 'Ressources éducatives — articles, vidéos, podcasts, infographies' },
    { name: 'Analytique', description: 'Score de bien-être, patterns comportementaux et prédiction IA' },
  ],
  paths: {
    // ─── Santé ──────────────────────────────────────────
    '/api/health': {
      get: {
        tags: ['Santé'],
        summary: 'Vérifier l\'état du serveur',
        description: 'Retourne le statut du serveur, l\'environnement et le timestamp actuel.',
        responses: {
          200: { description: 'Le serveur fonctionne correctement' },
        },
      },
    },

    // ─── Authentification ───────────────────────────────
    '/api/auth/register': {
      post: {
        tags: ['Authentification'],
        summary: 'Créer un nouveau compte utilisateur',
        description: 'Inscrit un utilisateur et retourne un access token + refresh token. Le mot de passe doit contenir au moins 8 caractères.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'utilisateur@formymind.com' },
                  password: { type: 'string', minLength: 8, example: 'MonMotDePasse123!' },
                  firstName: { type: 'string', example: 'Jean' },
                  lastName: { type: 'string', example: 'Dupont' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Compte créé avec succès — retourne user + tokens' },
          409: { description: 'Cet email est déjà utilisé' },
          400: { description: 'Données invalides (validation Zod)' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Se connecter avec email et mot de passe',
        description: 'Retourne un access token (15 min) et un refresh token (7 jours). Copiez l\'access token et utilisez-le dans Authorize.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'utilisateur@formymind.com' },
                  password: { type: 'string', example: 'MonMotDePasse123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Connexion réussie — retourne user + tokens' },
          401: { description: 'Identifiants invalides' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentification'],
        summary: 'Se déconnecter (révoquer le refresh token)',
        description: 'Invalide le refresh token stocké en base. L\'access token reste valide jusqu\'à expiration.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Déconnexion réussie' },
          401: { description: 'Token d\'accès requis' },
        },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        tags: ['Authentification'],
        summary: 'Renouveler la paire de tokens',
        description: 'Envoie le refresh token pour obtenir un nouveau couple access/refresh token. L\'ancien refresh token est invalidé (rotation).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: 'Le refresh token obtenu lors du login' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Nouvelle paire de tokens retournée' },
          401: { description: 'Refresh token invalide ou expiré' },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Authentification'],
        summary: 'Récupérer le profil de l\'utilisateur connecté',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Données du profil utilisateur' },
          401: { description: 'Non authentifié' },
        },
      },
      put: {
        tags: ['Authentification'],
        summary: 'Modifier le profil utilisateur',
        description: 'Permet de modifier le prénom, nom et avatar. Tous les champs sont optionnels.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', example: 'Jean' },
                  lastName: { type: 'string', example: 'Dupont' },
                  avatarUrl: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profil mis à jour' },
        },
      },
    },

    // ─── Confidentialité (RGPD) ─────────────────────────
    '/api/auth/privacy/export': {
      get: {
        tags: ['Confidentialité'],
        summary: 'Exporter toutes les données personnelles (RGPD Art. 20)',
        description: 'Retourne l\'intégralité des données de l\'utilisateur en JSON : profil, journal, humeurs, exercices, conversations, recommandations.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Export complet des données utilisateur' },
        },
      },
    },
    '/api/auth/privacy/delete': {
      post: {
        tags: ['Confidentialité'],
        summary: 'Supprimer définitivement le compte et toutes les données (RGPD Art. 17)',
        description: 'Suppression irréversible. Nécessite une confirmation explicite avec la valeur "DELETE_MY_ACCOUNT".',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['confirmation'],
                properties: {
                  confirmation: { type: 'string', example: 'DELETE_MY_ACCOUNT', description: 'Doit être exactement "DELETE_MY_ACCOUNT"' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Compte et données supprimés définitivement' },
          400: { description: 'Confirmation manquante ou incorrecte' },
        },
      },
    },
    '/api/auth/privacy/anonymize': {
      post: {
        tags: ['Confidentialité'],
        summary: 'Anonymiser le compte (supprimer les données personnelles, garder les données agrégées)',
        description: 'Remplace les informations identifiantes par des valeurs anonymes. Les données statistiques (scores, fréquences) sont conservées pour la recherche.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Compte anonymisé avec succès' },
        },
      },
    },

    // ─── Journal ────────────────────────────────────────
    '/api/journal': {
      post: {
        tags: ['Journal'],
        summary: 'Créer une entrée de journal',
        description: 'Enregistre une nouvelle entrée avec titre, contenu et tags optionnels.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', example: 'Ma journée aujourd\'hui' },
                  content: { type: 'string', example: 'Je me suis senti bien après ma promenade matinale...' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['gratitude', 'nature'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Entrée créée avec succès' },
        },
      },
      get: {
        tags: ['Journal'],
        summary: 'Lister les entrées de journal (paginé)',
        description: 'Retourne les entrées non supprimées, triées par date décroissante.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Numéro de page' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Nombre d\'éléments par page (max 100)' },
        ],
        responses: {
          200: { description: 'Liste paginée des entrées de journal' },
        },
      },
    },
    '/api/journal/{id}': {
      get: {
        tags: ['Journal'],
        summary: 'Récupérer une entrée de journal par ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'ID de l\'entrée' }],
        responses: {
          200: { description: 'Entrée de journal' },
          404: { description: 'Entrée non trouvée' },
        },
      },
      put: {
        tags: ['Journal'],
        summary: 'Modifier une entrée de journal',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Entrée mise à jour' },
        },
      },
      delete: {
        tags: ['Journal'],
        summary: 'Supprimer une entrée de journal (suppression douce)',
        description: 'L\'entrée est marquée comme supprimée mais reste en base pour l\'audit.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Entrée supprimée' },
        },
      },
    },

    // ─── Humeur ─────────────────────────────────────────
    '/api/mood': {
      post: {
        tags: ['Humeur'],
        summary: 'Enregistrer une humeur',
        description: 'Enregistre le niveau d\'humeur (1-10), la catégorie, une note optionnelle et les facteurs influençants.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['level', 'score'],
                properties: {
                  level: { type: 'string', enum: ['VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'EXCELLENT'], example: 'GOOD' },
                  score: { type: 'integer', minimum: 1, maximum: 10, example: 7 },
                  note: { type: 'string', example: 'Me sens bien après le sport' },
                  factors: { type: 'array', items: { type: 'string' }, example: ['exercice', 'bon sommeil'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Humeur enregistrée' },
        },
      },
      get: {
        tags: ['Humeur'],
        summary: 'Lister les entrées d\'humeur (paginé)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Liste paginée des humeurs' },
        },
      },
    },
    '/api/mood/stats': {
      get: {
        tags: ['Humeur'],
        summary: 'Obtenir les statistiques d\'humeur avec tendances et anomalies',
        description: 'Analyse les humeurs sur la période choisie : moyenne, tendance (régression linéaire), distribution par niveau, et détection d\'anomalies (chutes soudaines).',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'range', in: 'query', schema: { type: 'string', enum: ['7days', '30days', '90days', '1year'], default: '7days' }, description: 'Période d\'analyse' },
        ],
        responses: {
          200: { description: 'Statistiques avec tendance, distribution et anomalies détectées' },
        },
      },
    },
    '/api/mood/{id}': {
      get: {
        tags: ['Humeur'],
        summary: 'Récupérer une humeur par ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Entrée d\'humeur' } },
      },
      put: {
        tags: ['Humeur'],
        summary: 'Modifier une entrée d\'humeur',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  level: { type: 'string', enum: ['VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'EXCELLENT'] },
                  score: { type: 'integer', minimum: 1, maximum: 10 },
                  note: { type: 'string' },
                  factors: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Humeur mise à jour' } },
      },
      delete: {
        tags: ['Humeur'],
        summary: 'Supprimer une humeur (suppression douce)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Humeur supprimée' } },
      },
    },

    // ─── Exercices ──────────────────────────────────────
    '/api/exercise': {
      post: {
        tags: ['Exercices'],
        summary: 'Créer un exercice de bien-être',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'category', 'difficulty', 'durationMin'],
                properties: {
                  title: { type: 'string', example: 'Respiration profonde' },
                  description: { type: 'string', example: 'Un exercice de respiration calmant' },
                  category: { type: 'string', enum: ['BREATHING', 'MEDITATION', 'JOURNALING', 'PHYSICAL', 'MINDFULNESS', 'CBT', 'RELAXATION'] },
                  difficulty: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
                  durationMin: { type: 'integer', example: 10 },
                  instructions: { type: 'array', items: { type: 'string' } },
                  imageUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Exercice créé' } },
      },
      get: {
        tags: ['Exercices'],
        summary: 'Lister les exercices (filtrable par catégorie/difficulté)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['BREATHING', 'MEDITATION', 'JOURNALING', 'PHYSICAL', 'MINDFULNESS', 'CBT', 'RELAXATION'] }, description: 'Filtrer par catégorie' },
          { name: 'difficulty', in: 'query', schema: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] }, description: 'Filtrer par difficulté' },
        ],
        responses: { 200: { description: 'Liste paginée des exercices' } },
      },
    },
    '/api/exercise/stats': {
      get: {
        tags: ['Exercices'],
        summary: 'Obtenir les statistiques d\'exercices de l\'utilisateur',
        description: 'Nombre total complété, complétés les 30 derniers jours, répartition par catégorie.',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Statistiques par catégorie' } },
      },
    },
    '/api/exercise/recommendations': {
      get: {
        tags: ['Exercices'],
        summary: 'Obtenir des recommandations d\'exercices personnalisées',
        description: 'Suggère des exercices que l\'utilisateur n\'a pas encore complétés.',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Exercices recommandés' } },
      },
    },
    '/api/exercise/{id}': {
      get: {
        tags: ['Exercices'],
        summary: 'Récupérer un exercice par ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Détails de l\'exercice' } },
      },
      put: {
        tags: ['Exercices'],
        summary: 'Modifier un exercice',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Exercice mis à jour' } },
      },
      delete: {
        tags: ['Exercices'],
        summary: 'Supprimer un exercice (suppression douce)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Exercice désactivé' } },
      },
    },
    '/api/exercise/log': {
      post: {
        tags: ['Exercices'],
        summary: 'Enregistrer la complétion d\'un exercice',
        description: 'Enregistre qu\'un utilisateur a complété un exercice, avec durée, note et commentaire optionnels.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['exerciseId'],
                properties: {
                  exerciseId: { type: 'string', format: 'uuid', description: 'ID de l\'exercice complété' },
                  durationMin: { type: 'integer', example: 15, description: 'Durée en minutes' },
                  rating: { type: 'integer', minimum: 1, maximum: 5, example: 4, description: 'Note de 1 à 5' },
                  notes: { type: 'string', example: 'Très relaxant, je recommence demain' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Complétion enregistrée' } },
      },
    },

    // ─── Chatbot IA ─────────────────────────────────────
    '/api/chatbot/message': {
      post: {
        tags: ['Chatbot IA'],
        summary: 'Envoyer un message au chatbot IA',
        description: 'Le chatbot utilise les principes de la TCC (Thérapie Cognitivo-Comportementale). Omettez conversationId pour démarrer une nouvelle conversation.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Je me sens anxieux ces derniers temps' },
                  conversationId: { type: 'string', format: 'uuid', description: 'Optionnel — omettre pour démarrer une nouvelle conversation' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Réponse de l\'IA avec le conversationId' },
        },
      },
    },
    '/api/chatbot/history': {
      get: {
        tags: ['Chatbot IA'],
        summary: 'Récupérer l\'historique des conversations',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'conversationId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filtrer par conversation spécifique' },
        ],
        responses: { 200: { description: 'Liste des messages' } },
      },
      delete: {
        tags: ['Chatbot IA'],
        summary: 'Supprimer tout l\'historique de conversation',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Historique effacé' } },
      },
    },
    '/api/chatbot/recommendations': {
      get: {
        tags: ['Chatbot IA'],
        summary: 'Obtenir des recommandations basées sur l\'humeur',
        description: 'Analyse les humeurs récentes pour proposer des recommandations personnalisées.',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Recommandations basées sur le score moyen d\'humeur' } },
      },
    },
    '/api/chatbot/analyze': {
      post: {
        tags: ['Chatbot IA'],
        summary: 'Analyser un texte pour détecter les patterns émotionnels',
        description: 'Détecte le sentiment, les émotions, les distorsions cognitives (TCC) et propose des suggestions. Utilise le microservice Python si disponible, sinon OpenAI.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string', example: 'Tout va toujours mal pour moi, je ne fais jamais rien de bien' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Analyse : sentiment, émotions, distorsions cognitives, suggestions' },
        },
      },
    },

    // ─── Contenu ────────────────────────────────────────
    '/api/content': {
      get: {
        tags: ['Contenu'],
        summary: 'Lister tout le contenu éducatif',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Liste paginée du contenu' } },
      },
    },
    '/api/content/recommended': {
      get: {
        tags: ['Contenu'],
        summary: 'Obtenir du contenu recommandé selon l\'humeur',
        description: 'Analyse les humeurs récentes pour sélectionner du contenu pertinent (ex: relaxation si humeur basse, motivation si humeur haute).',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Contenu recommandé basé sur l\'historique d\'humeur' } },
      },
    },
    '/api/content/type/{type}': {
      get: {
        tags: ['Contenu'],
        summary: 'Filtrer le contenu par type',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['VIDEO', 'ARTICLE', 'EXERCISE', 'PODCAST', 'INFOGRAPHIC'] }, description: 'Type de contenu' },
        ],
        responses: { 200: { description: 'Contenu filtré par type' } },
      },
    },
    '/api/content/{id}': {
      get: {
        tags: ['Contenu'],
        summary: 'Récupérer un contenu par ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Détails du contenu' } },
      },
    },

    // ─── Analytique ─────────────────────────────────────
    '/api/analytics/user-patterns': {
      get: {
        tags: ['Analytique'],
        summary: 'Obtenir les patterns comportementaux sur 30 jours',
        description: 'Analyse croisée des humeurs (moyennes quotidiennes, tendance), du journal (tags fréquents, sentiment moyen) et des exercices (fréquence par catégorie).',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Patterns avec analyse de tendance' } },
      },
    },
    '/api/analytics/wellbeing-score': {
      get: {
        tags: ['Analytique'],
        summary: 'Obtenir le score de bien-être composite (0-100)',
        description: 'Score calculé sur 7 jours glissants, basé sur 5 dimensions pondérées : humeur moyenne (30%), stabilité (15%), journal (20%), exercices (20%), régularité (15%).',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Score avec détail par dimension et niveau (excellent/good/moderate/low/critical)' } },
      },
    },
    '/api/analytics/ai-prediction': {
      get: {
        tags: ['Analytique'],
        summary: 'Obtenir la prédiction IA du bien-être (microservice Python)',
        description: 'Appelle le microservice Python FastAPI pour une prédiction ML combinant humeur, sentiment NLP et activité. Si le service est indisponible, utilise l\'algorithme local en fallback.',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Prédiction IA avec niveau de risque, tendance et insights' } },
      },
    },
    '/api/analytics/ai-health': {
      get: {
        tags: ['Analytique'],
        summary: 'Vérifier la disponibilité du microservice IA',
        description: 'Vérifie si le service Python FastAPI est accessible et répond correctement.',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Statut de disponibilité du service IA' } },
      },
    },
  },
};
