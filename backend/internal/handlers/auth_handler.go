package handlers

import (
	"context"
	"net/http"
	"time"

	"splitsync-backend/internal/models"
	"splitsync-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	db *mongo.Database
}

// NewAuthHandler creates a new AuthHandler instance
func NewAuthHandler(db *mongo.Database) *AuthHandler {
	return &AuthHandler{db: db}
}

// VerifyFirebaseToken verifies a Firebase ID token and returns user data
func (h *AuthHandler) VerifyFirebaseToken(c *gin.Context) {
	var req models.FirebaseTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// TODO: Verify Firebase token with Firebase Admin SDK
	// For now, accepting the token as valid and storing user data

	collection := h.db.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if user exists by Firebase UID
	var user models.User
	err := collection.FindOne(ctx, bson.M{"firebase_uid": req.FirebaseUID}).Decode(&user)

	if err != nil && err == mongo.ErrNoDocuments {
		// User doesn't exist with this Firebase UID
		// Check if email already exists
		var existingUser models.User
		emailErr := collection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)

		if emailErr == nil && existingUser.Email == req.Email {
			// Email already exists - return error
			c.JSON(http.StatusBadRequest, gin.H{"error": "An account with this email already exists"})
			return
		}

		// Create new user
		user = models.User{
			Email:          req.Email,
			Name:           req.Name,
			AuthProvider:   req.AuthProvider,
			EmailVerified:  true, // Firebase handles verification
			ProfilePicture: req.ProfilePicture,
			FirebaseUID:    req.FirebaseUID,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		result, err := collection.InsertOne(ctx, user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		user.ID = result.InsertedID.(primitive.ObjectID)
	} else if err == nil {
		// User exists, update info
		update := bson.M{
			"$set": bson.M{
				"name":            req.Name,
				"profile_picture": req.ProfilePicture,
				"updated_at":      time.Now(),
			},
		}
		collection.UpdateOne(ctx, bson.M{"_id": user.ID}, update)
		user.Name = req.Name
		user.ProfilePicture = req.ProfilePicture
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// GetCurrentUser returns the current authenticated user
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	collection := h.db.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// Logout handles user logout requests
func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
