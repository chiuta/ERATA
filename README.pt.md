[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Magyar](README.hu.md)

# ERATA — corretor offline para o navegador

Versão: 0.3.0 · Última atualização: 18 de novembro de 2026

O ERATA é uma extensão de navegador que verifica ortografia, gramática, pontuação e tipografia **inteiramente no seu dispositivo**. Sem conta, sem servidor, sem telemetria: o seu texto nunca sai do seu computador. Foi desenvolvido em regime «clean-room» (ver [CLEANROOM.md](CLEANROOM.md)) e é publicado sob a licença MIT.

## Funcionalidades
- Funciona em campos `textarea`, `input` e `contenteditable`, incluindo editores de texto rico. Os sublinhados são desenhados numa camada separada e **nunca alteram o DOM da página**.
- **Deteção do idioma por parágrafo**: trechos em língua estrangeira não geram falsos alarmes.
- **Romeno em profundidade**: ș/ț com vírgula em vez de cedilha, «să/sa», «într-un», «între 5 și 10», vírgula antes de «dar/însă», meses em minúscula, pleonasmos, clíticos e mais.
- **Restauro de diacríticos** (ro, fr, es, pt), apenas quando a correção é inequívoca.
- Marcadores acessíveis: os tipos de erro distinguem-se também pela forma do traço (ondulado, contínuo, tracejado, pontilhado), e não apenas pela cor.
- Dicionário pessoal, regras próprias (regex), interruptor por site, importação e exportação de definições, importação de qualquer dicionário Hunspell.
- Página Estúdio de texto, «Corrigir tudo», índice de legibilidade, duas verificações de estilo (frases muito longas, repetições próximas).
- Reformulação opcional através de um modelo **local** (ponto de acesso compatível com OpenAI, apenas em `localhost`), desativada por predefinição.
- Interface em 8 idiomas: romeno, inglês, francês, italiano, espanhol, português, alemão, húngaro.

Atalhos: `Alt+Shift+F` corrige tudo no campo ativo, `Alt+Shift+E` ativa ou desativa o ERATA no site atual.

## Idiomas suportados: o que realmente existe
| Idioma | Ortografia | Regras |
|---|---|---|
| Romeno (ro) | dicionário incluído | pacote próprio, o mais desenvolvido |
| Inglês (en-US, en-GB) | dicionários incluídos | pacote próprio (reduzido) |
| Francês (fr) | dicionário incluído | pacote próprio (reduzido), espaçamento e diacríticos |
| Espanhol (es) | dicionário incluído | pacote próprio (reduzido), sinais invertidos e diacríticos |
| Português (pt) | dicionário incluído | pacote próprio (reduzido) |
| Alemão (de) | **não incluído** (licenças GPL); importe o seu próprio dicionário Hunspell | pacote mínimo |
| Italiano (it) | **não incluído** (licenças GPL); importe o seu próprio dicionário Hunspell | pacote mínimo |
| Húngaro (hu) | **nenhuma na 0.3.0** | **nenhuma**: apenas a interface está traduzida; ainda não existe verificação ortográfica do húngaro |

Qualquer outro dicionário Hunspell (nl, …) pode ser importado, mas o detetor de idioma só conhece os acima.

## Privacidade
Toda a verificação acontece dentro da extensão. Não existe servidor ERATA, conta, telemetria nem análises, e a extensão não pede permissões de rede. A única exceção é a reformulação local, opcional e desativada por predefinição, que pode enviar uma frase para um ponto de acesso `localhost`/`127.0.0.1` à sua escolha. As definições, o dicionário pessoal e os dicionários importados ficam em `storage.local` e IndexedDB, no seu dispositivo. Os campos de palavra-passe, e-mail e cartão, bem como os marcados com `data-erata="off"`, são ignorados. Detalhes: [PRIVACY.md](PRIVACY.md).

## Instalação
Por agora, o ERATA compila-se a partir do código-fonte.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** abra `chrome://extensions`, ative o modo de programador, escolha «Carregar sem compactação» e selecione `dist/chrome`.
- **Firefox:** abra `about:debugging`, escolha «Carregar extensão temporária» e selecione `dist/firefox/manifest.json`.
- **Safari (com o Xcode, apenas macOS):** `xcrun safari-web-extension-converter dist/chrome`, depois compile e execute o projeto Xcode gerado. A versão para Safari **não foi testada** pelo autor; ver [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
O ERATA não contém nem deriva nada do código, das regras (XML/Java), dos dados ou das mensagens do LanguageTool ou de qualquer outro corretor. O analisador Hunspell, as regras, o detetor de idioma e os algoritmos de sugestões foram escritos de raiz, a partir de descrições públicas do formato e de conhecimentos gerais de gramática e tipografia. Os dicionários incluídos são projetos Hunspell independentes, com licenças próprias ([dict/LICENSES.md](dict/LICENSES.md)). Método completo: [CLEANROOM.md](CLEANROOM.md).

## Comparação com as alternativas (breve e honesta)
Versão completa, com fontes e ressalvas: [docs/COMPARISON.md](docs/COMPARISON.md). Os dados sobre a concorrência vêm de páginas públicas consultadas em 2026-11-18; o que ali está assinalado como *não verificado* não está confirmado.

- **LanguageTool, Grammarly, Microsoft Editor:** cobertura gramatical muito maior nas línguas principais (o LanguageTool publica números de regras da ordem dos milhares para inglês, francês, alemão, espanhol e português), além de funções de clareza e reescrita, Google Docs e telemóvel. Por predefinição enviam o texto para os servidores do fornecedor. O ERATA não.
- **Harper:** também totalmente local e muito ativo, mas apenas para inglês.
- **Corretor ortográfico nativo do navegador:** local no modo básico, só ortografia, sem gramática.
- **Vale e LTeX+:** ferramentas para programadores (editores, linha de comandos), não extensões de navegador.
- **Onde o ERATA é útil:** uma extensão local que combina ortografia e regras dirigidas para romeno, francês, espanhol, português e inglês, com restauro de diacríticos, regras próprias e dicionários importados. Quanto ao romeno, as fontes encontradas sugerem que as soluções estabelecidas são relativamente fracas (Microsoft Editor: só ortografia; o LanguageTool marca o romeno como inativo); trata-se de declarações públicas, não de um teste comparativo.
- **Onde perde:** o ERATA tem, no total, cerca de uma centena de verificações escritas à mão (número aproximado, sem auditoria). Ainda não existe uma medição de precisão e cobertura sobre um corpus. O húngaro não está coberto, ao passo que o Microsoft Editor o cobre e o Grammarly o lista em beta (profundidade por verificar).

## Limites conhecidos
- Muito menos regras gramaticais do que os corretores consolidados; não há camada estatística para erros com palavras existentes.
- Sem Google Docs (editor em canvas), sem telemóvel, sem integração de ambiente de trabalho nem com processadores de texto.
- Os testes automáticos correm apenas no Chromium. O Firefox passa o `web-ext lint`, mas aqui não foi executado num navegador. O Safari não foi testado.
- Sem verificação ortográfica do húngaro; sem dicionário alemão ou italiano incluído.
- Sem auditoria de acessibilidade independente.
- O projeto é recente (primeiras versões de 18 de novembro de 2026): ainda não tem utilizadores nem historial.

## Desenvolvimento
Requer Node.js >= 24.
```bash
npm i            # instala as dependências
npm run dicts    # copia os dicionários Hunspell para dict/
npm test         # testes unitários
npm run build    # gera dist/chrome e dist/firefox
```
`npm run pack` cria também arquivos `.zip`.

## Licença
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Ver [LICENSE](LICENSE). Os dicionários incluídos mantêm as suas próprias licenças ([dict/LICENSES.md](dict/LICENSES.md)).

## Apoio
Se o ERATA lhe for útil, pode apoiar o seu desenvolvimento: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
