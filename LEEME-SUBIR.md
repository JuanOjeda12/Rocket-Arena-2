# Cómo subir esta actualización

1. Sube el CONTENIDO de esta carpeta a la raíz del repositorio (rama main), reemplazando los archivos repetidos. Son 5 archivos que van al repositorio: `intro.js`, `intro-track.json` (nuevo), `app.js`, `game.js` e `index.html`. No subas este `LEEME-SUBIR.md`.
2. Espera a que GitHub Pages termine de publicar y recarga con Ctrl+F5.

El resto del repositorio no cambia. `tutorial.js`, `autopilot.js` y `fans.js` ya no se usan para la introducción y se pueden dejar donde están.

## Qué cambió respecto a la versión anterior

El tramo de 19,6 s hasta el final **ya no coloca coches ni balón a mano**. Cada escena es una mini-simulación con el motor de física del juego (RocketSim), con bots que siguen un guion, y `intro-track.json` guarda el resultado. `intro.js` solo reproduce esa grabación, coloca la cámara y dispara los efectos.

- **Saque (19,6–23,9 s):** un saque real de bots Nexto 3v3, con la demolición que ocurre sola.
- **Escenas sueltas (23,9–30,7 s):** balón rodando, Octane naranja avanzando, balón botando, dos demoliciones con un coche volcado, el Octane azul por la banda con salto y golpe aéreo, y el derrape del naranja. Todas con física real.
- **Tutorial (30,7–61,7 s):** una jugada real del Octane azul (conducir, saltar, turbo, voltereta y gol a ~59,7 s), más un rival naranja y un coche oscuro que no tocan el balón. Los avisos congelan la escena por completo hasta que pulsas la tecla.
- **Antes del saque (0–19,6 s):** igual que la versión anterior (logo, título, recorrido, cartel, coches y cuenta atrás).

## Qué no es idéntico al video
- No son los mismos movimientos exactos: la física es real, así que un choque o un rebote puede salir un poco distinto al del video.
- Los logos son los de Rocket Arena, no los del video.
- Las posiciones de cámara están ajustadas a ojo con las imágenes de referencia (`REFERENCIA-VIDEO/`); algunos planos pueden necesitar retoques.

## Ajustes rápidos
En `intro.js`, la lista de planos (`sh('k1',...)`) define cuánto dura cada plano, de qué escena sale y su cámara. Si un plano no te gusta, dime su nombre (k1…k18, d1…d21) y lo ajusto.
