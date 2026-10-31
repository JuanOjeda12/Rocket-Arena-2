# Rangos, puntuación y experiencia

## Investigación de Rocket League

El orden oficial es Bronce, Plata, Oro, Platino, Diamante, Campeón, Gran Campeón y Leyenda Supersónica. De Bronce a Gran Campeón hay niveles I, II y III; se asciende por las divisiones I–IV de cada nivel. Antes de mostrar la clasificación se completan diez posicionamientos por modalidad.

Las victorias y derrotas afectan la clasificación según el nivel de los rivales; no existe un número fijo de victorias por ascenso. La puntuación individual del encuentro y el nivel de experiencia no son la clasificación competitiva.

Fuentes oficiales:

- Rangos y divisiones: https://www.epicgames.com/help/c-37599050/c-7261959845275/a20928700?lang=en-US
- Ascensos y descensos: https://www.epicgames.com/help/c-37599050/a12805879?lang=en-US
- Posicionamientos: https://www.epicgames.com/help/en-US/c-Category_RocketLeague/c-RocketLeague_Gameplay/o-que-sao-as-partidas-de-classificacao-do-rocket-league-a000084268?lang=en-US
- Experiencia basada principalmente en duración, finalización y bonificaciones: https://www.rocketleague.com/news/patch-notes-v1-50-progression-update/

## Adaptación de este juego

Se usan esos nombres y estructura; los iconos, la calibración del MMR, los puntos y la curva inicial de XP son una implementación propia. No son los umbrales oficiales de Rocket League, que varían entre modalidades y temporadas. La Leyenda Supersónica es el rango máximo mostrado sin divisiones adicionales.

**Casual:** experiencia y estadísticas, sin modificar el rango. **Competitivo:** experiencia y clasificación independiente en 1v1, 2v2 y 3v3. **Entrenamiento y privadas:** estadísticas del encuentro, sin XP ni MMR. Para poder progresar contra bots, este prototipo permite XP en sus partidos locales normales; el juego original reserva la progresión para sus partidas online.

### MMR

- Diez posicionamientos en cada modalidad. Durante ellos el rango aparece oculto, con el contador 0/10–9/10.
- MMR inicial 400. Se aplica una fórmula tipo Elo: `K × (resultado - probabilidad esperada)`, con K=80 en posicionamiento y K=32 después. Por defecto los bots se calibran 40 MMR por encima del jugador para calcular esa probabilidad.
- Cada nivel I/II/III ocupa 80 MMR, con cuatro divisiones de 20. Bronce I comienza en 0 y Leyenda Supersónica en 1680.
- El descenso tiene un margen de cinco MMR para evitar cambios constantes al cruzar un límite. El MMR no puede bajar de cero.
- Solo cuentan victoria/derrota y dificultad del rival; los puntos individuales no aumentan el MMR. Abandonar competitivo, cerrar o recargar con un partido pendiente cuenta como derrota al volver. Reiniciar el saque con R está desactivado en competitivo.
- La dificultad de los bots aumenta continuamente con el MMR. En niveles altos hay reacción más rápida, mayor anticipación, defensa de trayectorias y vuelos sencillos con boost y doble salto. Son bots programados, no una red neuronal entrenada al nivel de jugadores profesionales de esos rangos.

### Puntos del partido

| Acción | Puntos |
| --- | ---: |
| Contacto con el balón | 2 |
| Tiro a puerta | 10 |
| Asistencia | 50 |
| Salvada | 50 |
| Salvada épica | 75 |
| Gol | 100 |

Los contactos vienen de RocketSim. Un tiro se cuenta cuando su trayectoria apunta al arco rival; las salvadas se confirman tras el desvío. El último atacante reciente recibe el gol y el compañero anterior puede recibir asistencia. No se suman una salvada normal y una épica para el mismo evento. No se han implementado todos los premios especiales del juego original.

Mantén **TAB** para consultar el marcador sin pausar. Al terminar se muestra automáticamente, junto a la recompensa. Los goles de equipo y los puntos personales son contadores distintos.

### Experiencia

Se premian los partidos normales finalizados de al menos 60 segundos, con participación del jugador. Fórmula propia:

`4.5 × segundos (máximo 20 min) + 100 por finalizar + 150 por victoria + 75 por MVP del equipo ganador + 0.1 × puntos (máximo 1000 puntos)`

Sin actividad o al abandonar no se recibe XP. Cada identificador de partido se procesa una sola vez. Los primeros niveles requieren `nivel × 1000` XP; desde nivel 20 se necesitan 20.000 XP por nivel. XP y clasificación se guardan por separado: puedes subir de nivel incluso perdiendo, y una derrota competitiva puede bajar tu rango.

La copia local permite jugar sin configurar cuentas. Para guardar entre dispositivos, sigue README-CUENTAS.md y conecta Supabase.
