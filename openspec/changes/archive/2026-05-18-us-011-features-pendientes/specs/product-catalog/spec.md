## ADDED Requirements

### Requirement: Filtro por alérgenos en el catálogo (UI)
El sistema SHALL exponer en la página de catálogo un selector de alérgenos que excluye productos que contienen los ingredientes seleccionados.

#### Scenario: Cargar lista de alérgenos
- **WHEN** el usuario accede al catálogo
- **THEN** se carga la lista de ingredientes con `es_alergeno=true` desde `GET /api/v1/ingredientes` y se muestran como chips seleccionables

#### Scenario: Filtrar por un alérgeno
- **WHEN** el usuario selecciona uno o más chips de alérgenos
- **THEN** el catálogo llama a `GET /api/v1/productos?excluir_alergenos=<id1>,<id2>` y actualiza la grilla excluyendo los productos afectados

#### Scenario: Deseleccionar alérgeno
- **WHEN** el usuario deselecciona un chip de alérgeno previamente activo
- **THEN** el catálogo se actualiza sin ese filtro

#### Scenario: Sin alérgenos en el sistema
- **WHEN** no hay ingredientes marcados como alérgenos en la base de datos
- **THEN** la sección de filtro de alérgenos no se muestra en el catálogo
