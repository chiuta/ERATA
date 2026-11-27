// Conjunto de avaliação ETIQUETADO para português — escrito pelo autor do motor (NÃO é independente).
// bad:  [texto, at, corrigido, nth?]  — `at` = trecho errado (n-ésima ocorrência), `corrigido` = frase corrigida.
export default {
  lang: 'pt',
  rules: {
    PT_GRAMATICA: {
      bad: [
        ['Isso aconteceu a 5 anos atrás, numa tarde de verão.', 'a 5 anos atrás', 'Isso aconteceu há 5 anos, numa tarde de verão.'],
        ['Ele é um mal aluno, mas está a melhorar.', 'mal aluno', 'Ele é um mau aluno, mas está a melhorar.'],
        ['Ontem ele estava mau disposto e saiu cedo.', 'estava mau', 'Ontem ele estava mal disposto e saiu cedo.'],
        ['Haviam muitas pessoas na sala de espera.', 'Haviam muitas', 'Havia muitas pessoas na sala de espera.'],
        ['Mudámos de casa a 3 meses atrás por causa do trabalho.', 'a 3 meses atrás', 'Mudámos de casa há 3 meses por causa do trabalho.'],
      ],
      good: ['Isso aconteceu há 5 anos, numa tarde de verão.', 'Ele é um mau aluno, mas está a melhorar.', 'Ontem ele estava mal disposto e saiu cedo.', 'Havia muitas pessoas na sala de espera.', 'Os alunos haviam saído antes da chuva.', 'Eles haviam chegado cedo e tinham fome.', 'Aconteceu 5 anos atrás, segundo ela.'],
    },
    PT_MESES_DIAS: {
      bad: [
        ['Nasci em Março de mil novecentos e noventa.', 'Março', 'Nasci em março de mil novecentos e noventa.'],
        ['Vemo-nos na Segunda-feira de manhã.', 'Segunda-feira', 'Vemo-nos na segunda-feira de manhã.'],
        ['Em Julho faz muito calor no Alentejo.', 'Julho', 'Em julho faz muito calor no Alentejo.'],
      ],
      good: ['Nasci em março de mil novecentos e noventa.', 'Março é um mês frio na serra.', 'Segunda-feira é o primeiro dia útil.', 'Vemo-nos na segunda-feira de manhã.'],
    },

    // ---- regras comuns ----
    DOUBLE_SPACE: {
      bad: [
        ['Fomos  ao mercado ontem à tarde.', '  ', 'Fomos ao mercado ontem à tarde.'],
        ['Ela lê um livro  sobre pássaros.', '  ', 'Ela lê um livro sobre pássaros.'],
        ['Amanhã   saímos cedo.', '   ', 'Amanhã saímos cedo.'],
      ],
      good: ['Fomos ao mercado ontem à tarde.', 'Ela lê um livro sobre pássaros.', 'Primeira linha.\n  Segunda linha com avanço.'],
    },
    SPACE_BEFORE_PUNCT: {
      bad: [
        ['Olá , prazer em conhecer-te.', ' ,', 'Olá, prazer em conhecer-te.'],
        ['Como estás ?', ' ?', 'Como estás?'],
        ['Vem cá agora !', ' !', 'Vem cá agora!'],
      ],
      good: ['Olá, prazer em conhecer-te.', 'Como estás?', 'Espera... não vás ainda.', 'O preço é de 5,50 euros.'],
    },
    SPACE_AFTER_PUNCT: {
      bad: [
        ['Viemos,mas não estava ninguém em casa.', ',', 'Viemos, mas não estava ninguém em casa.'],
        ['Olá.Como estás hoje à tarde?', '.', 'Olá. Como estás hoje à tarde?'],
        ['Já comeste?Eu ainda não comi.', '?', 'Já comeste? Eu ainda não comi.'],
      ],
      good: ['Viemos, mas não estava ninguém em casa.', 'Visite www.exemplo.pt para mais detalhes.', 'Escreve a joao.silva@exemplo.pt amanhã.', 'O preço é de 3,5 euros.'],
    },
    PUNCT_REPEAT: {
      bad: [
        ['Viemos,, mas não estava ninguém em casa.', ',,', 'Viemos, mas não estava ninguém em casa.'],
        ['Ele saiu;; depois voltou a casa.', ';;', 'Ele saiu; depois voltou a casa.'],
        ['Tudo terminou..', '..', 'Tudo terminou.'],
      ],
      good: ['Viemos, mas não estava ninguém em casa.', 'Espera... não vás ainda.', 'Talvez… quem sabe?'],
    },
    REPEATED_WORD: {
      bad: [
        ['Fomos ao ao mercado ontem à tarde.', ' ao', 'Fomos ao mercado ontem à tarde.', 1],
        ['O livro está está em cima da mesa.', ' está', 'O livro está em cima da mesa.', 1],
        ['Amanhã vamos vamos sair cedo.', ' vamos', 'Amanhã vamos sair cedo.', 1],
      ],
      good: ['Fomos ao mercado ontem à tarde.', 'Disse que que viria cedo.', 'Não, não quero ir embora.', 'Já, já sei tudo.'],
    },
    SENTENCE_CAPITAL: {
      bad: [
        ['Voltámos a casa. depois jantámos juntos.', 'depois', 'Voltámos a casa. Depois jantámos juntos.'],
        ['A chuva parou. o sol saiu por entre as nuvens.', 'o sol', 'A chuva parou. O sol saiu por entre as nuvens.'],
        ['Ele saiu cedo. ela ficou sozinha.', 'ela', 'Ele saiu cedo. Ela ficou sozinha.'],
      ],
      good: ['Voltámos a casa. Depois jantámos juntos.', 'O sr. silva virá vê-lo.', 'Comprei pão, leite, etc. e voltei para casa.', 'Mora na av. da Liberdade, perto do parque.'],
    },
    UNPAIRED_BRACKET: {
      bad: [
        ['Saímos (sem dizer nada.', '(', undefined],
        ['Saímos sem dizer) nada de nada.', ')', undefined],
        ['A lista [pão, leite é curta.', '[', undefined],
      ],
      good: ['Saímos (sem dizer nada).', 'a) o primeiro ponto; b) o segundo ponto.', 'Obrigado pela ajuda :)', '1) um 2) dois 3) três'],
    },
    TYPOGRAPHIC_QUOTES: {
      na: 'Regra desativada por conceção em português: as aspas retas são aceites.',
      bad: [],
      good: ['Ele disse "sim" logo.', 'A palavra "casa" tem quatro letras.', 'Li “Os Maias” no inverno passado.'],
    },
    WRONG_OPEN_QUOTE: {
      na: 'Regra sem alvo em português (“ ” são corretas).',
      bad: [],
      good: ['Ela disse “sim” sem hesitar.', 'O título “Os Maias” é famoso.', 'Gritou “corram” à multidão.'],
    },
    SPACED_HYPHEN: {
      bad: [
        ['Lisboa - a capital de Portugal, é grande.', ' - ', 'Lisboa – a capital de Portugal, é grande.'],
        ['João - o meu melhor amigo, veio cá.', ' - ', 'João – o meu melhor amigo, veio cá.'],
        ['O livro - uma história antiga, agradou.', ' - ', 'O livro – uma história antiga, agradou.'],
      ],
      good: ['Lisboa – a capital de Portugal, é grande.', 'É um bom guarda-chuva.', 'Comprou 5 - 3 = 2 maçãs.', '— Vens amanhã? perguntou o João.'],
    },
    UNIT_SPACE: {
      bad: [
        ['A distância é de 5km a pé.', '5km', 'A distância é de 5 km a pé.'],
        ['O ficheiro tem 20MB no total.', '20MB', 'O ficheiro tem 20 MB no total.'],
        ['O saco pesa 3,5kg exatamente.', '3,5kg', 'O saco pesa 3,5 kg exatamente.'],
      ],
      good: ['A distância é de 5 km a pé.', 'O ficheiro tem 20 MB no total.', 'A fórmula é H2O ou CO2.', 'A velocidade é de 50 km/h.'],
    },
    SPACE_BEFORE_CLOSE_BRACKET: {
      bad: [
        ['Saímos ( sem dizer nada).', '( ', 'Saímos (sem dizer nada).'],
        ['Saímos (sem dizer nada ).', ' )', 'Saímos (sem dizer nada).'],
        ['O livro ( antigo) estava em cima da mesa.', '( ', 'O livro (antigo) estava em cima da mesa.'],
      ],
      good: ['Saímos (sem dizer nada).', 'O livro (antigo) estava em cima da mesa.', 'A lista (a, b, c) está completa.'],
    },
    SPELLING: {
      bad: [
        ['Recebo muitas mensagems todas as manhãs cedo.', 'mensagems', 'Recebo muitas mensagens todas as manhãs cedo.'],
        ['A reuniao é amanhã às nove em ponto.', 'reuniao', 'A reunião é amanhã às nove em ponto.'],
        ['Ela tem um jardin muito bonito atrás da casa.', 'jardin', 'Ela tem um jardim muito bonito atrás da casa.'],
        ['Temos de seperar os ficheiros com cuidado.', 'seperar', 'Temos de separar os ficheiros com cuidado.'],
        ['Esta é sem dúvida a melhor opçao possível.', 'opçao', 'Esta é sem dúvida a melhor opção possível.'],
        ['Ficou envergonhado por aquele eror tão grande.', 'eror', 'Ficou envergonhado por aquele erro tão grande.'],
        ['O guverno anunciou novas regras esta semana.', 'guverno', 'O governo anunciou novas regras esta semana.'],
        ['Jantámos num restaurnte italiano muito bom.', 'restaurnte', 'Jantámos num restaurante italiano muito bom.'],
      ],
      good: [
        'Recebo muitas mensagens todas as manhãs cedo.',
        'A reunião é amanhã às nove em ponto.',
        'Ela tem um jardim muito bonito atrás da casa.',
        'Porto e Coimbra são cidades grandes de Portugal.',
        'O governo anunciou novas regras esta semana.',
        'Jantámos num restaurante italiano muito bom.',
        'As crianças jogaram futebol depois da escola.',
        'Amanhã haverá nevoeiro no vale do Tejo.',
      ],
    },
    STYLE_LONG_SENTENCE: {
      bad: [
        ['De manhã, quando acordei e vi que uma chuva miúda caía sobre os telhados velhos da cidade, decidi não ir trabalhar e ficar em casa, onde preparei um café comprido, abri a janela, li algumas páginas de um livro antigo que o meu avô me tinha oferecido e esperei que a chuva parasse, embora soubesse muito bem que não pararia tão cedo.', 'De manhã', undefined],
        ['O presidente da câmara anunciou que as obras da nova circular começariam na primavera, depois de as autoridades assinarem todos os documentos necessários, obterem a aprovação dos ministérios envolvidos, escolherem a empresa construtora por concurso público e acordarem com os moradores o traçado exato da estrada, de modo a afetar o menor número possível de casas.', 'O presidente', undefined],
        ['Embora os professores tivessem pedido muitas vezes que o regulamento da escola fosse alterado, e os pais tivessem assinado petições e comparecido às reuniões todos os meses, a direção adiou a decisão até que a inspeção enviou uma comissão que examinou os processos, falou com os alunos e recomendou mudanças importantes no horário diário.', 'Embora', undefined],
      ],
      good: [
        'De manhã fiquei em casa, preparei um café comprido e li algumas páginas de um livro antigo que o meu avô me tinha oferecido.',
        'O presidente da câmara anunciou que as obras da nova circular começariam na primavera, depois da assinatura dos documentos e da escolha da empresa.',
        'Os professores pediram que o regulamento fosse alterado, e os pais assinaram petições, mas a decisão foi adiada até à chegada de uma comissão.',
      ],
    },
    STYLE_REPEATED_WORD: {
      bad: [
        ['A cidade é grande, a cidade velha tem ruas estreitas e a cidade nova tem avenidas largas.', 'cidade', undefined, 2],
        ['O projeto começou em março, o projeto continuou no verão e o projeto terminou no outono.', 'projeto', undefined, 2],
        ['Os alunos chegaram cedo, os alunos leram muito e os alunos saíram tarde à noite.', 'alunos', undefined, 2],
      ],
      good: [
        'A cidade é grande, o centro histórico tem ruas estreitas e o bairro novo tem avenidas largas.',
        'O projeto começou em março e terminou no outono, depois de duas fases de trabalho.',
        'Os alunos chegaram cedo, leram muito e saíram tarde à noite, bastante satisfeitos.',
      ],
    },
  },
};
