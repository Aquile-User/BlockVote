# Análisis de Scripts del Backend

## Scripts Eliminados

### fixedTracker.js (Eliminado el 14 de junio de 2025)

Este script era una herramienta de línea de comandos para monitorear y exportar datos de elecciones y votos desde la blockchain.

**Propósito original:**

- Consultar y mostrar detalles de todas las elecciones registradas en el contrato
- Rastrear el historial de votos emitidos en la blockchain
- Exportar datos a formato JSON para análisis

**Motivo de eliminación:**

- No estaba integrado en los flujos principales de la aplicación
- No era referenciado por ningún otro código fuente del proyecto
- No formaba parte de los scripts NPM configurados en `package.json`
- Solo aparecía mencionado como una utilidad opcional en `voting-dashboard.html`

**Cambios realizados:**

1. Eliminación del archivo `backend/scripts/fixedTracker.js`
2. Eliminación de la referencia en `backend/voting-dashboard.html`

### voting-dashboard.html / blockchain-monitoring-dashboard.html (Eliminado el 14 de junio de 2025)

Este archivo era un dashboard HTML para monitorear visualmente las elecciones y votos en la blockchain.

**Propósito original:**

- Proporcionar una interfaz visual para ver los datos de elecciones y votos
- Mostrar estadísticas y detalles de transacciones en la blockchain
- Servir como herramienta de monitoreo independiente

**Motivo de eliminación:**

- No se encontraron referencias al archivo en ninguna parte del código
- No estaba configurado para ser servido por el servidor Express
- No había enlaces desde el frontend a este dashboard
- Era un componente independiente sin integración real con el resto del sistema

**Cambios realizados:**

1. Renombrado de `voting-dashboard.html` a `blockchain-monitoring-dashboard.html` para reflejar mejor su función
2. Posterior eliminación del archivo `blockchain-monitoring-dashboard.html`

## Scripts Actuales

### deploy.js

Script para el despliegue del contrato inteligente en la red blockchain.

### checkBalance.js

Utilidad para verificar el balance de ETH de una dirección.

### verifyElections.js

Script para verificar el estado y la integridad de las elecciones en el contrato.
