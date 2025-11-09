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

	// Check if there's a pending invitation for this user's email
	// This allows auto-acceptance when user signs up/login via invitation link
	invitationToken := c.GetHeader("X-Invitation-Token") // Token from URL/localStorage
	if invitationToken != "" {
		h.handleInvitationAutoAccept(ctx, user.ID, user.Email, invitationToken)
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

// handleInvitationAutoAccept automatically accepts an invitation when user signs up/logs in via invitation link
func (h *AuthHandler) handleInvitationAutoAccept(ctx context.Context, userID primitive.ObjectID, userEmail string, invitationToken string) {
	invitationsCollection := h.db.Collection("invitations")

	// Find invitation by token
	var invitation models.Invitation
	err := invitationsCollection.FindOne(ctx, bson.M{"token": invitationToken}).Decode(&invitation)
	if err != nil {
		// Invitation not found or already processed - silently ignore
		return
	}

	// Check if invitation is expired
	if time.Now().After(invitation.ExpiresAt) {
		invitationsCollection.UpdateOne(ctx, bson.M{"_id": invitation.ID}, bson.M{
			"$set": bson.M{"status": "expired", "updated_at": time.Now()},
		})
		return
	}

	// Check if invitation is for this user's email
	if invitation.InviteeEmail != userEmail {
		return // Not the right user
	}

	// Check if invitation is still pending
	if invitation.Status != "pending" {
		return // Already processed
	}

	// Check if user already has a couple
	couplesCollection := h.db.Collection("couples")
	var existingCouple models.Couple
	err = couplesCollection.FindOne(ctx, bson.M{
		"$or": []bson.M{
			{"user1_id": userID},
			{"user2_id": userID},
		},
		"status": "active",
	}).Decode(&existingCouple)

	if err == nil {
		// User already has a couple - don't auto-accept
		return
	}

	// Get the couple
	var couple models.Couple
	err = couplesCollection.FindOne(ctx, bson.M{"_id": invitation.CoupleID}).Decode(&couple)
	if err != nil {
		return
	}

	// Auto-accept: Update couple to active and set user2_id
	couple.User2ID = userID
	couple.Status = "active"
	couple.UpdatedAt = time.Now()

	couplesCollection.UpdateOne(ctx, bson.M{"_id": couple.ID}, bson.M{
		"$set": bson.M{
			"user2_id":   userID,
			"status":     "active",
			"updated_at": time.Now(),
		},
	})

	// Update invitation status to accepted
	invitationsCollection.UpdateOne(ctx, bson.M{"_id": invitation.ID}, bson.M{
		"$set": bson.M{"status": "accepted", "updated_at": time.Now()},
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

// UpdateUPI updates the user's UPI ID
func (h *AuthHandler) UpdateUPI(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.UpdateUPIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Basic UPI format validation
	// pattern: name@provider (allowing dots and dashes in name)
	valid := false
	if len(req.UPIID) >= 5 && len(req.UPIID) <= 100 {
		for i := 0; i < len(req.UPIID); i++ {
			if req.UPIID[i] == '@' {
				valid = true
				break
			}
		}
	}
	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UPI ID"})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := h.db.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = collection.UpdateOne(ctx, bson.M{"_id": objectID}, bson.M{
		"$set": bson.M{"upi_id": req.UPIID, "updated_at": time.Now()},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update UPI"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "upi_id": req.UPIID})
}
