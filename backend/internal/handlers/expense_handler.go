package handlers

import (
	"context"
	"net/http"
	"time"

	"splitsync-backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ExpenseHandler struct {
	db *mongo.Database
}

func NewExpenseHandler(db *mongo.Database) *ExpenseHandler {
	return &ExpenseHandler{db: db}
}

// getCoupleID retrieves the user's active couple ID if exists
func (h *ExpenseHandler) getCoupleID(ctx context.Context, userObjectID primitive.ObjectID) (primitive.ObjectID, error) {
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

// GetExpenses retrieves all expenses for a user (including couple expenses)
func (h *ExpenseHandler) GetExpenses(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	collection := h.db.Collection("expenses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Convert userID to ObjectID for querying
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		// If conversion fails, try querying with string
		cursor, err := collection.Find(ctx, bson.M{"user_id": userID})
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
		c.JSON(http.StatusOK, expenses)
		return
	}

	// Get user's couple ID if exists
	coupleID, err := h.getCoupleID(ctx, userObjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch couple information"})
		return
	}

	// Build query: expenses belonging to user OR couple
	query := bson.M{
		"$or": []bson.M{
			{"user_id": userObjectID},
			{"user_id": userID},
		},
	}

	// If user has a couple, include couple expenses
	if !coupleID.IsZero() {
		query = bson.M{
			"$or": []bson.M{
				{"user_id": userObjectID},
				{"user_id": userID},
				{"couple_id": coupleID},
			},
		}
	}

	cursor, err := collection.Find(ctx, query)
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

	c.JSON(http.StatusOK, expenses)
}

// CreateExpense creates a new expense
func (h *ExpenseHandler) CreateExpense(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert userID to ObjectID
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := h.db.Collection("expenses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user's couple ID if exists
	coupleID, err := h.getCoupleID(ctx, userObjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch couple information"})
		return
	}

	expense := models.Expense{
		UserID:       userObjectID,
		CoupleID:     coupleID,
		Description:  req.Description,
		TotalAmount:  req.TotalAmount,
		Category:     req.Category,
		PaidBy:       req.PaidBy,
		SplitType:    req.SplitType,
		Person1Share: req.Person1Share,
		Person2Share: req.Person2Share,
		Notes:        req.Notes,
		Comments:     []models.Comment{},
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	result, err := collection.InsertOne(ctx, expense)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create expense"})
		return
	}

	expense.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, expense)
}

// UpdateExpense updates an existing expense
func (h *ExpenseHandler) UpdateExpense(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	expenseID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(expenseID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expense ID"})
		return
	}

	var req models.CreateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("expenses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user's couple ID
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	coupleID, err := h.getCoupleID(ctx, userObjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch couple information"})
		return
	}

	// Build query: expense must belong to user or couple
	query := bson.M{
		"_id": objectID,
		"$or": []bson.M{
			{"user_id": userObjectID},
			{"user_id": userID},
		},
	}

	if !coupleID.IsZero() {
		query = bson.M{
			"_id": objectID,
			"$or": []bson.M{
				{"user_id": userObjectID},
				{"user_id": userID},
				{"couple_id": coupleID},
			},
		}
	}

	update := bson.M{
		"$set": bson.M{
			"description":   req.Description,
			"total_amount":  req.TotalAmount,
			"category":      req.Category,
			"paid_by":       req.PaidBy,
			"split_type":    req.SplitType,
			"person1_share": req.Person1Share,
			"person2_share": req.Person2Share,
			"notes":         req.Notes,
			"updated_at":    time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, query, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update expense"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Expense updated successfully"})
}

// DeleteExpense deletes an expense
func (h *ExpenseHandler) DeleteExpense(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	expenseID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(expenseID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expense ID"})
		return
	}

	collection := h.db.Collection("expenses")
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

	// Build query: expense must belong to user or couple
	query := bson.M{
		"_id": objectID,
		"$or": []bson.M{
			{"user_id": userObjectID},
			{"user_id": userID},
		},
	}

	if !coupleID.IsZero() {
		query = bson.M{
			"_id": objectID,
			"$or": []bson.M{
				{"user_id": userObjectID},
				{"user_id": userID},
				{"couple_id": coupleID},
			},
		}
	}

	result, err := collection.DeleteOne(ctx, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete expense"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Expense deleted successfully"})
}

// AddComment adds a comment to an expense
func (h *ExpenseHandler) AddComment(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	expenseID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(expenseID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expense ID"})
		return
	}

	var req models.AddCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("expenses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user info
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	usersCollection := h.db.Collection("users")
	var user models.User
	if err := usersCollection.FindOne(ctx, bson.M{"_id": userObjectID}).Decode(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// Get user's couple ID
	coupleID, err := h.getCoupleID(ctx, userObjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch couple information"})
		return
	}

	// Build query: expense must belong to user or couple
	query := bson.M{
		"_id": objectID,
		"$or": []bson.M{
			{"user_id": userObjectID},
			{"user_id": userID},
		},
	}

	if !coupleID.IsZero() {
		query = bson.M{
			"_id": objectID,
			"$or": []bson.M{
				{"user_id": userObjectID},
				{"user_id": userID},
				{"couple_id": coupleID},
			},
		}
	}

	// Create comment
	comment := models.Comment{
		ID:        primitive.NewObjectID(),
		UserID:    userObjectID,
		UserName:  user.Name,
		Content:   req.Content,
		CreatedAt: time.Now(),
	}

	// Add comment to expense
	update := bson.M{
		"$push": bson.M{
			"comments": comment,
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, query, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
		return
	}

	c.JSON(http.StatusOK, comment)
}
