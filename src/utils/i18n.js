import { reactive, ref } from 'vue';

const TRANSLATION_KEYS = [
  'categories',
  'all_catalogue',
  'search_placeholder',
  'basket',
  'item',
  'items',
  'clear_basket',
  'basket_empty_title',
  'basket_empty_desc',
  'back_to_explorer',
  'image',
  'product',
  'tax',
  'unit_price_ttc',
  'quantity',
  'total_ttc',
  'action',
  'num_items',
  'total_amount_ttc',
  'validate_sale',
  'delete_item',
  'add_item',
  'back_to_catalogue',
  'view_mode',
  'edit_mode',
  'create_mode',
  'product_details',
  'edit_product',
  'create_product',
  'item_name',
  'barcode_ean',
  'category',
  'price_ht',
  'price_ttc',
  'tva_rate',
  'data_origin',
  'last_modified',
  'local_import',
  'open_food_facts',
  'add_to_basket',
  'edit',
  'delete',
  'save',
  'cancel',
  'choose_image',
  'or_drag_drop',
  'choose_category',
  'main_categories',
  'subcategories',
  'products',
  'no_products_found',
  'try_modifying_filters',
  'in',
  'choose_language',
  'unsaved_changes_title',
  'unsaved_changes_msg',
  'unsaved_changes_detail',
  'abandon',
  'stay',
  'delete_product_title',
  'delete_product_msg',
  'delete_product_detail',
  'clear_basket_title',
  'clear_basket_msg',
  'clear_basket_confirm',
  'sale_validated_msg',
  'delete_category_title',
  'delete_category_msg',
  'delete_category_detail',
  'menu_delete_category',
  'delete_category',
];

// Fallback dictionary for testing and browser mock environments
const FALLBACK_TRANSLATIONS = {
  fr: {
    categories: 'Catégories',
    all_catalogue: 'Tout le catalogue',
    search_placeholder: 'Rechercher un article...',
    basket: 'Panier',
    item: 'article',
    items: 'articles',
    clear_basket: 'Vider le panier',
    basket_empty_title: 'Le panier est vide',
    basket_empty_desc: 'Ajoutez des articles depuis le catalogue pour commencer une vente.',
    back_to_explorer: "Retour à l'exploreur des produits",
    image: 'Image',
    product: 'Article',
    tax: 'Taxe',
    unit_price_ttc: 'Prix unitaire TTC',
    quantity: 'Quantité',
    total_ttc: 'Total TTC',
    action: 'Action',
    num_items: "Nombre d'articles :",
    total_amount_ttc: 'Montant total (TTC) :',
    validate_sale: 'Valider la vente',
    delete_item: "Supprimer l'article",
    add_item: 'Ajouter un article',
    back_to_catalogue: 'Retour au catalogue',
    view_mode: '🔍 Consultation',
    edit_mode: '✏️ Édition',
    create_mode: '➕ Création',
    product_details: 'Détails du Produit',
    edit_product: 'Modifier le produit',
    create_product: 'Créer un produit',
    item_name: "Nom de l'article",
    barcode_ean: 'Code-barres (EAN)',
    category: 'Catégorie',
    price_ht: 'Prix HT (€)',
    price_ttc: 'Prix TTC (€)',
    tva_rate: 'Taux TVA',
    data_origin: 'Origine des données',
    last_modified: 'Dernière modification',
    local_import: 'Import Local',
    open_food_facts: 'Open Food Facts',
    add_to_basket: 'Ajouter au panier',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    choose_image: 'Choisir une image',
    or_drag_drop: '(ou glisser-déposer)',
    choose_category: 'Choisir une catégorie',
    main_categories: 'Rayons principaux',
    subcategories: 'Sous-catégories',
    products: 'Articles',
    no_products_found: 'Aucun article trouvé',
    try_modifying_filters: 'Essayez de modifier vos filtres ou de taper une autre recherche.',
    in: 'dans',
    choose_language: 'Choisir la langue',
    unsaved_changes_title: 'Modifications non enregistrées',
    unsaved_changes_msg: 'Voulez-vous abandonner vos modifications ?',
    unsaved_changes_detail:
      'Si vous quittez, toutes les modifications non enregistrées seront perdues.',
    abandon: 'Abandonner',
    stay: 'Rester',
    delete_product_title: 'Suppression de produit',
    delete_product_msg: 'Voulez-vous vraiment supprimer le produit "{productName}" ?',
    delete_product_detail:
      "Cette action est irréversible (le produit sera masqué de l'inventaire).",
    clear_basket_title: 'Vider le panier',
    clear_basket_msg: 'Voulez vous vraiment vider tout le panier ?',
    clear_basket_confirm: 'Vider le panier',
    sale_validated_msg: "Vente validée d'un montant de {amount} !",
    delete_category_title: 'Suppression de catégorie',
    delete_category_msg: 'Voulez-vous vraiment supprimer la catégorie "{categoryName}" ?',
    delete_category_detail:
      'Aucun article ne sera supprimé. Tous les articles de cette catégorie seront déplacés vers la catégorie parente.',
    menu_delete_category: 'Supprimer la catégorie',
    delete_category: 'Supprimer la catégorie',
  },
  en: {
    categories: 'Categories',
    all_catalogue: 'All Catalogue',
    search_placeholder: 'Search product...',
    basket: 'Basket',
    item: 'item',
    items: 'items',
    clear_basket: 'Clear basket',
    basket_empty_title: 'Basket is empty',
    basket_empty_desc: 'Add items from the catalogue to start a sale.',
    back_to_explorer: 'Back to product explorer',
    image: 'Image',
    product: 'Product',
    tax: 'Tax',
    unit_price_ttc: 'Unit Price (incl. tax)',
    quantity: 'Quantity',
    total_ttc: 'Total (incl. tax)',
    action: 'Action',
    num_items: 'Number of items:',
    total_amount_ttc: 'Total amount (incl. tax):',
    validate_sale: 'Validate sale',
    delete_item: 'Delete item',
    add_item: 'Add item',
    back_to_catalogue: 'Back to catalogue',
    view_mode: '🔍 View Mode',
    edit_mode: '✏️ Edit Mode',
    create_mode: '➕ Create Mode',
    product_details: 'Product Details',
    edit_product: 'Edit product',
    create_product: 'Create product',
    item_name: 'Item name',
    barcode_ean: 'Barcode (EAN)',
    category: 'Category',
    price_ht: 'Price excl. tax (€)',
    price_ttc: 'Price incl. tax (€)',
    tva_rate: 'VAT Rate',
    data_origin: 'Data origin',
    last_modified: 'Last modified',
    local_import: 'Local Import',
    open_food_facts: 'Open Food Facts',
    add_to_basket: 'Add to basket',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    choose_image: 'Choose an image',
    or_drag_drop: '(or drag & drop)',
    choose_category: 'Choose a category',
    main_categories: 'Main categories',
    subcategories: 'Subcategories',
    products: 'Products',
    no_products_found: 'No items found',
    try_modifying_filters: 'Try modifying your filters or typing another search.',
    in: 'in',
    choose_language: 'Choose language',
    unsaved_changes_title: 'Unsaved changes',
    unsaved_changes_msg: 'Do you want to discard your changes?',
    unsaved_changes_detail: 'If you leave, all unsaved changes will be lost.',
    abandon: 'Discard',
    stay: 'Stay',
    delete_product_title: 'Product Deletion',
    delete_product_msg: 'Are you sure you want to delete the product "{productName}"?',
    delete_product_detail:
      'This action is irreversible (the product will be hidden from the inventory).',
    clear_basket_title: 'Clear basket',
    clear_basket_msg: 'Are you sure you want to empty the entire basket?',
    clear_basket_confirm: 'Clear basket',
    sale_validated_msg: 'Sale validated for an amount of {amount}!',
    delete_category_title: 'Delete Category',
    delete_category_msg: 'Are you sure you want to delete category "{categoryName}"?',
    delete_category_detail:
      'No items will be deleted. All products in this category will be moved to the parent category.',
    menu_delete_category: 'Delete Category',
    delete_category: 'Delete category',
  },
};

const translations = reactive({});
const currentLang = ref('fr');
const availableLanguages = ref([
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]);

export const i18n = {
  t(key) {
    if (translations[key] !== undefined) {
      return translations[key];
    }

    // Attempt to load asynchronously
    translations[key] = FALLBACK_TRANSLATIONS[currentLang.value]?.[key] || key;
    if (window.electronAPI && typeof window.electronAPI.getText === 'function') {
      window.electronAPI.getText(key).then((text) => {
        translations[key] = text;
      });
    }
    return translations[key];
  },

  async loadLanguageInfo() {
    if (window.electronAPI) {
      try {
        if (typeof window.electronAPI.getCurrentLanguage === 'function') {
          currentLang.value = await window.electronAPI.getCurrentLanguage();
        }
        if (typeof window.electronAPI.getAvailableLanguages === 'function') {
          const codes = await window.electronAPI.getAvailableLanguages();
          const langs = [];
          for (const code of codes) {
            if (typeof window.electronAPI.getLanguageDetails === 'function') {
              const details = await window.electronAPI.getLanguageDetails(code);
              langs.push({ code, ...details });
            }
          }
          if (langs.length > 0) {
            availableLanguages.value = langs;
          }
        }

        // Pre-load all translation keys from main process
        await Promise.all(
          TRANSLATION_KEYS.map(async (key) => {
            if (typeof window.electronAPI.getText === 'function') {
              const text = await window.electronAPI.getText(key);
              translations[key] = text;
            }
          })
        );
      } catch (err) {
        console.error(
          'i18n: Failed to load language info from Electron main, falling back to local dictionaries',
          err
        );
        this.loadFallbackTranslations();
      }
    } else {
      this.loadFallbackTranslations();
    }
  },

  loadFallbackTranslations() {
    const dict = FALLBACK_TRANSLATIONS[currentLang.value] || FALLBACK_TRANSLATIONS['fr'];
    for (const key of TRANSLATION_KEYS) {
      translations[key] = dict[key] || key;
    }
  },

  async setLanguage(code) {
    if (window.electronAPI && typeof window.electronAPI.setLanguage === 'function') {
      try {
        await window.electronAPI.setLanguage(code);
        currentLang.value = code;

        // Re-read all translations in the cache
        const keys = Object.keys(translations);
        await Promise.all(
          keys.map(async (key) => {
            const text = await window.electronAPI.getText(key);
            translations[key] = text;
          })
        );
      } catch (err) {
        console.error('i18n: Failed to change language via Electron main', err);
        currentLang.value = code;
        this.loadFallbackTranslations();
      }
    } else {
      currentLang.value = code;
      this.loadFallbackTranslations();
    }
  },

  currentLang,
  availableLanguages,
};
