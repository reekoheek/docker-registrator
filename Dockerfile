FROM node:slim

ENV NPM_PROXY http://192.168.1.10:3128
ENV NPM_REGISTRY http://registry.npmjs.org/

COPY . /opt/registrator

WORKDIR /opt/registrator

RUN \
  npm config set proxy "$NPM_PROXY" 2> /dev/null && \
  npm config set registry "$NPM_REGISTRY" 2> /dev/null && \
  rm -rf node_modules/ && \
  npm install 2> /dev/null

CMD ["node", "app.js", "-c", "config/config.yml"]