# Bolt Replica Refactor Roadmap

_Last updated: 2025-10-06_

This roadmap adapts the "Bolt Replica" refactor brief to the current Expo/React Native codebase (`expo@54`, `react-native@0.81`). It keeps existing functionality while migrating screen-by-screen to a consistent Bolt-inspired design system.

---

## 1. Goals & Constraints

- Preserve working features while modernising the UI/UX toward the Bolt experience.
- Maintain Expo-managed workflow; reuse existing TypeScript tooling (eslint, jest, tsc).
- Centralise theme tokens (colors, typography, spacing) and remove ad-hoc styling.
- Achieve layout parity across iPhone 14 Pro, Pixel 8, and Galaxy S23 aspect ratios.
- Avoid destructive wipes of `src/`; refactor incrementally via feature branches.

---

## 2. Git Flow & Safety

1. Create a snapshot before large UI refactors:
   ```bash
   git checkout -b backup/pre-bolt-refactor
   git add -A
   git commit -m "Backup before Bolt refactor"
   ```
2. Work in focused feature branches (e.g. `feat/bolt-theme`, `feat/bolt-home-screen`).
3. Keep PRs small (<400 LoC) and run `npm run typecheck` + `npm test` before merging.

---

## 3. Cleanup Targets (Non-Destructive)

- Remove unused assets under `assets/` once the new art direction is finalised.
- Delete legacy components/screens only after their Bolt counterparts land.
- Clear caches when styles fail to update:
  ```bash
  rm -rf node_modules
  rm -rf .expo
  npm install
  ```

---

## 4. Folder Structure Alignment

Current layout already matches the desired separation (`components`, `screens`, `services`, `theme`). Minor tweaks:

```
src/
  components/
    buttons/
    cards/
    layout/
  hooks/
  screens/
    rider/
    driver/
  theme/ (keep index.ts, add typography.ts, metrics.ts)
  utils/
```

Create focused sub-folders (buttons, cards, layout) as new shared components emerge.

---

## 5. Dependencies & Scripts

Existing `package.json` is up to date for Expo 54. Additions to consider:

- `react-native-gesture-handler`, `react-native-reanimated` (already bundled with Expo, ensure installation).
- `@shopify/flash-list` for performant ride history (optional).
- Keep scripts: `npm run typecheck`, `npm run lint`, `npm test`.

---

## 6. Theme / Design System Actions

- Expand `src/theme/index.ts` with typography scale and spacing aliases.
- Export helper hooks (`useAppTheme`, `useSpacing`) for consistent access.
- Replace remaining hard-coded colors (`#34D186`, etc.) with theme tokens.

Deliverables:
- `src/theme/typography.ts` – central font weights/sizes.
- `src/theme/metrics.ts` – spacing, radii, elevation tokens.

---

## 7. Global Types & Constants

- Continue using `src/constants/index.ts` for misc values.
- Add `src/constants/device.ts` to store pixel-perfect targets, safe-area paddings, map defaults.

---

## 8. Navigation Enhancements

- Ensure all new screens register in `src/navigation/AppNavigator.tsx` using consistent header styling.
- Add rider bottom tabs once Home/Search/Ride/Profile share the Bolt layout.
- Use typed param lists from `src/types/navigation.ts` to avoid regressions.

---

## 9. Screen Refactor Order

1. **Rider Home** – Align map overlay, booking CTA, bottom sheet.
2. **Ride Tracking / In Progress** – Harmonise driver ETA card, live map controls.
3. **Ride Receipt** – _Done_  (theme tokens applied).
4. **Ride History** – _Done_  (themed header + tokens).
5. **Driver Home** – Mirror rider updates, include action cards.
6. **Login/Register** – Apply theme typography and safe-area wrappers.
7. **Settings/Profile/Payments/Support/Promotions** – Completed in previous sprints.

Track completion in `DEVELOPMENT_STATUS.md`.

---

## 10. Shared Components Backlog

| Component            | Purpose                                | Status |
|----------------------|-----------------------------------------|--------|
| `PrimaryButton`      | Reusable CTA with theme tokens          |  existing (`react-native-paper` Button themed)
| `CardSurface`        | Wrapper for cards with consistent radii |  plan | 
| `HeaderBar`          | Safe-area aware header with back icon   |  reused across screens
| `RideSummaryList`    | Use in history & receipt                |  plan |
| `DriverInfoCard`     | Driver detail reuse                     |  plan |
| `BottomSheet`        | Elastic sheet for search flow           | ⏳ pending |

---

## 11. Service Layer

- Maintain current `services/` structure (API, auth, ride). Introduce `ride` APIs for booking once backend endpoints ready.
- Create `src/services/payment.ts` adapters for payment gateway integration; current stub suffices for UI.

---

## 12. Utilities

- Add `src/utils/responsive.ts` with `wp/hp` helpers (per original brief).
- Provide `src/utils/safeArea.ts` for consistent inset usage if needed.

---

## 13. Pixel-Perfect Checklist

-  SafeAreaView wrappers on headers and bottom sheets.
- ⏳ Device matrix tests (iPhone 14 Pro, Pixel 8, Galaxy S23) – schedule once core screens updated.
- ⏳ Font scaling audit (Android accessibility settings) to ensure no clipping.

---

## 14. Build & Test

Use existing scripts:

```bash
npm install
npm run typecheck
npm test
npm run start
```

Device targets: iPhone 14 Pro (391x844 points), Galaxy S23 (360x800 dp), entry-level Android (360x720 dp).

---

## 15. Assets & Misc

- Continue leveraging custom icons from Bolt-like set (ensure licensing).
- Replace placeholder emojis in Promotions/History once icon set finalised.
- Document analytics/telemetry requirements before wiring events.

---

## Next Sprint Candidates

- Build Bolt-style search bottom sheet with place autocomplete (Mapbox/Google Places).
- Integrate socket-driven driver location updates in `SocketContext`.
- Add payment method carousel (card previews) once design assets ready.

---

_This roadmap should evolve alongside refactor progress. Update checkpoints and status in this document after each PR merge._
