#!/bin/bash

# Build and link prodash-tools
cd ../../
npm install
npm run build
npm link

# Install dependencies and link prodash-tools
cd templates/api-project
npm install
npm link prodash-tools 