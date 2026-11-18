// Texte de interfață (ro, en, fr, es). Fără dependențe externe.
const S = {
  ro: {
    site_disable: 'Dezactivează pe acest site',
    app: 'ERATA', tagline: 'Corector offline, fără cont și fără trimiterea textului în exterior',
    enabled: 'Activat', site_on: 'Activ pe acest site', site_off: 'Dezactivat pe acest site',
    issues: '{n} probleme', none: 'Nicio problemă găsită', fix_all: 'Corectează tot', restore: 'Adaugă diacritice',
    ignore: 'Ignoră', ignore_rule: 'Dezactivează regula', add_word: 'Adaugă în dicționar', no_sugg: 'Fără sugestii',
    loading: 'Se caută sugestii…', language: 'Limbă', auto: 'Automat', readability: 'Lizibilitate', applied: '{n} corecții aplicate',
    rewrite: 'Reformulează (local)', rewriting: 'Se reformulează…', settings: 'Setări', open_options: 'Deschide setările',
    cat_spelling: 'Ortografie', cat_grammar: 'Gramatică', cat_punctuation: 'Punctuație', cat_typography: 'Tipografie', cat_style: 'Stil',
    easy: 'foarte ușor', plain: 'ușor', medium: 'mediu', hard: 'dificil', 'very-hard': 'foarte dificil',
    studio: 'Studio de text', studio_hint: 'Lipiți sau scrieți textul aici; verificarea se face local.',
    general: 'General', categories: 'Categorii de verificare', personal: 'Dicționar personal', rules: 'Reguli proprii',
    disabled_rules: 'Reguli dezactivate', dicts: 'Dicționare importate', advanced: 'Avansat', save: 'Salvează', saved: 'Salvat',
    ui_lang: 'Limba interfeței', default_lang: 'Limba implicită', en_variant: 'Engleză', long_sentence: 'Propoziție lungă de la (cuvinte)',
    hide_native: 'Ascunde verificatorul nativ al browserului în câmpurile verificate', badge: 'Arată insigna din câmp',
    import_dict: 'Importă dicționar Hunspell (.aff + .dic)', dict_code: 'Cod limbă (ex. de)', export: 'Exportă', import: 'Importă',
    llm_title: 'Reformulare cu model local (opțional)', llm_note: 'Dezactivat implicit. Textul este trimis doar către adresa de mai jos, de preferat localhost.',
    llm_endpoint: 'Adresă (compatibilă OpenAI)', llm_model: 'Model', remove: 'Șterge', add: 'Adaugă', pattern: 'Model (regex)', replacement: 'Înlocuire',
    message: 'Mesaj', empty: 'Nimic de afișat.', disabled_sites: 'Site-uri dezactivate', privacy: 'Confidențialitate: textul nu părăsește calculatorul.',
  },
  en: {
    site_disable: 'Turn off on this site',
    app: 'ERATA', tagline: 'Offline proofreader — no account, your text never leaves the device',
    enabled: 'Enabled', site_on: 'Active on this site', site_off: 'Disabled on this site',
    issues: '{n} issues', none: 'No issues found', fix_all: 'Fix all', restore: 'Restore diacritics',
    ignore: 'Ignore', ignore_rule: 'Turn off this rule', add_word: 'Add to dictionary', no_sugg: 'No suggestions',
    loading: 'Looking for suggestions…', language: 'Language', auto: 'Automatic', readability: 'Readability', applied: '{n} fixes applied',
    rewrite: 'Rewrite (local)', rewriting: 'Rewriting…', settings: 'Settings', open_options: 'Open settings',
    cat_spelling: 'Spelling', cat_grammar: 'Grammar', cat_punctuation: 'Punctuation', cat_typography: 'Typography', cat_style: 'Style',
    easy: 'very easy', plain: 'easy', medium: 'medium', hard: 'difficult', 'very-hard': 'very difficult',
    studio: 'Text studio', studio_hint: 'Paste or type your text here; checking happens locally.',
    general: 'General', categories: 'Check categories', personal: 'Personal dictionary', rules: 'Custom rules',
    disabled_rules: 'Disabled rules', dicts: 'Imported dictionaries', advanced: 'Advanced', save: 'Save', saved: 'Saved',
    ui_lang: 'Interface language', default_lang: 'Default language', en_variant: 'English', long_sentence: 'Long sentence from (words)',
    hide_native: 'Hide the browser’s native spellchecker in checked fields', badge: 'Show the in-field badge',
    import_dict: 'Import a Hunspell dictionary (.aff + .dic)', dict_code: 'Language code (e.g. de)', export: 'Export', import: 'Import',
    llm_title: 'Rewrite with a local model (optional)', llm_note: 'Off by default. Text is sent only to the address below — preferably localhost.',
    llm_endpoint: 'Endpoint (OpenAI-compatible)', llm_model: 'Model', remove: 'Remove', add: 'Add', pattern: 'Pattern (regex)', replacement: 'Replacement',
    message: 'Message', empty: 'Nothing to show.', disabled_sites: 'Disabled sites', privacy: 'Privacy: your text never leaves this computer.',
  },
  fr: {
    site_disable: 'Désactiver sur ce site',
    app: 'ERATA', tagline: 'Correcteur hors ligne — sans compte, votre texte ne quitte pas l’appareil',
    enabled: 'Activé', site_on: 'Actif sur ce site', site_off: 'Désactivé sur ce site',
    issues: '{n} problèmes', none: 'Aucun problème détecté', fix_all: 'Tout corriger', restore: 'Restaurer les accents',
    ignore: 'Ignorer', ignore_rule: 'Désactiver la règle', add_word: 'Ajouter au dictionnaire', no_sugg: 'Aucune suggestion',
    loading: 'Recherche de suggestions…', language: 'Langue', auto: 'Automatique', readability: 'Lisibilité', applied: '{n} corrections appliquées',
    rewrite: 'Reformuler (local)', rewriting: 'Reformulation…', settings: 'Réglages', open_options: 'Ouvrir les réglages',
    cat_spelling: 'Orthographe', cat_grammar: 'Grammaire', cat_punctuation: 'Ponctuation', cat_typography: 'Typographie', cat_style: 'Style',
    easy: 'très facile', plain: 'facile', medium: 'moyen', hard: 'difficile', 'very-hard': 'très difficile',
    studio: 'Atelier de texte', studio_hint: 'Collez ou saisissez votre texte ; la vérification est locale.',
    general: 'Général', categories: 'Catégories', personal: 'Dictionnaire personnel', rules: 'Règles personnalisées',
    disabled_rules: 'Règles désactivées', dicts: 'Dictionnaires importés', advanced: 'Avancé', save: 'Enregistrer', saved: 'Enregistré',
    ui_lang: 'Langue de l’interface', default_lang: 'Langue par défaut', en_variant: 'Anglais', long_sentence: 'Phrase longue à partir de (mots)',
    hide_native: 'Masquer le correcteur natif du navigateur dans les champs vérifiés', badge: 'Afficher la pastille dans le champ',
    import_dict: 'Importer un dictionnaire Hunspell (.aff + .dic)', dict_code: 'Code de langue (ex. de)', export: 'Exporter', import: 'Importer',
    llm_title: 'Reformulation par modèle local (facultatif)', llm_note: 'Désactivé par défaut. Le texte n’est envoyé qu’à l’adresse ci-dessous, de préférence localhost.',
    llm_endpoint: 'Adresse (compatible OpenAI)', llm_model: 'Modèle', remove: 'Supprimer', add: 'Ajouter', pattern: 'Motif (regex)', replacement: 'Remplacement',
    message: 'Message', empty: 'Rien à afficher.', disabled_sites: 'Sites désactivés', privacy: 'Confidentialité : votre texte ne quitte pas cet ordinateur.',
  },
  es: {
    site_disable: 'Desactivar en este sitio',
    app: 'ERATA', tagline: 'Corrector sin conexión — sin cuenta, su texto no sale del dispositivo',
    enabled: 'Activado', site_on: 'Activo en este sitio', site_off: 'Desactivado en este sitio',
    issues: '{n} problemas', none: 'No se encontraron problemas', fix_all: 'Corregir todo', restore: 'Restaurar tildes',
    ignore: 'Ignorar', ignore_rule: 'Desactivar la regla', add_word: 'Añadir al diccionario', no_sugg: 'Sin sugerencias',
    loading: 'Buscando sugerencias…', language: 'Idioma', auto: 'Automático', readability: 'Legibilidad', applied: '{n} correcciones aplicadas',
    rewrite: 'Reformular (local)', rewriting: 'Reformulando…', settings: 'Ajustes', open_options: 'Abrir ajustes',
    cat_spelling: 'Ortografía', cat_grammar: 'Gramática', cat_punctuation: 'Puntuación', cat_typography: 'Tipografía', cat_style: 'Estilo',
    easy: 'muy fácil', plain: 'fácil', medium: 'media', hard: 'difícil', 'very-hard': 'muy difícil',
    studio: 'Estudio de texto', studio_hint: 'Pegue o escriba su texto aquí; la revisión es local.',
    general: 'General', categories: 'Categorías', personal: 'Diccionario personal', rules: 'Reglas propias',
    disabled_rules: 'Reglas desactivadas', dicts: 'Diccionarios importados', advanced: 'Avanzado', save: 'Guardar', saved: 'Guardado',
    ui_lang: 'Idioma de la interfaz', default_lang: 'Idioma predeterminado', en_variant: 'Inglés', long_sentence: 'Oración larga desde (palabras)',
    hide_native: 'Ocultar el corrector nativo del navegador en los campos revisados', badge: 'Mostrar la insignia en el campo',
    import_dict: 'Importar diccionario Hunspell (.aff + .dic)', dict_code: 'Código de idioma (p. ej. de)', export: 'Exportar', import: 'Importar',
    llm_title: 'Reformulación con modelo local (opcional)', llm_note: 'Desactivado por defecto. El texto solo se envía a la dirección indicada, preferiblemente localhost.',
    llm_endpoint: 'Dirección (compatible con OpenAI)', llm_model: 'Modelo', remove: 'Quitar', add: 'Añadir', pattern: 'Patrón (regex)', replacement: 'Reemplazo',
    message: 'Mensaje', empty: 'Nada que mostrar.', disabled_sites: 'Sitios desactivados', privacy: 'Privacidad: su texto no sale de este equipo.',
  },
};

export const UI_LANGS = { ro: 'Română', en: 'English', fr: 'Français', es: 'Español' };

export function t(lang, key, vars = {}) {
  const s = (S[lang] && S[lang][key]) || S.en[key] || key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

export function guessUiLang(nav = (globalThis.navigator && navigator.language) || 'en') {
  const l = nav.slice(0, 2).toLowerCase();
  return S[l] ? l : 'en';
}
