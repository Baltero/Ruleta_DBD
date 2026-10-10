# Ruleta DBD

Ruleta de perks para supervivientes y killers. Cada visitante selecciona sus propios personajes y sus preferencias se guardan en su navegador.

## Empezar en VS Code

1. Abre esta carpeta en VS Code.
2. Instala las extensiones recomendadas: Prettier y Live Server.
3. Haz clic derecho en `index.html` y selecciona **Open with Live Server**.

No requiere instalación de paquetes ni compilación.

## Archivos

| Archivo      | Qué contiene                                          |
| ------------ | ----------------------------------------------------- |
| `index.html` | Estructura de la página y código de AdSense           |
| `styles.css` | Colores, tamaños, diseño adaptable y estilos          |
| `app.js`     | Sorteo, selección, bloqueo, guardado e importación    |
| `catalog.js` | Catálogos de personajes, traducciones e iconos        |
| `icons/`     | Imágenes locales de las perks                         |
| `ads.txt`    | Identificador público del propietario para publicidad |

## Formato

El código usa sangría de dos espacios. Prettier formatea automáticamente al guardar en VS Code. La configuración está en `.prettierrc.json` y `.editorconfig`.

## GitHub y Netlify

Inicializa el repositorio desde Control de código fuente de VS Code, confirma los archivos y publica en tu cuenta de GitHub.

En Netlify, conecta el repositorio sin comando de compilación y con el directorio de publicación `.`. Para una actualización manual, arrastra esta carpeta completa a Deploys del proyecto existente.

## AdSense

Esta copia contiene el código `ca-pub-7263376144556752` y su archivo `ads.txt`. El identificador es público. Después de publicar, verifica el sitio y solicita revisión en AdSense. Los anuncios requieren la aprobación de Google y la activación de Anuncios automáticos en tu cuenta.

## Guardado y catálogo

Al iniciar, no hay personajes seleccionados y las perks generales están activas. Cada modo guarda su selección por separado. Añadir un personaje desde el catálogo incluye sus tres perks; no hay conexión automática con compras de DBD. Para capítulos futuros hay que actualizar el catálogo y las imágenes.

Herramienta de fans sin afiliación con Behaviour Interactive. Los créditos de las imágenes y fuentes aparecen al pie de la página.
