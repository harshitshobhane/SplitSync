# SplitHalf - Modern Expense Tracker

A beautiful, modern expense tracking app built with React and Go, designed for couples to easily split expenses and track shared finances.

## 🚀 Features

### Core Features
- **Expense Tracking**: Add, edit, and categorize shared expenses
- **Smart Splitting**: Equal, ratio-based, or exact amount splitting
- **Transfer Logging**: Track direct payments between partners
- **Real-time Balance**: See who owes what at a glance
- **Monthly Reports**: Detailed spending analysis with charts
- **Category Breakdown**: Visual pie charts of spending by category

### Modern UI/UX
- **Responsive Design**: Works perfectly on mobile and desktop
- **Dark/Light Theme**: System preference or manual selection
- **Smooth Animations**: Framer Motion powered transitions
- **Progressive Web App**: Install as a native app
- **Offline Support**: Works without internet connection
- **Keyboard Shortcuts**: Power user features

### Advanced Features
- **Search & Filter**: Find expenses quickly with advanced filtering
- **Export Data**: Download reports in JSON format
- **Share Reports**: Share monthly reports with your partner
- **Notifications**: Get notified about balance changes
- **Multi-currency**: Support for different currencies
- **Real-time Sync**: Changes sync instantly across devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with modern hooks
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for data fetching
- **React Hook Form** for form handling
- **Lucide React** for icons
- **PWA** support with Vite PWA plugin

### Backend
- **Go** with Gin framework
- **MongoDB** with official driver
- **JWT** authentication
- **CORS** enabled
- **Rate limiting** for API protection
- **Structured logging**

### Database
- **MongoDB Atlas** cloud database
- **Collections**: users, expenses, transfers, settings, notifications

## 📁 Project Structure

```
splitsync/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities and API
│   │   └── App.jsx          # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Go backend
│   ├── internal/
│   │   ├── config/          # Configuration
│   │   ├── database/        # Database connection
│   │   ├── handlers/         # HTTP handlers
│   │   ├── middleware/       # Middleware functions
│   │   ├── models/          # Data models
│   │   └── routes/           # Route definitions
│   ├── main.go
│   └── go.mod
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Go 1.21+
- MongoDB Atlas account

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
go mod tidy
```

3. Run the server:
```bash
go run main.go
```

## 📱 PWA Features

The app is a Progressive Web App with:
- **Installable**: Add to home screen on mobile
- **Offline Support**: Works without internet
- **Push Notifications**: Get notified about updates
- **App-like Experience**: Full screen on mobile

## 🎨 UI Components

### Design System
- **Color Palette**: Blue and purple gradients
- **Typography**: Clean, modern fonts
- **Spacing**: Consistent 4px grid system
- **Shadows**: Subtle depth with modern shadows
- **Animations**: Smooth 60fps animations

### Component Library
- **Buttons**: Primary, secondary, outline variants
- **Forms**: Input fields, selects, radio cards
- **Cards**: Expense cards, balance cards, stat cards
- **Modals**: Search modal, confirmation dialogs
- **Navigation**: Bottom navigation, header

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: MongoDB driver protection

## 📊 Performance

### Frontend Optimizations
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: WebP format support
- **Caching**: React Query for data caching
- **Virtual Scrolling**: For large expense lists

### Backend Optimizations
- **Connection Pooling**: MongoDB connection optimization
- **Indexing**: Database indexes for fast queries
- **Compression**: Gzip compression for responses
- **Caching**: Redis caching (optional)

## 🧪 Testing

### Frontend Testing
```bash
npm run test
```

### Backend Testing
```bash
go test ./...
```

## 📦 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend Deployment
```bash
go build -o splitsync-backend
# Deploy binary to your server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request


## 🙏 Acknowledgments

- **Lucide React** for beautiful icons
- **Framer Motion** for smooth animations
- **Tailwind CSS** for utility-first styling
- **React Query** for data fetching
- **Gin** for the Go web framework
- **MongoDB** for the database

## 📞 Support

For support, email harshitrajpriyashobhane@gmail.com or create an issue on GitHub.

---

Made with ❤️ for couples/friends who want to split expenses easily and beautifully.

