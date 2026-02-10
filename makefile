NAME=one-api
DISTDIR=dist
WEBDIR=web
VERSION=$(shell git describe --tags || echo "dev")
GOBUILD=go build -ldflags "-s -w -X 'one-api/common/config.Version=$(VERSION)'"

all: one-api

web: $(WEBDIR)/build

$(WEBDIR)/build:
	cd $(WEBDIR) && yarn install && VITE_APP_VERSION=$(VERSION) yarn run build

one-api: web
	$(GOBUILD) -o $(DISTDIR)/$(NAME)

clean:
	rm -rf $(DISTDIR) && rm -rf $(WEBDIR)/build

# ---------- 开发调试（避免每次改代码都完整 Docker 构建 10+ 分钟）----------
# 推荐使用根目录脚本: ./run.sh up|down|deps|dev|web 等，详见 ./run.sh help
# 或 make: make dev-deps | make dev | make dev-web

.PHONY: dev dev-deps dev-web
dev-deps:
	docker-compose up -d

dev: $(WEBDIR)/build
	SQL_DSN="oneapi:123456@tcp(127.0.0.1:3306)/one-api" \
	REDIS_CONN_STRING="redis://127.0.0.1:6379" \
	SESSION_SECRET="aaaa1111bbbb2222cccc3333dddd5555" \
	USER_TOKEN_SECRET="aaaa1111bbbb2222cccc3333dddd4444" \
	air

dev-web:
	cd $(WEBDIR) && yarn run dev
