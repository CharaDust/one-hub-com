FROM node:22.20 AS builder

WORKDIR /build

COPY web/package.json .
COPY web/yarn.lock .

# 使用 yarn install 以允许安装 package.json 中的 vite ^6（避免 Vite 7 build-html 解析 /assets/ 的 bug）
RUN yarn install

COPY ./web .
COPY ./VERSION .
# 强制安装 Vite 6：yarn.lock 锁定 7.x 会导致 build-html 解析 /assets/ 失败
RUN yarn add vite@6
# 删除可能被 COPY ./web 带入的本地 build/dist，否则 Vite 会处理旧 index.html 并报错
RUN rm -rf build dist
RUN DISABLE_ESLINT_PLUGIN='true' VITE_APP_VERSION=$(cat VERSION) npx vite build --base=./ && mv dist build

FROM golang:1.25.0 AS builder2

ENV GO111MODULE=on \
    CGO_ENABLED=1 \
    GOOS=linux

WORKDIR /build
ADD go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=builder /build/build ./web/build
RUN go build -ldflags "-s -w -X 'one-api/common/config.Version=$(cat VERSION)' -extldflags '-static'" -o one-api

FROM alpine

RUN apk update \
    && apk upgrade \
    && apk add --no-cache ca-certificates tzdata \
    && update-ca-certificates 2>/dev/null || true

COPY --from=builder2 /build/one-api /
EXPOSE 3000
WORKDIR /data
ENTRYPOINT ["/one-api"]
