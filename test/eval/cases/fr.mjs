// Jeu d'évaluation ÉTIQUETÉ pour le français — rédigé par l'auteur du moteur (PAS indépendant).
// bad:  [texte, at, corrigé, nth?]  — `at` = fragment erroné (n-ième occurrence), `corrigé` = phrase corrigée.
const F = ' '; // espace fine insécable
const N = ' '; // espace insécable
export default {
  lang: 'fr',
  rules: {
    FR_ESPACE_PONCTUATION: {
      bad: [
        ['Tu viens demain?', '?', `Tu viens demain${F}?`],
        ['Attention ! Le sol est glissant.', ' !', `Attention${F}! Le sol est glissant.`],
        ['Voici la liste: pain, lait et œufs.', ':', `Voici la liste${N}: pain, lait et œufs.`],
        ['Il pleut ; nous restons à la maison.', ' ;', `Il pleut${F}; nous restons à la maison.`],
      ],
      good: [`Tu viens demain${F}?`, `Attention${F}! Le sol est glissant.`, `Voici la liste${N}: pain, lait et œufs.`, 'Il est 10:30 et le rendez-vous est à 12:45.', 'Notre site est https://exemple.fr/page?a=1 pour plus de détails.'],
    },
    FR_ELISION: {
      bad: [
        ['Je ai très faim ce soir.', 'Je ai', "J'ai très faim ce soir."],
        ['Ce est une bonne idée pour demain.', 'Ce est', "C'est une bonne idée pour demain."],
        ['Il faut que il vienne avec nous.', 'que il', "Il faut qu'il vienne avec nous."],
        ['Le ami de Paul habite à Lyon.', 'Le ami', "L'ami de Paul habite à Lyon."],
      ],
      good: ["J'ai très faim ce soir.", "C'est une bonne idée pour demain.", "Il faut qu'il vienne avec nous.", 'Le yaourt est dans le frigo.', 'Le onzième jour était calme.', 'Elle est à la une du journal.', 'Le héros arrive demain.'],
    },
    FR_ACCORD: {
      bad: [
        ['Il à mangé tout le gâteau hier.', 'Il à', 'Il a mangé tout le gâteau hier.'],
        ['Ils est partis très tôt ce matin.', 'Ils est', 'Ils sont partis très tôt ce matin.'],
        ['Elle ont fini leur travail hier.', 'Elle ont', 'Elle a fini leur travail hier.'],
        ['Ils on vu le film en entier.', 'Ils on', 'Ils ont vu le film en entier.'],
      ],
      good: ['Il a mangé tout le gâteau hier.', 'Ils sont partis très tôt ce matin.', 'Elle a fini son travail hier.', 'Ils ont vu le film en entier.', 'Il va à Paris demain.', 'On a faim depuis ce matin.'],
    },
    FR_PARTICIPE: {
      bad: [
        ['Elle a manger la pomme hier.', 'a manger', 'Elle a mangé la pomme hier.'],
        ["J'ai chanter toute la soirée.", "ai chanter", "J'ai chanté toute la soirée."],
        ['Nous avons parler de ce projet.', 'avons parler', 'Nous avons parlé de ce projet.'],
        ['On a planter des arbres dans le jardin.', 'a planter', 'On a planté des arbres dans le jardin.'],
      ],
      good: ['Elle a mangé la pomme hier.', "J'ai chanté toute la soirée.", 'Il faut manger avant de partir.', 'Elle va manger à midi.', 'Nous avons à parler de ce projet.', "Il a le droit de rentrer tôt."],
    },
    FR_MOIS_JOURS: {
      bad: [
        ['Je pars en Janvier pour le travail.', 'Janvier', 'Je pars en janvier pour le travail.'],
        ['Rendez-vous Lundi à neuf heures.', 'Lundi', 'Rendez-vous lundi à neuf heures.'],
        ['Il est né en Décembre dernier.', 'Décembre', 'Il est né en décembre dernier.'],
      ],
      good: ['Je pars en janvier pour le travail.', 'Janvier est un mois froid.', 'Lundi, nous commençons.', 'La sonde a atteint Mars hier soir.', 'La planète Mars est rouge.'],
    },

    // ---- règles communes ----
    DOUBLE_SPACE: {
      bad: [
        ['Nous  sommes allés au marché hier.', '  ', 'Nous sommes allés au marché hier.'],
        ['Elle lit un livre  sur les oiseaux.', '  ', 'Elle lit un livre sur les oiseaux.'],
        ['Demain   nous partons tôt.', '   ', 'Demain nous partons tôt.'],
      ],
      good: ['Nous sommes allés au marché hier.', 'Elle lit un livre sur les oiseaux.', 'Première ligne.\n  Deuxième ligne en retrait.'],
    },
    SPACE_BEFORE_PUNCT: {
      bad: [
        ['Bonjour , enchanté de vous voir.', ' ,', 'Bonjour, enchanté de vous voir.'],
        ['Il est parti très tôt .', ' .', 'Il est parti très tôt.'],
        ['Nous avons attendu longtemps …', ' …', 'Nous avons attendu longtemps…'],
      ],
      good: ['Bonjour, enchanté de vous voir.', 'Il est parti très tôt.', `Quoi${F}? Oui${F}!`, 'Attends... ne pars pas encore.'],
    },
    SPACE_AFTER_PUNCT: {
      bad: [
        ['Nous sommes venus,mais personne ne répondait.', ',', 'Nous sommes venus, mais personne ne répondait.'],
        ['Bonjour.Comment allez-vous aujourd’hui ?', '.', 'Bonjour. Comment allez-vous aujourd’hui ?'],
        ['As-tu mangé?Moi pas encore.', '?', `As-tu mangé${F}? Moi pas encore.`],
      ],
      good: ['Nous sommes venus, mais personne ne répondait.', 'Visitez www.exemple.fr pour plus de détails.', 'Écrivez à jean.dupont@exemple.fr demain.', 'Le prix est de 3,5 euros.'],
    },
    PUNCT_REPEAT: {
      bad: [
        ['Nous sommes venus,, mais personne ne répondait.', ',,', 'Nous sommes venus, mais personne ne répondait.'],
        ['Il est parti;; puis il est revenu.', ';;', `Il est parti${F}; puis il est revenu.`],
        ['Tout est terminé..', '..', 'Tout est terminé.'],
      ],
      good: ['Nous sommes venus, mais personne ne répondait.', 'Attends... ne pars pas encore.', 'Peut-être… qui sait ?'],
    },
    REPEATED_WORD: {
      bad: [
        ['Nous sommes allés au au marché hier.', ' au', 'Nous sommes allés au marché hier.', 1],
        ['Le livre est est sur la table.', ' est', 'Le livre est sur la table.', 1],
        ['Demain nous allons allons partir tôt.', ' allons', 'Demain nous allons partir tôt.', 1],
      ],
      good: ['Nous sommes allés au marché hier.', 'Je crois que que tu as raison.', 'Non, non, je ne veux pas partir.', 'Il a dit que nous nous verrions bientôt.'],
    },
    SENTENCE_CAPITAL: {
      bad: [
        ['Nous sommes rentrés. ensuite nous avons dîné.', 'ensuite', 'Nous sommes rentrés. Ensuite nous avons dîné.'],
        ['La pluie a cessé. le soleil est sorti des nuages.', 'le soleil', 'La pluie a cessé. Le soleil est sorti des nuages.'],
        ['Il est parti tôt. elle est restée seule.', 'elle', 'Il est parti tôt. Elle est restée seule.'],
      ],
      good: ['Nous sommes rentrés. Ensuite nous avons dîné.', 'M. dupont viendra vous voir.', "J'ai acheté du pain, du lait, etc. et je suis rentré.", 'Il habite av. Foch, près du parc.'],
    },
    UNPAIRED_BRACKET: {
      bad: [
        ['Nous sommes partis (sans rien dire.', '(', undefined],
        ['Nous sommes partis sans rien dire) du tout.', ')', undefined],
        ['La liste [pain, lait est courte.', '[', undefined],
      ],
      good: ['Nous sommes partis (sans rien dire).', '(a) le premier point ; (b) le second point.', 'Merci pour votre aide :)', '1) un 2) deux 3) trois'],
    },
    TYPOGRAPHIC_QUOTES: {
      bad: [
        ['Il a dit "oui" tout de suite.', '"oui"', `Il a dit «${F}oui${F}» tout de suite.`],
        ['Le mot "maison" a sept lettres.', '"maison"', `Le mot «${F}maison${F}» a sept lettres.`],
        ['J’ai lu "Les Misérables" cet hiver.', '"Les Misérables"', `J’ai lu «${F}Les Misérables${F}» cet hiver.`],
      ],
      good: [`Il a dit «${F}oui${F}» tout de suite.`, `Le mot «${F}maison${F}» a sept lettres.`, `J’ai lu «${F}Les Misérables${F}» cet hiver.`],
    },
    WRONG_OPEN_QUOTE: {
      bad: [
        ['Elle a dit “oui” sans hésiter.', '“', `Elle a dit «${F}oui” sans hésiter.`],
        ['Le titre “Les Misérables” est célèbre.', '“', `Le titre «${F}Les Misérables” est célèbre.`],
        ['Il a crié “courez” à la foule.', '“', `Il a crié «${F}courez” à la foule.`],
      ],
      good: [`Elle a dit «${F}oui${F}» sans hésiter.`, `Le titre «${F}Les Misérables${F}» est célèbre.`, `Il a crié «${F}courez${F}» à la foule.`],
    },
    SPACED_HYPHEN: {
      bad: [
        ['Paris - la capitale de la France, est grande.', ' - ', 'Paris – la capitale de la France, est grande.'],
        ['Jean - mon meilleur ami, est venu.', ' - ', 'Jean – mon meilleur ami, est venu.'],
        ['Le livre - une vieille histoire, a plu.', ' - ', 'Le livre – une vieille histoire, a plu.'],
      ],
      good: ['Paris – la capitale de la France, est grande.', 'C’est un chef-d’œuvre bien connu.', 'Il a acheté 5 - 3 = 2 pommes.', '— Tu viens demain ? a demandé Jean.'],
    },
    UNIT_SPACE: {
      bad: [
        ['La distance est de 5km à pied.', '5km', `La distance est de 5${N}km à pied.`],
        ['Le fichier fait 20MB au total.', '20MB', `Le fichier fait 20${N}MB au total.`],
        ['Le sac pèse 3,5kg exactement.', '3,5kg', `Le sac pèse 3,5${N}kg exactement.`],
      ],
      good: [`La distance est de 5${N}km à pied.`, 'Le fichier fait 20 MB au total.', 'La formule est H2O ou CO2.', 'La vitesse est de 50 km/h.'],
    },
    SPACE_BEFORE_CLOSE_BRACKET: {
      bad: [
        ['Nous sommes partis ( sans rien dire).', '( ', 'Nous sommes partis (sans rien dire).'],
        ['Nous sommes partis (sans rien dire ).', ' )', 'Nous sommes partis (sans rien dire).'],
        ['Le livre ( ancien) était sur la table.', '( ', 'Le livre (ancien) était sur la table.'],
      ],
      good: ['Nous sommes partis (sans rien dire).', 'Le livre (ancien) était sur la table.', 'La liste (a, b, c) est complète.'],
    },
    SPELLING: {
      bad: [
        ['Je recois beaucoup de courriels chaque matin.', 'recois', 'Je reçois beaucoup de courriels chaque matin.'],
        ['La réunoin est demain à neuf heures.', 'réunoin', 'La réunion est demain à neuf heures.'],
        ['Elle a un jardin tres joli derrière la maison.', 'tres', 'Elle a un jardin très joli derrière la maison.'],
        ['Nous devons separer les fichiers avec soin.', 'separer', 'Nous devons séparer les fichiers avec soin.'],
        ['C’est vraiment la meileure option possible.', 'meileure', 'C’est vraiment la meilleure option possible.'],
        ['Il était embarassé par cette erreur.', 'embarassé', 'Il était embarrassé par cette erreur.'],
        ['Le gouvernemnt a annoncé de nouvelles règles.', 'gouvernemnt', 'Le gouvernement a annoncé de nouvelles règles.'],
        ['Nous avons mangé dans un restaurnat italien.', 'restaurnat', 'Nous avons mangé dans un restaurant italien.'],
      ],
      good: [
        'Je reçois beaucoup de courriels chaque matin.',
        'La réunion est demain à neuf heures.',
        'Elle a un jardin très joli derrière la maison.',
        'Lyon et Marseille sont de grandes villes françaises.',
        'Le gouvernement a annoncé de nouvelles règles.',
        'Nous avons mangé dans un restaurant italien.',
        "Aujourd'hui, l'été commence tôt en Provence.",
        'Les enfants ont joué au football après l’école.',
      ],
    },
    STYLE_LONG_SENTENCE: {
      bad: [
        ["Le matin, quand je me suis réveillé et que j'ai vu qu'une pluie fine tombait sur les vieux toits de la ville, j'ai décidé de ne pas aller au travail et de rester à la maison, où j'ai préparé un long café, ouvert la fenêtre, lu quelques pages d'un vieux livre que m'avait offert mon grand-père et attendu que la pluie s'arrête, même si je savais très bien qu'elle ne s'arrêterait pas de sitôt.", 'Le matin', undefined],
        ["Le maire a annoncé que les travaux de la nouvelle rocade commenceraient au printemps, après que les autorités auraient signé tous les documents nécessaires, obtenu l'accord des ministères concernés, choisi l'entreprise par appel d'offres public et défini avec les habitants le tracé exact de la route, de manière à toucher le moins de maisons possible.", 'Le maire', undefined],
        ["Bien que les professeurs aient demandé plusieurs fois que le règlement de l'école soit modifié, et que les parents aient signé des pétitions et participé aux réunions chaque mois, la direction a reporté sa décision jusqu'à ce que l'inspection envoie une commission qui a examiné les dossiers, parlé avec les élèves et recommandé des changements importants dans l'emploi du temps.", 'Bien que', undefined],
      ],
      good: [
        "Le matin, je suis resté à la maison, j'ai préparé un long café et lu quelques pages d'un vieux livre que m'avait offert mon grand-père.",
        "Le maire a annoncé que les travaux de la nouvelle rocade commenceraient au printemps, après la signature des documents et le choix de l'entreprise.",
        "Les professeurs ont demandé que le règlement soit modifié, et les parents ont signé des pétitions, mais la décision a été reportée jusqu'à l'arrivée d'une commission.",
      ],
    },
    STYLE_REPEATED_WORD: {
      bad: [
        ['Le village est grand, le vieux village a des rues étroites, et le nouveau village a de larges avenues.', 'village', undefined, 2],
        ['Le projet a commencé en mars, le projet a continué en été et le projet s’est terminé en automne.', 'projet', undefined, 2],
        ['Les élèves sont arrivés tôt, les élèves ont beaucoup lu et les élèves sont partis tard le soir.', 'élèves', undefined, 2],
      ],
      good: [
        'Le village est grand, le vieux quartier a des rues étroites, et le nouveau district a de larges avenues.',
        'Le projet a commencé en mars et s’est terminé en automne, après deux étapes de travail.',
        'Les élèves sont arrivés tôt, ont beaucoup lu et sont partis tard le soir, plutôt satisfaits.',
      ],
    },
  },
};
