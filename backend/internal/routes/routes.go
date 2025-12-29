package routes

import (
	"splithalf-backend/internal/handlers"
	"splithalf-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all application routes
func SetupRoutes(
	router *gin.Engine,
	authHandler *handlers.AuthHandler,
	expenseHandler *handlers.ExpenseHandler,
	transferHandler *handlers.TransferHandler,
	settingsHandler *handlers.SettingsHandler,
	reportHandler *handlers.ReportHandler,
	coupleHandler *handlers.CoupleHandler,
	budgetHandler *handlers.BudgetHandler,
	templateHandler *handlers.TemplateHandler,
) {
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "SplitHalf API is running"})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		setupAuthRoutes(v1, authHandler)
		setupProtectedAuthRoutes(v1, authHandler)
		setupProtectedRoutes(v1, expenseHandler, transferHandler, settingsHandler, reportHandler, coupleHandler, budgetHandler, templateHandler)
	}

	// Legacy API routes (for backward compatibility)
	api := router.Group("/api")
	{
		setupAuthRoutes(api, authHandler)
		setupProtectedAuthRoutes(api, authHandler)
		setupProtectedRoutes(api, expenseHandler, transferHandler, settingsHandler, reportHandler, coupleHandler, budgetHandler, templateHandler)
	}
}

// setupAuthRoutes configures authentication routes
func setupAuthRoutes(group *gin.RouterGroup, authHandler *handlers.AuthHandler) {
	auth := group.Group("/auth")
	{
		auth.POST("/verify", authHandler.VerifyFirebaseToken)
		auth.POST("/logout", authHandler.Logout)
	}
}

// setupProtectedAuthRoutes configures protected auth routes
func setupProtectedAuthRoutes(group *gin.RouterGroup, authHandler *handlers.AuthHandler) {
	protected := group.Group("/auth")
	protected.Use(middleware.Auth())
	{
		protected.GET("/me", authHandler.GetCurrentUser)
		protected.PUT("/upi", authHandler.UpdateUPI)
	}
}

// setupProtectedRoutes configures protected routes that require authentication
func setupProtectedRoutes(
	group *gin.RouterGroup,
	expenseHandler *handlers.ExpenseHandler,
	transferHandler *handlers.TransferHandler,
	settingsHandler *handlers.SettingsHandler,
	reportHandler *handlers.ReportHandler,
	coupleHandler *handlers.CoupleHandler,
	budgetHandler *handlers.BudgetHandler,
	templateHandler *handlers.TemplateHandler,
) {
	protected := group.Group("/")
	protected.Use(middleware.Auth())
	{
		// Couple routes
		couples := protected.Group("/couples")
		{
			couples.GET("", coupleHandler.GetCurrentCouple)
			couples.POST("/invite", coupleHandler.InvitePartner)
			couples.POST("/accept", coupleHandler.AcceptInvitation)
			couples.POST("/reject", coupleHandler.RejectInvitation)
			couples.POST("/disconnect", coupleHandler.DisconnectCouple)
		}

		// Expense routes
		expenses := protected.Group("/expenses")
		{
			expenses.GET("", expenseHandler.GetExpenses)
			expenses.POST("", expenseHandler.CreateExpense)
			expenses.PUT("/:id", expenseHandler.UpdateExpense)
			expenses.DELETE("/:id", expenseHandler.DeleteExpense)
			expenses.POST("/:id/comments", expenseHandler.AddComment)
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

		// Budget routes
		budgets := protected.Group("/budgets")
		{
			budgets.GET("", budgetHandler.GetBudgets)
			budgets.POST("", budgetHandler.CreateOrUpdateBudget)
			budgets.PUT("/:id", budgetHandler.CreateOrUpdateBudget)
			budgets.DELETE("/:id", budgetHandler.DeleteBudget)
		}

		// Expense Template routes
		templates := protected.Group("/templates")
		{
			templates.GET("", templateHandler.GetTemplates)
			templates.POST("", templateHandler.CreateTemplate)
			templates.PUT("/:id", templateHandler.UpdateTemplate)
			templates.DELETE("/:id", templateHandler.DeleteTemplate)
		}

	}
}
