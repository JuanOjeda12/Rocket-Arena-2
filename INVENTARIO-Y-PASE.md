# Inventario, misiones, drops y Rocket Pass gratuito

Sube el CONTENIDO de SOLO-NUEVO-Y-CAMBIADO-INVENTARIO a la raíz de GitHub, reemplazando los archivos repetidos. Conserva assets/, engine/ y vendor/. Espera a que Pages y Render publiquen el commit y recarga el juego con Ctrl+F5. Un servidor LAN abierto debe reiniciarse.

## Para probarlo ahora

1. Abre ROCKET PASS y reclama el nivel 1 gratuito: recibes un Sport Drop.
2. En INVENTARIO > DROPS, selecciona ese drop y pulsa ABRIR DROP. La cápsula gira, emite haces de color, se abre y revela el premio. Puedes equiparlo o recogerlo sin cambiar tu coche.
3. Visita GARAJE y después MISIONES > NUEVO PILOTO para reclamar otro drop. Cambiar el color y visitar entrenamiento también tienen su primera misión.
4. Usa VER CATÁLOGO para previsualizar los objetos aún bloqueados. Solo puedes equipar objetos que poseas.

Hay 45 objetos en 8 categorías: coches, decals, pinturas, texturas, sombreros, llantas, turbos y explosiones de gol. Los accesorios son diseños originales de este prototipo; los cuatro coches usan los modelos ya incluidos y sus créditos previos. La animación está inspirada en la apertura de drops de RL, con recursos y efectos propios.

Las cuentas nuevas empiezan con Octane y accesorios básicos. Para no quitar selecciones anteriores, una cuenta existente conserva también el coche que tenía seleccionado al actualizar. Fennec, Dominus y F1 se desbloquean en drops apropiados o en los niveles 12, 20 y 30 del pase.

## Misiones y temporada

8 misiones de Nuevo Piloto, 6 semanales y 8 de temporada, divididas en 4 etapas. La temporada de Rocket Arena dura 28 días y se calcula en UTC; no pretende reproducir las fechas de las temporadas oficiales de Rocket League. La colección permanente no se reinicia. Los niveles y misiones semanales/de temporada se renuevan en sus periodos correspondientes.

El pase tiene una única ruta GRATUITA de 30 niveles, con 1500 XP por nivel. Ganas XP de pase al participar en partidos completos de Casual/Competitivo y reclamar misiones. Se exige al menos 60 segundos y participación para los objetivos de partido; privadas y entrenamiento no cuentan para esas estadísticas. No hay compras, llaves ni pase de pago.

Cada drop otorga un objeto. Los duplicados se conservan con su cantidad. Los tipos y colores se basan en Sport, Special, Deluxe, Importado, Exótico y Mercado negro. Sport/Special/Deluxe/Importado usan 70/25/5% entre sus tres rarezas; Exótico usa 80/20%; Mercado negro, 100%. Estas probabilidades son propias del prototipo, no las probabilidades oficiales de Psyonix. Todos los objetos no básicos del catálogo están en sus grupos de drops. El objeto se añade y se guarda al abrir: cerrar o recargar no consume otro drop ni vuelve a sortearlo. Al volver al inventario se recupera cualquier premio pendiente.

## Guardado

NO necesitas ejecutar SQL nuevo: la tabla player_profiles existente ya guarda un campo JSONB data. Se añaden data.inventory (objetos, cantidades, drops, misiones, pase y apertura pendiente) y data.garage.cosmetics (equipamiento). Los invitados guardan localmente; las cuentas sincronizan con Supabase usando las políticas RLS existentes. Este prototipo conserva el sistema de progreso gestionado por el cliente; no es una economía protegida contra manipulación para vender objetos.

## Referencias consultadas

- Rarezas actuales y nombres: https://www.rocketleague.com/news/patch-notes-v2-38?lang=en
- Misiones y drops en la ruta gratuita: https://www.rocketleague.com/news/rocket-league-challenges--a-closer-look
- Ajuste para omitir animación, añadido por RL en v2.63: https://www.rocketleague.com/news/rocket-league-patch-notes-v2-63

La temática de misiones, premios, probabilidades, catálogo y calendario se adapta a Rocket Arena para poder probarlo gratuitamente. No se añaden comercio entre jugadores ni compras.
