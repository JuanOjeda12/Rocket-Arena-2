# Rocket Arena — listo para GitHub Pages

Esta carpeta contiene únicamente los archivos de publicación y el servidor LAN. No incluye sonidos nuevos, descargas originales, capturas de pantalla, pruebas, compiladores ni dependencias instaladas.

## Publicar en GitHub Pages

1. Sube TODO EL CONTENIDO de esta carpeta a la raíz de tu repositorio, en la rama main. index.html debe quedar directamente en la raíz, no dentro de PARA-GITHUB ni de dist.
2. En GitHub entra a Settings → Pages.
3. En Source selecciona Deploy from a branch.
4. Selecciona main y /(root), y guarda con Save.
5. Espera a que GitHub termine la publicación y abre la dirección que aparezca en Pages.

No necesitas ejecutar una compilación ni configurar GitHub Actions. Incluye también .nojekyll y .gitignore, aunque tu explorador o el selector de archivos los oculte. Si subes mediante la web, extrae primero el ZIP: subir el ZIP sin extraer no publica el juego.

Referencia: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Qué se puede jugar desde Pages

Entrenamiento libre, garaje y partidos casuales o competitivos con bots en 1v1, 2v2 y 3v3. Es un jugador humano contra el juego; no hace falta ejecutar un servidor propio para estos modos.

Los archivos y la física se ejecutan en el navegador. Hace falta conexión para abrir/descargar inicialmente la página; no se incluye instalación PWA ni garantía de funcionamiento después de desconectar Internet. Usa un navegador de escritorio con WebGL y WebAssembly.

## Jugar entre computadoras del mismo Wi-Fi (LAN)

GitHub Pages aloja archivos estáticos y no ejecuta el servidor multijugador. Una computadora anfitriona debe tener esta carpeta descargada y Node.js 22 o posterior.

En la computadora anfitriona, desde esta carpeta:

```sh
npm ci
npm start
```

También puedes ejecutar Start-Game.ps1 en Windows, que instala la dependencia si falta e inicia el servidor en segundo plano. npm ci necesita Internet la primera vez; después el juego LAN usa la red local.

El servidor muestra una dirección LAN, por ejemplo http://192.168.0.10:8080. TODOS abren esa misma dirección en el navegador. Los invitados no necesitan instalar Node ni descargar esta carpeta.

El anfitrión crea una sala pública en Jugar → Partida privada → LAN y pone una contraseña. Los invitados buscan la sala y solicitan entrar. El anfitrión asigna sus equipos; reemplazan a bots. El anfitrión inicia el partido; los invitados pulsan Entrar al partido.

Abre directamente la dirección HTTP de la computadora anfitriona para LAN. No intentes conectar desde la página HTTPS de GitHub a un servidor HTTP local: el navegador puede bloquearlo.

Mantén la computadora anfitriona encendida. Si no conecta, comprueba el firewall de redes privadas y que el Wi-Fi no aísle dispositivos. Puertos: TCP 8080 y UDP 9182. La IP puede cambiar. Para detener el servidor usa Ctrl+C si arrancó con npm start; si usaste el lanzador oculto, finaliza su proceso Node.

## Contenido y créditos

Incluye estadio de día/atardecer/noche, espectadores 2D, luces graduales, cinco eventos aéreos por partido, turbo y estelas, explosiones, salvadas, bots y repeticiones. A los tres minutos transcurridos llega el atardecer; con 1:00 restante ya es de noche. Incluye sonidos originales sintetizados de motor, turbo, saltos, golpes de balón, recogida de boost, salvadas y goles. Configuración permite silenciarlos.

Conserva ASSET-CREDITS.md, las licencias dentro de assets y THIRD-PARTY-LICENSES. Los modelos de Octane, Fennec y Dominus son comunitarios de Jako; el F1 Concept es de Qvist_designs y no es el F1 oficial de Rocket League. Es un prototipo independiente inspirado en el juego, sin afiliación oficial.

La conexión ONLINE queda preparada para un servidor HTTPS/WSS externo, pero no se incluye un servidor publicado en Internet. Las salas son temporales y se cierran si sale el anfitrión.

## Configuración de controles

Debajo de Garaje está Configuración. Puedes elegir controles originales con mouse o PC sin mouse: WASD para conducir/orientar, Espacio para salto, Shift izquierdo para turbo, X para derrape/air roll, Q/E para air roll directo y C para cámara. Pulsa una asignación y luego una tecla o botón para personalizarla; Esc cancela, Supr borra. La selección se guarda en el navegador. Esc siempre abre el menú.

## Rangos, puntuación y cuentas (0.5)

Mantén TAB durante el juego para ver puntos, goles, asistencias, salvadas y tiros; al terminar aparecen automáticamente junto con XP y cambios de clasificación. Perfil muestra nivel, estadísticas y los tres rangos competitivos. Casual no cambia rangos. Competitivo tiene diez posicionamientos por modalidad y bots que aumentan de dificultad con tu MMR. Abandonar competitivo cuenta como derrota.

Antes de configurar la nube se puede jugar como invitado y conservar progreso en este navegador. Para activar cuentas con email y contraseña y guardado entre dispositivos, sigue setup/README-CUENTAS.md y ejecuta setup/account-schema.sql en tu proyecto Supabase Free. Solo se ponen la URL del proyecto y su clave pública en account-config.js. No se incluyen contraseñas ni claves secretas. La carpeta ya incluye la URL y la clave pública del proyecto Supabase proporcionado. Su API responde y la confirmación de email está activada; sigue la guía de cuentas para configurar la URL del sitio y el envío de correos si hace falta. Aún debes probar el registro y guardado con tu propia cuenta.

Los detalles de rangos, puntuación, XP y las fuentes oficiales investigadas están en setup/REGLAS-PROGRESO.md. Las fórmulas de este prototipo son propias y no afectan a Rocket League ni a cuentas de Epic Games.


## Final de partido y partida privada local

En Jugar → Partida privada → LOCAL · SIN SERVIDOR puedes elegir entre 1 y 5 jugadores por equipo (incluyendo tu puesto), tu lado y ocho dificultades de bots, de Bronce a Leyenda Supersónica. El resto de puestos son bots; funciona directamente en GitHub Pages y no altera XP ni rangos.

A 0:00 se sigue jugando hasta que el balón toque el suelo. Un empate inicia prórroga con saque; un gol que empate a 0:00 muestra su repetición y luego inicia la prórroga. En prórroga, el primer gol decide el partido.

Los resultados tienen tablas flotantes, sin la caja exterior oscura. Detrás se reproduce un resumen de goles y salvadas capturados mientras la partida estuvo abierta y luego aparece el podio del equipo ganador. Si no hay goles ni salvadas se usa la última jugada. El botón PODIO / JUGADAS permite alternar. En el podio puedes girar, saltar y activar turbo con tus controles, sin salir de tu puesto; tu reconocimiento personal aparece al lado de los puntos. Las celebraciones son visuales en cada navegador.

El resumen conserva como máximo seis clips y solo muestrea 12 veces por segundo: no graba vídeo ni añade descargas de sonido. Los sonidos se generan localmente con Web Audio y se activan tras tu primer clic. Los originales de Rocket League no están incluidos. Para aplicar el reloj nuevo en LAN, actualiza los archivos y reinicia el servidor anfitrión.

## Bots tácticos (27 de octubre de 2026)

Se rehizo la toma de decisiones: saque directo y rápido, intercepción por tiempo de llegada, selección de huecos de tiro según los rivales, compensación de la velocidad lateral del balón y recuperación por el lado de la propia portería. Los compañeros tienen roles de atacante, portero y apoyo; también se considera al jugador humano para evitar que todos disputen el mismo balón. Los bots vuelven al centro de la portería al perder la posición en las esquinas.

Competitivo arranca con una exigencia mucho mayor y sigue aumentando con el rango. Los niveles altos incorporan vuelos dirigidos, segundo salto, recuperación de la orientación, y seguimiento por debajo del balón para continuar un air dribble cuando hay altura, alineación y turbo suficientes. Los niveles máximos no garantizan un air dribble en cada ataque ni están libres de errores. No se alteran la fuerza, velocidad, gravedad ni colisiones de los coches o del balón.

Pruebas de desarrollo con RocketSim: tres tiros a puerta vacía convertidos (antes uno), intercepción cruzada antes de un segundo, cinco tiros salvados desde una posición centrada, varios contactos aéreos por encima de cuatro metros con gol posterior en una situación favorable, y reparto de roles en 3v3. En un duelo controlado de saque, el nuevo bot venció 13–0 al anterior; no representa una tasa de victoria frente a jugadores humanos ni una equivalencia con rangos reales de Rocket League.

Los módulos de entrada llevan una versión nueva para evitar que el navegador mezcle la IA antigua con la nueva. Tras subir la actualización, espera a que Pages termine y recarga. Para LAN, copia los archivos al equipo anfitrión y reinicia su servidor.

## Nexto y flip reset (27 de octubre de 2026)

La dificultad competitiva alta usa ahora el modelo entrenado Nexto de Rolv-Arild/Necto, no el controlador anterior de reglas. Los bots activos aparecen como NEXTO. El modelo completo se ejecuta localmente mediante WebAssembly SIMD a 15 decisiones por segundo, con las observaciones, angular velocity, turbo y disponibilidad de flip reales de RocketSim. No llama a una API de IA ni tiene coste por partida. Casual conserva el controlador ligero. Toda la escala competitiva y los niveles del selector privado usan Nexto con una selección de acciones progresiva.

Incluye el modelo original convertido a datos float32, su inferencia y sus licencias. Nexto y los archivos adaptados de su arquitectura/observaciones están sujetos a CC BY-NC-SA 4.0: atribución, uso no comercial y compartir adaptaciones bajo los mismos términos. Lee THIRD-PARTY-LICENSES/NEXTO-LICENSE.txt y setup/NEXTO-INTEGRACION.md. No se afirma afiliación o aprobación de los autores.

RocketSim permite recuperar el flip con al menos tres ruedas en el balón. El indicador reproduce un destello circular blanco bajo el coche, que se expande y desaparece en aproximadamente medio segundo, acompañado de un sonido. No es un icono permanente ni concede flips: observa los contactos reales de las ruedas y el reset de la física. Solo aparece para ti durante la partida y para todos en las repeticiones; se puede desactivar junto con su sonido desde Configuración. Está inspirado en el indicador de Rocket League v2.66.

La integración fue contrastada con una implementación NumPy independiente del modelo y con pruebas físicas de tiros, salvadas y recuperación/consumo de un flip. Esto no garantiza ganar cada partido ni ejecutar air dribbles o flip resets de forma profesional en cada jugada. Las estadísticas de pruebas del controlador anterior no son una medida del nivel de Nexto.

### Escala continua y compañero

La fuerza de Nexto crece de forma continua con el MMR, también dentro de las divisiones. Los niveles inferiores eligen entre acciones cercanas a la mejor según el modelo; se usa la selección beta/softmax publicada por sus autores, descartando opciones muy poco probables. En el máximo se elige siempre la acción mejor valorada. No hay salto de controlador entre Platino y Diamante. Es una escala propia que necesita calibración jugando, no una equivalencia garantizada con los rangos oficiales.

Cuando un equipo contiene humanos, los bots compañeros usan un parámetro de nivel moderadamente inferior (0.85 veces el nivel seleccionado); los rivales conservan su nivel completo. Ese factor no es una reducción física ni un porcentaje garantizado de rendimiento. Se recalcula también al entrar o salir de una sala LAN.

### Arco y sonidos de postes

El arco físico mide 17.8551 m de ancho y 6.42775 m de alto, en las coordenadas estándar que utiliza Nexto. Se alineó la cara interior del marco visual con esa abertura, corrigiendo una intrusión visual de 12.5 cm. No se ensanchó el arco ni se cambió la escala de las observaciones de Nexto. Un tiro al poste o al travesaño produce ahora un golpe metálico propio, distinto del bote normal. Las pruebas físicas distinguieron poste, travesaño y gol limpio.
