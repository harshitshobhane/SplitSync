package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"splitsync-backend/internal/models"
)

type TransferHandler struct {
	db *mongo.Database
}

func NewTransferHandler(db *mongo.Database) *TransferHandler {
	return &TransferHandler{db: db}
}

// GetTransfers retrieves all transfers for a user
func (h *TransferHandler) GetTransfers(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	collection := h.db.Collection("transfers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transfers"})
		return
	}
	defer cursor.Close(ctx)

	var transfers []models.Transfer
	if err = cursor.All(ctx, &transfers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode transfers"})
		return
	}

	c.JSON(http.StatusOK, transfers)
}

// CreateTransfer creates a new transfer
func (h *TransferHandler) CreateTransfer(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that fromUser and toUser are different
	if req.FromUser == req.ToUser {
		c.JSON(http.StatusBadRequest, gin.H{"error": "From user and to user cannot be the same"})
		return
	}

	// Convert userID to ObjectID
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	transfer := models.Transfer{
		UserID:      userObjectID,
		Amount:      req.Amount,
		FromUser:    req.FromUser,
		ToUser:      req.ToUser,
		Description: req.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	collection := h.db.Collection("transfers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := collection.InsertOne(ctx, transfer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transfer"})
		return
	}

	transfer.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, transfer)
}

// UpdateTransfer updates an existing transfer
func (h *TransferHandler) UpdateTransfer(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	transferID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(transferID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transfer ID"})
		return
	}

	var req models.CreateTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that fromUser and toUser are different
	if req.FromUser == req.ToUser {
		c.JSON(http.StatusBadRequest, gin.H{"error": "From user and to user cannot be the same"})
		return
	}

	collection := h.db.Collection("transfers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"amount":      req.Amount,
			"from_user":   req.FromUser,
			"to_user":     req.ToUser,
			"description": req.Description,
			"updated_at":  time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, bson.M{"_id": objectID, "user_id": userID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transfer"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transfer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transfer updated successfully"})
}

// DeleteTransfer deletes a transfer
func (h *TransferHandler) DeleteTransfer(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	transferID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(transferID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transfer ID"})
		return
	}

	collection := h.db.Collection("transfers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": objectID, "user_id": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transfer"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transfer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transfer deleted successfully"})
}
