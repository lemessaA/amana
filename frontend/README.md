# AMANA Frontend — Next.js Application

Production-ready frontend for AMANA secure device registration platform. Built with Next.js 16, TypeScript, Tailwind CSS, and shadcn/ui components.

**Status:** ✅ **Production Ready** | 18 Pages | Zero TypeScript Errors | Dark Theme

## 📋 Quick Links

- [Installation](#installation)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Components](#components)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [API Integration](#api-integration)
- [Error Handling](#error-handling)
- [Configuration](#configuration)

## Installation

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Environment** variables configured

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# 3. Start development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

## Project Structure

```
src/
├── app/                                 # Next.js App Router
│   ├── layout.tsx                      # Root layout with providers
│   ├── page.tsx                        # Home page
│   ├── (public)/                       # Public routes
│   │   ├── lookup/page.tsx             # Device lookup
│   │   ├── login/page.tsx              # Sign in
│   │   └── register/page.tsx           # Sign up
│   ├── (auth)/                         # Protected routes
│   │   ├── dashboard/page.tsx          # Dashboard
│   │   ├── devices/
│   │   │   ├── page.tsx                # My Devices (list)
│   │   │   ├── register/page.tsx       # Register Device (production)
│   │   │   └── test/page.tsx           # Register Device (test mode)
│   │   ├── reports/new/page.tsx        # Report Issue
│   │   ├── disputes/new/page.tsx       # Claim Dispute
│   │   ├── evidence/page.tsx           # Submit Evidence
│   │   ├── profile/page.tsx            # User Profile
│   │   └── settings/page.tsx           # Account Settings
│   ├── (reviewer)/                     # Reviewer routes
│   │   ├── reviews/pending/page.tsx    # Pending Reviews
│   │   ├── reviews/[id]/page.tsx       # Review Details
│   │   └── investigations/page.tsx     # Investigations
│   └── (admin)/                        # Admin routes
│       ├── dashboard/page.tsx          # Admin Dashboard
│       ├── users/page.tsx              # Manage Users
│       ├── roles/page.tsx              # Manage Roles
│       └── reports/page.tsx            # System Reports
│
├── components/                          # Reusable components
│   ├── ui/                             # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── app-layout.tsx                  # Main app layout
│   ├── app-sidebar.tsx                 # Sidebar navigation
│   ├── ErrorBoundary.tsx               # Error boundary
│   ├── ErrorToast.tsx                  # Toast notifications
│   ├── form-field.tsx                  # Form wrapper
│   ├── ProtectedRoute.tsx              # Route protection
│   └── ...
│
├── lib/                                 # Utilities
│   ├── api.ts                          # API client with 50+ endpoints
│   ├── auth.ts                         # Authentication hooks
│   ├── errors.ts                       # Error handling utilities
│   └── constants.ts                    # Constants and config
│
├── context/                             # React Context
│   └── AuthContext.tsx                 # Authentication state
│
├── styles/
│   └── globals.css                     # Global styles
│
└── app/globals.css                     # Tailwind CSS entry

public/                                  # Static assets
├── favicon.ico
└── ...

package.json                            # Dependencies
tsconfig.json                           # TypeScript config
tailwind.config.ts                      # Tailwind config
next.config.js                          # Next.js config
.env.local                              # Local environment
```

## Pages & Routes

### 🌐 Public Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` | Home page with device lookup |
| `/lookup` | `lookup/page.tsx` | Device status lookup (public) |
| `/login` | `login/page.tsx` | User login form |
| `/register` | `register/page.tsx` | User registration form |

### 🔐 Protected Pages (Authenticated Users)

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | `dashboard/page.tsx` | User dashboard |
| `/devices` | `devices/page.tsx` | My Devices (list all user devices) |
| `/devices/register` | `devices/register/page.tsx` | Register Device (production mode with IMEI validation) |
| `/devices/test` | `devices/test/page.tsx` | Test Device Registration (no validation + bulk) |
| `/reports/new` | `reports/new/page.tsx` | Report Issue (theft or conflict) |
| `/disputes/new` | `disputes/new/page.tsx` | Claim Dispute (contest device claim) |
| `/evidence` | `evidence/page.tsx` | Submit Evidence |
| `/profile` | `profile/page.tsx` | User Profile Settings |
| `/settings` | `settings/page.tsx` | Account Settings |

### 📋 Reviewer Pages (Reviewer+ Role)

| Route | Component | Description |
|-------|-----------|-------------|
| `/reviews/pending` | `reviews/pending/page.tsx` | Pending case reviews |
| `/reviews/[id]` | `reviews/[id]/page.tsx` | Review case details |
| `/investigations` | `investigations/page.tsx` | Active investigations |

### ⚙️ Admin Pages (Admin Role)

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/dashboard` | `admin/dashboard/page.tsx` | Admin overview |
| `/admin/users` | `admin/users/page.tsx` | Manage users |
| `/admin/roles` | `admin/roles/page.tsx` | Manage roles |
| `/admin/reports` | `admin/reports/page.tsx` | System reports |

## Components

### UI Components (shadcn/ui)

Pre-built, customizable components from shadcn/ui:
- **Button** - Primary, secondary, danger variants
- **Card** - Container with header, title, description, content
- **Input** - Text input with validation states
- **Alert** - Dismissible alerts (danger, success, warning, info)
- **Dialog** - Modal dialogs
- **Select** - Dropdown select
- **Checkbox** - Checkboxes
- **Badge** - Status badges
- And 20+ more...

### Custom Components

#### ErrorBoundary
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```
Catches component crashes and displays error UI with retry button.

#### ErrorToast Provider
```tsx
<ToastProvider>
  <App />
</ToastProvider>
```
Provides toast notifications throughout the app.

Usage:
```tsx
const { addToast } = useToast();
addToast("Device registered!", "success", 3000);
addToast("Error occurred", "error");
```

#### FormField
```tsx
<FormField
  label="IMEI Number"
  type="text"
  value={imei}
  onChange={(e) => setImei(e.target.value)}
  required
  hint="Enter 15-digit IMEI"
  as="input"
/>
```

#### ProtectedRoute
Routes automatically protected with `useRequireAuth()`:
```tsx
export default function ProtectedPage() {
  const { user, ready } = useRequireAuth();
  
  if (!ready || !user) return <LoadingSpinner />;
  
  return <div>Protected content for {user.email}</div>;
}
```

#### AppLayout
Main layout for authenticated pages:
```tsx
<AppLayout>
  <h1>Page Title</h1>
  <p>Content here</p>
</AppLayout>
```

## Development

### Available Scripts

```bash
# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run TypeScript type checking
npm run type-check

# Format code with Prettier
npm run format

# Run tests
npm run test

# Generate API types
npm run generate:types
```

### Code Quality

**TypeScript Configuration:**
- Strict mode enabled
- No implicit any
- No unused variables
- No unused parameters

**ESLint Configuration:**
- Next.js recommended rules
- TypeScript support
- React best practices

**Prettier Configuration:**
- 2-space indentation
- Single quotes
- Semicolons
- Trailing commas

### Styling

Uses **Tailwind CSS 4** with dark theme:

```tsx
// Dark theme by default
<div className="bg-background text-foreground">
  <h1 className="text-primary-accent">Title</h1>
  <p className="text-secondary">Subtitle</p>
</div>
```

Color variables:
- `background` - Page background
- `foreground` - Text color
- `card` - Card backgrounds
- `border` - Border color
- `primary-accent` - Primary action color (cyan)
- `secondary` - Secondary text
- `success` - Success state (green)
- `warning` - Warning state (yellow)
- `danger` - Error state (red)

## Build & Deployment

### Production Build

```bash
# Build application
npm run build

# Verify build
npm start

# Test production build locally
npm run build && npm start
```

Build artifacts:
- `.next/` - Compiled application
- `out/` - Static export (if enabled)

### Deployment Platforms

#### Vercel (Recommended)

```bash
# Login to Vercel
npx vercel login

# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod
```

#### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

Deploy:
```bash
docker build -t amana-frontend:latest .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=... amana-frontend:latest
```

#### AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

## API Integration

### API Client (`lib/api.ts`)

Comprehensive API client with 50+ typed endpoints:

```tsx
// Authentication
import { registerUser, loginUser, getMe } from '@/lib/api';

// Devices
import { 
  registerDevice, 
  registerDeviceTest,
  getMyDevices, 
  lookupDevice 
} from '@/lib/api';

// Reports
import { submitReport, getReports } from '@/lib/api';

// Cases
import { createDispute, updateCase } from '@/lib/api';
```

### Making API Calls

```tsx
import { registerDevice, type Device } from '@/lib/api';
import { ErrorHandler } from '@/lib/errors';

try {
  const result = await registerDevice({
    device_type: 'phone',
    identifier_type: 'imei',
    identifier_value: '490154203237518'
  });
  console.log('Device registered:', result.device_id);
} catch (err) {
  const message = ErrorHandler.getUserMessage(err);
  console.error(message);
}
```

### Authentication Headers

All protected endpoints automatically include JWT token:

```tsx
Authorization: Bearer {token}
```

Token stored in localStorage and managed by `AuthContext`.

## Error Handling

### Client-Side Error Handling

**ErrorBoundary (Component Crashes)**
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**ErrorToast (User Notifications)**
```tsx
const { addToast } = useToast();
addToast("Success!", "success", 3000);
addToast("Error occurred", "error");
```

**ErrorHandler (API Errors)**
```tsx
import { ErrorHandler } from '@/lib/errors';

try {
  await registerDevice(data);
} catch (err) {
  const message = ErrorHandler.getUserMessage(err);
  const status = ErrorHandler.parse(err).status;
}
```

**safeAsync & retryAsync (Utilities)**
```tsx
import { safeAsync, retryAsync } from '@/lib/errors';

// Safe execution
const result = await safeAsync(async () => {
  return await fetchData();
}, 'Failed to fetch data');

// With retry
const result = await retryAsync(
  async () => fetchData(),
  { maxRetries: 3, delay: 1000 }
);
```

### HTTP Status Handling

| Status | Handling |
|--------|----------|
| 400 | Bad request (validation error) |
| 401 | Unauthorized (redirect to login) |
| 403 | Forbidden (no permission) |
| 404 | Not found |
| 422 | Validation error (field-specific) |
| 429 | Rate limited |
| 500+ | Server error |

## Configuration

### Environment Variables

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Optional: Analytics & Monitoring
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_GA_ID=
```

### Tailwind Configuration

`tailwind.config.ts`:
```ts
export default {
  theme: {
    extend: {
      colors: {
        background: 'hsl(222 84% 5%)',
        foreground: 'hsl(210 40% 98%)',
        // ... more colors
      }
    }
  }
}
```

### TypeScript Configuration

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Performance Optimization

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/device.png"
  alt="Device"
  width={200}
  height={200}
  priority
/>
```

### Code Splitting

Automatic via Next.js App Router:
```tsx
// Lazy load component
const HeavyComponent = dynamic(() => import('@/components/Heavy'), {
  loading: () => <LoadingSpinner />,
});
```

### Caching

```tsx
// Cache API response for 60 seconds
const data = await getMyDevices({ cache: 60 });
```

## Troubleshooting

### Issue: Port 3000 already in use

```bash
npm run dev -- -p 3001
```

### Issue: TypeScript errors on build

```bash
npm run type-check
npm run lint -- --fix
```

### Issue: Styles not applying

```bash
# Rebuild Tailwind
npm run dev

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: API connection failed

```bash
# Check .env.local
cat .env.local

# Verify backend is running
curl http://localhost:8000/health

# Update .env.local if needed
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

## Contributing

See main [README.md](../README.md#contributing) for contribution guidelines.

## License

MIT - See LICENSE file for details.

---

**Last Updated**: October 23, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
