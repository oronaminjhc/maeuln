# 마을N - Next.js 15 Conversion

This project is a conversion of the original ReactJS application to Next.js 15 with app directory routing, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Next.js 15** with app directory routing
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Firebase** integration (Auth, Firestore, Storage)
- **Kakao OAuth** login
- **Responsive design** optimized for mobile
- **PWA** ready

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page (redirects based on auth)
│   ├── start/             # Login page
│   ├── region-setup/      # Region selection
│   ├── home/              # Main home page
│   ├── news/              # News pages
│   ├── board/             # Board pages
│   ├── profile/           # Profile pages
│   ├── post/              # Post pages
│   ├── chat/              # Chat pages
│   ├── clubs/             # Club pages
│   └── calendar/          # Calendar pages
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
│   ├── firebase/          # Firebase config
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   └── constants/         # Constants and styles
└── public/               # Static assets
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Region API
NEXT_PUBLIC_REGION_API_KEY=your_region_api_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔄 Key Changes from ReactJS to Next.js

### 1. Routing
- **Before**: React Router with `BrowserRouter`, `Routes`, `Route`
- **After**: Next.js app directory with `page.tsx` files

### 2. Navigation
- **Before**: `useNavigate`, `Link` from `react-router-dom`
- **After**: `useRouter`, `Link` from `next/navigation` and `next/link`

### 3. Authentication
- **Same**: Firebase Auth with `onAuthStateChanged`
- **Same**: AuthContext implementation
- **Same**: Protected routes logic

### 4. File Structure
- **Before**: Single `App.js` with all components
- **After**: Modular structure with separate pages and components

### 5. Styling
- **Before**: CSS classes
- **After**: Tailwind CSS with same design

## 🎯 Core Functionality Preserved

✅ **Authentication Flow**
- Kakao OAuth login
- User registration and region setup
- Admin role management

✅ **Content Management**
- News creation and management
- Post creation and interaction
- Image upload to Firebase Storage

✅ **Social Features**
- User profiles and following
- Comments and likes
- Chat functionality
- Club/group management

✅ **Regional Features**
- City-based content filtering
- Region selection and management
- Admin city selection

✅ **UI/UX**
- Mobile-first responsive design
- Bottom navigation
- Modal components
- Calendar integration

## 🛠️ Development

### Building for Production

```bash
npm run build
npm start
```

### TypeScript

The project uses TypeScript for better type safety. All components and functions are properly typed.

### Firebase Integration

Firebase services are configured in `lib/firebase/config.ts`:
- Authentication
- Firestore Database
- Storage

### Component Structure

Components are organized by functionality:
- **Layout**: Header, BottomNav, PageLayout
- **UI**: LoadingSpinner, Logo, Modal
- **Features**: NewsCard, Calendar, etc.

## 📱 PWA Features

The application is PWA-ready with:
- Service worker registration
- App installation prompts
- Offline capabilities (can be enhanced)

## 🔐 Security

- Environment variables for sensitive data
- Firebase security rules
- Client-side authentication checks
- Admin role verification

## 🚀 Deployment

The application can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Any static hosting service

## 📝 Notes

- All Firebase functions work exactly as in the original
- UI/UX is preserved with Tailwind CSS
- TypeScript adds type safety
- App directory routing provides better performance
- SSR is disabled for client-side functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 