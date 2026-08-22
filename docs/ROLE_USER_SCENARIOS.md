# ROLE_USER Scenarios

Fecha de referencia: 2026-08-22

## Escenarios cubiertos

### 1. Login de autoservicio

- Dado un usuario `ROLE_USER` válido
- Cuando inicia sesión con su número y contraseña
- Entonces accede a `/dashboard` y a sus vistas personales

### 2. Inicio de jornada dentro de ventana

- Dado un usuario con turno activo
- Y una política de empresa que permite fichar desde `N` minutos antes
- Cuando la hora actual está dentro de la ventana permitida
- Entonces `GET /api/v1/time-entries/me/eligibility` devuelve `canStart=true`
- Y el botón de iniciar jornada se habilita

### 3. Inicio de jornada demasiado pronto

- Dado un usuario con turno a las 08:00
- Y una política de `earlyClockInMinutes=10`
- Cuando intenta fichar a las 07:49:59
- Entonces la API responde que no puede iniciar la jornada
- Y la interfaz muestra un mensaje de espera

### 4. Inicio en el borde permitido

- Cuando intenta fichar a las 07:50:00
- Entonces la API permite el inicio
- Y la interfaz deja de mostrar el aviso de bloqueo temporal

### 5. Pausa de jornada activa

- Dado un usuario con jornada en marcha
- Cuando pulsa `Pausar`
- Entonces la sesión pasa a `PAUSED`
- Y el tiempo de pausa empieza a acumularse

### 6. Reanudación tras pausa

- Dado un usuario con jornada pausada
- Cuando pulsa `Reanudar`
- Entonces la sesión vuelve a `WORKING`
- Y el cronómetro continúa

### 7. Finalización de jornada

- Dado un usuario con jornada activa o pausada
- Cuando pulsa `Finalizar`
- Entonces la jornada pasa a `COMPLETED`
- Y ya no se permite un fichaje de entrada nuevo para el mismo día

### 8. Histórico personal

- Dado un usuario con fichajes previos
- Cuando abre `/time-entries`
- Entonces ve sus propios registros
- Y no ve registros de otros usuarios fuera de su alcance

### 9. Móvil

- Dado un usuario en pantalla pequeña
- Cuando abre el menú lateral
- Entonces puede navegar sin bloquear la pantalla
- Y el menú se cierra al cambiar de ruta

## Casos que no deben ocurrir

- Ver CRUDs de empresas, empleados, turnos o centros de otros roles.
- Poder fichar antes del horario permitido por la política de empresa.
- Tener un botón de pausa activo cuando no existe jornada activa.
- Ver el mismo menú de administración en todos los roles.
- Quedarse atrapado en el menú móvil sin poder volver al contenido.

