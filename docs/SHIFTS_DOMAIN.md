# SHIFTS_DOMAIN

## Concepto

Un turno define un horario reutilizable. No representa una asignación concreta sobre un empleado.

## Componentes

- `Shift`
- `ShiftDay`
- `ShiftSegment`
- `ShiftAssignment`
- `ShiftRotation`
- `ShiftOverride`

## Reglas

- Un turno puede tener varios días laborables.
- Un día puede tener varios segmentos.
- Un turno puede cruzar medianoche.
- Un turno puede formar parte de una rotación.
- Una excepción puntual no destruye la asignación base.

## Casos cubiertos

- turno normal;
- turno semanal;
- turno partido;
- turno nocturno;
- turno rotativo.

## Prioridad operativa

1. Override puntual
2. Asignación puntual
3. Rotación
4. Asignación vigente
5. Default de calendario
6. Sin planificación
