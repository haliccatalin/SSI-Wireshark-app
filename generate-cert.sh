#!/usr/bin/env bash
# Generează un certificat self-signed pentru varianta HTTPS a demo-ului SSI.
# Rulează o singură dată: ./generate-cert.sh
set -e

mkdir -p certs

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -days 365 \
  -subj "/C=RO/ST=Arad/L=Arad/O=UAV-SSI-Lab/CN=localhost"

echo "Certificat self-signed generat in ./certs (key.pem + cert.pem)."
echo "Reporneste serverul (npm start) ca sa activezi HTTPS pe portul 8443."
