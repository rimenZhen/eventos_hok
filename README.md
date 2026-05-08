# Quasar App (quasar-project)

Eventos de el salvador

## Install the dependencies

Version de node  22.22.0

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```


### EJECUTAR EN COUCH DB LOS ARCHIVOS QUE SE ENCUENTRAN EN LA RAIZ
### Cambia tu contraseña por la correcta
### 44municipios.json
```bash
curl -d @44municipios.json      -H "Content-Type: application/json"      -X POST      http://admin:tucontraseña@127.0.0.1:5984/eventos_data/_bulk_docs
```

### distritos.json
```bash
curl -d @distritos.json      -H "Content-Type: application/json"      -X POST      http://admin:tucontraseña@127.0.0.1:5984/eventos_data/_bulk_docs
```
### departamentos.json
```bash
curl -d @departamentos.json      -H "Content-Type: application/json"      -X POST      http://admin:tucontraseña@127.0.0.1:5984/eventos_data/_bulk_docs
```
### categorias.json
```bash
curl -d @categorias.json      -H "Content-Type: application/json"      -X POST      http://admin:tucontraseña@127.0.0.1:5984/eventos_data/_bulk_docs
```

### Migrar analíticas de clicks a documentos agregados

Cuando ya tengas definidos `VITE_COUCHDB_URL`, `VITE_COUCHDB_USER`, `VITE_COUCHDB_PASS` y `VITE_DB_DATA`, puedes migrar los arrays legados a documentos métricos mensuales/anuales con:

```bash
node scripts/migrate-analytics-metrics.mjs
```

Para revisar sin escribir nada en CouchDB:

```bash
node scripts/migrate-analytics-metrics.mjs --dry-run
```

La migración no borra históricos viejos. Solo crea documentos nuevos de métricas y deja el documento principal del negocio liviano para futuras escrituras.

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

# eventos
apps de eventos locales
