package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"splitsync-backend/internal/models"
)

type SettingsHandler struct {
	db *mongo.Database
}

func NewSettingsHandler(db *mongo.Database) *SettingsHandler {
	return &SettingsHandler{db: db}
}

// GetSettings retrieves user settings
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	userID := c.GetString("user_id")
	fmt.Printf("DEBUG GetSettings - userID: %s\n", userID)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	collection := h.db.Collection("settings")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Convert userID string to ObjectID for proper query
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		// If conversion fails, try querying with string directly
		fmt.Printf("DEBUG: Could not convert userID to ObjectID: %v, using string: %s\n", err, userID)
	}

	var settings models.Settings
	// Try querying with ObjectID first, fallback to string
	filter := bson.M{"user_id": userObjectID}
	fmt.Printf("DEBUG - Trying filter with ObjectID: %v\n", filter)
	err = collection.FindOne(ctx, filter).Decode(&settings)
	if err == mongo.ErrNoDocuments {
		// Try with string if ObjectID didn't work
		filter = bson.M{"user_id": userID}
		fmt.Printf("DEBUG - Trying filter with string: %v\n", filter)
		err = collection.FindOne(ctx, filter).Decode(&settings)
	}
	if err != nil {
		if err == mongo.ErrNoDocuments {
			fmt.Printf("DEBUG - No documents found, returning defaults\n")
			// Return default settings if none exist
			defaultSettings := models.Settings{
				Person1Name:   "Person 1",
				Person2Name:   "Person 2",
				Theme:         "system",
				Currency:      "USD",
				Notifications: true,
			}
			c.JSON(http.StatusOK, defaultSettings)
			return
		}
		fmt.Printf("DEBUG - Error fetching settings: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}

	fmt.Printf("DEBUG - Found settings: %+v\n", settings)
	c.JSON(http.StatusOK, settings)
}

// UpdateSettings updates user settings
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.UpdateSettingsRequest
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

	collection := h.db.Collection("settings")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Build the update document using $setOnInsert for fields that should only be set on creation
	now := time.Now()

	update := bson.M{
		"$set": bson.M{
			"person1_name":  req.Person1Name,
			"person2_name":  req.Person2Name,
			"theme":         req.Theme,
			"currency":      req.Currency,
			"notifications": req.Notifications,
			"updated_at":    now,
		},
		"$setOnInsert": bson.M{
			"user_id":    userObjectID,
			"created_at": now,
		},
	}

	// Use upsert to either update or create in one operation
	// Try both ObjectID and string for user_id
	filter := bson.M{
		"$or": []bson.M{
			{"user_id": userObjectID},
			{"user_id": userID},
		},
	}

	_, err = collection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save settings"})
		return
	}

	// Return updated settings - try both ObjectID and string
	var updatedSettings models.Settings
	filter = bson.M{"user_id": userObjectID}
	err = collection.FindOne(ctx, filter).Decode(&updatedSettings)
	if err == mongo.ErrNoDocuments {
		filter = bson.M{"user_id": userID}
		err = collection.FindOne(ctx, filter).Decode(&updatedSettings)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated settings"})
		return
	}

	c.JSON(http.StatusOK, updatedSettings)
}
