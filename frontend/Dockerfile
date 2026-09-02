FROM nginx:alpine

COPY . /usr/share/nginx/html

# Версія env для образу: nginx роздає статику й проксує /api/, тому origin
# спільний і адресу бекенда вказувати не треба.
COPY js/env.docker.js /usr/share/nginx/html/js/env.js

# Шаблон конфіга — envsubst підставляє ${BACKEND_PORT} на старті контейнера.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
