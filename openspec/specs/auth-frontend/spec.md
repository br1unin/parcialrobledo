# auth-frontend Specification

## Purpose
TBD - created by archiving change us-001-auth. Update Purpose after archive.
## Requirements
### Requirement: Login page
The system SHALL provide a Login page at route `/login` with email and password fields. On success, the access token, refresh token, and user data MUST be stored in authStore (persisted in localStorage). The user MUST be redirected to `/` after login.

#### Scenario: Successful login
- **WHEN** user submits valid credentials on the Login page
- **THEN** authStore is updated with tokens and user, and the app navigates to "/"

#### Scenario: Invalid credentials display
- **WHEN** the API returns 401
- **THEN** the form displays the error message returned by the API below the submit button

#### Scenario: Rate limit feedback
- **WHEN** the API returns 429
- **THEN** the form displays "Demasiados intentos. Intentá de nuevo en unos minutos."

---

### Requirement: Register page
The system SHALL provide a Register page at route `/register` with nombre, email, and password fields. On success, behavior MUST be identical to login (store tokens, redirect to `/`).

#### Scenario: Successful registration
- **WHEN** user submits valid data on the Register page
- **THEN** authStore is updated and app navigates to "/"

#### Scenario: Email already taken
- **WHEN** the API returns 409
- **THEN** the form displays "Este email ya está registrado"

---

### Requirement: Protected routes
The system SHALL redirect unauthenticated users to `/login` when they attempt to access protected routes. Authenticated users accessing `/login` or `/register` MUST be redirected to `/`.

#### Scenario: Unauthenticated access to protected route
- **WHEN** a user not logged in navigates to any route other than `/login` or `/register`
- **THEN** React Router redirects them to `/login`

#### Scenario: Authenticated user on login page
- **WHEN** a user with a valid session navigates to `/login`
- **THEN** React Router redirects them to `/`

---

### Requirement: Automatic token refresh via Axios interceptor
The system SHALL transparently renew the access token when it expires. The existing interceptor in `axiosInstance.ts` MUST call POST /api/v1/auth/refresh, update authStore with new tokens, and retry the original request — all without user interaction.

#### Scenario: Expired token on API call
- **WHEN** any API call returns HTTP 401 and a refresh token is available in authStore
- **THEN** the interceptor refreshes tokens silently and retries the original request

#### Scenario: Refresh token also expired
- **WHEN** the refresh call returns 401
- **THEN** the interceptor calls authStore.logout() and redirects to /login

---

### Requirement: Logout action
The system SHALL provide a logout mechanism that calls POST /api/v1/auth/logout, clears authStore, and redirects to `/login`.

#### Scenario: Logout flow
- **WHEN** user triggers logout
- **THEN** refresh token is revoked via API, authStore is cleared, and user is redirected to /login

