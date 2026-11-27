// Date pentru evaluarea detecției de limbă. Tot textul este scris de autor (nu e un etalon independent).
// Limbile cu dicționar (ro,en,fr,es,pt) își iau ferestrele din corpusurile corecte din ./corpus;
// de, it, nl au aici texte proprii. Amestecurile și numele proprii sunt scrise de mână.

export const EXTRA_TEXTS = {
  de: [
    'Die Stadtverwaltung hat gestern beschlossen, den alten Bahnhof zu einem Kulturzentrum umzubauen. Nach Angaben des Bürgermeisters sollen die Arbeiten im Frühjahr beginnen und bis zum Ende des nächsten Jahres abgeschlossen sein. Die Kosten werden auf etwa vier Millionen Euro geschätzt, wovon ein Teil vom Land übernommen wird. Viele Anwohner begrüßen den Plan, weil das Viertel dringend neue Treffpunkte braucht.',
    'Das Programm liest zunächst die Konfigurationsdatei und prüft, ob alle erforderlichen Felder vorhanden sind. Fehlt ein Wert, wird ein Standardwert verwendet und eine Warnung ausgegeben. Anschließend öffnet es die Verbindung zum Server und sendet die Anfrage. Wenn die Antwort nicht innerhalb von zehn Sekunden eintrifft, bricht es den Vorgang ab.',
    'Es war ein kalter Morgen im November, als sie das Haus verließ. Der Nebel hing tief über den Feldern, und aus der Ferne hörte man das Läuten der Kirchenglocken. Sie zog den Mantel enger um die Schultern und ging langsam die Straße hinunter, ohne zu wissen, was sie am Ende des Weges erwarten würde.',
    '„Kommst du heute Abend mit uns ins Kino?“, fragte er. „Ich glaube nicht“, antwortete sie. „Ich habe noch viel zu tun, und morgen muss ich früh aufstehen.“ „Schade, der Film soll wirklich gut sein.“ „Dann erzähl mir morgen, wie er war.“',
    'Der Mieter ist verpflichtet, die Wohnung pfleglich zu behandeln und die Hausordnung einzuhalten. Der Vermieter darf das Mietverhältnis nur aus wichtigem Grund kündigen, wenn der Mieter trotz Abmahnung seine Pflichten verletzt. Die Kündigung bedarf der Schriftform.',
  ],
  it: [
    "Il consiglio comunale ha approvato ieri sera il nuovo piano per il traffico del centro storico. Secondo l'assessore, le auto private non potranno più entrare nella zona più antica della città durante i giorni festivi. I commercianti sono preoccupati, ma il sindaco ha promesso che saranno previsti parcheggi gratuiti vicino alle mura.",
    "Il programma legge prima il file di configurazione e controlla che tutti i campi necessari siano presenti. Se un valore manca, viene usato un valore predefinito e compare un avviso. Poi apre la connessione con il server e invia la richiesta. Se la risposta non arriva entro dieci secondi, l'operazione viene annullata.",
    "Era una mattina fredda di novembre quando uscì di casa. La nebbia copriva i campi e da lontano si sentivano le campane della chiesa. Si strinse nel cappotto e scese lentamente la strada, senza sapere che cosa l'aspettasse alla fine del cammino.",
    "«Vieni con noi al cinema stasera?», chiese lui. «Non credo», rispose lei. «Ho ancora molto da fare e domani devo alzarmi presto.» «Peccato, dicono che il film sia davvero bello.» «Allora raccontami com'era domani.»",
    "Il conduttore è tenuto a usare l'immobile con diligenza e a rispettare il regolamento del condominio. Il locatore può risolvere il contratto solo per un motivo grave, quando l'inquilino, nonostante la diffida, non adempie ai propri obblighi. La disdetta deve essere comunicata per iscritto.",
  ],
  nl: [
    'De gemeenteraad heeft gisteravond besloten om het oude station om te bouwen tot een cultureel centrum. Volgens de burgemeester beginnen de werkzaamheden in het voorjaar en moeten ze aan het einde van volgend jaar klaar zijn. De kosten worden geschat op ongeveer vier miljoen euro.',
    'Het programma leest eerst het configuratiebestand en controleert of alle verplichte velden aanwezig zijn. Ontbreekt er een waarde, dan wordt een standaardwaarde gebruikt en verschijnt er een waarschuwing.',
    'Het was een koude ochtend in november toen zij het huis verliet. De mist hing laag over de velden en in de verte hoorde je de klokken van de kerk. Ze trok haar jas dicht en liep langzaam de straat af.',
  ],
};

/** Paragraf în limba A cu un citat străin în limba B: detecția trebuie să dea A. */
export const MIXTURES = [
  ['ro', 'en', 'Ministrul a declarat în fața jurnaliștilor că proiectul va continua conform planului, iar apoi a citat o frază din raportul final: “The committee found no evidence of delays in the delivery of the equipment.” După aceea a răspuns la întrebările din sală.'],
  ['ro', 'fr', 'Profesoara ne-a explicat că expresia veche se folosește și astăzi în conversațiile oficiale, de exemplu « Je ne sais pas ce que vous voulez dire exactement », și ne-a cerut să o repetăm de mai multe ori până o învățăm.'],
  ['ro', 'de', 'Bunicul meu obișnuia să spună o vorbă veche pe care o învățase în tinerețe, «Ohne Fleiß kein Preis», și o repeta de fiecare dată când ne vedea lenevind în curte vara, la umbra nucului.'],
  ['en', 'fr', 'The tour guide stopped in front of the cathedral and read the inscription aloud, « La vérité sort toujours de la bouche des enfants et des fous », before explaining who had carved it and why it was never removed.'],
  ['en', 'de', 'During the meeting, our colleague from Hamburg summarised the whole situation in a single sentence, “Wir haben leider keine Zeit mehr für weitere Diskussionen”, and everyone in the room understood exactly what he meant.'],
  ['en', 'ro', 'The old fisherman looked at the sky for a long while and then said, in his own language, „Mâine o să fie furtună mare și nimeni nu va ieși pe mare”, which the translator rendered as a simple warning to the villagers.'],
  ['fr', 'en', 'Le chanteur a terminé son concert en lançant à la foule « Thank you all for coming tonight, you have been wonderful », puis il a quitté la scène sous les applaudissements de plusieurs milliers de spectateurs.'],
  ['fr', 'es', "Notre guide a traduit pour nous l'inscription gravée à l'entrée du village, « Aquí nadie se rinde y todos se ayudan unos a otros », avant de nous raconter l'histoire de la vieille fontaine."],
  ['es', 'en', 'El presidente de la asociación abrió la conferencia con una cita famosa: “The only thing we have to fear is fear itself”, y después explicó por qué esas palabras siguen siendo tan importantes para nuestra comunidad.'],
  ['es', 'fr', 'En la última escena de la película, el protagonista susurra « Je n’oublierai jamais ce que tu as fait pour moi » y la cámara se aleja lentamente mientras suena la música del principio.'],
  ['pt', 'en', 'O professor escreveu no quadro uma frase que os alunos deviam traduzir: “The weather was so bad that all the flights to the island were cancelled”, e pediu que a lessem em voz alta antes de começarem.'],
  ['pt', 'es', 'A minha avó contava sempre a mesma história sobre o viajante perdido que perguntou o caminho e ouviu a resposta “Camina siempre hacia donde sale el sol, amigo mío”, antes de desaparecer na neblina da manhã.'],
  ['de', 'en', 'Der Dozent beendete seinen Vortrag mit einem Zitat, das viele Studenten schon kannten: “Imagination is more important than knowledge”, und bedankte sich anschließend für die Aufmerksamkeit im Saal.'],
  ['it', 'en', "Il regista ha spiegato che il titolo del film deriva da una battuta pronunciata dal protagonista, “I never wanted to be a hero, I just wanted to go home”, e che l'intera sceneggiatura ruota attorno a quell'idea."],
];

/** Fragmente formate mai ales din nume proprii. */
export const NAMES = [
  ['ro', 'Ion Popescu și Maria Ionescu'],
  ['ro', 'Cluj-Napoca, Brașov și Timișoara'],
  ['ro', 'Mihai Eminescu și Ion Creangă au scris la Iași'],
  ['ro', 'Muzeul Național din București'],
  ['en', 'John Smith and Mary Jones'],
  ['en', 'Washington, Boston and Chicago'],
  ['en', 'Charles Dickens wrote in London'],
  ['en', 'The University of Oxford and the University of Cambridge'],
  ['fr', 'Jean Dupont et Marie Curie'],
  ['fr', 'Paris, Lyon et Marseille'],
  ['fr', 'Victor Hugo a écrit à Paris'],
  ['fr', 'Le musée du Louvre à Paris'],
  ['es', 'Juan García y María López'],
  ['es', 'Madrid, Sevilla y Valencia'],
  ['es', 'Miguel de Cervantes escribió en Madrid'],
  ['es', 'El museo del Prado en Madrid'],
  ['pt', 'João Silva e Maria Santos'],
  ['pt', 'Lisboa, Porto e Coimbra'],
  ['pt', 'Fernando Pessoa escreveu em Lisboa'],
  ['pt', 'O Museu Nacional em Lisboa'],
  ['de', 'Hans Müller und Anna Schmidt'],
  ['de', 'Berlin, Hamburg und München'],
  ['de', 'Goethe schrieb in Weimar'],
  ['de', 'Das Museum in Berlin'],
  ['it', 'Mario Rossi e Anna Bianchi'],
  ['it', 'Roma, Milano e Napoli'],
  ['it', 'Dante scrisse a Firenze'],
  ['it', 'Il museo di Roma'],
];
