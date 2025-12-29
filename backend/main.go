package main

import (
	"log"
	"os"
	"strings"

	"splithalf-backend/internal/config"
	"splithalf-backend/internal/database"
	"splithalf-backend/internal/handlers"
	"splithalf-backend/internal/middleware"
	"splithalf-backend/internal/routes"
	"splithalf-backend/internal/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load and validate configuration
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatal("Configuration validation failed:", err)
	}

	// Initialize JWT secret
	utils.SetJWTSecret(cfg.JWTSecret)

	// Debug: Log the MongoDB URI (masked for security)
	uriForLog := cfg.MongoURI
	if len(uriForLog) > 50 {
		uriForLog = uriForLog[:50] + "..."
	}
	log.Printf("Attempting to connect to MongoDB: %s", uriForLog)
	log.Println("Important: Make sure your IP is whitelisted in MongoDB Atlas Network Access!")

	// Initialize database connection
	db, err := database.Connect(cfg.MongoURI)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Disconnect()

	// Initialize Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Configure CORS
	allowedOrigins := []string{"http://localhost:3000", "http://localhost:3001"}
	if cfg.Environment == "production" {
		// Get allowed origins from environment variable (comma-separated)
		if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
			for _, origin := range strings.Split(origins, ",") {
				allowedOrigins = append(allowedOrigins, strings.TrimSpace(origin))
			}
		}
	}

	corsConfig := cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Invitation-Token"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	router.Use(cors.New(corsConfig))

	// Apply middleware
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())
	router.Use(middleware.RateLimit())
	router.Use(middleware.SecurityHeaders())

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db)
	expenseHandler := handlers.NewExpenseHandler(db)
	transferHandler := handlers.NewTransferHandler(db)
	settingsHandler := handlers.NewSettingsHandler(db)
	reportHandler := handlers.NewReportHandler(db)
	coupleHandler := handlers.NewCoupleHandler(db)
	budgetHandler := handlers.NewBudgetHandler(db)
	templateHandler := handlers.NewTemplateHandler(db)

	// Setup routes
	routes.SetupRoutes(router, authHandler, expenseHandler, transferHandler, settingsHandler, reportHandler, coupleHandler, budgetHandler, templateHandler)

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s in %s mode", port, cfg.Environment)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
