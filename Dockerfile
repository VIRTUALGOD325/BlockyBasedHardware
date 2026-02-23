FROM node:20-alpine

WORKDIR /apps

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm","run","dev", "--", "--host", "0.0.0.0"]

EXPOSE 5173

