# EnvBox Development Guide

## Project Structure

```
envbox/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   └── projects/        # Project and variable endpoints
│   ├── dashboard/           # Dashboard page
│   ├── projects/[id]/       # Project detail page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Login/signup page
│   └── globals.css          # Global styles
├── lib/                     # Shared utilities
│   ├── auth.ts             # Auth middleware
│   ├── encryption.ts       # AES encryption
│   ├── jwt.ts              # JWT utilities
│   ├── mongodb.ts          # Database connection
│   └── types.ts            # TypeScript types
├── .env                    # Environment variables
├── docker-compose.yml      # Docker Compose config
├── Dockerfile              # Docker image config
├── next.config.js          # Next.js config
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (or Docker)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd envbox
```

2. Run the setup script:
```bash
./setup.sh
```

This will:
- Create `.env` file with generated secrets
- Install dependencies

3. Start MongoDB:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env` file with the following variables:

```
MONGODB_URI=mongodb://localhost:27017/envbox
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-change-this
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** Generate strong secrets for production:
```bash
openssl rand -base64 32
```

## Database

EnvBox uses MongoDB with the following collections:

- `users`: User accounts
- `projects`: Projects
- `variables`: Environment variables (values encrypted)
- `auditLogs`: Change history

No migrations are needed - collections are created automatically.

## Encryption

Variable values are encrypted at rest using AES encryption (crypto-js). The `ENCRYPTION_KEY` environment variable is used as the encryption key.

## Authentication

JWT-based authentication with 7-day token expiration. Tokens are stored in localStorage on the client.

## API Development

All API routes are in `app/api/`. Use the `requireAuth` middleware to protect routes:

```typescript
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    // user.userId and user.email are available
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

## Testing

### Manual Testing

1. Sign up at http://localhost:3000
2. Create a project
3. Add environment variables
4. Export as .env or JSON
5. View audit log

### API Testing

Use curl or Postman:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get projects (use token from login)
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer <token>"
```

## Deployment

### Docker

Build and run with Docker Compose:

```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- EnvBox on port 3000

### Environment Variables for Production

Set these in docker-compose.yml or your hosting environment:

```
MONGODB_URI=mongodb://mongodb:27017/envbox
JWT_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<generate-strong-secret>
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Build for Production

```bash
npm run build
npm start
```

## Security Considerations

1. **Secrets**: Always use strong, randomly generated secrets for `JWT_SECRET` and `ENCRYPTION_KEY`
2. **HTTPS**: Use HTTPS in production (encryption at rest + encryption in transit)
3. **Environment Variables**: Never commit `.env` files to version control
4. **Database**: Secure your MongoDB instance with authentication in production
5. **Rate Limiting**: Consider adding rate limiting for API endpoints
6. **CORS**: Configure CORS if needed for your deployment

## Future Enhancements

Out of scope for MVP but possible additions:

- Password reset functionality
- Email verification
- Team collaboration features
- API rate limiting
- Variable versioning and rollback
- Search and filtering
- Bulk import/export
- Webhooks
- CLI tool
- Two-factor authentication

## Troubleshooting

### MongoDB connection issues

- Ensure MongoDB is running: `docker ps`
- Check MONGODB_URI in .env
- Try connecting with mongosh: `mongosh mongodb://localhost:27017/envbox`

### Build errors

- Delete `.next` folder: `rm -rf .next`
- Delete node_modules: `rm -rf node_modules`
- Reinstall: `npm install`

### Port already in use

- Change port in package.json: `"dev": "next dev -p 3001"`
- Kill process using port: `lsof -ti:3000 | xargs kill`

## Contributing

1. Follow the coding rules in `.github/copilot-instructions.md`
2. Keep changes minimal and focused
3. No unnecessary refactoring
4. Maintain TypeScript strict mode compliance
5. Test locally before committing
