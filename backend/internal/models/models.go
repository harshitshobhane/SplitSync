package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a user in the system
type User struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Email          string             `json:"email" bson:"email"`
	Name           string             `json:"name" bson:"name"`
	AuthProvider   string             `json:"auth_provider" bson:"auth_provider"` // "firebase", "google"
	EmailVerified  bool               `json:"email_verified" bson:"email_verified"`
	ProfilePicture string             `json:"profile_picture" bson:"profile_picture"`
	UPIID          string             `json:"upi_id,omitempty" bson:"upi_id,omitempty"`
	FirebaseUID    string             `json:"firebase_uid" bson:"firebase_uid"`
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}

// Expense represents an expense entry
type Expense struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID       primitive.ObjectID `json:"user_id" bson:"user_id"`                         // Creator's user ID
	CoupleID     primitive.ObjectID `json:"couple_id,omitempty" bson:"couple_id,omitempty"` // Optional: for couple expenses
	Description  string             `json:"description" bson:"description"`
	TotalAmount  float64            `json:"total_amount" bson:"total_amount"`
	Category     string             `json:"category" bson:"category"`
	PaidBy       string             `json:"paid_by" bson:"paid_by"`       // "person1" or "person2"
	SplitType    string             `json:"split_type" bson:"split_type"` // "equal", "ratio", "exact"
	Person1Share float64            `json:"person1_share" bson:"person1_share"`
	Person2Share float64            `json:"person2_share" bson:"person2_share"`
	Notes        string             `json:"notes,omitempty" bson:"notes,omitempty"`       // Optional notes
	Comments     []Comment          `json:"comments,omitempty" bson:"comments,omitempty"` // Optional comments
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}

// Comment represents a comment on an expense
type Comment struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
	UserName  string             `json:"user_name" bson:"user_name"`
	Content   string             `json:"content" bson:"content"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

// Transfer represents a money transfer between users
type Transfer struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID      primitive.ObjectID `json:"user_id" bson:"user_id"`                         // Creator's user ID
	CoupleID    primitive.ObjectID `json:"couple_id,omitempty" bson:"couple_id,omitempty"` // Optional: for couple transfers
	Amount      float64            `json:"amount" bson:"amount"`
	FromUser    string             `json:"from_user" bson:"from_user"` // "person1" or "person2"
	ToUser      string             `json:"to_user" bson:"to_user"`     // "person1" or "person2"
	Description string             `json:"description" bson:"description"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}

// Settings represents user settings
type Settings struct {
	ID            primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID        primitive.ObjectID `json:"user_id" bson:"user_id"`                         // User ID
	CoupleID      primitive.ObjectID `json:"couple_id,omitempty" bson:"couple_id,omitempty"` // Optional: for couple settings
	Theme         string             `json:"theme" bson:"theme"`
	Currency      string             `json:"currency" bson:"currency"`
	Notifications bool               `json:"notifications" bson:"notifications"`
	CreatedAt     time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at" bson:"updated_at"`
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
	Notes        string  `json:"notes,omitempty"`
}

// AddCommentRequest represents the request to add a comment to an expense
type AddCommentRequest struct {
	Content string `json:"content" binding:"required"`
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

// UpdateUPIRequest represents request to set/update UPI ID for a user
type UpdateUPIRequest struct {
	UPIID string `json:"upi_id" binding:"required"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// BalanceResponse represents the balance calculation response
type BalanceResponse struct {
	Person1Net    float64 `json:"person1_net"`
	Person2Net    float64 `json:"person2_net"`
	WhoOwesWho    string  `json:"who_owes_who"`
	AmountOwed    float64 `json:"amount_owed"`
	Person1Status string  `json:"person1_status"`
	Person2Status string  `json:"person2_status"`
}

// MonthlyReportResponse represents the monthly report response
type MonthlyReportResponse struct {
	TotalSpent     float64            `json:"total_spent"`
	Person1Paid    float64            `json:"person1_paid"`
	Person2Paid    float64            `json:"person2_paid"`
	CategoryTotals map[string]float64 `json:"category_totals"`
	Expenses       []Expense          `json:"expenses"`
	Transfers      []Transfer         `json:"transfers"`
	Balance        BalanceResponse    `json:"balance"`
}

// VerificationCode represents a verification code for email
type VerificationCode struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Email     string             `json:"email" bson:"email"`
	Code      string             `json:"code" bson:"code"`
	ExpiresAt time.Time          `json:"expires_at" bson:"expires_at"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

// Couple represents a couple relationship between two users
type Couple struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	User1ID   primitive.ObjectID `json:"user1_id" bson:"user1_id"`
	User2ID   primitive.ObjectID `json:"user2_id" bson:"user2_id,omitempty"` // Optional if pending
	Status    string             `json:"status" bson:"status"`               // "active", "pending", "inactive"
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

// Invitation represents a partner invitation
type Invitation struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	CoupleID     primitive.ObjectID `json:"couple_id" bson:"couple_id"`
	InviterID    primitive.ObjectID `json:"inviter_id" bson:"inviter_id"`
	InviteeEmail string             `json:"invitee_email" bson:"invitee_email"`
	Token        string             `json:"token" bson:"token"`
	ExpiresAt    time.Time          `json:"expires_at" bson:"expires_at"`
	Status       string             `json:"status" bson:"status"` // "pending", "accepted", "rejected", "expired"
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}

// CreateCoupleRequest represents the request to create/invite a couple
type CreateCoupleRequest struct {
	InviteeEmail string `json:"invitee_email" binding:"required,email"`
}

// AcceptInvitationRequest represents the request to accept an invitation
type AcceptInvitationRequest struct {
	Token string `json:"token" binding:"required"`
}

// CoupleResponse represents the couple information response
type CoupleResponse struct {
	Couple     Couple      `json:"couple"`
	Partner    User        `json:"partner,omitempty"`
	Invitation *Invitation `json:"invitation,omitempty"`
}

// APIResponse represents a generic API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Budget represents a monthly budget for a category
type Budget struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	CoupleID     primitive.ObjectID `json:"couple_id" bson:"couple_id"`
	Category     string             `json:"category" bson:"category"`
	Amount       float64            `json:"amount" bson:"amount"`
	Month        int                `json:"month" bson:"month"`                 // 1-12
	Year         int                `json:"year" bson:"year"`                   // e.g., 2024
	AlertPercent float64            `json:"alert_percent" bson:"alert_percent"` // Alert when spending reaches this % (default 80)
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}

// BudgetResponse represents budget with spending information
type BudgetResponse struct {
	Budget       Budget  `json:"budget"`
	Spent        float64 `json:"spent"`
	Remaining    float64 `json:"remaining"`
	PercentUsed  float64 `json:"percent_used"`
	AlertReached bool    `json:"alert_reached"`
}

// CreateBudgetRequest represents the request to create/update a budget
type CreateBudgetRequest struct {
	Category     string  `json:"category" binding:"required"`
	Amount       float64 `json:"amount" binding:"required,min=0.01"`
	Month        int     `json:"month" binding:"required,min=1,max=12"`
	Year         int     `json:"year" binding:"required"`
	AlertPercent float64 `json:"alert_percent,omitempty"` // Optional, default 80
}

// ExpenseTemplate represents a saved expense template
type ExpenseTemplate struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID       primitive.ObjectID `json:"user_id" bson:"user_id"`
	CoupleID     primitive.ObjectID `json:"couple_id,omitempty" bson:"couple_id,omitempty"`
	Name         string             `json:"name" bson:"name"` // Template name
	Description  string             `json:"description" bson:"description"`
	TotalAmount  float64            `json:"total_amount" bson:"total_amount"`
	Category     string             `json:"category" bson:"category"`
	PaidBy       string             `json:"paid_by" bson:"paid_by"`
	SplitType    string             `json:"split_type" bson:"split_type"`
	Person1Share float64            `json:"person1_share" bson:"person1_share"`
	Person2Share float64            `json:"person2_share" bson:"person2_share"`
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}

// CreateExpenseTemplateRequest represents the request to create an expense template
type CreateExpenseTemplateRequest struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description" binding:"required"`
	TotalAmount  float64 `json:"total_amount" binding:"required,min=0.01"`
	Category     string  `json:"category" binding:"required"`
	PaidBy       string  `json:"paid_by" binding:"required,oneof=person1 person2"`
	SplitType    string  `json:"split_type" binding:"required,oneof=equal ratio exact"`
	Person1Share float64 `json:"person1_share"`
	Person2Share float64 `json:"person2_share"`
}
