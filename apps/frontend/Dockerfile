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
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
