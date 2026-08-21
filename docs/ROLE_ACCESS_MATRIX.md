# ROLE_ACCESS_MATRIX

| Feature | SUPER_ADMIN | COMPANY_ADMIN | RRHH | MANAGER | EMPLOYEE |
| --- | --- | --- | --- | --- | --- |
| Dashboard personal | READ | READ | READ | READ | READ |
| Mi jornada | READ/WRITE | READ/WRITE | READ/WRITE | READ/WRITE | READ/WRITE |
| Mi planificación | READ | READ | READ | READ | READ |
| Mis vacaciones | READ/WRITE | READ/WRITE | READ/WRITE | READ/WRITE | READ/WRITE |
| Mis permisos | READ/WRITE | READ/WRITE | READ/WRITE | READ/WRITE | READ/WRITE |
| Mis incidencias | READ/WRITE | READ/WRITE | READ/WRITE | READ/WRITE | READ/WRITE |
| Empleados | ADMIN | NONE | ADMIN | READ | NONE |
| Usuarios | ADMIN | NONE | ADMIN | NONE | NONE |
| Empresas | ADMIN | READ | NONE | NONE | NONE |
| Centros de trabajo | ADMIN | ADMIN | ADMIN | READ | NONE |
| Turnos | ADMIN | ADMIN | ADMIN | READ | NONE |
| Planificación | ADMIN | ADMIN | ADMIN | READ | READ |
| Periodos de planificación | ADMIN | ADMIN | ADMIN | READ | NONE |
| Calendarios | ADMIN | ADMIN | ADMIN | READ | NONE |
| Reports | READ | READ | READ | NONE | NONE |
| Platform | ADMIN | NONE | NONE | NONE | NONE |
| API keys | ADMIN | NONE | ADMIN | NONE | NONE |

Notas:

- `ADMIN` implica lectura, escritura y administración de la entidad.
- `READ/WRITE` implica operación propia y lectura acotada del ámbito permitido.
- `READ` implica consulta sin capacidad de modificación.
- `NONE` implica acceso no permitido.
