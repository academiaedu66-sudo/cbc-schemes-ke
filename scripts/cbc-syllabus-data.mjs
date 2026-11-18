// Official KICD Rationalized CBC Curriculum Syllabus & Orange Book Course Materials Map (Grades 1 to 12)
// Verified against KICD Approved CBC Course Materials (https://kicd.ac.ke/cbc-materials/approved-cbc-course-materials/):
// 1. Addendum to Orange Book (PP1, PP2 & Grades 1-9)
// 2. Approved Grade 10 Senior School Course Books (Pathways)
// 3. Approved Grade 11/12 Senior School Course Books (Pathways)

export const APPROVED_PUBLISHERS = [
  'Kenya Literature Bureau (KLB)',
  'Oxford University Press (EA)',
  'Longhorn Publishers',
  'Mentor Publishing',
  'Moran (EA) Publishers',
  'Spotlight Publishers (EA)',
];

export const JSS_SENIOR_PUBLISHERS = [
  'Kenya Literature Bureau (KLB)',
  'Oxford University Press (EA)',
  'Longhorn Publishers',
  'Mentor Publishing',
  'Moran (EA) Publishers',
  'Spotlight Publishers (EA)',
  'East African Educational Publishers (EAEP)',
];

/**
 * Exact KICD Orange Book Approved Coursebooks per Grade Band & Learning Area.
 * Titles, publishers, and authors match KICD's official approved lists verbatim.
 */
export const KICD_APPROVED_COURSEBOOKS = {
  // ================= PRE-PRIMARY (PP1 & PP2 — KICD ORANGE BOOK ADDENDUM) =================
  preprimary: {
    'Language Activities': [
      {
        series: 'Mentor Language Activities',
        publisher: 'Mentor Publishing',
        authors: "F. Namu, M. Githendu, V. Ochieng' & Justine Sandra Ochieng'",
      },
      {
        series: 'StoryMoja Smart Beginners Language Activities',
        publisher: 'StoryMoja Publishers',
        authors: 'Winnie Biwott, Elizabeth Githirwa, Vane Onduko & Joyce Kalipso',
      },
      {
        series: 'First Steps Language Activities',
        publisher: 'Moran (EA) Publishers',
        authors: 'Diane Omondi',
      },
      {
        series: 'Spotlight Language Activities',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Violet Onzere, Bennadatte Makatiani & Hamida Ahmed Mohamed',
      },
      {
        series: 'KLB Skillgrow Language Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Gladwell Wambiri, Mercy Akinyi, Osore Shughuli & Alice Kairichi',
      },
      {
        series: 'Made Familiar Language Activities',
        publisher: 'Starshine Student Centre',
        authors: 'M. Cheruiyot & Starshine Student Centre',
      },
      {
        series: 'Distinction Language Activities',
        publisher: 'Distinction Educational Publishers',
        authors: "Catherine Wambui, Michael Otundo & Otundo Morang'a",
      },
      {
        series: 'Longhorn Language Activities',
        publisher: 'Longhorn Publishers',
        authors: 'Alice Salama Kairichi, Jane Wayumba & Juliana Awuor Olango',
      },
    ],
    'Mathematical Activities': [
      {
        series: 'KLB Skillgrow Mathematical Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Jane Mbugua, Pamela Chepkosgei, Margaret Odawo & Daniel Rop',
      },
      {
        series: 'Mentor Mathematical Activities',
        publisher: 'Mentor Publishing',
        authors: 'E. Nderitu, R. Akoo & N. Gathogo',
      },
      {
        series: 'First Steps Mathematical Activities',
        publisher: 'Moran (EA) Publishers',
        authors: 'Pritchard Moth & Victor Ezra',
      },
      {
        series: 'Made Familiar Mathematical Activities',
        publisher: 'Starshine Student Centre',
        authors: 'Starshine Student Centre Publishers',
      },
      {
        series: 'Longhorn Mathematical Activities',
        publisher: 'Longhorn Publishers',
        authors: 'Domnick Ochieng & Philip Opiyo Omanyo',
      },
      {
        series: 'Distinction Mathematical Activities',
        publisher: 'Distinction Educational Publishers',
        authors: 'Michael Otundo & Catherine Wambui',
      },
      {
        series: 'Queenex Early Learners Mathematical Activities',
        publisher: 'Queenex Publishers',
        authors: 'Nancy Chege & James Njuguna',
      },
    ],
    'Environmental Activities': [
      {
        series: 'KLB Skillgrow Environmental Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Maurice Saka, Dorcas Mwangi, Musungu Mugoba & Charles Mwaniki',
      },
      {
        series: 'Mentor Environmental Activities',
        publisher: 'Mentor Publishing',
        authors: 'J. N. Gathogo',
      },
      {
        series: 'First Steps Environmental Activities',
        publisher: 'Moran (EA) Publishers',
        authors: 'Diane Omondi',
      },
      {
        series: 'Distinction Environmental Activities',
        publisher: 'Distinction Educational Publishers',
        authors: 'Michael Otundo & Wambui Gichini',
      },
      {
        series: 'Made Familiar Environmental Activities',
        publisher: 'Starshine Student Centre',
        authors: 'Naburi Bennadatte, Mirriam Omollo & Patricia Chemos',
      },
      {
        series: 'Longhorn Environmental Activities',
        publisher: 'Longhorn Publishers',
        authors: 'Longhorn Pre-Primary Panel',
      },
    ],
    'Creative Activities': [
      {
        series: 'Know More Creative Activities',
        publisher: 'StoryMoja Publishers',
        authors: 'Mildred Ashikholwa & Wanjiku J. Kiritu',
      },
      {
        series: 'Mentor Creative Activities',
        publisher: 'Mentor Publishing',
        authors: 'Justine S. Ochieng & Effie Akinyi',
      },
      {
        series: 'First Steps Creative Activities',
        publisher: 'Moran (EA) Publishers',
        authors: 'Delphine Amimo & Catherine Machuma',
      },
      {
        series: 'Made Familiar Creative Activities',
        publisher: 'Starshine Student Centre',
        authors: 'Starshine Student Centre',
      },
      {
        series: 'Queenex Early Learners Creative Activities',
        publisher: 'Queenex Publishers',
        authors: 'Hamida Mohammed & Phineas Mutuma',
      },
      {
        series: 'Distinction Creative Activities',
        publisher: 'Distinction Educational Publishers',
        authors: 'Pauline Salvatore & Dinah Alukwe',
      },
    ],
    'Christian Religious Education (CRE)': [
      {
        series: 'KLB Skillgrow Christian Religious Education Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Duke Ondieki, Joyce Obara, Ashford Mwongela & Abijah Nyaga',
      },
      {
        series: 'Mentor Christian Religious Education Activities',
        publisher: 'Mentor Publishing',
        authors: 'J. N. Gathogo',
      },
      {
        series: 'Longhorn CRE Activities',
        publisher: 'Longhorn Publishers',
        authors: 'Mary Mwaniki, Agnes Ndungu & Winfred Wanja',
      },
      {
        series: 'First Steps Christian Religious Education Activities',
        publisher: 'Moran (EA) Publishers',
        authors: 'Clementine Muoti',
      },
      {
        series: 'StoryMoja Smart Beginners CRE Activities',
        publisher: 'StoryMoja Publishers',
        authors: 'Chrismas Moi & Vivian Adori',
      },
    ],
    'Islamic Religious Education (IRE)': [
      {
        series: 'Atfaal IRE',
        publisher: 'Atfaal Publishers',
        authors: 'F. Shariff',
      },
      {
        series: 'Spotlight Islamic Religious Education Activities',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Salim Ali Mohamed, Ahmed Ibrahim, Bilqiss Ali & Said Omar Hinga',
      },
    ],
  },

  // ================= LOWER PRIMARY (GRADES 1 - 3) =================
  lower: {
    'Mathematical Activities': [
      {
        series: 'KLB Visionary Mathematical Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Israel Owiti, Francis Mwangi, Samuel Irumbi & Washington Mbiruru',
      },
      {
        series: "Oxford Let's Do Mathematical Activities",
        publisher: 'Oxford University Press (EA)',
        authors: "Catherine Kiyiapi, Martin Ng'ang'a & Maurice Aketch",
      },
      {
        series: 'Longhorn Mathematical Activities',
        publisher: 'Longhorn Publishers',
        authors: "Leonard King'oo, Philip Obwoge & Kefa Masita",
      },
      {
        series: 'Mentor Mathematical Activities',
        publisher: 'Mentor Publishing',
        authors: 'Josephine Njehuri & Harriet Kitonyo',
      },
      {
        series: 'Spotlight Mathematics Activities',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Alice Njeru & Boniface Tinega',
      },
    ],
    'English Language Activities': [
      {
        series: 'Oxford New Progressive Primary English Language Activities',
        publisher: 'Oxford University Press (EA)',
        authors: 'Leah Kariuki, Elizabeth Ndua & Evans Sore',
      },
      {
        series: 'KLB Visionary English Language Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Gatitu Kiguru, Phyllis Mwangi & Charles Gecaga',
      },
      {
        series: 'Longhorn English Language Activities',
        publisher: 'Longhorn Publishers',
        authors: 'Tom Olang, Naomi Kanyiri & Ezekiel Wangusi',
      },
      {
        series: 'Skills in English Language Activities',
        publisher: 'Moran (EA) Publishers',
        authors: 'Diane Omondi, Joseph Ndirangu & Ruth K. Munyi',
      },
      {
        series: 'Spotlight English Language Activities',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Stephen Adhoch & Zipporah Wambua',
      },
    ],
    'Kiswahili Language Activities': [
      {
        series: 'Oxford Kiswahili Dadisi Mazoezi ya Lugha',
        publisher: 'Oxford University Press (EA)',
        authors: 'Jackline Ndege, Pauline Kea & Zephaniah Mucheria',
        isKiswahili: true,
      },
      {
        series: 'KLB Visionary Mazoezi ya Kiswahili',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Mutahi Miricho, Atibu Bakari & Pauline Kea',
        isKiswahili: true,
      },
      {
        series: 'Longhorn Mwanga wa Kiswahili Mazoezi ya Lugha',
        publisher: 'Longhorn Publishers',
        authors: 'Wallah bin Wallah, John Kobia & Hellen Kangai',
        isKiswahili: true,
      },
      {
        series: 'Kurunzi ya Kiswahili Mazoezi ya Lugha',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Assumpta K. Matei & Joseph Mwamburi',
        isKiswahili: true,
      },
      {
        series: 'Kielekezi cha Kiswahili Mazoezi ya Lugha',
        publisher: 'Mentor Publishing',
        authors: 'Sam Washika, Ken Chituyi & Norah Musyimi',
        isKiswahili: true,
      },
    ],
    'Indigenous Language Activities': [
      {
        series: 'KLB Visionary Indigenous Language Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'KLB Indigenous Languages Curriculum Panel',
      },
      {
        series: 'StoryMoja Know More Indigenous Language Activities',
        publisher: 'StoryMoja Publishers',
        authors: 'StoryMoja Mother-Tongue Literacy Panel',
      },
      {
        series: 'Moran Indigenous Language Activities',
        publisher: 'Moran (EA) Publishers',
        authors: 'Moran Indigenous Languages Panel',
      },
    ],
    'Environmental Activities': [
      {
        series: 'Oxford Our Lives Today Environmental Activities',
        publisher: 'Oxford University Press (EA)',
        authors: 'Maryclaire Indire, Cephas Kamau & Nancy Kihwaga',
      },
      {
        series: 'KLB Visionary Environmental Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Maurice Saka, Agumba Ndaloh & Joseph Waliaula',
      },
      {
        series: 'Our World Environmental Activities',
        publisher: 'Moran (EA) Publishers',
        authors: "Ferdinanda Gachang'i & Andrew Simolo",
      },
      {
        series: 'Mentor Environmental Activities',
        publisher: 'Mentor Publishing',
        authors: 'Emma Omenda & Dickson Njue',
      },
    ],
    'Creative Activities': [
      {
        series: 'KLB Visionary Creative Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Okemba Lore, Kevin Kimtai & Peter Wanjihia',
      },
      {
        series: 'Hummingbird Creative Activities',
        publisher: 'Hummingbird Publishers',
        authors: 'Catherine Simiyu & Naftali Korir',
      },
      {
        series: 'Beginning Creative Activities',
        publisher: 'Moran (EA) Publishers',
        authors: 'Evans Asol, Delphine Amimo & Paul Maina',
      },
      {
        series: 'Mentor Creative Activities',
        publisher: 'Mentor Publishing',
        authors: 'Dorcas Wachera & Phinius Mutuma',
      },
    ],
    'Christian Religious Education (CRE)': [
      {
        series: 'KLB Visionary CRE Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Philomena Mwaura, Shiphrah Gichaga & Elvira Shitohi',
      },
      {
        series: 'Oxford Growing in Christ CRE Activities',
        publisher: 'Oxford University Press (EA)',
        authors: 'Hezron Onyango, Jesse Watiki & Denis Rutere',
      },
      {
        series: 'Our Faith Christian Religious Education Activities',
        publisher: 'Moran (EA) Publishers',
        authors: 'Patrick Tumusiime & Mercy Githae',
      },
      {
        series: 'Mentor CRE Activities',
        publisher: 'Mentor Publishing',
        authors: 'J. N. Gathogo & Caroline Kiini',
      },
    ],
    'Islamic Religious Education (IRE)': [
      {
        series: 'KLB Visionary Islamic Religious Education Activities',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Idris Matsukhu Makokha & Mariam Omar',
      },
      {
        series: 'Atfaal IRE Activities',
        publisher: 'Atfaal Publishers',
        authors: 'F. Shariff & Ramadhan Lihanda',
      },
      {
        series: 'Spotlight Islamic Religious Education Activities',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Salim Ali Mohamed & Fatuma Mwatamu',
      },
    ],
  },

  // ================= UPPER PRIMARY (GRADES 4 - 6) =================
  upper: {
    Mathematics: [
      {
        series: 'KLB Visionary Mathematics',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Samuel G. Irumbi, Obadiah Kiburi & Francis Mwangi',
      },
      {
        series: "Oxford Let's Do Mathematics",
        publisher: 'Oxford University Press (EA)',
        authors: "Catherine Kiyiapi, Martin Ng'ang'a & Maurice Aketch",
      },
      {
        series: 'Longhorn Mathematics',
        publisher: 'Longhorn Publishers',
        authors: "Cornelius Machuki, Leonard King'oo & Phillip Obwoge",
      },
      {
        series: 'Mentor Mathematics',
        publisher: 'Mentor Publishing',
        authors: 'Josephine Njehuri & Harriet Kitonyo',
      },
      {
        series: 'Super Minds Mathematics',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Beatrice Mwendo & Josephat Wambua',
      },
    ],
    English: [
      {
        series: 'Oxford New Progressive Primary English',
        publisher: 'Oxford University Press (EA)',
        authors: 'Elizabeth Ndua, Evans Sore & Leah Kariuki',
      },
      {
        series: 'KLB Visionary English',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Gatitu Kiguru, Phyllis Mwangi & Charles Gecaga',
      },
      {
        series: 'Longhorn English',
        publisher: 'Longhorn Publishers',
        authors: 'Naomi Kanyiri & Ezekiel Wangusi',
      },
      {
        series: 'Skills in English',
        publisher: 'Moran (EA) Publishers',
        authors: 'Diane Omondi & Joseph Ndirangu',
      },
      {
        series: 'SuperMinds English',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Joseph Maina & Catherine Njuguna',
      },
    ],
    Kiswahili: [
      {
        series: 'Oxford Kiswahili Dadisi',
        publisher: 'Oxford University Press (EA)',
        authors: 'Jackline Ndege, Pauline Kea, Evans Osoro & Zephania Mucheria',
        isKiswahili: true,
      },
      {
        series: 'Longhorn Mwanga wa Kiswahili',
        publisher: 'Longhorn Publishers',
        authors: 'John Kobia, Hellen Kangai & Kenan Ngere',
        isKiswahili: true,
      },
      {
        series: 'KLB Visionary Kiswahili',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Mutahi Miricho & Atibu Bakari',
        isKiswahili: true,
      },
      {
        series: 'Kurunzi ya Kiswahili',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Assumpta K. Matei & Joseph Mwamburi',
        isKiswahili: true,
      },
      {
        series: 'Kielekezi cha Kiswahili',
        publisher: 'Mentor Publishing',
        authors: 'Ken Chituyi, Norah Musyimi & Sam Washika',
        isKiswahili: true,
      },
    ],
    'Science and Technology': [
      {
        series: 'KLB Visionary Science and Technology',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Franco Munene Njeru, Alex Kihugu & Pauline Wainaina',
      },
      {
        series: 'Oxford Everyday Science and Technology',
        publisher: 'Oxford University Press (EA)',
        authors: 'Patrick Mumo, Jacob Odhiambo & Wycliffe Nyapera',
      },
      {
        series: 'Longhorn Science and Technology',
        publisher: 'Longhorn Publishers',
        authors: "Erick Owino & Antoney Ochieng'",
      },
      {
        series: 'Spotlight Science and Technology',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Jacob Asenje, Paschal Wasonga & Daniel Arapai',
      },
      {
        series: 'Super Minds Science and Technology',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Jared K. Charana & Wycliff Ogembo',
      },
    ],
    'Agriculture and Nutrition': [
      {
        series: 'KLB Visionary Agriculture',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Anne K. Wachira, Tom Orwa & Lucy Nyamu',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized Agriculture & Nutrition',
      },
      {
        series: 'Oxford Modern Agriculture',
        publisher: 'Oxford University Press (EA)',
        authors: 'Steward Anyona, Charles Wachira & Joan Owiye',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized Agriculture & Nutrition',
      },
      {
        series: 'Mentor Agriculture',
        publisher: 'Mentor Publishing',
        authors: 'A. Wesonga, Dr. Josephine Opondo & Jane Thungu',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized Agriculture & Nutrition',
      },
      {
        series: 'Healthy Planet Agriculture',
        publisher: 'One Planet Publishing',
        authors: 'Daniel Kemei & Peter Sigei',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized Agriculture & Nutrition',
      },
      {
        series: 'MTP Agriculture',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Mountain Top Agriculture & Nutrition Panel',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized Agriculture & Nutrition',
      },
    ],
    'Social Studies': [
      {
        series: 'Oxford Our Lives Today Social Studies',
        publisher: 'Oxford University Press (EA)',
        authors: 'Cephas Kamau, Maryclaire Indire & Said Farah',
      },
      {
        series: 'KLB Visionary Social Studies',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Joseph Waliaula, Maurice Saka & Agumba Ndalo',
      },
      {
        series: 'Our World Social Studies',
        publisher: 'Moran (EA) Publishers',
        authors: "Andrew Simolo & Ferdinanda Gachang'i",
      },
      {
        series: 'Spotlight Social Studies',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Ezekiel Mudi & Wilson Sirengo',
      },
      {
        series: 'Mentor Social Studies',
        publisher: 'Mentor Publishing',
        authors: 'Dickson Njue & Evans Waweru',
      },
    ],
    'Creative Arts': [
      {
        series: 'KLB Visionary Creative Arts',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Esther Muchiri, Marsyden Matsigulu & Ruth Kahiga',
      },
      {
        series: 'Mentor Creative Arts',
        publisher: 'Mentor Publishing',
        authors: "Anne Ndung'u, Clement Mugambi & Dorcas Wacera",
      },
      {
        series: 'Spotlight Creative Arts',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Fredrick Onaka, Hudson Munayi & Sisto Chege',
      },
      {
        series: 'Hummingbird Creative Arts',
        publisher: 'Hummingbird Publishers',
        authors: 'Catherine Simiyu & Naftali Korir',
      },
    ],
    'Christian Religious Education (CRE)': [
      {
        series: 'KLB Visionary CRE',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Philomena Mwaura, Elvira Shitohi & Shiphrah Gichaga',
      },
      {
        series: 'Oxford Growing in Christ CRE',
        publisher: 'Oxford University Press (EA)',
        authors: 'Hezron Onyango, Jesse Watiki & Denis Rutere',
      },
      {
        series: 'Knowing God CRE',
        publisher: 'One Planet Publishing',
        authors: 'Shirley Kokonya & James Mugendi',
      },
      {
        series: 'Mentor CRE',
        publisher: 'Mentor Publishing',
        authors: 'Caroline Kiini & James Njehuri',
      },
    ],
    'Islamic Religious Education (IRE)': [
      {
        series: 'KLB Visionary IRE',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Idris Matsukhu Makokha & Mwanaidi Lyani Omar',
      },
      {
        series: 'Oxford New Beginning IRE',
        publisher: 'Oxford University Press (EA)',
        authors: 'Mohamed Mraja, Dhulfa Gongo & Abdi Adan',
      },
      {
        series: 'Atfaal IRE',
        publisher: 'Atfaal Publishers',
        authors: 'F. Shariff & Ramadhan Lihanda',
      },
    ],
  },

  // ================= JUNIOR SECONDARY (GRADES 7 - 9) =================
  jss: {
    Mathematics: [
      {
        series: 'KLB Top Scholar Mathematics',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Vincent Odhiambo, Zipporah Muli, Jane Mbugua & Wycliffe Ogembo',
      },
      {
        series: 'Oxford Active Mathematics',
        publisher: 'Oxford University Press (EA)',
        authors: "Catherine Kiyiapi, Martin Ng'ang'a & Maurice Aketch",
      },
      {
        series: 'Mentor Mathematics',
        publisher: 'Mentor Publishing',
        authors: "Dr. Donata Odago, Alex Odhong' & Josephine Njehuri",
      },
      {
        series: 'Longhorn Mathematics',
        publisher: 'Longhorn Publishers',
        authors: "Leonard King'oo, Philip Obwoge & Kefa Masita",
      },
      {
        series: 'Smart Minds Mathematics',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Beatrice Mwendo & Josephat Wambua',
      },
    ],
    English: [
      {
        series: 'Oxford Head Start English',
        publisher: 'Oxford University Press (EA)',
        authors: 'Angelina Kioko, Benedict Mutei, Leah Kariuki & Shikuku Shitubi',
      },
      {
        series: 'KLB Top Scholar English',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Phyllis Mwangi, Gatitu Kiguru & Charles Maina Gecaga',
      },
      {
        series: 'Skills in English',
        publisher: 'Moran (EA) Publishers',
        authors: 'Diane Omondi, Joseph Ndirangu & Mark Chetambe',
      },
      {
        series: 'Smart Minds English',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Joseph Maina, Catherine Njuguna & Oroni Tendera',
      },
      {
        series: 'Mentor English',
        publisher: 'Mentor Publishing',
        authors: 'Martha Mbuvi & Monicah Onyancha',
      },
    ],
    Kiswahili: [
      {
        series: 'Oxford Kiswahili Fasaha',
        publisher: 'Oxford University Press (EA)',
        authors: 'Ahmed Shikuku, Alfaxard Chokera, Evans Osoro & Ruth Omache',
        isKiswahili: true,
      },
      {
        series: 'KLB Top Scholar Kiswahili',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Mutahi Miricho, Pauline Kea & David Maina Kamau',
        isKiswahili: true,
      },
      {
        series: 'Longhorn Mwanga wa Kiswahili',
        publisher: 'Longhorn Publishers',
        authors: 'John Kobia, Jane Maina & Tobbie Wekesa',
        isKiswahili: true,
      },
      {
        series: 'Kielekezi cha Kiswahili',
        publisher: 'Mentor Publishing',
        authors: 'Christopher Lubanga, Ken Chituyi & Sam Washika',
        isKiswahili: true,
      },
      {
        series: 'Kurunzi ya Kiswahili',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Assumpta K. Matei & Joseph Mwamburi',
        isKiswahili: true,
      },
    ],
    'Integrated Science': [
      {
        series: 'KLB Top Scholar Integrated Science',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Geoffrey Mbaluto, Magdaline Aludo & Alex Kihugu',
      },
      {
        series: 'Oxford Active Integrated Science',
        publisher: 'Oxford University Press (EA)',
        authors: 'Dickson Mugendi, Zedekiah Okwany & Jacob Odhiambo',
      },
      {
        series: 'Mentor Integrated Science',
        publisher: 'Mentor Publishing',
        authors: 'Charles Kogi, Eunice Odago & J. N. Gathogo',
      },
      {
        series: 'Spotlight Integrated Science',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Kellen Ngigi, Jacob Asenje & Mathew Opiyo',
      },
      {
        series: 'MTP Integrated Science',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Franco Munene Njeru & Dr. Everlyne Chitechi Wemali',
      },
    ],
    'Agriculture and Nutrition': [
      {
        series: 'KLB Top Scholar Agriculture',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Anne K. Wachira, Daniel N. Gitahi & Tom Orwa',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized JSS Agriculture & Nutrition',
      },
      {
        series: 'Oxford Agriculture Today',
        publisher: 'Oxford University Press (EA)',
        authors: 'Steward Anyona, Damaris Wambua & Mariam Karabu',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized JSS Agriculture & Nutrition',
      },
      {
        series: 'Mentor Agriculture',
        publisher: 'Mentor Publishing',
        authors: 'George Waweru, Dr. Josephine Opondo & Jane Thungu',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized JSS Agriculture & Nutrition',
      },
      {
        series: 'Healthy Planet Agriculture',
        publisher: 'One Planet Publishing',
        authors: 'Daniel Kemei, Peter Sigei & Erick Oyaro',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized JSS Agriculture & Nutrition',
      },
      {
        series: 'MTP Agriculture',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Philip Ngunyu & MTP Agriculture Panel',
        note: 'KICD Orange Book Addendum Approved Coursebook for Rationalized JSS Agriculture & Nutrition',
      },
    ],
    'Social Studies': [
      {
        series: 'KLB Top Scholar Social Studies',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Assa Okoth, Agumba Ndaloh & Musungu Mugoha',
      },
      {
        series: 'Oxford Evolving World Social Studies',
        publisher: 'Oxford University Press (EA)',
        authors: 'Cephas Kamau, Maryclaire Indire & Nancy Kihwaga',
      },
      {
        series: 'Moran Social Studies',
        publisher: 'Moran (EA) Publishers',
        authors: "Ferdinanda Gachang'i & Andrew Simolo",
      },
      {
        series: 'Mentor Social Studies',
        publisher: 'Mentor Publishing',
        authors: 'Dickson Njue & Evans Waweru',
      },
      {
        series: 'Smart Minds Social Studies',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Simon Ndegwa Mungai & Chrispinus Tumbu',
      },
    ],
    'Pre-Technical Studies': [
      {
        series: 'KLB Top Scholar Pre-Technical Studies',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Omukaga Panyako & Petronila Mutwiwa',
      },
      {
        series: 'Oxford Pre-Technical Studies Today',
        publisher: 'Oxford University Press (EA)',
        authors: 'Simon Gichoru, Mary Nyaga, Ken Mbuvi & Patrick Otundo',
      },
      {
        series: 'Mentor Pre-Technical Studies',
        publisher: 'Mentor Publishing',
        authors: "Angela Bera, Claude Ochieng' & J. N. Gathogo",
      },
      {
        series: 'Longhorn Pre-Technical Studies',
        publisher: 'Longhorn Publishers',
        authors: 'Basil Ochieng & Aggrey Welashina',
      },
      {
        series: 'Spotlight Pre-Technical Studies',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Daniel Arapai, Joshua Wakhu & Francis Mayabi',
      },
    ],
    'Creative Arts and Sports': [
      {
        series: 'KLB Top Scholar Creative Arts and Sports',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Kariuki Kanogu, Marsyden Matsigulu & Peter Njihia',
      },
      {
        series: 'Hummingbird Creative Arts and Sports',
        publisher: 'Hummingbird Publishers',
        authors: 'Catherine Simiyu, Collins Owino & Naftali Korir',
      },
      {
        series: 'Mentor Creative Arts and Sports',
        publisher: 'Mentor Publishing',
        authors: "Ann Ndung'u, Clement Mugambi & Peter Mayienga",
      },
      {
        series: 'Moran Creative Arts and Sports',
        publisher: 'Moran (EA) Publishers',
        authors: 'Paul Maina, Evance Asol & Delphine Amimo',
      },
    ],
    'Christian Religious Education (CRE)': [
      {
        series: 'KLB Top Scholar CRE',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Philomena N. Mwaura, Shiprah N. Gichaga & Jane Ntaari',
      },
      {
        series: 'Oxford Alive CRE',
        publisher: 'Oxford University Press (EA)',
        authors: 'Hezron Onyango, Daniel Ndegwa Karanu & Jane Mbugua',
      },
      {
        series: 'Knowing God CRE',
        publisher: 'One Planet Publishing',
        authors: 'Shirley Kokonya & James Mugendi',
      },
      {
        series: 'Mentor CRE',
        publisher: 'Mentor Publishing',
        authors: 'J. N. Gathogo & Margaret Wanyonyi',
      },
    ],
    'Islamic Religious Education (IRE)': [
      {
        series: 'KLB Top Scholar IRE',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Idris Matsukhu Makokha, Mwanakombo Mlingo, Mohamud Muhumed & Fatuma Mwatuma',
      },
      {
        series: 'Atfaal IRE',
        publisher: 'Atfaal Publishers',
        authors: 'F. Shariff & Ramadhan Lihanda',
      },
    ],
    French: [
      {
        series: 'Longhorn Francais Premier Cycle Du Secondaire',
        publisher: 'Longhorn Publishers',
        authors: 'Mboni E. Aura, Maloba E. Nalala & Mainga P. Mayabi',
      },
      {
        series: "Triomphe Livre de l'eleve",
        publisher: 'Astute Investment Co. Ltd',
        authors: "Henrietta Ikambili, Okeno Tom Inyundo, Achieng' Amolo & Otieno Ochieng'",
      },
    ],
    Arabic: [
      {
        series: 'Atfaal Arabic',
        publisher: 'Atfaal Publishers',
        authors: 'Harun Abubakar & Ramadhan Lihanda',
      },
      {
        series: 'KLB Top Scholar Arabic',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Ahmed A. Ahmed, Abdullahi A. Mohamed & Mohamed A. Mohamed',
      },
    ],
  },

  // ================= SENIOR SCHOOL (GRADES 10 - 12 — KICD MARCH & OCTOBER 2026 APPROVED LISTS) =================
  senior: {
    'Core Mathematics': [
      {
        series: 'KLB Excelling Core Mathematics',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Vincent Odhiambo, Winfred Mutuku, Moses Maswai, James Omoke, Wicklif Ogembo & Ann Opiyo',
      },
      {
        series: 'Oxford Mathematics Today',
        publisher: 'Oxford University Press (EA)',
        authors: 'Alexander Kioko, Joy Mutonyi Butali, Raphael Otieno, Cyrus Mutua Wambua & Grace Gakii Mwenda',
      },
      {
        series: 'Mentor Core Mathematics',
        publisher: 'Mentor Publishing',
        authors: "Alex Odhong', Dr. Donata Odago, Dr. James Kioko, Ezekiel Thugu & Zachary Njoroge",
      },
      {
        series: 'Moran Core Mathematics',
        publisher: 'Moran (EA) Publishers',
        authors: 'Nickson Oshome, Maina Kiragu, Winnie Wanyingi, Mercy Ndirangu & Winnie Mutuku',
      },
      {
        series: 'Longhorn Advancing in Core Mathematics',
        publisher: 'Longhorn Publishers',
        authors: 'Milkah Manyala, Philip Obwage, Kefa Masita & Cornelius Machuki',
      },
      {
        series: 'Master Core Mathematics',
        publisher: 'Booklyst Publishers',
        authors: 'Kenneth Ongore & Jepkorir Scolar',
      },
      {
        series: 'Spotlight Core Mathematics',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Beverline Inonda & Beverlyne Makario',
      },
    ],
    'Essential Mathematics': [
      {
        series: 'Mentor Essential Mathematics',
        publisher: 'Mentor Publishing',
        authors: "Alex Odhong', Dr. Donata Odago, Ezekiel Thugu, Zachary Njoroge, Paul Abuga & Peter Chege",
      },
      {
        series: 'Oxford Essential Mathematics Today',
        publisher: 'Oxford University Press (EA)',
        authors: 'Alexander Kioko, Joy Mutonyi Butali, Raphael Otieno, Cyrus Mutua Wambua & Grace Gakii Mwenda',
      },
      {
        series: 'KLB Excelling Essential Mathematics',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Prof. Winfred Mutuku, Vincent Odhiambo, Jane Mbugua, Moses Maswai & W. Magak',
      },
      {
        series: 'Moran Essential Mathematics',
        publisher: 'Moran (EA) Publishers',
        authors: 'Nickson Oshome, Maina Kiragu, Winnie Wanyingi, Mercy Ndirangu & Winnie Mutuku',
      },
      {
        series: 'Longhorn Advancing in Essential Mathematics',
        publisher: 'Longhorn Publishers',
        authors: 'Longhorn Senior School Mathematics Panel',
      },
      {
        series: 'Master Essential Mathematics',
        publisher: 'Booklyst Publishers',
        authors: 'Kenneth Ongore & Jepkorir Scolar',
      },
      {
        series: 'Smart Minds Essential Mathematics',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: "Anthony Ochieng', Francis Njuguna, Cyrus O. Miyaba & Beryl Akinyi",
      },
    ],
    English: [
      {
        series: 'KLB Excelling in English',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Phyllis Mwangi, Gatitu Kiguru, Charles Maina Gecaga, James Muchiri Mukunga & Anna Kula',
      },
      {
        series: 'Moran Skills in English',
        publisher: 'Moran (EA) Publishers',
        authors: 'Diane Omondi, Joseph Ndirangu, Mark Chetambe, Kenneth Ngure & Judith Onywany',
      },
      {
        series: 'Oxford Head Start English',
        publisher: 'Oxford University Press (EA)',
        authors: 'Angelina Kioko, Eunice Kamanthe, David Amayo & John Wangwe',
      },
      {
        series: 'Mentor English',
        publisher: 'Mentor Publishing',
        authors: 'Carolyne Okemwa, John Samuel Auna, Martha Mbuvi, Monicah Onyancha & Nicholyne O. Odiero',
      },
      {
        series: 'Longhorn Advancing in English',
        publisher: 'Longhorn Publishers',
        authors: "Joab Tabakori, Elizabeth Odhiambo, Catherine Ng'ang'a & Samuel Kuria",
      },
      {
        series: 'Spotlight English',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Lucy Kamau, Ezekiel Wangusi, Stephen Adhoch & Zipporah Wambua',
      },
    ],
    'Literature in English': [
      {
        series: 'Oxford Head Start Written Literature',
        publisher: 'Oxford University Press (EA)',
        authors: 'Frederick Shitubi, Judith Munyiri & Judith Ongweno',
        note: 'Approved Set Texts: Dreams Denied (James Karuga), Echoes of the Heartland (Pamela Kinanu), The Bride (Austin Bukenya), A Cowrie of Hope (Binwell Sinyangwe), The Master Builder (Henrik Ibsen), Nina (Argwings Otieno)',
      },
      {
        series: 'Moran Oral Literature for Senior School',
        publisher: 'Moran (EA) Publishers',
        authors: 'Mark Chetambe, Judith Onywany & Mukoya Mwairumba',
        note: 'Approved Anthologies & Poetry: Unchained and Other Poems (Mugo Muhia), The Necklace and Other Stories (Oscar Macharia & Joseph Wangila), Senior School Poetry Companion (Charles Kebaya & Macharia Mwangi)',
      },
      {
        series: 'Skilit Reference Book on Written Literature',
        publisher: 'Skilit Publishers',
        authors: 'Makenji Patrick Mukala & David Ayieko',
      },
      {
        series: 'Master Poetry Textbook',
        publisher: 'Booklyst Publishers',
        authors: 'Abigail Kinya, Lucas Wafula & Otunga Oloo',
      },
    ],
    Kiswahili: [
      {
        series: 'Oxford Kiswahili Fasaha',
        publisher: 'Oxford University Press (EA)',
        authors: 'Ruth Moraa Omache, Ali Hamisi Chembea, Enos Barasa Wafula & Leonard Chacha Mwita',
        isKiswahili: true,
      },
      {
        series: 'Moran Kiswahili Chanana',
        publisher: 'Moran (EA) Publishers',
        authors: "Boniface Ngugi, Evans Makhulo, Augustine Ochanji & Mary Ndung'u",
        isKiswahili: true,
      },
      {
        series: 'Longhorn Chemchemi za Kiswahili',
        publisher: 'Longhorn Publishers',
        authors: 'Kenan O. Ngere, Tobbie Wekesa, Nicholas Opere & Jane Maina',
        isKiswahili: true,
      },
      {
        series: 'Kielekezi cha Kiswahili',
        publisher: 'Mentor Publishing',
        authors: 'Christopher Lubanga, Moses Owino, Patrick Kamithi & Sam Washika',
        isKiswahili: true,
      },
      {
        series: 'Mbiu ya Kiswahili',
        publisher: 'One Planet Publishing',
        authors: 'John M. Kobia, Eunice Erina Nangira, Zipporah N. Rori & Njeru Kinoti M.',
        isKiswahili: true,
      },
      {
        series: 'Akili Pevu Kiswahili',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Mziwanda Banda, Mosol Kandagor, Nixon Sangili, Denis Mafura & Dan Bobea',
        isKiswahili: true,
      },
    ],
    'Fasihi ya Kiswahili': [
      {
        series: 'Oxford Fani ya Fasihi Simulizi na Marejeleo ya Fasihi Andishi',
        publisher: 'Oxford University Press (EA)',
        authors: 'Assumpta K. Matei, Regina Gicheru & Harrison Bahati Wabwire',
        isKiswahili: true,
        note: 'Vitabu Teule Vilivyoidhinishwa: Fumbo la Baba (Kenna Wasike), Mlemavu? Sio Mimi (Godfrey Ipalei), Narudi Nyumbani (Mziwanda Banda), Wema na Wawi (Mwenda Mbatiah), Kasri la Faraja (Bernard Ogutu), Kivuli Kilichopinda (Jeff Mandila), Sauti ya Kimya (K. W. Wamitila), Ahadi ya Neema (Assumpta K. Matei)',
      },
      {
        series: 'Msingi wa Fasihi Andishi na Ushairi',
        publisher: 'Newton Educational Resources',
        authors: 'Assumpta K. Matei, Isaiah Mweteri, Hamisi Babusa & Evans Osoro',
        isKiswahili: true,
        note: 'Vitabu Teule: Mwisho wa Dhiki (Paul Nganga Mutua), Binti ya Waziri (Nicholas Ogol), Wasifu wa Mekatilili wa Menza (Hamisi Babusa)',
      },
      {
        series: 'Dira ya Fasihi Andishi',
        publisher: 'Access Publishers',
        authors: 'Titus M. Kaui, Pamela Ngugi & Joseph Maitaria',
        isKiswahili: true,
      },
    ],
    'Community Service Learning (CSL)': [
      {
        series: 'Oxford Essential Community Service Learning (CSL)',
        publisher: 'Oxford University Press (EA)',
        authors: 'Paul Wafula, Christine Mutua, Mildred Onyango, Hannah Njenga & Arthur Nzau',
      },
      {
        series: 'KLB Excelling Community Service Learning',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Maurice Saka, David Musungu, Florence Kamaitha, Agumba Ndalo & Misigo Lushya',
      },
      {
        series: 'Moran Community Service Learning',
        publisher: 'Moran (EA) Publishers',
        authors: 'Elizabeth Mutisya & Kefa Simwa',
      },
      {
        series: 'Longhorn Pioneer Community Service Learning',
        publisher: 'Longhorn Publishers',
        authors: 'Longhorn Publishers PLC',
      },
      {
        series: 'MTP Community Service Learning',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Mountain Top Educational Publishers Ltd',
      },
    ],
    Biology: [
      {
        series: 'KLB Excelling Biology',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Kaluli Nengo, Rosebella Jerotich, Everlyne Chitechi, Nancy Toroitich & Samson Ochar',
      },
      {
        series: 'Oxford Biology Today',
        publisher: 'Oxford University Press (EA)',
        authors: 'Fredrick Okwacho, Zedekiah Okwany, Peter Muchiri, Lydia Njeru & Elizabeth Katei',
      },
      {
        series: 'Mentor Biology',
        publisher: 'Mentor Publishing',
        authors: 'Charles Kogi, Emily Irene Njeri, Francis Ndaka Kinaka, Makena Kiara & Miriam Gathogo',
      },
      {
        series: 'Spotlight Biology',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Damaris Keli, Priscilla Ndiho, Joseph Mathenge, Hannah Mwangi & Paschal Wasonga',
      },
      {
        series: 'Longhorn Advancing in Biology',
        publisher: 'Longhorn Publishers',
        authors: 'Zipporah Gatheche, Alfred Mukolwe Otipa, Samuel Kioko & Kenyatta Ezekiel',
      },
      {
        series: 'Moran Biology',
        publisher: 'Moran (EA) Publishers',
        authors: 'Emmanuel Wawire, Alfonso Nyoroh & Patrick Talam',
      },
    ],
    Chemistry: [
      {
        series: 'Oxford Chemistry Today',
        publisher: 'Oxford University Press (EA)',
        authors: 'Grace Orado, Dickson Mugendi, Rosemary Nelima Wafula, Mariam Chebet & Eliud Gachunga',
      },
      {
        series: 'KLB Excelling Chemistry',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Levi Mabogha, Pauline Wainaina, Peter Macharia, Silas Mango & Zipporah Muli',
      },
      {
        series: 'Longhorn Advancing in Chemistry',
        publisher: 'Longhorn Publishers',
        authors: "Antoney Ochieng', Violet Gudima, Joel Mungai & Stephen Olwali Ahurah",
      },
      {
        series: 'Mentor Chemistry',
        publisher: 'Mentor Publishing',
        authors: 'Eunice Odago, Christopher Keya, Nebert Lumire, Angela Bera & George Gathogo',
      },
      {
        series: 'Smart Minds Chemistry',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Miriam Kemei, Wilberforce Chakongo, David N. Mungai & Abigail W. Waweru',
      },
    ],
    Physics: [
      {
        series: 'KLB Excelling Physics',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Hesborne O. Omollo, Oliver Minishi, Grace Wakio Mwangasha, Dysmas Kibet Kogo & Lilian Adika',
      },
      {
        series: 'Spotlight Physics',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Isaac Ondieki, Theophilus Kanuna & Mathew Opiyo',
      },
      {
        series: 'Mentor Physics',
        publisher: 'Mentor Publishing',
        authors: 'Joash Wamalwa, Lavenah Shitera & Kiboi Dismas Chenge',
      },
      {
        series: 'Moran Physics',
        publisher: 'Moran (EA) Publishers',
        authors: 'Bernard Maingi & Geoffrey Karumba',
      },
      {
        series: 'Longhorn Advancing in Physics',
        publisher: 'Longhorn Publishers',
        authors: 'Peterson Gichaba, Philip Obwage & Kefa Angwenyi Masita',
      },
    ],
    'General Science': [
      {
        series: 'KLB Excelling General Science',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Franco Munene, Givans Konga, Kelly Wambua, Frankline Carsiano & Bilhah Moemi',
      },
      {
        series: 'Oxford General Science Today',
        publisher: 'Oxford University Press (EA)',
        authors: 'Eric Mulindi, Collins Sagege, Peter Yves, Eric Salano & Daniel Njuguna',
      },
      {
        series: 'Mentor General Science',
        publisher: 'Mentor Publishing',
        authors: 'Nebert Lumire, Christopher Keya, Fridah Munjuri & Peter Gitundu',
      },
      {
        series: 'Spotlight General Science',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Mathew Opiyo, Topister Sabilah, Erick Oyaro, James Shivina & Jacob Asenje',
      },
      {
        series: 'Hummingbird General Science',
        publisher: 'Hummingbird Publishers',
        authors: "Rose Wangari, Christine Musembi, Calistus Wabwile & Maryleah Achieng'",
      },
    ],
    Agriculture: [
      {
        series: 'Healthy Planet Agriculture',
        publisher: 'One Planet Publishing',
        authors: 'Daniel Kemei, Peter Sigei, Alex Kibet & Oyaro Erick',
      },
      {
        series: 'Moran Agriculture',
        publisher: 'Moran (EA) Publishers',
        authors: 'Francis Musungu, David Mbaabu, Susan Kageni & Valentine Karani',
      },
      {
        series: 'Mentor Agriculture',
        publisher: 'Mentor Publishing',
        authors: 'George Waweru, Patrick Munyao & Patrick Waithaka',
      },
      {
        series: 'MTP Agriculture',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Philip Ngunyu & Mountain Top Publishers',
      },
      {
        series: 'Smart Minds Agriculture',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Gladys Nakhulo, Peris Kabaria & Elizabeth Nzambuli',
      },
      {
        series: 'Spotlight Agriculture',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Margaret Chege, Esther Nzomo & Paul Onami',
      },
    ],
    'Computer Studies': [
      {
        series: 'KLB Excelling Computer Studies',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Petronilla Mutwiwa, Charles Loka, Kanyi Gioko, Juliana Kariuki & Rhoda Mukiri',
      },
      {
        series: 'Oxford Active Computer Studies',
        publisher: 'Oxford University Press (EA)',
        authors: 'Dorothy Aluoch, Wycliffe Mutuli, Juanitah Mwende, Patrick Mumo & Linda Muriuki',
      },
      {
        series: 'Modern Technology Computer Studies',
        publisher: 'Modern Technology Publishers',
        authors: 'Stephen N. Mburu & Charles W. Gitonga',
      },
      {
        series: 'Longhorn Advancing in Computer Studies',
        publisher: 'Longhorn Publishers',
        authors: 'Alex Larry Kayeli, Benson Muguro Mungai & Solomon Mwaka Mbaluka',
      },
      {
        series: 'Mentor Computer Studies',
        publisher: 'Mentor Publishing',
        authors: 'Claude Ochieng, Grace Nyaga, Patrick Sifuna & Roselyne Mbithe',
      },
    ],
    'Computer Science': [
      {
        series: 'KLB Excelling Computer Studies',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Petronilla Mutwiwa, Charles Loka, Kanyi Gioko & Juliana Kariuki',
        note: 'Approved under KICD Senior School Computer Studies Pathway Coursebooks',
      },
      {
        series: 'Oxford Active Computer Studies',
        publisher: 'Oxford University Press (EA)',
        authors: 'Dorothy Aluoch, Wycliffe Mutuli & Patrick Mumo',
        note: 'Approved under KICD Senior School Computer Studies Pathway Coursebooks',
      },
      {
        series: 'Longhorn Advancing in Computer Studies',
        publisher: 'Longhorn Publishers',
        authors: 'Alex Larry Kayeli, Benson Muguro Mungai & Solomon Mwaka Mbaluka',
      },
      {
        series: 'Mentor Computer Studies',
        publisher: 'Mentor Publishing',
        authors: 'Claude Ochieng, Grace Nyaga & Patrick Sifuna',
      },
    ],
    'Home Science': [
      {
        series: 'KLB Excelling Home Science',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: "Tom Orwa, Jemimah Nd'ungu, Lucy Nyamu, Emily Wahome & Roseland Shiramba",
      },
      {
        series: 'Mentor Home Science',
        publisher: 'Mentor Publishing',
        authors: 'Josephine Opondo, Esther Karanja, Francis M. Kigondu & Jane W. Thungu',
      },
      {
        series: 'MTP Home Science',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Mountain Top Educational Publishers Limited',
      },
      {
        series: 'Booklyst Home Science',
        publisher: 'Booklyst Publishers',
        authors: 'Hillary Kavai, Faith Gaceri Ngutiku & Margaret N. Wachira',
      },
      {
        series: 'StoryMoja Home Science',
        publisher: 'StoryMoja Publishers',
        authors: 'Keziah Zeruiyah Wandera, Carolyne Adalla, Lilian Obura & Valerie Wakaya',
      },
    ],
    'Information Communication Technology (ICT)': [
      {
        series: 'KLB Excelling Information and Communication Technology',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Petronilla Mutwiwa, Joshua Mutie, Dorothy Aluoch, Linnet Maundu & Charity Mwaniki',
      },
      {
        series: 'Spotlight Information and Communication Technology',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Daniel Arapai & Robert Waswa',
      },
      {
        series: 'Modern Technology Information and Communication Technology (ICT)',
        publisher: 'Modern Technology Publishers',
        authors: 'Stephen N. Mburu, Charles W. Gitonga & Anuradha Khoda',
      },
      {
        series: 'Longhorn Advancing in Information and Communication Technology',
        publisher: 'Longhorn Publishers',
        authors: 'Alex Larry Kayeli, Billy Clinton Taula & Benson Muguro Mungai',
      },
      {
        series: 'Mentor Information Communication Technology (ICT)',
        publisher: 'Mentor Publishing',
        authors: 'Claude Ochieng & Patrick Sifuna',
      },
    ],
    'History and Citizenship': [
      {
        series: 'KLB Excelling History and Citizenship',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Dr. Susan Mutune, Dr. Gladys Kinyanjui, Dr. Kyule Mwanzia, Miriam Chemao & Assa Okoth',
      },
      {
        series: 'Oxford Evolving World History and Citizenship',
        publisher: 'Oxford University Press (EA)',
        authors: 'Maryclaire Indire, Mercy Muthoni, George Gitonga, Akwalu Morris & Sobbins Wakala',
      },
      {
        series: 'Moran History and Citizenship',
        publisher: 'Moran (EA) Publishers',
        authors: "Agumba M. Ndaloh, Rachael Nyatichi & Gilbert Ojwang'",
      },
      {
        series: 'Mentor History and Citizenship',
        publisher: 'Mentor Publishing',
        authors: 'Evans Tsabuko, Felix Oduor, Wycliffe M. Mokaya & Emily Achieng',
      },
      {
        series: 'Hummingbird History and Citizenship',
        publisher: 'Hummingbird Publishers',
        authors: 'Jane Nyaga, John Karanja, Denis Luvate, Ann Wanyonyi & Mercy Akinyi',
      },
    ],
    Geography: [
      {
        series: 'Oxford Active Geography',
        publisher: 'Oxford University Press (EA)',
        authors: 'Nancy Kihwaga, Cephas Kamau, Patrick Esendi & Kevin Owuor',
      },
      {
        series: 'KLB Excelling Geography',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Julius Huho, Maurice Saka, Adelaide Maghanga, Joseph Njoga & Sophy Wafula',
      },
      {
        series: 'Mentor Geography',
        publisher: 'Mentor Publishing',
        authors: 'Evans Tsabuko, Florence Muigua & James Kariuki Njuguna',
      },
      {
        series: 'Moran Geography',
        publisher: 'Moran (EA) Publishers',
        authors: "Ferdinanda Gachang'i, Isaac Biwott, Andrew Simolo & Kevin Otieno",
      },
      {
        series: 'Longhorn Comprehensive Geography',
        publisher: 'Longhorn Publishers',
        authors: 'Longhorn Publishers PLC',
      },
    ],
    'Business Studies': [
      {
        series: 'Oxford Active Business Studies',
        publisher: 'Oxford University Press (EA)',
        authors: 'Kenneth Mbuvi, Patrick Otundo, Josephine Masika & Michael Mutuma',
      },
      {
        series: 'KLB Excelling Business Studies',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Salome Boit, Tobias Yogo, Jared Bosire, Nancy Nyawira & Catherine Macharia',
      },
      {
        series: 'Mentor Business Studies',
        publisher: 'Mentor Publishing',
        authors: 'Dr. George Gathogo, Hannah Gathogo, James Njehuri & Mollyne Mahuga',
      },
      {
        series: 'Moran Business Studies',
        publisher: 'Moran (EA) Publishers',
        authors: 'Olive Gichuri Njoroge & Elvis Odhiambo',
      },
      {
        series: 'Smart Minds Business Studies',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Ann Kihuro & John Mbogo',
      },
    ],
    'Christian Religious Education (CRE)': [
      {
        series: 'Hummingbird Christian Religious Education',
        publisher: 'Hummingbird Publishers',
        authors: 'Edith Gichohi, Edward Kiratu, Joyce Gikera & Peter Kimani',
      },
      {
        series: 'MTP Christian Religious Education',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Nyamboki S. M. & Dinah K. Omweri',
      },
      {
        series: 'Smart Minds Christian Religious Education',
        publisher: 'East African Educational Publishers (EAEP)',
        authors: 'Odhiambo Odongo, Peter Mudogo, Nickson Juma, Mitambo Muchiri & Harriet Songa',
      },
      {
        series: 'Access and Learn Christian Religious Education',
        publisher: 'Access Publishers',
        authors: 'Susan Kimbui, Jacob Njoroge & Mary Nderitu',
      },
    ],
    'Islamic Religious Education (IRE)': [
      {
        series: 'KLB Excelling Islamic Religious Education',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Idris Matsukhu Makokha, Khamis Mohamed Omar, Mohamud A. Muhumed & Fatuma Kassim Mwatamu',
      },
      {
        series: 'Atfaal IRE',
        publisher: 'Atfaal Publishers',
        authors: 'F. Shariff, Harun Abubakar, Wesonga Athman & Nawal Albeity',
      },
    ],
    'Music and Dance': [
      {
        series: 'KLB Excelling Music and Dance',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Marsyden Matsigulu, Isaiah Oyugi, Charity Muraguri, Kevin Kimtai & Moses Maneno',
      },
      {
        series: 'Hummingbird Music and Dance',
        publisher: 'Hummingbird Publishers',
        authors: 'Mary Ondiso & Naftali Korir',
      },
      {
        series: 'Moran Music and Dance',
        publisher: 'Moran (EA) Publishers',
        authors: 'Anthony Maina, Delphine Amimo, William Mureithi & Benjamin Ochami',
      },
      {
        series: 'Mentor Music and Dance',
        publisher: 'Mentor Publishing',
        authors: "Anne Ndung'u, Ann Sylvia Muriuki, Patrick Oketch & Maxwell Osiemo Keraita",
      },
    ],
    'Theatre and Film': [
      {
        series: 'KLB Excelling Theatre and Film',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Egara Kabaji, Argwings Otieno, Charity Wamuyu, Jared Mudanya & Miriam Achiso',
      },
      {
        series: 'Master Theatre and Film',
        publisher: 'Booklyst Publishers',
        authors: 'Gadwill Odhiambo & Victor Muyekwe',
      },
      {
        series: 'Distinction Theatre and Film',
        publisher: 'Distinction Educational Publishers',
        authors: "Morang'a Onyonka & Otundo Otundo",
      },
      {
        series: 'Champion Theatre & Film',
        publisher: 'Doritex Publishing',
        authors: 'Doritex Publishing Investment Ltd',
      },
    ],
    'Fine Arts': [
      {
        series: 'Hummingbird Fine Arts',
        publisher: 'Hummingbird Publishers',
        authors: 'Auma Gloria Oyongo, Catherine Simiyu, Evans Ochieng Asol & Enid Rose Akinyi',
      },
      {
        series: 'KLB Excelling Fine Arts',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Kiruki Kanogu, Okembo S. Lore, Catherine Mavyala & Nicholleta Muthoni',
      },
      {
        series: 'Front Row Fine Arts',
        publisher: 'Front Row Publishers',
        authors: "Catherine N. Kaggwa, Allan Madegwa, Rita Mang'oli & Peter Sechero",
      },
      {
        series: 'Mentor Fine Arts',
        publisher: 'Mentor Publishing',
        authors: 'Clement Mugambi & Dalton Mwangi',
      },
    ],
    'Sports and Recreation': [
      {
        series: 'KLB Excelling Sports and Recreation',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Raphael Kithuka, Derrick Kitaruka, Sophia Mutuma, Peter Wanjihia & Ruth Kahiga',
      },
      {
        series: 'Spotlight Sports and Recreation',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Veronica Simba, Nicholas Bailasha, Nancy Chepkirui, Collins Kiprop & Victor Gitonga',
      },
      {
        series: 'Moran Sports and Recreation',
        publisher: 'Moran (EA) Publishers',
        authors: 'Esther Gachunge & James Chege',
      },
      {
        series: 'MTP Sports and Recreation',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Mountain Top Publishers Limited',
      },
    ],
    'Physical Education': [
      {
        series: 'Spotlight Physical Education',
        publisher: 'Spotlight Publishers (EA)',
        authors: 'Sisto Chege, Irene Njuguna, Veronica Simba, Robert Ndambo & Joseph Karuri',
      },
      {
        series: 'KLB Excelling Physical Education',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Ruth Kahiga, Winnie Nyokabi, Elizabeth Kawira & Miriam Chemao',
      },
      {
        series: 'Hummingbird Physical Education',
        publisher: 'Hummingbird Publishers',
        authors: 'Elijah Gitau, Grace Nelly Wanjiru & Humphrey Chemjor',
      },
      {
        series: 'Moran Physical Education',
        publisher: 'Moran (EA) Publishers',
        authors: 'Paul Maina, Elvis Okoth, George Mwaura & Paul Mwangi',
      },
    ],
    French: [
      {
        series: 'KLB Excelling in French',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Benjamin Kathonde, Dr. Consolata Mwimali, Laura Mulimi & Paul Odhiambo Ope',
      },
      {
        series: 'One Planet Methode de francais',
        publisher: 'One Planet Publishing',
        authors: 'Mboni E. Aura, Edna N. Maloba & Mainga P. Mayabi',
      },
    ],
    Arabic: [
      {
        series: 'KLB Excelling Arabic',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Ahmed A. Ahmed, Abdullahi A. Mohamed & Mohamed A. Mohamed',
      },
      {
        series: 'Atfaal Arabic',
        publisher: 'Atfaal Publishers',
        authors: 'Harun Abubakar',
      },
    ],
    German: [
      {
        series: 'KLB Deutsch Mit Erfolg',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Patrick Akhudu, Lucy Mutola, Robert Mwangi & David Wakwabubi',
      },
    ],
    'Life Skills': [
      {
        series: 'Life Skills for Senior School Learners',
        publisher: 'Chalan Foundation',
        authors: 'Margaret Koech & Sally Keiyo',
      },
    ],
    Aviation: [
      {
        series: 'KLB Excelling Aviation',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'James G. Nyagah, Vincent K. Kathurima, Mercy Naliaka & Vivian Chepkonga',
      },
      {
        series: 'Bookmark Aviation',
        publisher: 'Bookmark Publishers',
        authors: 'C. Matanya, V. Oduor & S. Musumba',
      },
      {
        series: 'Penguin Aviation',
        publisher: 'Penguin Publishers',
        authors: 'James W. Nderitu',
      },
    ],
    'Building Construction': [
      {
        series: 'KLB Excelling Building Construction',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Omukaga O. Panyako, Richard Kimiti, Fwamba Julius, Hellen Chebet & Lucy Mulimba',
      },
      {
        series: 'Moran Building Construction',
        publisher: 'Moran (EA) Publishers',
        authors: 'Micah Nakhisa, Abraham Kirugo, John Mburu & David Mungai',
      },
      {
        series: 'Longhorn Advancing in Building Construction',
        publisher: 'Longhorn Publishers',
        authors: 'Christine Khatali, Naomi Ogati, Ghonzo M. Odongo & Martin Kipkemboi',
      },
      {
        series: 'Mentor Building Construction',
        publisher: 'Mentor Publishing',
        authors: 'Esther Njoki & Racheal Njeri',
      },
    ],
    Electricity: [
      {
        series: 'KLB Excelling Electricity',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Honorad Ochayo, Tom Ben Makomere, Daniel Kipkemboi, Jackson Muasya & Peter Kiteetu',
      },
      {
        series: 'Moran Electricity',
        publisher: 'Moran (EA) Publishers',
        authors: 'John Mburu, Joseph Mukaisi, Darius Nyambuto & Vincent Maroro',
      },
      {
        series: 'Master Electricity',
        publisher: 'Booklyst Publishers',
        authors: 'Honorad Mwikami Ochayo & Sammy Kuya',
      },
      {
        series: 'Mentor Electricity',
        publisher: 'Mentor Publishing',
        authors: 'Joash Wamalwa',
      },
    ],
    'Metal Work': [
      {
        series: 'KLB Excelling Metalwork',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Omukaga O. Panyako, Peter Kimiti, Leonard Mwanja & Job Nyangeri',
      },
      {
        series: 'Moran Metal Work',
        publisher: 'Moran (EA) Publishers',
        authors: 'Abraham Kirugo, David Mungai & John Mburu',
      },
      {
        series: 'Longhorn Advancing in Metal Work',
        publisher: 'Longhorn Publishers',
        authors: 'Aggrey Welashina, Duncan Kamau & Johnson Maoga',
      },
      {
        series: 'Mentor Metalwork',
        publisher: 'Mentor Publishing',
        authors: 'Joash Wamalwa',
      },
    ],
    'Power Mechanics': [
      {
        series: 'KLB Excelling Power Mechanics',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'John K. Chepkwony, Walter Oketch & Richard Odhiambo Omuiya',
      },
      {
        series: 'Moran Power Mechanics',
        publisher: 'Moran (EA) Publishers',
        authors: 'John Mburu, Ibrahim Kirugo, David Mungai & Pius Gichini',
      },
      {
        series: 'Mentor Power Mechanics',
        publisher: 'Mentor Publishing',
        authors: 'Joash Wamalwa',
      },
      {
        series: 'Booklyst Master Power Mechanics',
        publisher: 'Booklyst Publishers',
        authors: "Michael Mwangi Ndung'u & Peter Irungu Kamau",
      },
    ],
    Woodwork: [
      {
        series: 'KLB Excelling Woodwork',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Lucy J. Mulimba, Samuel Kariuki Ngunyi, Alexander Lubanga & Henry Masinde Anaswa',
      },
      {
        series: 'Bookmark Woodwork',
        publisher: 'Bookmark Publishers',
        authors: 'Sonny Adams, Simon Gichoru, Grace Kamau, Brian Opondo & Rose Maiyo',
      },
      {
        series: 'Longhorn Advancing in Woodwork',
        publisher: 'Longhorn Publishers',
        authors: 'Longhorn Publishers PLC',
      },
      {
        series: 'MTP Woodwork',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Mountain Top Publishers Limited',
      },
    ],
    'Media Technology': [
      {
        series: 'KLB Excelling Media Technology',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: "Christopher Odhiambo, Wycliffe Buhere, Gabriel Thuku, Clifford Ouma & John Ng'onde",
      },
      {
        series: 'Front Row Media Technology',
        publisher: 'Front Row Publishers',
        authors: 'Hudson Munayi, Juliet Musimbi & John Ndavula',
      },
      {
        series: 'One Planet Media Technology',
        publisher: 'One Planet Publishing',
        authors: 'Bernard Ogutu, Kithusi Mulonzya & Ngulamu Mwaviro',
      },
    ],
    'Marine and Fisheries Technology': [
      {
        series: 'KLB Excelling Marine and Fisheries Technology',
        publisher: 'Kenya Literature Bureau (KLB)',
        authors: 'Dr. Callen Onura, Franco Munene, Finnan Agenga, Josh Omondi & Omondi Kashin',
      },
      {
        series: 'Booklyst Master Marine and Fisheries Technology',
        publisher: 'Booklyst Publishers',
        authors: 'Christine Wasonga Olubayi',
      },
      {
        series: 'MTP Marine and Fisheries Technology',
        publisher: 'Mountain Top Publishers (MTP)',
        authors: 'Mountain Top Publishers Limited',
      },
    ],
  },
};

export const KICD_OFFICIAL_APPROVED_PORTAL_URL =
  'https://kicd.ac.ke/cbc-materials/approved-cbc-course-materials/';

/**
 * Returns ALL KICD Orange Book & 2026 Addendum Approved Coursebooks for a given (grade, subject).
 */
export function getAllApprovedCoursebooksForGradeSubject(grade, subject) {
  const isPP1 = grade === 'PP1' || grade === -1;
  const isPP2 = grade === 'PP2' || grade === 0;
  const bandKey =
    isPP1 || isPP2
      ? 'preprimary'
      : Number(grade) <= 3
      ? 'lower'
      : Number(grade) <= 6
      ? 'upper'
      : Number(grade) <= 9
      ? 'jss'
      : 'senior';
  const bandObj = KICD_APPROVED_COURSEBOOKS[bandKey] || {};
  return bandObj[subject] || [];
}

/**
 * Deterministically returns the exact KICD Orange Book Approved Primary Coursebook
 * (Learner's Book + Teacher's Guide + Publisher + Authors) and Supplementary KICD-Approved
 * Coursebooks for a given (grade, subject).
 * Because this depends ONLY on (grade, subject), every document category & term for that
 * (grade, subject) cites the exact same KICD-approved books!
 */
export function getApprovedCoursebook(grade, subject) {
  const isPP1 = grade === 'PP1' || grade === -1;
  const isPP2 = grade === 'PP2' || grade === 0;
  const isPrePrimary = isPP1 || isPP2;
  const gradeLabel = isPP1 ? 'PP1' : isPP2 ? 'PP2' : `Grade ${grade}`;
  const shortGradeLabel = isPP1 ? 'PP1' : isPP2 ? 'PP2' : `Grd ${grade}`;

  const bandKey = isPrePrimary
    ? 'preprimary'
    : Number(grade) <= 3
    ? 'lower'
    : Number(grade) <= 6
    ? 'upper'
    : Number(grade) <= 9
    ? 'jss'
    : 'senior';
  const bandObj = KICD_APPROVED_COURSEBOOKS[bandKey] || {};
  const list = bandObj[subject] || [
    {
      series: `KLB Approved ${subject}`,
      publisher: 'Kenya Literature Bureau (KLB)',
      authors: 'KICD Approved Curriculum Panel',
    },
  ];

  // Grade 3 KLB English Language Activities has exact title "KLB Lower Primary English Language Activities"
  const numericIdx = isPP1 ? 0 : isPP2 ? 1 : Math.max(0, Number(grade) - 1);
  const primaryIdx = numericIdx % list.length;
  const rawPrimary = list[primaryIdx];
  const resolvedSeries =
    Number(grade) === 3 && rawPrimary.series === 'KLB Visionary English Language Activities'
      ? 'KLB Lower Primary English Language Activities'
      : rawPrimary.series.replace(' &实用 KICD Panel', '');

  const isKis = Boolean(rawPrimary.isKiswahili || String(subject).toLowerCase().includes('kiswahili'));

  const lbTitle = isKis
    ? `${resolvedSeries} Kitabu cha Mwanafunzi ${isPrePrimary ? gradeLabel : `Gredi ya ${grade}`}`
    : `${resolvedSeries} Learner's Book ${gradeLabel}`;
  const tgTitle = isKis
    ? `${resolvedSeries} Mwongozo wa Mwalimu ${isPrePrimary ? gradeLabel : `Gredi ya ${grade}`}`
    : `${resolvedSeries} Teacher's Guide ${gradeLabel}`;

  const lbShort = isKis
    ? `${resolvedSeries} Kitabu cha Mwanafunzi ${shortGradeLabel}`
    : `${resolvedSeries} LB ${shortGradeLabel}`;
  const tgShort = isKis
    ? `${resolvedSeries} Mwongozo wa Mwalimu ${shortGradeLabel}`
    : `${resolvedSeries} TG ${shortGradeLabel}`;

  const alternates = list
    .filter((_, idx) => idx !== primaryIdx)
    .slice(0, 2)
    .map((alt) => `${alt.series} ${gradeLabel} (${alt.publisher})`);

  return {
    series: resolvedSeries,
    publisher: rawPrimary.publisher,
    authors: rawPrimary.authors.replace(' &实用 KICD Panel', '').replace(' &agumba Panel', ''),
    lbTitle,
    tgTitle,
    lbShort,
    tgShort,
    isKiswahili: isKis,
    note: rawPrimary.note || null,
    alternates,
  };
}

export const SUBJECT_SYLLABUS = {
  // ================= PRE-PRIMARY (PP1 & PP2) =================
  'Language Activities': {
    shortCode: 'LANG-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 LISTENING AND SPEAKING', subs: ['Common Greetings & Polite Words (Please, Thank You, Excuse Me)', 'Naming Self, Family Members & Classroom Objects', 'Auditory Discrimination: Environmental & Animal Sounds'], kiq: 'How do we greet teachers, parents, and friends politely every day?', resources: 'Picture flashcards, puppets, rhyme charts, realia' },
        { strand: '2.0 PRE-READING & 3.0 PRE-WRITING', subs: ['Book Handling, Left-to-Right Eye Tracking & Picture Reading', 'Letter Sounds (a–z) & Rhyming Action Songs', 'Proper Sitting Posture, Crayon/Pencil Grip & Scribbling/Tracing Lines'], kiq: 'How do we hold a picture book and crayon properly?', resources: 'Jumbo crayons, sand trays, alphabet sound cards, picture storybooks' },
      ],
      2: [
        { strand: '1.0 ORAL EXPRESSION & VOCABULARY', subs: ['Passing Simple Oral Messages & Following Two-Step Instructions', 'Naming Body Parts, Clothes & Healthy Foods', 'News Telling & Short Storytelling Sessions'], kiq: 'Why should we listen attentively when someone is speaking?', resources: 'Body chart, fruit models, story picture sequence cards' },
        { strand: '2.0 PHONICS & LETTER FORMATION', subs: ['Visual Discrimination: Matching Identical Pictures & Letter Shapes', 'Articulating Vowel Sounds (a, e, i, o, u) & Consonant Sounds', 'Modelling Letters With Clay & Tracing Lowercase Letters'], kiq: 'Which objects in our classroom begin with the same letter sound?', resources: 'Plasticine/clay, sandpaper letters, pocket chart, flashcards' },
      ],
      3: [
        { strand: '2.0 EARLY READING READINESS', subs: ['Blending Two-Letter Syllables (ba, ma, ta, pa) & Three-Letter CVC Words', 'Reading Simple Picture Labels & Sight Words', 'Reciting Short Poems, Rhymes & Singing Games'], kiq: 'How do we join sounds together to read short words?', resources: 'Syllable wheels, CVC picture-word cards, graded ECDE readers' },
        { strand: '3.0 WRITING READINESS', subs: ['Copying Lowercase & Capital Letters Neat & Clear', 'Drawing & Colouring Within Boundaries', 'Writing Own First Name & Copying Short Three-Letter Words'], kiq: 'How does neat colouring and tracing prepare our fingers for writing?', resources: 'Wide-ruled exercise books, stencils, name tags, coloured pencils' },
      ],
    },
    byGrade: {
      PP1: {
        1: [
          { strand: '1.0 LISTENING AND SPEAKING (GREETINGS & SELF)', subs: ['Time-Related Greetings (Good Morning, Good Afternoon, Goodbye)', 'Naming Self, Teacher & Friends Clearly', 'Listening to Environmental, Domestic Animal & Musical Sounds'], kiq: 'How do we greet our teacher and classmates warmly in the morning?', resources: 'Hand puppets, shakers, animal sound audio/charts, name badges' },
          { strand: '2.0 PRE-READING & PRE-WRITING PLAY', subs: ['Turning Book Pages Gently & Picture Observation', 'Free Scribbling, Finger Painting & Sand-Tray Tracing', 'Singing Alphabet Rhymes & Recognizing Sounds a–m'], kiq: 'How do we turn pages carefully without tearing our picture books?', resources: 'Board books, sand trays, finger paints, jumbo crayons, sound charts' },
        ],
        2: [
          { strand: '1.0 LISTENING, COURTESY & FAMILY', subs: ['Using Polite Words (Please, Sorry, Thank You, May I)', 'Naming Immediate Family Members & Home Utensils', 'Following Simple Classroom Action Commands'], kiq: 'When do we say "Please", "Sorry", and "Thank you" to others?', resources: 'Family picture charts, toy cups/plates, role-play corner' },
          { strand: '2.0 VISUAL MATCHING & PATTERN TRACING', subs: ['Matching Identical Pictures, Colours & Big Shapes', 'Recognizing Sounds n–z With Picture Flashcards', 'Tracing Vertical, Horizontal, Curved & Zigzag Dotted Lines'], kiq: 'Which pictures on the chart look exactly the same?', resources: 'Matching domino cards, dotted tracing worksheets, plasticine' },
        ],
        3: [
          { strand: '2.0 PICTURE STORYTELLING & VOWEL SOUNDS', subs: ['Telling Short Stories From Sequential Pictures', 'Sounding Out Vowels (a, e, i, o, u) With Songs', 'Naming Common Domestic Animals, Fruits & Colours'], kiq: 'What is happening in each picture of our classroom storybook?', resources: 'Big picture books, vowel flashcards, fruit realia, colour cards' },
          { strand: '3.0 LETTER MODELLING & COLOURING', subs: ['Modelling Simple Letter Shapes Using Clay or Plasticine', 'Colouring Simple Everyday Shapes Within Outlines', 'Tracing & Copying Lowercase Letters Clearly'], kiq: 'How do we stay inside the lines when colouring a picture?', resources: 'Modelling clay, jumbo colouring booklets, beginner pencils' },
        ],
      },
      PP2: {
        1: [
          { strand: '1.0 LISTENING, ETIQUETTE & NEWS TELLING', subs: ['Polite Greetings, Introductions & Classroom Turn-Taking', 'Weekend/Morning News Telling & Oral Question Answering', 'Discriminating Similar Letter Sounds & Initial Consonants'], kiq: 'How do we share news clearly while others listen politely?', resources: 'Talking stick, phonics sound wall, picture conversation posters' },
          { strand: '2.0 PHONICS & SYLLABLES', subs: ['Articulating All Letter Sounds (a–z) Confidently', 'Joining Consonants and Vowels Into Open Syllables (ba, be, bi, bo, bu)', 'Correct Pencil Grip, Posture & Writing Lowercase Letters'], kiq: 'How do consonants and vowels join to form syllables?', resources: 'Syllable flip-charts, letter tiles, wide-ruled books, pencils' },
        ],
        2: [
          { strand: '2.0 BLENDING THREE-LETTER (CVC) WORDS', subs: ['Blending & Reading Simple Three-Letter Words (cat, pot, sun, bed, pin)', 'Matching Three-Letter Words to Real Objects & Pictures', 'Vocabulary of Weather, Clothes, School & Safety'], kiq: 'How do we blend three sounds smoothly to read a word?', resources: 'CVC word-picture puzzles, pocket chart, real classroom objects' },
          { strand: '3.0 LETTER FORMATION & COPYING WORDS', subs: ['Matching Capital Letters (A–Z) to Lowercase Letters (a–z)', 'Copying Simple Three-Letter Words With Neat Spacing', 'Drawing & Labelling Simple Familiar Items'], kiq: 'When do we write a capital letter at the start of our name?', resources: 'Upper/lowercase matching cards, name strips, ruled books' },
        ],
        3: [
          { strand: '2.0 SHORT SENTENCE READING & RHYMES', subs: ['Reading Short Sight-Word Phrases & Three-Word Sentences', 'Picture Comprehension & Retelling Moral Stories in Order', 'Reciting Action Poems, Riddles & Tongue Twisters'], kiq: 'What moral lesson did we learn from today’s picture story?', resources: 'PP2 graded decodable readers, sentence strips, story props' },
          { strand: '3.0 EARLY WRITING & GRADE 1 READINESS', subs: ['Writing Own Full First Name & Simple Dictated Syllables/CVC Words', 'Completing Simple Picture-Word Sentences', 'Neatness, Margin Alignment & Left-to-Right Writing Fluency'], kiq: 'How can we check that our words are neat and easy to read?', resources: 'Beginner exercise books, picture-word worksheets, pencils, erasers' },
        ],
      },
    },
  },

  // ================= LOWER PRIMARY (GRADES 1 - 3) =================
  'Mathematical Activities': {
    shortCode: 'MATH-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 NUMBERS', subs: ['Pre-Number & Sorting Activities', 'Whole Numbers: Counting & Reading', 'Place Value (Ones, Tens & Hundreds)', 'Number Patterns & Ordering'], kiq: 'How do we use numbers to count and group objects in daily life?', resources: 'Counters, bottle tops, number cards, place value tins, abacus' },
        { strand: '1.0 NUMBERS', subs: ['Addition of Whole Numbers', 'Addition Word Tasks', 'Subtraction as Taking Away', 'Relationship Between Addition & Subtraction'], kiq: 'When do we add or subtract items at home and school?', resources: 'Number lines, marbles, sticks, flashcards' },
      ],
      2: [
        { strand: '1.0 NUMBERS', subs: ['Multiplication as Repeated Addition', 'Division as Equal Sharing', 'Fractions (Halves, Quarters & Eighths)', 'Fractions of a Group'], kiq: 'How can we share fruits or books equally among friends?', resources: 'Paper cutouts, fruits realia, fraction charts, counters' },
        { strand: '2.0 MEASUREMENT', subs: ['Length (Arbitrary & Standard Metres)', 'Mass (Comparing Heavy & Light / Kilograms)', 'Capacity (Filling & Emptying Containers / Litres)'], kiq: 'Why do we measure length, mass, and capacity accurately?', resources: 'Metre rule, beam balance, 1-litre containers, sand, water' },
      ],
      3: [
        { strand: '2.0 MEASUREMENT', subs: ['Time (Days, Months & Reading the Clock Face)', 'Money (Kenyan Coins & Notes, Shopping)', 'Needs and Wants in Spending'], kiq: 'How do we tell time and use Kenyan currency wisely?', resources: 'Model clock faces, Kenyan currency specimens, classroom shop corner' },
        { strand: '3.0 GEOMETRY', subs: ['Lines (Straight, Curved, Wavy & Zigzag)', '2D Shapes (Rectangles, Circles, Triangles, Ovals)', 'Making Patterns & Direction Turns'], kiq: 'What shapes can we observe on buildings and objects around us?', resources: 'Shape cutouts, manila paper, crayons, string, sticks' },
      ],
    },
    byGrade: {
      PP1: {
        1: [
          { strand: '1.0 CLASSIFICATION (SORTING & MATCHING)', subs: ['Sorting & Grouping Play Objects by Colour and Use', 'Matching & Pairing Everyday Objects One-to-One', 'Ordering Objects From Smallest to Largest'], kiq: 'How do we group play items of the same colour or shape together?', resources: 'Coloured bottle tops, blocks, beads, picture pairing cards' },
          { strand: '2.0 NUMBERS (ROTE COUNTING & RECOGNITION 1–5)', subs: ['Rote Counting 1 to 10 With Action Songs', 'Counting Concrete Objects 1 to 5 Accurately', 'Recognizing & Tracing Number Symbols 1 to 5'], kiq: 'How many fingers are on one hand when we count together?', resources: 'Counting sticks, pebbles, jumbo number cards 1–5, sand trays' },
        ],
        2: [
          { strand: '2.0 NUMBERS (COUNTING & VALUE 1–9)', subs: ['Rote Counting 1 to 20 With Clapping & Jumping', 'Counting & Matching Objects to Number Symbols 1 to 9', 'Making Simple Alternating Patterns With Two Colours/Shapes'], kiq: 'How do we match a group of counters to its correct number card?', resources: 'Bead strings, number flashcards 1–9, coloured blocks' },
          { strand: '3.0 MEASUREMENT PLAY (SIDES, MASS & CAPACITY)', subs: ['Comparing Big/Small and Long/Short Concrete Objects', 'Heavy and Light Play Using Hands & See-Saw', 'Filling and Emptying Water/Sand Containers (Full & Empty)'], kiq: 'Which container holds more sand or water when we play?', resources: 'Plastic cups, small buckets, sand pit, sticks of varied lengths' },
        ],
        3: [
          { strand: '3.0 DAILY ROUTINES, MONEY PLAY & SPACE', subs: ['Daily Activities: Morning, Lunchtime, Playtime & Bedtime', 'Observing Kenyan Coins in Classroom Shop Role-Play', 'Position Play: Inside/Outside, On/Under & In Front/Behind'], kiq: 'What activities do we do in the morning before coming to school?', resources: 'Daily routine charts, large coin cutouts, classroom shop corner' },
          { strand: '4.0 SHAPES & MODELLING', subs: ['Identifying Circle, Triangle & Square Cutouts', 'Modelling Numbers 1–9 & Basic Shapes With Clay', 'Colouring & Pasting Simple Shape Collages'], kiq: 'Where can we see circles and squares around our classroom?', resources: 'Shape stencils, plasticine/clay, coloured paper cutouts, safe glue' },
        ],
      },
      PP2: {
        1: [
          { strand: '1.0 CLASSIFICATION & PATTERNS', subs: ['Sorting & Grouping Objects by Two Attributes (Size, Shape & Colour)', 'Pairing, Matching & Ordering Up to 5 Graded Objects', 'Creating Repeating Patterns With Shapes, Beads & Colours'], kiq: 'How can we arrange objects neatly from shortest to tallest?', resources: 'Attribute blocks, sorting trays, coloured beads, strings' },
          { strand: '2.0 NUMBERS (COUNTING, VALUE & WRITING 1–20)', subs: ['Rote Counting 1 to 50 & Counting Concrete Objects 1 to 20', 'Number Value & Matching Numerals 1 to 20', 'Writing Numerals 1 to 20 Neatly & Number Sequencing'], kiq: 'How do bundles of counters help us count up to 20 accurately?', resources: 'Counters, number line 1–20, flashcards, squared beginner books' },
        ],
        2: [
          { strand: '2.0 PUTTING TOGETHER & TAKING AWAY (WITHIN 9)', subs: ['Putting Together Concrete Objects (Sums Up to 9)', 'Taking Away Concrete Objects Within 9', 'Simple Oral Picture Stories on Putting Together & Taking Away'], kiq: 'How many counters do we have altogether when we put two small groups together?', resources: 'Marbles, bottle tops, picture addition/take-away cards' },
          { strand: '3.0 MEASUREMENT (LENGTH, MASS, CAPACITY & AREA)', subs: ['Measuring Length Using Handspans & Footsteps', 'Comparing Mass on a Simple Balance & Capacity by Counting Cups', 'Covering Surfaces Completely Using Cards/Books (Early Area)'], kiq: 'How many small cups of water fill one big jug?', resources: 'Simple beam balance, cups, jugs, flashcards for surface covering' },
        ],
        3: [
          { strand: '3.0 TIME, KENYAN CURRENCY & GEOMETRY', subs: ['Days of the Week Song & Classroom Routine Sequencing', 'Identifying Kenyan Coins (Ksh 1, 5, 10, 20) & Shop Buying/Selling Play', 'Properties & Drawing of Circle, Triangle, Rectangle, Square & Oval'], kiq: 'Which Kenyan coins do we use to buy snacks or pencils at a shop?', resources: 'Kenyan coin specimens, shop corner items, days-of-week chart, shape cutouts' },
          { strand: '2.0 GRADE 1 NUMERACY READINESS', subs: ['Counting & Ordering Numbers Up to 30/50', 'Mixed Put-Together and Take-Away Practice Within 9', 'Completing Number & Shape Puzzles'], kiq: 'How do numbers and shapes help us solve everyday puzzles?', resources: 'Number grids 1–50, jigsaw number cards, counters' },
        ],
      },
      1: {
        1: [
          { strand: '1.0 NUMBERS', subs: ['Sorting, Matching & Pairing Objects by Colour and Size', 'Counting & Reading Whole Numbers 1 to 100', 'Place Value of Tens and Ones Using Bundles of Sticks', 'Number Patterns Within 20'], kiq: 'How do we sort and count objects accurately from 1 to 100?', resources: 'Bottle tops, coloured blocks, bundles of 10 sticks, number chart 1-100' },
          { strand: '1.0 NUMBERS', subs: ['Addition of Single-Digit & 2-Digit Numbers Without Regrouping', 'Real-Life Addition Word Tasks Within 50', 'Subtraction Within 20 as Taking Away', 'Relating Addition and Subtraction Sentences'], kiq: 'How do number lines help us add and take away objects?', resources: 'Floor number line, counters, marbles, addition flashcards' },
        ],
        2: [
          { strand: '1.0 NUMBERS', subs: ['Counting in Twos, Fives & Tens Up to 100', 'Equal Grouping & Sharing Objects Fairly', 'Identifying Whole and Half (1/2) of Concrete Objects'], kiq: 'How do we share an orange or paper strip into two equal halves?', resources: 'Paper strips, safe plastic knives, fruit models, counters' },
          { strand: '2.0 MEASUREMENT', subs: ['Comparing Length Using Handspans, Paces & Sticks', 'Comparing Mass (Heavier Than, Lighter Than, Same Mass)', 'Comparing Capacity by Filling & Emptying Containers'], kiq: 'Why do two different containers hold different amounts of water?', resources: 'Simple beam balance, cups, tins, sticks, sand & water basin' },
        ],
        3: [
          { strand: '2.0 MEASUREMENT', subs: ['Times of the Day (Morning, Noon, Evening) & Days of the Week', 'Identifying Kenyan Coins & Notes Up to Ksh 100', 'Classroom Shop Role-Play: Needs vs Wants'], kiq: 'How do we identify Kenyan coins and spend pocket money wisely?', resources: 'Kenyan coin/note specimens, daily routine pictures, shop corner items' },
          { strand: '3.0 GEOMETRY', subs: ['Tracing Straight and Curved Lines in the Environment', 'Identifying Rectangles, Triangles & Circles', 'Creating Repeating Shape Patterns'], kiq: 'Where do we see straight lines, circles, and rectangles in our classroom?', resources: 'Shape cutouts, strings, sticks, crayons, manila charts' },
        ],
      },
      2: {
        1: [
          { strand: '1.0 NUMBERS', subs: ['Reading & Writing Whole Numbers 1 to 1,000', 'Place Value: Hundreds, Tens & Ones on an Abacus', 'Reading & Writing Numbers 1 to 100 in Words', 'Increasing & Decreasing Number Patterns to 1,000'], kiq: 'How does an abacus show hundreds, tens, and ones clearly?', resources: 'Three-spike abacus, place value tins, number cards 1-1000' },
          { strand: '1.0 NUMBERS', subs: ['Addition of 2- & 3-Digit Numbers With Single Regrouping', 'Subtraction of 2- & 3-Digit Numbers Without & With Regrouping', 'Missing Numbers in Addition & Subtraction Equations'], kiq: 'When do we regroup 10 ones into 1 ten when adding?', resources: 'Place value pocket chart, base-ten blocks, flashcards' },
        ],
        2: [
          { strand: '1.0 NUMBERS', subs: ['Multiplication as Repeated Addition (Tables of 2, 3, 4, 5 & 10)', 'Division as Equal Sharing & Grouping Within 50', 'Fractions: Halves (1/2) and Quarters (1/4) of a Whole & Group'], kiq: 'How is repeated addition faster when written as multiplication?', resources: 'Multiplication array grids, counters, circular fraction cutouts' },
          { strand: '2.0 MEASUREMENT', subs: ['Measuring Length in Standard Metres (m)', 'Measuring Mass in Kilograms (1 kg Reference)', 'Measuring Capacity in Litres (1-Litre Containers)'], kiq: 'Why is a 1-metre rule better than handspans when buying cloth?', resources: '1-metre sticks, 1-kg sandbags, beam balance, graduated 1-litre jugs' },
        ],
        3: [
          { strand: '2.0 MEASUREMENT', subs: ['Months of the Year, Calendar Reading & Telling Time by the Hour/Half-Hour', 'Kenyan Currency Up to Ksh 500: Adding Money & Giving Change', 'Saving Money & Prioritizing Family Needs'], kiq: 'How do we calculate balance when buying items at a shop?', resources: 'Wall calendar, geared clock faces, specimen notes/coins, price tags' },
          { strand: '3.0 GEOMETRY', subs: ['Drawing Straight, Curved, Wavy & Zigzag Lines', 'Properties of Rectangles, Squares, Triangles, Circles & Ovals', 'Making Decorative Border Patterns With 2D Shapes'], kiq: 'How many corners and sides do squares, rectangles, and triangles have?', resources: 'Rulers, stencils, coloured paper cutouts, glue, art books' },
        ],
      },
      3: {
        1: [
          { strand: '1.0 NUMBERS', subs: ['Ordinal Numbers (1st to 20th) & Whole Numbers Up to 10,000', 'Place Value & Total Value: Thousands, Hundreds, Tens & Ones', 'Rounding Off Numbers to the Nearest Ten & Number Patterns', 'Fractions: 1/2, 1/4 & 1/8 of a Whole and of a Group'], kiq: 'How do ordinal numbers and thousands help us organize large events?', resources: 'Four-spike abacus, place value charts, fraction strips, number cards' },
          { strand: '1.0 NUMBERS', subs: ['Addition of Up to 4-Digit Numbers With Regrouping', 'Subtraction of Up to 4-Digit Numbers With Regrouping', 'Multi-Step Word Problems on Addition & Subtraction'], kiq: 'How do we check subtraction answers using addition?', resources: 'Place value apparatus, word-problem task cards, counters' },
        ],
        2: [
          { strand: '1.0 NUMBERS', subs: ['Multiplication Tables (Up to 9 x 9) & Single-Digit Word Tasks', 'Division as Inverse of Multiplication (Up to 81 ÷ 9)'], kiq: 'How are multiplication facts related to division facts?', resources: '9x9 multiplication grid, counters, division fact wheels' },
          { strand: '2.0 MEASUREMENT', subs: ['Adding & Subtracting Length in Metres', 'Adding & Subtracting Mass in Kilograms', 'Adding & Subtracting Capacity in Litres & Half-Litres'], kiq: 'How do tailors, shopkeepers, and dairy farmers measure accurately?', resources: 'Tape measures, metre rules, kitchen scales, 500ml & 1L containers' },
        ],
        3: [
          { strand: '2.0 MEASUREMENT', subs: ['Reading Time to 5-Minute Intervals (Past & To the Hour)', 'Kenyan Currency Up to Ksh 1,000: Shopping Bills, Change & Saving'], kiq: 'Why is keeping a shopping list helpful before going to the market?', resources: 'Clock faces, Kenyan currency charts, mock supermarket receipts' },
          { strand: '3.0 GEOMETRY', subs: ['Position & Direction: Straight Movement, Left & Right Quarter Turns', 'Sorting & Combining 2D Shapes into Models and Patterns'], kiq: 'How do clear left and right directions help someone find their way?', resources: 'Playground grid, direction arrows, geometric tangram cutouts' },
        ],
      },
    },
  },

  'English Language Activities': {
    shortCode: 'ENG-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 LISTENING AND SPEAKING', subs: ['Greetings, Polite Words & Etiquette', 'Pronunciation & Letter-Sound Knowledge', 'Oral Comprehension: School & Family'], kiq: 'Why should we use courteous words when greeting elders and peers?', resources: 'Letter-sound flashcards, audio rhymes, picture charts' },
        { strand: '2.0 READING & 3.0 WRITING', subs: ['Print Awareness & Reading Posture', 'Blending Words & Sight Vocabulary', 'Handwriting: Letter Formation & Spacing', 'Capital Letters & Full Stops'], kiq: 'How do we blend sounds to read new words fluently?', resources: 'Decodable storybooks, pocket charts, ruled exercise books' },
      ],
      2: [
        { strand: '1.0 LISTENING AND SPEAKING', subs: ['Safety at Home & Road Crossing', 'Weather and Our Environment Vocabulary', 'Following Multi-Step Oral Instructions'], kiq: 'How do we stay safe at home, school, and on the road?', resources: 'Road sign posters, weather charts, picture cards' },
        { strand: '3.0 LANGUAGE IN USE & WRITING', subs: ['Singular and Plural Nouns', 'Action Verbs (Present, Continuous & Past Tense)', 'Personal & Possessive Pronouns', 'Guided Sentence Writing'], kiq: 'How do action words help us describe what people are doing?', resources: 'Substitution tables, word wheels, illustrated readers' },
      ],
      3: [
        { strand: '2.0 READING COMPREHENSION', subs: ['Reading Short Stories for Meaning', 'Retelling Stories in Sequence', 'Vocabulary Building: Community Helpers & Animals'], kiq: 'What lessons can we learn from stories about our community?', resources: 'Graded CBC readers, animal flashcards, sequence cards' },
        { strand: '4.0 WRITING & GRAMMAR', subs: ['Prepositions & Conjunctions (and, but, because)', 'Describing Words (Adjectives of Size, Shape & Colour)', 'Spelling, Dictation & Guided Paragraph Writing'], kiq: 'How do describing words make our sentences clear and interesting?', resources: 'Classroom realia, word walls, picture composition prompts' },
      ],
    },
  },

  'Kiswahili Language Activities': {
    shortCode: 'KIS-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 KUSIKILIZA NA KUZUNGUMZA', subs: ['Maamkizi na Maagano ya Wakati Mbalimbali', 'Matamshi Bora ya Sauti na Silabi za Kiswahili', 'Msamiati wa Shuleni na Nyumbani'], kiq: 'Tunatumia maneno gani ya adabu tunapowasalimia watu?', resources: 'Kadi za silabi, chati za picha, vifaa vya kidijitali' },
        { strand: '2.0 KUSOMA NA 3.0 KUANDIKA', subs: ['Kusoma Silabi na Maneno Rahisi', 'Kusoma Hadithi Fupi kwa Ufasaha', 'Maumbo Bora ya Herufi Kubwa na Ndogo', 'Nafasi Sahihi Kati ya Maneno'], kiq: 'Tunaunganishaje silabi ili kusoma maneno kwa ufasaha?', resources: 'Vitabu vya hadithi teule, chati ya herufi, madaftari' },
      ],
      2: [
        { strand: '1.0 MWILI WANGU NA USAFI', subs: ['Sehemu za Mwili wa Binadamu', 'Usafi wa Kibinafsi na Mazingira', 'Umoja na Wingi wa Majina (Ngeli ya A-WA na KI-VI)'], kiq: 'Kwa nini ni muhimu kudumisha usafi wa mwili na mazingira?', resources: 'Chati ya mwili, vifaa vya usafi, kadi za maneno' },
        { strand: '4.0 SARUFI NA KUANDIKA', subs: ['Nyakati: Wakati Uliopo (-na-), Uliopita (-li-) na Ujao (-ta-)', 'Ukanushaji Rahisi wa Sentensi', 'Kuandika Sentensi Fupi Zenye Maana'], kiq: 'Tunatambuaje wakati kitendo kilipofanyika katika sentensi?', resources: 'Jedwali la kutunga sentensi, picha za vitendo' },
      ],
      3: [
        { strand: '2.0 HALI YA ANGA NA USALAMA', subs: ['Msamiati wa Hali ya Anga na Mavazi', 'Haki na Usalama wa Mtoto', 'Kusoma Ufahamu na Kujibu Maswali'], kiq: 'Tunajikingaje kutokana na hatari mbalimbali nyumbani na njiani?', resources: 'Picha za hali ya anga, hadithi za watoto, bango la usalama' },
        { strand: '3.0 KUANDIKA NA SARUFI', subs: ['Vivumishi vya Sifa na Idadi', 'Alama za Uakifishaji (Kikomo, Mkato na Kiulizi)', 'Imla na Kuandika Kifungu Fupi cha Maelezo'], kiq: 'Alama za uakifishaji zinatusaidiaje tunaposoma na kuandika?', resources: 'Kadi za alama za uakifishaji, vitabu vya mazoezi' },
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
        { strand: '1.0 SOCIAL ENVIRONMENT', subs: ['Personal Hygiene: Handwashing, Oral Care & Grooming', 'Keeping Our Home, Sleeping Area & Classroom Clean', 'Family Needs, Shelter & Basic Child Rights'], kiq: 'Why must we wash hands with soap and clean running water?', resources: 'Soap, clean water container, toothbrush model, broom, hygiene charts' },
        { strand: '1.0 SAFETY & NEIGHBOURHOOD', subs: ['Safe & Unsafe Places in the Neighbourhood', 'Basic Road Safety Signs & Pedestrian Rules', 'Healthy Habits & Proper Use of Latrines/Toilets'], kiq: 'How do we identify and avoid hazards on our way to school?', resources: 'Road safety posters, picture cards, first-aid display' },
      ],
      2: [
        { strand: '2.0 NATURAL ENVIRONMENT', subs: ['Weather Conditions & Recording a Daily Weather Chart', 'Soil Types (Clay, Loam, Sand), Texture & Modelling', 'Water Sources, Safe Storage & Making Water Safe by Boiling/Filtering'], kiq: 'How can we make water safe for drinking at home?', resources: 'Soil samples, sieves, weather symbols chart, clean cloth filter' },
        { strand: '2.0 PLANTS & ANIMALS', subs: ['Parts of a Plant & Caring for Young Plants', 'Domestic Animals: Products, Shelter & Humane Care', 'Healthy Foods, Food Groups & Balanced Meals'], kiq: 'Why are plants and domestic animals important to our families?', resources: 'Potted seedlings, food group charts, animal flashcards' },
      ],
      3: [
        { strand: '3.0 RESOURCES IN OUR ENVIRONMENT', subs: ['Conserving Water & Switching Off Unused Lights', 'Sources & Safe Use of Light, Heat & Sound', 'Managing Solid Waste: Sorting, Reusing & Recycling'], kiq: 'How can we reduce litter and reuse materials in our school?', resources: 'Sorting bins, recyclable bottles/cartons, torch, safety posters' },
        { strand: '3.0 CARING FOR THE ENVIRONMENT', subs: ['Tree Planting & School Clean-Up Project', 'Good Table Manners & Food Hygiene', 'End-of-Year Practical Environmental Portfolio'], kiq: 'What happens when everyone participates in keeping the school green?', resources: 'Tree seedlings, watering cans, protective gloves' },
      ],
    },
  },

  'Creative Activities': {
    shortCode: 'CREATIVE-ACT',
    strandsByTerm: {
      1: [
        { strand: '1.0 CREATING AND EXECUTING', subs: ['Drawing, Shading & Colouring Simple Forms', 'Locomotor Skills: Hopping, Skipping, Dodging & Galloping', 'Singing Action Songs & Clapping Rhythmic Patterns'], kiq: 'How do we express joy through drawing, singing, and movement?', resources: 'Crayons, drawing books, shakers, drums, open playfield' },
        { strand: '1.0 CRAFT & MODELLING', subs: ['Modelling Pinch Pots & Animals Using Clay/Plasticine', 'Paper Folding, Tearing & Collage Making', 'Throwing, Rolling and Catching Improvised Balls'], kiq: 'Which local materials can we recycle to make safe play items?', resources: 'Clay, old newspapers, sisal strings, safe glue' },
      ],
      2: [
        { strand: '2.0 PERFORMING AND DISPLAYING', subs: ['Kenyan Children Singing Games & Folk Songs', 'Painting & Pattern Printing (Leaf/Block Prints)', 'Gymnastics: Balancing, Forward Rolls & Stretching'], kiq: 'How do we maintain balance and safety during movement games?', resources: 'Water paints, leaves, landing mats, whistles, costumes' },
        { strand: '2.0 RHYTHM & MELODY', subs: ['Improvised Percussion Instruments (Shakers & Drums)', 'Beading & Threading Cultural Ornaments', 'Water Safety Awareness & Pool Hygiene Rules'], kiq: 'How can we create steady rhythms using improvised percussion?', resources: 'Bottle-top shakers, large seeds/beads, threads, charts' },
      ],
      3: [
        { strand: '3.0 APPRECIATION IN CREATIVE ACTIVITIES', subs: ['Performing the Kenya National Anthem with Etiquette', 'Weaving Simple Mats Using Paper/Banana Fibres', 'Mini Class Art Exhibition & Talent Showcase'], kiq: 'Why do we stand at attention when singing the National Anthem?', resources: 'Kenyan flag, woven mat samples, display boards' },
        { strand: '3.0 TEAM GAMES & PORTFOLIO', subs: ['Mini Relay Races & Cooperative Tag Games', 'Critiquing Peers Artwork Kindly', 'Organizing a Personal Creative Portfolio'], kiq: 'How does teamwork make sports and performances enjoyable?', resources: 'Relay batons, cones, learner art folders' },
      ],
    },
  },

  // ================= UPPER PRIMARY & JSS MATHEMATICS (GRADES 4 - 9) =================
  Mathematics: {
    shortCode: 'MATH',
    strandsByTerm: {
      1: [
        { strand: '1.0 NUMBERS', subs: ['Whole Numbers: Place Value & Total Value', 'Reading, Writing & Rounding Off Whole Numbers', 'Divisibility Tests, Factors, GCD & LCM', 'Operations: Addition, Subtraction, Multiplication & Division'], kiq: 'How do place value, LCM, and GCD help solve real-life scheduling and sharing tasks?', resources: 'Place value apparatus, number charts, factor trees, mathematical tables' },
        { strand: '1.0 FRACTIONS & DECIMALS', subs: ['Equivalent & Simplified Fractions', 'Addition, Subtraction & Multiplication of Fractions', 'Decimals: Place Value & Operations', 'Squares, Square Roots & Percentages'], kiq: 'Where are fractions, decimals, and percentages used in trade and science?', resources: 'Fraction strips, hundred-square grids, price catalogues' },
      ],
      2: [
        { strand: '2.0 MEASUREMENT', subs: ['Length (mm, cm, m, km), Perimeter & Circumference', 'Area of Rectangles, Triangles & Combined Shapes', 'Volume & Capacity (cm3, m3, ml & Litres)', 'Mass (g, kg, tonnes) & Time (12-hr / 24-hr Clock)'], kiq: 'Why are standard SI units essential in construction, transport, and farming?', resources: 'Metre rules, tape measures, 1-litre jugs, weighing scales, timetables' },
        { strand: '2.0 MONEY & ALGEBRA', subs: ['Budgets, Profit, Loss, Discount & Tax', 'Forming & Simplifying Algebraic Expressions', 'Linear Equations & Simple Inequalities'], kiq: 'How does preparing a budget promote financial discipline?', resources: 'Sample receipts, price lists, KRA tax awareness charts, beam balance' },
      ],
      3: [
        { strand: '3.0 GEOMETRY', subs: ['Lines, Perpendicular & Parallel Constructions', 'Measuring & Constructing Angles Using a Protractor', 'Properties of Triangles & Quadrilaterals', '3D Solids (Cubes, Cuboids, Cylinders & Pyramids)'], kiq: 'How do architects and carpenters apply geometric constructions?', resources: 'Geometrical sets, protractors, pairs of compasses, 3D nets' },
        { strand: '4.0 DATA HANDLING', subs: ['Collecting Data Using Tally Marks & Frequency Tables', 'Bar Graphs, Pictographs & Line Graphs', 'Interpreting Real-World Statistical Charts'], kiq: 'How do graphs help us make quick decisions from large sets of data?', resources: 'Graph books, census charts, rainfall data tables' },
      ],
    },
    byGrade: {
      4: {
        1: [
          { strand: '1.0 NUMBERS', subs: ['Whole Numbers Up to 99,999: Place Value & Total Value', 'Reading, Writing in Words & Rounding Off to Nearest Ten/Hundred', 'Factors, Multiples & Divisibility Tests (2, 5 & 10)', 'Addition & Subtraction of Up to 5-Digit Whole Numbers'], kiq: 'How do place value and rounding off help estimate quantities in markets?', resources: 'Five-spike abacus, place value charts, number cards, counters' },
          { strand: '1.0 MULTIPLICATION, DIVISION & FRACTIONS', subs: ['Multiplication of 2-Digit by 2-Digit Whole Numbers', 'Division of Up to 2-Digit by 1-Digit Numbers With Remainder', 'Proper, Improper & Mixed Fractions', 'Decimals Up to Hundredths: Place Value, Addition & Subtraction'], kiq: 'Where do we encounter tenths and hundredths in athletics and measurement?', resources: 'Hundred-square grids, fraction circles, multiplication tables' },
        ],
        2: [
          { strand: '2.0 MEASUREMENT', subs: ['Length in Centimetres (cm) & Metres (m); Perimeter of Plane Figures', 'Area of Rectangles & Squares Using Unit Squares and Formula', 'Volume of Cubes & Cuboids by Stacking Unit Cubes', 'Capacity (Litres, 1/2L, 1/4L) & Mass in Kilograms/Half-Kilograms'], kiq: 'How do carpenters and tailors convert between metres and centimetres?', resources: '30-cm rulers, metre sticks, 1-cm unit cubes, graduated jugs, scales' },
          { strand: '2.0 TIME, MONEY & ALGEBRA', subs: ['Time in a.m./p.m., Digital/Analogue Clocks & Duration', 'Kenyan Money: Giving Change, Saving & Needs vs Wants', 'Forming & Simplifying Simple Algebraic Expressions Using Letters'], kiq: 'How can letters represent unknown numbers of fruits or books in baskets?', resources: 'Geared clocks, specimen Kenyan notes, counters & labelled boxes' },
        ],
        3: [
          { strand: '3.0 GEOMETRY', subs: ['Clockwise & Counter-Clockwise Turns; Compass Points (N, S, E, W)', 'Identifying Right, Acute, Obtuse & Reflex Angles', 'Properties of Rectangles, Squares, Triangles & Circles'], kiq: 'Where do we observe right angles, acute angles, and obtuse angles in buildings?', resources: 'Paper right-angle testers, magnetic compass, geometrical cutouts' },
          { strand: '4.0 DATA HANDLING', subs: ['Collecting Classroom Data & Recording Tally Marks', 'Organizing Frequency Tables', 'Interpreting Simple Pictographs & Piling Data'], kiq: 'Why do tally marks in groups of five make counting large surveys fast?', resources: 'Tally charts, manila paper, bottle tops, class survey sheets' },
        ],
      },
      5: {
        1: [
          { strand: '1.0 NUMBERS', subs: ['Whole Numbers Up to 999,999: Place Value, Total Value & Rounding Off', 'Divisibility Tests (3, 4, 6, 8, 9), GCD & LCM', 'Addition & Subtraction of 6-Digit Numbers', 'Multiplication (3-Digit by 2-Digit) & Combined Operations (BODMAS)'], kiq: 'How do GCD and LCM solve real-life packaging and bell-ringing schedules?', resources: 'Six-spike abacus, factor tree charts, BODMAS wall poster' },
          { strand: '1.0 FRACTIONS & DECIMALS', subs: ['Equivalent Fractions, Simplifying & Ordering Fractions', 'Addition & Subtraction of Fractions Using LCM', 'Multiplication of a Fraction by a Whole Number', 'Decimals Up to Thousandths: Place Value, Addition & Subtraction'], kiq: 'Why must fractions share a common denominator before adding or subtracting?', resources: 'Fraction wall strips, place value decimal charts, calculators for checking' },
        ],
        2: [
          { strand: '2.0 MEASUREMENT', subs: ['Length in Kilometres (km) & Metres (m): Conversions & Operations', 'Area of Rectangles and Squares in cm2 & m2', 'Volume of Cubes & Cuboids (V = l x w x h in cm3)', 'Capacity in Litres & Millilitres (ml); Mass in Kilograms & Grams (g)'], kiq: 'How are millilitres and grams used on medicine bottles and food packets?', resources: 'Measuring cylinders, syringes (needleless), kitchen digital scale, metre rules' },
          { strand: '2.0 TIME, MONEY & ALGEBRA', subs: ['Time in Minutes & Seconds; Bus/Train Timetables', 'Household Budgets, Savings, Banking & Introduction to Tax Services', 'Forming & Solving One-Step Linear Equations'], kiq: 'Why do citizens pay taxes to finance roads, hospitals, and schools?', resources: 'SGR/bus timetables, KRA tax education flyers, household budget templates' },
        ],
        3: [
          { strand: '3.0 GEOMETRY', subs: ['Horizontal, Vertical, Perpendicular & Parallel Lines Construction', 'Measuring & Drawing Angles in Degrees Using a Protractor', '3D Objects in the Environment: Cubes, Cuboids, Cylinders, Spheres & Pyramids'], kiq: 'How do we align a protractor baseline accurately to measure an angle?', resources: 'Protractors, set squares, rulers, 3D solid models' },
          { strand: '4.0 DATA HANDLING', subs: ['Drawing & Interpreting Vertical and Horizontal Bar Graphs', 'Piling & Real-Life Survey Data Projects'], kiq: 'How do bar graphs reveal trends in school attendance or rainfall?', resources: 'Squared graph exercise books, rulers, county weather records' },
        ],
      },
      6: {
        1: [
          { strand: '1.0 NUMBERS', subs: ['Whole Numbers Up to Millions: Place Value, Total Value & Rounding Off', 'Squares & Square Roots of Whole Numbers and Fractions', 'Reciprocals, Multiplication & Division of Fractions', 'Decimals Up to Ten-Thousandths & Conversions (Fractions, Decimals, Percentages)'], kiq: 'How do percentages, decimals, and fractions express the same value in trade?', resources: 'Million place-value chart, square grid paper, discount catalogues' },
          { strand: '2.0 MEASUREMENT (LENGTH, AREA & VOLUME)', subs: ['Millimetres (mm), Circumference of Circles (C = pi x d)', 'Area of Triangles (1/2 bh) & Combined Rectilinear Shapes', 'Capacity & Volume Relationship (1,000 cm3 = 1 Litre; m3)'], kiq: 'How do plumbers and water engineers relate cubic centimetres to litres?', resources: 'Vernier/mm rulers, cylindrical tins, strings, 1-litre calibrated cube' },
        ],
        2: [
          { strand: '2.0 MASS, TIME, SPEED & MONEY', subs: ['Mass in Tonnes (t), Kilograms (kg) & Grams (g)', '12-Hour and 24-Hour Clock Systems & Speed (km/h, m/s)', 'Price Lists, Budgets, Profit, Loss & Value Added Tax (VAT)'], kiq: 'How is the 24-hour clock used in aviation, hospitals, and transport?', resources: 'Flight/SGR 24-hr schedules, stopwatches, ETR receipts showing 16% VAT' },
          { strand: '3.0 ALGEBRA', subs: ['Forming & Simplifying Algebraic Inequalities', 'Solving & Representing Simple Inequalities on a Number Line'], kiq: 'How do inequalities represent speed limits and maximum load capacities?', resources: 'Road sign charts (50 km/h, 10 tonnes), number line strips' },
        ],
        3: [
          { strand: '4.0 GEOMETRY', subs: ['Bisecting Lines & Constructing Perpendiculars Using Ruler and Compass', 'Angles on a Straight Line, Vertically Opposite & Interior Angles of Triangles', 'Faces, Edges, Vertices & Nets of 3D Solids'], kiq: 'How do packaging designers fold flat cardboard nets into 3D cartons?', resources: 'Pairs of compasses, protractors, manila carton nets, scissors' },
          { strand: '5.0 DATA HANDLING (KPSEA SYNTHESIS)', subs: ['Drawing & Interpreting Bar Graphs and Line Graphs', 'Integrated KPSEA Competency Problem-Solving Practice'], kiq: 'How do line graphs track patient temperature or crop growth over time?', resources: 'Graph paper, hospital temperature charts, KPSEA sample tasks' },
        ],
      },
      7: {
        1: [
          { strand: '1.0 NUMBERS', subs: ['Whole Numbers Up to Hundreds of Millions: Place Value, Rounding & Operations', 'Prime Factorization, GCD & LCM in Real-Life Contexts', 'Fractions & Decimals: Combined Operations (BODMAS) & Recurring Decimals', 'Squares & Square Roots Using Factorization and Mathematical Tables'], kiq: 'How do prime factorization and BODMAS ensure accuracy in scientific computation?', resources: 'KLB/KNEC Mathematical Tables, place value charts, fraction models' },
          { strand: '2.0 ALGEBRA', subs: ['Forming & Simplifying Algebraic Expressions (Grouping Like Terms & Brackets)', 'Forming & Solving Linear Equations in One Unknown', 'Forming & Graphing Simple Linear Inequalities'], kiq: 'How do algebraic equations model real-world business and science unknowns?', resources: 'Algebra tiles, balance scale model, squared exercise books' },
        ],
        2: [
          { strand: '3.0 MEASUREMENTS', subs: ['Pythagorean Relationship (a2 + b2 = c2) & Applications', 'Length, Perimeter & Area of Polygons, Circles, Sectors & Borders', 'Volume & Capacity of Cuboids, Cylinders & Triangular Prisms', 'Time, Distance, Average Speed, Temperature (Celsius & Kelvin) & Money (Profit, Loss, Discount, Commission, VAT)'], kiq: 'How do builders use the 3-4-5 Pythagorean triangle to set square corners?', resources: 'Knotted 3-4-5 builder rope, thermometers, cylinders, ETR/commission sheets' },
        ],
        3: [
          { strand: '4.0 GEOMETRY', subs: ['Angle Properties of Parallel Lines, Transversals & Polygons', 'Geometrical Constructions: Bisectors, Special Angles (30, 45, 60, 90) & Triangles', 'Nets & Surface Area Intro of Cubes, Cuboids, Cylinders & Pyramids'], kiq: 'Why is compass-and-straightedge construction more exact than freehand drawing?', resources: 'Geometrical sets, chalkboard compass/protractor, 3D wireframe solids' },
          { strand: '5.0 DATA HANDLING AND PROBABILITY', subs: ['Data Collection, Frequency Distribution Tables & Choosing Scales', 'Pictographs, Bar Graphs, Pie Charts & Travel/Line Graphs'], kiq: 'How do pie charts represent county budget allocations proportionally?', resources: 'Protractors for pie sectors, graph books, KNBS county statistics' },
        ],
      },
      8: {
        1: [
          { strand: '1.0 NUMBERS', subs: ['Integers: Number Line Representation & Combined Operations', 'Fractions & Decimals: Order of Operations & Standard Form', 'Squares, Square Roots, Rates, Ratio, Proportions & Percentages', 'Indices & Common Logarithms (Base 10) Reading'], kiq: 'How do negative integers represent altitude below sea level and bank overdrafts?', resources: 'Integer number lines, 4-figure mathematical tables, scientific charts' },
          { strand: '2.0 ALGEBRA', subs: ['Matrices: Order, Elements, Compatibility, Addition & Subtraction', 'Equations of Straight Lines (Gradient m & y = mx + c)', 'Simultaneous Linear Equations (Elimination, Substitution & Graphical)', 'Linear Inequalities in One and Two Unknowns'], kiq: 'How do matrices organize multi-branch inventory and tournament standings?', resources: 'Spreadsheet grids, Cartesian graph boards, rulers' },
        ],
        2: [
          { strand: '3.0 MEASUREMENTS', subs: ['Area of Circles, Sectors, Segments & Irregular Shapes', 'Surface Area of Cubes, Cuboids, Cylinders, Triangular Prisms & Pyramids', 'Volume & Capacity of Frustums/Cylinders/Prisms', 'Commercial Arithmetic: Hire Purchase, Simple Interest, Appreciation & Currency Exchange'], kiq: 'When is hire purchase more expensive than saving for cash purchase?', resources: 'CBK foreign exchange boards, hire-purchase catalogues, 3D solid models' },
        ],
        3: [
          { strand: '4.0 GEOMETRY', subs: ['Cartesian Plane Coordinates & Scale Drawing (Bearings & Angles of Elevation/Depression)', 'Common Solids: Nets, Skew Lines & Accurate Isometric Sketches', 'Geometric Transformations: Reflection, Rotation & Translation'], kiq: 'How do surveyors and pilots use true bearings and angles of elevation?', resources: 'Magnetic compasses, clinometers, tracing paper, graph books' },
          { strand: '5.0 DATA HANDLING AND PROBABILITY', subs: ['Discrete Data: Mean, Mode & Median', 'Experimental & Theoretical Probability (Coins, Dice, Cards & Mutually Exclusive Events)'], kiq: 'How does probability guide weather forecasting and insurance risk?', resources: 'Fair dice, coins, spinners, weather forecast bulletins' },
        ],
      },
      9: {
        1: [
          { strand: '1.0 NUMBERS', subs: ['Combined Operations on Integers, Cubes & Cube Roots (Factorization & Tables)', 'Laws of Indices (Positive, Zero, Negative & Fractional Indices) & Logarithms', 'Compound Proportions & Rates of Work / Mixtures'], kiq: 'How do compound proportions determine workforce and time on engineering projects?', resources: '4-figure mathematical tables, calculators, project work-rate worksheets' },
          { strand: '2.0 ALGEBRA', subs: ['Matrix Multiplication (Row-by-Column) & Real-Life Costing', 'Equations of Straight Lines: Parallel & Perpendicular Gradients (m1.m2 = -1)', 'Graphical Regions of Linear Inequalities & Quadratic Expressions Intro'], kiq: 'How does matrix multiplication compute total revenue across multiple products?', resources: 'Cartesian graph books, matrix costing tables, set squares' },
        ],
        2: [
          { strand: '3.0 MEASUREMENTS', subs: ['Area of Pentagons, Hexagons & Surface Area/Volume of Cones, Spheres & Hemispheres', 'Mass, Volume, Density & Relative Density Calculations', 'Time Zones (Longitude & GMT/UTC) & Speed-Time Graphs', 'Commercial Arithmetic: Compound Interest, Income Tax (PAYE) & Commission'], kiq: 'How do longitude differences determine local time across world cities?', resources: 'World globe with meridians, KRA PAYE tax bands, cone/sphere models' },
        ],
        3: [
          { strand: '4.0 GEOMETRY & TRIGONOMETRY', subs: ['Coordinates, Scale Drawing & Survey Triangulation/Offsets', 'Similarity, Linear/Area/Volume Scale Factors & Enlargement', 'Trigonometric Ratios (Sine, Cosine & Tangent) in Right-Angled Triangles'], kiq: 'How does trigonometry calculate heights of towers and widths of rivers indirectly?', resources: 'Clinometers, tape measures, trigonometric tables, graph paper' },
          { strand: '5.0 DATA HANDLING & KJSEA PROBABILITY', subs: ['Grouped Frequency Tables: Modal Class, Mean & Median Estimation', 'Histograms, Frequency Polygons & Combined Probability Events'], kiq: 'How do grouped data histograms inform national demographic planning?', resources: 'Graph books, census age-group tables, KJSEA revision sets' },
        ],
      },
    },
  },

  English: {
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
    byGrade: {
      7: {
        1: [
          { strand: '1.0 PERSONAL RESPONSIBILITY, SCIENCE & HYGIENE', subs: ['Conversational Skills: Polite Turn-Taking & Vowel/Consonant Contrasts', 'Intensive Reading: Trickster & Ogre Narratives and Factual Passages', 'Word Classes: Common, Proper, Concrete, Abstract & Count/Non-Count Nouns', 'Handwriting Legibility, Punctuation & Narrative Paragraph Sequencing'], kiq: 'How do polite turn-taking and clear paragraphing strengthen communication?', resources: 'JSS Oral Literature anthology, Oxford/Longman dictionaries, sample narratives' },
          { strand: '2.0 LEADERSHIP, FAMILY & DRUG ABUSE PREVENTION', subs: ['Listening for Main Ideas & Specific Details; Word Stress', 'Personal, Possessive & Reflexive Pronouns; Simple Present & Past Tenses', 'Reading JSS Graded Readers: Characters & Moral Lessons', 'Functional Writing: Friendly Letters, Apology Notes & Packing Lists'], kiq: 'How do character choices in stories mirror youth decisions in real life?', resources: 'KICD-approved Grade 7 class reader, grammar charts, letter templates' },
        ],
        2: [
          { strand: '3.0 NATURAL RESOURCES, TRAVEL & HEROES', subs: ['Oral Poetry, Lullabies & Praise Songs Performance', 'Continuous & Perfect Aspects; Gradable/Non-Gradable Adjectives & Order of Adjectives', 'Adverbs of Manner, Time, Place & Frequency; Prepositions', 'Creative Writing: Descriptive Essays & Pictorial Compositions'], kiq: 'How do sensory adjectives and adverbs bring descriptive writing to life?', resources: 'Recorded African songs, travel brochures, descriptive writing rubrics' },
        ],
        3: [
          { strand: '4.0 MUSIC, PROFESSIONS & TRADITIONAL FASHION', subs: ['Interviews, Non-Verbal Cues & Giving Clear Directions', 'Coordinating & Subordinating Conjunctions; Synonyms, Antonyms & Phrasal Verbs', 'Analyzing Simple Poems (Stanzas, Rhyme & Message)', 'Writing Personal Diaries, Dialogue Scripts & Posters'], kiq: 'Why are non-verbal cues like eye contact and posture vital during interviews?', resources: 'Poetry booklets, interview role-play cards, sample journals' },
        ],
      },
      8: {
        1: [
          { strand: '1.0 HUMAN RIGHTS, SCIENTIFIC INNOVATIONS & POLLUTION', subs: ['Telephone Etiquette, Intonation & Diphthongs Pronunciation', 'Intensive Reading: Etiological Myths, Legends & Environmental Texts', 'Primary & Modal Auxiliaries; Collective & Compound Nouns', 'Writing Mechanics: Commonly Misspelt Words, Prefixes/Suffixes & Narrative Essays'], kiq: 'How do modal auxiliaries express obligation, permission, and possibility?', resources: 'Myths/legends anthology, dictionaries, environmental articles' },
          { strand: '2.0 CONSUMER ROLES, RELATIONSHIPS & REHABILITATION', subs: ['Active Listening, Polite Disagreement & Conversational Repairs', 'Indefinite & Interrogative Pronouns; Present/Past Perfect Continuous', 'Intensive Study of Approved Grade 8 Short Story / Play (Plot & Conflict)', 'Functional Writing: Formal Letters of Inquiry, Complaint & Thank-You Notes'], kiq: 'How do we express disagreement politely in formal discussions?', resources: 'Approved Grade 8 class play/reader, consumer rights pamphlets, formal letter charts' },
        ],
        2: [
          { strand: '3.0 NATURAL RESOURCES (WILDLIFE), TOURISM & HEROES', subs: ['Riddles, Proverbs, Tongue Twisters & Dramatic Choral Verse', 'Complex Prepositions, Subordinating Conjunctions & Adjectival Phrases', 'Active and Passive Voice Transformations', 'Writing Notices, Agendas & Minutes of Club Meetings'], kiq: 'Why must club secretaries record accurate agendas and minutes?', resources: 'Sample school club minutes, wildlife magazines, grammar workbooks' },
        ],
        3: [
          { strand: '4.0 ART, CHOOSING A CAREER & MODERN FASHION', subs: ['Job Interviews, Impromptu Speeches & Negotiating Skills', 'Phrasal Verbs, Similes, Metaphors & Idiomatic Expressions', 'Character Traits, Themes & Style in Grade 8 Play/Novella', 'Writing Personal Journals, Recipes & Expository Essays'], kiq: 'How do writers use figurative language to deepen themes in plays?', resources: 'Grade 8 approved play, career brochures, expository essay models' },
        ],
      },
      9: {
        1: [
          { strand: '1.0 CITIZENSHIP, SCIENCE FICTION & ENVIRONMENTAL CONSERVATION', subs: ['Eradicating Mother-Tongue Interference, Stress Shifts & Public Debate', 'Critical Reading, Note-Making & Summary Writing Skills', 'Relative Pronouns, Relative Clauses & Determiners/Quantifiers', 'Descriptive & Imaginative Essays Using Sensory Imagery'], kiq: 'How do relative clauses combine ideas concisely in academic writing?', resources: 'Approved Grade 9 Novella/Play, summary passages, debate scorecards' },
          { strand: '2.0 CONSUMER LAWS, RELATIONSHIPS & LEISURE', subs: ['Negotiation, Empathy & Conflict-Resolution Dialogues', 'Conditional Clauses (Zero, First, Second & Third Conditionals)', 'Direct and Indirect (Reported) Speech Transformations', 'Functional Writing: Formal Application Letters, Curriculum Vitae (CV) & Emails'], kiq: 'What elements make a formal job/scholarship application letter and CV persuasive?', resources: 'Sample CVs, Consumer Protection Act excerpts, grammar charts' },
        ],
        2: [
          { strand: '3.0 MARINE LIFE, TOURISM & WORLD HEROES', subs: ['Oral Reports, News Broadcasts & Oral Literature Fieldwork Analysis', 'Question Tags, Inversion for Emphasis & Complex Sentences', 'Deep Literary Analysis of Grade 9 Novella/Play: Plot, Themes, Style & Characterisation', 'Writing Speeches, Book Reviews & Investigative Reports'], kiq: 'How do stylistic devices advance moral and social themes in set texts?', resources: 'Approved Grade 9 Novella/Play, literary guide, sample speeches' },
        ],
        3: [
          { strand: '4.0 PERSONAL GROOMING, SPORTS ETHICS & KJSEA SYNTHESIS', subs: ['Symposium Presentations & Panel Discussions', 'Idioms, Collocations, Register & Cloze Test Mastery', 'Poetic Persona, Tone, Mood, Alliteration & Assonance', 'Autobiographies, Biographies & Timed KJSEA Composition/Paper Practice'], kiq: 'How do tone and mood shape a reader’s emotional response to poetry?', resources: 'Poetry anthology, KJSEA specimen papers & marking rubrics' },
        ],
      },
      10: {
        1: [
          { strand: '1.0 ADVANCED ORAL COMMUNICATION, LISTENING & CRITICAL READING', subs: ['Phonemic Transcription (IPA),Connected Speech, Stress & Intonation', 'Critical Comprehension, Inference, Tone & Vocabulary in Context', 'Noun Phrases, Pronominal Reference, Aspect & Modality in Discourse'], kiq: 'How does phonemic awareness sharpen spoken clarity in academic and professional settings?', resources: 'Advanced learner dictionaries (with IPA), recorded speeches, Senior English reader' },
        ],
        2: [
          { strand: '2.0 ORAL LITERATURE, SET TEXT INTRODUCTION & FUNCTIONAL WRITING', subs: ['Classification, Performance & Fieldwork Ethics in Oral Literature', 'Adjectival/Adverbial Clauses, Coordination, Subordination & Cohesion', 'Functional Writing: Memoranda (Memos), Official Notices, Agendas & Minutes'], kiq: 'Why is ethical fieldwork essential when documenting community oral traditions?', resources: 'Oral literature fieldwork guides, corporate memo/minutes samples' },
        ],
        3: [
          { strand: '3.0 POETRY APPRECIATION, CREATIVE & EXPOSITORY WRITING', subs: ['Elements of Poetry: Persona, Imagery, Rhythm, Rhyme & Sound Devices', 'Direct/Reported Speech, Register Shifts & Editing/Proofreading', 'Expository, Argumentative & Reflective Essay Writing'], kiq: 'How do logical transitions and evidence build a compelling argumentative essay?', resources: 'East African poetry anthology, essay rubrics, newspaper editorials' },
        ],
      },
      11: {
        1: [
          { strand: '1.0 PUBLIC DISCOURSE, INTENSIVE LITERARY STUDY & SYNTAX', subs: ['Parliamentary/Academic Debate, Panel Moderation & Persuasive Rhetoric', 'Intensive Analysis of Senior School Novel: Plot, Characterisation & Themes', 'Complex Sentence Transformations, Inversion, Cleft Sentences & Ellipsis'], kiq: 'How do novelists construct multi-dimensional characters to critique society?', resources: 'KICD Approved Grade 11 Set Novel, rhetoric guides, syntax charts' },
        ],
        2: [
          { strand: '2.0 DRAMA ANALYSIS, RESEARCH SUMMARY & PROFESSIONAL WRITING', subs: ['Dramatic Techniques in Senior School Play: Irony, Soliloquy, Stage Directions & Conflict', 'Information Synthesis, Paraphrasing & Précis / Summary Writing', 'Professional Writing: Project Proposals, Investigative Reports & Formal Emails'], kiq: 'How does dramatic irony heighten tension between characters and audience?', resources: 'KICD Approved Grade 11 Set Play, sample proposals & formal reports' },
        ],
        3: [
          { strand: '3.0 SHORT STORIES, MEDIA LITERACY & CREATIVE PORTFOLIO', subs: ['Thematic & Stylistic Study of Approved Short Story Anthology', 'Critical Media Literacy: Detecting Bias, Fallacies & Disinformation', 'Creative Short Story Crafting, Reviews & Speech Writing'], kiq: 'How can readers distinguish factual journalism from persuasive propaganda?', resources: 'Approved Short Story Anthology, print/digital media samples' },
        ],
      },
      12: {
        1: [
          { strand: '1.0 COMPARATIVE LITERATURE, ADVANCED POETRY & STYLISTICS', subs: ['Comparative Thematic Synthesis Across Novel, Play & Short Stories', 'Advanced Unseen Poetry: Ambiguity, Symbolism, Satire & Tone Shifts', 'Advanced Grammar: Discourse Markers, Register Precision & Idiomatic Mastery'], kiq: 'How do satire and symbolism expose societal contradictions across genres?', resources: 'Approved Senior Set Texts, unseen poetry collections, stylistic guides' },
        ],
        2: [
          { strand: '2.0 INSTITUTIONAL WRITING, DIPLOMATIC COMMUNICATION & RESEARCH', subs: ['Executive Summaries, Policy Briefs, Reference Letters & CVs', ' Formal Interviews, Etiquette & Cross-Cultural Communication', 'Synthesizing Multi-Source Comprehension & Summary Passages'], kiq: 'What distinguishes an executive policy brief from a general academic essay?', resources: 'Sample policy briefs, executive CVs, interview evaluation rubrics' },
        ],
        3: [
          { strand: '3.0 SENIOR SCHOOL CBE ASSESSMENT SYNTHESIS & PORTFOLIO', subs: ['Timed Essay Planning: Narrative, Descriptive, Discursive & Set-Text Essays', 'Integrated Grammar, Cloze, Oral Skills & Functional Writing Mastery'], kiq: 'How do precision, coherence, and textual evidence elevate summative literary essays?', resources: 'KNEC Senior School Assessment guides, model scripts & rubrics' },
        ],
      },
    },
  },

  Kiswahili: {
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
        { strand: '6.0 UFUPISHO NA MARUDIO YA MTIHANI', subs: ['Kusoma kwa Mapana (Novela / Tamthilia ya Ngazi Husika)', 'Kuandika Shajara, Ratiba na Insha ya Mazungumzo', 'Uchambuzi wa Maswali ya Sarufi na Matumizi ya Lugha'], kiq: 'Kusoma vitabu vya ziada kunakuza vipi uwezo wa kujieleza?', resources: 'Vitabu teule vya kusoma kwa mapana, karatasi za tathmini' },
      ],
    },
    byGrade: {
      7: {
        1: [
          { strand: '1.0 USAFI WA KIBINAFSI NA LISHE BORA', subs: ['Kusikiliza na Kuzungumza: Sauti Tata (/b/ na /mb/, /d/ na /nd/, /g/ na /ng/)', 'Kusoma kwa Ufahamu na Kusoma kwa Mapana (Matini za Afya)', 'Sarufi: Nomino za Pekee, Kawaida, Makundi, Dhahania na Wingi', 'Kuandika: Viakifishi na Insha ya Masimulizi Yenye Mvuto'], kiq: 'Matamshi sahihi ya sauti tata yanasaidiaje kuepuka utata wa maana?', resources: 'Kamusi ya Kiswahili Sanifu, chati ya sauti tata, kielelezo cha insha' },
          { strand: '2.0 UHURU WA WANYAMA NA AINA ZA MALIASILI', subs: ['Fasihi Simulizi: Maana, Dhima na Tanzu za Hadithi (Ngano za Wanyama na Mazimwi)', 'Upatanisho wa Kisintaksia: Ngeli za A-WA, U-I, LI-YA na KI-VI', 'Nyakati na Hali (-na-, -li-, -ta- na ukanushaji wake)', 'Insha za Kiuamilifu: Barua ya Kirafiki na Orodha ya Manunuzi'], kiq: 'Hadithi za fasihi simulizi zina nafasi gani katika kukuza maadili ya vijana?', resources: 'Kitabu cha ngano teule, jedwali la ngeli, vielelezo vya barua' },
        ],
        2: [
          { strand: '3.0 UNYANYASAJI WA KIJINSIA NA USALAMA SHULENI', subs: ['Mazungumzo yenye Adabu na Kusikiliza kwa Makini', 'Ngeli za I-ZI, U-ZI na U-YA; Vitenzi Vikuu na Visaidizi', 'Utangulizi wa Novela Teule ya Gredi ya 7 (Dhamira na Wahusika)', 'Kuandika: Insha ya Maelezo na Matangazo Fupi'], kiq: 'Tunawezaje kutumia lugha ya staha kukabiliana na unyanyasaji wa kijinsia?', resources: 'Novela teule ya Gredi ya 7 iliyoidhinishwa na KICD, mabango ya usalama' },
        ],
        3: [
          { strand: '4.0 HUDUMA ZA KIJAMII NA TEKNOLOJIA', subs: ['Nyimbo za Kazi, Bembelezi na Mighani katika Fasihi Simulizi', 'Vivumishi (vya Sifa, Idadi, Kumiliki na Kuonyesha) na Vielezi', 'Ushairi Mwepesi: Mishororo, Beti na Vina', 'Kuandika Shajara, Ratiba na Barua Pepe Rahisi'], kiq: 'Teknolojia ya kidijitali inarahisishaje mawasiliano rasmi ya Kiswahili?', resources: 'Diwani fupi ya mashairi, kompyuta/simu tamba, mifano ya shajara' },
        ],
      },
      8: {
        1: [
          { strand: '1.0 USAFI WA SEHEMU ZA UMMA NA MATUMIZI YA DAWA', subs: ['Mahojiano Rasmi na Matamshi ya Sauti (/ch/ na /sh/, /l/ na /r/)', 'Kusoma kwa Kina: Ufupisho wa Habari na Msamiati wa Afya', 'Ngeli za KU na PA-KU-MU; Viwakilishi vya Nafsi, Kuonyesha na Viulizi', 'Kuandika: Barua Rasmi ya Kuomba Ruhusa au Msamaha'], kiq: 'Ni mambo gani yanayotofautisha barua rasmi na barua ya kirafiki?', resources: 'Kamusi ya Kiswahili, vielelezo vya barua rasmi, makala ya afya' },
          { strand: '2.0 MABADILIKO YA TABIANCHI NA UTUNZAJI WA WANYAMA', subs: ['Fasihi Simulizi: Miviga, Maigizo, Methali na Vitendawili', 'Mnyambuliko wa Vitenzi (Kauli ya Kutenda, Kutendea, Kutendwa na Kutendeka)', 'Hali ya -me-, -ki-, -ka- na Mazoea (hu-)', 'Uhakiki wa Tamthilia Teule ya Gredi ya 8 (Msuko na Migogoro)'], kiq: 'Tamthilia inaonyeshaje migogoro ya kijamii na suluhisho lake?', resources: 'Tamthilia teule ya Gredi ya 8 iliyoidhinishwa na KICD, chati ya kauli' },
        ],
        2: [
          { strand: '3.0 UTATUZI WA MIZOZO NA UWAJIBIKAJI WA KIFEDHA', subs: ['Majadiliano na Uzungumzaji wa Papo kwa Hapo', 'Viunganishi, Vihusishi, Vihisishi na Kinyume cha Maneno', 'Usemi Halisi na Usemi wa Taarifa', 'Insha za Kiuamilifu: Hotuba, Dayalojia na Tahadhari'], kiq: 'Mazungumzo ya amani yanasaidiaje kutatua mizozo shuleni na katika jamii?', resources: 'Tamthilia teule, kadi za majadiliano, vielelezo vya hotuba' },
        ],
        3: [
          { strand: '4.0 MAADILI YA KITAIFA NA BIASHARA MTANDAONI', subs: ['Uchambuzi wa Wahusika na Mbinu za Lugha katika Tamthilia Teule', 'Ukubwa, Udogo na Wastani wa Nomino', 'Ushairi: Mashairi ya Arudhi na Mashairi Huru', 'Kuandika Insha ya Methali na Ripoti Fupi'], kiq: 'Insha ya methali inajengwaje ili kisa kioane na maana ya ndani ya methali?', resources: 'Diwani ya mashairi, kitabu cha methali, kielelezo cha ripoti' },
        ],
      },
      9: {
        1: [
          { strand: '1.0 USAFI WA MAZINGIRA, MAendeleo YA KIUCHUMI NA HAKI', subs: ['Mjadala Rasmi na Uwasilishaji wa Hoja kwa Ufasaha', 'Kusoma kwa Uchambuzi na Mbinu za Kufupisha Kifungu (Ufupisho)', 'Uchanganuzi wa Sentensi: Sentensi Sahili, Ambatano na Changamano', 'Insha za Kiuamilifu: Kumbukumbu za Mkutano na Ajenda'], kiq: 'Kwa nini ufupisho unahitaji kudumisha hoja kuu bila kubadili maana ya mwandishi?', resources: 'Vielelezo vya kumbukumbu za mkutano, makala ya magazeti, kamusi' },
          { strand: '2.0 UTAIFA, UADILIFU NA TEKNOLOJIA YA HABARI', subs: ['Fasihi Simulizi: Ngomezi, Ulumbi, Lakabu na Misimu', 'Vishazi Huru na Vishazi Tegemezi; Shamirisho (Kipozi, Kitondo, Ala) na Chagizo', 'Uhakiki wa Kina wa Novela/Tamthilia Teule ya Gredi ya 9', 'Kuandika Tawasifu, Wasifu na Barua ya Kuomba Kazi'], kiq: 'Tawasifu na wasifu zinatofautianaje kimuundo na kinafsi?', resources: 'Kitabu teule cha fasihi cha Gredi ya 9 (KICD), jedwali la vishazi' },
        ],
        2: [
          { strand: '3.0 UTALII, AFYA YA AKILI NA UJASIRIAMALI', subs: ['Ukusanyaji na Uhifadhi wa Tanzu za Fasihi Simulizi Nyanjani', 'Mofimu (Mzizi na Viambishi), Uundaji wa Nomino na Mnyambuliko Mpana', 'Mbinu za Sanaa na Tamathali za Usemi katika Kitabu Teule', 'Insha za Kiuamilifu: Risala, Tangazo Rasmi na Hojaji'], kiq: 'Tamathali za usemi zinachangiaje ujumbe mzito katika kazi ya fasihi?', resources: 'Kitabu teule cha Gredi ya 9, fomu za hojaji, vielelezo vya risala' },
        ],
        3: [
          { strand: '4.0 URAIA WA KImataifa NA MAANDALIZI YA KJSEA', subs: ['Uchambuzi wa Mashairi (Bahari, Muundo, Lugha ya Kishairi na Uhuru wa Mshairi)', 'Marudio Jumuishi ya Sarufi, Isimujamii (Sajili za Lugha) na Fasihi', 'Kuandika Insha za Hoja, Maelezo ya Kina na Masimulizi (KJSEA)'], kiq: 'Sajili ya lugha hubadilikaje kulingana na muktadha wa hospitalini, mahakamani au sokoni?', resources: 'Karatasi za kielelezo za KJSEA, diwani ya mashairi, kamusi' },
        ],
      },
      10: {
        1: [
          { strand: '1.0 FONOLOJIA, ISIMUJAMII NA KUSOMA KWA UCHAMBUZI', subs: ['Ainisho la Sauti za Kiswahili (Irabu na Konsonanti: Mahali na Jinsi ya Kutamka)', 'Isimujamii: Sajili za Kidini, Kisiasa, Biashara na Sheria', 'Mofolojia: Aina za Mofimu, Viambishi Awali na Tamati & Uainishaji wa Maneno', 'Ufupisho na Ufahamu wa Matini Changamano'], kiq: 'Ujuzi wa fonolojia na sajili za lugha unamsaidiaje mzungumzaji katika miktadha rasmi?', resources: 'Kamusi Kuu ya Kiswahili, chati ya ala za matamshi, matini za sajili' },
        ],
        2: [
          { strand: '2.0 FASIHI SIMULIZI NA RIWAYA TEULE YA SHULE YA UPILI', subs: ['Nadharia, Sifa na Utafiti wa Nyanjani katika Fasihi Simulizi', 'Sintaksia: Virai (RN, RT, RV, RE, RH) na Vishazi', 'Utangulizi na Uhakiki wa Riwaya Teule (Dhamira, Maudhui na Wahusika)', 'Insha za Kiuamilifu: Barua Rasmi kupitia Mkuu wa Taasisi, Memo na Ratiba'], kiq: 'Utafiti wa nyanjani unakumbwa na changamoto gani na hutatuliwaje?', resources: 'Riwaya Teule iliyoidhinishwa na KICD (Gredi 10), mwongozo wa nyanjani' },
        ],
        3: [
          { strand: '3.0 USHAIRI WA ARUDHI NA UANDISHI WA UBUNIFU', subs: ['Arudhi za Ushairi wa Kiswahili (Vina, Mizani, Kibwagizo na Bahari)', 'Nyakati, Hali na Mnyambuliko wa Vitenzi vya Kiarabu na Kibantu', 'Uandishi wa Insha za Hoja, Mdahalo na Masimulizi ya Kiubunifu'], kiq: 'Kanuni za arudhi zina nafasi gani katika urembo wa ushairi wa Kiswahili?', resources: 'Diwani ya Mashairi (KICD), vielelezo vya insha za hoja' },
        ],
      },
      11: {
        1: [
          { strand: '1.0 HISTORIA YA KISWAHILI, TAMTHILIA TEULE NA SINTAKSIA', subs: ['Chimbuko, Maendeleo na Usanifishaji wa Kiswahili Afrika Mashariki', 'Uchanganuzi wa Sentensi kwa Njia ya Mishale, Visanduku na Matawi', 'Uhakiki wa Kina wa Tamthilia Teule (Ploti, Migogoro, Wahusika na Mbinu)', 'Insha za Kiuamilifu: Kumbukumbu Rasmi, Ripoti ya Uchunguzi na Hotuba'], kiq: 'Kiswahili kilikua na kuenea vipi kutoka pwani hadi bara la Afrika Mashariki?', resources: 'Tamthilia Teule iliyoidhinishwa na KICD (Gredi 11), ramani ya historia ya Kiswahili' },
        ],
        2: [
          { strand: '2.0 HADITHI FUPI, SEMANTIKIA NA MAWASILIANO YA KITAALUMA', subs: ['Uhakiki wa Diwani ya Hadithi Fupi Teule (Maudhui na Fani)', 'Shamirisho, Chagizo, Uakifishaji Mkuu na Usemi wa Taarifa', 'Uandishi wa Pendekezo la Mradi, Tawasifu/Wasifu na Hojaji'], kiq: 'Hadithi fupi inatofautianaje na riwaya kimuundo na kimaudhui?', resources: 'Diwani ya Hadithi Fupi (KICD), vielelezo vya ripoti na miradi' },
        ],
        3: [
          { strand: '3.0 USHAIRI HURU NA WA KISASA & FASIHI SIMULIZI (MAIGIZO)', subs: ['Ulinganishi wa Mashairi ya Arudhi na Mashairi Huru (Mavue)', 'Tanzu za Maigizo, Mazungumzo na Semi katika Fasihi Simulizi', 'Insha za Methali, Tahariri ya Gazeti na Mahojiano'], kiq: 'Uhuru wa mshairi (inkisari, mazida, tabdila, utohozi) hutumiwa kwa madhumuni gani?', resources: 'Diwani za ushairi, magazeti ya Kiswahili (Taifa Leo)' },
        ],
      },
      12: {
        1: [
          { strand: '1.0 ULINGANISHI WA VITABU TEULE, ISIMUJAMII NA SARUFI KUU', subs: ['Ulinganishi wa Maudhui na Fani katika Riwaya, Tamthilia na Hadithi Fupi Teule', 'Changamoto za Kiswahili Kitaifa/Kimataifa na Sera ya Lugha nchini Kenya', 'Udodosaji wa Makosa ya Kisarufi, Kimantiki na Kimtindo'], kiq: 'Katiba ya Kenya 2010 inaipa Kiswahili hadhi na majukumu gani kitaifa?', resources: 'Vitabu vyote teule vya Shule ya Upili (KICD), Katiba ya Kenya' },
        ],
        2: [
          { strand: '2.0 USHAIRI CHANGAMANO NA INSHA ZA KITAASISI', subs: ['Uchambuzi wa Mashairi ya Tasfida, Mafumbo na Toni/Mood', 'Insha za Kiuamilifu: Tathmini ya Kitabu (Resensi), Risala, Ilani na Wasifu wa Kazi (CV)', 'Mbinu Bora za Kujibu Ufahamu na Ufupisho wa Kiwango cha Juu'], kiq: 'Resensi ya kitabu inamsaidiaje msomaji kutathmini ubora wa kazi ya fasihi?', resources: 'Diwani za ushairi, vielelezo vya insha za kitaasisi' },
        ],
        3: [
          { strand: '3.0 MTIHANI MKUU WA KUMALIZA SHULE YA UPILI (CBE SYNTHESIS)', subs: ['Mkakati wa Kujibu Maswali ya Muktadha na Insha za Fasihi', 'Mazoezi Jumuishi ya Lugha, Isimujamii, Fasihi Simulizi na Uandishi wa Insha'], kiq: 'Mpangilio mzuri wa hoja na mifano mahsusi huinua vipi alama za mtahiniwa?', resources: 'Karatasi za Mfano za KNEC CBE, miongozo ya usahihishaji' },
        ],
      },
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
    byGrade: {
      4: {
        1: [
          { strand: '1.0 LIVING THINGS AND THEIR ENVIRONMENT', subs: ['Characteristics of Plants as Living Things & Safety When Handling Plants', 'Characteristics of Animals: Vertebrates vs Invertebrates', 'Human Digestive System: Parts (Mouth to Anus), Functions & Healthy Teeth'], kiq: 'How does each part of the human digestive system break down food?', resources: 'Potted plants, hand lenses, forceps/gloves, digestive system & dental model' },
        ],
        2: [
          { strand: '2.0 MATTER', subs: ['Properties of Solids, Liquids & Gases (Shape, Volume & Mass)', 'Floating and Sinking: Shape & Material Factors and Floaters/Sinkers', 'Water Pollution: Common Pollutants, Effects & Safe Water Practices'], kiq: 'How does changing the shape of plasticine or metal foil make it float?', resources: 'Balloons, syringes, plasticine, bottle tops, water basin, clean cloth filter' },
        ],
        3: [
          { strand: '3.0 FORCE, ENERGY & DIGITAL LITERACY', subs: ['Force and Its Effects on Objects (Start, Stop, Direction & Shape)', 'Light & Heat Energy: Sources, Uses & Safety at Home', 'Digital Devices: Parts, Functions, Care & Simple Block Coding Games'], kiq: 'How do pushes and pulls affect moving objects in sports and work?', resources: 'Toy cars, balls, torches, candles, tablets/computers' },
        ],
      },
      5: {
        1: [
          { strand: '1.0 LIVING THINGS AND THEIR ENVIRONMENT', subs: ['Classification of Green Plants: Flowering vs Non-Flowering Plants', 'Fungi: Moulds, Puffballs, Yeast & Mushrooms (Safety & Economic Value)', 'Vertebrate Groups: Mammals, Birds, Reptiles, Amphibians & Fish', 'Human Breathing System & Sense Organs Care'], kiq: 'How is yeast useful in bakeries while moulds spoil damp food?', resources: 'Fern/moss/bean specimens, bread mould in sealed clear bag, lung bottle model' },
        ],
        2: [
          { strand: '2.0 MATTER', subs: ['Change of State of Matter: Melting, Evaporation, Condensation & Freezing', 'Acids and Bases: Preparing Plant-Extract Indicators & Household Uses', 'Mixtures: Winnowing, Sieving, Picking, Filtering & Decanting'], kiq: 'How does the water cycle depend on evaporation and condensation?', resources: 'Red hibiscus/cabbage petals, lemon juice, wood ash, ice cubes, tin lid, sieve' },
        ],
        3: [
          { strand: '3.0 FORCE AND ENERGY', subs: ['Sound Energy: Production by Vibration, Loud/Soft Sounds & Noise Pollution', 'Heat Transfer: Conduction, Convection & Radiation Applications', 'Moon Phases & Word Processing Documents Creation'], kiq: 'Why do cooking sufurias have metallic bases and wooden or plastic handles?', resources: 'Metal/wooden spoons, wax, pins, drum/rubber bands, laptops with Word processor' },
        ],
      },
      6: {
        1: [
          { strand: '1.0 LIVING THINGS AND THEIR ENVIRONMENT', subs: ['Parts of Plants: Fibrous/Tap Roots, Stems & Leaf Functions (Transpiration/Photosynthesis Intro)', 'Invertebrates: Insects, Arachnids, Millipedes/Centipedes & Snails/Slugs', 'Human Circulatory System: Heart, Blood Vessels, Blood Components & ABO Groups'], kiq: 'How do arteries, veins, and capillaries work with the heart to transport blood?', resources: 'Uprooted weed samples, transparent polythene bag on leaf, heart model' },
        ],
        2: [
          { strand: '2.0 MATTER', subs: ['Change of State: Sublimation & Deposition (Iodine/Naphthalene) & Applications', 'Composition of Air (78% N2, 21% O2, 0.03% CO2, Inert Gases) & Uses', 'Water Conservation: Reducing, Reusing (Greywater) & Recycling'], kiq: 'How do fire extinguishers and fizzy drinks utilize carbon dioxide gas?', resources: 'Candle, glass jar, trough of water, pie chart of air composition' },
        ],
        3: [
          { strand: '3.0 FORCE AND ENERGY (KPSEA SYNTHESIS)', subs: ['Gravity & Friction: Advantages, Disadvantages & Ways of Reducing Friction', 'Light Energy: Transparent, Translucent & Opaque Materials; Plane Mirror Reflection & Periscope', 'Simple Machines: Levers (Fulcrum, Effort, Load) & Slopes/Inclined Planes; Scratch Coding'], kiq: 'How does a periscope use plane mirrors to see over obstacles?', resources: 'Plane mirrors, carton periscope, ball bearings, wooden ramp, wheelbarrow' },
        ],
      },
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
        { strand: '4.0 PRODUCTION TECHNIQUES', subs: ['Hand Sewing Stitches (Tacking, Running, Backstitch & Hemming)', 'Repairing Garments & Fixing Loose Buttons', 'Crocheting & Knitting Household Articles'], kiq: 'How can needlework and crocheting skills save money at home?', resources: 'Needles, assorted threads, fabric pieces, buttons, crocheting hooks, yarn' },
        { strand: '4.0 LAUNDRY & INNOVATIVE GARDENING', subs: ['Sorting & Laundering Cotton and Coloured Garments', 'Container, Sack & Vertical Kitchen Gardening', 'Value Addition to Crop Produce'], kiq: 'How can families in urban spaces grow fresh vegetables in sacks or tyres?', resources: 'Sacks, topsoil, manure, basins, mild soap, clotheslines' },
      ],
    },
    byGrade: {
      7: {
        1: [
          { strand: '1.0 CONSERVATION OF RESOURCES', subs: ['Controlling Soil Pollution on Farm Land (Safe Agrochemical & Plastic Disposal)', 'Constructing Water Retention Structures: WaterRetention Ditches, Pits & Earth Basins', 'Conserving Food Nutrients When Preparing & Cooking Leafy Vegetables', 'Growing Trees: Nursery Management, Transplanting & Agroforestry Care'], kiq: 'How do water retention pits and agroforestry trees protect soil moisture?', resources: 'Jembes, tree seedlings, fresh kales/spinach, cooking pot with lid' },
        ],
        2: [
          { strand: '2.0 FOOD PRODUCTION PROCESSES', subs: ['Crop Establishment: Land Preparation, Planting Depth & Spacing of Tilth', 'Selected Management Practices in Crop Production (Weeding, Earthing Up, Thinning, Gapping)', 'Preparing Animal Products: Grading/Sorting Eggs & Processing Raw Honey', 'Cooking Methods: Grilling, Roasting & Steaming Nutritious Foods'], kiq: 'Why does proper tilth size match seed size during planting?', resources: 'Seeds (millet, maize, beans), raw comb honey model, egg candler/trays, steamer' },
        ],
        3: [
          { strand: '3.0 HYGIENE & 4.0 PRODUCTION TECHNIQUES', subs: ['Hygiene in Rearing Animals & Laundering Loose-Coloured Garments', 'Knitting Basic Household Articles (Knit & Purl Stitches)', 'Constructing Framed Suspended Gardens for Urban/School Spaces', 'Adding Value to Crop Produce (Crisps, Dried Vegetables, Juices & Flour) & Homemade Soap'], kiq: 'How does value addition increase shelf life and farmer income?', resources: 'Knitting needles, yarn, timber offcuts for suspended garden, cassava/potatoes' },
        ],
      },
      8: {
        1: [
          { strand: '1.0 CONSERVATION OF RESOURCES', subs: ['Soil Conservation Measures: Strip Cropping, Grassed Waterways, Stone Lines & Trash Lines', 'Water Harvesting & Storage: Gutters, Tanks, Shallow Water Pans & Ponds', 'Kitchen and Backyard Gardening (Multi-Storey, Tyre & Wick Gardens)'], kiq: 'How can rainwater harvested from school rooftops sustain a kitchen garden?', resources: 'A-frame level, stones, gutters/tank model, sacks, topsoil & compost' },
        ],
        2: [
          { strand: '2.0 FOOD PRODUCTION PROCESSES', subs: ['Poultry Rearing in a Movable Fold: Construction, Feeding & Moving Routine', 'Crop Pest and Disease Identification & Eco-Friendly Control', 'Preparation of Animal Products: Processing Fish (Scaling/Gutting) & Dressing Poultry Carcass', 'Preserving Milk and Meat (Boiling, Fermentation, Salting, Smoking & Sun-Drying)'], kiq: 'How does rearing poultry in a movable fold fertilize pasture while controlling parasites?', resources: 'Wire mesh/timber fold model, pest-damaged leaf samples, solar drier chart' },
        ],
        3: [
          { strand: '3.0 HYGIENE & 4.0 PRODUCTION TECHNIQUES', subs: ['Planning, Preparing & Serving Balanced Family Meals & Kitchen Cleaning', 'Sewing Skills: Constructing Open and Plain Seams on Household Articles', 'Constructing Innovative Livestock Waterers from Recycled Containers', 'ICT Support Services in Agriculture (Weather, Market Prices & Extension)'], kiq: 'How do clean kitchen surfaces and proper seams uphold household standards?', resources: 'Needles, cotton fabric, tape measure, recycled jerrycans, meal planning cards' },
        ],
      },
      9: {
        1: [
          { strand: '1.0 CONSERVATION OF RESOURCES', subs: ['Conserving Forage / Animal Feeds: Baled Hay, Standing Forage & Silage Making', 'Conserving Leftover Foods Safely: Reheating, Hygiene & Creative Recipes', 'Integrated Farming Components (Crops, Livestock, Fish, Poultry & Agroforestry)'], kiq: 'How does silage and baled hay cushion livestock farmers during drought?', resources: 'Dry Rhodes grass, molasses sample, polythene silage tube, farm layout chart' },
        ],
        2: [
          { strand: '2.0 FOOD PRODUCTION PROCESSES', subs: ['Organic Gardening: Organic Manure, Botanical Pesticides & Mechanical Weed Control', 'Preparing & Conditioning Storage Structures (Granaries/Bags) for Crop Produce', 'Cooking Flour Mixtures: Preparing Nutritious Batters (Pancakes) & Doughs (Chapati/Mandazi)'], kiq: 'Why must cereals be dried to safe moisture levels before storage?', resources: 'Neem/tithonia leaves, sisal/hermetic bags, wheat flour, rolling pin, pan' },
        ],
        3: [
          { strand: '3.0 HYGIENE & 4.0 PRODUCTION TECHNIQUES (KJSEA SYNTHESIS)', subs: ['Cleaning Waste Disposal Facilities & Disinfecting Clothing/Household Articles', 'Grafting Fruit Trees (Whip-and-Tongue / Cleft Grafting) for Improved Varieties', 'Constructing Homemade Sun Dryers for Vegetables and Fruits'], kiq: 'Why do fruit farmers graft an improved scion onto a hardy local rootstock?', resources: 'Mango/avocado scion & rootstock, grafting tape/knife, disinfectant, solar dryer frame' },
        ],
      },
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
    byGrade: {
      4: {
        1: [
          { strand: '1.0 NATURAL AND BUILT ENVIRONMENTS IN THE COUNTY', subs: ['Four & Eight Compass Points for Locating Places in the County', 'Location, Size & Sub-Counties of Our County', 'Major Physical Features (Rivers, Hills, Plains, Valleys) & Seasons in the County', 'Historic Built Environments (Museums, Monuments & Cultural Centres) in the County'], kiq: 'How do physical features and seasons affect daily activities in our County?', resources: 'County wall map, magnetic compass, photographs of county landmarks' },
        ],
        2: [
          { strand: '2.0 PEOPLE, POPULATION & 3.0 COUNTY RESOURCES', subs: ['Interdependence of People & Population Distribution Patterns in the County', 'Positive Aspects of Traditional Culture (Food, Dress, Songs, Festivals)', 'Main Economic Activities, Trade & School Enterprise Projects in the County'], kiq: 'Why do communities in our County depend on one another for goods and services?', resources: 'Cultural attire pictures, county market items, enterprise record book' },
        ],
        3: [
          { strand: '4.0 CITIZENSHIP AND GOVERNANCE IN KENYA', subs: ['Good Citizenship Qualities in School & Community; Peace Factors', 'Children’s Rights & Protection Against Abuse and Child Labour', 'School Democracy (Children’s Government) & Structure of County Executive/Assembly'], kiq: 'How does electing a school Children’s Government teach democratic leadership?', resources: 'Children Act chart, mock ballot papers, County government chart' },
        ],
      },
      5: {
        1: [
          { strand: '1.0 NATURAL AND BUILT ENVIRONMENTS IN KENYA', subs: ['Elements of a Map & Location/Position/Size of Kenya and Her Neighbours', 'Main Physical Features, Relief Regions & Climatic Regions of Kenya', 'Care for Historic Built Environments in Kenya (Fort Jesus, Koobi Fora, Gedi)'], kiq: 'How does Kenya’s relief create varied climatic zones from the Coast to the Highlands?', resources: 'Approved Primary Atlas, Wall Map of Kenya, monument photographs' },
        ],
        2: [
          { strand: '2.0 PEOPLE & 3.0 ECONOMIC ACTIVITIES IN KENYA', subs: ['Main Language Groups in Kenya (Bantu, Nilotes, Cushites, Asians/Europeans) & Population Density', 'Dairy Farming, Horticulture, Inland/Marine Fishing & Wildlife Tourism in Kenya', 'Mining (Soda Ash, Fluorspar, Diatomite, Limestone), Transport & Road Safety in Kenya'], kiq: 'How do horticulture and wildlife tourism earn foreign exchange for Kenya?', resources: 'Language migration map, mineral samples, road traffic sign charts' },
        ],
        3: [
          { strand: '4.0 POLITICAL SYSTEMS AND GOVERNANCE IN KENYA', subs: ['Traditional Leaders in Kenya (Kivoi wa Mwendwa & Mekatilili wa Menza) & Early Visitors', 'Kenyan Citizenship (By Birth & Registration), National Symbols & National Unity', 'Human Rights & Three Arms of the National Government (Legislature, Executive, Judiciary)'], kiq: 'Why did Kenya’s Constitution separate power among three arms of government?', resources: 'Constitution of Kenya 2010, portraits of Kenyan leaders, National Symbols chart' },
        ],
      },
      6: {
        1: [
          { strand: '1.0 NATURAL AND BUILT ENVIRONMENTS IN EASTERN AFRICA', subs: ['Position, Size, Countries & Latitudes/Longitudes of Eastern Africa', 'Formation of Rift Valley, Block/Volcanic Mountains & Lakes in Eastern Africa', 'Climatic Regions & Vegetation Belts of Eastern Africa'], kiq: 'How were fault mountains and the Great Rift Valley formed in Eastern Africa?', resources: 'Eastern Africa wall map, paper-strip faulting model, atlas' },
        ],
        2: [
          { strand: '2.0 PEOPLE & 3.0 RESOURCES IN EASTERN AFRICA', subs: ['Migration & Settlement of Language Groups in Eastern Africa & Population Factors', 'Large-Scale Coffee/Maize & Beef Farming, Fishing & Forestry in Eastern Africa', 'Transport Networks, Communication & East African Community (EAC) Objectives/Benefits'], kiq: 'How does common market integration across EAC member states boost trade?', resources: 'EAC flags/map, coffee/sisal samples, migration route charts' },
        ],
        3: [
          { strand: '4.0 POLITICAL SYSTEMS & GOVERNANCE (KPSEA SYNTHESIS)', subs: ['Traditional Governance of the Buganda Kingdom & Nyamwezi Chiefdom', 'Peaceful Conflict Resolution, Human Rights, Sources of Government Revenue & Preamble of Constitution'], kiq: 'How was centralized governance organized in the traditional Buganda Kingdom?', resources: 'Buganda administrative chart, KRA revenue posters, Constitution booklet' },
        ],
      },
      7: {
        1: [
          { strand: '1.0 SOCIAL STUDIES, PERSONAL GROWTH & NATURAL ENVIRONMENT', subs: ['Career & Entrepreneurial Opportunities in Social Studies; Self-Exploration', 'Maps & Mapwork: Sketch, Atlas & Topographical Maps; Position & Shape of Africa', 'Earth & Solar System (Origin, Rotation, Revolution & Internal Structure)', 'Weather Station Instruments (Stevenson Screen, Rain Gauge) & Fieldwork Methods'], kiq: 'How do Earth’s rotation and revolution cause day/night, time differences, and seasons?', resources: 'Approved JSS Atlas, globe, torch, rain gauge, Stevenson screen model' },
        ],
        2: [
          { strand: '2.0 PEOPLE, EARLY CIVILIZATIONS & POPULATION IN AFRICA', subs: ['Human Origin: Archaeological Sites in Africa & Traditional Stories', 'Early African Civilizations: Ancient Egypt, Great Zimbabwe & Kingdom of Kongo', 'Indian Ocean Slave Trade, Internal Interdependence & Population Distribution in Africa'], kiq: 'How have Ancient Egyptian innovations in irrigation, calendar, and medicine influenced the modern world?', resources: 'Map of African archaeological sites, pyramid/Great Zimbabwe photos, atlas' },
        ],
        3: [
          { strand: '3.0 RESOURCES & 4.0 POLITICAL DEVELOPMENT AND GOVERNANCE', subs: ['Agriculture in Nile Valley, Economic Organization of Ogiek & Zulu, and Currency Evolution', 'Scramble & Partition of Africa (Berlin Conference 1884-85)', 'The Constitution of Kenya 2010, Democracy, Human Rights, African Diasporas & African Union (AU)'], kiq: 'What were the political and socio-economic impacts of the Berlin Conference on Africa?', resources: 'Colonial partition map of Africa, AU charter summary, Constitution of Kenya' },
        ],
      },
      8: {
        1: [
          { strand: '1.0 PERSONAL DEVELOPMENT, PEOPLE & POPULATION', subs: ['Self-Improvement, Self-Esteem & Emotional Intelligence in Relationships', 'Scientific Theory of Human Evolution (Australopithecus to Homo Sapiens) & Fossil Conservation', 'Early Visitors to the East African Coast & Swahili Civilization', 'Population Growth, Migration & Demographic Structure (Kenya vs Germany Pyramids)'], kiq: 'Why do Kenya and Germany exhibit contrasting population age-sex pyramids?', resources: 'Fossil skull casts/charts, KNBS vs Germany population pyramids, JSS Atlas' },
        ],
        2: [
          { strand: '2.0 NATURAL AND HISTORIC BUILT ENVIRONMENTS', subs: ['Map Reading: Linear/Statement/Representative Scales & Area of Irregular Shapes', 'Weather & Climate of Africa; Causes & Adaptation to Climate Change', 'Vegetation Zones of Africa & Care for Historical Sites/Monuments (Kilwa, Timbuktu, Fort Jesus)'], kiq: 'How do communities in Africa adapt farming and water systems to climate change?', resources: '1:50,000 topographical map extracts, string/squared tracing paper, climate maps' },
        ],
        3: [
          { strand: '3.0 POLITICAL DEVELOPMENT, CITIZENSHIP & PEACE', subs: ['Evolution of the Kenyan Constitution, Arms of Government & Chapter Six Integrity', 'Human Rights Classification, Children’s Rights Protection & Global Citizenship', 'Non-Violent Conflict Resolution & Managing Peer/Community Tensions'], kiq: 'How does Chapter Six of the Kenyan Constitution promote ethical public leadership?', resources: 'Constitution of Kenya 2010, UNCRC summary chart, mediation case cards' },
        ],
      },
      9: {
        1: [
          { strand: '1.0 CAREER PATHWAYS & COMMUNITY SERVICE LEARNING PREP', subs: ['Senior School Pathways (Arts/Sports, Social Sciences, STEM) & Support Systems', 'Community Service-Learning Project: Problem Identification, Designing & Implementation', 'Pre-Historic Human Toolmaking (Oldowan, Acheulean, Microlith) & Socio-Economic Practices'], kiq: 'How does understanding personal aptitudes guide Senior School pathway selection?', resources: 'KICD Senior School Pathway guide, CSL project logbook, stone-tool charts' },
        ],
        2: [
          { strand: '2.0 INDIGENOUS KNOWLEDGE, POVERTY REDUCTION & PHYSICAL PROCESSES', subs: ['African Indigenous Knowledge Systems (Medicine, Agriculture, Climate & Conservation)', 'Poverty Reduction, Over-Exploitation of Resources & Multi-Purpose River Projects (Aswan & Seven Forks)', 'Internal Land-Forming Processes: Earth Movements, Folding & Faulting; Topographical Cross-Sections'], kiq: 'How do Seven Forks Dams and Aswan High Dam drive hydro-power and irrigation?', resources: 'Map of Tana River Seven Forks & Nile, contour cross-section graph paper' },
        ],
        3: [
          { strand: '3.0 GOVERNANCE, ELECTIONS & PEACEBUILDING (KJSEA SYNTHESIS)', subs: ['Civic Engagement, Political Parties, IEBC Electoral Process & Voter Education in Kenya', 'Comparisons of Devolved/Federal Governance & International Peacekeeping', 'Integrated Topographical Mapwork & KJSEA Assessment Synthesis'], kiq: 'Why are free, fair, and verifiable elections essential for national stability?', resources: 'IEBC voter education charts, Constitution of Kenya, 1:50,000 map sheets' },
        ],
      },
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
        { strand: '2.0 PERFORMING AND DISPLAYING', subs: ['Descant Recorder & Sol-fa Ladder (d r m f s l t d)', 'East African Folk Songs & Traditional Dances', 'Tie-and-Dye, Batik & Stencil Fabric Decoration'], kiq: 'How do costumes and body adornment enhance African folk dances?', resources: 'Fabric dyes, white cotton cloth, strings, descant recorders, rhythm charts' },
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
        { strand: '1.0 ACIDS, BASES & FIRE SAFETY', subs: ['Commercial & Plant-Extract Acid-Base Indicators & pH Scale', 'Physical vs Chemical Changes & Rusting Control', 'Classes of Fire (A-F), Fire Triangle & Extinguishers'], kiq: 'Why must different classes of fire be extinguished using specific agents?', resources: 'Litmus paper, universal indicator, test tubes, fire extinguisher chart' },
      ],
      2: [
        { strand: '2.0 LIVING THINGS AND THEIR ENVIRONMENT', subs: ['Light Microscope Parts, Magnification & Cell Structure', 'Diffusion, Osmosis & Active Transport in Living Tissue', 'Human Reproductive, Excretory (Skin/Kidney) & Digestive Systems', 'Plant Nutrition (Photosynthesis) & Transpiration'], kiq: 'How does osmosis regulate water movement in plant roots and animal cells?', resources: 'Light microscopes, glass slides, iodine stain, Visking tubing, anatomical models' },
        { strand: '2.0 HEALTH EDUCATION & ECOLOGY', subs: ['Adolescent Health, STIs & Lifestyle Diseases Prevention', 'Biotic/Abiotic Ecosystem Factors, Food Chains & Food Webs'], kiq: 'How does human activity disrupt energy flow in natural food webs?', resources: 'Quadrat frames, sweep nets, health brochures' },
      ],
      3: [
        { strand: '3.0 FORCE AND ENERGY', subs: ['Static & Current Electricity, Series/Parallel Circuits', 'Magnetism, Magnetic Fields & Electromagnets', 'Pressure in Solids and Liquids (P = F/A & P = hpg)', 'Curved Mirrors, Waves & Renewable Energy Transformations'], kiq: 'How do hydraulic brakes and domestic electrical safety fuses work?', resources: 'Dry cells, ammeters, bar magnets, iron filings, concave/convex mirrors' },
      ],
    },
    byGrade: {
      7: {
        1: [
          { strand: '1.0 SCIENTIFIC INVESTIGATION', subs: ['Components of Integrated Science (Biology, Chemistry & Physics) & STEM Career Pathways', 'Laboratory Safety Rules, Hazard Symbols & First Aid for Burns, Cuts and Chemical Spills', 'Basic Science Skills, Basic & Derived SI Units (Area, Volume, Density)', 'Laboratory Apparatus for Heating (Bunsen Burner Flames), Measuring Mass, Volume, Time & Temperature'], kiq: 'Why is a non-luminous Bunsen burner flame preferred over a luminous flame for heating?', resources: 'Bunsen burner, tripod, measuring cylinders, beam balance, hazard symbol chart, first-aid kit' },
          { strand: '2.0 MIXTURES, ELEMENTS AND COMPOUNDS', subs: ['Homogeneous & Heterogeneous Mixtures; Pure vs Impure Substances (Melting/Boiling Points)', 'Separating Mixtures: Simple/Fractional Distillation, Paper Chromatography, Sublimation & Solvent Extraction', 'Acids, Bases & Indicators: Plant Extracts, Litmus, Phenolphthalein, Methyl Orange & Universal pH Scale'], kiq: 'How is fractional distillation applied in separating crude oil and liquid air?', resources: 'Liebig condenser, filter paper, black ink, ethanol, hibiscus petals, universal pH chart' },
        ],
        2: [
          { strand: '3.0 LIVING THINGS AND THEIR ENVIRONMENT', subs: ['Human Male & Female Reproductive Systems; Physical & Emotional Changes in Adolescence', 'Menstrual Cycle Hygiene & Managing Adolescent Challenges', 'Human Excretory System: Structure & Functions of the Skin and Urinary System (Kidney)', 'Common Kidney Disorders & Healthy Lifestyle Practices'], kiq: 'How do the skin and kidneys maintain internal cleanliness of the human body?', resources: 'Torso/kidney anatomical models, skin cross-section chart, health brochures' },
        ],
        3: [
          { strand: '4.0 FORCE AND ENERGY', subs: ['Sources of Electricity (Hydro, Geothermal, Solar, Wind) & Simple Series/Parallel Circuits', 'Electrical Conductors, Insulators, Domestic Appliances & Electrical Safety Measures', 'Magnetism: Magnetic vs Non-Magnetic Materials, Law of Magnetism & Daily Uses of Magnets'], kiq: 'Why are domestic lighting circuits wired in parallel rather than in series?', resources: 'Dry cells, bulbs, switches, copper wires, bar magnets, iron nails, safety fuse samples' },
        ],
      },
      8: {
        1: [
          { strand: '1.0 MIXTURES, ELEMENTS AND COMPOUNDS', subs: ['Elements & Compounds: Chemical Symbols (IUPAC/Latin), Common Compounds & Word Applications', 'Kinetic Theory of Matter: Particle Arrangement & Diffusion in Liquids and Gases', 'Temporary Physical Changes vs Permanent Chemical Changes', 'Fire Safety: The Fire Triangle, Classes of Fire (A, B, C, D, Electrical, K) & Fire Extinguisher Control'], kiq: 'Why is water dangerous to use on Class B petrol fires or live electrical fires?', resources: 'Periodic Table chart, potassium permanganate crystals, CO2/foam extinguisher models' },
        ],
        2: [
          { strand: '2.0 LIVING THINGS AND THEIR ENVIRONMENT', subs: ['Light Microscope Handling, Magnification Calculation & Plant vs Animal Cell Organelles', 'Properties of the Cell Membrane: Diffusion & Osmosis Experiments (Visking Tubing & Potato Cores)', 'Human Reproduction: Fertilization, Foetal Development & Prevention of STIs (HIV/AIDS, Syphilis, Gonorrhoea)'], kiq: 'How does osmosis explain wilting in plants and preservation of fish using salt?', resources: 'Light microscopes, onion epidermis, iodine, Visking tubing, sucrose solution' },
        ],
        3: [
          { strand: '3.0 FORCE AND ENERGY', subs: ['Transformation of Energy in Nature & Appliances; Renewable Energy Safety', 'Pressure in Solids (P = F/A) & Pressure in Liquids (P = hpg) and Hydraulic Applications'], kiq: 'Why do tractors have wide rear tyres while cutting knives have sharp thin edges?', resources: 'Perforated tall tin, syringe hydraulic model, wooden blocks, spring balance, solar cell' },
        ],
      },
      9: {
        1: [
          { strand: '1.0 MIXTURES, ELEMENTS AND COMPOUNDS', subs: ['Structure of the Atom: Protons, Neutrons, Electrons, Atomic/Mass Number & Electron Arrangement (1-20)', 'Metals & Alloys (Brass, Bronze, Stainless Steel, Duralumin): Properties, Uses & Rusting Prevention', 'Hard and Soft Water: Causes of Temporary/Permanent Hardness & Methods of Softening Water'], kiq: 'Why are alloys stronger and more corrosion-resistant than pure metals?', resources: 'Atomic shell models, iron nails, oil/boiled water tubes, soap solution, hard/soft water samples' },
        ],
        2: [
          { strand: '2.0 LIVING THINGS AND THEIR ENVIRONMENT', subs: ['Nutrition in Plants: Leaf Adaptations, Chloroplasts, Photosynthesis Stages & Starch Testing', 'Nutrition in Animals: Modes of Nutrition, Mammalian Dentition & Human Enzymatic Digestion', 'Reproduction in Flowering Plants (Pollination, Fertilization & Seed/Fruit Dispersal)', 'Interdependence of Living Things: Biotic/Abiotic Factors, Food Chains, Food Webs & Decomposers'], kiq: 'How are leaf internal structures and mammalian teeth adapted for nutrition?', resources: 'Variegated leaves, boiling tubes, ethanol, iodine solution, skull/jaw models, hand lenses' },
        ],
        3: [
          { strand: '3.0 FORCE AND ENERGY (KJSEA SYNTHESIS)', subs: ['Curved Mirrors: Concave & Convex Mirror Ray Diagrams, Image Characteristics & Applications', 'Waves: Transverse & Longitudinal Waves, Amplitude, Wavelength, Frequency (v = f x lambda) & Remote Sensing'], kiq: 'Why are convex mirrors fitted as vehicle driving mirrors while concave mirrors serve dentists?', resources: 'Concave & convex mirrors, optical bench, slinky spring, ripple tank / chart' },
        ],
      },
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
        { strand: '5.0 ENTREPRENEURSHIP & FINANCIAL LITERACY', subs: ['Generating Viable Business Ideas & Ethical Practices', 'Bookkeeping: Cashbooks, Statements of Financial Position', 'Saving, Investing, Mobile Money Safety & Consumer Protection', 'Marketing Goods & Services + Capstone Mini-Project'], kiq: 'How do entrepreneurs identify community gaps and turn them into sustainable enterprises?', resources: 'Sample cashbooks, KEBS quality mark samples, project portfolios' },
      ],
    },
    byGrade: {
      7: {
        1: [
          { strand: '1.0 FOUNDATIONS OF PRE-TECHNICAL STUDIES', subs: ['Components of Pre-Technical Studies (Technical, Computer & Business) & Career Roles', 'Safety in the Immediate Work Environment: Potential Physical Threats & PPE Rules', 'Online Safety Rules: Protecting Personal Data & Avoiding Cyberbullying', 'Computer Concepts: Characteristics, Classification (Size, Purpose, Functionality) & Lab Care'], kiq: 'How do Technical, Computer, and Business skills work together in modern enterprises?', resources: 'Workshop PPE (helmets, goggles, gloves), desktop/laptop computers, safety posters' },
        ],
        2: [
          { strand: '2.0 COMMUNICATION & 3.0 MATERIALS AND TOOLS', subs: ['Fundamentals of Communication in Business & ICT Channels', 'Artistic vs Technical Drawing: Types of Lines, Lettering, Freehand Sketching & Plane Geometry', 'Economic Resources, Metallic Materials (Ferrous/Non-Ferrous) & Non-Metallic Materials', 'Measuring and Marking-Out Tools (Steel Rule, Tape Measure, Try-Square, Scriber, Dividers, Callipers)'], kiq: 'Why must artisans measure twice and mark accurately before cutting materials?', resources: 'Drawing boards, 2H/HB pencils, steel rules, try-squares, copper/aluminium/steel samples' },
        ],
        3: [
          { strand: '4.0 ENTREPRENEURSHIP & FINANCIAL LITERACY', subs: ['Qualities of an Entrepreneur & Sources of Viable Business Ideas', 'Money: Uses, Security Features of Kenyan Currency & Themes on Banknotes', 'Setting Personal Financial Goals, Saving Channels & Ethical Business Practices'], kiq: 'What security features distinguish genuine Kenyan banknotes from counterfeits?', resources: 'CBK Kenyan currency posters, specimen notes, financial goal planner sheets' },
        ],
      },
      8: {
        1: [
          { strand: '1.0 FOUNDATIONS & 2.0 COMMUNICATION', subs: ['Fire Safety & Data Safety (Backups, Passwords, Antivirus) in the Work Environment', 'Computer Hardware: Input, Output, Processing (CPU) & Storage Devices Selection', 'Consumer and Investor Protection Agencies in Kenya (KEBS, CAK, CMA)', 'Plain Scale, Diagonal Scale & Visual Programming Basics (Scratch Interface & Sprites)'], kiq: 'How do regular backups and strong authentication prevent data loss?', resources: 'Opened system unit (RAM, HDD/SSD, CPU heatsink), Scratch software, scale rulers' },
        ],
        2: [
          { strand: '3.0 MATERIALS AND PRODUCTION TOOLS', subs: ['Composite Materials (Concrete, Fibreglass, Papier-mâché, Manufactured Boards) & Ceramics', 'Cutting Tools (Tenon Saw, Hacksaw, Chisels, Snips, Planes) & Holding Tools (Vices, G-Clamp, Pliers)', 'Safe Use, Sharpening, Oiling & Storage of Cutting and Holding Tools'], kiq: 'Why is reinforced concrete stronger than plain cement mortar in construction?', resources: 'Plywood/MDF samples, ceramic tiles, hacksaw, tenon saw, bench vice, G-clamps' },
        ],
        3: [
          { strand: '4.0 ENTREPRENEURSHIP & BOOKKEEPING', subs: ['Evaluating Business Opportunities & Setting Up a Small School/Community Enterprise', 'Bookkeeping Basics: Assets, Liabilities, Capital (A = C + L) & Business Transactions', 'Cash & Credit Transactions, Budgeting, Saving & Investment Channels (SACCOs, MMFs, Treasury Bills)'], kiq: 'How does the accounting equation (Assets = Capital + Liabilities) stay balanced?', resources: 'Receipts, invoices, simple ledger templates, SACCO/MMF brochures' },
        ],
      },
      9: {
        1: [
          { strand: '1.0 SAFETY ON RAISED PLATFORMS & COMPUTER SOFTWARE', subs: ['Safety on Raised Platforms (Ladders, Scaffolds, Trestles, Ramps) & Handling Hazardous Substances', 'Self-Exploration for Technical/STEM Career Talent Development', 'Computer Software: System Software (OS, Utilities) vs Application Software', 'Oblique (Cavalier/Cabinet) & Isometric 3D Projections in Technical Drawing'], kiq: 'What safety checks prevent falls when electricians and builders use ladders or scaffolds?', resources: 'Step-ladder safety chart, hazardous material MSDS labels, set squares (30/60 & 45), PCs' },
        ],
        2: [
          { strand: '2.0 VISUAL PROGRAMMING, WOOD/POLYMERS & DRIVING TOOLS', subs: ['Visual Programming Project: Variables, Operators, Conditional Loops & Interactive Games/Stories', 'Wood (Hardwood vs Softwood, Seasoning & Conversion) & Polymer Materials (Thermoplastics vs Thermosets)', 'Waste Materials Recycling Project & Driving/Holding Tools (Hammers, Mallets, Screwdrivers, Spanners)'], kiq: 'How do thermoplastics differ from thermosetting plastics when heated and recycled?', resources: 'Scratch IDE, timber samples (pine, cypress, mahogany), PVC/melamine samples, spanners/hammers' },
        ],
        3: [
          { strand: '3.0 FINANCIAL STATEMENTS, FINANCE & MARKETING (KJSEA SYNTHESIS)', subs: ['Financial Services of Banks/FinTech, Sources of Business Finance & Government Revenue/Taxes', 'Preparing a Simple Income Statement (Trading, Profit & Loss) & Statement of Financial Position', 'Marketing Goods & Services (4Ps: Product, Price, Place, Promotion) & Capstone Prototype Display'], kiq: 'How does an Income Statement reveal whether a business made net profit or net loss?', resources: 'Income statement & balance sheet templates, KRA tax guides, learner prototype models' },
        ],
      },
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
    byGrade: {
      10: {
        1: [
          { strand: '1.0 NUMBERS AND ALGEBRA I', subs: ['Real Number System, Surds Simplification & Rationalizing Denominators', 'Laws of Indices & Logarithmic Equations', 'Quadratic Expressions, Factorization, Completing the Square & Quadratic Formula', 'Linear Equations, Simultaneous Systems & Linear Inequalities Regions'], kiq: 'Why do engineers rationalize surds and apply quadratic models in projectile calculations?', resources: 'Scientific calculators, 4-figure mathematical tables, Cartesian graph books' },
        ],
        2: [
          { strand: '2.0 MEASUREMENTS AND GEOMETRY I', subs: ['Arc Length, Area of Sectors/Segments & Frustums of Cones and Pyramids', 'Angle Properties of Circles (Chord, Arc & Cyclic Quadrilateral Theorems)', 'Trigonometric Ratios of Acute/Obtuse Angles, Unit Circle & Sine/Cosine Rules'], kiq: 'How do circle theorems and the sine/cosine rules apply in surveying irregular land?', resources: 'Geometrical instruments, circle theorem boards, clinometers, 3D frustum models' },
        ],
        3: [
          { strand: '3.0 STATISTICS, PROBABILITY & COMMERCIAL ARITHMETIC I', subs: ['Grouped Data: Assumed Mean, Quartiles, Ogive (Cumulative Frequency) & Dispersion Intro', 'Currency Exchange, Commissions, Discount & Hire Purchase Analysis', '2D Vectors: Column Notation, Magnitude, Addition & Collinearity'], kiq: 'How do cumulative frequency ogives estimate median wages and interquartile spread?', resources: 'Graph paper, CBK exchange rate schedules, KNBS statistical charts' },
        ],
      },
      11: {
        1: [
          { strand: '1.0 ALGEBRA II, SEQUENCES & MATRICES', subs: ['2x2 Matrices: Determinants, Inverse Matrix & Solving Simultaneous Equations', 'Arithmetic Progressions (AP) & Geometric Progressions (GP) Sums and Applications', 'Polynomials (Remainder & Factor Theorems) & Binomial Expansion (Pascal’s Triangle)'], kiq: 'How do Geometric Progressions model compound loan repayments and population growth?', resources: 'Scientific calculators, Pascal triangle charts, spreadsheet matrix tools' },
        ],
        2: [
          { strand: '2.0 TRIGONOMETRY II, VECTORS IN 3D & TRANSFORMATION MATRICES', subs: ['Radian Measure, Trigonometric Graphs (y = a sin bx) & Trigonometric Equations/Identities', '3D Coordinates, 3D Vectors, Ratio Theorem & Scalar (Dot) Product Intro', '2x2 Transformation Matrices: Stretch, Shear, Rotation, Reflection & Area Scale Factor (Det)'], kiq: 'How do computer graphics engines use 2x2 and 3D transformation matrices?', resources: 'Graph paper, 3D axis models, dynamic geometry visualizers' },
        ],
        3: [
          { strand: '3.0 COMMERCIAL ARITHMETIC II, VARIATION & PROBABILITY', subs: ['Compound Interest, Appreciation/Depreciation & Kenyan Income Tax (PAYE, Housing Levy, SHIF)', 'Direct, Inverse, Joint & Partial Variation Modelling', 'Tree Diagrams, Independent/Mutually Exclusive & Conditional Probability'], kiq: 'How is net pay calculated from gross salary using statutory Kenyan tax bands?', resources: 'Current KRA PAYE & statutory deduction schedules, probability tree charts' },
        ],
      },
      12: {
        1: [
          { strand: '1.0 DIFFERENTIAL AND INTEGRAL CALCULUS', subs: ['Limits, Gradient of a Curve & Differentiation from First Principles and Polynomial Rules', 'Applications of Differentiation: Tangents/Normals, Stationary Points (Maxima/Minima) & Kinematics', 'Indefinite & Definite Integration: Area Under Curves, Trapezoidal/Mid-Ordinate Rules & Volumes of Revolution'], kiq: 'How does calculus optimize packaging material cost and model velocity/acceleration?', resources: 'Scientific calculators, curve-sketching graph books, kinematics charts' },
        ],
        2: [
          { strand: '2.0 LINEAR PROGRAMMING, LOCI & 3D GEOMETRY', subs: ['Geometrical Loci Constructions & Intersecting Loci Regions', '3D Geometry: Angle Between a Line and a Plane & Between Two Planes', 'Linear Programming: Formulating Constraints, Feasible Region & Objective Optimization'], kiq: 'How do factories use linear programming to maximize profit under resource constraints?', resources: '3D skeletal cuboid/pyramid models, geometrical sets, linear programming grids' },
        ],
        3: [
          { strand: '3.0 NAVIGATION (LATITUDES/LONGITUDES), DISPERSION & CBE SYNTHESIS', subs: ['Variance & Standard Deviation for Ungrouped and Grouped Data', 'Great & Small Circles: Shortest Distance in Nautical Miles/km & Speed in Knots', 'Comprehensive Senior School CBE Core Mathematics Synthesis'], kiq: 'Why do transcontinental flights follow great-circle arcs across the globe?', resources: 'Terrestrial globe, statistical tables, KNEC Senior CBE specimen papers' },
        ],
      },
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

  Biology: {
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

  Chemistry: {
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

  Physics: {
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

  Geography: {
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
        { strand: '1.0 BUSINESS ENVIRONMENT, ENTREPRENEURSHIP & FORMS OF OWNERSHIP', subs: ['Human Wants, Economic Resources, Scarcity & Opportunity Cost', 'Sole Proprietorship, Partnerships, Co-operatives (SACCOs) & Companies', 'Nairobi Securities Exchange (NSE) & Government Consumer Protection'], kiq: 'Why do SACCOs play a pivotal role in capital mobilization in Kenya?', resources: 'Sample SACCO bylaws, NSE share price listings, business newspapers' },
      ],
      2: [
        { strand: '2.0 DEMAND, SUPPLY, MONEY, BANKING & PUBLIC FINANCE', subs: ['Demand & Supply Curves, Equilibrium Price & Market Structures', 'Central Bank of Kenya Functions, Commercial Banks & FinTech / Mobile Money', 'Taxation Principles, KRA Digital Filing & Insurance Contracts'], kiq: 'How do shifts in demand and supply determine market prices of farm produce?', resources: 'Graph paper, CBK currency leaflets, insurance proposal forms' },
      ],
      3: [
        { strand: '3.0 ACCOUNTING LEDGERS, FINANCIAL STATEMENTS & INTERNATIONAL TRADE', subs: ['Source Documents, Double-Entry Ledgers, Three-Column Cashbook & Trial Balance', 'Income Statement (Trading, P&L) & Statement of Financial Position', 'Balance of Payments, Exchange Rates & Regional Economic Blocs (AfCFTA)'], kiq: 'How do accurate financial statements guide investment and credit decisions?', resources: 'Accounting ledger books, invoices/receipts, AfCFTA trade briefs' },
      ],
    },
  },

  'Essential Mathematics': {
    shortCode: 'ESS-MATH',
    strandsByTerm: {
      1: [
        { strand: '1.0 COMMERCIAL ARITHMETIC & PERSONAL FINANCE', subs: ['Whole Numbers, Fractions, Decimals, Ratios & Proportions in Trade', 'Simple & Compound Interest, Hire Purchase, Discounts & Commissions', 'Personal & Household Budgeting, Mobile Money Tariffs & Income Tax (PAYE / VAT)'], kiq: 'How do compound interest, hire purchase, and budgeting guide smart financial decisions?', resources: 'Scientific calculators, KRA PAYE tax tables, bank interest charts' },
      ],
      2: [
        { strand: '2.0 PRACTICAL MEASUREMENT, SCALE DRAWING & GEOMETRY', subs: ['Perimeter, Area & Surface Area of Everyday Land Plots and Containers', 'Volume, Capacity, Mass, Density & Time/Travel Timetables', 'Scale Drawing, Bearings, Angles of Elevation/Depression & Plans'], kiq: 'How do scale drawings and bearings assist technicians, farmers, and designers?', resources: 'Geometrical sets, tape measures, scale rulers, graph books' },
      ],
      3: [
        { strand: '3.0 APPLIED ALGEBRA, GRAPHS, STATISTICS & PROBABILITY', subs: ['Linear Equations, Simultaneous Equations & Travel/Conversion Graphs', 'Statistical Data Representation: Pie Charts, Histograms, Mean, Median & Mode', 'Experimental & Theoretical Probability in Everyday Decision-Making'], kiq: 'How do statistical measures and graphs summarize community and business trends?', resources: 'Squared graph books, dice/coins for probability, KNBS statistical charts' },
      ],
    },
  },

  'General Science': {
    shortCode: 'GEN-SCI',
    strandsByTerm: {
      1: [
        { strand: '1.0 HUMAN HEALTH, NUTRITION & BIOLOGICAL SYSTEMS', subs: ['Cell Structure, Nutrition, Balanced Diet & Digestive Health', 'Circulatory, Respiratory & Excretory Systems; Communicable & Lifestyle Diseases', 'Ecology, Biodiversity Conservation & Sustainable Waste Management'], kiq: 'How do balanced nutrition, hygiene, and vaccination prevent common diseases?', resources: 'Light microscopes, human torso model, nutrition charts, first-aid kit' },
      ],
      2: [
        { strand: '2.0 MATTER, WATER CHEMISTRY & EVERYDAY MATERIALS', subs: ['States of Matter, Atomic Structure, Periodic Trends & Bonding Basics', 'Acids, Bases, Indicators, Water Hardness & Domestic Water Purification', 'Fuels, Polymers, Detergents, Soil pH & Environmental Chemistry'], kiq: 'How are acids, bases, and water-treatment chemicals used safely in Kenyan homes?', resources: 'Litmus/universal indicator, beakers, water filter models, household samples' },
      ],
      3: [
        { strand: '3.0 ENERGY, ELECTRICITY, WAVES & RENEWABLE TECHNOLOGY', subs: ['Force, Work, Power, Simple Machines & Thermal Energy Transfer', 'Domestic Electricity, Wiring Safety (Fuse/MCB/Earthing) & Power Costing (kWh)', 'Light Optics, Sound Waves & Solar/Geothermal/Wind Energy in Kenya'], kiq: 'How do solar panels and geothermal plants supply clean electricity in Kenya?', resources: 'Solar cell kit, 3-pin plug, ammeter/voltmeter, KPLC token meter chart' },
      ],
    },
  },

  'Literature in English': {
    shortCode: 'LIT-ENG',
    strandsByTerm: {
      1: [
        { strand: '1.0 ORAL LITERATURE & AFRICAN PERFORMANCE TRADITIONS', subs: ['Classification & Features of Oral Narratives (Trickster, Dilemma, Etiological, Legends)', 'Oral Songs/Poetry, Proverbs, Riddles, Tongue Twisters & Fieldwork Methods', 'Performance Techniques: Voice Projection, Tonal Variation, Facial Expression & Audience'], kiq: 'How do performance cues bring oral narratives and songs to life?', resources: 'Moran Oral Literature for Senior School, audio/video recordings, fieldwork guides' },
      ],
      2: [
        { strand: '2.0 INTENSIVE STUDY OF APPROVED NOVELS & SHORT STORIES', subs: ['Plot Structure, Setting & Conflict in Approved Novels (Dreams Denied / Echoes of the Heartland / A Cowrie of Hope / The Crucial Interview)', 'Characterization, Themes & Moral Values in Approved Short Stories (The Gold Frame / The Necklace and Other Stories)', 'Stylistic Devices: Irony, Symbolism, Flashback, Foreshadowing, Satire & Dialogue'], kiq: 'How do authors use characterization and style to mirror contemporary society?', resources: 'Approved KICD Novels, Short Story Anthologies & Oxford Head Start Written Literature' },
      ],
      3: [
        { strand: '3.0 DRAMA (PLAYS), POETRY & AUTOBIOGRAPHY / BIOGRAPHY', subs: ['Dramatic Elements, Stage Directions & Conflict in Approved Plays (The Bride / The Master Builder / The Forest No Longer Cries / Nina)', 'Poetic Persona, Imagery, Rhyme, Rhythm, Tone & Mood (Unchained and Other Poems / Senior School Poetry Companion)', 'Autobiography & Life Writing Analysis (What Next? / Rays in the Raindrops) & Critical Essay Writing'], kiq: 'What distinguishes dramatic action and poetic imagery from prose fiction?', resources: 'Approved KICD Plays, Poetry Anthologies & Biographies' },
      ],
    },
  },

  'Fasihi ya Kiswahili': {
    shortCode: 'FAS-KIS',
    strandsByTerm: {
      1: [
        { strand: '1.0 FASIHI SIMULIZI NA UTAFITI WA NYANJANI', subs: ['Maana, Sifa na Dhima ya Fasihi Simulizi; Hadithi (Ngano, Hekaya, Hurafa, Visasili, Mighani)', 'Nyimbo, Maigizo, Semi (Methali, Vitendawili, Nahau, Misemo, Vitanza Ndimi) na Ngomezi', 'Mbinu za Ukusanyaji na Uhifadhi wa Data ya Fasihi Simulizi Nyanjani'], kiq: 'Fasihi simulizi ina nafasi gani katika kuhifadhi utamaduni na maadili ya jamii?', resources: 'Oxford Fani ya Fasihi Simulizi (Assumpta K. Matei), vinasa sauti, chati' },
      ],
      2: [
        { strand: '2.0 UCHAMBUZI WA RIWAYA, HADITHI FUPI NA TAWASIFU TEULE', subs: ['Ploti, Mandhari na Dhamira katika Riwaya Teule (Fumbo la Baba / Ahadi ya Neema / Wema Waliobaki / Mwisho wa Dhiki / Binti ya Waziri)', 'Wahusika na Mbinu za Lugha katika Hadithi Fupi (Kichaa cha Mlungula na Hadithi Nyingine)', 'Tawasifu na Wasifu Teule (Mlemavu? Sio Mimi / Wasifu wa Mekatilili wa Menza)'], kiq: 'Riwaya na hadithi fupi teule zinaangazia vipi changamoto na matumaini ya jamii ya leo?', resources: 'Riwaya, Hadithi Fupi na Tawasifu Teule Zilizoidhinishwa na KICD' },
      ],
      3: [
        { strand: '3.0 UCHAMBUZI WA TAMTHILIA NA USHAIRI WA KISWAHILI', subs: ['Muundo, Mgogoro na Uigizaji katika Tamthilia Teule (Narudi Nyumbani / Wema na Wawi / Kasri la Faraja / Kivuli Kilichopinda / Sauti ya Kimya / Si Shwari)', 'Bahari za Mashairi (Tarbia, Takhmisa, Mashairi Huru), Vina, Mizani, Kibwagizo na Toni', 'Uhakiki wa Kazi za Fasihi Andishi na Uandishi wa Insha za Kiuambuzi'], kiq: 'Tunachambuaje arudhi, lugha ya picha na ujumbe katika ushairi na tamthilia?', resources: 'Tamthilia Teule, Msingi wa Ushairi na Dira ya Fasihi Andishi' },
      ],
    },
  },

  Agriculture: {
    shortCode: 'AGRIC',
    strandsByTerm: {
      1: [
        { strand: '1.0 SOIL SCIENCE, WATER CONSERVATION & CROP PRODUCTION', subs: ['Soil Profile, Soil Testing (pH & Nutrients), Organic Manures & Inorganic Fertilizers', 'Micro-Catchments, Drip/Sprinkler Irrigation & Climate-Smart Conservation Tillage', 'Nursery Establishment, Vegetative Propagation, Pest/Disease IPM & Post-Harvest Handling'], kiq: 'How do soil testing and drip irrigation maximize crop yields in Kenya?', resources: 'Soil testing kit, drip lines, grafting knives, Healthy Planet / Moran Agriculture' },
      ],
      2: [
        { strand: '2.0 LIVESTOCK PRODUCTION, HEALTH & BREEDING', subs: ['Dairy, Beef, Poultry, Sheep, Goat, Pig & Apiculture Breeds and Housing Structures', 'Livestock Nutrition, Ration Formulation, Parasite Control & Vaccination Schedules', 'Clean Milk Production, Egg Handling & Value Addition of Livestock Products'], kiq: 'How does balanced ration formulation improve dairy and poultry productivity?', resources: 'Feed samples, knapsack sprayer, livestock charts, KLB / Mentor Agriculture' },
      ],
      3: [
        { strand: '3.0 AGROFORESTRY, FARM MECHANIZATION & AGRIBUSINESS ECONOMICS', subs: ['Agroforestry Tree-Crop-Livestock Integration & Farm Structures Maintenance', 'Farm Tools, Tractor Implements & Renewable Biogas/Solar Farm Power', 'Production Economics, Farm Records, Gross Margin Budgets & Agricultural Co-operatives'], kiq: 'How do gross margin budgets and value addition turn farming into a profitable enterprise?', resources: 'Farm inventory ledgers, agroforestry seedlings, MTP / Smart Minds Agriculture' },
      ],
    },
  },

  'Computer Studies': {
    shortCode: 'COMP-STD',
    strandsByTerm: {
      1: [
        { strand: '1.0 COMPUTER SYSTEMS, HARDWARE & OPERATING SYSTEMS', subs: ['Central Processing Unit (ALU, Control Unit, Registers), Buses & Memory (RAM/ROM/Cache)', 'Number Systems (Binary, Octal, Hexadecimal), Character Coding & Logic Gates', 'Operating Systems Management, File Systems, Drivers & Preventive Hardware Maintenance'], kiq: 'How do CPU components coordinate during the fetch-decode-execute cycle?', resources: 'Computer lab, motherboard components, KLB Excelling / Oxford Active Computer Studies' },
      ],
      2: [
        { strand: '2.0 PRODUCTIVITY SOFTWARE, PROGRAMMING & DATABASES', subs: ['Advanced Spreadsheets (Formulas, Pivot Tables, Charts) & Desktop Publishing', 'Algorithm Design (Flowcharts, Pseudocode) & Structured Programming (Variables, Loops, Functions)', 'Relational Database Management Systems (Tables, Primary/Foreign Keys, Forms, SQL Queries & Reports)'], kiq: 'How do relational databases eliminate data redundancy in school and hospital systems?', resources: 'Python/SQL IDE, spreadsheet software, Modern Technology / Longhorn Computer Studies' },
      ],
      3: [
        { strand: '3.0 DATA COMMUNICATION, NETWORKS, CYBERSECURITY & SYSTEMS PROJECT', subs: ['Network Topologies, Transmission Media (Fibre Optic, UTP, Wireless), Routers & IP Addressing', 'Cybersecurity Threats, Encryption, Backups & Kenya Data Protection Act Compliance', 'System Development Life Cycle (SDLC): Fact-Finding, Design, Testing & Documentation'], kiq: 'Which technical and legal safeguards protect organizations against cyberattacks?', resources: 'LAN switches, RJ45 crimping tools, Mentor Computer Studies' },
      ],
    },
  },

  'Home Science': {
    shortCode: 'HOME-SCI',
    strandsByTerm: {
      1: [
        { strand: '1.0 FOODS, NUTRITION & MEAL MANAGEMENT', subs: ['Macro- & Micro-Nutrients, Nutritional Deficiency Disorders & Food Fortification', 'Kitchen Equipment, Hygiene, Cooking Methods (Moist/Dry Heat) & Nutrient Conservation', 'Meal Planning for Special Groups (Expectant Mothers, Infants, Invalid, Elderly) & Food Preservation'], kiq: 'How do cooking methods and balanced meal planning preserve vital nutrients?', resources: 'Home Science kitchen lab, food group charts, KLB / Mentor Home Science' },
      ],
      2: [
        { strand: '2.0 CLOTHING, TEXTILES & GARMENT CONSTRUCTION', subs: ['Classification & Properties of Natural and Synthetic Textile Fibres', 'Sewing Machine Parts, Fault-Finding, Stitches, Seams & Control of Fullness', 'Commercial Pattern Interpretation, Cutting Out, Garment Assembly & Laundrywork'], kiq: 'Why must care labels and fibre properties guide laundry and ironing temperatures?', resources: 'Sewing machines, fabric swatches, tape measures, MTP / StoryMoja Home Science' },
      ],
      3: [
        { strand: '3.0 MATERNAL/CHILD HEALTH CARE, HOME MANAGEMENT & CONSUMER EDUCATION', subs: ['Antenatal/Postnatal Care, Immunization Schedule (KEPI), Weaning & Play Safety', 'Ventilation, Lighting, Sanitation, Household Budgeting & Consumer Rights', 'Hospitality Etiquette, Table Setting, Flower Arrangement & Cake Decoration'], kiq: 'How does adherence to the KEPI immunization schedule protect child health?', resources: 'Maternal-child health clinic card sample, household budget sheets, Booklyst Home Science' },
      ],
    },
  },

  'Information Communication Technology (ICT)': {
    shortCode: 'ICT',
    strandsByTerm: {
      1: [
        { strand: '1.0 ICT INFRASTRUCTURE, CLOUD TOOLS & DIGITAL WORKSPACES', subs: ['Computing Devices, Peripherals, Storage Media & Basic Troubleshooting', 'Operating Systems, Cloud Storage, Collaborative Suites & Digital File Hygiene', 'Word Processing, Electronic Presentations & Professional Document Formatting'], kiq: 'How do cloud collaboration tools improve productivity and version control?', resources: 'Desktop/laptop computers, projector, KLB / Spotlight ICT' },
      ],
      2: [
        { strand: '2.0 SPREADSHEET ANALYTICS, MULTIMEDIA & WEB TECHNOLOGIES', subs: ['Data Analysis in Spreadsheets (Logical Functions, VLOOKUP, Conditional Formatting & Charts)', 'Digital Graphics, Audio-Visual Editing & Desktop Publishing Layouts', 'Web Design Fundamentals (HTML5, CSS3, Accessibility & Domain Hosting)'], kiq: 'How do HTML5, CSS3, and spreadsheets power modern digital businesses?', resources: 'Code editor, spreadsheet software, Modern Technology / Longhorn ICT' },
      ],
      3: [
        { strand: '3.0 INTERNET NETWORKING, CYBER SAFETY & EMERGING TECHNOLOGIES', subs: ['Internet Protocols, Wi-Fi Configuration, E-Commerce & E-Citizen Digital Services', 'Cyber Hygiene, Two-Factor Authentication, Plagiarism Ethics & Data Privacy', 'Artificial Intelligence (AI), Internet of Things (IoT) & Digital Freelancing Portfolio'], kiq: 'How can learners use AI tools ethically while protecting personal data online?', resources: 'Router setup lab, cybersecurity checklists, Mentor ICT' },
      ],
    },
  },

  'Music and Dance': {
    shortCode: 'MUS-DNC',
    strandsByTerm: {
      1: [
        { strand: '1.0 FOUNDATIONS OF MUSIC THEORY, RHYTHM & PITCH', subs: ['Staff Notation (Treble & Bass Clefs), Time Signatures, Rests & Dotted Notes', 'Major & Minor Scales, Key Signatures, Intervals & Triads', 'Sight-Singing (Sol-fa & Staff), Aural Rhythm/Melody Dictation & Vocal Technique'], kiq: 'How do time signatures and key signatures organize musical harmony and rhythm?', resources: 'Keyboard/piano, manuscript books, pitch pipe, KLB / Hummingbird Music and Dance' },
      ],
      2: [
        { strand: '2.0 KENYAN INDIGENOUS, AFRICAN & WESTERN PERFORMANCE AND DANCE', subs: ['Classification of African Traditional Instruments (Chordophones, Membranophones, Aerophones, Idiophones)', 'Choreography, Space, Costumes & Storytelling in Kenyan Cultural and Contemporary Dances', 'Solo, Choral & Instrumental Ensemble Rehearsal and Stagecraft'], kiq: 'How do traditional Kenyan dances preserve historical identity and social cohesion?', resources: 'Kayamba, nyatiti/orutu/isukuti models, rehearsal space, Moran / Mentor Music and Dance' },
      ],
      3: [
        { strand: '3.0 DIGITAL MUSIC PRODUCTION, COMPOSITION & CREATIVE ENTERPRISE', subs: ['Melody Writing, Four-Part Harmony Basics & Song Arrangement', 'Digital Audio Workstations (DAWs), Microphone Recording & Sound Mixing', 'Copyright Law (KECOBO/MCSK), Event Management & Music Career Pathways'], kiq: 'How does copyright registration protect Kenyan musicians and choreographers?', resources: 'DAW software, condenser microphone, manuscript scores' },
      ],
    },
  },

  'Theatre and Film': {
    shortCode: 'THT-FLM',
    strandsByTerm: {
      1: [
        { strand: '1.0 DRAMATIC WRITING, SCRIPT ANALYSIS & ACTING TECHNIQUES', subs: ['Elements of Drama: Plot, Character Arc, Conflict, Dialogue & Subtext', 'Stage Scripting, Screenplay Formatting & Storyboarding', 'Voice, Movement, Improvisation, Character Motivation & Blocking'], kiq: 'How do subtext, blocking, and voice modulation make stage characters believable?', resources: 'Sample stage/film scripts, rehearsal stage, KLB Excelling / Master Theatre and Film' },
      ],
      2: [
        { strand: '2.0 STAGECRAFT, CINEMATOGRAPHY, LIGHTING & SOUND DESIGN', subs: ['Set Design, Props, Costuming & Stage Make-Up', 'Camera Shot Sizes, Angles, Framing (Rule of Thirds), Lighting (Three-Point) & Sound Capture', 'Directing Actors for Stage vs Camera & Production Continuity'], kiq: 'How do camera angles and three-point lighting shape audience emotion in film?', resources: 'DSLR/smartphone rig, tripod, lapel mic, LED lights, Distinction Theatre and Film' },
      ],
      3: [
        { strand: '3.0 POST-PRODUCTION EDITING, CRITICISM & FILM ENTREPRENEURSHIP', subs: ['Non-Linear Video Editing, Pacing, Transitions, Foley Sound & Colour Grading', 'Theatre & Film Critique, Kenya Film Classification Guidelines & Ethics', 'Film Budgeting, Pitching, Distribution & Creative Festival Showcase'], kiq: 'How does post-production editing transform raw footage into a compelling narrative?', resources: 'Video editing workstation, storyboard templates, Champion Theatre & Film' },
      ],
    },
  },

  'Fine Arts': {
    shortCode: 'FINE-ART',
    strandsByTerm: {
      1: [
        { strand: '1.0 DRAWING, PAINTING & TWO-DIMENSIONAL DESIGN', subs: ['Elements & Principles of Art: Line, Tone, Texture, Perspective (1- & 2-Point) & Proportion', 'Still-Life, Landscape & Human Figure Drawing (Charcoal, Graphite, Ink)', 'Colour Theory (Colour Wheel, Tints/Shades, Complementary) & Acrylic/Watercolour Painting'], kiq: 'How do linear perspective and tonal shading create depth on a flat surface?', resources: 'Sketchbooks, B-series pencils, easels, acrylic/watercolour paints, Hummingbird / KLB Fine Arts' },
      ],
      2: [
        { strand: '2.0 GRAPHIC DESIGN, PRINTMAKING, FABRIC DECORATION & COLLAGE', subs: ['Typography, Logo/Brand Identity, Poster Illustration & Digital Layout', 'Relief/Stencil/Screen Printing & Fabric Decoration (Tie-and-Dye, Batik)', 'Mosaic, Collage & Mixed-Media Surface Composition'], kiq: 'How do typography and visual hierarchy make graphic posters communicate instantly?', resources: 'Squeegees, silk screens, fabric dyes, wax, Front Row / Mentor Fine Arts' },
      ],
      3: [
        { strand: '3.0 SCULPTURE, CERAMICS, WEAVING & ART CURATION', subs: ['Clay Preparation, Hand-Building Ceramics (Pinch, Coil, Slab), Glazing & Firing', 'Sculpture in Relief and in the Round (Carving, Casting, Armature Modelling) & Basketry/Weaving', 'Art History Appreciation, Portfolio Mounting, Pricing & Gallery Exhibition'], kiq: 'Why must clay be wedged properly before modelling and kiln firing?', resources: 'Potter clay, modelling tools, looms, mounting boards' },
      ],
    },
  },

  'Sports and Recreation': {
    shortCode: 'SPT-REC',
    strandsByTerm: {
      1: [
        { strand: '1.0 EXERCISE PHYSIOLOGY, ANATOMY & SPORTS NUTRITION', subs: ['Skeletal & Muscular Systems in Human Movement (Joints, Agonist/Antagonist Pairs)', 'Cardiorespiratory Endurance, Energy Systems (Aerobic vs Anaerobic) & Hydration', 'Warm-Up, Cool-Down, Sports Injury Prevention (RICER) & Anti-Doping Ethics (ADAK)'], kiq: 'How do aerobic and anaerobic energy systems fuel sprinters versus marathoners?', resources: 'Anatomical charts, stopwatches, first-aid kit, KLB / Spotlight Sports and Recreation' },
      ],
      2: [
        { strand: '2.0 OFFICIATING, COACHING & TACTICS IN INDIVIDUAL AND TEAM SPORTS', subs: ['Track & Field Athletics: Sprints, Middle/Long Distance, Jumps & Throws Rules', 'Court & Field Invasion Games (Football, Basketball, Volleyball, Netball, Handball, Rugby)', 'Racket, Aquatics & Indigenous Recreational Games'], kiq: 'What principles govern fair officiating and tactical positioning in team sports?', resources: 'Marked pitches/courts, balls, whistles, cones, Moran / MTP Sports and Recreation' },
      ],
      3: [
        { strand: '3.0 OUTDOOR RECREATION, TOURNAMENT MANAGEMENT & SPORTS ENTERPRISE', subs: ['Outdoor Adventure, Camping Safety, Orienteering & Wellness Fitness Programming', 'Tournament Draw Formats (Knockout, Round-Robin / League, Seeding)', 'Sports Marketing, Talent Management & Facility Maintenance'], kiq: 'How do tournament organizers schedule fair round-robin and knockout fixtures?', resources: 'Fixture templates, compasses, fitness mats' },
      ],
    },
  },

  'Physical Education': {
    shortCode: 'PHYS-ED',
    strandsByTerm: {
      1: [
        { strand: '1.0 HEALTH-RELATED & SKILL-RELATED PHYSICAL FITNESS', subs: ['Components of Fitness: Flexibility, Muscular Strength/Endurance, Agility, Balance & Reaction Time', 'Posture, Safe Stretching, Circuit Training & Heart-Rate Monitoring', 'First Aid for Sprains, Strains, Cramps & Heat Exhaustion'], kiq: 'How does regular circuit training improve cardiovascular health and academic focus?', resources: 'Skipping ropes, cones, stopwatches, mats, Spotlight / KLB Physical Education' },
      ],
      2: [
        { strand: '2.0 ATHLETICS, GYMNASTICS & BALL GAMES EXECUTION', subs: ['Baton Exchange in Relays, Hurdling, Long/Triple Jump & Shot Put/Javelin Safety', 'Gymnastic Balances, Vaulting & Rhythmic Sequences', 'Skills, Rules & Fair Play in Volleyball, Football, Netball, Basketball & Handball'], kiq: 'Why is proper baton-exchange timing inside the takeover zone critical in relays?', resources: 'Relay batons, balls, landing mats, Hummingbird / Moran Physical Education' },
      ],
      3: [
        { strand: '3.0 SWIMMING / WATER SAFETY, INCLUSIVE ADAPTED PE & LEADERSHIP', subs: ['Pool Hygiene, Water Rescue Reach-Throw Techniques & Basic Swimming Strokes', 'Adapted Physical Activities for Learners with Special Needs', 'Organizing Intramural School Sports Days & Sportsmanship Values'], kiq: 'What safe non-entry rescue techniques prevent drowning emergencies?', resources: 'Rescue poles/floats, whistles, score sheets' },
      ],
    },
  },

  French: {
    shortCode: 'FRENCH',
    strandsByTerm: {
      1: [
        { strand: '1.0 COMPRÉHENSION ET EXPRESSION ORALES (SALUTATIONS, FAMILLE & ÉCOLE)', subs: ['Les salutations, se présenter (nom, âge, nationalité, profession) et les formules de politesse', 'La famille, les objets de la classe, les nombres, les jours, les mois et l’heure', 'Les articles définis/indéfinis, le genre/nombre des noms et les verbes être, avoir et -er au présent'], kiq: 'Comment se présenter poliment et décrire sa famille et son école en français?', resources: 'KLB Excelling in French / One Planet Méthode de français, cartes lexicales, audio' },
      ],
      2: [
        { strand: '2.0 VIE QUOTIDIENNE, ACHATS, VOYAGES ET GRAMMAIRE FONCTIONNELLE', subs: ['Les repas, au marché/restaurant, les articles partitifs (du, de la, des) et les prix', 'La météo, les vêtements, les moyens de transport et demander/indiquer le chemin', 'Les adjectifs possessifs/qualificatifs, la négation (ne...pas), les verbes en -ir/-re et le futur proche'], kiq: 'Comment faire des achats au marché et demander son chemin en français?', resources: 'Dialogues enregistrés, menus français, cartes de ville, Longhorn Français' },
      ],
      3: [
        { strand: '3.0 LECTURE, RÉDACTION FONCTIONNELLE ET FRANCOPHONIE', subs: ['Raconter des événements au passé composé (auxiliaires avoir et être) et à l’imparfait', 'Les pronoms compléments, la santé, l’environnement et les technologies numériques', 'Rédaction de courriels, lettres amicales/formelles et découverte du monde francophone en Afrique'], kiq: 'Pourquoi le français est-il un atout majeur pour la diplomatie et le commerce en Afrique?', resources: 'Carte de la Francophonie, textes de compréhension, dictionnaire français' },
      ],
    },
  },

  Arabic: {
    shortCode: 'ARABIC',
    strandsByTerm: {
      1: [
        { strand: '1.0 AL-ISTIMA WA AL-TAHADDUTH (LISTENING, SPEAKING & SCRIPT)', subs: ['Arabic Alphabet Articulation (Makharij), Short/Long Vowels (Harakat & Madd), Sukun & Shaddah', 'Greetings (At-Tahiyyat), Self-Introduction (Ta’aruf), Family & School Vocabulary', 'Demonstrative Pronouns (Hadha/Hadhihi), Masculine/Feminine Nouns (Mudhakkar/Mu’annath) & Sun/Moon Letters'], kiq: 'How do vowel diacritics (Harakat) change word pronunciation and meaning in Arabic?', resources: 'KLB Excelling Arabic / Atfaal Arabic, alphabet charts, audio recitations' },
      ],
      2: [
        { strand: '2.0 AL-QIRA’AH WA AL-QAWA’ID (READING COMPREHENSION & GRAMMAR)', subs: ['Nominal Sentences (Al-Jumlah Al-Ismiyyah: Mubtada & Khabar) and Verbal Sentences (Al-Jumlah Al-Fi’liyyah)', 'Singular, Dual (Muthanna) & Plural (Jam’u) Forms; Prepositions (Huruf Al-Jarr) & Numbers', 'Reading Dialogues on Time, Market Shopping, Travel, Health & Environment'], kiq: 'How do nominal and verbal sentences differ in structure and agreement in Arabic?', resources: 'Graded Arabic passages, flashcards, grammar charts' },
      ],
      3: [
        { strand: '3.0 AL-KITABAH (FUNCTIONAL WRITING, PRONOUNS & TENSES)', subs: ['Past Tense (Al-Fi’l Al-Madhi), Present/Future Tense (Al-Mudhari’) & Imperative (Al-Amr)', 'Attached & Detached Pronouns (Ad-Dhama’ir) and Adjectives (An-Na’t wa Al-Man’ut)', 'Guided Composition, Friendly/Formal Letters & Translation Practice'], kiq: 'How does proficiency in Arabic open global trade, diplomacy, and scholarship opportunities?', resources: 'Arabic ruled notebooks, bilingual glossaries, KLB / Atfaal Arabic' },
      ],
    },
  },

  German: {
    shortCode: 'GERMAN',
    strandsByTerm: {
      1: [
        { strand: '1.0 BEGRÜSSUNG, FAMILIE, SCHULE UND GRUNDGRAMMATIK', subs: ['Begrüßung, Sich vorstellen (Name, Herkunft, Alter, Wohnort) und Aussprache (Umlaute ä, ö, ü, ß)', 'Zahlen, Uhrzeit, Wochentage, Schulsachen und Familie', 'Bestimmter/unbestimmter Artikel (der, die, das), Personalpronomen und Verbkonjugation im Präsens (sein, haben)'], kiq: 'Wie stellt man sich auf Deutsch höflich vor und beschreibt seinen Schulalltag?', resources: 'KLB Deutsch Mit Erfolg Schülerbuch, Wortkarten, Hörtexte' },
      ],
      2: [
        { strand: '2.0 ALLTAG, FREIZEIT, EINKAUFEN UND SATZBAU', subs: ['Essen und Trinken, Einkaufen im Supermarkt, Preise und Akkusativ', 'Freizeit, Hobbys, Wetter, Kleidung und Modalverben (können, müssen, wollen, möchten)', 'Trennbare Verben, Wortstellung im Hauptsatz (Position 2) und W-Fragen / Ja-Nein-Fragen'], kiq: 'Wie bildet man korrekte Sätze mit Modalverben und Akkusativ im Alltag?', resources: 'Dialogkarten, Speisekarten, KLB Deutsch Mit Erfolg' },
      ],
      3: [
        { strand: '3.0 REISEN, GESUNDHEIT, PERFEKT UND TEXTPRODUKTION', subs: ['Wegbeschreibung, Verkehrsmittel, Körperteile, Gesundheit und Dativ-Präpositionen', 'Über Vergangenes sprechen: Das Perfekt mit haben und sein', 'E-Mails, Postkarten und kurze Aufsätze schreiben; Landeskunde (DACH-Länder & Kenia)'], kiq: 'Wie berichtet man auf Deutsch im Perfekt über vergangene Erlebnisse?', resources: 'Landkarte Deutschlands, Lesetexte, Übungshefte' },
      ],
    },
  },

  'Life Skills': {
    shortCode: 'LIFE-SKL',
    strandsByTerm: {
      1: [
        { strand: '1.0 SELF-AWARENESS, SELF-ESTEEM & EMOTIONAL REGULATION', subs: ['Personal Identity, Strengths, Values, Temperaments & Growth Mindset', 'Managing Stress, Anxiety, Anger & Academic Pressure Constructively', 'Personal Hygiene, Healthy Boundaries & Adolescent Well-Being'], kiq: 'How do self-awareness and emotional regulation help learners overcome peer pressure?', resources: 'Life Skills for Senior School Learners (Chalan Foundation), reflective journals' },
      ],
      2: [
        { strand: '2.0 INTERPERSONAL RELATIONSHIPS, EFFECTIVE COMMUNICATION & CONFLICT RESOLUTION', subs: ['Active Listening, Assertiveness vs Aggression/Passivity & Empathy', 'Resisting Negative Peer Influence, Drug & Substance Abuse Prevention & Digital Safety', 'Peaceful Conflict Resolution, Negotiation, Mediation & Respect for Diversity'], kiq: 'Why is assertive communication more effective than passive or aggressive responses?', resources: 'Role-play scenario cards, NACADA awareness charts, case studies' },
      ],
      3: [
        { strand: '3.0 DECISION-MAKING, CRITICAL THINKING, LEADERSHIP & CAREER PLANNING', subs: ['Structured Decision-Making Steps, Problem-Solving & Critical Evaluation of Media', 'Goal Setting (SMART Goals), Time Management, Financial Literacy & Ethical Leadership', 'Career Pathway Alignment, Interview Readiness & Community Citizenship'], kiq: 'How do SMART goals and ethical decision-making prepare youth for career success?', resources: 'Career wheel charts, personal timetable templates' },
      ],
    },
  },

  Aviation: {
    shortCode: 'AVIAT',
    strandsByTerm: {
      1: [
        { strand: '1.0 AVIATION SAFETY, AIRCRAFT STRUCTURES & THEORY OF FLIGHT', subs: ['Workshop/Airfield Safety, Foreign Object Debris (FOD) Prevention & Aviation Regulatory Bodies (KCAA / ICAO)', 'Aircraft Classification, Major Airframe Components (Fuselage, Wings, Empennage, Landing Gear)', 'Four Forces of Flight (Lift, Weight, Thrust, Drag), Bernoulli’s Principle & Primary Flight Controls (Ailerons, Elevator, Rudder)'], kiq: 'How does an aerofoil cross-section generate lift using Bernoulli’s principle and angle of attack?', resources: 'Aerofoil wind-tunnel model, aircraft component charts, KLB / Bookmark / Penguin Aviation' },
      ],
      2: [
        { strand: '2.0 AIRCRAFT PROPULSION, FLIGHT INSTRUMENTS & AVIATION METEOROLOGY', subs: ['Piston Reciprocating Engines vs Gas Turbine (Turbojet, Turbofan, Turboprop) Principles', 'Pitot-Static Six-Pack Flight Instruments (Airspeed Indicator, Altimeter, VSI, Attitude, Heading, Turn Coordinator)', 'Atmospheric Layers, Cloud Types, Wind Shear, Icing & METAR/TAF Aviation Weather Reports'], kiq: 'Why must pilots calibrate the altimeter pressure setting (QNH) before takeoff and landing?', resources: 'Cockpit instrument simulator panel, weather charts, KLB Excelling Aviation' },
      ],
      3: [
        { strand: '3.0 AIR NAVIGATION, AIRPORT OPERATIONS & AIRCRAFT MAINTENANCE BASICS', subs: ['Latitude/Longitude, Magnetic Compass Errors, Aeronautical Charts & Dead Reckoning', 'Aerodrome Markings, Runway Lighting, Air Traffic Control (ATC) Phonetic Alphabet & Phraseology', 'Aircraft Materials, Non-Destructive Inspection Basics & Emerging Drone (UAV) Operations'], kiq: 'Why do pilots and air traffic controllers use standard ICAO phonetic phraseology?', resources: 'ICAO phonetic chart, aeronautical map excerpts, model runway layout' },
      ],
    },
  },

  'Building Construction': {
    shortCode: 'BLD-CON',
    strandsByTerm: {
      1: [
        { strand: '1.0 WORKSHOP SAFETY, BUILDING TOOLS, MATERIALS & SITE PREPARATION', subs: ['Construction Site PPE, Scaffolding Safety &NCA/OSHA Building Regulations', 'Masonry Hand/Power Tools, Aggregates, Cement, Mortar/Concrete Batching Ratios (1:2:4) & Curing', 'Site Clearance, Setting Out (3-4-5 Builder’s Square & Profile Boards), Trench Excavation & Timbering'], kiq: 'Why must freshly cast concrete be cured properly to achieve design compressive strength?', resources: 'Spirit levels, plumb bobs, builder square, cement/sand samples, KLB / Moran Building Construction' },
      ],
      2: [
        { strand: '2.0 FOUNDATIONS, WALLING BONDS, DAMP PROOFING & ARCHITECTURAL DRAWING', subs: ['Strip, Pad, Raft & Pile Foundations Suitable for Varied Kenyan Soil Types (e.g. Black Cotton Soil)', 'Brick/Block/Stone Walling Bonds (Stretcher, English, Flemish), Bridging Openings (Lintels & Arches) & DPC', 'Architectural Floor Plans, Elevations, Cross-Sections & Quantity Take-Off Estimation'], kiq: 'Why do expansive black cotton soils require specialized foundation designs?', resources: 'Building blocks, trowels, drawing boards, scale rulers, Longhorn / Mentor Building Construction' },
      ],
      3: [
        { strand: '3.0 ROOFING, FLOORS, FINISHES, PLUMBING & DRAINAGE SYSTEMS', subs: ['Pitched & Flat Roof Trusses, Covering Materials & Rainwater Goods', 'Solid Ground Floors, Screeding, Plastering, Rendering, Tiling & Painting Finishes', 'Domestic Cold/Hot Water Supply Pipework, Sanitary Appliances, Traps & Septic/Sewer Drainage'], kiq: 'How do water-seal traps prevent foul sewer gases from entering residential buildings?', resources: 'PVC pipe fittings, traps, roof truss models, estimation sheets' },
      ],
    },
  },

  Electricity: {
    shortCode: 'ELECTR',
    strandsByTerm: {
      1: [
        { strand: '1.0 ELECTRICAL SAFETY, DC/AC CIRCUIT THEORY & MEASURING INSTRUMENTS', subs: ['Electrical Workshop Safety, Shock First Aid, Fire Extinguishers (CO2/Dry Powder) & IEE/EPRA Wiring Rules', 'Charge, Current, Voltage, Resistance, Ohm’s Law, Kirchhoff’s Laws & Series-Parallel Networks', 'Power (P = VI = I2R), Electrical Energy (kWh) & Digital Multimeter / Megger Measurements'], kiq: 'How do Kirchhoff’s current and voltage laws verify complex electrical circuits?', resources: 'Digital multimeters, resistors, breadboards, DC power supplies, KLB / Moran Electricity' },
      ],
      2: [
        { strand: '2.0 DOMESTIC WIRING INSTALLATIONS, EARTHING & PROTECTION', subs: ['Final Sub-Circuits: Radial Lighting Circuits, Two-Way/Intermediate Switching & Ring Main Socket Circuits', 'Consumer Control Unit (Main Switch, MCBs, RCD/ELCB), Cable Sizing & Earthing Systems', 'Inspection, Continuity, Insulation Resistance & Polarity Testing of Installations'], kiq: 'How do earth wires and Residual Current Devices (RCDs) protect users from electrocution?', resources: ' Wiring boards, MCB consumer unit, twin-and-earth cables, Master / Mentor Electricity' },
      ],
      3: [
        { strand: '3.0 MAGNETISM, TRANSFORMERS, ELECTRIC MOTORS, ELECTRONICS & SOLAR PV', subs: ['Electromagnetic Induction, Single-Phase Transformers (Turns Ratio & Efficiency) & DC/Induction Motors', 'Semiconductor Diodes, Bridge Rectifiers, Transistors & Basic Logic/Sensor Circuits', 'Solar Photovoltaic (PV) Sizing (Panels, Charge Controller, Inverter, Battery Bank) & Maintenance'], kiq: 'How do engineers size a solar PV battery and inverter system for a Kenyan household?', resources: 'Step-down transformers, diodes/capacitors, solar PV training kit' },
      ],
    },
  },

  'Metal Work': {
    shortCode: 'MTL-WRK',
    strandsByTerm: {
      1: [
        { strand: '1.0 WORKSHOP SAFETY, METALLURGY & PRECISION MARKING/MEASURING', subs: ['Metalwork PPE, Machine Guards & Safe Workshop Housekeeping', 'Ferrous Metals (Cast Iron, Mild/High-Carbon/Stainless Steel) & Non-Ferrous Metals/Alloys (Aluminium, Brass, Bronze, Copper)', 'Precision Measuring & Marking Out: Vernier Callipers, Micrometers, Scribers, Dividers & Surface Plate'], kiq: 'How does carbon content change the hardness and ductility of plain carbon steels?', resources: 'Vernier callipers, micrometers, metal specimens, KLB / Moran Metal Work' },
      ],
      2: [
        { strand: '2.0 BENCH FITTING, SHEET METAL WORK, HEAT TREATMENT & FORGING', subs: ['Hacksawing, Filing, Chiselling, Drilling, Thread Tapping & Dieing', 'Sheet Metal Pattern Development (Parallel Line & Radial), Seams, Soldering & Riveting', 'Heat Treatment Processes (Annealing, Normalizing, Hardening, Tempering) & Forge Shaping'], kiq: 'Why must hardened high-carbon steel tools be tempered before workshop use?', resources: 'Bench vices, hacksaws, files, taps & dies, tin snips, Longhorn / Mentor Metalwork' },
      ],
      3: [
        { strand: '3.0 LATHE MACHINING, WELDING FABRICATION & CORROSION PROTECTION', subs: ['Centre Lathe Operations: Facing, Parallel/Taper Turning, Knurling & Cutting Speeds', 'Manual Metal Arc (MMA) Welding, Gas (Oxy-Acetylene) Welding, Brazing & Weld Defect Inspection', 'Grinding, Buffing, Electroplating, Galvanizing, Spray Painting & Project Costing'], kiq: 'What welding safety PPE and current settings prevent arc-eye and slag inclusion?', resources: 'Welding inverter, auto-darkening helmet, centre lathe chart' },
      ],
    },
  },

  'Power Mechanics': {
    shortCode: 'PWR-MECH',
    strandsByTerm: {
      1: [
        { strand: '1.0 AUTOMOTIVE WORKSHOP SAFETY, TOOLS, FASTENERS & ENGINE FUNDAMENTALS', subs: ['Garage Safety, Lifting Jacks/Axle Stands, Fire Safety & Torque Wrench Precision', 'Bolts, Nuts, Locking Devices, Gaskets, Seals & Bearings', 'Internal Combustion Engine Components (Cylinder Block, Piston, Crankshaft, Camshaft, Valves) & 4-Stroke vs 2-Stroke Cycles'], kiq: 'How do the intake, compression, power, and exhaust strokes differ between petrol (SI) and diesel (CI) engines?', resources: 'Cutaway 4-stroke engine model, torque wrenches, feeler gauges, KLB / Moran Power Mechanics' },
      ],
      2: [
        { strand: '2.0 ENGINE FUEL, LUBRICATION, COOLING & IGNITION/ELECTRICAL SYSTEMS', subs: ['Electronic Fuel Injection (EFI), Diesel Common-Rail Systems, Air Cleaners & Turbochargers', 'Pressurized Cooling System (Radiator, Thermostat, Water Pump) & Engine Lubrication (Oil Grades, Filters, Pumps)', 'Battery Care, Starting System, Charging (Alternator) & Electronic Ignition Diagnostics'], kiq: 'How does a thermostat regulate optimal engine operating temperature?', resources: 'Alternator/starter units, hydrometer, radiator cap tester, Mentor / Booklyst Power Mechanics' },
      ],
      3: [
        { strand: '3.0 POWER TRANSMISSION, BRAKES, SUSPENSION, STEERING & HYBRID/EV BASICS', subs: ['Clutch Assembly, Manual/Automatic Gearboxes, Propeller Shaft, Differential & Final Drive', 'Hydraulic Disc/Drum Brakes, ABS, Suspension (Coil/Leaf Springs, Shock Absorbers), Steering Geometry & Wheel Alignment', 'OBD-II Fault Scanning, Preventive Servicing & Hybrid / Electric Vehicle High-Voltage Safety'], kiq: 'How does the differential gear allow outer wheels to rotate faster when cornering?', resources: 'Gearbox/differential cutaway, brake caliper assembly, OBD-II scanner' },
      ],
    },
  },

  Woodwork: {
    shortCode: 'WD-WRK',
    strandsByTerm: {
      1: [
        { strand: '1.0 TIMBER TECHNOLOGY, SEASONING, CONVERSION & WORKSHOP SAFETY', subs: ['Woodshop Safety, Personal Protective Equipment & Safe Tool Storage', 'Tree Growth, Indigenous vs Exotic Kenyan Timbers (Camphor, Mahogany, Cypress, Pine, Bluegum), Conversion & Seasoning', 'Timber Defects, Preservation Against Borers/Fungi & Manufactured Boards (Plywood, MDF, Blockboard, Chipboard)'], kiq: 'Why must timber be seasoned to equilibrium moisture content before furniture making?', resources: 'Timber species samples, moisture meter, workbenches, KLB / Bookmark Woodwork' },
      ],
      2: [
        { strand: '2.0 WOODWORKING PLANES, SAWS, CHISELS, JOINERY & WORKING DRAWINGS', subs: ['Measuring/Marking Tools, Hand Planes (Jack, Smoothing, Rebate), Saws & Sharpening/Honing Blades', 'Woodworking Joints: Halving, Bridle, Mortise-and-Tenon, Dovetail, Housing & Dowelled Edge Joints', 'Orthographic/Isometric Furniture Working Drawings & Timber Cutting Lists (Board-Foot / Running-Metre Costing)'], kiq: 'Which woodworking joint provides the strongest resistance to pulling forces in drawer and frame construction?', resources: 'Tenon saws, mortise chisels, jack planes, sash cramps, Longhorn / MTP Woodwork' },
      ],
      3: [
        { strand: '3.0 PORTABLE POWER TOOLS, ADHESIVES, IRONMONGERY & SURFACE FINISHING', subs: ['Safe Operation of Circular Saws, Jigsaws, Routers, Orbital Sanders & Cordless Drills', 'PVA/Contact/Epoxy Adhesives, Screws, Nails, Hinges, Locks & Knock-Down Fittings', 'Scraping, Sanding, Wood Filler, Staining, Varnishing, French Polishing & Spray Lacquering'], kiq: 'Why must sanding always follow the direction of the wood grain before varnishing?', resources: 'Sandpaper grades, wood stains/varnish, hinges, cramps' },
      ],
    },
  },

  'Media Technology': {
    shortCode: 'MED-TECH',
    strandsByTerm: {
      1: [
        { strand: '1.0 PHOTOGRAPHY, CAMERA OPTICS & VISUAL STORYTELLING', subs: ['Exposure Triangle (Aperture/f-stop, Shutter Speed, ISO), White Balance & Depth of Field', 'Composition Principles (Rule of Thirds, Leading Lines, Framing) & Studio/Natural Lighting', 'Photojournalism Ethics, Media Law in Kenya & Digital Image Editing Workflows'], kiq: 'How do aperture, shutter speed, and ISO balance exposure and motion blur?', resources: 'DSLR/mirrorless cameras, reflectors, tripods, KLB / Front Row Media Technology' },
      ],
      2: [
        { strand: '2.0 AUDIO ENGINEERING, RADIO PODCASTING & MULTI-CAMERA VIDEO PRODUCTION', subs: ['Microphone Polar Patterns (Cardioid, Omnidirectional, Shotgun), Audio Mixers & Acoustic Treatment', 'Radio/Podcast Scripting, Voice Presentation & Multi-Track Audio Editing', 'Video Production Pipeline: Pre-Production Scripting, Cinematography, Gimbal Movement & Green-Screen Keying'], kiq: 'Why is a cardioid or shotgun microphone preferred over an omnidirectional mic in noisy locations?', resources: 'Audio interface, microphones, headphones, One Planet Media Technology' },
      ],
      3: [
        { strand: '3.0 POST-PRODUCTION, MOTION GRAPHICS, LIVE STREAMING & DIGITAL MEDIA BUSINESS', subs: ['Non-Linear Video Editing, Lower-Thirds Motion Graphics, Colour Correction & Export Codecs (H.264/MP4)', 'Multi-Camera Live Streaming Setup (OBS/Switchers), Bitrate Optimization & Broadcast Standards', 'Intellectual Property, Client Briefs, Media Production Budgeting & Portfolio Showreel'], kiq: 'How do video codecs and bitrates affect live-streaming clarity over mobile networks?', resources: 'Non-linear editing suite, capture card, lighting kit' },
      ],
    },
  },

  'Marine and Fisheries Technology': {
    shortCode: 'MAR-FSH',
    strandsByTerm: {
      1: [
        { strand: '1.0 AQUATIC ECOSYSTEMS, WATER SAFETY & KENYA’S BLUE ECONOMY', subs: ['Marine (Indian Ocean) & Inland Freshwater Ecosystems (Lakes Victoria, Turkana, Naivasha & Rivers)', 'Water Safety, Personal Flotation Devices (Lifejackets), Swimming Survival & Maritime Regulations (KMA)', 'Fish Anatomy, Commercial Fish Species (Nile Perch, Tilapia, Catfish, Trout, Tuna, Prawns) & Sustainable Capture Gear'], kiq: 'Why are illegal undersized gillnets destructive to fish breeding stocks in Kenyan lakes?', resources: 'Lifejackets, fish anatomy charts, legal mesh-size samples, KLB / Booklyst Marine & Fisheries' },
      ],
      2: [
        { strand: '2.0 AQUACULTURE (FISH FARMING), POND CONSTRUCTION & WATER QUALITY', subs: ['Earthen Pond, Liner Pond, Tank, Recirculating (RAS) & Cage Fish Farming Design', 'Water Quality Management: Dissolved Oxygen, Temperature, pH, Turbidity & Pond Liming/Fertilization', 'Fingerling Stocking Density, Formulated Fish Feeds, Predator Control & Fish Disease Management'], kiq: 'How do dissolved oxygen, pH, and water temperature govern tilapia growth rates in ponds?', resources: 'pH/DO water test kit, floating fish pellets, MTP Marine and Fisheries Technology' },
      ],
      3: [
        { strand: '3.0 SEAMANSHIP, SMALL VESSEL MAINTENANCE, POST-HARVEST HYGIENE & MARKETING', subs: ['Boat Parts, Ropework/Knots, Chart Navigation Basics, Tides & Outboard Engine Care', 'Hygienic Fish Handling, Cold-Chain Icing, Smoking, Solar Tent Drying, Filleting & Value Addition', 'Fisheries Co-operatives, Quality Standards (KEBS) & Blue Economy Entrepreneurship'], kiq: 'How does immediate cold-chain icing prevent post-harvest fish spoilage?', resources: 'Cooler boxes, solar dryer model, marine rope knots board' },
      ],
    },
  },
};

/**
 * Returns the grade-specific rationalized syllabus object ({ shortCode, strandsByTerm })
 * so each grade has authentic, progressive KICD strands & sub-strands.
 */
export function getSyllabusForGrade(grade, subject) {
  const isPP1 = grade === 'PP1' || grade === -1;
  const isPP2 = grade === 'PP2' || grade === 0;
  const lookupKey = isPP1 ? 'PP1' : isPP2 ? 'PP2' : grade;
  const base = SUBJECT_SYLLABUS[subject];
  if (!base) {
    throw new Error(`Missing syllabus entry for subject: ${subject}`);
  }
  const gradeOverride = base.byGrade && base.byGrade[lookupKey] ? base.byGrade[lookupKey] : null;
  if (gradeOverride) {
    return {
      shortCode: base.shortCode,
      strandsByTerm: gradeOverride,
    };
  }

  if (isPP1 || isPP2) {
    const ppLabel = isPP1 ? 'PP1 Foundational Play' : 'PP2 School-Readiness';
    const adaptedPP = {};
    for (const t of [1, 2, 3]) {
      adaptedPP[t] = (base.strandsByTerm[t] || []).map((block) => ({
        ...block,
        subs: block.subs.map((sub) => `${sub} (${ppLabel} Scope)`),
      }));
    }
    return {
      shortCode: base.shortCode,
      strandsByTerm: adaptedPP,
    };
  }

  // Contextualize shared multi-grade subjects with grade-appropriate depth cues where not explicitly split
  const depthTag =
    grade === 1 || grade === 4 || grade === 7 || grade === 10
      ? 'Foundational'
      : grade === 2 || grade === 5 || grade === 8 || grade === 11
      ? 'Intermediate'
      : 'Advanced';

  const adapted = {};
  for (const t of [1, 2, 3]) {
    adapted[t] = (base.strandsByTerm[t] || []).map((block) => ({
      ...block,
      subs: block.subs.map((sub) =>
        sub.includes(`Grade ${grade}`) ? sub : `${sub} (${depthTag} Grade ${grade} Scope)`
      ),
    }));
  }

  return {
    shortCode: base.shortCode,
    strandsByTerm: adapted,
  };
}

/**
 * Generates rich, discipline-specific Teacher's Chalkboard / Concept Notes,
 * Worked Illustrations, Guided Learner Tasks, and Check Questions for ANY lesson
 * so the Teachers' Notes PDF, Lesson Plans DOCX, and Scheme of Work DOCX rhyme 100%!
 */
export function buildDomainLessonNotes({
  grade,
  subject,
  strand,
  baseSubstrand,
  aspect,
  phaseTag,
  kiq,
  resources,
  lbCitation,
  tgCitation,
  isKiswahili,
}) {
  const cleanAspect = String(aspect || baseSubstrand).replace(/\s*\((Foundational|Intermediate|Advanced)\s+Grade\s+\d+\s+Scope\)/gi, '');
  const cleanSub = String(baseSubstrand).replace(/\s*\((Foundational|Intermediate|Advanced)\s+Grade\s+\d+\s+Scope\)/gi, '');
  const s = String(subject || '').toLowerCase();

  if (isKiswahili || s.includes('kiswahili')) {
    return {
      summaryLine: `Mwalimu afafanue vipengele vikuu vya "${cleanAspect}" kwa kutumia mifano kwenye ubao na kurejelea ${lbCitation}.`,
      coreConceptNotes: [
        `- Maana na Kanuni Kuu: Katika mada ndogo ya "${cleanSub}", kipengele cha "${cleanAspect}" kinamwezesha mwanafunzi wa Gredi ya ${grade} kutumia Kiswahili sanifu kwa ufasaha katika mazungumzo na maandishi.`,
        `- Vipengele vya Kuzingatia Ubaoni: Mwalimu aandike na kufafanua miundo, matamshi/upatanisho wa kisarufi na msamiati mahsusi unaojitokeza kwenye ${lbCitation} (${tgCitation}).`,
        `- Maadili na Uamilifu: Kuhusisha "${cleanAspect}" na mawasiliano yenye staha shuleni, nyumbani na katika jamii ya Kenya.`,
      ],
      workedIllustration: `Mfano ubaoni: Mwalimu aonyeshe hatua kwa hatua matumizi sahihi ya "${cleanAspect}" kwa kutumia ${resources.toLowerCase()} na mifano iliyomo kwenye ${lbCitation}, kisha wanafunzi watunge au kuchambua mifano miwili pamoja.`,
      learnerPracticeTask: `Kazi ya Vikundi na Binafsi: Wanafunzi wasome maelezo na kukamilisha zoezi la "${cleanAspect}" katika ${lbCitation}, kisha wawasilishe majibu kwa uhakiki wa mwalimu (${tgCitation}).`,
      checkQuestion: `Swali la Tathmini ya Haraka: Eleza kanuni kuu ulizojifunza kuhusu "${cleanAspect}" na utoe mifano miwili sahihi. (${kiq})`,
    };
  }

  if (s.includes('math')) {
    return {
      summaryLine: `Model step-by-step board working and accuracy rules on "${cleanAspect}" using ${lbCitation}.`,
      coreConceptNotes: [
        `- Core Mathematical Rule: "${cleanAspect}" (under ${cleanSub}) develops precision in numerical/spatial reasoning for Grade ${grade} learners as structured in ${lbCitation}.`,
        `- Step-by-Step Method & Units: Identify the given values, apply the correct place-value/formula/operation order, align digits/units neatly, and verify reasonableness of the answer.`,
        `- Common Error Watchpoint: Guide learners to avoid sign, regrouping, scale, or unit-conversion slips highlighted in ${tgCitation}.`,
      ],
      workedIllustration: `Board Worked Illustration: Using ${resources.toLowerCase()}, the teacher works out two graduated model examples on "${cleanAspect}" from ${lbCitation} on the chalkboard, explaining each intermediate step aloud.`,
      learnerPracticeTask: `Structured Class Exercise: Learners solve graded practice problems on "${cleanAspect}" from ${lbCitation} (${phaseTag}) individually and cross-check working in pairs.`,
      checkQuestion: `Lesson Exit Check: Solve a diagnostic board task on "${cleanAspect}" showing all working steps clearly, and relate it to: "${kiq}"`,
    };
  }

  if (s.includes('science') || s.includes('biology') || s.includes('chemistry') || s.includes('physics')) {
    return {
      summaryLine: `Demonstrate scientific setup, observations, and principles of "${cleanAspect}" referencing ${lbCitation}.`,
      coreConceptNotes: [
        `- Scientific Principle: "${cleanAspect}" within ${cleanSub} explains observable physical/chemical/biological phenomena studied in Grade ${grade} ${subject} (${lbCitation}).`,
        `- Apparatus & Safety Standard: Handle ${resources.toLowerCase()} following KICD laboratory/classroom safety precautions outlined in ${tgCitation}.`,
        `- Observation-to-Conclusion Link: Record accurate qualitative/quantitative observations first, then explain the underlying scientific mechanism and everyday Kenyan application.`,
      ],
      workedIllustration: `Practical Classroom Demonstration: Teacher sets up ${resources.toLowerCase()} to illustrate "${cleanAspect}" (${lbCitation}), guiding learners to predict, observe, and explain the outcome.`,
      learnerPracticeTask: `Guided Investigation & Recording: In small groups, learners inspect specimens/charts/apparatus, draw labelled diagrams or record data tables in notebooks, and answer the activity questions in ${lbCitation}.`,
      checkQuestion: `Formative Check: State two key scientific facts observed on "${cleanAspect}" and explain: "${kiq}"`,
    };
  }

  if (s.includes('english')) {
    return {
      summaryLine: `Model accurate pronunciation, language rules, and exemplar sentences on "${cleanAspect}" from ${lbCitation}.`,
      coreConceptNotes: [
        `- Language & Literacy Focus: "${cleanAspect}" (${cleanSub}) builds Grade ${grade} learners' communicative competence across listening, speaking, reading, grammar, and writing (${lbCitation}).`,
        `- Key Usage Rules & Structure: Highlight target vocabulary, sentence patterns, punctuation, or literary conventions on the chalkboard with clear model examples (${tgCitation}).`,
        `- Contextual Fluency: Encourage courteous expression, accurate spelling, and clear cohesion in Kenyan school and community contexts.`,
      ],
      workedIllustration: `Chalkboard Modelling: Teacher presents model passages/sentences illustrating "${cleanAspect}" using ${resources.toLowerCase()} and ${lbCitation}, guiding learners to identify target features.`,
      learnerPracticeTask: `Communicative & Written Practice: Learners practice oral dialogues/reading in pairs and complete the structured written exercise on "${cleanAspect}" in ${lbCitation}.`,
      checkQuestion: `Quick Mastery Check: Construct two accurate sentences or responses demonstrating "${cleanAspect}" and address: "${kiq}"`,
    };
  }

  if (s.includes('agriculture') || s.includes('environmental')) {
    return {
      summaryLine: `Demonstrate practical farm/nutrition/hygiene steps for "${cleanAspect}" using local realia and ${lbCitation}.`,
      coreConceptNotes: [
        `- Practical Competency Concept: "${cleanAspect}" (${cleanSub}) equips Grade ${grade} learners with hands-on environmental, food-production, and nutrition skills (${lbCitation}).`,
        `- Resource Conservation & Hygiene: Emphasize safe tool handling, clean water/food hygiene, and sustainable use of locally available materials (${resources.toLowerCase()}).`,
        `- Household & Community Value: Connects school farm/home-science practice directly to family health, nutrition, and income generation (${tgCitation}).`,
      ],
      workedIllustration: `Step-by-Step Practical Demonstration: Using ${resources.toLowerCase()}, teacher demonstrates the correct procedure for "${cleanAspect}" as illustrated in ${lbCitation}.`,
      learnerPracticeTask: `Hands-On Learner Activity: Learners practice "${cleanAspect}" in school garden/classroom stations, record steps in their notebooks, and complete the review task in ${lbCitation}.`,
      checkQuestion: `Oral/Written Check: Outline three practical steps or benefits of "${cleanAspect}" in answering: "${kiq}"`,
    };
  }

  if (s.includes('pre-technical') || s.includes('computer') || s.includes('business')) {
    return {
      summaryLine: `Illustrate technical/digital/commercial workflows on "${cleanAspect}" using ${resources.toLowerCase()} and ${lbCitation}.`,
      coreConceptNotes: [
        `- Technical / Enterprise Principle: "${cleanAspect}" (${cleanSub}) builds practical technical, digital, and financial literacy for Grade ${grade} learners (${lbCitation}).`,
        `- Standards, Ethics & Safety: Observe workshop PPE, cyber-hygiene/Data Protection rules, or accounting accuracy standards emphasized in ${tgCitation}.`,
        `- Real-World Industry Link: Demonstrates how Kenyan artisans, technologists, and entrepreneurs apply "${cleanAspect}" productively.`,
      ],
      workedIllustration: `Guided Workshop / Lab / Ledger Walkthrough: Teacher demonstrates "${cleanAspect}" step by step using ${resources.toLowerCase()} and worked illustrations in ${lbCitation}.`,
      learnerPracticeTask: `Practical Skill Drill: Learners execute the structured drawing, computing, tool-handling, or bookkeeping exercise on "${cleanAspect}" in ${lbCitation} and verify accuracy.`,
      checkQuestion: `Competency Check: Explain two key principles of "${cleanAspect}" and show how they address: "${kiq}"`,
    };
  }

  if (s.includes('creative')) {
    return {
      summaryLine: `Coach warm-up, artistic/musical/sporting technique, and safe execution of "${cleanAspect}" (${lbCitation}).`,
      coreConceptNotes: [
        `- Creative & Performance Technique: "${cleanAspect}" (${cleanSub}) develops psychomotor coordination, aesthetic expression, and talent in Grade ${grade} (${lbCitation}).`,
        `- Safety, Etiquette & Improvisation: Conduct warm-up/cool-down, handle ${resources.toLowerCase()} safely, and improvise responsibly from local materials (${tgCitation}).`,
        `- Teamwork & Appreciation: Foster fair play, rhythm/design balance, and kind peer critique.`,
      ],
      workedIllustration: `Teacher Skill Demonstration: Teacher models the posture, rhythm, stroke, or studio technique for "${cleanAspect}" step by step using ${resources.toLowerCase()} (${lbCitation}).`,
      learnerPracticeTask: `Guided Practice & Mini-Display: Learners rehearse/create "${cleanAspect}" in groups or pairs, showcase their work/performance, and receive constructive rubric feedback.`,
      checkQuestion: `Reflection Check: State two key technique or safety points observed during "${cleanAspect}" (${kiq}).`,
    };
  }

  if (s.includes('christian') || s.includes('cre') || s.includes('islamic') || s.includes('ire')) {
    const scriptureRef = s.includes('islamic') || s.includes('ire') ? 'Holy Qur’an (Mushaf) & Prophetic Sunnah' : 'Holy Bible (Good News Bible)';
    return {
      summaryLine: `Read scriptural teachings, discuss moral lessons on "${cleanAspect}", and apply values (${lbCitation}).`,
      coreConceptNotes: [
        `- Scriptural & Doctrinal Teaching: "${cleanAspect}" (${cleanSub}) grounds Grade ${grade} learners in authentic teachings from the ${scriptureRef} as presented in ${lbCitation}.`,
        `- Moral Values & Character Formation: Highlights integrity, compassion, obedience, reverence, and peaceful coexistence (${tgCitation}).`,
        `- Contemporary Application: Guides learners to apply faith lessons in family life, school relationships, digital conduct, and community service.`,
      ],
      workedIllustration: `Guided Scriptural Reading & Exposition: Teacher leads learners in reading relevant passages from ${resources.toLowerCase()} and ${lbCitation}, unpacking key lessons on "${cleanAspect}".`,
      learnerPracticeTask: `Group Reflection & Role-Play: Learners discuss life-application scenarios on "${cleanAspect}", sing/recite key verses, and write summary points from ${lbCitation}.`,
      checkQuestion: `Moral Lesson Check: State two teachings learned from "${cleanAspect}" and explain how to practice them daily (${kiq}).`,
    };
  }

  // Social Studies, History & Citizenship, Geography, CSL, Indigenous Language
  return {
    summaryLine: `Analyze maps/sources and discuss key concepts on "${cleanAspect}" with reference to ${lbCitation}.`,
    coreConceptNotes: [
      `- Core Curriculum Concept: "${cleanAspect}" (${cleanSub}) deepens Grade ${grade} learners' understanding of environment, heritage, governance, and civic life (${lbCitation}).`,
      `- Evidence & Map/Source Skills: Interpret ${resources.toLowerCase()} accurately to connect local county/Kenyan realities to regional and global contexts (${tgCitation}).`,
      `- Citizenship & Values: Promotes national unity, environmental stewardship, cultural respect, and responsible community participation.`,
    ],
    workedIllustration: `Guided Source / Map Analysis: Using ${resources.toLowerCase()} and ${lbCitation}, teacher guides learners to locate, interpret, and explain key facts on "${cleanAspect}".`,
    learnerPracticeTask: `Collaborative Inquiry & Note-Making: Learners work in groups to analyze prompts in ${lbCitation} on "${cleanAspect}", record structured notes, and present key findings.`,
    checkQuestion: `Formative Check: Summarize two main points on "${cleanAspect}" and answer with Kenyan examples: "${kiq}"`,
  };
}

export const PREPRIMARY_CURRICULUM_PLAN = [
  {
    gradeCode: 'PP1',
    dbGrade: 1,
    level: 'Pre-Primary 1 (PP1)',
    examBadge: 'ECDE Play Assessment',
    subjects: [
      'Language Activities',
      'Mathematical Activities',
      'Environmental Activities',
      'Creative Activities',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
    ],
  },
  {
    gradeCode: 'PP2',
    dbGrade: 2,
    level: 'Pre-Primary 2 (PP2)',
    examBadge: 'ECDE Readiness Assessment',
    subjects: [
      'Language Activities',
      'Mathematical Activities',
      'Environmental Activities',
      'Creative Activities',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
    ],
  },
];

export const GRADES_CURRICULUM_PLAN = [
  // Lower Primary (Grades 1-3): 8 rationalized subjects per grade
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
  // Upper Primary (Grades 4-6): 9 rationalized subjects per grade
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
  // Junior Secondary (Grades 7-9): All KICD Approved Rationalized JSS Learning Areas
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
      'French',
      'Arabic',
    ],
  })),
  // Senior School (Grades 10-12): ALL Official KICD Approved Pathway Learning Areas
  // Verified verbatim from KICD March 2026 (Grade 10) & October 5, 2026 (Grade 11/12) Approved Lists!
  ...[10, 11, 12].map((grade) => ({
    grade,
    level: 'Senior School',
    examBadge: grade === 12 ? 'CBE Senior Assessment' : 'Senior School',
    subjects: [
      'Core Mathematics',
      'Essential Mathematics',
      'English',
      'Literature in English',
      'Kiswahili',
      'Fasihi ya Kiswahili',
      'Community Service Learning (CSL)',
      'Biology',
      'Chemistry',
      'Physics',
      'General Science',
      'Agriculture',
      'Computer Studies',
      'Home Science',
      'Information Communication Technology (ICT)',
      'History and Citizenship',
      'Geography',
      'Business Studies',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
      'Life Skills',
      'Music and Dance',
      'Theatre and Film',
      'Fine Arts',
      'Sports and Recreation',
      'Physical Education',
      'French',
      'Arabic',
      'German',
      'Aviation',
      'Building Construction',
      'Electricity',
      'Metal Work',
      'Power Mechanics',
      'Woodwork',
      'Media Technology',
      'Marine and Fisheries Technology',
    ],
  })),
];

/**
 * Official KICD Rationalized CBC Weekly Lesson Allocation & Lesson Duration
 */
export function getCurriculumAllocation(grade, subject) {
  const s = String(subject || '').toLowerCase();

  // Pre-Primary: PP1 & PP2 (30 minutes per lesson; 25 lessons/week rationalized ECDE)
  if (grade === 'PP1' || grade === 'PP2' || grade === -1 || grade === 0) {
    let lessonsPerWeek = 5;
    if (s.includes('creative')) {
      lessonsPerWeek = 6;
    } else if (s.includes('religious') || s.includes('cre') || s.includes('ire')) {
      lessonsPerWeek = 3;
    } else {
      lessonsPerWeek = 5; // Language Activities (5), Mathematical Activities (5), Environmental Activities (5)
    }
    return {
      lessonsPerWeek,
      minutesPerLesson: 30,
      stepTimings: { intro: 5, step1: 10, step2: 10, conclusion: 5 },
    };
  }

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
