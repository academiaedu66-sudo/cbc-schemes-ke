// Comprehensive KICD Rationalized CBC Curriculum Syllabus Map (Grades 1 to 12)
// Covers Term 1, Term 2, and Term 3 Strands, Sub-strands, KIQs, Publishers & Practical Activities

export const APPROVED_PUBLISHERS = [
  'KLB Visionary',
  'Longhorn CBC',
  'Oxford New Progressive',
  'Moran CBC',
  'Mentor Series',
  'Spotlight CBC',
];

export const JSS_SENIOR_PUBLISHERS = [
  'KLB Top Scholar',
  'Longhorn',
  'Oxford Head Start',
  'Moran',
  'Mentor',
  'Spotlight',
];

export const SUBJECT_SYLLABUS = {
  // ================= LOWER PRIMARY (GRADES 1 - 3) =================
  'Mathematical Activities': {
    shortCode: 'MATH-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 NUMBERS', subs: ['Pre-Number & Sorting Activities', 'Whole Numbers: Counting & Reading', 'Place Value (Ones, Tens & Hundreds)', 'Number Patterns & Ordering'], kiq: 'How do we use numbers to count and group objects in daily life?', resources: 'Counters, bottle tops, number cards, place value tins, abacus' },
        { strand: '1.0 NUMBERS', subs: ['Addition of Whole Numbers', 'Addition Word Tasks', 'Subtraction as Taking Away', 'Relationship Between Addition & Subtraction'], kiq: 'When do we add or subtract items at home and school?', resources: 'Number lines, marbles, sticks, flashcards' },
      ],
      2: [
        { strand: '1.0 NUMBERS', subs: ['Multiplication as Repeated Addition', 'Division as Equal Sharing', 'Fractions (Halves & Quarters of a Whole)', 'Fractions of a Group'], kiq: 'How can we share fruits or books equally among friends?', resources: 'Paper cutouts, fruits realia, fraction charts, counters' },
        { strand: '2.0 MEASUREMENT', subs: ['Length (Arbitrary & Standard Metres)', 'Mass (Comparing Heavy & Light / Kilograms)', 'Capacity (Filling & Emptying Containers / Litres)'], kiq: 'Why do we measure length, mass, and capacity accurately?', resources: 'Metre rule, beam balance, 1-litre containers, sand, water' },
      ],
      3: [
        { strand: '2.0 MEASUREMENT', subs: ['Time (Days, Months & Reading the Clock Face)', 'Money (Kenyan Coins & Notes, Shopping)', 'Needs and Wants in Spending'], kiq: 'How do we tell time and use Kenyan currency wisely?', resources: 'Model clock faces, Kenyan currency specimens, classroom shop corner' },
        { strand: '3.0 GEOMETRY', subs: ['Lines (Straight, Curved, Wavy & Zigzag)', '2D Shapes (Rectangles, Circles, Triangles, Ovals)', 'Making Patterns Using Shapes'], kiq: 'What shapes can we observe on buildings and objects around us?', resources: 'Shape cutouts, manila paper, crayons, string, sticks' },
      ],
    },
  },

  'English Language Activities': {
    shortCode: 'ENG-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 LISTENING AND SPEAKING', subs: ['Greetings, Polite Words & Etiquette', 'Pronunciation & Letter-Sound Knowledge', 'Oral Comprehension: School & Family'], kiq: 'Why should we use courteous words when greeting elders and peers?', resources: 'Letter-sound flashcards, audio rhymes, picture charts' },
        { strand: '2.0 READING & 3.0 WRITING', subs: ['Print Awareness & Reading Posture', 'Blending Three- & Four-Letter Words', 'Handwriting: Letter Formation & Spacing', 'Capital Letters & Full Stops'], kiq: 'How do we blend sounds to read new words fluently?', resources: 'Decodable storybooks, pocket charts, ruled exercise books' },
      ],
      2: [
        { strand: '1.0 LISTENING AND SPEAKING', subs: ['Safety at Home & Road Crossing', 'Weather and Our Environment Vocabulary', 'Following Multi-Step Oral Instructions'], kiq: 'How do we stay safe at home, school, and on the road?', resources: 'Road sign posters, weather charts, picture cards' },
        { strand: '3.0 LANGUAGE IN USE & WRITING', subs: ['Singular and Plural Nouns', 'Action Verbs (Present & Continuous Tense)', 'Personal Pronouns (I, You, He, She, We, They)', 'Guided Sentence Writing'], kiq: 'How do action words help us describe what people are doing?', resources: 'Substitution tables, word wheels, illustrated readers' },
      ],
      3: [
        { strand: '2.0 READING COMPREHENSION', subs: ['Reading Short Stories for Meaning', 'Retelling Stories in Sequence', 'Vocabulary Building: Community Helpers & Animals'], kiq: 'What lessons can we learn from stories about our community?', resources: 'Graded CBC readers, animal flashcards, sequence cards' },
        { strand: '4.0 WRITING & GRAMMAR', subs: ['Prepositions (in, on, under, behind, near)', 'Describing Words (Adjectives of Size & Colour)', 'Spelling & Dictation', 'Writing a Short Guided Paragraph'], kiq: 'How do describing words make our sentences clear and interesting?', resources: 'Classroom realia, word walls, picture composition prompts' },
      ],
    },
  },

  'Kiswahili Language Activities': {
    shortCode: 'KIS-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 KUSIKILIZA NA KUZUNGUMZA', subs: ['Maamkizi na Maagano ya Wakati Mbalimbali', 'Matamshi Bora ya Sauti na Silabi', 'Msamiati wa Shuleni na Nyumbani'], kiq: 'Tunatumia maneno gani ya adabu tunapowasalimia watu?', resources: 'Kadi za silabi, chati za picha, vifaa vya kidijitali' },
        { strand: '2.0 KUSOMA NA 3.0 KUANDIKA', subs: ['Kusoma Silabi na Maneno Rahisi', 'Kusoma Hadithi Fupi kwa Ufasaha', 'Maumbo ya Herufi Kubwa na Ndogo', 'Nafasi Kati ya Maneno'], kiq: 'Tunaunganishaje silabi ili kusoma maneno kwa ufasaha?', resources: 'Vitabu vya hadithi, chati ya herufi, madaftari' },
      ],
      2: [
        { strand: '1.0 MWILI WANGU NA USAFI', subs: ['Sehemu za Mwili wa Binadamu', 'Usafi wa Kibinafsi na Mazingira', 'Umoja na Wingi wa Majina (Ngeli ya A-WA na KI-VI)'], kiq: 'Kwa nini ni muhimu kudumisha usafi wa mwili na mazingira?', resources: 'Chati ya mwili, vifaa vya usafi, kadi za maneno' },
        { strand: '4.0 SARUFI NA KUANDIKA', subs: ['Nyakati: Wakati Uliopo (-na-) na Uliopita (-li-)', 'ukanushaji Rahisi wa Sentensi', 'Kuandika Sentensi Fupi Zenye Maana'], kiq: 'Tunatambuaje wakati kitendo kilipofanyika katika sentensi?', resources: 'Jedwali la kutunga sentensi, picha za vitendo' },
      ],
      3: [
        { strand: '2.0 HALI YA ANGA NA USALAMA', subs: ['Msamiati wa Hali ya Anga na Mavazi', 'Haki na Usalama wa Mtoto', 'Kusoma Ufahamu na Kujibu Maswali'], kiq: 'Tunajikingaje kutokana na hatari mbalimbali nyumbani na njiani?', resources: 'Picha za hali ya anga, hadithi za watoto, bango la usalama' },
        { strand: '3.0 KUANDIKA NA SARUFI', subs: ['Vivumishi vya Sifa na Idadi', 'Alama za Uakifishaji (Kikomo na Kiulizi)', 'Imla na Kuandika Kifungu Fupi'], kiq: 'Alama za uakifishaji zinatusaidiaje tunaposoma na kuandika?', resources: 'Kadi za alama za uakifishaji, vitabu vya mazoezi' },
      ],
    },
  },

  'Indigenous Language Activities': {
    shortCode: 'IND-LANG',
    strandsByTerm: {
      1: [
        { strand: '1.0 ORAL COMMUNICATION', subs: ['Cultural Greetings & Respectful Address', 'Naming Family Members & Homestead Items', 'Traditional Songs, Lullabies & Tongue Twisters'], kiq: 'How do greetings in our mother tongue show respect across age groups?', resources: 'Resource persons, audio recordings, cultural artefacts, picture cards' },
        { strand: '2.0 EARLY READING & WRITING', subs: ['Vowels and Consonants in Indigenous Orthography', 'Syllable Blending & Word Recognition', 'Copying Words & Simple Sentences'], kiq: 'How do sounds in our indigenous language form meaningful words?', resources: 'Alphabet charts, syllable flashcards, mother-tongue readers' },
      ],
      2: [
        { strand: '1.0 LISTENING, RIDDLES & STORIES', subs: ['Riddles, Proverbs & Folk Narratives', 'Domestic & Wild Animals in Mother Tongue', 'Counting & Market Vocabulary'], kiq: 'What moral values do traditional folktales teach children?', resources: 'Storybooks, animal charts, local market items' },
        { strand: '3.0 READING & WRITING', subs: ['Reading Short Cultural Passages', 'Action Words & Describing Words', 'Labelling Drawings & Writing Sentences'], kiq: 'How can we preserve our community stories through writing?', resources: 'Drawing paper, crayons, indigenous story booklets' },
      ],
      3: [
        { strand: '2.0 COMMUNITY & ENVIRONMENT', subs: ['Seasons, Farming & Food Crops', 'Environmental Conservation Taboos & Practices', 'Polite Requests & Role-Play Dialogues'], kiq: 'How did our community care for rivers, forests, and soil?', resources: 'Seed samples, farm tool pictures, elders / resource speakers' },
        { strand: '4.0 CREATIVE EXPRESSION', subs: ['Poems & Action Chants', 'Reading Fluency & Comprehension', 'Guided Paragraph & Dictation'], kiq: 'Why should we take pride in speaking and writing our indigenous language?', resources: 'Poetry charts, flashcards, exercise books' },
      ],
    },
  },

  'Environmental Activities': {
    shortCode: 'ENV-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 SOCIAL ENVIRONMENT & HYGIENE', subs: ['Personal Hygiene: Handwashing, Oral Care & Grooming', 'Keeping Our Home & Classroom Clean', 'Family Needs, Shelter & Basic Rights'], kiq: 'Why must we wash hands with soap and clean running water?', resources: 'Soap, clean water container, toothbrush model, broom, hygiene charts' },
        { strand: '1.0 SAFETY & NEIGHBOURHOOD', subs: ['Safe & Unsafe Places in the Neighbourhood', 'Basic Road Safety Signs & Pedestrian Rules', 'Healthy Habits & Clean Toilets/Latrines'], kiq: 'How do we identify and avoid hazards on our way to school?', resources: 'Road safety posters, picture cards, first-aid display' },
      ],
      2: [
        { strand: '2.0 NATURAL ENVIRONMENT', subs: ['Weather Conditions & Recording a Weather Chart', 'Soil Types (Clay, Loam, Sand) & Modelling', 'Water Sources, Safe Storage & Making Water Safe'], kiq: 'How can we make water safe for drinking at home?', resources: 'Soil samples, sieves, weather symbols chart, clean cloth filter' },
        { strand: '2.0 PLANTS & ANIMALS', subs: ['Parts of a Plant & Caring for Young Plants', 'Domestic Animals & Their Products/Care', 'Healthy Foods & Balanced Meals (Hygiene & Nutrition)'], kiq: 'Why are plants and domestic animals important to our families?', resources: 'Potted seedlings, food group charts, animal flashcards' },
      ],
      3: [
        { strand: '3.0 RESOURCES IN OUR ENVIRONMENT', subs: ['Conserving Water & Switching Off Lights', 'Sources of Light, Heat & Sound', 'Managing Solid Waste: Reusing & Recycling'], kiq: 'How can we reduce litter and reuse materials in our school?', resources: 'Sorting bins, recyclable bottles/cartons, torch, safety posters' },
        { strand: '3.0 CARING FOR THE ENVIRONMENT', subs: ['Tree Planting & School Clean-Up Project', 'Good Table Manners & Food Hygiene', 'End-of-Year Practical Environmental Portfolio'], kiq: 'What happens when everyone participates in keeping the school green?', resources: 'Tree seedlings, watering cans, protective gloves' },
      ],
    },
  },

  'Creative Activities': {
    shortCode: 'CREATIVE-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 CREATING AND EXECUTING', subs: ['Drawing & Colouring Simple Forms', 'Locomotor Skills: Hopping, Skipping & Galloping', 'Singing Action Songs & Clapping Rhythms'], kiq: 'How do we express joy through drawing, singing, and movement?', resources: 'Crayons, drawing books, shakers, drums, open playfield' },
        { strand: '1.0 CRAFT & MODELLING', subs: ['Modelling Pinch Pots & Animals Using Clay/Plasticine', 'Paper Folding, Tearing & Collage Making', 'Throwing and Catching Improvised Balls'], kiq: 'Which local materials can we recycle to make safe play items?', resources: 'Clay, old newspapers, sisal strings, safe glue' },
      ],
      2: [
        { strand: '2.0 PERFORMING AND DISPLAYING', subs: ['Kenyan Children Singing Games & Folk Songs', 'Painting & Pattern Printing (Leaf/Potato Prints)', 'Gymnastics: Balancing, Rolling & Stretching'], kiq: 'How do we maintain balance and safety during movement games?', resources: 'Water paints, leaves, landing mats, whistles, costumes' },
        { strand: '2.0 RHYTHM & MELODY', subs: ['Improvised Percussion Instruments (Shakers & Drums)', 'Beading & Threading Ornaments', 'Water Safety Awareness & Pool Rules'], kiq: 'How can we create steady rhythms using improvised percussion?', resources: 'Bottle-top shakers, large seeds/beads, threads, charts' },
      ],
      3: [
        { strand: '3.0 APPRECIATION IN CREATIVE ACTIVITIES', subs: ['Performing the Kenya National Anthem with Etiquette', 'Weaving Simple Mats Using Paper/Banana Fibres', 'Mini Class Art Exhibition & Talent Showcase'], kiq: 'Why do we stand at attention when singing the National Anthem?', resources: 'Kenyan flag, woven mat samples, display boards' },
        { strand: '3.0 TEAM GAMES & PORTFOLIO', subs: ['Mini Relay Races & Cooperative Tag Games', 'Critiquing Peers Artwork Kindly', 'Organizing a Personal Creative Portfolio'], kiq: 'How does teamwork make sports and performances enjoyable?', resources: 'Relay batons, cones, learner art folders' },
      ],
    },
  },

  // ================= UPPER PRIMARY (GRADES 4 - 6) =================
  'Mathematics': {
    shortCode: 'MATH',
    strandsByTerm: {
      1: [
        { strand: '1.0 NUMBERS', subs: ['Whole Numbers: Place Value & Total Value', 'Reading, Writing & Rounding Off Whole Numbers', 'Divisibility Tests, Factors, GCD & LCM', 'Operations: Addition, Subtraction, Multiplication & Division'], kiq: 'How do place value, LCM, and GCD help solve real-life scheduling and sharing tasks?', resources: 'Place value apparatus, number charts, factor trees, mathematical tables' },
        { strand: '1.0 FRACTIONS & DECIMALS', subs: ['Equivalent & Simplified Fractions', 'Addition, Subtraction & Multiplication of Fractions', 'Decimals: Place Value & Operations', 'Squares, Square Roots & Percentages'], kiq: 'Where are fractions, decimals, and percentages used in trade and science?', resources: 'Fraction strips, hundred-square grids, price catalogues' },
      ],
      2: [
        { strand: '2.0 MEASUREMENT', subs: ['Length (mm, cm, m, km), Perimeter & Circumference', 'Area of Rectangles, Triangles & Combined Shapes', 'Volume & Capacity (cm³, m³, ml & Litres)', 'Mass (g, kg, tonnes) & Time (12-hr / 24-hr Clock)'], kiq: 'Why are standard SI units essential in construction, transport, and farming?', resources: 'Metre rules, tape measures, 1-litre jugs, weighing scales, timetables' },
        { strand: '2.0 MONEY & ALGEBRA', subs: ['Budgets, Profit, Loss, Discount & Tax', 'Forming & Simplifying Algebraic Expressions', 'Linear Equations & Simple Inequalities'], kiq: 'How does preparing a budget promote financial discipline?', resources: 'Sample receipts, price lists, KRA tax awareness charts, beam balance' },
      ],
      3: [
        { strand: '3.0 GEOMETRY', subs: ['Lines, Perpendicular & Parallel Constructions', 'Measuring & Constructing Angles Using a Protractor', 'Properties of Triangles & Quadrilaterals', '3D Solids (Cubes, Cuboids, Cylinders & Pyramids)'], kiq: 'How do architects and carpenters apply geometric constructions?', resources: 'Geometrical sets, protractors, pairs of compasses, 3D nets' },
        { strand: '4.0 DATA HANDLING', subs: ['Collecting Data Using Tally Marks & Frequency Tables', 'Bar Graphs, Pictographs & Line Graphs', 'Interpreting Real-World Statistical Charts'], kiq: 'How do graphs help us make quick decisions from large sets of data?', resources: 'Graph books, census charts, rainfall data tables' },
      ],
    },
  },

  'English': {
    shortCode: 'ENG',
    strandsByTerm: {
      1: [
        { strand: '1.0 ETIQUETTE, CITIZENSHIP & ORAL SKILLS', subs: ['Polite Telephone & Interpersonal Etiquette', 'Pronunciation, Stress, Intonation & Homophones', 'Extensive & Intensive Reading Comprehension'], kiq: 'How do intonation and polite expressions improve communication?', resources: 'Dictionaries, audio dialogues, KICD-approved English readers' },
        { strand: '2.0 GRAMMAR IN USE & WRITING', subs: ['Nouns, Quantifiers, Pronouns & Determiners', 'Verbs, Tense Aspect & Subject-Verb Agreement', 'Paragraph Cohesion & Narrative Composition Writing'], kiq: 'What makes a narrative composition vivid and engaging to read?', resources: 'Grammar charts, sample essays, thesaurus' },
      ],
      2: [
        { strand: '3.0 DIGITAL LITERACY, HEALTH & ENVIRONMENT', subs: ['Skimming & Scanning Informational Texts', 'Oral Literature: Trickster, Ogre & Moral Narratives', 'Adjectives, Order of Adjectives, Adverbs & Prepositions'], kiq: 'How do we evaluate reliable information when reading online or in print?', resources: 'Oral literature anthologies, newspaper cuttings, digital tablets' },
        { strand: '4.0 FUNCTIONAL & CREATIVE WRITING', subs: ['Friendly Letters, Formal Letters & Emails', 'Conjunctions, Active & Passive Voice', 'Punctuation, Direct & Indirect (Reported) Speech'], kiq: 'How does formal letter layout differ from an informal letter?', resources: 'Sample letters, punctuation wall charts, writing rubrics' },
      ],
      3: [
        { strand: '5.0 POETRY, DEBATE & CONSUMER AWARENESS', subs: ['Reciting & Analyzing Poems (Rhyme, Persona & Imagery)', 'Question Tags, Conditionals & Phrasal Verbs', 'Public Speaking, Debate & Interview Etiquette'], kiq: 'How do poets use imagery and rhythm to convey powerful messages?', resources: 'Poetry anthologies, debate timer, cue cards' },
        { strand: '6.0 SUMMARY, DIARIES & EXAM REVISION', subs: ['Note-Making & Summary Writing', 'Keeping Journals, Speeches & Descriptive Essays', 'Integrated Comprehension & Grammar Synthesis'], kiq: 'Why is summarizing key points a vital study skill?', resources: 'Model compositions, past assessment papers' },
      ],
    },
  },

  'Kiswahili': {
    shortCode: 'KIS',
    strandsByTerm: {
      1: [
        { strand: '1.0 KUSIKILIZA, KUZUNGUMZA NA KUSOMA', subs: ['Adabu za Mazungumzo na Matamshi ya Sauti Tata', 'Kusoma kwa Ufahamu na Msamiati wa Afya na Usafi', 'Aina za Maneno: Nomino, Viwakilishi na Vivumishi'], kiq: 'Matumizi sahihi ya ngeli na aina za maneno huboreshaje mawasiliano?', resources: 'Kamusi ya Kiswahili Sanifu, chati za ngeli, vitabu vya hadithi' },
        { strand: '2.0 KUANDIKA NA SARUFI', subs: ['Upatanisho wa Kisintaksia katika Ngeli za Nomino', 'Nyakati na Hali (-na-, -li-, -ta-, -me-, hu-)', 'Kuandika Insha ya Masimulizi na Maelezo'], kiq: 'Insha bora ya masimulizi inapaswa kuwa na muundo na mapambo gani?', resources: 'Mifano ya insha bora, jedwali la ngeli' },
      ],
      2: [
        { strand: '3.0 FASIHI SIMULIZI NA USALAMA MTANDAONI', subs: ['Methali, Vitendawili, Nahau na Tashbihi', 'Nyimbo za Kazi, Bembelezi na Hadithi za Kijamii', 'Vitenzi, Mnyambuliko wa Vitenzi na Vielezi'], kiq: 'Fasihi simulizi inachangiaje maadili na umoja katika jamii?', resources: 'Diwani za hadithi na methali, vinasa sauti' },
        { strand: '4.0 INSHA ZA KIUAMILIFU', subs: ['Kuandika Barua ya Kirafiki na Barua Rasmi', 'Viunganishi, Vihusishi na Vihisishi', 'Ukanushaji na Usemi Halisi na Usemi wa Taarifa'], kiq: 'Ni mambo gani muhimu yanayozingatiwa katika barua rasmi?', resources: 'Vielelezo vya barua rasmi, chati za sarufi' },
      ],
      3: [
        { strand: '5.0 USHAIRI, MAZINGIRA NA URAIA', subs: ['Kusoma na Kuchambua Mashairi Mepesi', 'Ukubwa na Udogo wa Nomino & Kinyume cha Maneno', 'Mjadala na Hotuba Fupi Kuhusu Utunzaji wa Mazingira'], kiq: 'Tunawezaje kutumia lugha kuhamasisha jamii kutunza mazingira?', resources: 'Mashairi teule, mabango ya mazingira, kamusi' },
        { strand: '6.0 UFUPISHO NA MARUDIO YA MTIHANI', subs: ['Kusoma kwa Mapana (Novela / Tamthilia ya Ngazi Husika)', 'Kuandika Shajara, Ratiba na Insha ya Mazungumzo', 'uchambuzi wa Maswali ya Sarufi na Lugha'], kiq: 'Kusoma vitabu vya ziada kunakuza vipi uwezo wa kujieleza?', resources: 'Vitabu teule vya kusoma kwa mapana, karatasi za tathmini' },
      ],
    },
  },

  'Science and Technology': {
    shortCode: 'SCI-TECH',
    strandsByTerm: {
      1: [
        { strand: '1.0 LIVING THINGS AND THEIR ENVIRONMENT', subs: ['Classification of Plants (Flowering & Non-Flowering)', 'Vertebrates & Invertebrates Characteristics', 'Human Digestive, Breathing & Circulatory Systems'], kiq: 'How are plants, animals, and human body systems adapted to their functions?', resources: 'Hand lenses, protective gloves, biological wall charts, plastic-bottle lung model' },
        { strand: '1.0 HEALTH & SENSORY ORGANS', subs: ['Sense Organs & Their Care', 'Waterborne & Communicable Diseases Prevention', 'Fungi (Moulds, Yeast, Mushrooms) & Economic Importance'], kiq: 'How do hygiene and vaccination protect communities against diseases?', resources: 'Bread mould specimen in sealed bag, health posters, digital animations' },
      ],
      2: [
        { strand: '2.0 MATTER', subs: ['States of Matter & Properties of Solids, Liquids, Gases', 'Change of State (Melting, Evaporation, Condensation, Freezing)', 'Mixtures & Methods of Separating Mixtures', 'Acids and Bases Using Natural Litmus Indicators (Hibiscus)'], kiq: 'How can we test acidic and basic substances safely using flower extracts?', resources: 'Hibiscus petals, lemon juice, wood ash solution, sieves, filter paper, burners' },
        { strand: '2.0 AIR & WATER CONSERVATION', subs: ['Composition of Air & Uses of Oxygen, CO2, Nitrogen', 'Water Pollution Causes & Control', 'Floating and Sinking Factors'], kiq: 'Why does a heavy metallic ship float while a small nail sinks?', resources: 'Basins of water, bottle tops, stones, candle-jar oxygen setup' },
      ],
      3: [
        { strand: '3.0 FORCE AND ENERGY', subs: ['Types & Effects of Force, Friction & Gravity', 'Light Energy (Reflection, Transparent/Translucent/Opaque)', 'Heat Transfer (Conduction, Convection, Radiation)', 'Sound Energy & Hearing Protection'], kiq: 'Where are conductors and insulators of heat applied in kitchenware?', resources: 'Mirrors, metal rods, wax, candles, tuning forks, spring balances' },
        { strand: '3.0 SIMPLE MACHINES & DIGITAL CODING', subs: ['Levers (First, Second & Third Class) & Inclined Planes', 'Digital Devices, Word Processing & Scratch Visual Coding'], kiq: 'How do simple machines make everyday farm and construction work easier?', resources: 'Claw hammer, wheelbarrow, bottle opener, laptops/tablets with Scratch' },
      ],
    },
  },

  'Agriculture and Nutrition': {
    shortCode: 'AGRI-NUTR',
    strandsByTerm: {
      1: [
        { strand: '1.0 CONSERVATION OF RESOURCES', subs: ['Soil Conservation: Mulching, Cover Cropping & Terracing', 'Compost Manure Preparation & Organic Gardening', 'Water Harvesting & Drip Irrigation Innovations'], kiq: 'How do soil and water conservation practices boost household food security?', resources: 'Jembes, dry grass mulch, plastic bottles for drip irrigation, school farm plot' },
        { strand: '2.0 FOOD PRODUCTION PROCESSES', subs: ['Nursery Bed Establishment & Transplanting Vegetables', 'Growing Cereals, Legumes & Fruit Trees', 'Safe Pest, Weed & Wild Animal Control'], kiq: 'Why do we raise delicate vegetable seedlings in a nursery bed first?', resources: 'Certified seeds, watering cans, organic ash, scarecrow materials' },
      ],
      2: [
        { strand: '2.0 DOMESTIC ANIMALS & POULTRY', subs: ['Uses & Routine Rearing Practices of Domestic Animals', 'Poultry Housing, Feeding & Parasite Control', 'Preserving Milk, Meat, Fruits & Cereals'], kiq: 'How does proper hygiene in animal housing prevent livestock diseases?', resources: 'Poultry feeder models, livestock charts, solar dryer model' },
        { strand: '3.0 HYGIENE PRACTICES & NUTRITION', subs: ['Balanced Diet, Macro/Micronutrients & Deficiency Diseases', 'Kitchen Hygiene, Food Spoilage & Safe Storage', 'Cooking Methods: Boiling, Stewing, Shallow Frying & Steaming'], kiq: 'How do we conserve nutrients while preparing and cooking vegetables?', resources: 'Cooking pots, fresh vegetables, aprons, food pyramid chart' },
      ],
      3: [
        { strand: '4.0 PRODUCTION TECHNIQUES', subs: [' Hand Sewing Stitches (Tacking, Running, Backstitch & Hemming)', 'Repairing Garments & Fixing Loose Buttons', 'Crocheting & Knitting Household Articles'], kiq: 'How can needlework and crocheting skills save money at home?', resources: 'Needles, assorted threads, fabric pieces, buttons, crocheting hooks, yarn' },
        { strand: '4.0 LAUNDRY & INNOVATIVE GARDENING', subs: ['Sorting & Laundering Cotton and Coloured Garments', 'Container, Sack & Vertical Kitchen Gardening', 'Value Addition to Crop Produce'], kiq: 'How can families in urban spaces grow fresh vegetables in sacks or tyres?', resources: 'Sacks, topsoil, manure, basins, mild soap, clotheslines' },
      ],
    },
  },

  'Social Studies': {
    shortCode: 'SOC-STD',
    strandsByTerm: {
      1: [
        { strand: '1.0 NATURAL AND BUILT ENVIRONMENTS', subs: ['Compass Directions, Map Reading, Scale & Key Symbols', 'Physical Features in County, Kenya & Eastern Africa', 'Climatic Regions, Vegetation & Historic Built Environments'], kiq: 'How do physical features influence human settlement and economic activities?', resources: 'Wall maps of Kenya & Eastern Africa, atlases, globes, magnetic compass' },
        { strand: '2.0 PEOPLE AND POPULATION', subs: ['Language Groups, Origins & Migration Routes', 'Population Distribution, Density & Interdependence', 'Positive Cultural Practices & Peaceful Coexistence'], kiq: 'How does cultural diversity strengthen national unity in Kenya?', resources: 'Migration route maps, census charts, cultural artefacts' },
      ],
      2: [
        { strand: '3.0 RESOURCES AND ECONOMIC ACTIVITIES', subs: ['Crop & Dairy/Beef Farming in Kenya & Africa', 'Fishing, Forestry, Wildlife & Tourism Conservation', 'Mining, Transport, Communication & Regional Trade (EAC)'], kiq: 'Why is regional trade within the East African Community beneficial?', resources: 'Mineral samples, EAC member maps, economic photographs' },
        { strand: '3.0 PERSONAL DEVELOPMENT & LIFE SKILLS', subs: ['Self-Awareness, Self-Esteem & Managing Emotions', 'Peer Pressure Resistance & Peaceful Conflict Resolution', 'Entrepreneurship & Personal Career Exploration'], kiq: 'How can learners resolve disagreements peacefully through dialogue?', resources: 'Role-play scenario cards, career guidance charts' },
      ],
      3: [
        { strand: '4.0 POLITICAL SYSTEMS AND GOVERNANCE', subs: ['Traditional Governance Systems (Ameru, Buganda, Khoisan)', 'The Constitution of Kenya, National Values & Symbols', 'Human Rights, Children Rights & Active Citizenship'], kiq: 'What responsibilities accompany the rights guaranteed in our Constitution?', resources: 'Constitution of Kenya pocket copy, National Symbols poster' },
        { strand: '4.0 NATIONAL & COUNTY GOVERNMENT', subs: ['Arms of National Government (Legislature, Executive, Judiciary)', 'County Governments Structure & Sources of Revenue', 'IEBC, Democratic Elections & Peace Building'], kiq: 'How do County and National governments work together to serve citizens?', resources: 'Mock ballot box, government structure organogram' },
      ],
    },
  },

  'Creative Arts': {
    shortCode: 'CREATIVE-ARTS',
    strandsByTerm: {
      1: [
        { strand: '1.0 CREATING AND EXECUTING', subs: ['Still-Life Drawing: Smudging, Stippling & Cross-Hatching', 'Kenyan Indigenous Wind & Percussion Instruments', 'Athletics: Sprint Starts, Baton Relay & Middle-Distance'], kiq: 'How does tonal value create depth and realism in still-life drawings?', resources: '2B/4B pencils, charcoal, descant recorders, relay batons, athletics track' },
        { strand: '1.0 MONTAGE, POTTERY & BALL GAMES', subs: ['Coil & Slab Pottery Techniques', 'Netball, Volleyball & Football Passing/Dribbling Drills'], kiq: 'Why are warm-up and cool-down exercises vital before and after sports?', resources: 'Prepared clay, footballs, volleyballs, cones, whistles' },
      ],
      2: [
        { strand: '2.0 PERFORMING AND DISPLAYING', subs: ['Descant Recorder & Sol-fa Ladder (d r m f s l t d’)', 'East African Folk Songs & Traditional Dances', 'Tie-and-Dye, Batik & Stencil Fabric Decoration'], kiq: 'How do costumes and body adornment enhance African folk dances?', resources: 'Fabric dyes, white cotton cloth, strings, descant recorders, rhythm charts' },
        { strand: '2.0 GYMNASTICS, SWIMMING & PUPPETRY', subs: ['Glove & Marionette Puppetry Performance', 'Multi-Sequence Gymnastics & Basic Swimming Strokes'], kiq: 'How can puppetry communicate messages on health and integrity?', resources: 'Sock/carton puppets, gym mats, kickboards' },
      ],
      3: [
        { strand: '3.0 APPRECIATION IN ARTS AND SPORTS', subs: ['Graphic Design: Posters, Lettering & Book Jackets', 'Basketry, Leatherwork & Beadwork Ornaments', 'Rounders, Frisbee & Fair Play Officiating'], kiq: 'What principles of layout make an awareness poster eye-catching?', resources: 'Calligraphy pens, manila boards, sisal/raffia, leather thongs, beads' },
        { strand: '3.0 CRITIQUE & EXHIBITION', subs: ['Analyzing Kenya Music Festival & Art Pieces', 'Mounting & Pricing Artworks for School Exhibition'], kiq: 'How can creative arts skills generate income in the creative economy?', resources: 'Display easels, mounting frames, adjudication rubrics' },
      ],
    },
  },

  // ================= JUNIOR SECONDARY (GRADES 7 - 9) =================
  'Integrated Science': {
    shortCode: 'INT-SCI',
    strandsByTerm: {
      1: [
        { strand: '1.0 SCIENTIFIC INVESTIGATION & MIXTURES', subs: ['Laboratory Apparatus, Hazard Symbols & First Aid', 'SI Units, Derived Quantities & Density Calculations', 'Elements, Compounds, Chemical Symbols & Atomic Structure', 'Homogeneous/Heterogeneous Mixtures: Chromatography & Distillation'], kiq: 'How do fractional distillation and chromatography apply in industry and forensics?', resources: 'Bunsen burner, Liebig condenser, filter paper, Periodic Table chart' },
        { strand: '1.0 ACIDS, BASES & FIRE SAFETY', subs: ['Commercial & Plant-Extract Acid-Base Indicators & pH Scale', 'Physical vs Chemical Changes & Rusting Control', 'Classes of Fire (A–F), Fire Triangle & Extinguishers'], kiq: 'Why must different classes of fire be extinguished using specific agents?', resources: 'Litmus paper, universal indicator, test tubes, fire extinguisher chart' },
      ],
      2: [
        { strand: '2.0 LIVING THINGS AND THEIR ENVIRONMENT', subs: ['Light Microscope Parts, Magnification & Cell Structure', 'Diffusion, Osmosis & Active Transport in Living Tissue', 'Human Reproductive, Excretory (Skin/Kidney) & Digestive Systems', 'Plant Nutrition (Photosynthesis) & Transpiration'], kiq: 'How does osmosis regulate water movement in plant roots and animal cells?', resources: 'Light microscopes, glass slides, iodine stain, Visking tubing, anatomical models' },
        { strand: '2.0 HEALTH EDUCATION & ECOLOGY', subs: ['Adolescent Health, STIs & Lifestyle Diseases Prevention', 'Biotic/Abiotic Ecosystem Factors, Food Chains & Food Webs'], kiq: 'How does human activity disrupt energy flow in natural food webs?', resources: 'Quadrat frames, sweep nets, health brochures' },
      ],
      3: [
        { strand: '3.0 FORCE AND ENERGY', subs: ['Static & Current Electricity, Series/Parallel Circuits', 'Magnetism, Magnetic Fields & Electromagnets', 'Pressure in Solids and Liquids (P = F/A & P = hpg)', 'Curved Mirrors, Waves & Renewable Energy Transformations'], kiq: 'How do hydraulic brakes and domestic electrical safety fuses work?', resources: 'Dry cells, ammeters, bar magnets, iron filings, concave/convex mirrors' },
      ],
    },
  },

  'Pre-Technical Studies': {
    shortCode: 'PRE-TECH',
    strandsByTerm: {
      1: [
        { strand: '1.0 FOUNDATIONS OF PRE-TECHNICAL STUDIES', subs: ['Role of Technical, Computer & Business Studies', 'Physical Workshop Safety, PPE & Fire Prevention', 'Online Safety: Phishing, Malware & Data Privacy'], kiq: 'How do workshop safety rules and cyber hygiene protect workers and data?', resources: 'Safety goggles, overalls, workshop safety charts, computers' },
        { strand: '2.0 COMMUNICATION IN PRE-TECHNICAL STUDIES', subs: ['Technical Drawing Instruments, Lines & Freehand Sketching', 'Geometrical Plane Figures, Scale Drawing & Isometric/Oblique Views', 'Computer Hardware, Software & Operating Systems'], kiq: 'Why is isometric technical drawing used before fabricating a prototype?', resources: 'T-squares, set squares, compasses, A3 drawing paper, PC components' },
      ],
      2: [
        { strand: '3.0 MATERIALS FOR PRODUCTION', subs: ['Metallic & Non-Metallic Materials (Wood, Plastics, Ceramics, Composites)', 'Measuring, Marking Out, Cutting & Holding Workshop Tools', 'Care, Maintenance & Safe Storage of Hand Tools'], kiq: 'What properties make timber, mild steel, or PVC suitable for specific products?', resources: 'Try-square, tenon saw, G-clamp, vernier callipers, material samples' },
        { strand: '4.0 COMPUTER PRODUCTIVITY & VISUAL PROGRAMMING', subs: ['Word Processing, Spreadsheets Formulas & Presentations', 'Scratch / Block-Based Coding (Loops, Variables & Conditionals)'], kiq: 'How can spreadsheet formulas automate business stock and accounting records?', resources: 'Computers/laptops, spreadsheet templates, Scratch software' },
      ],
      3: [
        { strand: '5.0 ENTREPRENEURSHIP & FINANCIAL LITERACY', subs: ['Generating Viable Business Ideas & Ethical Practices', 'Bookkeeping: Cashbooks, Statements of Financial Position', 'Saving, Investing, Mobile Money Safety & Consumer Protection', 'Marketing Goods & Services + Capstone Mini-Project'], kiq: 'How do entrepreneurs identify community gaps and turn them into sustainable enterprises?', resources: 'Sample cashbooks, KEBs quality mark samples, project portfolios' },
      ],
    },
  },

  'Creative Arts and Sports': {
    shortCode: 'CAS-JSS',
    strandsByTerm: {
      1: [
        { strand: '1.0 FOUNDATIONS OF CREATIVE ARTS AND SPORTS', subs: ['Components & Career Pathways in Visual Arts, Music, Theatre & Sports', 'Elements of Music: Rhythm, Time Signatures (2/4, 3/4, 4/4) & Staff Notation', 'Drawing, Painting Colour Wheel & Picture Making'], kiq: 'How do Visual Arts, Performing Arts, and Sports interconnect in major events?', resources: 'Manuscript music books, keyboards/recorders, acrylic/water paints, brushes' },
      ],
      2: [
        { strand: '2.0 CREATING AND PERFORMING', subs: ['Middle-Distance Running, Javelin, Shot Put & Triple Jump', 'Handball, Basketball, Rugby & Netball Tactical Skills', 'Playwriting, Scripting, Verse Speaking & Dramatic Acting', 'Composing Four-Bar Rhythms & Melodies in Major Keys'], kiq: 'What biomechanical techniques maximize safety and distance in field events?', resources: 'Training javelins, shot puts, basketballs, stage props, stopwatches' },
      ],
      3: [
        { strand: '3.0 APPRECIATION IN CREATIVE ARTS AND SPORTS', subs: ['Sportsmanship, Anti-Doping Ethics & Sports First Aid (RICE)', 'Carving, Sculpture, Collage & Kenyan Cultural Jewellery', 'Critiquing Kenyan Folk Dances, Plays & Musical Performances'], kiq: 'Why is clean competition (anti-doping) fundamental to world athletics?', resources: 'First-aid kit, carving soapstone/softwood, festival video clips, rubrics' },
      ],
    },
  },

  // ================= RELIGIOUS EDUCATION (ALL GRADES 1 - 12) =================
  'Christian Religious Education (CRE)': {
    shortCode: 'CRE',
    strandsByTerm: {
      1: [
        { strand: '1.0 CREATION AND THE BIBLE', subs: ['God as Creator: Uniqueness of Human Beings & Stewardship', 'The Fall of Humanity & God’s Plan of Salvation', 'Divisions, Translation & Uses of the Holy Bible in Kenya'], kiq: 'How do Christians demonstrate stewardship over God’s creation today?', resources: 'Good News Bible, Bible library chart, tree seedlings, songbooks' },
      ],
      2: [
        { strand: '2.0 THE LIFE AND MINISTRY OF JESUS CHRIST', subs: ['Birth, Boyhood & Baptism of Jesus Christ', 'Teachings of Jesus: Sermon on the Mount & Parables of the Kingdom', 'Miracles of Jesus: Healing, Nature & Compassion for the Needy', 'Passion, Death, Resurrection & Ascension of Christ'], kiq: 'What practical lessons on forgiveness and compassion do Jesus’ parables teach?', resources: 'Good News Bible, role-play scripts, flashcards of Christian values' },
      ],
      3: [
        { strand: '3.0 THE CHURCH AND CHRISTIAN LIVING', subs: ['Day of Pentecost, Fruit & Gifts of the Holy Spirit', 'Christian Family, Healthy Friendships & Human Sexuality', 'Responsible Use of Social Media, Leisure, Wealth & Work Ethics', 'Resisting Drug and Substance Abuse'], kiq: 'How do the fruits of the Holy Spirit guide responsible youth choices?', resources: 'Good News Bible, guidance & counselling posters, case study cards' },
      ],
    },
  },

  'Islamic Religious Education (IRE)': {
    shortCode: 'IRE',
    strandsByTerm: {
      1: [
        { strand: '1.0 QUR’AN AND HADITH', subs: ['Revelation, Compilation & Preservation of the Holy Qur’an', 'Recitation, Meaning & Teachings of Selected Surahs', 'Ulumul Hadith: Components & Selected Prophetic Traditions on Character'], kiq: 'How does daily reflection on the Qur’an and Sunnah shape a Muslim’s conduct?', resources: 'Mushaf (Holy Qur’an), Juz Amma charts, audio recitations, Hadith collections' },
      ],
      2: [
        { strand: '2.0 PILLARS OF IMAN AND DEVOTIONAL ACTS (IBADAH)', subs: ['Tawheed (Oneness of Allah), Angels, Revealed Books & Day of Qiyamah', 'Taharah (Purification), Wudhu, Tayammum & Conditions of Swalah', 'Zakah, Swawm (Ramadhan) & Hajj Significance'], kiq: 'How do Swalah and Zakah promote discipline and social justice in society?', resources: 'Prayer mats, Wudhu sequence charts, Zakah calculation tables' },
      ],
      3: [
        { strand: '3.0 AKHLAQ (MORALS), MUAMALAT & ISLAMIC HERITAGE', subs: ['Virtues: Sidq (Truthfulness), Birrul Walidayn (Kindness to Parents) & Sabr', 'Prohibitions: Israf, Ghibah, Intoxicants & Gambling', 'Halal Earning, Islamic Family Rights & Seerah of Prophet Muhammad (PBUH)'], kiq: 'What ethical principles govern Halal trade and peaceful coexistence in Islam?', resources: 'Seerah timelines, Islamic ethics charts, reference books' },
      ],
    },
  },

  // ================= SENIOR SCHOOL (GRADES 10 - 12) =================
  'Core Mathematics': {
    shortCode: 'CORE-MATH',
    strandsByTerm: {
      1: [
        { strand: '1.0 ALGEBRA & NUMBER THEORY', subs: ['Surds, Indices & Logarithms', 'Quadratic Expressions, Equations & Inequalities', 'Matrices, Determinants & Simultaneous Linear Systems'], kiq: 'How are matrices and logarithms applied in computing and scientific modelling?', resources: 'Scientific calculators, KICD Senior Math Design, graph books' },
      ],
      2: [
        { strand: '2.0 TRIGONOMETRY, VECTORS & GEOMETRY', subs: ['Trigonometric Ratios, Sine/Cosine Rules & Radian Measure', '2D & 3D Vectors, Collinearity & Ratio Theorem', 'Loci, Circle Theorems & Transformation Matrices'], kiq: 'How do engineers and navigators use trigonometry and vectors?', resources: 'Geometrical instruments, 3D wireframe models, calculators' },
      ],
      3: [
        { strand: '3.0 CALCULUS, STATISTICS & COMMERCIAL ARITHMETIC', subs: ['Measures of Dispersion (Variance & Standard Deviation) & Probability', 'Income Tax (PAYE), Compound Interest, Appreciation & Depreciation', 'Differentiation & Integration Applications (Kinematics & Area)'], kiq: 'How does calculus model instantaneous rates of change and optimization?', resources: 'KRA PAYE tables, statistical tables, graphing tools' },
      ],
    },
  },

  'Community Service Learning (CSL)': {
    shortCode: 'CSL',
    strandsByTerm: {
      1: [
        { strand: '1.0 CITIZENSHIP & COMMUNITY NEEDS ASSESSMENT', subs: ['Principles of Servant Leadership & Civic Responsibility', 'Identifying Community Gaps Using Surveys & Interviews', 'Stakeholder Mapping & Project Proposal Writing'], kiq: 'How do we conduct an ethical needs assessment to identify real community challenges?', resources: 'Survey questionnaires, community maps, CSL logbooks' },
      ],
      2: [
        { strand: '2.0 PROJECT PLANNING, RESOURCE MOBILIZATION & ACTION', subs: ['Action Plan Timelines, Budgeting & Safety Risk Assessment', 'Collaborative Implementation of Environmental/Social Projects', 'Monitoring Progress & Resolving Team Challenges'], kiq: 'What makes a youth-led community project sustainable beyond school?', resources: 'Project implementation tools, budget templates, protective gear' },
      ],
      3: [
        { strand: '3.0 REFLECTION, DOCUMENTATION & SHOWCASE', subs: ['Evaluating Community Impact (Quantitative & Qualitative)', 'Reflective Journaling & Portfolio Compilation', 'Community Feedback Presentation & Handover'], kiq: 'How does structured reflection turn service experiences into lifelong skills?', resources: 'CSL assessment rubrics, presentation boards, reflective journals' },
      ],
    },
  },

  'Biology': {
    shortCode: 'BIO',
    strandsByTerm: {
      1: [
        { strand: '1.0 CELL BIOLOGY, BIODIVERSITY & TAXONOMY', subs: ['Light & Electron Microscopy, Resolution & Ultrastructure', 'Binomial Nomenclature, Dichotomous Keys & Five Kingdoms', 'Membrane Transport: Osmosis, Diffusion & Active Transport'], kiq: 'How does organelle ultrastructure relate to specialized cellular metabolism?', resources: 'Compound microscopes, prepared slides, photomicrographs, hand lenses' },
      ],
      2: [
        { strand: '2.0 NUTRITION, GAS EXCHANGE & TRANSPORT', subs: ['Biomolecules (Carbohydrates, Lipids, Proteins) & Enzyme Kinetics', 'Photosynthesis Stages & Mammalian Enzymatic Digestion', 'Gaseous Exchange in Plants, Fish, Insects & Mammals; Mammalian Heart'], kiq: 'Why do enzymes exhibit strict pH and temperature optima?', resources: 'Benedict/Biuret/Iodine reagents, water baths, mammalian heart model' },
      ],
      3: [
        { strand: '3.0 HOMEOSTASIS, GENETICS & ECOLOGY', subs: ['Thermoregulation, Osmoregulation (Nephron) & Blood Sugar Control', 'DNA Replication, Mitosis, Meiosis & Mendelian Inheritance', 'Population Ecology, Conservation & Coordination/Response'], kiq: 'How do meiosis and genetic variation drive adaptation in populations?', resources: 'DNA double-helix model, quadrats, genetic cross punnett charts' },
      ],
    },
  },

  'Chemistry': {
    shortCode: 'CHEM',
    strandsByTerm: {
      1: [
        { strand: '1.0 ATOMIC STRUCTURE, PERIODICITY & BONDING', subs: ['Sub-Atomic Particles, Isotopes & Electron Configurations', 'Periodic Table Trends (Ionization Energy, Atomic Radius, Electronegativity)', 'Ionic, Covalent, Dative & Metallic Bonding; Crystal Structures'], kiq: 'How does chemical bonding determine melting point, solubility, and conductivity?', resources: 'Ball-and-stick molecular models, Periodic Table, conductivity circuit' },
      ],
      2: [
        { strand: '2.0 STOICHIOMETRY, ACIDS/BASES & ENERGETICS', subs: ['The Mole Concept, Empirical Formulas & Volumetric Titration', 'Gas Laws (Boyle’s, Charles’s, Ideal Gas & Graham’s Diffusion)', 'Enthalpy Changes (Hess’s Law), Reaction Rates & Le Chatelier’s Equilibrium'], kiq: 'How does volumetric titration determine unknown concentrations accurately?', resources: 'Burettes, pipettes, volumetric flasks, standard solutions, thermometers' },
      ],
      3: [
        { strand: '3.0 ELECTROCHEMISTRY, ORGANIC & INDUSTRIAL CHEMISTRY', subs: ['Redox Potentials, Electrochemical Cells & Faraday’s Electrolysis', 'Alkanes, Alkenes, Alkynes, Alkanols, Alkanoic Acids & Polymers', 'Green Industrial Processes (Haber, Contact, Fractional Extraction)'], kiq: 'How can green chemistry minimize industrial pollution while meeting material demand?', resources: 'Voltmeters, carbon/copper electrodes, organic molecular kits' },
      ],
    },
  },

  'Physics': {
    shortCode: 'PHYS',
    strandsByTerm: {
      1: [
        { strand: '1.0 MECHANICS & PROPERTIES OF MATTER', subs: ['Vernier Callipers, Micrometer Screw Gauge & Error Analysis', 'Linear Motion, Equations of Motion & Newton’s Laws / Momentum', 'Hooke’s Law, Moments of Force, Pressure & Archimedes’ Principle'], kiq: 'How do engineers apply Newton’s laws and Hooke’s law in structural safety?', resources: 'Micrometer screw gauges, helical springs, ticker-tape timers, pulleys' },
      ],
      2: [
        { strand: '2.0 THERMAL PHYSICS, WAVES & OPTICS', subs: ['Specific Heat Capacity, Latent Heat & Gas Laws', 'Transverse/Longitudinal Waves, Sound & Electromagnetic Spectrum', 'Refraction (Snell’s Law, Total Internal Reflection) & Thin Lenses'], kiq: 'How does total internal reflection enable high-speed fibre-optic internet?', resources: 'Calorimeters, glass blocks, converging/diverging lenses, ray boxes' },
      ],
      3: [
        { strand: '3.0 ELECTRICITY, ELECTROMAGNETISM & MODERN PHYSICS', subs: ['Ohm’s Law, Internal Resistance, Wheatstone Bridge & Capacitors', 'Electromagnetic Induction (Faraday/Lenz), Transformers & AC Power', 'Photoelectric Effect, Semiconductors (Diodes) & Radioactivity'], kiq: 'Why is electrical power transmitted across the national grid at high voltage AC?', resources: 'Ammeters, voltmeters, rheostats, step-down transformers, p-n diodes' },
      ],
    },
  },

  'Computer Science': {
    shortCode: 'COMP-SCI',
    strandsByTerm: {
      1: [
        { strand: '1.0 COMPUTER ARCHITECTURE & DATA REPRESENTATION', subs: ['Von Neumann CPU Fetch-Decode-Execute Cycle & Memory Hierarchy', 'Binary, Octal, Hexadecimal, Two’s Complement & Logic Gates', 'Operating Systems, File Management & Utility Software'], kiq: 'How do logic gates combine to perform arithmetic inside a microprocessor?', resources: 'Computer lab, logic simulator software, motherboard demonstration unit' },
      ],
      2: [
        { strand: '2.0 ALGORITHMS, PROGRAMMING & DATABASES', subs: ['Flowcharts, Pseudocode & Python/JavaScript Structured Programming', 'Data Structures (Arrays/Lists), Functions & Debugging', 'Relational Database Design (Normalization, Keys & SQL Queries)'], kiq: 'Why is database normalization critical before building enterprise systems?', resources: 'Python IDE, SQLite/PostgreSQL environment, algorithm workbooks' },
      ],
      3: [
        { strand: '3.0 NETWORKING, CYBERSECURITY & SYSTEMS DEVELOPMENT', subs: ['OSI/TCP-IP Models, Topologies, IP Addressing & Cloud Computing', 'Encryption, Firewalls, Ethical Hacking Defense & Data Protection Act', 'SDLC Phases & Senior School Software Capstone Project'], kiq: 'How does Kenya’s Data Protection Act safeguard citizens’ personal data?', resources: 'Network switches, RJ45 crimping kits, packet tracer simulator' },
      ],
    },
  },

  'History and Citizenship': {
    shortCode: 'HIST-CIT',
    strandsByTerm: {
      1: [
        { strand: '1.0 EARLY HUMANITY, AFRICAN CIVILIZATIONS & MIGRATION', subs: ['Sources of History, Archaeological Sites in East Africa & Evolution', 'Ancient Egypt, Kush, Axum & Trans-Saharan/Indian Ocean Trade', 'Pre-Colonial Kenyan Communities: Social, Economic & Political Systems'], kiq: 'Why is East Africa recognized globally as the cradle of humankind?', resources: 'Historical atlases, museum replica photos, documentary excerpts' },
      ],
      2: [
        { strand: '2.0 COLONIALISM, NATIONALISM & INDEPENDENCE IN AFRICA', subs: ['Scramble, Partition & African Responses (Nandi, Giriama, Maji Maji)', 'Colonial Land/Labour Policies, Mau Mau & Rise of Political Associations', 'Constitutional Milestones to Independence & Pan-Africanism'], kiq: 'How did trade unions and liberation movements accelerate Kenya’s independence?', resources: 'Archival speeches, timelines, biographies of freedom heroes' },
      ],
      3: [
        { strand: '3.0 DEVOLVED GOVERNANCE, PUBLIC FINANCE & GLOBAL RELATIONS', subs: ['Constitution of Kenya 2010: Bill of Rights, Devolution & Chapter Six', 'National Budget Cycle, Revenue Allocation & Independent Commissions', 'AU, EAC, UN, Commonwealth & Global Peacekeeping'], kiq: 'How does devolution bring public resources and accountability closer to citizens?', resources: 'Constitution of Kenya 2010, Parliamentary Hansard samples, UN charts' },
      ],
    },
  },

  'Geography': {
    shortCode: 'GEOG',
    strandsByTerm: {
      1: [
        { strand: '1.0 MAPWORK, STATISTICAL METHODS & INTERNAL LANDFORMS', subs: ['Topographical Map Interpretation (Contours, Gradient, Cross-Sections)', 'Earth’s Crust, Plate Tectonics, Folding, Faulting (Rift Valley) & Volcanicity', 'Rocks, Minerals & Fieldwork Methodology'], kiq: 'How did faulting shape the Great East African Rift Valley and its drainage?', resources: '1:50,000 Survey of Kenya topographical maps, rock specimens, clinometers' },
      ],
      2: [
        { strand: '2.0 WEATHER, CLIMATE, SOILS & EXTERNAL LAND-FORMING PROCESSES', subs: ['Stevenson Screen Instruments, Weather Forecasting & Climate Change', 'Weathering, Mass Wasting & Action of Rivers, Lakes, Wind & Waves', 'World Vegetation Zones & Soil Profile Management'], kiq: 'What adaptation strategies mitigate climate variability in ASAL counties?', resources: 'School weather station, rain gauge, synoptic charts, soil augers' },
      ],
      3: [
        { strand: '3.0 HUMAN & ECONOMIC GEOGRAPHY (GIS, ENERGY & URBANIZATION)', subs: ['Introduction to GIS & Remote Sensing in Resource Mapping', 'Sustainable Agriculture, Irrigation Schemes (Mwea/Perkerra) & Energy', 'Industrialization, Urban Planning (Nairobi/Mombasa) & Environmental Conservation'], kiq: 'How does Geographic Information Systems (GIS) transform modern urban planning?', resources: 'QGIS/Google Earth imagery, economic atlases, statistical abstracts' },
      ],
    },
  },

  'Business Studies': {
    shortCode: 'BUS-STD',
    strandsByTerm: {
      1: [
        { strand: '1.0 BUSINESS ENVIRONMENT, ENTREPRENEURSHIP & FORMS OF OWNERSHIP', subs: ['Human Wants, Economic Resources, Scarcity & Opportunity Cost', 'Sole Proprietorship, Partnerships, Co-operatives (SACCOs) & Companies', ' Nairobi Securities Exchange (NSE) & Government Consumer Protection'], kiq: 'Why do SACCOs play a pivotal role in capital mobilization in Kenya?', resources: 'Sample SACCO bylaws, NSE share price listings, business newspapers' },
      ],
      2: [
        { strand: '2.0 DEMAND, SUPPLY, MONEY, BANKING & PUBLIC FINANCE', subs: ['Demand & Supply Curves, Equilibrium Price & Market Structures', 'Central Bank of Kenya Functions, Commercial Banks & FinTech / Mobile Money', 'Taxation Principles, KRA Digital Filing & Insurance Contracts'], kiq: 'How do shifts in demand and supply determine market prices of farm produce?', resources: 'Graph paper, CBK currency leaflets, insurance proposal forms' },
      ],
      3: [
        { strand: '3.0 ACCOUNTING LEDGERS, FINANCIAL STATEMENTS & INTERNATIONAL TRADE', subs: ['Source Documents, Double-Entry Ledgers, Three-Column Cashbook & Trial Balance', 'Income Statement (Trading, P&L) & Statement of Financial Position', 'Balance of Payments, Exchange Rates & Regional Economic Blocs (AfCFTA)'], kiq: 'How do accurate financial statements guide investment and credit decisions?', resources: 'Accounting ledger books, invoices/receipts, AfCFTA trade briefs' },
      ],
    },
  },
};

export const GRADES_CURRICULUM_PLAN = [
  // Lower Primary (Grades 1–3): 8 rationalized subjects per grade
  ...[1, 2, 3].map((grade) => ({
    grade,
    level: 'Lower Primary',
    examBadge: grade === 3 ? 'KEYA' : 'CBC',
    subjects: [
      'Mathematical Activities',
      'English Language Activities',
      'Kiswahili Language Activities',
      'Indigenous Language Activities',
      'Environmental Activities',
      'Creative Activities',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
    ],
  })),
  // Upper Primary (Grades 4–6): 9 rationalized subjects per grade
  ...[4, 5, 6].map((grade) => ({
    grade,
    level: 'Upper Primary',
    examBadge: grade === 6 ? 'KPSEA' : 'CBC',
    subjects: [
      'Mathematics',
      'English',
      'Kiswahili',
      'Science and Technology',
      'Agriculture and Nutrition',
      'Social Studies',
      'Creative Arts',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
    ],
  })),
  // Junior Secondary (Grades 7–9): 10 rationalized subjects per grade
  ...[7, 8, 9].map((grade) => ({
    grade,
    level: 'Junior Secondary',
    examBadge: grade === 9 ? 'KJSEA' : 'JSS',
    subjects: [
      'Mathematics',
      'English',
      'Kiswahili',
      'Integrated Science',
      'Agriculture and Nutrition',
      'Social Studies',
      'Pre-Technical Studies',
      'Creative Arts and Sports',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
    ],
  })),
  // Senior School (Grades 10–12): Core + Pathway subjects (13 subjects per grade)
  ...[10, 11, 12].map((grade) => ({
    grade,
    level: 'Senior School',
    examBadge: grade === 12 ? 'CBE Senior Assessment' : 'Senior School',
    subjects: [
      'Core Mathematics',
      'English',
      'Kiswahili',
      'Community Service Learning (CSL)',
      'Biology',
      'Chemistry',
      'Physics',
      'Computer Science',
      'History and Citizenship',
      'Geography',
      'Business Studies',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
    ],
  })),
];

/**
 * Official KICD Rationalized CBC Weekly Lesson Allocation & Lesson Duration
 *
 * - Lower Primary (Grades 1–3, 30 mins/lesson):
 *   English Activities (5), Mathematical Activities (5), Kiswahili Activities (4),
 *   Environmental Activities (4), Creative Activities (7), CRE/IRE (3), Indigenous Language (2).
 *
 * - Upper Primary (Grades 4–6, 35 mins/lesson):
 *   English (5), Mathematics (5), Kiswahili (4), Science and Technology (4),
 *   Agriculture and Nutrition (4), Creative Arts (6), Social Studies (3), CRE/IRE (3).
 *
 * - Junior Secondary (Grades 7–9, 40 mins/lesson):
 *   Mathematics (5), Integrated Science (5), English (5);
 *   All other learning areas (Kiswahili, Agriculture & Nutrition, Social Studies,
 *   Pre-Technical Studies, Creative Arts & Sports, CRE, IRE) = 4 lessons/week.
 *
 * - Senior School (Grades 10–12, 40 mins/lesson):
 *   Mathematics (Core Mathematics = 5), Sciences (Biology, Chemistry, Physics = 5), English (5);
 *   All other learning areas = 4 lessons/week.
 */
export function getCurriculumAllocation(grade, subject) {
  const s = String(subject || '').toLowerCase();

  // Lower Primary: Grades 1 - 3 (30 minutes per lesson)
  if (grade <= 3) {
    let lessonsPerWeek = 4;
    if (s.includes('math') || s.includes('english')) {
      lessonsPerWeek = 5;
    } else if (s.includes('creative')) {
      lessonsPerWeek = 7;
    } else if (s.includes('kiswahili') || s.includes('environmental')) {
      lessonsPerWeek = 4;
    } else if (s.includes('religious') || s.includes('cre') || s.includes('ire')) {
      lessonsPerWeek = 3;
    } else if (s.includes('indigenous')) {
      lessonsPerWeek = 2;
    }
    return {
      lessonsPerWeek,
      minutesPerLesson: 30,
      stepTimings: { intro: 5, step1: 8, step2: 12, conclusion: 5 },
    };
  }

  // Upper Primary: Grades 4 - 6 (35 minutes per lesson)
  if (grade <= 6) {
    let lessonsPerWeek = 4;
    if (s.includes('math') || s.includes('english')) {
      lessonsPerWeek = 5;
    } else if (s.includes('creative')) {
      lessonsPerWeek = 6;
    } else if (s.includes('kiswahili') || s.includes('science') || s.includes('agriculture')) {
      lessonsPerWeek = 4;
    } else if (s.includes('social') || s.includes('religious') || s.includes('cre') || s.includes('ire')) {
      lessonsPerWeek = 3;
    }
    return {
      lessonsPerWeek,
      minutesPerLesson: 35,
      stepTimings: { intro: 5, step1: 10, step2: 14, conclusion: 6 },
    };
  }

  // From Grade 7 onwards (Grades 7 - 12, 40 minutes per lesson):
  // Maths, Science (Integrated Science, Biology, Chemistry, Physics) & English = 5 lessons/week;
  // All other subjects = 4 lessons/week.
  const isFiveLessonCore =
    s.includes('math') ||
    s.includes('english') ||
    s.includes('integrated science') ||
    s === 'science' ||
    s.includes('biology') ||
    s.includes('chemistry') ||
    s.includes('physics');

  const lessonsPerWeek = isFiveLessonCore ? 5 : 4;
  return {
    lessonsPerWeek,
    minutesPerLesson: 40,
    stepTimings: { intro: 5, step1: 12, step2: 16, conclusion: 7 },
  };
}

/**
 * Official MoE Kenya School Term Week Calendar
 * - Term 1: 13 Weeks (Weeks 1–7 Teaching, Week 8 Mid-Term Assessment & Break, Weeks 9–12 Teaching, Week 13 End-Term Exams & Closing)
 * - Term 2: 14 Weeks (Weeks 1–7 Teaching, Week 8 Mid-Term Assessment & Break, Weeks 9–13 Teaching, Week 14 End-Term Exams & Closing)
 * - Term 3: 9 Weeks  (Weeks 1–7 Teaching, Week 8 Revision & Practical Assessment, Week 9 End-Year Summative Assessment & Closing)
 */
export function getTermWeeksConfig(term) {
  if (term === 2) {
    return {
      totalWeeks: 14,
      midTermWeek: 8,
      revisionWeek: null,
      endTermWeek: 14,
      teachingWeeks: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13],
    };
  }
  if (term === 3) {
    return {
      totalWeeks: 9,
      midTermWeek: null,
      revisionWeek: 8,
      endTermWeek: 9,
      teachingWeeks: [1, 2, 3, 4, 5, 6, 7],
    };
  }
  return {
    totalWeeks: 13,
    midTermWeek: 8,
    revisionWeek: null,
    endTermWeek: 13,
    teachingWeeks: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
  };
}

