# Laborator SSI — Demo trafic HTTP (în clar) vs. HTTPS (criptat)

Aplicație **intenționat nesecurizată**, pentru laboratorul de Securitatea
Sistemelor Informatice. Studenții trimit date prin formulare și le „vânează"
în captura de pachete (Wireshark / tcpdump).

> ⚠️ Doar mediu controlat. Nu expuneți public, nu folosiți date reale.

## Cerințe
- Node.js 18+ și npm
- (opțional, pentru HTTPS) `openssl`

## Pornire rapidă (instructor / server)
```bash
npm install
npm start
```
- HTTP în clar: `http://<IP-server>:8080`
- (opțional) varianta criptată pentru contrast:
```bash
./generate-cert.sh     # o singură dată
npm start              # acum pornește și HTTPS pe 8443
```
- HTTPS: `https://<IP-server>:8443` (certificat self-signed → avertisment în browser, normal)

## Porturi
| Protocol | Port | URL                         |
|----------|------|-----------------------------|
| HTTP     | 8080 | `http://<IP-server>:8080`   |
| HTTPS    | 8443 | `https://<IP-server>:8443`  |

Se pot schimba prin variabilele de mediu `HTTP_PORT` / `HTTPS_PORT`.

## Ce conține
- `server.js` — aplicația (un singur fișier, 3 formulare: login POST, mesaj POST, căutare GET)
- `generate-cert.sh` — certificat self-signed pentru varianta HTTPS

