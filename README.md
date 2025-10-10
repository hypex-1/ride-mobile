#  RideMobile - Ride Sharing Mobile App

Mobile application for the ride-sharing platform built with **Expo** and **TypeScript**.

##  Quick Start

```bash
# Install dependencies
yarn install

# Start development server
npx expo start

# Run on specific platforms
npx expo start --android
npx expo start --ios
npx expo start --web
```

##  Tech Stack

- **Framework**: Expo SDK 52
- **Language**: TypeScript
- **Platform**: iOS, Android, Web
- **Backend**: Node.js API at `http://localhost:3000/api`
- **Real-time**: WebSocket at `ws://localhost:3000`

##  Project Structure

```
RideMobile/
 src/
    components/     # Reusable UI components
    screens/        # App screens
    services/       # API and business logic
    navigation/     # App navigation
    types/          # TypeScript definitions
    constants/      # App constants
    utils/          # Helper functions
 assets/             # Images, icons, fonts
 app.json           # Expo configuration
```

##  Backend Integration

- **API Base URL**: `http://localhost:3000/api`
- **WebSocket URL**: `ws://localhost:3000`
- **Authentication**: JWT tokens
- **Real-time**: Ride tracking, driver location updates

##  Features

### Phase 1: Core Features
- [ ] User authentication (Login/Register)
- [ ] Rider: Request rides
- [ ] Driver: Accept and manage rides
- [ ] Real-time location tracking
- [ ] In-app messaging

### Phase 2: Advanced Features
- [ ] Payment integration (Stripe)
- [ ] Ride history and receipts
- [ ] Push notifications
- [ ] Offline support
- [ ] Analytics and monitoring

##  Development

```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Run tests
yarn test

# Type checking
yarn type-check

# Lint code
yarn lint
```

##  Deployment

- **Development**: Expo Go app
- **Staging**: Expo Development Build
- **Production**: App Store / Google Play Store

##  Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Backend API Documentation](../ride-backend/docs/)

##  Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

** Backend Status**:  Running and ready for mobile integration  
** Mobile Status**:  Scaffolded and ready for development  
** Integration**: Ready for API and WebSocket connections  

Built with  using Expo and TypeScript