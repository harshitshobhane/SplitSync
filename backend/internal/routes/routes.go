package routes

import (
	"splitsync-backend/internal/handlers"
	"splitsync-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	authHandler *handlers.AuthHandler,
	expenseHandler *handlers.ExpenseHandler,
	transferHandler *handlers.TransferHandler,
	settingsHandler *handlers.SettingsHandler,
	reportHandler *handlers.ReportHandler,
) {
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "SplitSync API is running"})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes (no auth required)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/logout", authHandler.Logout)
		}

		// Protected routes (auth required)
		protected := v1.Group("/")
		protected.Use(middleware.Auth())
		{
			// Expense routes
			expenses := protected.Group("/expenses")
			{
				expenses.GET("", expenseHandler.GetExpenses)
				expenses.POST("", expenseHandler.CreateExpense)
				expenses.PUT("/:id", expenseHandler.UpdateExpense)
				expenses.DELETE("/:id", expenseHandler.DeleteExpense)
			}

			// Transfer routes
			transfers := protected.Group("/transfers")
			{
				transfers.GET("", transferHandler.GetTransfers)
				transfers.POST("", transferHandler.CreateTransfer)
				transfers.PUT("/:id", transferHandler.UpdateTransfer)
				transfers.DELETE("/:id", transferHandler.DeleteTransfer)
			}

			// Settings routes
			settings := protected.Group("/settings")
			{
				settings.GET("", settingsHandler.GetSettings)
				settings.PUT("", settingsHandler.UpdateSettings)
			}

			// Report routes
			reports := protected.Group("/reports")
			{
				reports.GET("/monthly/:year/:month", reportHandler.GetMonthlyReport)
				reports.GET("/categories/:year/:month", reportHandler.GetCategoryReport)
			}
		}
	}

	// Legacy API routes (for backward compatibility)
	api := router.Group("/api")
	{
		// Public routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/logout", authHandler.Logout)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.Auth())
		{
			// Expense routes
			expenses := protected.Group("/expenses")
			{
				expenses.GET("", expenseHandler.GetExpenses)
				expenses.POST("", expenseHandler.CreateExpense)
				expenses.PUT("/:id", expenseHandler.UpdateExpense)
				expenses.DELETE("/:id", expenseHandler.DeleteExpense)
			}

			// Transfer routes
			transfers := protected.Group("/transfers")
			{
				transfers.GET("", transferHandler.GetTransfers)
				transfers.POST("", transferHandler.CreateTransfer)
				transfers.PUT("/:id", transferHandler.UpdateTransfer)
				transfers.DELETE("/:id", transferHandler.DeleteTransfer)
			}

			// Settings routes
			settings := protected.Group("/settings")
			{
				settings.GET("", settingsHandler.GetSettings)
				settings.PUT("", settingsHandler.UpdateSettings)
			}

			// Report routes
			reports := protected.Group("/reports")
			{
				reports.GET("/monthly/:year/:month", reportHandler.GetMonthlyReport)
				reports.GET("/categories/:year/:month", reportHandler.GetCategoryReport)
			}
		}
	}
}
