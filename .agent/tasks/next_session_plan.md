# Estado al 2026-09-01 (noche) — RESUELTO

## Resumen
- `f47bfe2` (pulido sin precios) ya está en producción (origin/main), confirmado.
- La rama local `main` de este dispositivo estaba 49 commits atrasada
  respecto a origin/main. Eso hacía ver ~400 archivos como "modificados"
  en git status — NO era corrupción de fin de línea (CRLF), era solo
  que la carpeta local no estaba sincronizada. Se comprobó con
  `git add --renormalize .`: el contenido real del repo ya es LF
  consistente en el 100% de los archivos.
- Se hizo `git reset --hard cache-bust` para poner la rama local `main`
  exactamente al día con origin/main + el fix de cache-busting.
- Se agregó `.gitattributes` (`* text=auto eol=lf` + binarios) para que
  esto no vuelva a pasar en el futuro. Verificado que no tocó ningún
  archivo existente (el repo ya era consistente).

## Pendiente: 2 commits locales sin pushear en `main`
   28eee2c  chore: bump cache-busting de viabarcazas.css/js
   b7d0e5a  chore: agrega .gitattributes para fijar LF en archivos de texto

Para subirlos, desde tu propia terminal (en esta misma carpeta):
   git push origin main

Eso sube ambos commits de una. Como el repo en Render tiene
autoDeploy: true, apenas se pushee arranca el deploy solo.

## Limpieza opcional (no urgente)
Las ramas locales `cache-bust` y `pulido-sin-precios` ya cumplieron su
función (main las alcanzó). Se pueden borrar cuando quieras:
   git branch -d cache-bust pulido-sin-precios
