# Cómo correr el proyecto

Son **3 procesos** independientes. Hay que tener los 3 corriendo a la vez.

| # | Servicio        | Carpeta              | Puerto | Tecnología        |
|---|-----------------|----------------------|--------|-------------------|
| 1 | Monitor (audio) | `backend/monitorsol` | 8001   | Python / FastAPI  |
| 2 | Backend API     | `backend`            | 3001   | Node / Express    |
| 3 | Frontend        | `frontend`           | 5173   | React / Vite      |

El front (Vite) hace proxy:
- `/api/monitor/*` → `localhost:8001/monitor/*` (servicio Python)
- `/api/chat/*` → `localhost:3001` (Node)
- WebSocket → directo, sin proxy. URL en `VITE_MONITOR_WS_URL`
  (`frontend/.env`), default `ws://localhost:8001`

---

## 1. Monitor Python (monitorsol) — puerto 8001

```bash
cd backend/monitorsol
source venv/bin/activate
export SSL_CERT_FILE=/Library/Frameworks/Python.framework/Versions/3.12/etc/openssl/cert.pem
export REQUESTS_CA_BUNDLE=/Library/Frameworks/Python.framework/Versions/3.12/etc/openssl/cert.pem
uvicorn main:app --host 0.0.0.0 --port 8001
```

- **NO uses `--reload`**: el código está como `.pyc` sin fuente (sourceless) y el reloader falla al re-importar.
- Comandos en **líneas separadas**, no todo pegado en una sola línea.
- Verifica: http://localhost:8001/docs debe dar 200.

### ⚠️ El source `.py` no existe (solo `.pyc`)
El código fuente del monitor nunca se subió a git; solo quedaron los `.pyc` compilados
(Python 3.12). La app fue reconstruida extrayéndolos del commit `44633bd4` como módulos
sourceless. Estructura actual:

```
backend/monitorsol/
├── main.pyc
├── config.pyc
├── api/{monitor_routes,websocket}.pyc
├── core/{keyword_detector,session_manager,stream_capture,transcriber}.pyc
├── db/{__init__,models,testigos_repo}.pyc + testigos.sqlite
└── venv/
```

Si los `.pyc` se borran, recuperarlos así (desde la raíz del repo):

```bash
C=44633bd4
for f in $(git ls-tree -r --name-only $C -- backend/monitorsol | grep 'cpython-312.pyc'); do
  rel=${f#backend/monitorsol/}
  dest="backend/monitorsol/$(echo "$rel" | sed 's#__pycache__/##; s#\.cpython-312##')"
  mkdir -p "$(dirname "$dest")"
  git show "$C:$f" > "$dest"
done
git show "$C:backend/monitorsol/db/testigos.sqlite" > backend/monitorsol/db/testigos.sqlite
```

> Para **editar** el monitor necesitas el `.py` real (de otra máquina/backup). Con `.pyc` solo se ejecuta.

### Rutas que expone (bajo `/monitor`)
`POST /monitor/start` · `DELETE /monitor/stop/{sesion_id}` · `GET /monitor/sessions` · `GET /monitor/testigos` · `WS /ws/{sesion_id}` · `GET /health`

---

## 2. Backend Node (API) — puerto 3001

```bash
cd backend
cp .env.example .env     # solo la primera vez
# editar .env: GEMINI_API_KEY
npm install              # solo la primera vez
npm run dev              # o: npm start
```

`.env` requerido:
```
GEMINI_API_KEY=tu_api_key   # https://aistudio.google.com/app/apikey
PORT=3001
```

> **Ya no usa MySQL.** El Node quedó reducido a una sola ruta, `/api/chat/message`,
> que consume `AsistenteIAChat.tsx`. Se eliminaron `dbService.js`, `config/database.js`,
> las rutas de departamentos y mayia, y la dependencia `mysql2`.
>
> El resto del tablero **no necesita este proceso**: solo el chat del header lo usa.

---

## 3. Frontend — puerto 5173

```bash
cd frontend
npm install              # solo la primera vez
cp .env.example .env     # solo si el monitor no está en localhost:8001
npm run dev
```

Abre http://localhost:5173

El proxy está en `frontend/vite.config.ts`. Si reinicias el front, toma la config nueva.

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `GEMINI_API_KEY no está configurada` | Falta `.env` en `backend` | `cp .env.example .env` y llenar la key |
| `[vite] http proxy error /api/monitor/... ECONNREFUSED` | El monitor Python (:8001) no está corriendo | Levanta el proceso 1 |
| `[vite] http proxy error /api/chat ECONNREFUSED` | El Node (:3001) no está corriendo | Levanta el proceso 2 (solo afecta al chat del header) |
| El WebSocket no conecta en producción | `VITE_MONITOR_WS_URL` sin definir | Ponla en `frontend/.env` apuntando al monitor real |
| `uvicorn: Could not import module main` | Faltan los `.pyc` o no activaste el venv | `source venv/bin/activate` y revisa la sección de recuperar `.pyc` |
| uvicorn falla al guardar/recargar | Usaste `--reload` con módulos sourceless | Corre sin `--reload` |
