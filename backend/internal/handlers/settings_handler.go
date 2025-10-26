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

type SettingsHandler struct {
	db *mongo.Database
}

func NewSettingsHandler(db *mongo.Database) *SettingsHandler {
	return &SettingsHandler{db: db}
}

// GetSettings retrieves user settings
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	collection := h.db.Collection("settings")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var settings models.Settings
	err := collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&settings)
	if err != nil {
		if err == mongo.ErrNoDocuments {
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}

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

	// Check if settings exist
	var existingSettings models.Settings
	err = collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&existingSettings)
	
	if err == mongo.ErrNoDocuments {
		// Create new settings
		settings := models.Settings{
			UserID:        userObjectID,
			Person1Name:   req.Person1Name,
			Person2Name:   req.Person2Name,
			Theme:         req.Theme,
			Currency:      req.Currency,
			Notifications: req.Notifications,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		_, err = collection.InsertOne(ctx, settings)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create settings"})
			return
		}

		c.JSON(http.StatusCreated, settings)
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch existing settings"})
		return
	}

	// Update existing settings
	update := bson.M{
		"$set": bson.M{
			"person1_name":   req.Person1Name,
			"person2_name":   req.Person2Name,
			"theme":          req.Theme,
			"currency":       req.Currency,
			"notifications":  req.Notifications,
			"updated_at":     time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, bson.M{"user_id": userID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Settings not found"})
		return
	}

	// Return updated settings
	var updatedSettings models.Settings
	err = collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&updatedSettings)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated settings"})
		return
	}

	c.JSON(http.StatusOK, updatedSettings)
}
