# Marcación y gestión documental en TALANA · Consorcio Rovella – INMAC

Presentación web tipo e-learning: **inducción** para colaboradores sobre el uso de
TALANA (marcación de asistencia, renovaciones de contrato y boletas de pago).
Al final se presenta el **Compromiso de cumplimiento de marcación y gestión documental
en TALANA** (`Compromiso_TALANA_REVISADO V04.docx`), que el trabajador debe descargar,
firmar y entregar a Recursos Humanos.

El guion está pensado como inducción, no como lectura del documento: las láminas 1 a 14
explican el día a día, la 15 introduce el documento con su base normativa y la 16 cierra
con la acción que necesita RR. HH. Cada locución interpreta su lámina (no la lee) y
termina enlazando con la siguiente, para que las 16 suenen como una sola conversación.

Cada lámina se vincula a un MP3 de narración y la presentación avanza sola cuando el
audio termina.

Misma lógica y lenguaje visual que el proyecto
`2026-05-06 INDUCIÓN PERSONAL NUEVO`, con una diferencia: aquí las láminas son
**HTML/CSS nativas** (no imágenes PNG), sobre un lienzo fijo de 1600 × 900 px
escalado al viewport. Todas comparten la misma plantilla y solo cambia el contenido.

---

## Estructura

```
.
├── index.html            # Las 16 láminas + controles
├── css/styles.css        # Plantilla de lámina, componentes y controles
├── js/app.js             # Reproducción, navegación, escalado
├── audio/                # Audio01.mp3 … Audio16.mp3  (colocar aquí)
├── GUION_LAMINAS.md      # Guion: visual, textos y locución por lámina
└── Compromiso_TALANA_REVISADO V04.docx
```

## Audios

Colocar en `audio/` un MP3 por lámina, con estos nombres exactos:

| Lámina | Archivo | Contenido |
|---|---|---|
| 01 | `Audio01.mp3` | Portada · bienvenida a la inducción |
| 02 | `Audio02.mp3` | Qué es TALANA y para qué lo usarás |
| 03 | `Audio03.mp3` | La cadena: marcación → tareo → planilla → valorización |
| 04 | `Audio04.mp3` | Marca tu ingreso y tu salida, todos los días |
| 05 | `Audio05.mp3` | Lo que tu marcación respalda |
| 06 | `Audio06.mp3` | Caso 1 · no marcaste ni entrada ni salida |
| 07 | `Audio07.mp3` | Qué puede pasar después de la verificación |
| 08 | `Audio08.mp3` | Caso 2 · marcaste solo una vez |
| 09 | `Audio09.mp3` | Cómo se regulariza (24 horas) |
| 10 | `Audio10.mp3` | El formato físico: solo contingencias |
| 11 | `Audio11.mp3` | Renovaciones de contrato |
| 12 | `Audio12.mp3` | Boletas de pago (día 07) |
| 13 | `Audio13.mp3` | TALANA canal oficial, correo personal de respaldo |
| 14 | `Audio14.mp3` | Resumen de responsabilidades |
| 15 | `Audio15.mp3` | El documento y su base normativa |
| 16 | `Audio16.mp3` | Descárgalo, fírmalo y entrégalo |

- La lámina dura **exactamente lo que dure su MP3**; no hay temporizadores que ajustar.
- Si falta un MP3, la lámina se muestra igual, aparece un aviso y (en modo automático)
  avanza a los **9 segundos** (`FALLBACK_MS` en `js/app.js`).

## Controles

| Control | Función |
|---|---|
| ▶ / ❚❚ | Reproducir / Pausar |
| ■ | Detener (vuelve a la lámina 01) |
| ↺ | Reiniciar el audio de la lámina |
| ‹ › | Lámina anterior / siguiente |
| 🔊 | Silenciar / activar sonido |
| Volumen | Deslizador vertical |
| 1x | Velocidad: 1 → 1.25 → 1.5 → 0.75 |
| ⟳ | Reproducción automática on/off |
| ⛶ | Pantalla completa |
| Barra de audio | Clic para saltar dentro de la narración |

**Atajos:** `Espacio` reproducir/pausar · `←` `→` navegar · `F` pantalla completa ·
`M` silenciar · `A` automático.

La barra lateral se oculta durante la reproducción automática y reaparece al acercar
el mouse al borde derecho.

## Uso

Servir la carpeta con un servidor HTTP (no abrir `index.html` directo desde el disco,
para que los MP3 carguen sin restricciones del navegador):

```bash
python -m http.server 8000
```

Luego abrir <http://localhost:8000>.

## Pendiente de RR. HH.

El **canal exacto de firma y entrega** del documento no está definido. La lámina 16 y su
locución dicen solo *"Recursos Humanos te indicará el canal de entrega"*. Cuando se
defina, reemplazar en `index.html` el bloque marcado con
`<!-- AJUSTAR: canal de entrega -->` y regrabar el `Audio16.mp3`.

## Mantenimiento

- **Cambiar textos:** editar la `<section class="slide">` correspondiente en `index.html`.
  Todas usan la misma plantilla: `.s-head` (eyebrow + título + bajada), `.s-body`
  (componentes: `.bullets`, `.cards`, `.flow`, `.split`, `.chips`, `.check`, `.bignum`, `.note`)
  y `.s-foot`.
- **Agregar o quitar láminas:** añadir/eliminar la `<section>` en `index.html` **y** su
  entrada en el arreglo `SLIDES` de `js/app.js` (mismo orden).
- **Cambiar la paleta:** variables `--brand`, `--accent`, etc. al inicio de `css/styles.css`.

---

© Consorcio Rovella – INMAC · Recursos Humanos
