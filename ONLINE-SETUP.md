# Partidas privadas online (GitHub Pages + servidor)

GitHub Pages aloja el juego. El servidor Node ya incluido comparte la física y los controles entre jugadores; Supabase sigue guardando cuentas y progreso.

1. Sube los archivos de esta actualización a la raíz del repositorio, conservando también server/, engine/, assets/, vendor/, package.json y package-lock.json.
2. Crea una cuenta en https://render.com y conecta tu repositorio de GitHub.
3. Elige New > Blueprint, selecciona el repositorio y aplica render.yaml. Como alternativa: New > Web Service, runtime Node, build `npm ci --omit=dev`, start `npm start`, plan Free; variables DISABLE_DISCOVERY=1 y MAX_ROOMS=1. No pongas una carpeta raíz si el juego está en la raíz del repositorio.
4. Espera a que el servicio esté Live. Copia su dirección HTTPS (por ejemplo https://rocket-arena-private.onrender.com). Abre esa dirección + /api/health: debe mostrar {"ok":true}.
5. En el juego: Jugar > Partida privada > ONLINE. Pega esa misma dirección del servidor en ambos equipos y pulsa Buscar salas. Crea una sala pública con contraseña; el otro jugador la selecciona, escribe la contraseña y el anfitrión elige su equipo. Pública aquí significa visible en esa lista, no acceso sin contraseña.
6. Opcional: para que la dirección venga escrita automáticamente para todos, edita online-config.js y cambia ONLINE_SERVER='' por ONLINE_SERVER='https://TU-SERVICIO.onrender.com'; sube ese archivo. Puedes pasármela y preparo el archivo.

No se necesitan claves secretas de Supabase. Competitivo sigue siendo exclusivamente contra bots y las privadas no alteran el rango.

El plan gratuito puede dormir si no hay actividad; la primera búsqueda puede tardar aproximadamente un minuto. El cliente espera hasta 90 segundos. Una instancia gratuita y MAX_ROOMS=1 permiten probar una sala; no garantizan rendimiento con muchos bots Nexto, que consumen CPU. Si el servidor va lento, reduce puestos de bots o usa un servidor con más CPU. Al reiniciarse el servicio se cierran las salas; cuentas y progreso permanecen en Supabase.

Documentación: https://render.com/docs/free y https://render.com/docs/websocket
