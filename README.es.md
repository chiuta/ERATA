[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · **Español** · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — corrector sin conexión para el navegador

Versión: 0.4.0 · Última actualización: 27 de noviembre de 2026

ERATA es una extensión de navegador que revisa ortografía, gramática, puntuación y tipografía **por completo en tu dispositivo**. Sin cuenta, sin servidor, sin telemetría: tu texto nunca sale de tu ordenador. Está desarrollada en modo «clean-room» (véase [CLEANROOM.md](CLEANROOM.md)) y publicada bajo licencia MIT.

## Funciones
- Funciona en campos `textarea`, `input` y `contenteditable`, incluidos los editores enriquecidos. Los subrayados se dibujan en una capa aparte y **nunca modifican el DOM de la página**.
- **Detección del idioma por párrafo**: los pasajes en otra lengua no provocan falsas alarmas.
- **Rumano en profundidad**: ș/ț con coma en lugar de cedilla, «să/sa», «într-un», «între 5 și 10», coma ante «dar/însă», meses en minúscula, pleonasmos, clíticos y más.
- **Restauración de signos diacríticos** (ro, fr, es, pt), solo cuando la corrección es inequívoca.
- Marcadores accesibles: los tipos de error se distinguen también por la forma de la línea (ondulada, continua, discontinua, punteada), no solo por el color.
- Diccionario personal, reglas propias (regex), interruptor por sitio, importación y exportación de ajustes, importación de cualquier diccionario Hunspell.
- Página Estudio de texto, «Corregir todo», índice de legibilidad, dos comprobaciones de estilo (oraciones muy largas, repeticiones cercanas).
- Reformulación opcional con un modelo **local** (punto de acceso compatible con OpenAI, solo en `localhost`), desactivada por defecto.
- Interfaz en 25 idiomas: rumano, inglés, francés, italiano, español, portugués, alemán, húngaro, además de los demás idiomas de las minorías nacionales de Rumanía (ucraniano, turco, tártaro de Crimea, ruso, serbio, eslovaco, búlgaro, croata, griego, yidis, checo, polaco, armenio, rusino, albanés, macedonio, romaní). El idioma de la interfaz es independiente del idioma que se comprueba.

Atajos: `Alt+Shift+F` corrige todo en el campo activo, `Alt+Shift+E` activa o desactiva ERATA en el sitio actual. Teclado: Alt+Mayús+Espacio sugerencias · Alt+Mayús+M menú · Esc cerrar.

## Idiomas admitidos: lo que realmente hay
| Idioma | Ortografía | Reglas |
|---|---|---|
| Rumano (ro) | diccionario incluido | paquete propio, el más desarrollado |
| Inglés (en-US, en-GB) | diccionarios incluidos | paquete propio (reducido) |
| Francés (fr) | diccionario incluido | paquete propio (reducido), espaciado y diacríticos |
| Español (es) | diccionario incluido | paquete propio (reducido), signos de apertura y diacríticos |
| Portugués (pt) | diccionario incluido | paquete propio (reducido) |
| Alemán (de) | **no incluido** (licencias GPL); importa tu propio diccionario Hunspell | paquete mínimo |
| Italiano (it) | **no incluido** (licencias GPL); importa tu propio diccionario Hunspell | paquete mínimo |
| Húngaro (hu) | **ninguna en la 0.4.0** | **ninguna**: solo la interfaz está traducida; todavía no hay corrección ortográfica del húngaro |

Se puede importar cualquier otro diccionario Hunspell (nl, …), pero el detector de idioma solo conoce los anteriores.

## Traducciones
La interfaz, este README y la página de presentación existen en 25 idiomas. Ocho de ellos (ro, en, fr, it, es, pt, de, hu) son los idiomas base del proyecto; los otros diecisiete se añadieron en la 0.4.0. **Solo los 17 idiomas nuevos son traducciones automáticas, y ningún hablante nativo las ha revisado todavía. Las correcciones son bienvenidas: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Menor confianza: rusino, romaní, tártaro de Crimea y yidis. Traducir la interfaz no añade corrección ortográfica para ese idioma: consulta la tabla anterior para ver qué se comprueba realmente.

## Privacidad
Toda la revisión se hace dentro de la extensión. No existe servidor de ERATA, cuenta, telemetría ni analítica, y la extensión no pide permisos de red. La única excepción es la reformulación local, opcional y desactivada por defecto, que puede enviar una oración a un punto de acceso `localhost`/`127.0.0.1` que tú elijas. Los ajustes, el diccionario personal y los diccionarios importados permanecen en `storage.local` e IndexedDB, en tu dispositivo. Se ignoran los campos de contraseña, correo electrónico y tarjeta, y los marcados con `data-erata="off"`. Detalles: [PRIVACY.md](PRIVACY.md).

## Instalación
Por ahora ERATA se compila desde el código fuente.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** abre `chrome://extensions`, activa el modo desarrollador, elige «Cargar descomprimida» y selecciona `dist/chrome`.
- **Firefox:** abre `about:debugging`, elige «Cargar complemento temporal» y selecciona `dist/firefox/manifest.json`.
- **Safari (con Xcode, solo macOS):** `xcrun safari-web-extension-converter dist/chrome`, y luego compila y ejecuta el proyecto de Xcode generado. La versión para Safari **no ha sido probada** por el autor; véase [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA no contiene ni deriva nada del código, las reglas (XML/Java), los datos o los mensajes de LanguageTool ni de ningún otro corrector. El analizador Hunspell, las reglas, el detector de idioma y los algoritmos de sugerencias se escribieron desde cero, a partir de descripciones públicas del formato y de conocimientos generales de gramática y tipografía. Los diccionarios incluidos son proyectos Hunspell independientes, con sus propias licencias ([dict/LICENSES.md](dict/LICENSES.md)). Método completo: [CLEANROOM.md](CLEANROOM.md).

## Comparación con las alternativas (breve y honesta)
Versión completa, con fuentes y salvedades: [docs/COMPARISON.md](docs/COMPARISON.md). Los datos de la competencia proceden de páginas públicas consultadas el 2026-11-18; lo que allí figura como *no verificado* no está confirmado.

- **LanguageTool, Grammarly, Microsoft Editor:** cobertura gramatical mucho mayor en los idiomas principales (LanguageTool publica cifras de reglas del orden de miles para inglés, francés, alemán, español y portugués), además de funciones de claridad y reescritura, Google Docs y móvil. Por defecto envían el texto a los servidores del proveedor. ERATA no.
- **Harper:** también totalmente local y muy activo, pero solo para inglés.
- **Corrector ortográfico nativo del navegador:** local en su modo básico, solo ortografía, sin gramática.
- **Vale y LTeX+:** herramientas para desarrolladores (editores, línea de comandos), no extensiones de navegador.
- **Dónde es útil ERATA:** una extensión local que combina ortografía y reglas específicas para rumano, francés, español, portugués e inglés, con restauración de diacríticos, reglas propias y diccionarios importados. En rumano, las fuentes halladas sugieren que las soluciones establecidas son relativamente débiles (Microsoft Editor: solo ortografía; LanguageTool marca el rumano como inactivo); son declaraciones públicas, no una prueba comparativa.
- **Dónde pierde:** ERATA tiene en total en torno a un centenar de comprobaciones escritas a mano (cifra aproximada, sin auditar). Aún no existe una medición de precisión y exhaustividad sobre un corpus. El húngaro no está cubierto, mientras que Microsoft Editor sí lo cubre y Grammarly lo lista en beta (profundidad sin verificar).

## Límites conocidos
- Muchas menos reglas gramaticales que los correctores consolidados; no hay capa estadística para errores con palabras reales.
- Sin Google Docs (editor sobre canvas), sin móvil, sin integración de escritorio ni con procesadores de texto.
- Las pruebas automáticas solo se ejecutan en Chromium. Firefox pasa `web-ext lint`, pero aquí no se ha ejecutado en un navegador. Safari no está probado.
- Sin corrección ortográfica del húngaro; sin diccionario alemán ni italiano incluido.
- Sin auditoría de accesibilidad independiente.
- El proyecto es nuevo (primeras versiones del 18 de noviembre de 2026): aún no tiene usuarios ni trayectoria.

## Desarrollo
Requiere Node.js >= 24.
```bash
npm i            # instala las dependencias
npm run dicts    # copia los diccionarios Hunspell en dict/
npm test         # pruebas unitarias
npm run build    # genera dist/chrome y dist/firefox
```
`npm run pack` crea además archivos `.zip`.

## Licencia
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Véase [LICENSE](LICENSE). Los diccionarios incluidos conservan sus propias licencias ([dict/LICENSES.md](dict/LICENSES.md)).

## Apoyo
Si ERATA te resulta útil, puedes apoyar su desarrollo: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
