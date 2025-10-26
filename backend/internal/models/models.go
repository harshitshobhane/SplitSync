package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a user in the system
type User struct {
	ID              primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Email           string             `json:"email" bson:"email"`
	Name            string             `json:"name" bson:"name"`
	AuthProvider    string             `json:"auth_provider" bson:"auth_provider"`     // "firebase", "google"
	EmailVerified   bool               `json:"email_verified" bson:"email_verified"`
	ProfilePicture  string             `json:"profile_picture" bson:"profile_picture"`
	FirebaseUID     string             `json:"firebase_uid" bson:"firebase_uid"`
	CreatedAt       time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at" bson:"updated_at"`
}

// Expense represents an expense entry
type Expense struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID       primitive.ObjectID `json:"user_id" bson:"user_id"`
	Description  string             `json:"description" bson:"description"`
	TotalAmount  float64            `json:"total_amount" bson:"total_amount"`
	Category     string             `json:"category" bson:"category"`
	PaidBy       string             `json:"paid_by" bson:"paid_by"` // "person1" or "person2"
	SplitType    string             `json:"split_type" bson:"split_type"` // "equal", "ratio", "exact"
	Person1Share float64            `json:"person1_share" bson:"person1_share"`
	Person2Share float64            `json:"person2_share" bson:"person2_share"`
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}

// Transfer represents a money transfer between users
type Transfer struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID      primitive.ObjectID `json:"user_id" bson:"user_id"`
	Amount      float64            `json:"amount" bson:"amount"`
	FromUser    string             `json:"from_user" bson:"from_user"` // "person1" or "person2"
	ToUser      string             `json:"to_user" bson:"to_user"`     // "person1" or "person2"
	Description string             `json:"description" bson:"description"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}

// Settings represents user settings
type Settings struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID       primitive.ObjectID `json:"user_id" bson:"user_id"`
	Person1Name  string             `json:"person1_name" bson:"person1_name"`
	Person2Name  string             `json:"person2_name" bson:"person2_name"`
	Theme        string             `json:"theme" bson:"theme"`
	Currency     string             `json:"currency" bson:"currency"`
	Notifications bool              `json:"notifications" bson:"notifications"`
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}

// Notification represents a notification
type Notification struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
	Type      string             `json:"type" bson:"type"` // "expense", "transfer", "settlement"
	Title     string             `json:"title" bson:"title"`
	Message   string             `json:"message" bson:"message"`
	Read      bool               `json:"read" bson:"read"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

// Request/Response DTOs

// CreateExpenseRequest represents the request to create an expense
type CreateExpenseRequest struct {
	Description  string  `json:"description" binding:"required"`
	TotalAmount  float64 `json:"total_amount" binding:"required,min=0.01"`
	Category     string  `json:"category" binding:"required"`
	PaidBy       string  `json:"paid_by" binding:"required,oneof=person1 person2"`
	SplitType    string  `json:"split_type" binding:"required,oneof=equal ratio exact"`
	Person1Share float64 `json:"person1_share"`
	Person2Share float64 `json:"person2_share"`
}

// CreateTransferRequest represents the request to create a transfer
type CreateTransferRequest struct {
	Amount      float64 `json:"amount" binding:"required,min=0.01"`
	FromUser    string  `json:"from_user" binding:"required,oneof=person1 person2"`
	ToUser      string  `json:"to_user" binding:"required,oneof=person1 person2"`
	Description string  `json:"description"`
}

// UpdateSettingsRequest represents the request to update settings
type UpdateSettingsRequest struct {
	Person1Name   string `json:"person1_name"`
	Person2Name   string `json:"person2_name"`
	Theme         string `json:"theme"`
	Currency      string `json:"currency"`
	Notifications bool   `json:"notifications"`
}

// LoginRequest represents the login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// RegisterRequest represents the registration request
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2"`
}

// VerifyEmailRequest represents email verification request
type VerifyEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required"`
}

// SendVerificationCodeRequest represents sending verification code
type SendVerificationCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// FirebaseTokenRequest represents Firebase token verification request
type FirebaseTokenRequest struct {
	FirebaseUID    string `json:"firebase_uid" binding:"required"`
	Email          string `json:"email"`
	Name           string `json:"name"`
	AuthProvider   string `json:"auth_provider"`
	ProfilePicture string `json:"profile_picture"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// BalanceResponse represents the balance calculation response
type BalanceResponse struct {
	Person1Net     float64 `json:"person1_net"`
	Person2Net     float64 `json:"person2_net"`
	WhoOwesWho     string  `json:"who_owes_who"`
	AmountOwed     float64 `json:"amount_owed"`
	Person1Status  string  `json:"person1_status"`
	Person2Status  string  `json:"person2_status"`
}

// MonthlyReportResponse represents the monthly report response
type MonthlyReportResponse struct {
	TotalSpent     float64                    `json:"total_spent"`
	Person1Paid    float64                    `json:"person1_paid"`
	Person2Paid    float64                    `json:"person2_paid"`
	CategoryTotals map[string]float64          `json:"category_totals"`
	Expenses       []Expense                  `json:"expenses"`
	Transfers      []Transfer                 `json:"transfers"`
	Balance        BalanceResponse            `json:"balance"`
}

// VerificationCode represents a verification code for email
type VerificationCode struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Email     string             `json:"email" bson:"email"`
	Code      string             `json:"code" bson:"code"`
	ExpiresAt time.Time          `json:"expires_at" bson:"expires_at"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

// APIResponse represents a generic API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
