#!/bin/bash

cleanup() {
  trap - SIGINT SIGTERM EXIT
  # Kill all processes in the current process group
  kill -- -$$
}

trap cleanup SIGINT SIGTERM EXIT

echo "Starting Bridge Server..."
(cd bridge && npm start) &

echo "Starting Eduprime-Link..."
(cd eduprime-link && npm start) &

echo "Starting Frontend..."
npm run dev

wait
