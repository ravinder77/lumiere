FROM node:25-alpine3.22 AS deps

WORKDIR /app

COPY package*.json .

RUN npm ci


FROM deps AS build

WORKDIR /app

COPY . .

RUN npm run build

FROM nginx:1.29.8-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/default.conf.template

EXPOSE 3000

CMD ["/bin/sh", "-c", "export NGINX_RESOLVER=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf) BACKEND_HOST=${BACKEND_HOST:-backend-svc.lumiere.svc.cluster.local}; envsubst '$NGINX_RESOLVER $BACKEND_HOST' < /etc/nginx/default.conf.template > /etc/nginx/conf.d/default.conf; exec nginx -g 'daemon off;'"]
