/* GastoVision i18n
 * Five languages. Translations are intentionally short and human, not literal.
 * Strings are referenced via data-i18n="path.to.key" attributes.
 */
window.I18N = (function () {
  const dictionaries = {
    en: {
      flag: "🇬🇧",
      label: "English",
      welcome: {
        kicker: "Scan · See · Crave",
        title: "The menu that makes\nyou hungry.",
        subtitle:
          "Tap a card to start exploring. Real videos of every dish, in your language.",
        cta: "Explore the menu",
        scrollHint: "Swipe to see more",
        cards: {
          starters: "Starters",
          mains: "Mains",
          drinks: "Drinks & Cocktails",
          desserts: "Desserts",
          specials: "Today's Specials"
        }
      },
      tabs: {
        favorites: "Favorites",
        menu: "Menu",
        video: "Video",
        myList: "My list",
        feedback: "Review"
      },
      menu: {
        title: "Menu",
        toggleVideo: "Video view",
        toggleList: "List view",
        readMore: "Read more",
        readLess: "Read less",
        allergens: "Allergens",
        add: "Add",
        added: "Added",
        favorite: "Favorite",
        unfavorite: "Remove favorite",
        empty: "Nothing here yet."
      },
      detail: {
        back: "Back",
        share: "Share",
        ingredients: "Ingredients",
        chefNote: "Chef's note"
      },
      cart: {
        title: "My list",
        subtitle: "Show this list to your waiter when you're ready.",
        empty: "Your list is empty. Add some dishes from the menu.",
        total: "Total",
        clear: "Clear list",
        order: "Call the waiter"
      },
      favorites: {
        title: "Favorites",
        empty: "Tap the heart on any dish to save it here."
      },
      video: {
        title: "Video mode",
        hint: "Swipe up for the next dish."
      },
      feedback: {
        title: "How was it?",
        step: "Step",
        of: "of",
        next: "Next",
        back: "Back",
        skip: "Skip",
        submit: "Send & claim my dessert",
        q1: {
          title: "How was your meal?",
          subtitle: "Be honest. The chef can take it.",
          options: {
            love: "Loved it",
            good: "Pretty good",
            ok: "It was ok",
            meh: "Not great",
            bad: "Bad"
          }
        },
        q2: {
          title: "Which dishes blew your mind?",
          subtitle: "Pick all the ones you'd order again."
        },
        q3: {
          title: "Anything else for the chef?",
          subtitle: "Optional. One sentence is plenty.",
          placeholder: "The croquettes were unreal..."
        },
        q4: {
          title: "Tell a friend, get a free dessert.",
          subtitle:
            "Share GastoVision with someone who'd love this place. Your next dessert is on us.",
          name: "Your name",
          email: "Your email (so we can send the voucher)",
          friendName: "Friend's name",
          channelEmail: "Send by email",
          channelWhatsapp: "Send on WhatsApp",
          friendContact: "Friend's email or phone",
          message: "Personal message (optional)",
          messageDefault:
            "Hey {friend}, just had an amazing meal here. Their video menu is wild — check it out 👇"
        },
        success: {
          title: "You did it.",
          subtitle:
            "We've sent you a voucher for one free dessert on your next visit.",
          voucher: "Free dessert voucher",
          code: "Code",
          expires: "Expires in 30 days",
          showWaiter: "Show this to your waiter next time.",
          back: "Back to the menu"
        }
      },
      common: {
        loading: "Loading…",
        close: "Close",
        ok: "OK"
      }
    },

    es: {
      flag: "🇪🇸",
      label: "Español",
      welcome: {
        kicker: "Escanea · Ve · Pide",
        title: "La carta que da\nhambre de verdad.",
        subtitle:
          "Toca una tarjeta para empezar. Vídeos reales de cada plato, en tu idioma.",
        cta: "Ver la carta",
        scrollHint: "Desliza para ver más",
        cards: {
          starters: "Entrantes",
          mains: "Principales",
          drinks: "Bebidas y cócteles",
          desserts: "Postres",
          specials: "Sugerencias del día"
        }
      },
      tabs: {
        favorites: "Favoritos",
        menu: "Menú",
        video: "Vídeo",
        myList: "Mi lista",
        feedback: "Opinar"
      },
      menu: {
        title: "Menú",
        toggleVideo: "Vista vídeo",
        toggleList: "Vista lista",
        readMore: "Ver más",
        readLess: "Ver menos",
        allergens: "Alérgenos",
        add: "Añadir",
        added: "Añadido",
        favorite: "Favorito",
        unfavorite: "Quitar favorito",
        empty: "Aquí no hay nada todavía."
      },
      detail: {
        back: "Volver",
        share: "Compartir",
        ingredients: "Ingredientes",
        chefNote: "Nota del chef"
      },
      cart: {
        title: "Mi lista",
        subtitle: "Enseña esta lista al camarero cuando estés listo.",
        empty: "Tu lista está vacía. Añade platos desde la carta.",
        total: "Total",
        clear: "Vaciar lista",
        order: "Llamar al camarero"
      },
      favorites: {
        title: "Favoritos",
        empty: "Toca el corazón en cualquier plato para guardarlo aquí."
      },
      video: {
        title: "Modo vídeo",
        hint: "Desliza hacia arriba para el siguiente plato."
      },
      feedback: {
        title: "¿Qué tal?",
        step: "Paso",
        of: "de",
        next: "Siguiente",
        back: "Atrás",
        skip: "Saltar",
        submit: "Enviar y conseguir mi postre",
        q1: {
          title: "¿Qué tal la comida?",
          subtitle: "Sé sincero. El chef aguanta.",
          options: {
            love: "Increíble",
            good: "Muy bien",
            ok: "Estuvo bien",
            meh: "Regular",
            bad: "Mal"
          }
        },
        q2: {
          title: "¿Qué plato te ha volado la cabeza?",
          subtitle: "Elige todos los que volverías a pedir."
        },
        q3: {
          title: "¿Algo más para el chef?",
          subtitle: "Opcional. Con una frase basta.",
          placeholder: "Las croquetas eran de otro mundo…"
        },
        q4: {
          title: "Recomienda y llévate un postre gratis.",
          subtitle:
            "Comparte GastoVision con alguien al que le encantaría este sitio. Tu próximo postre va por nosotros.",
          name: "Tu nombre",
          email: "Tu email (para enviarte el vale)",
          friendName: "Nombre de tu amig@",
          channelEmail: "Enviar por email",
          channelWhatsapp: "Enviar por WhatsApp",
          friendContact: "Email o teléfono",
          message: "Mensaje personal (opcional)",
          messageDefault:
            "Eh {friend}, acabo de cenar aquí y está increíble. Su carta en vídeo es brutal — échale un ojo 👇"
        },
        success: {
          title: "¡Hecho!",
          subtitle:
            "Te hemos enviado un vale para un postre gratis en tu próxima visita.",
          voucher: "Vale postre gratis",
          code: "Código",
          expires: "Caduca en 30 días",
          showWaiter: "Enséñaselo al camarero la próxima vez.",
          back: "Volver a la carta"
        }
      },
      common: {
        loading: "Cargando…",
        close: "Cerrar",
        ok: "Vale"
      }
    },

    pt: {
      flag: "🇵🇹",
      label: "Português",
      welcome: {
        kicker: "Lê · Vê · Pede",
        title: "O menu que abre\no apetite a sério.",
        subtitle:
          "Toca num cartão para começar. Vídeos reais de cada prato, no teu idioma.",
        cta: "Ver o menu",
        scrollHint: "Arrasta para ver mais",
        cards: {
          starters: "Entradas",
          mains: "Pratos principais",
          drinks: "Bebidas e cocktails",
          desserts: "Sobremesas",
          specials: "Sugestões do dia"
        }
      },
      tabs: {
        favorites: "Favoritos",
        menu: "Menu",
        video: "Vídeo",
        myList: "A minha lista",
        feedback: "Avaliar"
      },
      menu: {
        title: "Menu",
        toggleVideo: "Vista vídeo",
        toggleList: "Vista lista",
        readMore: "Ver mais",
        readLess: "Ver menos",
        allergens: "Alergénios",
        add: "Adicionar",
        added: "Adicionado",
        favorite: "Favorito",
        unfavorite: "Remover favorito",
        empty: "Ainda não há nada aqui."
      },
      detail: {
        back: "Voltar",
        share: "Partilhar",
        ingredients: "Ingredientes",
        chefNote: "Nota do chef"
      },
      cart: {
        title: "A minha lista",
        subtitle: "Mostra esta lista ao empregado quando estiveres pronto.",
        empty: "A tua lista está vazia. Adiciona pratos no menu.",
        total: "Total",
        clear: "Limpar lista",
        order: "Chamar o empregado"
      },
      favorites: {
        title: "Favoritos",
        empty: "Toca no coração de qualquer prato para guardar aqui."
      },
      video: {
        title: "Modo vídeo",
        hint: "Arrasta para cima para o próximo prato."
      },
      feedback: {
        title: "Como foi?",
        step: "Passo",
        of: "de",
        next: "Seguinte",
        back: "Anterior",
        skip: "Saltar",
        submit: "Enviar e levar a minha sobremesa",
        q1: {
          title: "Como foi a refeição?",
          subtitle: "Sê honesto. O chef aguenta.",
          options: {
            love: "Adorei",
            good: "Muito bom",
            ok: "Foi ok",
            meh: "Mais ou menos",
            bad: "Mau"
          }
        },
        q2: {
          title: "Que pratos te conquistaram?",
          subtitle: "Escolhe todos os que voltarias a pedir."
        },
        q3: {
          title: "Alguma coisa para o chef?",
          subtitle: "Opcional. Uma frase basta.",
          placeholder: "Os croquetes estavam noutro nível…"
        },
        q4: {
          title: "Recomenda e ganha uma sobremesa.",
          subtitle:
            "Partilha o GastoVision com alguém que ia adorar este sítio. A próxima sobremesa é por nossa conta.",
          name: "O teu nome",
          email: "O teu email (para enviarmos o voucher)",
          friendName: "Nome do amigo/a",
          channelEmail: "Enviar por email",
          channelWhatsapp: "Enviar por WhatsApp",
          friendContact: "Email ou telefone",
          message: "Mensagem pessoal (opcional)",
          messageDefault:
            "Olá {friend}, acabei de comer aqui e foi incrível. O menu em vídeo é brutal — vê só 👇"
        },
        success: {
          title: "Feito!",
          subtitle:
            "Enviámos-te um voucher para uma sobremesa grátis na próxima visita.",
          voucher: "Voucher de sobremesa",
          code: "Código",
          expires: "Expira em 30 dias",
          showWaiter: "Mostra-o ao empregado na próxima vez.",
          back: "Voltar ao menu"
        }
      },
      common: {
        loading: "A carregar…",
        close: "Fechar",
        ok: "OK"
      }
    },

    fr: {
      flag: "🇫🇷",
      label: "Français",
      welcome: {
        kicker: "Scanne · Regarde · Goûte",
        title: "La carte qui donne\nvraiment faim.",
        subtitle:
          "Touche une carte pour commencer. Des vidéos réelles de chaque plat, dans ta langue.",
        cta: "Voir la carte",
        scrollHint: "Glisse pour voir plus",
        cards: {
          starters: "Entrées",
          mains: "Plats",
          drinks: "Boissons & cocktails",
          desserts: "Desserts",
          specials: "Suggestions du jour"
        }
      },
      tabs: {
        favorites: "Favoris",
        menu: "Menu",
        video: "Vidéo",
        myList: "Ma liste",
        feedback: "Avis"
      },
      menu: {
        title: "Menu",
        toggleVideo: "Vue vidéo",
        toggleList: "Vue liste",
        readMore: "Voir plus",
        readLess: "Voir moins",
        allergens: "Allergènes",
        add: "Ajouter",
        added: "Ajouté",
        favorite: "Favori",
        unfavorite: "Retirer des favoris",
        empty: "Rien ici pour l'instant."
      },
      detail: {
        back: "Retour",
        share: "Partager",
        ingredients: "Ingrédients",
        chefNote: "Note du chef"
      },
      cart: {
        title: "Ma liste",
        subtitle: "Montre cette liste au serveur quand tu es prêt.",
        empty: "Ta liste est vide. Ajoute des plats depuis la carte.",
        total: "Total",
        clear: "Vider la liste",
        order: "Appeler le serveur"
      },
      favorites: {
        title: "Favoris",
        empty: "Touche le cœur d'un plat pour le garder ici."
      },
      video: {
        title: "Mode vidéo",
        hint: "Glisse vers le haut pour le plat suivant."
      },
      feedback: {
        title: "Alors ?",
        step: "Étape",
        of: "sur",
        next: "Suivant",
        back: "Retour",
        skip: "Passer",
        submit: "Envoyer et obtenir mon dessert",
        q1: {
          title: "Comment était le repas ?",
          subtitle: "Sois honnête. Le chef encaisse.",
          options: {
            love: "Adoré",
            good: "Très bien",
            ok: "Pas mal",
            meh: "Bof",
            bad: "Pas ouf"
          }
        },
        q2: {
          title: "Quels plats t'ont retourné ?",
          subtitle: "Choisis tous ceux que tu reprendrais."
        },
        q3: {
          title: "Un mot pour le chef ?",
          subtitle: "Optionnel. Une phrase suffit.",
          placeholder: "Les croquettes étaient incroyables…"
        },
        q4: {
          title: "Recommande, gagne un dessert.",
          subtitle:
            "Partage GastoVision avec quelqu'un qui adorerait cet endroit. Le prochain dessert est offert.",
          name: "Ton prénom",
          email: "Ton email (pour t'envoyer le bon)",
          friendName: "Prénom de ton ami(e)",
          channelEmail: "Envoyer par email",
          channelWhatsapp: "Envoyer sur WhatsApp",
          friendContact: "Email ou téléphone",
          message: "Message personnel (optionnel)",
          messageDefault:
            "Hé {friend}, je viens de manger là, c'est incroyable. Leur carte en vidéo est ouf — regarde 👇"
        },
        success: {
          title: "C'est fait !",
          subtitle:
            "On t'a envoyé un bon pour un dessert offert lors de ta prochaine visite.",
          voucher: "Bon dessert offert",
          code: "Code",
          expires: "Valable 30 jours",
          showWaiter: "Montre-le au serveur la prochaine fois.",
          back: "Retour au menu"
        }
      },
      common: {
        loading: "Chargement…",
        close: "Fermer",
        ok: "OK"
      }
    },

    de: {
      flag: "🇩🇪",
      label: "Deutsch",
      welcome: {
        kicker: "Scannen · Sehen · Bestellen",
        title: "Die Karte, die\nwirklich Hunger macht.",
        subtitle:
          "Tippe eine Karte an, um loszulegen. Echte Videos von jedem Gericht, in deiner Sprache.",
        cta: "Zur Speisekarte",
        scrollHint: "Wische für mehr",
        cards: {
          starters: "Vorspeisen",
          mains: "Hauptgänge",
          drinks: "Getränke & Cocktails",
          desserts: "Desserts",
          specials: "Tagesempfehlung"
        }
      },
      tabs: {
        favorites: "Favoriten",
        menu: "Menü",
        video: "Video",
        myList: "Meine Liste",
        feedback: "Feedback"
      },
      menu: {
        title: "Menü",
        toggleVideo: "Videoansicht",
        toggleList: "Listenansicht",
        readMore: "Mehr lesen",
        readLess: "Weniger",
        allergens: "Allergene",
        add: "Hinzufügen",
        added: "Hinzugefügt",
        favorite: "Favorit",
        unfavorite: "Favorit entfernen",
        empty: "Hier ist noch nichts."
      },
      detail: {
        back: "Zurück",
        share: "Teilen",
        ingredients: "Zutaten",
        chefNote: "Anmerkung vom Chef"
      },
      cart: {
        title: "Meine Liste",
        subtitle: "Zeige diese Liste deinem Kellner, wenn du bereit bist.",
        empty: "Deine Liste ist leer. Füge Gerichte aus dem Menü hinzu.",
        total: "Gesamt",
        clear: "Liste leeren",
        order: "Kellner rufen"
      },
      favorites: {
        title: "Favoriten",
        empty: "Tippe auf das Herz, um Gerichte hier zu speichern."
      },
      video: {
        title: "Video-Modus",
        hint: "Wische nach oben für das nächste Gericht."
      },
      feedback: {
        title: "Wie war's?",
        step: "Schritt",
        of: "von",
        next: "Weiter",
        back: "Zurück",
        skip: "Überspringen",
        submit: "Absenden & Dessert sichern",
        q1: {
          title: "Wie war das Essen?",
          subtitle: "Sei ehrlich. Der Chef kann's ab.",
          options: {
            love: "Geliebt",
            good: "Sehr gut",
            ok: "Ganz okay",
            meh: "Mittel",
            bad: "Schlecht"
          }
        },
        q2: {
          title: "Welche Gerichte haben dich umgehauen?",
          subtitle: "Wähle alle, die du wieder bestellen würdest."
        },
        q3: {
          title: "Noch was für den Chef?",
          subtitle: "Optional. Ein Satz reicht.",
          placeholder: "Die Kroketten waren unfassbar…"
        },
        q4: {
          title: "Empfiehl uns, hol dir ein Dessert.",
          subtitle:
            "Teile GastoVision mit jemandem, der diesen Ort lieben würde. Dein nächstes Dessert geht aufs Haus.",
          name: "Dein Name",
          email: "Deine E-Mail (für den Gutschein)",
          friendName: "Name des Freundes",
          channelEmail: "Per E-Mail senden",
          channelWhatsapp: "Per WhatsApp senden",
          friendContact: "E-Mail oder Telefon",
          message: "Persönliche Nachricht (optional)",
          messageDefault:
            "Hey {friend}, ich hab hier gerade mega gegessen. Ihr Videomenü ist wild — schau mal 👇"
        },
        success: {
          title: "Geschafft!",
          subtitle:
            "Wir haben dir einen Gutschein für ein kostenloses Dessert beim nächsten Besuch geschickt.",
          voucher: "Gratis-Dessert-Gutschein",
          code: "Code",
          expires: "Gültig 30 Tage",
          showWaiter: "Zeige ihn beim nächsten Besuch dem Kellner.",
          back: "Zurück zum Menü"
        }
      },
      common: {
        loading: "Lädt…",
        close: "Schließen",
        ok: "OK"
      }
    }
  };

  const langOrder = ["en", "es", "pt", "fr", "de"];
  let current = "en";
  const subscribers = new Set();

  function detect() {
    const stored = localStorage.getItem("gv.lang");
    if (stored && dictionaries[stored]) return stored;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return dictionaries[nav] ? nav : "en";
  }

  function get(path, lang) {
    const dict = dictionaries[lang || current];
    if (!dict) return path;
    return path
      .split(".")
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), dict);
  }

  function t(path, vars) {
    let value = get(path, current);
    if (value == null) value = get(path, "en");
    if (value == null) return path;
    if (vars && typeof value === "string") {
      Object.keys(vars).forEach((k) => {
        value = value.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      });
    }
    return value;
  }

  function set(lang) {
    if (!dictionaries[lang]) return;
    current = lang;
    localStorage.setItem("gv.lang", lang);
    document.documentElement.lang = lang;
    applyToDom();
    subscribers.forEach((cb) => cb(lang));
  }

  function applyToDom(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = t(key);
      if (typeof value === "string") el.textContent = value;
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.placeholder = t(key);
    });
    scope.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      el.setAttribute("aria-label", t(key));
    });
  }

  function subscribe(cb) {
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  }

  function getCurrent() {
    return current;
  }

  function getFlag(lang) {
    return (dictionaries[lang || current] || {}).flag || "🌐";
  }

  function getLabel(lang) {
    return (dictionaries[lang || current] || {}).label || lang;
  }

  function getLangs() {
    return langOrder.slice();
  }

  return {
    t,
    set,
    get: getCurrent,
    detect,
    applyToDom,
    subscribe,
    getFlag,
    getLabel,
    getLangs
  };
})();
