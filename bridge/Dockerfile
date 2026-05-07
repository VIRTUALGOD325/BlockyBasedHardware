FROM node:20-bookworm-slim

WORKDIR /app

# Install native build tools for serialport + arduino-cli
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=/usr/local/bin sh

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=8765
EXPOSE 8765

CMD ["npm","start"]
