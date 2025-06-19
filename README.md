# Sage - AI Cooking Coach 🍳

An AI-powered personal cooking coach designed to help beginners build cooking confidence through personalized guidance, real-time support, and skill development.

## 🎯 Vision

Transform "kitchen anxious" beginners into confident home cooks through AI-powered coaching that adapts to their skill level, available tools, and preferences.

## 🚀 Current Status

**Production Ready:** Advanced AI Personalization

- ✅ Complete React Native app with Expo SDK 53
- ✅ Advanced user preference system with custom options
- ✅ Google Gemini AI integration with enhanced personalization
- ✅ Recipe generation, meal planning, and cooking guidance
- ✅ Achievement system and progress tracking
- ✅ Modern UI with gesture-based navigation
- ✅ Comprehensive error handling and offline support

**Enhancement Phase:** Advanced Features

- 🔄 Cost analysis and savings tracking
- 🔄 Infrastructure optimization
- 🔄 Premium feature expansion

## 🏗 Tech Stack

- **Frontend:** React Native + TypeScript + Expo SDK 53
- **AI Service:** Google Gemini (gemini-1.5-flash)
- **Backend:** Supabase (PostgreSQL + Auth)
- **State Management:** Zustand + TanStack Query
- **Navigation:** React Navigation v7
- **UI System:** Shopify Restyle (type-safe theming)
- **Forms:** React Hook Form
- **Storage:** AsyncStorage + Expo SecureStore
- **Platform:** iOS + Android

## 💡 Key Features

### Advanced Personalization

- **Custom Preferences**: Users can add custom cuisines, ingredients, appliances, and dietary restrictions
- **Smart Onboarding**: Skill level evaluation and kitchen capability assessment
- **AI Integration**: Custom preferences processed with equal priority to preset options
- **Dietary Management**: Comprehensive allergy, intolerance, and health objective tracking

### AI-Powered Cooking

- **Recipe Generation**: Personalized recipes based on user profile and custom preferences
- **Real-time Guidance**: Step-by-step cooking assistance with contextual help
- **Meal Planning**: Premium weekly meal planning with grocery list generation
- **Cooking Coach**: Interactive assistance adapted to skill level and equipment

### User Experience

- **Achievement System**: Gamified progress tracking with 16 achievements across 5 categories
- **Modern UI**: Gesture-based navigation with Restyle theming system
- **Offline Support**: Comprehensive error handling and network detection
- **Profile Management**: Granular preference editing with achievement preservation

## 🎪 Target Users

**Primary:** "Kitchen Anxious" Sarah (23-35)

- Orders delivery 4-5x/week ($200-300/month)
- Intimidated by cooking, lacks basic knowledge
- Wants to save money, eat healthier, impress others

**Secondary:** "Returning Chef" Mike (25-40)

- Used to cook, fell out of habit
- Bored with current 3-4 meal rotation
- Wants variety and to rediscover cooking joy

## 💰 Business Model

**Freemium Approach:**

- **Free Tier:** 2 guided cooking sessions per week
- **Premium ($9.99/month):** Unlimited sessions + meal planning + advanced features
- **Target:** Save users $200+/month on takeout while building cooking skills

## 🛠 Development Setup

### Prerequisites

- Node.js (LTS version)
- Expo CLI (`npm install -g @expo/cli`)
- iOS device with Expo Go app

### Getting Started

```bash
# Clone repository
git clone https://github.com/blakepennington97/Sage.git
cd Sage

# Install dependencies
npm install

# Start development server
npx expo start

# Scan QR code with Expo Go app on your iPhone
```

### Environment Setup

1. Create `.env` file with Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
2. Get Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
3. Add API key through the app's settings screen
4. Set up Supabase database using `docs/DATABASE_MIGRATION.md`

## 📁 Project Structure

```
src/
├── components/      # Reusable UI components
│   └── ui/         # Restyle design system components  
├── screens/        # Application screens
├── services/       # External integrations (AI, Supabase)
├── hooks/          # Custom React hooks  
├── stores/         # Zustand state management
├── types/          # TypeScript type definitions
├── constants/      # Theme and configuration
├── config/         # Environment configuration
└── utils/          # Utility functions
```

## 🔐 Security Notes

- API keys stored in Expo SecureStore
- Supabase RLS policies protect user data
- No sensitive information committed to repository
- User data handled according to privacy best practices

## 📈 Success Metrics

**User Engagement:**

- Recipe completion rate > 70%
- Users cooking 3+ times per week within 2 months
- Help requests resolved successfully > 90%

**Business Metrics:**

- Premium conversion rate > 15%
- Monthly churn rate < 5%
- Customer lifetime value > $60

## 🤝 Contributing

This is currently a solo project in active development. Built using a systematic multi-chat AI development workflow for consistent progress and code quality.

## 📄 License

Private repository - All rights reserved.

---

**Built with ❤️ by Blake** | [Follow Development Progress](./PROGRESS_LOG.md)
