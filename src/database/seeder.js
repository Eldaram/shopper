/**
 * Seeds the database with standard initial data.
 * Useful for development and testing.
 * @param {Database} db - The better-sqlite3 database connection.
 */
function seed(db) {
  const transaction = db.transaction(() => {
    // 1. Insert TVA Rates
    const tvaRates = [
      { name: 'Taux normal (20%)', rate: 20.0, is_active: 1 },
      { name: 'Taux réduit (5.5%)', rate: 5.5, is_active: 1 },
      { name: 'Taux intermédiaire (10%)', rate: 10.0, is_active: 1 },
      { name: 'Taux super-réduit (2.1%)', rate: 2.1, is_active: 1 },
    ];

    const insertTva = db.prepare(
      'INSERT INTO TVA (name, rate, is_active) VALUES (@name, @rate, @is_active)'
    );
    for (const tva of tvaRates) {
      insertTva.run(tva);
    }

    // Get the TVA IDs we just inserted to map products later
    const tvaIds = {
      normal: db.prepare("SELECT id FROM TVA WHERE name LIKE 'Taux normal%'").get().id,
      reduit: db.prepare("SELECT id FROM TVA WHERE name LIKE 'Taux réduit%'").get().id,
      intermediaire: db.prepare("SELECT id FROM TVA WHERE name LIKE 'Taux intermédiaire%'").get()
        .id,
      superReduit: db.prepare("SELECT id FROM TVA WHERE name LIKE 'Taux super-réduit%'").get().id,
    };

    // 2. Insert Categories (with nesting)
    const mainCategories = [
      {
        name: 'Épicerie',
        parent_id: null,
        image_path:
          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Boissons',
        parent_id: null,
        image_path:
          'https://images.unsplash.com/photo-1527960650-26df2cef137c?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Produits Frais',
        parent_id: null,
        image_path:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Surgelés',
        parent_id: null,
        image_path:
          'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Boulangerie',
        parent_id: null,
        image_path:
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Hygiène',
        parent_id: null,
        image_path:
          'https://images.unsplash.com/photo-1607006342468-b7eb47717466?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Fruits & Légumes',
        parent_id: null,
        image_path:
          'https://images.unsplash.com/photo-1610348725531-843dff163e2c?auto=format&fit=crop&w=400&q=80',
      },
    ];

    const insertCategory = db.prepare(
      'INSERT INTO Category (name, parent_id, image_path) VALUES (@name, @parent_id, @image_path)'
    );
    for (const cat of mainCategories) {
      insertCategory.run(cat);
    }

    // Get parent IDs for subcategories
    const epicerieId = db.prepare("SELECT id FROM Category WHERE name = 'Épicerie'").get().id;
    const boissonsId = db.prepare("SELECT id FROM Category WHERE name = 'Boissons'").get().id;
    const boulangerieId = db.prepare("SELECT id FROM Category WHERE name = 'Boulangerie'").get().id;
    const fruitsLegumesId = db
      .prepare("SELECT id FROM Category WHERE name = 'Fruits & Légumes'")
      .get().id;

    const subCategories = [
      {
        name: 'Pâtes & Riz',
        parent_id: epicerieId,
        image_path:
          'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Sodas',
        parent_id: boissonsId,
        image_path:
          'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Jus',
        parent_id: boissonsId,
        image_path:
          'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Pains',
        parent_id: boulangerieId,
        image_path:
          'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Viennoiseries',
        parent_id: boulangerieId,
        image_path:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Fruits',
        parent_id: fruitsLegumesId,
        image_path:
          'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Légumes',
        parent_id: fruitsLegumesId,
        image_path:
          'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80',
      },
    ];

    for (const sub of subCategories) {
      insertCategory.run(sub);
    }

    const catIds = {
      epicerie: epicerieId,
      boissons: boissonsId,
      sodas: db.prepare("SELECT id FROM Category WHERE name = 'Sodas'").get().id,
      pains: db.prepare("SELECT id FROM Category WHERE name = 'Pains'").get().id,
      viennoiseries: db.prepare("SELECT id FROM Category WHERE name = 'Viennoiseries'").get().id,
      fruits: db.prepare("SELECT id FROM Category WHERE name = 'Fruits'").get().id,
      legumes: db.prepare("SELECT id FROM Category WHERE name = 'Légumes'").get().id,
      surgeles: db.prepare("SELECT id FROM Category WHERE name = 'Surgelés'").get().id,
      hygiene: db.prepare("SELECT id FROM Category WHERE name = 'Hygiène'").get().id,
    };

    // 3. Insert Types
    const types = [
      { name: 'Soda' },
      { name: 'Snacks' },
      { name: 'Fruit' },
      { name: 'Pain' },
      { name: 'Plat Préparé' },
      { name: 'Laitage' },
    ];

    const insertType = db.prepare('INSERT INTO Type (name) VALUES (@name)');
    for (const t of types) {
      insertType.run(t);
    }

    const typeIds = {
      soda: db.prepare("SELECT id FROM Type WHERE name = 'Soda'").get().id,
      snacks: db.prepare("SELECT id FROM Type WHERE name = 'Snacks'").get().id,
      fruit: db.prepare("SELECT id FROM Type WHERE name = 'Fruit'").get().id,
      pain: db.prepare("SELECT id FROM Type WHERE name = 'Pain'").get().id,
      plat: db.prepare("SELECT id FROM Type WHERE name = 'Plat Préparé'").get().id,
      lait: db.prepare("SELECT id FROM Type WHERE name = 'Laitage'").get().id,
    };

    // 4. Insert Products
    const products = [
      {
        barcode: '5449000000996',
        name: 'Coca-Cola 1.5L',
        price_ht: 1.5,
        price_ttc: 1.8,
        tva_id: tvaIds.normal,
        is_openfoodfacts: 1,
        category_id: catIds.sodas,
        type_id: typeIds.soda,
        image_path: null,
        image_url_openfoodfacts:
          'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
      },
      {
        barcode: '3168930009078',
        name: 'Chips Lays Nature 150g',
        price_ht: 1.25,
        price_ttc: 1.5,
        tva_id: tvaIds.normal,
        is_openfoodfacts: 1,
        category_id: catIds.epicerie,
        type_id: typeIds.snacks,
        image_path: null,
        image_url_openfoodfacts:
          'https://images.unsplash.com/photo-1566478989037-eec170784d20?auto=format&fit=crop&w=400&q=80',
      },
      {
        barcode: '3250390001099',
        name: 'Lait Demi-Écrémé Paturages 1L',
        price_ht: 0.9,
        price_ttc: 0.95,
        tva_id: tvaIds.reduit,
        is_openfoodfacts: 1,
        category_id: catIds.epicerie,
        type_id: typeIds.lait,
        image_path: null,
        image_url_openfoodfacts:
          'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
      },
      {
        barcode: '3274080005003',
        name: 'Eau Cristaline 1.5L',
        price_ht: 0.25,
        price_ttc: 0.3,
        tva_id: tvaIds.normal,
        is_openfoodfacts: 1,
        category_id: catIds.boissons,
        type_id: null,
        image_path: null,
        image_url_openfoodfacts:
          'https://images.unsplash.com/photo-1608885898957-a559228e8749?auto=format&fit=crop&w=400&q=80',
      },
      {
        barcode: '3250390159493',
        name: 'Pizza Royale Surgelée Fiorini',
        price_ht: 3.64,
        price_ttc: 4.0,
        tva_id: tvaIds.intermediaire,
        is_openfoodfacts: 1,
        category_id: catIds.surgeles,
        type_id: typeIds.plat,
        image_path: null,
        image_url_openfoodfacts:
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
      },
      {
        barcode: null,
        name: 'Baguette Tradition',
        price_ht: 0.95,
        price_ttc: 1.0,
        tva_id: tvaIds.reduit,
        is_openfoodfacts: 0,
        category_id: catIds.pains,
        type_id: typeIds.pain,
        image_path:
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
        image_url_openfoodfacts: null,
      },
      {
        barcode: null,
        name: 'Croissant au Beurre',
        price_ht: 1.14,
        price_ttc: 1.2,
        tva_id: tvaIds.reduit,
        is_openfoodfacts: 0,
        category_id: catIds.viennoiseries,
        type_id: null,
        image_path:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
        image_url_openfoodfacts: null,
      },
      {
        barcode: null,
        name: 'Pomme Gala (Kilo)',
        price_ht: 2.37,
        price_ttc: 2.5,
        tva_id: tvaIds.reduit,
        is_openfoodfacts: 0,
        category_id: catIds.fruits,
        type_id: typeIds.fruit,
        image_path:
          'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80',
        image_url_openfoodfacts: null,
      },
      {
        barcode: null,
        name: 'Carotte (Kilo)',
        price_ht: 1.42,
        price_ttc: 1.5,
        tva_id: tvaIds.reduit,
        is_openfoodfacts: 0,
        category_id: catIds.legumes,
        type_id: null,
        image_path:
          'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80',
        image_url_openfoodfacts: null,
      },
      {
        barcode: '3011360001021',
        name: 'Savon de Marseille Le Chat 4x100g',
        price_ht: 2.92,
        price_ttc: 3.5,
        tva_id: tvaIds.normal,
        is_openfoodfacts: 0,
        category_id: catIds.hygiene,
        type_id: null,
        image_path:
          'https://images.unsplash.com/photo-1607006342468-b7eb47717466?auto=format&fit=crop&w=400&q=80',
        image_url_openfoodfacts: null,
      },
    ];

    const insertProduct = db.prepare(`
      INSERT INTO Product (
        barcode, name, price_ht, price_ttc, tva_id, is_openfoodfacts,
        category_id, type_id, image_path, image_url_openfoodfacts
      ) VALUES (
        @barcode, @name, @price_ht, @price_ttc, @tva_id, @is_openfoodfacts,
        @category_id, @type_id, @image_path, @image_url_openfoodfacts
      )
    `);

    for (const prod of products) {
      insertProduct.run(prod);
    }

    const prodIds = {
      coca: db.prepare("SELECT id FROM Product WHERE name = 'Coca-Cola 1.5L'").get().id,
      baguette: db.prepare("SELECT id FROM Product WHERE name = 'Baguette Tradition'").get().id,
      pizza: db.prepare("SELECT id FROM Product WHERE name = 'Pizza Royale Surgelée Fiorini'").get()
        .id,
      croissant: db.prepare("SELECT id FROM Product WHERE name = 'Croissant au Beurre'").get().id,
      pomme: db.prepare("SELECT id FROM Product WHERE name = 'Pomme Gala (Kilo)'").get().id,
    };

    // 5. Insert Customers
    const customers = [
      { name: 'Jean Dupont', phone: '0612345678', loyalty_points: 120 },
      { name: 'Marie Curie', phone: '0687654321', loyalty_points: 350 },
      { name: 'Pierre de Fermat', phone: '0711223344', loyalty_points: 15 },
    ];

    const insertCustomer = db.prepare(`
      INSERT INTO Customer (name, phone, loyalty_points)
      VALUES (@name, @phone, @loyalty_points)
    `);
    for (const cust of customers) {
      insertCustomer.run(cust);
    }

    const custIds = {
      jean: db.prepare("SELECT id FROM Customer WHERE name = 'Jean Dupont'").get().id,
      marie: db.prepare("SELECT id FROM Customer WHERE name = 'Marie Curie'").get().id,
    };

    // 6. Insert Ticket 1 (Jean Dupont - 2x Coca + 1x Baguette)
    // Coca normal price: 1.80 TTC, Baguette: 1.00 TTC. Total: 4.60 TTC.
    // Coca HT: 1.50, Baguette HT: 0.95. Total HT: 3.95.
    const ticket1 = {
      total_amount_ht: 3.95,
      total_amount_ttc: 4.6,
      customer_id: custIds.jean,
    };

    const ticket1Id = db
      .prepare(
        `
      INSERT INTO Ticket (total_amount_ht, total_amount_ttc, customer_id)
      VALUES (@total_amount_ht, @total_amount_ttc, @customer_id)
    `
      )
      .run(ticket1).lastInsertRowid;

    // TicketLines for Ticket 1
    const line1_1 = {
      ticket_id: ticket1Id,
      product_id: prodIds.coca,
      quantity: 2,
      original_unit_price_ht: 1.5,
      original_unit_price_ttc: 1.8,
      applied_tva_rate: 20.0,
      is_discount_percentage: 0,
      discount_value: null,
      final_unit_price_ht: 1.5,
      final_unit_price_ttc: 1.8,
    };

    const line1_2 = {
      ticket_id: ticket1Id,
      product_id: prodIds.baguette,
      quantity: 1,
      original_unit_price_ht: 0.95,
      original_unit_price_ttc: 1.0,
      applied_tva_rate: 5.5,
      is_discount_percentage: 0,
      discount_value: null,
      final_unit_price_ht: 0.95,
      final_unit_price_ttc: 1.0,
    };

    const insertLine = db.prepare(`
      INSERT INTO TicketLine (
        ticket_id, product_id, quantity, original_unit_price_ht, original_unit_price_ttc,
        applied_tva_rate, is_discount_percentage, discount_value, final_unit_price_ht, final_unit_price_ttc
      ) VALUES (
        @ticket_id, @product_id, @quantity, @original_unit_price_ht, @original_unit_price_ttc,
        @applied_tva_rate, @is_discount_percentage, @discount_value, @final_unit_price_ht, @final_unit_price_ttc
      )
    `);

    insertLine.run(line1_1);
    insertLine.run(line1_2);

    // 7. Insert Ticket 2 (Marie Curie - 1x Pizza Royale with 10% Discount)
    // Original Pizza price: 4.00 TTC, 3.64 HT.
    // 10% discount: Unit final TTC = 3.60, Unit final HT = 3.27.
    const ticket2 = {
      total_amount_ht: 3.27,
      total_amount_ttc: 3.6,
      customer_id: custIds.marie,
    };

    const ticket2Id = db
      .prepare(
        `
      INSERT INTO Ticket (total_amount_ht, total_amount_ttc, customer_id)
      VALUES (@total_amount_ht, @total_amount_ttc, @customer_id)
    `
      )
      .run(ticket2).lastInsertRowid;

    const line2_1 = {
      ticket_id: ticket2Id,
      product_id: prodIds.pizza,
      quantity: 1,
      original_unit_price_ht: 3.64,
      original_unit_price_ttc: 4.0,
      applied_tva_rate: 10.0,
      is_discount_percentage: 1,
      discount_value: 10.0,
      final_unit_price_ht: 3.27,
      final_unit_price_ttc: 3.6,
    };

    insertLine.run(line2_1);

    // 8. Insert DeliveryOrder for Ticket 2
    const deliveryOrder = {
      ticket_id: ticket2Id,
      status: 'en_cours',
      delivery_address: "12 Rue de l'Étoile, 75008 Paris",
    };

    db.prepare(
      `
      INSERT INTO DeliveryOrder (ticket_id, status, delivery_address)
      VALUES (@ticket_id, @status, @delivery_address)
    `
    ).run(deliveryOrder);
  });

  transaction();
}

/**
 * Checks if the database is currently empty.
 * @param {Database} db - The better-sqlite3 database connection.
 * @returns {boolean} True if empty and needs seeding.
 */
function isEmpty(db) {
  const tvaCount = db.prepare('SELECT COUNT(*) AS count FROM TVA').get().count;
  const productCount = db.prepare('SELECT COUNT(*) AS count FROM Product').get().count;
  return tvaCount === 0 && productCount === 0;
}

module.exports = {
  seed,
  isEmpty,
};
