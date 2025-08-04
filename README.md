# Currency Exchange Rate API

A robust, production-ready REST API for fetching real-time currency exchange rates, built with NestJS, TypeScript, and Redis caching.

## 🚀 Features

- **Real-time Exchange Rates**: Fetch current exchange rates from FastForex API
- **Currency List**: Get all supported currencies with their names
- **Redis Caching**: Intelligent caching to reduce API calls and improve performance
- **Docker Support**: Complete containerization for easy deployment
- **TypeScript**: Full type safety and modern JavaScript features
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Validation**: Input validation and sanitization
- **Testing**: Unit and E2E tests included

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  NestJS API     │───▶│  FastForex API  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │                 │
                       └─────────────────┘
```

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm
- Docker and Docker Compose (for containerized deployment)
- Redis (included in Docker setup)

## 🛠️ Installation

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd exchange-rate
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   FAST_FOREX_API_URL=https://api.fastforex.io
   FAST_FOREX_API_KEY=your_api_key_here
   REDIS_URL=redis://localhost:6379
   PORT=3000
   NODE_ENV=development
   ```

4. **Start Redis** (if not using Docker)
   ```bash
   # macOS with Homebrew
   brew install redis
   brew services start redis
   
   # Or use Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

5. **Run the application**
   ```bash
   # Development mode
   pnpm run start:dev
   
   # Production mode
   pnpm run build
   pnpm run start:prod
   ```

### Option 2: Docker Deployment

1. **Clone and set up environment**
   ```bash
   git clone <your-repo-url>
   cd exchange-rate
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Run with Docker Compose**
   ```bash
   # Development
   pnpm run docker:dev
   
   # Production
   pnpm run docker:prod
   ```

3. **View logs**
   ```bash
   pnpm run docker:dev:logs
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Get All Supported Currencies
```http
GET /currency-rates/currencies
```

**Response:**
```json
{
  "currencies": {
    "USD": "US Dollar",
    "EUR": "Euro",
    "GBP": "British Pound",
    "JPY": "Japanese Yen",
    "AUD": "Australian Dollar"
  }
}
```

#### Get Exchange Rate
```http
GET /currency-rates/rate?from=USD&to=EUR
```

**Parameters:**
- `from` (required): Source currency code (e.g., USD, EUR, GBP)
- `to` (required): Target currency code (e.g., USD, EUR, GBP)

**Response:**
```json
{
  "rate": 0.85
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Invalid currency code: USD or INVALID",
  "error": "Invalid currency code"
}
```

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch
```

## 🐳 Docker Commands

```bash
# Development
pnpm run docker:dev          # Start development containers
pnpm run docker:dev:logs     # View development logs
pnpm run docker:dev:down     # Stop development containers

# Production
pnpm run docker:prod         # Start production containers
pnpm run docker:prod:down    # Stop production containers
```

## 🔧 Development

### Available Scripts

```bash
pnpm run build              # Build the application
pnpm run start              # Start the application
pnpm run start:dev          # Start in development mode with hot reload
pnpm run start:debug        # Start in debug mode
pnpm run start:prod         # Start in production mode
pnpm run lint               # Run ESLint
pnpm run format             # Format code with Prettier
pnpm run test               # Run unit tests
pnpm run test:e2e           # Run E2E tests
pnpm run test:cov           # Run tests with coverage
```

### Project Structure

```
src/
├── currency-rates/          # Currency rates module
│   ├── currency-rates.controller.ts
│   ├── currency-rates.service.ts
│   └── currency-rates.module.ts
├── redis/                   # Redis configuration
│   └── redis.module.ts
├── app.module.ts           # Root application module
└── main.ts                 # Application entry point
```

## 🔒 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `FAST_FOREX_API_URL` | FastForex API base URL | Yes | - |
| `FAST_FOREX_API_KEY` | FastForex API key | Yes | - |
| `REDIS_URL` | Redis connection URL | No | `redis://localhost:6379` |
| `PORT` | Application port | No | `3000` |
| `NODE_ENV` | Environment mode | No | `development` |

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Ensure all required environment variables are set
2. **Redis Persistence**: Configure Redis persistence for production
3. **Logging**: Set up proper logging and monitoring
4. **Security**: Configure CORS, rate limiting, and security headers
5. **SSL/TLS**: Use HTTPS in production

### Example Production Deployment

```bash
# Build production image
docker build -t currency-api:latest .

# Run with production environment
docker run -d \
  --name currency-api \
  -p 3000:3000 \
  --env-file .env.production \
  currency-api:latest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [FastForex](https://fastforex.io/) - Currency exchange rate data
- [Redis](https://redis.io/) - In-memory data structure store

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Built with ❤️ using NestJS and TypeScript**
