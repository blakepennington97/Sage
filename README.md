# Sage - AI Cooking Coach 🍳

An AI-powered personal cooking coach designed to help beginners build cooking confidence through personalized guidance, real-time support, and skill development.

## 🎯 Vision

Transform "kitchen anxious" beginners into confident home cooks through AI-powered coaching that adapts to their skill level, available tools, and preferences.

## 🚀 Current Status

**Phase 1 Complete:** Foundation & AI Integration  
- ✅ React Native + Expo development environment  
- ✅ Google Gemini AI integration working  
- ✅ Test interface functional on iOS  
- ✅ Cost-effective API setup (free tier)  

**Phase 2 In Progress:** Core App Features  
- 🔄 User onboarding flow  
- 🔄 Recipe generation system  
- 🔄 Step-by-step cooking guidance  

## 🏗 Tech Stack

- **Frontend:** React Native + TypeScript + Expo
- **AI Service:** Google Gemini (gemini-1.5-flash)
- **State Management:** Zustand
- **Navigation:** React Navigation
- **Storage:** AsyncStorage + Expo SecureStore
- **Platform:** iOS first, Android later

## 💡 Key Features (Planned)

### Smart Onboarding
- Kitchen tool assessment via photo recognition
- Skill level evaluation through interactive questions
- Dietary preferences and restrictions setup
- Time and budget constraint configuration

### AI Recipe Coach
- Personalized recipe recommendations
- Real-time cooking guidance with help buttons
- Ingredient substitution suggestions
- Technique explanations for beginners

### Confidence Building
- Progress tracking and skill development
- Success celebration and encouragement
- Recipe history and favorites
- Gradually increasing difficulty levels

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
1. Get Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. Add API key to `src/services/ai/gemini.ts` (will be moved to secure storage)
3. Enable billing in Google Cloud Console (free tier available)

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   └── cooking/      # Cooking-specific components
├── screens/          # App screens
├── services/
│   └── ai/          # AI service integrations
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── constants/       # App constants and prompts
```

## 🔐 Security Notes

- API keys will be moved to Expo SecureStore before production
- User data handled according to privacy best practices
- No sensitive information committed to repository

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