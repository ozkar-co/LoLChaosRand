# LoL Chaos Randomizer

Generador de configuraciones caoticas para League of Legends.

## Objetivo
Crear un generador de configuraciones de juego que asigne de forma aleatoria un Campeon, un Rol y una Build, obligando a los jugadores a adaptarse a escenarios absurdos, divertidos y altamente desafiantes.

## Idea Principal
En lugar de jugar una partida "meta", el sistema propone combinaciones inesperadas para forzar creatividad y adaptacion.

Ejemplos de salida:
- Campeon: Ahri
- Rol: Jungla
- Build: Muro de Piedra

- Campeon: Nautilus
- Rol: Mid
- Build: Critico Explosivo

## Estructura Del Proyecto

```text
LoLrand/
  assets/
    loading/
    splash/
    tiles/
  data/
    champion.json
    playstyle.json
    roles.json
  clean_assets.py
  .gitignore
  README.md
```

## Datos Disponibles

### Campeones
Archivo: `data/champion.json`

- Contiene el catalogo completo de campeones.
- Incluye informacion como nombre, tags, lore, estadisticas e imagen de referencia.

### Roles
Archivo: `data/roles.json`

- Define los roles jugables principales:
  - Top
  - Jungla
  - Mid
  - Bot (Carry)
  - Support
- Cada rol incluye una descripcion de responsabilidad dentro de la partida.

### Estilos De Juego Y Builds
Archivo: `data/playstyle.json`

- Agrupa estilos de juego (AD, AP, Tanque, Hibrido, Utilidad, etc.).
- Cada estilo contiene varias builds con nombre y descripcion.

## Assets
La carpeta `assets/` guarda imagenes visuales usadas por el proyecto:

- `assets/loading/`: fondos o imagenes para pantalla de carga.
- `assets/splash/`: splash arts de campeones.
- `assets/tiles/`: iconos o miniaturas.

Despues de la limpieza, los archivos de campeon quedan idealmente con formato:
- `Aatrox.jpg`
- `Ahri.jpg`
- `Lux.jpg`

## Flujo De Randomizacion (Propuesto)
1. Elegir un campeon aleatorio desde `data/champion.json`.
2. Elegir un rol aleatorio desde `data/roles.json`.
3. Elegir un estilo y luego una build aleatoria desde `data/playstyle.json`.
4. Mostrar resultado final junto con assets del campeon.

## Limpieza De Assets
Incluye script: `clean_assets.py`

Funcion:
- Borra variantes `_N` (por ejemplo `Aatrox_1.jpg`, `Aatrox_33.jpg`).
- Conserva `Aatrox_0.jpg` y la renombra a `Aatrox.jpg`.
- Recorre todas las subcarpetas de `assets/` o las que indiques.

Uso:

```bash
# Vista previa (no modifica archivos)
python3 clean_assets.py

# Vista previa de una carpeta especifica
python3 clean_assets.py --dirs loading

# Aplicar cambios reales
python3 clean_assets.py --apply
```

## Siguientes Pasos Sugeridos
- Crear un script principal `randomizer.py` para generar una configuracion completa.
- Exponer el randomizador como CLI (terminal) o mini web app.
- Agregar filtros opcionales (por ejemplo: evitar roles repetidos en una sesion).
- Guardar historial de tiradas para compartir retos entre amigos.

## Estado Del Proyecto
En construccion. Base de datos y assets listos para montar el generador.
