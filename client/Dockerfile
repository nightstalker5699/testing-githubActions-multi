from node:lts-alpine as builder

WORKDIR "/app"
COPY package.json .
RUN npm install
COPY . .
# Build the client
RUN npm run build

# Build the server
FROM nginx as server

COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
# Expose port 3000
EXPOSE 3000