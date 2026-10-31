# Bots por rango

Todo el balance está en UNA tabla: `TIERS` en `bot-difficulty.js` (8 valores por fila: Bronce → Leyenda Supersónica). Si un rango se siente fácil o difícil, cambia solo ese número.

Cada bot sigue por tramos de 1-3 s UN conductor completo (no se mezclan controles), y nunca cambia en pleno salto:

- Bronce / Plata: conductor sencillo, lento, con errores de puntería y sin Nexto.
- Oro: mezcla del conductor sencillo con el conductor por reglas (ya anticipa el balón, usa turbo y rota). Sin Nexto.
- Platino: conductor por reglas con speedflip. Sin Nexto.
- Diamante: igual, con aéreos desde Diamante II. Sin Nexto.
- Campeón: por reglas con tramos de Nexto (~18% al empezar, subiendo).
- Gran Campeón: Nexto ~55% del tiempo, el resto por reglas.
- Leyenda Supersónica: Nexto completo.

Además hay un "factor humano" (temblor de dirección, despistes cortos y turbo no óptimo) que baja con el rango y es 0 en Leyenda. Solo actúa en el suelo.

Estas son dificultades propias del prototipo, no una equivalencia certificada con jugadores reales. Los compañeros siguen un poco por debajo de los rivales. No se alteran cuentas, rangos ganados, inventario ni la física.
