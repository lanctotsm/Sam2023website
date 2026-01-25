package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWriteJSON(t *testing.T) {
	w := httptest.NewRecorder()
	payload := map[string]string{"message": "test"}

	writeJSON(w, http.StatusOK, payload)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	contentType := w.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Fatalf("expected application/json, got %s", contentType)
	}

	var result map[string]string
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("decode json: %v", err)
	}
	if result["message"] != "test" {
		t.Fatalf("expected message 'test', got %s", result["message"])
	}
}

func TestWriteError(t *testing.T) {
	w := httptest.NewRecorder()

	writeError(w, http.StatusBadRequest, "invalid input")

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}

	var result map[string]string
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("decode json: %v", err)
	}
	if result["error"] != "invalid input" {
		t.Fatalf("expected error 'invalid input', got %s", result["error"])
	}
}

func TestReadJSON(t *testing.T) {
	payload := map[string]string{"name": "test"}
	body, _ := json.Marshal(payload)
	r := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/json")

	var result map[string]string
	if err := readJSON(r, &result); err != nil {
		t.Fatalf("read json: %v", err)
	}
	if result["name"] != "test" {
		t.Fatalf("expected name 'test', got %s", result["name"])
	}
}

func TestReadJSONInvalidJSON(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader([]byte("invalid json")))
	r.Header.Set("Content-Type", "application/json")

	var result map[string]string
	if err := readJSON(r, &result); err == nil {
		t.Fatal("expected error for invalid json")
	}
}

func TestParseID(t *testing.T) {
	id, err := parseID("123")
	if err != nil {
		t.Fatalf("parse id: %v", err)
	}
	if id != 123 {
		t.Fatalf("expected id 123, got %d", id)
	}
}

func TestParseIDEmpty(t *testing.T) {
	_, err := parseID("")
	if err == nil {
		t.Fatal("expected error for empty id")
	}
}

func TestParseIDInvalid(t *testing.T) {
	_, err := parseID("abc")
	if err == nil {
		t.Fatal("expected error for invalid id")
	}
}

func TestRandomToken(t *testing.T) {
	token, err := randomToken(16)
	if err != nil {
		t.Fatalf("random token: %v", err)
	}
	if len(token) == 0 {
		t.Fatal("expected non-empty token")
	}

	token2, err := randomToken(16)
	if err != nil {
		t.Fatalf("random token: %v", err)
	}
	if token == token2 {
		t.Fatal("expected different tokens")
	}
}
