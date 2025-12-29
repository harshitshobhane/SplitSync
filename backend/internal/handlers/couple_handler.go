package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"splithalf-backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CoupleHandler struct {
	db *mongo.Database
}

func NewCoupleHandler(db *mongo.Database) *CoupleHandler {
	return &CoupleHandler{db: db}
}

// GetCurrentCouple retrieves the current user's couple information
func (h *CoupleHandler) GetCurrentCouple(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := h.db.Collection("couples")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find couple where user is either user1 or user2
	var couple models.Couple
	err = collection.FindOne(ctx, bson.M{
		"$or": []bson.M{
			{"user1_id": userObjectID},
			{"user2_id": userObjectID},
		},
		"status": "active",
	}).Decode(&couple)

	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusOK, gin.H{
			"couple":  nil,
			"message": "No active couple found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch couple information"})
		return
	}

	// Get partner information
	var partner models.User
	partnerID := couple.User1ID
	if couple.User1ID == userObjectID {
		partnerID = couple.User2ID
	}

	usersCollection := h.db.Collection("users")
	if !partnerID.IsZero() {
		err = usersCollection.FindOne(ctx, bson.M{"_id": partnerID}).Decode(&partner)
		// Partner might not exist if invitation is pending; handle other errors
		if err != nil && err != mongo.ErrNoDocuments {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch partner"})
			return
		}
	}

	// Get pending invitation if exists
	invitationsCollection := h.db.Collection("invitations")
	var invitation models.Invitation
	invitationsCollection.FindOne(ctx, bson.M{
		"couple_id": couple.ID,
		"status":    "pending",
	}).Decode(&invitation)

	response := models.CoupleResponse{
		Couple:     couple,
		Partner:    partner,
		Invitation: &invitation,
	}

	c.JSON(http.StatusOK, response)
}

// InvitePartner sends an invitation to a partner
func (h *CoupleHandler) InvitePartner(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateCoupleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if user already has an active couple
	couplesCollection := h.db.Collection("couples")
	var existingCouple models.Couple
	err = couplesCollection.FindOne(ctx, bson.M{
		"$or": []bson.M{
			{"user1_id": userObjectID},
			{"user2_id": userObjectID},
		},
		"status": "active",
	}).Decode(&existingCouple)

	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have an active couple. Please disconnect first."})
		return
	}

	// Check if invitee email exists
	usersCollection := h.db.Collection("users")
	var inviteeUser models.User
	err = usersCollection.FindOne(ctx, bson.M{"email": req.InviteeEmail}).Decode(&inviteeUser)

	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusNotFound, gin.H{"error": "User with this email not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user"})
		return
	}

	// Check if invitee already has a couple
	err = couplesCollection.FindOne(ctx, bson.M{
		"$or": []bson.M{
			{"user1_id": inviteeUser.ID},
			{"user2_id": inviteeUser.ID},
		},
		"status": "active",
	}).Decode(&existingCouple)

	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This user already has an active couple"})
		return
	}

	// Don't allow inviting yourself
	if inviteeUser.ID == userObjectID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot invite yourself"})
		return
	}

	// Create couple with pending status (user2_id will be set on acceptance)
	couple := models.Couple{
		User1ID:   userObjectID,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	coupleResult, err := couplesCollection.InsertOne(ctx, couple)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create couple"})
		return
	}

	couple.ID = coupleResult.InsertedID.(primitive.ObjectID)

	// Generate unique invitation token
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	// Create invitation
	invitation := models.Invitation{
		CoupleID:     couple.ID,
		InviterID:    userObjectID,
		InviteeEmail: req.InviteeEmail,
		Token:        token,
		ExpiresAt:    time.Now().Add(7 * 24 * time.Hour), // 7 days expiry
		Status:       "pending",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	invitationsCollection := h.db.Collection("invitations")
	_, err = invitationsCollection.InsertOne(ctx, invitation)
	if err != nil {
		// Rollback: delete couple if invitation creation fails
		couplesCollection.DeleteOne(ctx, bson.M{"_id": couple.ID})
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invitation"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Invitation sent successfully",
		"invitation": invitation,
		"couple_id":  couple.ID,
	})
}

// AcceptInvitation accepts a partner invitation
func (h *CoupleHandler) AcceptInvitation(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.AcceptInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find invitation by token
	invitationsCollection := h.db.Collection("invitations")
	var invitation models.Invitation
	err = invitationsCollection.FindOne(ctx, bson.M{"token": req.Token}).Decode(&invitation)

	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find invitation"})
		return
	}

	// Check if invitation is expired
	if time.Now().After(invitation.ExpiresAt) {
		// Update invitation status to expired
		invitationsCollection.UpdateOne(ctx, bson.M{"_id": invitation.ID}, bson.M{
			"$set": bson.M{"status": "expired", "updated_at": time.Now()},
		})
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation has expired"})
		return
	}

	// Check if invitation is already accepted/rejected
	if invitation.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation is no longer valid"})
		return
	}

	// Verify that the accepting user's email matches invitee email
	usersCollection := h.db.Collection("users")
	var currentUser models.User
	err = usersCollection.FindOne(ctx, bson.M{"_id": userObjectID}).Decode(&currentUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	if currentUser.Email != invitation.InviteeEmail {
		c.JSON(http.StatusForbidden, gin.H{"error": "This invitation is not for you"})
		return
	}

	// Check if user already has a couple
	couplesCollection := h.db.Collection("couples")
	var existingCouple models.Couple
	err = couplesCollection.FindOne(ctx, bson.M{
		"$or": []bson.M{
			{"user1_id": userObjectID},
			{"user2_id": userObjectID},
		},
		"status": "active",
	}).Decode(&existingCouple)

	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have an active couple"})
		return
	}

	// Get the couple
	var couple models.Couple
	err = couplesCollection.FindOne(ctx, bson.M{"_id": invitation.CoupleID}).Decode(&couple)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find couple"})
		return
	}

	// Update couple to active and set user2_id
	couple.User2ID = userObjectID
	couple.Status = "active"
	couple.UpdatedAt = time.Now()

	_, err = couplesCollection.UpdateOne(ctx, bson.M{"_id": couple.ID}, bson.M{
		"$set": bson.M{
			"user2_id":   userObjectID,
			"status":     "active",
			"updated_at": time.Now(),
		},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate couple"})
		return
	}

	// Update invitation status to accepted
	invitationsCollection.UpdateOne(ctx, bson.M{"_id": invitation.ID}, bson.M{
		"$set": bson.M{"status": "accepted", "updated_at": time.Now()},
	})

	// Get partner information (the inviter)
	var partner models.User
	err = usersCollection.FindOne(ctx, bson.M{"_id": couple.User1ID}).Decode(&partner)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch partner"})
		return
	}

	// Auto-update settings for both users - set couple_id
	h.autoUpdateSettingsForCouple(ctx, couple.User1ID, userObjectID, couple.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Invitation accepted successfully",
		"couple":  couple,
		"partner": partner,
	})
}

// RejectInvitation rejects a partner invitation
func (h *CoupleHandler) RejectInvitation(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.AcceptInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find and verify invitation
	invitationsCollection := h.db.Collection("invitations")
	var invitation models.Invitation
	err = invitationsCollection.FindOne(ctx, bson.M{"token": req.Token}).Decode(&invitation)

	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

	// Verify user email matches
	usersCollection := h.db.Collection("users")
	var currentUser models.User
	usersCollection.FindOne(ctx, bson.M{"_id": userObjectID}).Decode(&currentUser)

	if currentUser.Email != invitation.InviteeEmail {
		c.JSON(http.StatusForbidden, gin.H{"error": "This invitation is not for you"})
		return
	}

	// Update invitation status to rejected
	invitationsCollection.UpdateOne(ctx, bson.M{"_id": invitation.ID}, bson.M{
		"$set": bson.M{"status": "rejected", "updated_at": time.Now()},
	})

	// Delete the couple
	couplesCollection := h.db.Collection("couples")
	couplesCollection.DeleteOne(ctx, bson.M{"_id": invitation.CoupleID})

	c.JSON(http.StatusOK, gin.H{"message": "Invitation rejected"})
}

// DisconnectCouple disconnects from the current couple
func (h *CoupleHandler) DisconnectCouple(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find and deactivate couple
	couplesCollection := h.db.Collection("couples")
	result, err := couplesCollection.UpdateOne(ctx, bson.M{
		"$or": []bson.M{
			{"user1_id": userObjectID},
			{"user2_id": userObjectID},
		},
		"status": "active",
	}, bson.M{
		"$set": bson.M{
			"status":     "inactive",
			"updated_at": time.Now(),
		},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disconnect"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active couple found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Disconnected from couple successfully"})
}

// autoUpdateSettingsForCouple automatically updates settings for both users when couple connects
// Only sets couple_id - names come from user/couple data directly
func (h *CoupleHandler) autoUpdateSettingsForCouple(ctx context.Context, user1ID, user2ID, coupleID primitive.ObjectID) {
	settingsCollection := h.db.Collection("settings")
	now := time.Now()

	// Update settings for user1 - just set couple_id
	filter1 := bson.M{"user_id": user1ID}
	update1 := bson.M{
		"$set": bson.M{
			"couple_id":  coupleID,
			"updated_at": now,
		},
		"$setOnInsert": bson.M{
			"created_at":    now,
			"theme":         "system",
			"currency":      "USD",
			"notifications": true,
		},
	}
	settingsCollection.UpdateOne(ctx, filter1, update1, options.Update().SetUpsert(true))

	// Update settings for user2 - just set couple_id
	filter2 := bson.M{"user_id": user2ID}
	update2 := bson.M{
		"$set": bson.M{
			"couple_id":  coupleID,
			"updated_at": now,
		},
		"$setOnInsert": bson.M{
			"created_at":    now,
			"theme":         "system",
			"currency":      "USD",
			"notifications": true,
		},
	}
	settingsCollection.UpdateOne(ctx, filter2, update2, options.Update().SetUpsert(true))
}
