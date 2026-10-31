# Nexto en Rocket Arena

Origen: https://github.com/Rolv-Arild/Necto/tree/master/rlbot-support/Nexto .

El modelo nexto-model.pt se obtuvo del repositorio oficial. Se extrajeron 444032 parámetros float32 sin ejecutar el código TorchScript. El fichero engine/nexto/weights.bin conserva esos valores. Se portó la arquitectura a WebAssembly SIMD y se contrastaron sus 90 logits con una implementación NumPy independiente en cuatro tamaños de plantilla. Las diferencias máximas observadas estuvieron por debajo de 0.001 y coincidió la acción seleccionada.

El código específico del modelo y los pesos conservan CC BY-NC-SA 4.0; no se autoriza su uso comercial por esta entrega. Se adjunta la licencia completa.

El adaptador usa posiciones y velocidades nativas de RocketSim, orientación, velocidad angular, turbo, contacto con el suelo y disponibilidad real de salto/flip. El cambio de ejes de Three.js a Rocket League y los signos de los controles se invierten al entrar/salir. La red decide cada ocho ticks a 120 Hz. Permite 1v1, 2v2, 3v3 y el límite local de cinco por equipo, aunque una plantilla más grande no implica el mismo nivel de juego que los modos para los que fue entrenada.

La IA se descarga una vez con el resto del juego; no requiere Python, PyTorch, un servicio de pago ni un servidor externo en el navegador. El plan Supabase no cambia. El servidor LAN también ejecuta el mismo modelo y debe reiniciarse tras actualizar los archivos.

Prueba el nivel máximo en Jugar → Partida privada → Local → Leyenda Supersónica. Los bots deben llamarse NEXTO y el marcador local debe identificar NEXTO. No se alteran sus fuerzas, velocidad, colisiones ni la puntuación para garantizar victorias.

Indicador de reset: https://www.rocketleague.com/news/rocket-league-patch-notes-v2-66?lang=en . La prueba física consumió un flip, consiguió al menos tres contactos de rueda contra el balón, comprobó su recuperación, dejó pasar la ventana ordinaria del segundo salto y volvió a consumirlo con éxito. El aviso visual está ligado a ese evento, con la privacidad y opción de desactivación descritas en las notas oficiales.

La dificultad se gradúa mediante beta y las probabilidades de acciones del modelo, manteniendo su cadencia de ocho ticks y la misma física. Se limita el muestreo a acciones a un máximo de cinco logits de la mejor opción. El nivel máximo usa argmax. Los compañeros de humanos usan el 85% del parámetro de fuerza base. Esta es una escala del prototipo y no una certificación de rangos oficiales.
