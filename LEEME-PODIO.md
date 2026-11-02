# Podio, marcos, banners y fotos de perfil

## Qué hay de nuevo
- **Tarjeta de jugador** (marco + foto + banner, dibujo propio inspirado en las recompensas de temporada): aparece abajo a la izquierda del menú, al meter un gol (abajo a la izquierda, durante la repetición del gol) y en el podio de fin de partido. Los bots llevan el banner de su rango.
- **PERFIL → IDENTIDAD**: elige entre 8 marcos y 8 banners, uno por rango (Acero, Cobre, Plata, Oro, Esmeralda, Zafiro, Amatista, Rubí) y sube tu foto. Acero, Cobre y Plata son gratis; el resto sale de drops (Oro: Sport, Esmeralda: Special, Zafiro: Deluxe, Amatista: Importado, Rubí: Exótico) y también se equipan desde el INVENTARIO (pestañas MARCOS y BANNERS). Invitados: marco y banner sí; la foto necesita cuenta.
- **PODIO** (menú principal): clasificación por modalidad (1v1, 2v2, 3v3) con rango y MMR; los 3 primeros en pedestal. Solo aparecen quienes han jugado 10 partidos competitivos.
- **Foto de perfil con aprobación**: la foto se reduce a 160×160 y queda "En revisión". Nadie la ve hasta que el administrador la aprueba.
- **Panel admin** (PERFIL → ABRIR PANEL ADMIN): fotos pendientes (aprobar / rechazar con motivo), fotos aprobadas (retirar), jugadores (ocultar del podio). Solo la cuenta `juanojeda@e.correosanbartolo.edu.co` con el correo confirmado.
- **Bots nuevos**: Bronce = bot básico; Plata = bot por reglas; Oro-Diamante = Necto V1; Campeón en adelante = Nexto (ver BOTS-POR-RANGO.md).

## Paso obligatorio (una sola vez): activar el podio online
1. Entra a tu proyecto de Supabase → **SQL Editor** → New query.
2. Pega todo el contenido de `setup/perfiles-publicos.sql` y pulsa **Run**.
3. Crea tu cuenta en el juego con `juanojeda@e.correosanbartolo.edu.co` y confirma el correo. Esa cuenta verá el botón del panel admin.

Sin ese paso el juego funciona igual (marco y banner locales), pero el podio mostrará un aviso y no se pueden subir fotos.

## Cómo está protegido
- La seguridad del panel está en la base de datos (políticas RLS y funciones), no solo en la pantalla: aunque alguien edite el JavaScript, no puede aprobar fotos ni cambiar la columna `avatar`.
- Un jugador solo puede escribir su propia fila; no puede poner su propia foto aprobada ni quitarse el "oculto".
- Cada foto nueva vuelve a "pendiente" automáticamente.

## Límites que conviene saber
- El MMR del podio lo envía el propio navegador del jugador (como todo el progreso del juego): un jugador con conocimientos podría falsificarlo. Para evitarlo haría falta un servidor que juegue/valide los partidos.
- En salas online, los demás jugadores humanos se ven con el banner por defecto (marco y foto aún no viajan por el servidor de salas).
- Los nombres de usuario no se moderan previamente; si hay uno inapropiado, usa JUGADORES → OCULTAR DEL PODIO.

