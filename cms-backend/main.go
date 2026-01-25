package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"cms-backend/internal/auth"
	"cms-backend/internal/config"
	"cms-backend/internal/db"
	"cms-backend/internal/handler"
	"cms-backend/internal/store"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	dbConn, err := db.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db open error: %v", err)
	}
	defer dbConn.Close()

	if err := db.RunMigrations(ctx, dbConn, "internal/db/migrations"); err != nil {
		log.Fatalf("migration error: %v", err)
	}

	stores := store.New(dbConn)

	// Seed base admin email if configured
	if cfg.BaseAdminEmail != "" {
		if err := stores.AllowedEmails.EnsureBaseAdmin(ctx, cfg.BaseAdminEmail); err != nil {
			log.Printf("warning: failed to seed base admin email: %v", err)
		} else {
			log.Printf("base admin email configured: %s", cfg.BaseAdminEmail)
		}
	}
	oauthClient := auth.NewOAuthClient(cfg)
	s3Client, err := auth.NewS3PresignClient(ctx, cfg)
	if err != nil {
		log.Fatalf("s3 client error: %v", err)
	}

	api := handler.NewAPI(cfg, stores, oauthClient, s3Client)
	server := &http.Server{
		Addr:              cfg.HTTPAddr(),
		Handler:           api.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("cms-backend listening on %s", cfg.HTTPAddr())
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("server shutdown error: %v", err)
	}
}
