# SCHEDULING_DOMAIN

## Unidad base

La planificación se modela como:

`Empleado + Turno + Fecha/Rango + Centro = Asignación planificada`

## Entidades

- `WorkLocation`
- `Employee`
- `Shift`
- `ShiftAssignment`
- `ShiftRotation`
- `ShiftOverride`
- `Calendar`
- `PlanningPeriod`
- `PlanningConflict`

## Resolución

El resolver de planificación decide qué debe ocurrir cada día para un empleado, aplicando la prioridad:

1. Override específico
2. Asignación puntual
3. Rotación
4. Asignación vigente
5. Default de calendario
6. Sin planificación

## Capacidades

- asignación simple;
- asignación por rango;
- asignación masiva;
- excepciones puntuales;
- lectura diaria, semanal, mensual y agenda;
- calendario de equipo;
- cuadrante por empleado y centro;
- conflictos y ausencias.
