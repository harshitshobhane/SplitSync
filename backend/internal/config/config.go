package config

import (
	"os"
)

type Config struct {
	Environment string
	Port        string
	MongoURI    string
	JWTSecret   string
	Database    string
}

func Load() *Config {
	return &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("PORT", "8080"),
		MongoURI:    getEnv("MONGO_URI", "mongodb+srv://harshitrajpriyashobhane:MbPwoKHJ8Zr7Nkwa@splitsync.j2p0e9f.mongodb.net/?appName=SplitSync"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key"),
		Database:    getEnv("DATABASE_NAME", "splitsync"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
