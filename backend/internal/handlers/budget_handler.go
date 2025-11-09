package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"splitsync-backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type BudgetHandler struct {
	db *mongo.Database
}

func NewBudgetHandler(db *mongo.Database) *BudgetHandler {
	return &BudgetHandler{db: db}
}

// getCoupleID retrieves the user's active couple ID if exists
func (h *BudgetHandler) getCoupleID(ctx context.Context, userObjectID primitive.ObjectID) (primitive.ObjectID, error) {
	couplesCollection := h.db.Collection("couples")
	var couple models.Couple
	err := couplesCollection.FindOne(ctx, bson.M{
		"$or": []bson.M{
			{"user1_id": userObjectID},
			{"user2_id": userObjectID},
		},
		"status": "active",
	}).Decode(&couple)

	if err == mongo.ErrNoDocuments {
		return primitive.NilObjectID, nil
	}
	if err != nil {
		return primitive.NilObjectID, err
	}

	return couple.ID, nil
}

// GetBudgets retrieves all budgets for a couple
func (h *BudgetHandler) GetBudgets(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	collection := h.db.Collection("budgets")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user's couple ID
	coupleID, err := h.getCoupleID(ctx, userObjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch couple information"})
		return
	}

	if coupleID.IsZero() {
		c.JSON(http.StatusOK, []models.BudgetResponse{})
		return
	}

	// Get current month/year
	now := time.Now()
	month := int(now.Month())
	year := now.Year()

	// Get month/year from query params if provided
	if monthParam := c.Query("month"); monthParam != "" {
		if m, err := strconv.Atoi(monthParam); err == nil && m >= 1 && m <= 12 {
			month = m
		}
	}
	if yearParam := c.Query("year"); yearParam != "" {
		if y, err := strconv.Atoi(yearParam); err == nil && y > 0 {
			year = y
		}
	}

	// Get budgets for the couple and month/year
	cursor, err := collection.Find(ctx, bson.M{
		"couple_id": coupleID,
		"month":     month,
		"year":      year,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch budgets"})
		return
	}
	defer cursor.Close(ctx)

	var budgets []models.Budget
	if err = cursor.All(ctx, &budgets); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode budgets"})
		return
	}

	// Get expenses for the month to calculate spending
	expensesCollection := h.db.Collection("expenses")
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Nanosecond)

	cursor, err = expensesCollection.Find(ctx, bson.M{
		"couple_id": coupleID,
		"created_at": bson.M{
			"$gte": startDate,
			"$lt":  endDate,
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expenses"})
		return
	}
	defer cursor.Close(ctx)

	var expenses []models.Expense
	if err = cursor.All(ctx, &expenses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode expenses"})
		return
	}

	// Calculate spending per category
	categorySpending := make(map[string]float64)
	for _, expense := range expenses {
		categorySpending[expense.Category] += expense.TotalAmount
	}

	// Build budget responses
	var budgetResponses []models.BudgetResponse
	for _, budget := range budgets {
		spent := categorySpending[budget.Category]
		remaining := budget.Amount - spent
		percentUsed := (spent / budget.Amount) * 100
		if budget.Amount == 0 {
			percentUsed = 0
		}
		alertPercent := budget.AlertPercent
		if alertPercent == 0 {
			alertPercent = 80 // Default
		}
		alertReached := percentUsed >= alertPercent

		budgetResponses = append(budgetResponses, models.BudgetResponse{
			Budget:       budget,
			Spent:        spent,
			Remaining:    remaining,
			PercentUsed:  percentUsed,
			AlertReached: alertReached,
		})
	}

	c.JSON(http.StatusOK, budgetResponses)
}

// CreateOrUpdateBudget creates or updates a budget
func (h *BudgetHandler) CreateOrUpdateBudget(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("budgets")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user's couple ID
	coupleID, err := h.getCoupleID(ctx, userObjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch couple information"})
		return
	}

	if coupleID.IsZero() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You must be in a couple to set budgets"})
		return
	}

	// Set default alert percent
	alertPercent := req.AlertPercent
	if alertPercent == 0 {
		alertPercent = 80
	}

	// Check if budget already exists
	filter := bson.M{
		"couple_id": coupleID,
		"category":  req.Category,
		"month":     req.Month,
		"year":      req.Year,
	}

	var existingBudget models.Budget
	err = collection.FindOne(ctx, filter).Decode(&existingBudget)

	if err == mongo.ErrNoDocuments {
		// Create new budget
		budget := models.Budget{
			CoupleID:     coupleID,
			Category:     req.Category,
			Amount:       req.Amount,
			Month:        req.Month,
			Year:         req.Year,
			AlertPercent: alertPercent,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		result, err := collection.InsertOne(ctx, budget)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create budget"})
			return
		}

		budget.ID = result.InsertedID.(primitive.ObjectID)
		c.JSON(http.StatusCreated, budget)
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing budget"})
		return
	}

	// Update existing budget
	update := bson.M{
		"$set": bson.M{
			"amount":        req.Amount,
			"alert_percent": alertPercent,
			"updated_at":    time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update budget"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Budget not found"})
		return
	}

	existingBudget.Amount = req.Amount
	existingBudget.AlertPercent = alertPercent
	existingBudget.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, existingBudget)
}

// DeleteBudget deletes a budget
func (h *BudgetHandler) DeleteBudget(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	budgetID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(budgetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid budget ID"})
		return
	}

	collection := h.db.Collection("budgets")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user's couple ID
	coupleID, err := h.getCoupleID(ctx, userObjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch couple information"})
		return
	}

	if coupleID.IsZero() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You must be in a couple"})
		return
	}

	// Delete budget if it belongs to the couple
	result, err := collection.DeleteOne(ctx, bson.M{
		"_id":       objectID,
		"couple_id": coupleID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete budget"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Budget not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Budget deleted successfully"})
}
