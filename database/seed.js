require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('./db');
const bcrypt = require('bcrypt');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seed() {
  console.log('Seeding database...');

  // Clear existing data
  db.exec('DELETE FROM contacts');
  db.exec('DELETE FROM blog_posts');
  db.exec('DELETE FROM tours');
  db.exec('DELETE FROM documents');
  db.exec('DELETE FROM admin_users');

  // Create admin user
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASS || 'magnolia2025';
  const hash = await bcrypt.hash(password, 12);

  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`Admin user created: ${username}`);

  // Seed tours
  const tours = [
    {
      title: 'Berlin - Stolica Zimnej Wojny',
      slug: 'berlin-stolica-zimnej-wojny',
      description: `Berlin to miasto, które jak żadne inne opowiada historię XX wieku. Podczas naszej jednodniowej wyprawy odkryjemy ślady Zimnej Wojny — od Checkpoint Charlie, przez East Side Gallery, po bunkry i muzea, które przechowują pamięć o podzielonym mieście.

Nasz przewodnik zabierze Was w podróż po obu stronach dawnego muru, opowiadając historie ludzi, którzy tu żyli, uciekali i walczyli o wolność. To nie jest zwykłe zwiedzanie — to doświadczenie, które zmienia perspektywę.

Berlin zaskakuje kontrastami: monumentalna architektura obok street artu, eleganckie boulevardy sąsiadujące z alternatywnymi dzielnicami. Każdy zakątek tego miasta ma swoją historię.`,
      short_description: 'Jednodniowa wyprawa śladami Zimnej Wojny po Berlinie. Checkpoint Charlie, East Side Gallery, bunkry i niezapomniane historie podzielonego miasta.',
      destination: 'Berlin',
      transport: 'bus',
      days: 1,
      price: 149,
      departure_date: '2026-04-12',
      return_date: '2026-04-12',
      max_participants: 18,
      available_spots: 12,
      cover_image: null,
      gallery_images: '[]',
      itinerary: `**06:00** — Wyjazd ze Szczecina (parking przy Galerii Kaskada)\n**09:00** — Przyjazd do Berlina, krótki spacer po Unter den Linden\n**09:30** — Brama Brandenburska i Reichstag — historia i symbolika\n**10:30** — Pomnik Holocaustu — chwila refleksji\n**11:00** — Checkpoint Charlie i Muzeum Muru Berlińskiego\n**12:30** — Przerwa na lunch w okolicy Friedrichstraße\n**13:30** — East Side Gallery — najdłuższy zachowany fragment muru\n**15:00** — Alexanderplatz i Wieża Telewizyjna\n**16:00** — Karl-Marx-Allee — socrealistyczna architektura\n**17:00** — Czas wolny na kawę i zakupy\n**18:00** — Wyjazd do Szczecina\n**21:00** — Planowany powrót`,
      includes: 'Transport autokarem klasy premium\nOpieka pilota/przewodnika przez cały dzień\nUbezpieczenie NNW\nWoda i przekąski w autokarze\nBilet wstępu do Muzeum Muru Berlińskiego',
      excludes: 'Wyżywienie (poza przekąskami w autokarze)\nBilety do dodatkowych atrakcji\nWydatki osobiste',
      featured: 1,
      active: 1
    },
    {
      title: 'Hamburg i Lubeka - Hanzeatycki Szlak',
      slug: 'hamburg-i-lubeka-hanzeatycki-szlak',
      description: `Dwudniowa podróż po najpiękniejszych miastach hanzeatyckich północnych Niemiec. Hamburg — drugie co do wielkości miasto Niemiec — zachwyci Was portem, dzielnicą magazynów Speicherstadt wpisaną na listę UNESCO, oraz niezwykłą Elbphilharmonie.

Lubeka, dawna stolica Hanzy, to miasto z ceglanego gotyku, marcepanowa stolica świata i miejsce, gdzie czas płynie wolniej. Spacer po starówce to jak cofnięcie się o wieki.

Ta wycieczka łączy historię kupieckich miast z ich współczesnym obliczem — od tradycyjnych tawern po nowoczesną architekturę, od starych składów po dzielnice artystyczne.`,
      short_description: 'Dwudniowa podróż hanzeatyckim szlakiem. Hamburg z jego portem i Speicherstadt oraz urokliwa Lubeka — perła gotyku ceglanego.',
      destination: 'Hamburg',
      transport: 'bus',
      days: 2,
      price: 349,
      departure_date: '2026-05-16',
      return_date: '2026-05-17',
      max_participants: 18,
      available_spots: 8,
      cover_image: null,
      gallery_images: '[]',
      itinerary: `**DZIEŃ 1 — Hamburg**\n**06:00** — Wyjazd ze Szczecina\n**10:00** — Przyjazd do Hamburga\n**10:30** — Speicherstadt — dzielnica magazynów UNESCO\n**12:00** — Elbphilharmonie — wizyta na platformie widokowej\n**13:00** — Lunch w porcie — ryba prosto z kutra\n**14:30** — Rejs po porcie hamburskim (1h)\n**16:00** — Ratusz i Jungfernstieg\n**17:30** — Zakwaterowanie w hotelu\n**19:00** — Wspólna kolacja (opcjonalnie)\n\n**DZIEŃ 2 — Lubeka**\n**08:00** — Śniadanie w hotelu\n**09:00** — Wyjazd do Lubeki\n**10:00** — Holstentor — symbol miasta\n**10:30** — Spacer po starówce — gotyckie kościoły i kamienice\n**12:00** — Muzeum Marcepanu Niederegger\n**13:00** — Lunch w tradycyjnej restauracji\n**14:30** — Katedra i dzielnica kupiecka\n**16:00** — Czas wolny\n**17:00** — Wyjazd do Szczecina\n**21:00** — Planowany powrót`,
      includes: 'Transport autokarem klasy premium\nNocleg w hotelu 3* (pokoje 2-osobowe)\nŚniadanie w hotelu\nOpieka pilota/przewodnika\nRejs po porcie hamburskim\nUbezpieczenie NNW',
      excludes: 'Obiady i kolacje\nBilety do muzeów (poza rejsem)\nNapoje alkoholowe\nWydatki osobiste\nDopłata do pokoju 1-osobowego (80 PLN)',
      featured: 1,
      active: 1
    },
    {
      title: 'Saksońska Szwajcaria - Drezno i Miśnia',
      slug: 'saksonska-szwajcaria-drezno-i-misnia',
      description: `Trzy dni w jednym z najpiękniejszych regionów Niemiec. Saksońska Szwajcaria to park narodowy ze spektakularnymi formacjami skalnymi, a most Bastei zapiera dech w piersiach.

Drezno — "Florencja nad Łabą" — odbudowane po zniszczeniach wojennych zachwyca barokową architekturą. Frauenkirche, Zwinger i Taras Brühla to obowiązkowe punkty programu.

Miśnia — miasto porcelany. Odwiedzimy najstarszą w Europie manufakturę porcelany i spacerujemy po urokliwej starówce z widokiem na Łabę.`,
      short_description: 'Trzy dni w Saksonii: spektakularne skały Bastei, barokowe Drezno i porcelanowa Miśnia. Przyroda, kultura i historia w jednej podróży.',
      destination: 'Drezno',
      transport: 'bus',
      days: 3,
      price: 429,
      departure_date: '2026-06-05',
      return_date: '2026-06-07',
      max_participants: 18,
      available_spots: 15,
      cover_image: null,
      gallery_images: '[]',
      itinerary: `**DZIEŃ 1 — Drezno**\n**05:00** — Wyjazd ze Szczecina\n**10:00** — Przyjazd do Drezna\n**10:30** — Frauenkirche — symbol odbudowy\n**11:30** — Zwinger — galeria i ogrody\n**13:00** — Lunch\n**14:00** — Taras Brühla — "balkon Europy"\n**15:00** — Procesja Książąt — największa mozaika z porcelany\n**16:00** — Nowe Miasto (Neustadt) — dzielnica artystyczna\n**17:30** — Zakwaterowanie, czas wolny\n\n**DZIEŃ 2 — Saksońska Szwajcaria**\n**08:00** — Śniadanie\n**09:00** — Wyjazd do Parku Narodowego\n**10:00** — Most Bastei — panoramiczne widoki\n**11:30** — Szlak skalny (umiarkowany, ok. 2h)\n**13:30** — Piknik w górach\n**15:00** — Twierdza Königstein\n**17:00** — Powrót do Drezna\n**19:00** — Wspólna kolacja nad Łabą\n\n**DZIEŃ 3 — Miśnia**\n**08:00** — Śniadanie, wykwaterowanie\n**09:30** — Wyjazd do Miśni\n**10:00** — Manufaktura Porcelany Miśnieńskiej\n**12:00** — Starówka i zamek Albrechtsburg\n**13:00** — Lunch\n**14:30** — Czas wolny w Miśni\n**15:30** — Wyjazd do Szczecina\n**20:00** — Planowany powrót`,
      includes: 'Transport autokarem klasy premium\n2 noclegi w hotelu 3* w Dreźnie\n2 śniadania\nOpieka pilota/przewodnika\nBilet wstępu do Manufaktury Porcelany\nBilet wstępu na Twierdzę Königstein\nUbezpieczenie NNW',
      excludes: 'Obiady i kolacje\nBilety do Zwingera (15 EUR)\nNapoje\nWydatki osobiste\nDopłata do pokoju 1-osobowego (160 PLN)',
      featured: 1,
      active: 1
    },
    {
      title: 'Babelsberg - Śladami Kina',
      slug: 'babelsberg-sladami-kina',
      description: `Studio Babelsberg to najstarsze wielkie studio filmowe na świecie. Założone w 1912 roku, to tutaj powstały arcydzieła kina niemego, tu kręcono filmy propagandowe III Rzeszy, a po wojnie studio stało się sercem filmowego przemysłu NRD (DEFA).

Dziś Babelsberg to nowoczesne studio produkcyjne, w którym kręcone są hollywoodzkie produkcje. Zwiedzanie to fascynująca podróż przez historię kina i techniki filmowej.

Po wizycie w studiu odkryjemy Poczdam — miasto pałaców i ogrodów, dawną rezydencję królów pruskich, gdzie podpisano porozumienie poczdamskie kończące II wojnę światową.`,
      short_description: 'Jednodniowa wyprawa do najstarszego studia filmowego świata w Babelsbergu i królewskiego Poczdamu. Kino, historia i architektura.',
      destination: 'Poczdam',
      transport: 'bus',
      days: 1,
      price: 159,
      departure_date: '2026-04-26',
      return_date: '2026-04-26',
      max_participants: 18,
      available_spots: 18,
      cover_image: null,
      gallery_images: '[]',
      itinerary: `**06:30** — Wyjazd ze Szczecina\n**09:30** — Przyjazd do Babelsbergu\n**10:00** — Filmpark Babelsberg — zwiedzanie z przewodnikiem\n**10:30** — Historia studia — od kina niemego po Hollywood\n**11:30** — Pokazy efektów specjalnych\n**12:30** — Lunch na terenie parku\n**13:30** — Wyjazd do Poczdamu\n**14:00** — Park Sanssouci — pałac i ogrody Fryderyka Wielkiego\n**15:30** — Holenderska Dzielnica — unikalna architektura\n**16:00** — Pałac Cecilienhof — miejsce konferencji poczdamskiej\n**17:00** — Czas wolny, kawa\n**17:30** — Wyjazd do Szczecina\n**20:30** — Planowany powrót`,
      includes: 'Transport autokarem klasy premium\nOpieka pilota/przewodnika\nBilet wstępu do Filmpark Babelsberg\nUbezpieczenie NNW\nWoda w autokarze',
      excludes: 'Wyżywienie\nBilety wstępu do pałaców (opcjonalnie)\nWydatki osobiste',
      featured: 0,
      active: 1
    }
  ];

  const insertTour = db.prepare(`
    INSERT INTO tours (title, slug, description, short_description, destination, transport, days, price, departure_date, return_date, max_participants, available_spots, cover_image, gallery_images, itinerary, includes, excludes, featured, active)
    VALUES (@title, @slug, @description, @short_description, @destination, @transport, @days, @price, @departure_date, @return_date, @max_participants, @available_spots, @cover_image, @gallery_images, @itinerary, @includes, @excludes, @featured, @active)
  `);

  for (const tour of tours) {
    insertTour.run(tour);
  }
  console.log(`${tours.length} tours created`);

  // Seed blog posts
  const posts = [
    {
      title: 'Berlin - miasto, które nigdy nie przestaje się zmieniać',
      slug: 'berlin-miasto-ktore-nigdy-nie-przestaje-sie-zmieniac',
      excerpt: 'Berlin to nie tylko Brama Brandenburska i resztki muru. To miasto kontrastów, które nieustannie ewoluuje, łącząc historię z awangardą.',
      content: `# Berlin - miasto, które nigdy nie przestaje się zmieniać

Berlin jest jak palimpsest — każda epoka zostawiła tu swój ślad, a kolejna nadpisywała historię na nowo. Spacerując po ulicach tego miasta, można w jednym kwartale przejść od pruskiego klasycyzmu przez socrealistyczną monumentalność po najnowocześniejszą architekturę XXI wieku.

## Ślady historii na każdym kroku

Kiedy stoisz przy Bramie Brandenburskiej, stoisz w miejscu, przez które przechodziły armie Napoleona, maszerowały hitlerowskie kolumny i przez które w 1989 roku przeszli ludzie ze wschodu, by po raz pierwszy od 28 lat dotknąć wolności.

Mur Berliński, którego fragmenty wciąż można zobaczyć w kilku miejscach miasta, to nie tylko betonowa bariera. To symbol podziału świata na dwa bloki, symbol rodzin rozdzielonych na dekady i symbol ludzkiej determinacji w dążeniu do wolności.

## East Side Gallery

Najdłuższy zachowany fragment muru — ponad 1300 metrów — zamieniono w galerię sztuki na otwartym powietrzu. Ponad 100 artystów z całego świata namalowało tu murale, które komentują historię, politykę i ludzkie nadzieje.

Najbardziej znany obraz — "Mój Boże, pomóż mi przetrwać tę śmiertelną miłość" autorstwa Dmitrija Vrubela — przedstawia pocałunek Breżniewa z Honeckerem i stał się jednym z najczęściej reprodukowanych dzieł sztuki XX wieku.

## Współczesny Berlin

Ale Berlin to nie tylko historia. To jedno z najbardziej dynamicznych miast Europy. Dzielnica Kreuzberg tętni życiem wielokulturowej społeczności. Prenzlauer Berg przyciąga młode rodziny i artystów. Mitte łączy luksus z kulturą.

Street art jest tu wszędzie — od drobnych naklejek po wielkoformatowe murale pokrywające całe ściany kamienic. To miasto, w którym sztuka wylewa się z galerii na ulice.

## Dlaczego warto jechać z przewodnikiem?

Berlin można zwiedzać samodzielnie, ale z przewodnikiem odkryjesz warstwy, które są niewidoczne dla przypadkowego turysty. Ukryte podwórka, zapomniane bunkry, historie ludzi, którzy tu żyli — to wszystko składa się na prawdziwy obraz tego niezwykłego miasta.

W Magnolia Club zabieramy Was w miejsca, do których nie dotrzecie z typowym przewodnikiem turystycznym. Pokazujemy Berlin, który czuje się, a nie tylko ogląda.`,
      cover_image: null,
      author: 'Łukasz',
      category: 'Berlin',
      published: 1
    },
    {
      title: 'Zimna Wojna w Berlinie - przewodnik po najważniejszych miejscach',
      slug: 'zimna-wojna-w-berlinie-przewodnik',
      excerpt: 'Od Checkpoint Charlie po tunele ucieczek — przewodnik po miejscach, które opowiadają historię Zimnej Wojny w podzielonym Berlinie.',
      content: `# Zimna Wojna w Berlinie — przewodnik po najważniejszych miejscach

Berlin był epicentrum Zimnej Wojny. Przez 28 lat mur dzielił nie tylko miasto, ale cały świat. Dziś te miejsca są świadectwem jednego z najdziwniejszych rozdziałów ludzkiej historii.

## Checkpoint Charlie

Najbardziej znane przejście graniczne między sektorem amerykańskim a radzieckim. To tutaj w październiku 1961 roku amerykańskie i radzieckie czołgi stanęły naprzeciwko siebie, a świat wstrzymał oddech, czekając czy rozpocznie się III wojna światowa.

Dziś muzeum przy Checkpoint Charlie opowiada historie ucieczek z NRD — w walizkach, w specjalnie przebudowanych samochodach, a nawet w domowej roboty balonach.

## Muzeum DDR

Interaktywne muzeum, w którym można "zamieszkać" w typowym wschodnioniemieckim bloku. Siądziesz w Trabancie, zajrzysz do lodówki pełnej wschodnioniemieckich produktów i poczujesz, jak wyglądało codzienne życie za żelazną kurtyną.

## Pałac Łez (Tränenpalast)

Dworzec graniczny, na którym rozgrywały się najbardziej dramatyczne sceny — pożegnania rodzin, które nie wiedziały, czy jeszcze kiedykolwiek się zobaczą. Nazwa "Pałac Łez" nie jest przypadkowa.

## Bernauer Straße

Ulica, przy której mur biegł dosłownie pod oknami mieszkań. To tutaj ludzie skakali z okien na zachodnią stronę, zanim okna zostały zamurowane. Dziś działa tu centrum dokumentacyjne z wieżą widokową, z której można zobaczyć zachowaną "strefę śmierci".

## Bunkry i tunele

Pod Berlinem kryje się sieć bunkrów z czasów II wojny światowej i Zimnej Wojny. Berliner Unterwelten organizuje fascynujące wycieczki po podziemiach, w tym do bunkrów, w których mieszkańcy Berlina mieli schronić się w razie ataku nuklearnego.

## Jak zwiedzać?

Miejsca Zimnej Wojny są rozproszone po całym mieście. Najlepiej zaplanować trasę tematyczną, łącząc Checkpoint Charlie, Bernauer Straße i East Side Gallery. Na spokojne zwiedzanie potrzeba minimum jednego pełnego dnia.

W Magnolia Club oferujemy jednodniową wycieczkę "Berlin - Stolica Zimnej Wojny", podczas której nasz przewodnik zabierze Was do najważniejszych miejsc i opowie historie, których nie znajdziecie w żadnym przewodniku.`,
      cover_image: null,
      author: 'Łukasz',
      category: 'Cold War',
      published: 1
    }
  ];

  const insertPost = db.prepare(`
    INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, author, category, published)
    VALUES (@title, @slug, @excerpt, @content, @cover_image, @author, @category, @published)
  `);

  for (const post of posts) {
    insertPost.run(post);
  }
  console.log(`${posts.length} blog posts created`);

  // Seed documents
  const docs = [
    {
      title: 'Regulamin wycieczek',
      description: 'Ogólne warunki uczestnictwa w wycieczkach organizowanych przez Magnolia Club.',
      filename: 'regulamin-wycieczek.pdf',
      category: 'Regulaminy'
    },
    {
      title: 'Informacje praktyczne - Berlin',
      description: 'Praktyczny przewodnik dla uczestników wycieczki do Berlina.',
      filename: 'info-berlin.pdf',
      category: 'Informacje praktyczne'
    }
  ];

  const insertDoc = db.prepare(`
    INSERT INTO documents (title, description, filename, category)
    VALUES (@title, @description, @filename, @category)
  `);

  for (const doc of docs) {
    insertDoc.run(doc);
  }
  console.log(`${docs.length} documents created`);

  console.log('Seeding complete!');
}

seed().catch(console.error);
