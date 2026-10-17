# Implementation Plan - Email & Password Authentication Migration

## User Review Required
> [!IMPORTANT]
> Please review the plan below. It replaces Google Sign-In with Email/Password authentication in Firebase Auth, keeping all other chat, WebRTC call, profile, and Firestore functionalities fully intact.

## Proposed Changes

### 1. Firebase Auth Service (`src/lib/firebase.ts` or auth context)
- Remove `GoogleAuthProvider`, `signInWithPopup`, and Google sign-in helpers.
- Implement and export:
  - `signInWithEmailAndPassword` (Login)
  - `createUserWithEmailAndPassword` (Register with display name update)
  - `sendPasswordResetEmail` (Forgot password)
  - `signOut` (Logout)

### 2. Auth Context (`src/context/AuthContext.tsx`)
- Update state and methods to expose `loginWithEmail`, `registerWithEmail`, `resetPassword`, and `logout`.
- Ensure new user registrations automatically generate an 8-character short ID, register in `userDirectory`, and create the user profile in Firestore (preserving existing user profile initialization).

### 3. Login Screen & Authentication Modals (`src/components/LoginScreen.tsx` & new views)
- Remove Google Sign-In button and logic.
- Build clean, responsive UI with:
  - Login view (Email, Password with show/hide toggle, Login button, "Criar conta", "Esqueci minha senha").
  - Registration view (Display Name, Email, Password, Confirm Password, Register button, "Já tenho conta").
  - Forgot Password view (Email input, Send reset instructions, "Voltar ao login").
- Add friendly Portuguese error messages for invalid credentials, weak passwords, user not found, etc.

## Verification Plan

### Automated Tests
- Run `npm run build` (`compile_applet`) and `npm run lint` (`lint_applet`) to verify TypeScript compilation and zero build errors.

### Manual Verification
- Test account creation with display name, email, and password.
- Test login with valid and invalid credentials.
- Test password reset email flow.
- Test logout and session persistence across page reloads.
- Verify that chats, WebRTC voice calls, and friend lookup by short ID continue to work seamlessly.
