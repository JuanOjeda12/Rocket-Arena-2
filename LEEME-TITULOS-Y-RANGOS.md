# Marcos y banners por rango · Títulos de la ficha

## Marcos y banners (solo por rango)
- **Acero** es el único de inicio. El resto se desbloquea **al llegar a ese rango en cualquier modo** (1v1, 2v2 o 3v3): Bronce, Plata, Oro, Platino, Diamante, Campeón, Gran Campeón y Leyenda Supersónica.
- Cuentan los rangos ya posicionados (10 partidos competitivos). El rango más alto alcanzado **no se pierde** aunque bajes de división. Quien ya tenía rango al actualizar recibe sus desbloqueos en la siguiente vez que abra el menú.
- **Ya no salen en drops.** Al desbloquear sale un cartel con tu ficha con el marco y el banner nuevos puestos, y el botón EQUIPAR.
- En el Inventario y en Perfil → Identidad, los que aún no tienes salen bloqueados y, al pulsarlos, dicen qué rango hace falta.

## Títulos (como en RL)
- Se muestran encima del nombre en la ficha (menú, gol, podio y fin de partido). Se equipan en Perfil → Identidad o en el Inventario (pestaña Títulos).
- **45 títulos**: 31 salen en drops (por rareza) y 14 solo por misiones o por el Rocket Pass (Recluta, Corredor, Veterano y Leyenda Kickoff en los niveles 3, 9, 17 y 26).
- Misiones con título: Primer partido completo, Olfato de gol, Prueba de puntería, Protege la portería, Tu primera racha, Semana de victorias, Veterano de la arena, Temporada goleadora y completar toda la temporada.
- Al abrir un drop con un título, o al ver uno en el Inventario, se muestra cómo queda tu ficha con ese título.

## Podio online
Para que el título salga en el podio, ejecuta en el SQL Editor de Supabase (una sola vez):
```
alter table public.public_profiles add column if not exists title text check (title is null or char_length(title) <= 40);
grant insert (title) on public.public_profiles to authenticated;
grant update (title) on public.public_profiles to authenticated;
```
Si no lo ejecutas, todo funciona igual: solo falta el título en el podio.
