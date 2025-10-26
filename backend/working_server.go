package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Gin router
	router := gin.Default()

	// CORS configuration
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	router.Use(cors.New(corsConfig))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "SplitSync API is running"})
	})

	// Mock API endpoints for testing
	router.GET("/api/expenses", func(c *gin.Context) {
		mockExpenses := []gin.H{
			{
				"id": "1",
				"description": "Grocery shopping",
				"totalAmount": 85.50,
				"category": "groceries",
				"paidBy": "person1",
				"person1Share": 42.75,
				"person2Share": 42.75,
				"timestamp": gin.H{"seconds": 1699123456},
			},
			{
				"id": "2", 
				"description": "Dinner date",
				"totalAmount": 120.00,
				"category": "dating",
				"paidBy": "person2",
				"person1Share": 60.00,
				"person2Share": 60.00,
				"timestamp": gin.H{"seconds": 1699037056},
			},
		}
		c.JSON(200, gin.H{"expenses": mockExpenses})
	})

	router.GET("/api/transfers", func(c *gin.Context) {
		mockTransfers := []gin.H{
			{
				"id": "1",
				"amount": 25.00,
				"fromUser": "person1",
				"toUser": "person2",
				"description": "Settled up",
				"timestamp": gin.H{"seconds": 1698950656},
			},
		}
		c.JSON(200, gin.H{"transfers": mockTransfers})
	})

	router.GET("/api/settings", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"person1Name": "Alex",
			"person2Name": "Sam",
			"theme": "system",
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
