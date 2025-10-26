package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

func main() {
	// CORS middleware
	corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			
			next(w, r)
		}
	}

	// Health check endpoint
	http.HandleFunc("/health", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"message": "SplitSync API is running",
		})
	}))

	// Mock expenses endpoint
	http.HandleFunc("/api/expenses", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		mockExpenses := []map[string]interface{}{
			{
				"id":            "1",
				"description":   "Grocery shopping",
				"totalAmount":   85.50,
				"category":      "groceries",
				"paidBy":        "person1",
				"person1Share":  42.75,
				"person2Share":  42.75,
				"timestamp":     map[string]int64{"seconds": 1699123456},
			},
			{
				"id":            "2",
				"description":   "Dinner date",
				"totalAmount":   120.00,
				"category":      "dating",
				"paidBy":        "person2",
				"person1Share":  60.00,
				"person2Share":  60.00,
				"timestamp":     map[string]int64{"seconds": 1699037056},
			},
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"expenses": mockExpenses,
		})
	}))

	// Mock transfers endpoint
	http.HandleFunc("/api/transfers", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		mockTransfers := []map[string]interface{}{
			{
				"id":          "1",
				"amount":      25.00,
				"fromUser":    "person1",
				"toUser":      "person2",
				"description": "Settled up",
				"timestamp":   map[string]int64{"seconds": 1698950656},
			},
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"transfers": mockTransfers,
		})
	}))

	// Mock settings endpoint
	http.HandleFunc("/api/settings", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"person1Name": "Alex",
			"person2Name": "Sam",
			"theme":       "system",
		})
	}))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
