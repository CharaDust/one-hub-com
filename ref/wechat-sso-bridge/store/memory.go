package store

import (
	"sync"
	"time"
)

const (
	CodeTTL  = 5 * time.Minute
	TokenTTL = 15 * time.Minute // QR expire 600s + buffer
)

type ScanResult struct {
	Status string // "pending" | "success" | "expired"
	Code   string
}

type ScanSession struct {
	Token       string
	Ticket      string
	RedirectURI string
	ExpireAt    time.Time
	Result      *ScanResult
	mu          sync.Mutex
}

type MemoryStore struct {
	mu         sync.RWMutex
	tokenSess  map[string]*ScanSession // token -> session
	ticketToToken map[string]string   // ticket -> token (for WeChat callback lookup)
	codeToOpenID map[string]codeEntry // code -> openid (one-time use)
}

type codeEntry struct {
	OpenID   string
	ExpireAt time.Time
}

var defaultStore = &MemoryStore{
	tokenSess:     make(map[string]*ScanSession),
	ticketToToken: make(map[string]string),
	codeToOpenID:  make(map[string]codeEntry),
}

func Default() *MemoryStore { return defaultStore }

func (s *MemoryStore) CreateSession(token, ticket, redirectURI string, expireAt time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tokenSess[token] = &ScanSession{
		Token:       token,
		Ticket:      ticket,
		RedirectURI: redirectURI,
		ExpireAt:    expireAt,
		Result:      &ScanResult{Status: "pending"},
	}
	s.ticketToToken[ticket] = token
}

func (s *MemoryStore) TokenByTicket(ticket string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	token, ok := s.ticketToToken[ticket]
	return token, ok
}

func (s *MemoryStore) TokenByScene(scene string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, ok := s.tokenSess[scene]
	return scene, ok
}

func (s *MemoryStore) GetSession(token string) (*ScanSession, bool) {
	s.mu.RLock()
	sess, ok := s.tokenSess[token]
	s.mu.RUnlock()
	if !ok || sess == nil {
		return nil, false
	}
	sess.mu.Lock()
	defer sess.mu.Unlock()
	if time.Now().After(sess.ExpireAt) {
		s.markExpired(token, sess)
		return sess, true // return with status expired
	}
	return sess, true
}

func (s *MemoryStore) MarkSuccess(token, code string) {
	s.mu.RLock()
	sess := s.tokenSess[token]
	s.mu.RUnlock()
	if sess == nil {
		return
	}
	sess.mu.Lock()
	defer sess.mu.Unlock()
	sess.Result = &ScanResult{Status: "success", Code: code}
}

func (s *MemoryStore) markExpired(token string, sess *ScanSession) {
	sess.Result = &ScanResult{Status: "expired"}
	s.mu.Lock()
	delete(s.ticketToToken, sess.Ticket)
	s.mu.Unlock()
}

func (s *MemoryStore) GetScanStatus(token string) (status string, code string) {
	sess, ok := s.GetSession(token)
	if !ok {
		return "expired", ""
	}
	if sess.Result == nil {
		return "pending", ""
	}
	if sess.Result.Status == "success" {
		return "success", sess.Result.Code
	}
	return sess.Result.Status, ""
}

func (s *MemoryStore) PutCode(code, openID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.codeToOpenID[code] = codeEntry{OpenID: openID, ExpireAt: time.Now().Add(CodeTTL)}
}

func (s *MemoryStore) GetAndConsumeCode(code string) (openID string, ok bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	ent, ok := s.codeToOpenID[code]
	if !ok {
		return "", false
	}
	delete(s.codeToOpenID, code)
	if time.Now().After(ent.ExpireAt) {
		return "", false
	}
	return ent.OpenID, true
}

func (s *MemoryStore) Cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	for token, sess := range s.tokenSess {
		if now.After(sess.ExpireAt) {
			delete(s.tokenSess, token)
			delete(s.ticketToToken, sess.Ticket)
		}
	}
	for c, ent := range s.codeToOpenID {
		if now.After(ent.ExpireAt) {
			delete(s.codeToOpenID, c)
		}
	}
}

func StartCleanup(store *MemoryStore, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			store.Cleanup()
		}
	}()
}
