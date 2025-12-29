package handlers

import (
	"context"
	"net/http"
	"time"

	"splithalf-backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type TemplateHandler struct {
	db *mongo.Database
}

func NewTemplateHandler(db *mongo.Database) *TemplateHandler {
	return &TemplateHandler{db: db}
}

// getCoupleID retrieves the user's active couple ID if exists
func (h *TemplateHandler) getCoupleID(ctx context.Context, userObjectID primitive.ObjectID) (primitive.ObjectID, error) {
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

// GetTemplates retrieves all expense templates for a user/couple
func (h *TemplateHandler) GetTemplates(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	collection := h.db.Collection("expense_templates")
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

	// Build query: templates belonging to user OR couple
	query := bson.M{
		"$or": []bson.M{
			{"user_id": userObjectID},
			{"user_id": userID},
		},
	}

	// If user has a couple, include couple templates
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch templates"})
		return
	}
	defer cursor.Close(ctx)

	var templates []models.ExpenseTemplate
	if err = cursor.All(ctx, &templates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode templates"})
		return
	}

	c.JSON(http.StatusOK, templates)
}

// CreateTemplate creates a new expense template
func (h *TemplateHandler) CreateTemplate(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateExpenseTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("expense_templates")
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

	template := models.ExpenseTemplate{
		UserID:       userObjectID,
		CoupleID:     coupleID,
		Name:         req.Name,
		Description:  req.Description,
		TotalAmount:  req.TotalAmount,
		Category:     req.Category,
		PaidBy:       req.PaidBy,
		SplitType:    req.SplitType,
		Person1Share: req.Person1Share,
		Person2Share: req.Person2Share,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	result, err := collection.InsertOne(ctx, template)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template"})
		return
	}

	template.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, template)
}

// UpdateTemplate updates an existing expense template
func (h *TemplateHandler) UpdateTemplate(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	templateID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	var req models.CreateExpenseTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("expense_templates")
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

	// Build query: template must belong to user or couple
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
			"name":          req.Name,
			"description":   req.Description,
			"total_amount":  req.TotalAmount,
			"category":      req.Category,
			"paid_by":       req.PaidBy,
			"split_type":    req.SplitType,
			"person1_share": req.Person1Share,
			"person2_share": req.Person2Share,
			"updated_at":    time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, query, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update template"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template updated successfully"})
}

// DeleteTemplate deletes an expense template
func (h *TemplateHandler) DeleteTemplate(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	templateID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	collection := h.db.Collection("expense_templates")
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

	// Build query: template must belong to user or couple
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete template"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template deleted successfully"})
}
