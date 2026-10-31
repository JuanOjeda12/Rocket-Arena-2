# Activar cuentas gratuitas con Supabase

Esta entrega ya está conectada al proyecto https://uvrdiqmgcujxbamopswj.supabase.co con su clave pública. La API de autenticación respondió correctamente y el acceso anónimo a los perfiles fue rechazado, como corresponde. La confirmación de email está activada. Falta probar el registro y guardado con una cuenta real creada por ti. La guía siguiente permite revisar la configuración o usar otro proyecto. No se incluyen contraseñas ni claves secretas.

## 1. Crear el proyecto

Entra a https://supabase.com/dashboard y crea una cuenta y un proyecto con el plan **Free**. Elige un nombre, una región cercana y una contraseña de base de datos. Esa contraseña es privada y NO se pone en el juego.

Supabase aporta autenticación por email/contraseña y la base PostgreSQL. GitHub Pages sigue sirviendo el juego. No necesitas contratar una base de datos aparte.

## 2. Crear la tabla y sus permisos

En SQL Editor abre una consulta, pega el contenido de `setup/account-schema.sql` y ejecútala. Crea `player_profiles`, enlazada a los usuarios de Auth. Activa Row Level Security: cada usuario puede leer y actualizar únicamente su propia fila, y los visitantes anónimos no pueden consultar perfiles.

No desactives RLS para resolver un error. Si aparece un error al guardar, revisa primero que ejecutaste el SQL y que la URL y clave pública pertenezcan al mismo proyecto.

## 3. Configurar el acceso por email

Activa el proveedor de email y contraseña en Authentication. En la configuración de URLs, establece como Site URL la dirección publicada del juego. Si conservas los nombres de tu captura sería:

`https://rocket-arena.com/`

Añade también las direcciones desde las que quieras iniciar sesión en tus pruebas, como `http://127.0.0.1:8080/`. Si cambia el nombre del repositorio, usa la dirección nueva.

### Correos de confirmación

El envío predeterminado de Supabase es solo para pruebas: normalmente se restringe a los miembros del proyecto y a dos mensajes por hora. No basta para registrar a todos tus amigos con verificación por correo.

Tienes dos opciones:

- **Recomendada para cuentas públicas:** mantener la confirmación de email y configurar Custom SMTP. Un proveedor con plan gratuito, como Brevo, permite hacerlo dentro de sus cuotas y requisitos de validación. Las credenciales SMTP se ponen en Supabase, nunca en GitHub.
- **Opcional para un prototipo cerrado:** desactivar Confirm email en Supabase para que el registro pueda iniciar sesión directamente, sin enviar correo. En ese caso las direcciones NO están verificadas. Esta es una decisión tuya; no se ha cambiado ninguna configuración externa. La recuperación de contraseñas por correo necesitará SMTP igualmente.

Con confirmación activada, el juego muestra «Revisa tu correo». El enlace vuelve al juego con la sesión iniciada automáticamente.

Documentación: https://supabase.com/docs/guides/auth/passwords y https://supabase.com/docs/guides/auth/auth-smtp

## 4. Conectar el juego

En tu panel copia **Project URL** y **Publishable Key**. También funciona la clave pública antigua `anon`.

Edita `account-config.js`:

```js
export const ACCOUNT_CONFIG={
  url:'https://TU-PROYECTO.supabase.co',
  publishableKey:'sb_publishable_TU-CLAVE-PUBLICA'
};
```

Esos dos datos están diseñados para usarse en el navegador. **Nunca uses `service_role`, una clave `sb_secret_`, una contraseña ni una cadena de conexión de la base de datos.** El cliente rechaza las claves secretas conocidas, pero debes copiar la clave correcta.

## 5. Publicar y probar

Sube el contenido actualizado de PARA-GITHUB a la raíz de tu repositorio. Mantén Pages en `main / (root)`. Prueba:

1. Jugar → Crear cuenta: email, contraseña de al menos ocho caracteres y nombre.
2. Confirmar el email: debe volver a Rocket Arena con la sesión iniciada.
3. Cambiar carro, color o controles; en Perfil debe aparecer «Sincronizado con tu cuenta».
4. Cerrar sesión y entrar desde otro navegador o dispositivo. Debe recuperar el perfil.
5. Terminar un partido casual o competitivo; comprobar XP y, en competitivo, posicionamiento/MMR.

Las pruebas de desarrollo comprueban los contratos de la API con un servicio simulado. La creación de usuarios reales y las políticas SQL deben probarse en tu proyecto después de ejecutar el esquema. No se ha creado ni configurado una cuenta de proveedor por ti.

## Qué se guarda

Carro, color, nombre, controles personalizados, XP, nivel derivado, estadísticas acumuladas, rangos separados de 1v1/2v2/3v3 y el registro necesario para no premiar dos veces un partido. La contraseña la gestiona Supabase Auth; el juego no la almacena. La sesión de acceso se guarda para mantenerte conectado.

El invitado tiene progreso independiente en ese navegador. Al crear una cuenta nueva se puede conservar ese perfil; no se mezcla automáticamente al iniciar sesión en una cuenta ya existente. Si se corta Internet, queda una copia local pendiente y se vuelve a intentar al recuperar la conexión. Evita jugar simultáneamente con la misma cuenta en varios dispositivos: prevalece el último guardado.

## Límites del plan gratuito

En la consulta del 26 de octubre de 2026, Free incluye 50.000 usuarios activos mensuales y 500 MB de base de datos. Los proyectos gratuitos pueden pausarse tras una semana sin actividad. Las condiciones pueden cambiar; compruébalas en https://supabase.com/pricing . Elige Free: no se ha solicitado ningún plan de pago.

Esta base de datos no reemplaza al servidor LAN. Para LAN, una computadora sigue ejecutando `npm start`, como antes.

Los rangos son una progresión de este prototipo contra bots. Sus resultados se calculan en el cliente; no son una clasificación online verificada ni se conectan a Epic Games. Una competición pública resistente a modificaciones del cliente requeriría validar resultados en un servidor.



## Corregir localhost y personalizar el correo

En Supabase → Authentication → URL Configuration, cambia Site URL a `https://rocket-arena.com/`, añade esa misma dirección en Redirect URLs y guarda. El registro solicita expresamente ese destino. Los enlaces antiguos pueden conservar localhost; prueba con un correo nuevo.

En Authentication → Email Templates (o Notifications → Email) → Confirm signup puedes editar asunto y contenido. Asunto sugerido: «Confirma tu cuenta de Rocket Arena». Pega el contenido de `setup/confirm-signup.html` como cuerpo HTML y guarda. Conserva `{{ .ConfirmationURL }}` en el botón: verifica el email antes de volver al juego. Cambiar el remitente requiere Custom SMTP.

El juego verifica la sesión devuelta con Supabase, carga el perfil y quita los tokens de la dirección. La pestaña original también detecta la sesión si sigue abierta en el mismo navegador y dominio. Una confirmación vencida muestra un error. No se han modificado los ajustes externos de tu proyecto ni enviado correos de prueba.
