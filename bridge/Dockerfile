FROM node:18-bookworm-slim

WORKDIR /app

# Install native build tools for serialport and curl for downloading arduino-cli
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

# Install arduino-cli
ENV ARDUINO_CLI_VERSION=1.4.1
RUN if [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ]; then \
      curl -fsSL https://github.com/arduino/arduino-cli/releases/download/v${ARDUINO_CLI_VERSION}/arduino-cli_${ARDUINO_CLI_VERSION}_Linux_ARM64.tar.gz | tar -xz -C /usr/local/bin arduino-cli; \
    else \
      curl -fsSL https://github.com/arduino/arduino-cli/releases/download/v${ARDUINO_CLI_VERSION}/arduino-cli_${ARDUINO_CLI_VERSION}_Linux_64bit.tar.gz | tar -xz -C /usr/local/bin arduino-cli; \
    fi

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm","start"]

EXPOSE 3000
