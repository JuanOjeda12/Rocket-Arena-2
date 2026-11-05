# Panel admin completo, historial de partidas y presencia en línea

## Antes de subir: SQL (una sola vez)
Ejecuta `setup/admin-total.sql` en el SQL Editor de Supabase (después de `perfiles-publicos.sql`). Se puede repetir sin problema.

## Panel admin (Perfil → ABRIR PANEL ADMIN; solo tu cuenta de administrador)
- **JUGADORES**: todos los jugadores con tarjeta, correo, nivel, mejor rango, si están **en línea** (y qué partido juegan) o la **última vez** que se conectaron, y cuándo se unieron. Buscador y filtro (todos / en línea / jugando).
- **Ver / editar** un jugador (pestañas): FICHA (nombre, marco, banner, título, foto), COCHE (coche, color y todos los accesorios), INVENTARIO (agrupado por objeto y color; añadir y quitar, sin repetidos), DROPS (±), PROGRESO (XP, MMR, partidos y victorias por modo, estadísticas), PARTIDAS (su historial), EN VIVO y CUENTA.
- **Guardar cambios**: el jugador los recibe solo en unos 15–20 segundos si está conectado (su sesión se actualiza) o al abrir el juego.
- **EN VIVO**: si está jugando un partido, ves modo y marcador y puedes **cambiar el marcador y el tiempo**; le llega en unos 5 segundos.
- **Eliminar cuenta**: pide 4 confirmaciones (dos avisos, escribir el nombre exacto y escribir ELIMINAR). Es permanente.
- Las fotos pendientes/aprobadas y ocultar del podio siguen en sus pestañas.

## Historial de partidas (para cada jugador)
Perfil → VER MIS PARTIDAS: modo (Casual, Competitivo, Heatseeker, Snow Day, Privada local), resultado, marcador, duración, goles/asistencias/salvadas y cambio de MMR. Se guarda en la cuenta; con sesión iniciada también se envía online para que el admin lo vea. No se registran entrenamientos.

## Inventario agrupado
Un objeto con colores es UNA casilla («Corona · 2 de 9 colores»). Al abrirla eliges, entre los colores que tienes, cuál ver y equipar. El admin ve lo mismo y, para añadir, busca el objeto y elige el color; no puede añadir lo que el jugador ya tiene.

## Cámara
En Garaje, Inventario y recompensas de drops puedes arrastrar con el mouse para girar la cámara alrededor del coche (solo a los lados).
