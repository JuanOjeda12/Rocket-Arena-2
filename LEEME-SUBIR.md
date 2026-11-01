# Cómo subir esta actualización

1. Sube el CONTENIDO de esta carpeta a la raíz del repositorio (rama main), reemplazando los archivos repetidos. Son 5 archivos: `intro.js`, `intro-track.json` (nuevo, ~600 KB), `app.js`, `game.js` e `index.html`. No subas este `LEEME-SUBIR.md`.
2. Espera a que GitHub Pages termine de publicar y recarga con Ctrl+F5.

El resto del repositorio no cambia.

## Qué es ahora la cinemática (desde el segundo 19,6)

Una **sola partida 2v2 real y continua**, con los 4 coches siempre presentes (2 azules, 2 naranjas). Se simuló con el motor de física del juego (RocketSim) y se grabó en `intro-track.json`; `intro.js` solo la reproduce. Los coches y el balón se mueven únicamente por la física: no hay posiciones colocadas a mano.

La partida se construyó **por tramos**: cada tramo se buscó (probando variantes de lo que hacen los bots) hasta que ocurrió lo que muestra el video, se fijó, y el siguiente tramo se buscó a partir de ahí:

1. Saque: un coche naranja gana el balón y el balón sube hacia él.
2. Ese coche naranja es demolido por un coche azul (a ~4,3 s de partida). Es la **única demolición**.
3. Un coche gira en el aire (~6 s).
4. El coche azul golpea el balón en el aire (~9 s de partida).
5. Tutorial (desde los 11 s de partida): el coche azul conduce, salta, usa turbo y hace la voltereta que termina en gol, con los avisos congelando la partida hasta que pulsas la tecla. Un rival naranja escolta y otro cae cerca de la portería sin tocar el balón.

Para pasar de "segundos de partida" a "segundos del video" suma 19,6.

## Lo que falta / es provisional
- **Cámara:** por ahora una sola cámara general provisional (y persecución en el tutorial). Los planos cinemáticos se afinarán después.
- **Tiempos:** los hitos caen cerca del video pero no al segundo (por ejemplo, el golpe aéreo cae ~1 s más tarde).
- **Teletransporte único:** al empezar el tutorial (11 s de partida) el coche azul y el balón se recolocan para que la jugada del tutorial salga como en el video; es el único salto de toda la partida.
- Los logos son los de Rocket Arena, no los del video.
- Se descartó la pieza "balón rodando bajo" (video 24 s) porque bloqueaba la búsqueda.
