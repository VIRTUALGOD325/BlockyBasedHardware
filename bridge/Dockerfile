FROM node:18-bookworm-slim

WORKDIR /app

# Install native build tools for serialport
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm","start"]

EXPOSE 3000
