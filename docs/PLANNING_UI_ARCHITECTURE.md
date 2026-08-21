# PLANNING_UI_ARCHITECTURE

## Calendario estándar

Se usa FullCalendar Standard en:

- Mi planificación
- Planificación
- Calendario laboral
- Vacaciones
- Permisos
- Fichajes

## Cuadrante propio

La vista de equipo se mantiene como tabla/cuadrante propio para lectura densa:

- empleados en filas;
- días en columnas;
- centro y turno visibles;
- conflictos y ausencias marcados.

## Interacciones clave

- asignación rápida de turno;
- asignación de centro;
- excepción puntual;
- navegación Día / Semana / Mes / Agenda;
- calendario anual laboral;
- lectura del historial sin perder la tabla.

## Restricciones

- sin FullCalendar Premium;
- sin Scheduler;
- sin `schedulerLicenseKey`;
- sin infraestructura Docker en el frontend.
