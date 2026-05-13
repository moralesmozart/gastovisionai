/* GastoVision sample restaurant data
 *
 * In a real product this would come from an API. For the demo, the menu
 * lives here in plain JS so it ships statically with GitHub Pages.
 *
 * Each item has translations per language. Images come from Unsplash and
 * videos from Mixkit (both allow direct hotlinking for demos).
 */
window.GV_DATA = {
  restaurant: {
    id: "el-patio",
    name: "El Patio de la Tomata",
    tagline: {
      en: "Spanish kitchen, modern soul",
      es: "Cocina española con alma moderna",
      pt: "Cozinha espanhola com alma moderna",
      fr: "Cuisine espagnole, âme moderne",
      de: "Spanische Küche mit modernem Twist"
    },
    hero:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    accent: "#14B8A6"
  },

  categories: [
    { id: "starters", icon: "🥖" },
    { id: "mains", icon: "🍝" },
    { id: "drinks", icon: "🍹" },
    { id: "desserts", icon: "🍰" },
    { id: "specials", icon: "✨" }
  ],

  items: [
    /* ---------- STARTERS ---------- */
    {
      id: "ham-croquettes",
      category: "starters",
      price: 13.9,
      currency: "€",
      tags: ["chefPick"],
      allergens: ["gluten", "dairy", "eggs"],
      image:
        "https://images.unsplash.com/photo-1559847844-b0915a3800c6?auto=format&fit=crop&w=900&q=80",
      video:
        "https://assets.mixkit.co/videos/4756/4756-720.mp4",
      name: {
        en: "Iberian ham croquettes",
        es: "Croquetas de jamón ibérico",
        pt: "Croquetes de presunto ibérico",
        fr: "Croquettes au jambon ibérique",
        de: "Iberico-Schinken-Kroketten"
      },
      description: {
        en:
          "Six golden, crispy-on-the-outside, creamy-on-the-inside croquettes packed with cured Iberian ham. Made fresh every morning.",
        es:
          "Seis croquetas crujientes por fuera, súper cremosas por dentro y bien cargadas de jamón ibérico. Hechas a diario.",
        pt:
          "Seis croquetes crocantes por fora, super cremosos por dentro e bem cheios de presunto ibérico. Feitos diariamente.",
        fr:
          "Six croquettes dorées, croustillantes dehors, fondantes dedans, généreusement garnies de jambon ibérique. Faites le matin même.",
        de:
          "Sechs goldene Kroketten, außen knusprig, innen cremig, gefüllt mit luftgetrocknetem Iberico-Schinken. Täglich frisch."
      }
    },
    {
      id: "tomato-salad",
      category: "starters",
      price: 11.5,
      currency: "€",
      tags: ["veggie"],
      allergens: [],
      image:
        "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=900&q=80",
      video:
        "https://assets.mixkit.co/videos/2786/2786-720.mp4",
      name: {
        en: "Heirloom tomato salad",
        es: "Ensalada de tomate de la huerta",
        pt: "Salada de tomate da horta",
        fr: "Salade de tomates anciennes",
        de: "Tomatensalat aus dem Garten"
      },
      description: {
        en:
          "Local heirloom tomatoes, flaky sea salt, sharp Arbequina olive oil, fresh oregano. That's it. That's the dish.",
        es:
          "Tomates de variedad local, sal en escamas, aceite Arbequina y orégano fresco. Nada más. Y nada menos.",
        pt:
          "Tomates locais, flor de sal, azeite Arbequina e orégãos frescos. Só isso. E é tudo.",
        fr:
          "Tomates anciennes locales, fleur de sel, huile Arbequina, origan frais. C'est tout. Et c'est tout.",
        de:
          "Lokale Tomatensorten, Meersalzflocken, Arbequina-Olivenöl, frischer Oregano. Mehr nicht. Reicht völlig."
      }
    },
    {
      id: "pulled-pork-quesadilla",
      category: "starters",
      price: 15.9,
      currency: "€",
      tags: [],
      allergens: ["gluten", "dairy"],
      image:
        "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=900&q=80",
      video:
        "https://assets.mixkit.co/videos/4502/4502-720.mp4",
      name: {
        en: "Pulled pork quesadilla",
        es: "Quesadilla de pulled pork",
        pt: "Quesadilla de pulled pork",
        fr: "Quesadilla au pulled pork",
        de: "Pulled-Pork-Quesadilla"
      },
      description: {
        en:
          "12-hour smoked pork shoulder, melted cheddar and mozzarella, pickled jalapeños. Served with our house chipotle.",
        es:
          "Paleta de cerdo ahumada 12 horas, cheddar y mozzarella fundidos, jalapeños encurtidos. Con nuestro chipotle de la casa.",
        pt:
          "Pá de porco fumada 12 horas, cheddar e mozzarella derretidos, jalapeños. Com chipotle da casa.",
        fr:
          "Épaule de porc fumée 12 heures, cheddar et mozzarella fondants, jalapeños. Avec notre chipotle maison.",
        de:
          "12-Stunden geräucherte Schweineschulter, geschmolzener Cheddar und Mozzarella, eingelegte Jalapeños. Mit Hauschipotle."
      }
    },

    /* ---------- MAINS ---------- */
    {
      id: "prosciutto-pizza",
      category: "mains",
      price: 12.5,
      currency: "€",
      tags: ["chefPick"],
      allergens: ["gluten", "dairy"],
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
      video:
        "https://assets.mixkit.co/videos/2786/2786-720.mp4",
      name: {
        en: "Prosciutto pizza",
        es: "Pizza prosciutto",
        pt: "Pizza prosciutto",
        fr: "Pizza prosciutto",
        de: "Pizza Prosciutto"
      },
      description: {
        en:
          "Tomato, fior di latte mozzarella, jamón york, fresh basil. Wood-fired Neapolitan crust, 90 seconds at 450°C.",
        es:
          "Tomate, mozzarella fior di latte, jamón york y albahaca fresca. Masa napolitana al horno de leña, 90 segundos a 450°C.",
        pt:
          "Tomate, mozzarella fior di latte, fiambre, manjericão fresco. Massa napolitana em forno a lenha, 90s a 450°C.",
        fr:
          "Tomate, mozzarella fior di latte, jambon, basilic frais. Pâte napolitaine au four à bois, 90s à 450°C.",
        de:
          "Tomate, Fior-di-Latte-Mozzarella, Kochschinken, frisches Basilikum. Neapolitanischer Holzofen-Teig, 90 Sek. bei 450°C."
      }
    },
    {
      id: "matured-angus",
      category: "mains",
      price: 28,
      currency: "€",
      tags: [],
      allergens: [],
      image:
        "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=900&q=80",
      video:
        "https://assets.mixkit.co/videos/4502/4502-720.mp4",
      name: {
        en: "45-day matured Angus",
        es: "Angus madurado 45 días",
        pt: "Angus maturado 45 dias",
        fr: "Angus maturé 45 jours",
        de: "45 Tage gereifter Angus"
      },
      description: {
        en:
          "Dry-aged ribeye, smoked salt, charred padrón peppers and our bone-marrow butter. Recommended medium-rare.",
        es:
          "Entrecot madurado en seco, sal ahumada, pimientos de Padrón y mantequilla de tuétano. Recomendado al punto.",
        pt:
          "Entrecôte maturado a seco, sal fumado, pimentos padrón e manteiga de tutano. Recomendado mal passado.",
        fr:
          "Entrecôte maturée à sec, sel fumé, piments padrón et beurre à la moelle. Recommandé saignant à point.",
        de:
          "Trocken gereiftes Ribeye, Rauchsalz, gegrillte Padrón-Paprika und Knochenmark-Butter. Empfehlung: medium-rare."
      }
    },
    {
      id: "seafood-paella",
      category: "mains",
      price: 22,
      currency: "€",
      tags: ["chefPick"],
      allergens: ["seafood"],
      image:
        "https://images.unsplash.com/photo-1694685367640-05d6624e57f1?auto=format&fit=crop&w=900&q=80",
      video:
        "https://assets.mixkit.co/videos/2786/2786-720.mp4",
      name: {
        en: "Seafood paella",
        es: "Paella de marisco",
        pt: "Paelha de marisco",
        fr: "Paëlla aux fruits de mer",
        de: "Meeresfrüchte-Paella"
      },
      description: {
        en:
          "Bomba rice, prawns, mussels, calamari, slow-simmered seafood stock and a hit of saffron. For two people, takes 25 minutes.",
        es:
          "Arroz bomba, gambas, mejillones, calamares, fumet de pescado a fuego lento y azafrán. Para dos, 25 minutos.",
        pt:
          "Arroz bomba, camarão, mexilhão, lulas, fumet de peixe lento e açafrão. Para dois, 25 minutos.",
        fr:
          "Riz bomba, crevettes, moules, calamars, fumet de poisson mijoté et safran. Pour deux, 25 minutes.",
        de:
          "Bomba-Reis, Garnelen, Muscheln, Calamari, langsam gezogener Fischfond und Safran. Für zwei, 25 Minuten."
      }
    },

    /* ---------- DRINKS ---------- */
    {
      id: "house-vermouth",
      category: "drinks",
      price: 5.5,
      currency: "€",
      tags: [],
      allergens: ["sulfites"],
      image:
        "https://images.pexels.com/photos/1170599/pexels-photo-1170599.jpeg?auto=compress&cs=tinysrgb&w=900",
      video:
        "https://assets.mixkit.co/videos/2786/2786-720.mp4",
      name: {
        en: "House vermouth",
        es: "Vermut de la casa",
        pt: "Vermute da casa",
        fr: "Vermouth maison",
        de: "Hausvermouth"
      },
      description: {
        en:
          "Our own red vermouth, on tap, served the right way: ice, an orange wheel, an olive. Nothing else.",
        es:
          "Nuestro vermut rojo, de grifo, como tiene que ser: hielo, rodaja de naranja, aceituna. Y ya.",
        pt:
          "O nosso vermute tinto, à pressão, como deve ser: gelo, rodela de laranja, azeitona. Mais nada.",
        fr:
          "Notre vermouth rouge maison, à la pression, comme il faut : glace, orange, olive. Et c'est tout.",
        de:
          "Unser eigener roter Vermouth, vom Fass, wie es sich gehört: Eis, Orangenscheibe, Olive. Mehr nicht."
      }
    },
    {
      id: "smoked-old-fashioned",
      category: "drinks",
      price: 12,
      currency: "€",
      tags: ["chefPick"],
      allergens: [],
      image:
        "https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=900",
      video:
        "https://assets.mixkit.co/videos/4502/4502-720.mp4",
      name: {
        en: "Smoked old fashioned",
        es: "Old fashioned ahumado",
        pt: "Old fashioned fumado",
        fr: "Old fashioned fumé",
        de: "Smoked Old Fashioned"
      },
      description: {
        en:
          "Bourbon, demerara, bitters, smoked under a glass dome at the table with cherrywood. Yes, it's that one.",
        es:
          "Bourbon, azúcar demerara, bitter, ahumado en mesa bajo campana con madera de cerezo. Sí, ese.",
        pt:
          "Bourbon, açúcar demerara, bitter, fumado à mesa sob campânula com madeira de cerejeira.",
        fr:
          "Bourbon, sucre demerara, bitter, fumé à table sous cloche au bois de cerisier. Oui, celui-là.",
        de:
          "Bourbon, Demerara-Zucker, Bitter, am Tisch unter Glaskuppel mit Kirschholz geräuchert. Ja, der."
      }
    },

    /* ---------- DESSERTS ---------- */
    {
      id: "burnt-cheesecake",
      category: "desserts",
      price: 7.5,
      currency: "€",
      tags: ["chefPick"],
      allergens: ["dairy", "eggs", "gluten"],
      image:
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80",
      video:
        "https://assets.mixkit.co/videos/2786/2786-720.mp4",
      name: {
        en: "Burnt Basque cheesecake",
        es: "Tarta de queso vasca",
        pt: "Cheesecake basco",
        fr: "Cheesecake basque brûlé",
        de: "Baskischer Käsekuchen"
      },
      description: {
        en:
          "Caramelised top, custard centre. Eaten warm with a spoon. The kind of dessert you remember a year later.",
        es:
          "Tostada por arriba, cremosa por dentro. Se come tibia con cuchara. De esos postres que recuerdas un año después.",
        pt:
          "Tostada por cima, cremosa por dentro. Come-se morno à colher. Daqueles que se lembram um ano depois.",
        fr:
          "Caramélisé dessus, crémeux dedans. Se mange tiède à la cuillère. Le genre qu'on n'oublie pas.",
        de:
          "Oben karamellisiert, innen cremig. Warm mit dem Löffel. So ein Dessert, das du nicht vergisst."
      }
    },
    {
      id: "chocolate-coulant",
      category: "desserts",
      price: 8.5,
      currency: "€",
      tags: [],
      allergens: ["dairy", "eggs", "gluten"],
      image:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
      video:
        "https://assets.mixkit.co/videos/4502/4502-720.mp4",
      name: {
        en: "Chocolate coulant",
        es: "Coulant de chocolate",
        pt: "Coulant de chocolate",
        fr: "Coulant au chocolat",
        de: "Schokoladen-Coulant"
      },
      description: {
        en:
          "70% dark chocolate, molten centre, vanilla ice cream on top. Cut it open and watch.",
        es:
          "Chocolate negro 70%, corazón fundido, helado de vainilla encima. Ábrelo y disfruta.",
        pt:
          "Chocolate 70%, coração derretido, gelado de baunilha por cima. Parte ao meio e vê.",
        fr:
          "Chocolat noir 70%, cœur coulant, glace vanille dessus. Coupe-le, regarde.",
        de:
          "70% Zartbitter, flüssiger Kern, Vanilleeis oben drauf. Aufschneiden, gucken."
      }
    },

    /* ---------- SPECIALS ---------- */
    {
      id: "mole-tasting",
      category: "specials",
      price: 18,
      currency: "€",
      tags: ["chefPick", "limited"],
      allergens: ["nuts", "gluten"],
      image:
        "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?auto=format&fit=crop&w=900&q=80",
      video:
        "https://assets.mixkit.co/videos/4502/4502-720.mp4",
      name: {
        en: "Mole tasting (3 sauces)",
        es: "Degustación de moles (3 salsas)",
        pt: "Degustação de mole (3 molhos)",
        fr: "Dégustation de moles (3 sauces)",
        de: "Mole-Verkostung (3 Saucen)"
      },
      description: {
        en:
          "Mole negro, mole verde, mole amarillo. Three classics from Oaxaca with handmade tortillas. Festival edition, only this month.",
        es:
          "Mole negro, mole verde y mole amarillo. Tres clásicos de Oaxaca con tortillas hechas a mano. Edición festival, solo este mes.",
        pt:
          "Mole negro, mole verde e mole amarillo. Três clássicos de Oaxaca com tortilhas feitas à mão. Edição festival, só este mês.",
        fr:
          "Mole negro, mole verde, mole amarillo. Trois classiques d'Oaxaca avec tortillas faites maison. Édition festival, ce mois-ci.",
        de:
          "Mole Negro, Mole Verde, Mole Amarillo. Drei Klassiker aus Oaxaca mit handgemachten Tortillas. Festival-Edition, nur diesen Monat."
      }
    }
  ],

  tagLabels: {
    chefPick: {
      en: "Chef's pick",
      es: "Recomendación del chef",
      pt: "Sugestão do chef",
      fr: "Coup de cœur du chef",
      de: "Chef-Empfehlung"
    },
    veggie: {
      en: "Vegetarian",
      es: "Vegetariano",
      pt: "Vegetariano",
      fr: "Végétarien",
      de: "Vegetarisch"
    },
    limited: {
      en: "Limited time",
      es: "Edición limitada",
      pt: "Tempo limitado",
      fr: "Édition limitée",
      de: "Begrenzte Zeit"
    }
  },

  allergenLabels: {
    gluten: { en: "Gluten", es: "Gluten", pt: "Glúten", fr: "Gluten", de: "Gluten" },
    dairy: { en: "Dairy", es: "Lácteos", pt: "Lacticínios", fr: "Produits laitiers", de: "Milchprodukte" },
    eggs: { en: "Eggs", es: "Huevos", pt: "Ovos", fr: "Œufs", de: "Eier" },
    nuts: { en: "Nuts", es: "Frutos secos", pt: "Frutos secos", fr: "Fruits à coque", de: "Nüsse" },
    seafood: { en: "Seafood", es: "Marisco", pt: "Marisco", fr: "Fruits de mer", de: "Meeresfrüchte" },
    sulfites: { en: "Sulfites", es: "Sulfitos", pt: "Sulfitos", fr: "Sulfites", de: "Sulfite" }
  }
};
