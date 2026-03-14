FROM golang:1.21-alpine AS builder
WORKDIR /build
COPY go.mod ./
COPY . .
RUN go mod tidy && CGO_ENABLED=0 go build -ldflags "-s -w" -o wechat-sso-bridge .

FROM alpine:3.18
ENV PORT=3000
EXPOSE 3000
WORKDIR /app
COPY --from=builder /build/wechat-sso-bridge .
ENTRYPOINT ["./wechat-sso-bridge"]
