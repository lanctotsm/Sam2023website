FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o cms-backend .

FROM alpine:3.19
RUN adduser -D cms
WORKDIR /app
COPY --from=builder /app/cms-backend /app/cms-backend
COPY internal/db/migrations /app/internal/db/migrations
USER cms
EXPOSE 8080
ENTRYPOINT ["/app/cms-backend"]
