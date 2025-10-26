package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all configuration for the application
type Config struct {
	Environment string
	Port        string
	MongoURI    string
	JWTSecret   string
	Database    string
	LogLevel    string
	RateLimit   int
}

// Load creates a new Config instance with values from environment variables
func Load() *Config {
	return &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("PORT", "8080"),
		MongoURI:    getEnv("MONGO_URI", ""),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		Database:    getEnv("DATABASE_NAME", "splitsync"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		RateLimit:   getEnvAsInt("RATE_LIMIT", 10),
	}
}

// Validate checks if required configuration values are present
func (c *Config) Validate() error {
	if c.MongoURI == "" {
		return fmt.Errorf("MONGO_URI is required")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	return nil
}

// getEnv retrieves an environment variable with a fallback default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt retrieves an environment variable as integer with a fallback default value
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

