# Network Setup Solutions

This project includes several solutions for handling network connectivity across different environments.

## Quick Start

### Option 1: Auto IP Detection (Recommended)
```bash
# Automatically detects your IP and starts Expo
npm run dev

# For wireless debugging (works anywhere)
npm run dev:tunnel
```

### Option 2: Manual IP Update
```bash
# Update IP manually then start
npm run update-ip
npm start
```

### Option 3: Expo Tunnel (Universal)
```bash
# Works on any network, no IP needed
expo start --tunnel
```

## How It Works

### Auto IP Detection
- Detects your current network IP automatically
- Updates `.env` file with correct URLs
- Prioritizes Wi-Fi over Ethernet
- Falls back to localhost for emulators

### Expo Tunnel
- Creates a secure tunnel through Expo's servers
- Works on any network (coffee shops, mobile hotspot, etc.)
- No IP configuration needed
- Slightly slower than direct connection

## Troubleshooting

### "No local IP address found"
- Make sure you're connected to a network
- Check Windows Firewall isn't blocking Node.js
- Try `npm run dev:tunnel` instead

### Mobile device can't connect
- Ensure phone and computer are on same network
- Try `npm run dev:tunnel` for universal access
- Check if your router blocks device-to-device communication

### Backend not starting
```bash
# In backend directory
npm start
# Should show: 🚀 Application is running on: http://localhost:3000
```

## Network Scenarios

| Scenario | Command | Notes |
|----------|---------|-------|
| Home Wi-Fi | `npm run dev` | Auto-detects IP |
| Coffee shop | `npm run dev:tunnel` | Universal access |
| Mobile hotspot | `npm run dev:tunnel` | Works anywhere |
| Office network | `npm run dev` | May need firewall rules |
| Airplane mode | Use emulator only | No network needed |

## Advanced Configuration

### Custom Backend Port
Edit `scripts/update-ip.js` and change `:3000` to your port.

### Fixed IP Address
Set `EXPO_PUBLIC_API_URL` in `.env` manually to override auto-detection.

### Multiple Network Interfaces
The script prioritizes Wi-Fi → Ethernet → Others automatically.