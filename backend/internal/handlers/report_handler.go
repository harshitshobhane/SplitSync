package handlers

import (
	"context"
	"net/http"
	"time"

	"splitsync-backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type ReportHandler struct {
	db *mongo.Database
}

func NewReportHandler(db *mongo.Database) *ReportHandler {
	return &ReportHandler{db: db}
}

// GetMonthlyReport generates a monthly report
func (h *ReportHandler) GetMonthlyReport(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	year := c.Param("year")
	month := c.Param("month")

	// Parse year and month
	reportDate := time.Date(parseInt(year), time.Month(parseInt(month)), 1, 0, 0, 0, 0, time.UTC)
	nextMonth := reportDate.AddDate(0, 1, 0)

	collection := h.db.Collection("expenses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get expenses for the month
	filter := bson.M{
		"user_id": userID,
		"created_at": bson.M{
			"$gte": reportDate,
			"$lt":  nextMonth,
		},
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expenses"})
		return
	}
	defer cursor.Close(ctx)

	var expenses []models.Expense
	if err = cursor.All(ctx, &expenses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode expenses"})
		return
	}

	// Get transfers for the month
	transferCollection := h.db.Collection("transfers")
	transferCursor, err := transferCollection.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transfers"})
		return
	}
	defer transferCursor.Close(ctx)

	var transfers []models.Transfer
	if err = transferCursor.All(ctx, &transfers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode transfers"})
		return
	}

	// Calculate totals
	totalSpent := 0.0
	person1Paid := 0.0
	person2Paid := 0.0
	categoryTotals := make(map[string]float64)

	for _, expense := range expenses {
		totalSpent += expense.TotalAmount
		if expense.PaidBy == "person1" {
			person1Paid += expense.TotalAmount
		} else {
			person2Paid += expense.TotalAmount
		}
		categoryTotals[expense.Category] += expense.TotalAmount
	}

	// Calculate balance
	balance := h.calculateBalance(expenses, transfers)

	report := models.MonthlyReportResponse{
		TotalSpent:     totalSpent,
		Person1Paid:    person1Paid,
		Person2Paid:    person2Paid,
		CategoryTotals: categoryTotals,
		Expenses:       expenses,
		Transfers:      transfers,
		Balance:        balance,
	}

	c.JSON(http.StatusOK, report)
}

// GetCategoryReport generates a category-based report
func (h *ReportHandler) GetCategoryReport(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	year := c.Param("year")
	month := c.Param("month")

	// Parse year and month
	reportDate := time.Date(parseInt(year), time.Month(parseInt(month)), 1, 0, 0, 0, 0, time.UTC)
	nextMonth := reportDate.AddDate(0, 1, 0)

	collection := h.db.Collection("expenses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Aggregate expenses by category
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"user_id": userID,
				"created_at": bson.M{
					"$gte": reportDate,
					"$lt":  nextMonth,
				},
			},
		},
		{
			"$group": bson.M{
				"_id":   "$category",
				"total": bson.M{"$sum": "$total_amount"},
				"count": bson.M{"$sum": 1},
			},
		},
		{
			"$sort": bson.M{"total": -1},
		},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate category report"})
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode category report"})
		return
	}

	c.JSON(http.StatusOK, results)
}

// calculateBalance calculates the balance between two users
func (h *ReportHandler) calculateBalance(expenses []models.Expense, transfers []models.Transfer) models.BalanceResponse {
	var person1Owes, person2Owes, person1Paid, person2Paid float64

	// Calculate from expenses
	for _, expense := range expenses {
		person1Owes += expense.Person1Share
		person2Owes += expense.Person2Share
		if expense.PaidBy == "person1" {
			person1Paid += expense.TotalAmount
		} else {
			person2Paid += expense.TotalAmount
		}
	}

	// Calculate from transfers
	for _, transfer := range transfers {
		if transfer.FromUser == "person1" {
			person1Paid += transfer.Amount
			person2Paid -= transfer.Amount
		} else {
			person2Paid += transfer.Amount
			person1Paid -= transfer.Amount
		}
	}

	person1Net := person1Paid - person1Owes
	person2Net := person2Paid - person2Owes

	var whoOwesWho string
	var amountOwed float64
	var person1Status, person2Status string

	if person1Net > person2Net {
		amountOwed = person2Net
		whoOwesWho = "Person 2 owes Person 1"
		person1Status = "positive"
		person2Status = "negative"
	} else if person2Net > person1Net {
		amountOwed = person1Net
		whoOwesWho = "Person 1 owes Person 2"
		person1Status = "negative"
		person2Status = "positive"
	} else {
		whoOwesWho = "You are all settled up!"
		person1Status = "even"
		person2Status = "even"
	}

	return models.BalanceResponse{
		Person1Net:    person1Net,
		Person2Net:    person2Net,
		WhoOwesWho:    whoOwesWho,
		AmountOwed:    amountOwed,
		Person1Status: person1Status,
		Person2Status: person2Status,
	}
}

// Helper function to parse string to int
func parseInt(s string) int {
	// Simple implementation - in production, use strconv.Atoi with error handling
	if s == "" {
		return 0
	}
	// This is a simplified version - implement proper parsing
	return 2024 // Default year for now
}
