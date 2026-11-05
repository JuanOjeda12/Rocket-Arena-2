# Tienda diaria y créditos

## SQL (una sola vez)
Ejecuta `setup/tienda.sql` en el SQL Editor de Supabase (después de `perfiles-publicos.sql` y `admin-total.sql`). Sin él la tienda funciona igual (sin exclusiones ni retiradas del admin).

## Cómo funciona
- **Créditos (◈)**: se ganan con misiones (50–800 según la rareza del drop), cada nivel del Rocket Pass (100 + 15 × nivel) y como premio ocasional de un drop (cada drop da UN solo premio: un objeto o, con un 15 % de probabilidad, créditos en vez de objeto: 100–2000 según la rareza del drop; nunca los dos). Se ven en el menú principal, en la tienda y en el panel admin.
- **Tienda**: 8 objetos al día (2 destacados y 6 diarios), los mismos para todos, que cambian cada día a las 00:00 UTC (hora de Colombia: 7 p. m.). Se eligen de los objetos que salen en drops (no incluye marcos/banners de rango ni títulos de misión o pase). Un objeto ya comprado no se vuelve a vender al mismo jugador y no puede haber repetidos.
- **Precios** por rareza: Sport 100 · Special 300 · Deluxe 600 · Importado 1000 · Exótico 1500 · Mercado negro 2200 (coches ×1,5). Cada color es un objeto distinto, como en RL.
- La tienda usa la vista previa del coche: elige un objeto y lo ves puesto (arrastra para girar). Los títulos, marcos y banners muestran tu ficha con ese objeto.

## Panel admin
- **Créditos**: en cada jugador, pestaña CRÉDITOS (+/− 100, 500, 1000, 5000 o cantidad exacta) y GUARDAR. La lista de jugadores muestra los créditos de cada uno.
- **TIENDA** (pestaña del panel): ves los 8 objetos de hoy y puedes **RETIRAR HOY** cualquiera; también puedes **excluir** objetos del sorteo (se excluyen todos sus colores) y volver a permitirlos. GUARDAR TIENDA lo aplica a todos en menos de un minuto. Si excluyes un objeto, solo ese se sustituye por otro; el resto de la tienda no cambia.

## Límite honesto
Las compras y los créditos se guardan en la cuenta del jugador desde su navegador (como el resto del progreso), así que un jugador con conocimientos podría alterarlos. Para evitarlo haría falta validar compras en un servidor.
