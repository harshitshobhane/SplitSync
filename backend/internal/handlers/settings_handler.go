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
	"go.mongodb.org/mongo-driver/mongo/options"

	"splitsync-backend/internal/models"
)

type SettingsHandler struct {
	db *mongo.Database
}

func NewSettingsHandler(db *mongo.Database) *SettingsHandler {
	return &SettingsHandler{db: db}
}

// getCoupleID retrieves the user's active couple ID if exists
func (h *SettingsHandler) getCoupleID(ctx context.Context, userObjectID primitive.ObjectID) (primitive.ObjectID, error) {
	couplesCollection := h.db.Collection("couples")
	var couple models.Couple
	err := couplesCollection.FindOne(ctx, bson.M{
		"$and": []bson.M{
			{
				"$or": []bson.M{
					{"user1_id": userObjectID},
					{"user2_id": userObjectID},
				},
			},
			{"status": "active"},
		},
	}).Decode(&couple)

	if err == mongo.ErrNoDocuments {
		return primitive.NilObjectID, nil
	}
	if err != nil {
		return primitive.NilObjectID, err
	}

	return couple.ID, nil
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

	// Convert userID string to ObjectID for proper query
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		// If conversion fails, try querying with string directly
		fmt.Printf("DEBUG: Could not convert userID to ObjectID: %v, using string: %s\n", err, userID)
		var settings models.Settings
		filter := bson.M{"user_id": userID}
		err = collection.FindOne(ctx, filter).Decode(&settings)
		if err == mongo.ErrNoDocuments {
			// Return default settings if none exist
			defaultSettings := models.Settings{
				Theme:         "system",
				Currency:      "USD",
				Notifications: true,
			}
			c.JSON(http.StatusOK, defaultSettings)
			return
		}
		if err != nil {
			fmt.Printf("DEBUG - Error fetching settings: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
			return
		}
		c.JSON(http.StatusOK, settings)
		return
	}

	var settings models.Settings
	filter := bson.M{"user_id": userObjectID}
	err = collection.FindOne(ctx, filter).Decode(&settings)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Return default settings if none exist
			defaultSettings := models.Settings{
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
		fmt.Printf("DEBUG: BindJSON error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data", "details": err.Error()})
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

	// Validate and set defaults
	if req.Theme == "" {
		req.Theme = "system"
	}
	if req.Currency == "" {
		req.Currency = "USD"
	}

	// Get user's couple ID if exists (optional - doesn't fail if not found)
	coupleID, _ := h.getCoupleID(ctx, userObjectID)

	// Build the update document
	now := time.Now()

	// Build $set map explicitly to avoid any conflicts
	setMap := bson.M{
		"theme":         req.Theme,
		"currency":      req.Currency,
		"notifications": req.Notifications,
		"updated_at":    now,
	}

	// If user is in a couple, add couple_id to $set
	// Note: Only set in $set, not $setOnInsert, to avoid MongoDB conflict error
	if !coupleID.IsZero() {
		setMap["couple_id"] = coupleID
	}

	update := bson.M{
		"$set": setMap,
		"$setOnInsert": bson.M{
			"user_id":    userObjectID,
			"created_at": now,
		},
	}

	// Build filter
	filter := bson.M{"user_id": userObjectID}

	// Use upsert option
	opts := options.Update().SetUpsert(true)
	result, err := collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		fmt.Printf("DEBUG: UpdateOne error: %v\n", err)
		fmt.Printf("DEBUG: Filter: %+v\n", filter)
		fmt.Printf("DEBUG: Update: %+v\n", update)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save settings", "details": err.Error()})
		return
	}

	fmt.Printf("DEBUG: Update result - Matched: %d, Modified: %d, UpsertedID: %v\n", result.MatchedCount, result.ModifiedCount, result.UpsertedID)

	// Return updated settings
	var updatedSettings models.Settings
	fetchFilter := bson.M{"user_id": userObjectID}
	err = collection.FindOne(ctx, fetchFilter).Decode(&updatedSettings)
	if err != nil {
		// If document was just created (upsert), try finding by ID
		if result.UpsertedID != nil {
			fetchFilter = bson.M{"_id": result.UpsertedID}
			err = collection.FindOne(ctx, fetchFilter).Decode(&updatedSettings)
		}
		if err != nil {
			fmt.Printf("DEBUG: FindOne error: %v\n", err)
			// Return the saved data if we can't fetch it
			updatedSettings = models.Settings{
				UserID:        userObjectID,
				CoupleID:      coupleID,
				Theme:         req.Theme,
				Currency:      req.Currency,
				Notifications: req.Notifications,
				UpdatedAt:     now,
			}
		}
	}

	c.JSON(http.StatusOK, updatedSettings)
}
