# AntragPlus Sales Software - Frontend

Modern sales automation dashboard built with Next.js, TypeScript, and Tailwind CSS.

## 🎯 Features

- **Dashboard Overview** - Real-time metrics and system status
- **Lead Management** - AI-powered enrichment tracking and management
- **Sync Monitor** - Pipedrive ↔ Asana synchronization status
- **Analytics** - Performance insights and data quality metrics
- **Settings** - API configuration and automation rules

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Headless UI
- **State Management:** TanStack Query (React Query)
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Date Handling:** date-fns

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local and set your API URL
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/           # Dashboard pages
│   │   │   ├── page.tsx         # Main dashboard
│   │   │   ├── leads/           # Lead management
│   │   │   ├── sync/            # Sync monitoring
│   │   │   ├── analytics/       # Analytics & reports
│   │   │   └── settings/        # Configuration
│   │   ├── (auth)/              # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   │
│   ├── components/              # Reusable components
│   │   ├── DashboardHeader.tsx  # Dashboard navigation
│   │   ├── Button.tsx
│   │   ├── Container.tsx
│   │   └── ...
│   │
│   ├── lib/
│   │   └── api.ts               # Backend API client
│   │
│   └── styles/
│       └── tailwind.css         # Global styles
│
├── .env.local                   # Environment variables
├── package.json
├── tsconfig.json
└── next.config.js
```

## 🔌 API Integration

The frontend communicates with the backend through a centralized API client (`src/lib/api.ts`):

### Available APIs

```typescript
import { leadApi, syncApi, analyticsApi, settingsApi } from '@/lib/api'

// Lead Enrichment
await leadApi.getLeads()
await leadApi.enrichLead(id)
await leadApi.getStats()

// Sync Operations
await syncApi.getStatus()
await syncApi.triggerSync()
await syncApi.getLogs()

// Analytics
await analyticsApi.getDashboard()
await analyticsApi.getStageGaps()

// Settings
await settingsApi.getConfig()
await settingsApi.updateConfig(config)
```

### Environment Variables

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# Site URL (for RSS feeds, etc.)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📊 Dashboard Pages

### 1. Main Dashboard (`/dashboard`)
- System overview
- Quick stats
- Recent activity
- Quick actions

### 2. Leads (`/dashboard/leads`)
- Lead listing with filters
- Enrichment status
- Batch operations
- CSV upload/export

### 3. Sync (`/dashboard/sync`)
- Sync status and logs
- Manual sync trigger
- Pipedrive/Asana configuration
- Activity timeline

### 4. Analytics (`/dashboard/analytics`)
- Performance metrics
- Conversion funnel
- Stage gap analysis
- Generated reports

### 5. Settings (`/dashboard/settings`)
- API configuration
- Automation rules
- System preferences
- Connection testing

## 🎨 Customization

### Theme Colors

Edit `src/styles/tailwind.css` to customize the color scheme.

### Components

All UI components are in `src/components/` and built with Tailwind CSS and Headless UI for maximum flexibility.

### Adding New Pages

1. Create a new folder in `src/app/dashboard/[page-name]/`
2. Add `page.tsx` for the page content
3. Update navigation in `src/components/DashboardHeader.tsx`

## 🔒 Authentication

Authentication pages are in `src/app/(auth)/`:
- `/login` - User login
- `/register` - User registration

You'll need to implement actual authentication logic and connect it to your backend.

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Static Export

```bash
# Build as static site
npm run build

# Deploy the 'out' directory to any static host
```

## 🛠️ Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code (if prettier is configured)
npm run format
```

### Type Checking

```bash
# Check TypeScript types
npx tsc --noEmit
```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Headless UI](https://headlessui.dev)
- [React Query](https://tanstack.com/query/latest)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ for AntragPlus Sales Automation
