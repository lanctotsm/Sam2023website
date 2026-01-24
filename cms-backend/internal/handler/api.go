package handler

import (
	"net/http"
	"strings"

	"cms-backend/internal/auth"
	"cms-backend/internal/config"
	"cms-backend/internal/store"

	"github.com/go-chi/chi/v5"
)

type API struct {
	cfg    config.Config
	store  *store.Store
	oauth  *auth.OAuthClient
	s3     *auth.S3PresignClient
}

func NewAPI(cfg config.Config, store *store.Store, oauth *auth.OAuthClient, s3 *auth.S3PresignClient) *API {
	return &API{
		cfg:   cfg,
		store: store,
		oauth: oauth,
		s3:    s3,
	}
}

func (a *API) Routes() http.Handler {
	r := chi.NewRouter()
	r.Use(a.corsMiddleware)
	r.Get("/health", a.handleHealth)

	r.Route("/auth", func(r chi.Router) {
		r.Post("/login", a.handleLogin)
		r.Get("/callback", a.handleCallback)
		r.Post("/logout", a.handleLogout)
		r.Get("/status", a.requireAuth(a.handleStatus))
	})

	r.Route("/posts", func(r chi.Router) {
		r.Get("/", a.withOptionalAuth(a.handleListPosts))
		r.Post("/", a.requireAuth(a.handleCreatePost))
		r.Get("/slug/{slug}", a.withOptionalAuth(a.handleGetPostBySlug))
		r.Route("/{postID}", func(r chi.Router) {
			r.Get("/", a.withOptionalAuth(a.handleGetPost))
			r.Put("/", a.requireAuth(a.handleUpdatePost))
			r.Delete("/", a.requireAuth(a.handleDeletePost))
			r.Get("/albums", a.withOptionalAuth(a.handleListPostAlbums))
			r.Post("/albums", a.requireAuth(a.handleLinkPostAlbum))
		})
	})

	r.Route("/albums", func(r chi.Router) {
		r.Get("/", a.handleListAlbums)
		r.Post("/", a.requireAuth(a.handleCreateAlbum))
		r.Get("/slug/{slug}", a.handleGetAlbumBySlug)
		r.Route("/{albumID}", func(r chi.Router) {
			r.Get("/", a.handleGetAlbum)
			r.Put("/", a.requireAuth(a.handleUpdateAlbum))
			r.Delete("/", a.requireAuth(a.handleDeleteAlbum))
			r.Get("/images", a.handleListAlbumImages)
			r.Post("/images", a.requireAuth(a.handleLinkAlbumImage))
		})
	})

	r.Route("/images", func(r chi.Router) {
		r.Post("/presign", a.requireAuth(a.handlePresignImage))
		r.Get("/", a.requireAuth(a.handleListImages))
		r.Post("/", a.requireAuth(a.handleCreateImage))
		r.Route("/{imageID}", func(r chi.Router) {
			r.Get("/", a.requireAuth(a.handleGetImage))
			r.Put("/", a.requireAuth(a.handleUpdateImage))
			r.Delete("/", a.requireAuth(a.handleDeleteImage))
		})
	})

	return r
}

func (a *API) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && a.isAllowedOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *API) isAllowedOrigin(origin string) bool {
	if len(a.cfg.AllowedOrigins) == 0 {
		return true
	}
	for _, allowed := range a.cfg.AllowedOrigins {
		if strings.TrimSpace(allowed) == origin {
			return true
		}
	}
	return false
}

func (a *API) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
