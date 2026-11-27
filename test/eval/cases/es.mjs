// Conjunto de evaluación ETIQUETADO para español — escrito por el autor del motor (NO es independiente).
// bad:  [texto, at, corregido, nth?]  — `at` = fragmento erróneo (n-ésima aparición), `corregido` = frase corregida.
export default {
  lang: 'es',
  rules: {
    ES_SIGNOS_INVERTIDOS: {
      bad: [
        ['Qué hora es?', 'Qué', '¿Qué hora es?'],
        ['Vamos al parque esta tarde!', 'Vamos', '¡Vamos al parque esta tarde!'],
        ['Cómo te llamas?', 'Cómo', '¿Cómo te llamas?'],
        ['Pedro, vienes mañana a la fiesta?', 'vienes', 'Pedro, ¿vienes mañana a la fiesta?'],
        ['Hola, qué tal estás?', 'qué', 'Hola, ¿qué tal estás?'],
      ],
      good: ['¿Qué hora es?', '¡Vamos al parque esta tarde!', 'Pedro, ¿vienes mañana a la fiesta?', 'No sé qué hacer con tanto trabajo.', 'Dijo: «¿Vienes?» y se fue.', '—¿Vienes? —preguntó él.'],
    },
    ES_GRAMATICA: {
      bad: [
        ['Vengo de el parque con mi hermano.', 'de el', 'Vengo del parque con mi hermano.'],
        ['Mañana voy a el cine con mis amigos.', 'a el', 'Mañana voy al cine con mis amigos.'],
        ['Creo de que vendrá a la reunión.', 'de que', 'Creo que vendrá a la reunión.'],
        ['Haber si vienes a visitarnos pronto.', 'Haber si', 'A ver si vienes a visitarnos pronto.'],
        ['No he echo la tarea todavía.', 'he echo', 'No he hecho la tarea todavía.'],
        ['Él a comido toda la tarta.', 'Él a', 'Él ha comido toda la tarta.'],
        ['La problema es más grande de lo esperado.', 'La problema', 'El problema es más grande de lo esperado.'],
      ],
      good: ['Vengo del parque con mi hermano.', 'Mañana voy al cine con mis amigos.', 'Creo que vendrá a la reunión.', 'A ver si vienes a visitarnos pronto.', 'No he hecho la tarea todavía.', 'Él ha comido toda la tarta.', 'El problema es más grande de lo esperado.', 'La mano está fría.', 'Fuimos a El Cairo en verano.', 'Echo de menos a mi familia.'],
    },
    ES_MESES_DIAS: {
      bad: [
        ['Nací en Marzo de hace muchos años.', 'Marzo', 'Nací en marzo de hace muchos años.'],
        ['Nos vemos el Lunes por la mañana.', 'Lunes', 'Nos vemos el lunes por la mañana.'],
        ['Viajo a la playa en Agosto.', 'Agosto', 'Viajo a la playa en agosto.'],
      ],
      good: ['Nací en marzo de hace muchos años.', 'Marzo es un mes frío en la montaña.', 'Lunes y martes estaré fuera.', 'Leí un libro de Julio Cortázar.', 'Domingo Sarmiento fue presidente.'],
    },

    // ---- reglas comunes ----
    DOUBLE_SPACE: {
      bad: [
        ['Fuimos  al mercado ayer por la tarde.', '  ', 'Fuimos al mercado ayer por la tarde.'],
        ['Ella lee un libro  sobre pájaros.', '  ', 'Ella lee un libro sobre pájaros.'],
        ['Mañana   salimos temprano.', '   ', 'Mañana salimos temprano.'],
      ],
      good: ['Fuimos al mercado ayer por la tarde.', 'Ella lee un libro sobre pájaros.', 'Primera línea.\n  Segunda línea con sangría.'],
    },
    SPACE_BEFORE_PUNCT: {
      bad: [
        ['Hola , encantado de verte.', ' ,', 'Hola, encantado de verte.'],
        ['¿Cómo estás ?', ' ?', '¿Cómo estás?'],
        ['¡Ven aquí ahora !', ' !', '¡Ven aquí ahora!'],
      ],
      good: ['Hola, encantado de verte.', '¿Cómo estás?', 'Espera... no te vayas todavía.', 'El precio es 5,50 euros.'],
    },
    SPACE_AFTER_PUNCT: {
      bad: [
        ['Vinimos,pero no había nadie en casa.', ',', 'Vinimos, pero no había nadie en casa.'],
        ['Hola.Cómo estás hoy por la tarde?', '.', 'Hola. Cómo estás hoy por la tarde?'],
        ['¿Has comido?Yo todavía no he comido.', '?', '¿Has comido? Yo todavía no he comido.'],
      ],
      good: ['Vinimos, pero no había nadie en casa.', 'Visite www.ejemplo.es para más detalles.', 'Escribe a juan.perez@ejemplo.es mañana.', 'El precio es de 3,5 euros.'],
    },
    PUNCT_REPEAT: {
      bad: [
        ['Vinimos,, pero no había nadie en casa.', ',,', 'Vinimos, pero no había nadie en casa.'],
        ['Se fue;; luego volvió a casa.', ';;', 'Se fue; luego volvió a casa.'],
        ['Todo ha terminado..', '..', 'Todo ha terminado.'],
      ],
      good: ['Vinimos, pero no había nadie en casa.', 'Espera... no te vayas todavía.', 'Quizá… quién sabe.'],
    },
    REPEATED_WORD: {
      bad: [
        ['Fuimos al al mercado ayer por la tarde.', ' al', 'Fuimos al mercado ayer por la tarde.', 1],
        ['El libro está está sobre la mesa.', ' está', 'El libro está sobre la mesa.', 1],
        ['Mañana vamos vamos a salir temprano.', ' vamos', 'Mañana vamos a salir temprano.', 1],
      ],
      good: ['Fuimos al mercado ayer por la tarde.', 'Dijo que que vendría pronto.', 'No, no quiero irme todavía.', 'Ya, ya lo sé todo.'],
    },
    SENTENCE_CAPITAL: {
      bad: [
        ['Volvimos a casa. luego cenamos juntos.', 'luego', 'Volvimos a casa. Luego cenamos juntos.'],
        ['La lluvia cesó. el sol salió entre las nubes.', 'el sol', 'La lluvia cesó. El sol salió entre las nubes.'],
        ['Él se fue temprano. ella se quedó sola.', 'ella', 'Él se fue temprano. Ella se quedó sola.'],
      ],
      good: ['Volvimos a casa. Luego cenamos juntos.', 'El sr. pérez vendrá a verle.', 'Compré pan, leche, etc. y volví a casa.', 'Vive en la av. Libertad, cerca del parque.'],
    },
    UNPAIRED_BRACKET: {
      bad: [
        ['Nos fuimos (sin decir nada.', '(', undefined],
        ['Nos fuimos sin decir) nada de nada.', ')', undefined],
        ['La lista [pan, leche es corta.', '[', undefined],
      ],
      good: ['Nos fuimos (sin decir nada).', 'a) el primer punto; b) el segundo punto.', 'Gracias por la ayuda :)', '1) uno 2) dos 3) tres'],
    },
    TYPOGRAPHIC_QUOTES: {
      bad: [
        ['Dijo "sí" de inmediato.', '"sí"', 'Dijo «sí» de inmediato.'],
        ['La palabra "casa" tiene cuatro letras.', '"casa"', 'La palabra «casa» tiene cuatro letras.'],
        ['Leí "Don Quijote" el invierno pasado.', '"Don Quijote"', 'Leí «Don Quijote» el invierno pasado.'],
      ],
      good: ['Dijo «sí» de inmediato.', 'La palabra «casa» tiene cuatro letras.', 'Leí «Don Quijote» el invierno pasado.'],
    },
    WRONG_OPEN_QUOTE: {
      bad: [
        ['Ella dijo “sí” sin dudar.', '“', 'Ella dijo «sí” sin dudar.'],
        ['El título “Don Quijote” es famoso.', '“', 'El título «Don Quijote” es famoso.'],
        ['Gritó “corred” a la multitud.', '“', 'Gritó «corred” a la multitud.'],
      ],
      good: ['Ella dijo «sí» sin dudar.', 'El título «Don Quijote» es famoso.', 'Gritó «corred» a la multitud.'],
    },
    SPACED_HYPHEN: {
      bad: [
        ['Madrid - la capital de España, es grande.', ' - ', 'Madrid – la capital de España, es grande.'],
        ['Juan - mi mejor amigo, vino a casa.', ' - ', 'Juan – mi mejor amigo, vino a casa.'],
        ['El libro - una historia antigua, gustó.', ' - ', 'El libro – una historia antigua, gustó.'],
      ],
      good: ['Madrid – la capital de España, es grande.', 'Es un acuerdo hispano-francés conocido.', 'Compró 5 - 3 = 2 manzanas.', '—¿Vienes mañana? —preguntó Juan.'],
    },
    UNIT_SPACE: {
      bad: [
        ['La distancia es de 5km a pie.', '5km', 'La distancia es de 5 km a pie.'],
        ['El archivo ocupa 20MB en total.', '20MB', 'El archivo ocupa 20 MB en total.'],
        ['La bolsa pesa 3,5kg exactamente.', '3,5kg', 'La bolsa pesa 3,5 kg exactamente.'],
      ],
      good: ['La distancia es de 5 km a pie.', 'El archivo ocupa 20 MB en total.', 'La fórmula es H2O o CO2.', 'La velocidad es de 50 km/h.'],
    },
    SPACE_BEFORE_CLOSE_BRACKET: {
      bad: [
        ['Nos fuimos ( sin decir nada).', '( ', 'Nos fuimos (sin decir nada).'],
        ['Nos fuimos (sin decir nada ).', ' )', 'Nos fuimos (sin decir nada).'],
        ['El libro ( antiguo) estaba en la mesa.', '( ', 'El libro (antiguo) estaba en la mesa.'],
      ],
      good: ['Nos fuimos (sin decir nada).', 'El libro (antiguo) estaba en la mesa.', 'La lista (a, b, c) está completa.'],
    },
    SPELLING: {
      bad: [
        ['Recivo muchos correos cada mañana temprano.', 'Recivo', 'Recibo muchos correos cada mañana temprano.'],
        ['La reunion es mañana a las nueve en punto.', 'reunion', 'La reunión es mañana a las nueve en punto.'],
        ['Ella tiene un jardin muy bonito detrás de la casa.', 'jardin', 'Ella tiene un jardín muy bonito detrás de la casa.'],
        ['Tenemos que seperar los archivos con cuidado.', 'seperar', 'Tenemos que separar los archivos con cuidado.'],
        ['Esta es sin duda la mejor opcion posible.', 'opcion', 'Esta es sin duda la mejor opción posible.'],
        ['Estaba avergonzado por aquel eror tan grande.', 'eror', 'Estaba avergonzado por aquel error tan grande.'],
        ['El govierno anunció nuevas reglas esta semana pasada.', 'govierno', 'El gobierno anunció nuevas reglas esta semana pasada.'],
        ['Comimos en un restaurnte italiano muy bueno.', 'restaurnte', 'Comimos en un restaurante italiano muy bueno.'],
      ],
      good: [
        'Recibo muchos correos cada mañana temprano.',
        'La reunión es mañana a las nueve en punto.',
        'Ella tiene un jardín muy bonito detrás de la casa.',
        'Sevilla y Valencia son ciudades grandes de España.',
        'El gobierno anunció nuevas reglas esta semana.',
        'Comimos en un restaurante italiano muy bueno.',
        'Los niños jugaron al fútbol después de la escuela.',
        'Mañana habrá niebla en el valle del Ebro.',
      ],
    },
    STYLE_LONG_SENTENCE: {
      bad: [
        ['Por la mañana, cuando me desperté y vi que una lluvia fina caía sobre los viejos tejados de la ciudad, decidí no ir al trabajo y quedarme en casa, donde preparé un café largo, abrí la ventana, leí unas páginas de un libro antiguo que me había regalado mi abuelo y esperé a que dejara de llover, aunque sabía muy bien que no pararía pronto.', 'Por la mañana', undefined],
        ['El alcalde anunció que las obras de la nueva ronda comenzarían en primavera, después de que las autoridades firmaran todos los documentos necesarios, obtuvieran la aprobación de los ministerios implicados, eligieran a la empresa constructora mediante concurso público y acordaran con los vecinos el trazado exacto de la carretera, de modo que se afectara al menor número posible de viviendas.', 'El alcalde', undefined],
        ['Aunque los profesores pidieron muchas veces que se cambiara el reglamento de la escuela, y los padres firmaron peticiones y acudieron a las reuniones cada mes, la dirección aplazó la decisión hasta que la inspección envió una comisión que revisó los expedientes, habló con los alumnos y recomendó cambios importantes en el horario diario.', 'Aunque', undefined],
      ],
      good: [
        'Por la mañana me quedé en casa, preparé un café largo y leí unas páginas de un libro antiguo que me había regalado mi abuelo.',
        'El alcalde anunció que las obras de la nueva ronda comenzarían en primavera, tras la firma de los documentos y la elección de la empresa constructora.',
        'Los profesores pidieron que se cambiara el reglamento, y los padres firmaron peticiones, pero la decisión se aplazó hasta la llegada de una comisión.',
      ],
    },
    STYLE_REPEATED_WORD: {
      bad: [
        ['La ciudad es grande, la ciudad vieja tiene calles estrechas y la ciudad nueva tiene avenidas anchas.', 'ciudad', undefined, 2],
        ['El proyecto empezó en marzo, el proyecto siguió en verano y el proyecto terminó en otoño.', 'proyecto', undefined, 2],
        ['Los alumnos llegaron pronto, los alumnos leyeron mucho y los alumnos se fueron tarde por la noche.', 'alumnos', undefined, 2],
      ],
      good: [
        'La ciudad es grande, el casco antiguo tiene calles estrechas y el barrio nuevo tiene avenidas anchas.',
        'El proyecto empezó en marzo y terminó en otoño, después de dos etapas de trabajo.',
        'Los alumnos llegaron pronto, leyeron mucho y se fueron tarde por la noche, bastante satisfechos.',
      ],
    },
  },
};
