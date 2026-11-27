// Set de evaluare ETICHETAT pentru engleză — scris de autorul motorului (NU este independent).
// bad:  [text, at, fixed, nth?]  — `at` = fragmentul greșit (a n-a apariție), `fixed` = propoziția corectată.
export default {
  lang: 'en',
  rules: {
    EN_I: {
      bad: [
        ['i think we should leave early.', 'i', 'I think we should leave early.'],
        ['Yesterday i went to the market alone.', 'i', 'Yesterday I went to the market alone.'],
        ["i'm sure that she will come tomorrow.", "i", "I'm sure that she will come tomorrow."],
        ['She said that i could borrow the car.', 'i could', 'She said that I could borrow the car.'],
      ],
      good: ['I think we should leave early.', "I'm sure that she will come tomorrow.", 'Some tools, i.e. hammers, are heavy.', 'See clause (i) above for the details.', 'Use lists such as e.g. apples, i.e. fruit.'],
    },
    EN_A_AN: {
      bad: [
        ['She ate a apple after lunch.', 'a apple', 'She ate an apple after lunch.'],
        ['He bought an cat from the shelter.', 'an cat', 'He bought a cat from the shelter.'],
        ['We waited for a hour at the station.', 'a hour', 'We waited for an hour at the station.'],
        ['My brother is an university student.', 'an university', 'My brother is a university student.'],
      ],
      good: ['She ate an apple after lunch.', 'We waited for an hour at the station.', 'My brother is a university student.', 'He works as an MBA tutor.', 'It was a unique opportunity.', 'She is an honest person.', 'He joined a European team.'],
    },
    EN_AGREEMENT: {
      bad: [
        ['He have two cats at home.', 'He have', 'He has two cats at home.'],
        ['They is late again today.', 'They is', 'They are late again today.'],
        ["She don't know the answer.", "She don't", "She doesn't know the answer."],
        ['We has finished the report.', 'We has', 'We have finished the report.'],
      ],
      good: ['He has two cats at home.', 'They are late again today.', 'Does he have a car?', 'Would she have enough time?', 'Let him have it.', 'I have two brothers and you have one.', 'Why should it have changed so soon?'],
    },
    EN_COULD_OF: {
      bad: [
        ['She should of called me earlier.', 'should of', 'She should have called me earlier.'],
        ['Its going to rain this afternoon.', 'Its going', "It's going to rain this afternoon."],
        ['He is taller then his brother.', 'taller then', 'He is taller than his brother.'],
        ['Your welcome to join us anytime.', 'Your welcome', "You're welcome to join us anytime."],
        ['I like music alot more than films.', 'alot', 'I like music a lot more than films.'],
        ['Their is a problem with the printer.', 'Their is', 'There is a problem with the printer.'],
      ],
      good: ['She should have called me earlier.', "It's going to rain this afternoon.", 'He is taller than his brother.', "You're welcome to join us anytime.", 'I lost a lot of money last year.', 'Their house is big and its roof is new.', 'He did it, and then he left.', 'A children’s corner is in the library.'],
    },
    EN_PAST_AFTER_AUX: {
      bad: [
        ['He did went home after the meeting.', 'did went', 'He did go home after the meeting.'],
        ["She didn't saw the message in time.", "didn't saw", "She didn't see the message in time."],
        ['They will took the early train tomorrow.', 'will took', 'They will take the early train tomorrow.'],
        ["I don't knew where the keys were.", "don't knew", "I don't know where the keys were."],
      ],
      good: ['He went home after the meeting.', "She didn't see the message in time.", 'They will take the early train tomorrow.', 'They plan to found a new company.', 'She wants to found a school.', 'I would say that he made a mistake.'],
    },

    // ---- reguli comune ----
    DOUBLE_SPACE: {
      bad: [
        ['We  went shopping yesterday.', '  ', 'We went shopping yesterday.'],
        ['She is reading a book  about birds.', '  ', 'She is reading a book about birds.'],
        ['Tomorrow   we leave early.', '   ', 'Tomorrow we leave early.'],
      ],
      good: ['We went shopping yesterday.', 'She is reading a book about birds.', 'First line.\n  Second indented line.'],
    },
    SPACE_BEFORE_PUNCT: {
      bad: [
        ['Hello , nice to meet you.', ' ,', 'Hello, nice to meet you.'],
        ['How are you ?', ' ?', 'How are you?'],
        ['Come here now !', ' !', 'Come here now!'],
      ],
      good: ['Hello, nice to meet you.', 'How are you?', 'Wait... do not leave yet.', 'The price is 5.50 pounds.'],
    },
    SPACE_AFTER_PUNCT: {
      bad: [
        ['We came,but nobody was home.', ',', 'We came, but nobody was home.'],
        ['Hello.How are you today?', '.', 'Hello. How are you today?'],
        ['Did you eat?I did not eat yet.', '?', 'Did you eat? I did not eat yet.'],
      ],
      good: ['We came, but nobody was home.', 'Visit www.example.com for details.', 'Write to john.smith@example.com tomorrow.', 'The price is 3.5 pounds.'],
    },
    PUNCT_REPEAT: {
      bad: [
        ['We came,, but nobody was home.', ',,', 'We came, but nobody was home.'],
        ['He left;; then he returned.', ';;', 'He left; then he returned.'],
        ['Everything is finished..', '..', 'Everything is finished.'],
      ],
      good: ['We came, but nobody was home.', 'Wait... do not leave yet.', 'Maybe… who knows?'],
    },
    REPEATED_WORD: {
      bad: [
        ['We went to the the market yesterday.', ' the', 'We went to the market yesterday.', 1],
        ['The book is is on the table.', ' is', 'The book is on the table.', 1],
        ['Tomorrow we we will leave early.', ' we', 'Tomorrow we will leave early.', 1],
      ],
      good: ['We went to the market yesterday.', 'He said that that was enough.', 'She had had enough of it.', 'No, no, I do not want to go.'],
    },
    SENTENCE_CAPITAL: {
      bad: [
        ['We came home. then we had dinner.', 'then', 'We came home. Then we had dinner.'],
        ['The rain stopped. the sun came out.', 'the sun', 'The rain stopped. The sun came out.'],
        ['He left early. she stayed alone.', 'she', 'He left early. She stayed alone.'],
      ],
      good: ['We came home. Then we had dinner.', 'Dr. smith will see you now.', 'I bought bread, milk, etc. and went home.', 'He lives on Baker St. near the park.'],
    },
    UNPAIRED_BRACKET: {
      bad: [
        ['We left (without saying anything.', '(', undefined],
        ['We left without saying) anything.', ')', undefined],
        ['The list [bread, milk is short.', '[', undefined],
      ],
      good: ['We left (without saying anything).', '(a) the first item; (b) the second item.', 'Thanks for the help :)', '1) one 2) two 3) three'],
    },
    TYPOGRAPHIC_QUOTES: {
      na: 'Regulă dezactivată prin proiect în engleză: ghilimelele drepte sunt acceptate curent.',
      bad: [],
      good: ['He said "yes" immediately.', 'The word "house" has five letters.', 'I read “Moby Dick” last winter.'],
    },
    WRONG_OPEN_QUOTE: {
      na: 'Regulă fără țintă în engleză („ “ ” sunt corecte).',
      bad: [],
      good: ['She said “yes” without hesitation.', 'The title “Moby Dick” is famous.', 'He shouted “run” at the crowd.'],
    },
    SPACED_HYPHEN: {
      bad: [
        ['London - the capital of England, is big.', ' - ', 'London – the capital of England, is big.'],
        ['John - my best friend, came over.', ' - ', 'John – my best friend, came over.'],
        ['The book - an old story, was fun.', ' - ', 'The book – an old story, was fun.'],
      ],
      good: ['London – the capital of England, is big.', 'It is a well-known story.', 'He bought 5 - 3 = 2 apples.', '"Are you coming?" asked John.'],
    },
    UNIT_SPACE: {
      bad: [
        ['The distance is 5km on foot.', '5km', 'The distance is 5 km on foot.'],
        ['The file is 20MB in total.', '20MB', 'The file is 20 MB in total.'],
        ['The bag weighs 3.5kg exactly.', '3.5kg', 'The bag weighs 3.5 kg exactly.'],
      ],
      good: ['The distance is 5 km on foot.', 'The file is 20 MB in total.', 'The formula is H2O or CO2.', 'The speed is 50 km/h.'],
    },
    SPACE_BEFORE_CLOSE_BRACKET: {
      bad: [
        ['We left ( without saying anything).', '( ', 'We left (without saying anything).'],
        ['We left (without saying anything ).', ' )', 'We left (without saying anything).'],
        ['The book ( old) was on the table.', '( ', 'The book (old) was on the table.'],
      ],
      good: ['We left (without saying anything).', 'The book (old) was on the table.', 'The list (a, b, c) is complete.'],
    },
    SPELLING: {
      bad: [
        ['I recieve many emails every morning.', 'recieve', 'I receive many emails every morning.'],
        ['The meeting is tomorow at nine.', 'tomorow', 'The meeting is tomorrow at nine.'],
        ['She has a beautifull garden behind the house.', 'beautifull', 'She has a beautiful garden behind the house.'],
        ['We need to seperate the files carefully.', 'seperate', 'We need to separate the files carefully.'],
        ['This is definately the best option.', 'definately', 'This is definitely the best option.'],
        ['He was embarassed by the mistake.', 'embarassed', 'He was embarrassed by the mistake.'],
        ['The goverment announced new rules.', 'goverment', 'The government announced new rules.'],
        ['Please acknowlege the receipt of this letter.', 'acknowlege', 'Please acknowledge the receipt of this letter.'],
      ],
      good: [
        'I receive many emails every morning.',
        'The meeting is tomorrow at nine.',
        'She has a beautiful garden behind the house.',
        'The colour of the walls is nearly grey.',
        'The color of the walls is nearly gray.',
        'London and Manchester are large cities.',
        'The government announced new rules.',
        'They ordered pizza and espresso after the game.',
      ],
    },
    STYLE_LONG_SENTENCE: {
      bad: [
        ['In the morning, when I woke up and saw that a light rain was falling on the old rooftops of the city, I decided not to go to work and to stay at home, where I made a long coffee, opened the window, read a few pages from an old book that my grandfather had given me, and waited for the rain to stop, although I knew very well that it would not stop soon.', 'In the morning', undefined],
        ['The mayor announced that work on the new ring road would begin in the spring, after the authorities had signed all the necessary documents, received approval from the ministries involved, chosen the builder through a public tender, and agreed with local residents on the exact route of the road, so that as few homes as possible would be affected.', 'The mayor', undefined],
        ['Although the teachers asked many times for the school rules to be changed, and the parents signed petitions and came to meetings every month, the management postponed the decision until the inspectorate sent a committee that checked the files, spoke with the pupils and recommended important changes to the daily schedule.', 'Although', undefined],
      ],
      good: [
        'In the morning I stayed at home, made a long coffee and read a few pages from an old book that my grandfather had given me.',
        'The mayor announced that work on the new ring road would begin in the spring, after the documents are signed and the builder is chosen.',
        'The teachers asked for the school rules to be changed, and the parents signed petitions, but the decision was postponed until a committee arrived.',
      ],
    },
    STYLE_REPEATED_WORD: {
      bad: [
        ['The village is big, the old village has narrow streets, and the new village has wide avenues.', 'village', undefined, 2],
        ['The project began in March, the project continued in summer, and the project ended in autumn.', 'project', undefined, 2],
        ['The students arrived early, the students read a lot, and the students left late in the evening.', 'students', undefined, 2],
      ],
      good: [
        'The village is big, the old quarter has narrow streets, and the new district has wide avenues.',
        'The project began in March and ended in autumn, after two stages of work.',
        'The students arrived early, read a lot, and left late in the evening, quite satisfied.',
      ],
    },
  },
};
