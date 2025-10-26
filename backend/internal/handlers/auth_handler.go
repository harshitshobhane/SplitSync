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

type AuthHandler struct {
	db *mongo.Database
}

func NewAuthHandler(db *mongo.Database) *AuthHandler {
	return &AuthHandler{db: db}
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err := collection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to authenticate user"})
		return
	}

	// TODO: Implement password verification
	// For now, we'll just check if the user exists
	// In a real implementation, you would use bcrypt to verify the password

	// TODO: Generate JWT token
	// For now, we'll return a mock token
	token := "mock_jwt_token_" + user.ID.Hex()

	response := models.AuthResponse{
		Token: token,
		User:  user,
	}

	c.JSON(http.StatusOK, response)
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if user already exists
	var existingUser models.User
	err := collection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// TODO: Hash password using bcrypt
	// For now, we'll store the plain password (NOT RECOMMENDED FOR PRODUCTION)
	hashedPassword := req.Password

	user := models.User{
		Email:     req.Email,
		Password:  hashedPassword,
		Name:      req.Name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	result, err := collection.InsertOne(ctx, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	user.ID = result.InsertedID.(primitive.ObjectID)
	user.Password = "" // Don't return password

	// TODO: Generate JWT token
	token := "mock_jwt_token_" + user.ID.Hex()

	response := models.AuthResponse{
		Token: token,
		User:  user,
	}

	c.JSON(http.StatusCreated, response)
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// TODO: Implement token blacklisting or session invalidation
	// For now, we'll just return a success message
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
