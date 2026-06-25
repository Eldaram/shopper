export function loadBrowserMocks() {
  const categories = [
    {
      id: 1,
      name: 'Épicerie',
      parent_id: null,
      image_path:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 2,
      name: 'Boissons',
      parent_id: null,
      image_path:
        'https://images.unsplash.com/photo-1527960650-26df2cef137c?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 8,
      name: 'Pâtes & Riz',
      parent_id: 1,
      image_path:
        'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 9,
      name: 'Sodas',
      parent_id: 2,
      image_path:
        'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const products = [
    {
      id: 1,
      barcode: '5449000000996',
      name: 'Coca-Cola 1.5L',
      price_ht: 1.5,
      price_ttc: 1.8,
      tva_id: 1,
      category_id: 9,
      category_name: 'Sodas',
      image_url_openfoodfacts:
        'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 2,
      barcode: '3168930009078',
      name: 'Chips Lays Nature 150g',
      price_ht: 1.25,
      price_ttc: 1.5,
      tva_id: 1,
      category_id: 1,
      category_name: 'Épicerie',
      image_url_openfoodfacts:
        'https://images.unsplash.com/photo-1566478989037-eec170784d20?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const tvaRates = [{ id: 1, name: 'Taux normal (20%)', rate: 20.0, is_active: 1 }];

  return { categories, products, tvaRates };
}
