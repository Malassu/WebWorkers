FROM node:15.3.0-alpine3.10
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . ./
RUN npm run dev

CMD ["npm", "run", "start"]

