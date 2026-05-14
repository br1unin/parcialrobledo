## ADDED Requirements

### Requirement: RefreshTokenRepository supports active-session queries
The `RefreshTokenRepository` SHALL expose two additional query methods beyond revocation: `list_active_for_user(usuario_id, now)` returning all tokens where `revoked_at IS NULL AND expires_at > now`, and `get_own_by_id(token_id, usuario_id)` returning a single token only if it is both active and owned by the given user.

#### Scenario: list_active_for_user returns only non-expired, non-revoked tokens
- **WHEN** `list_active_for_user(usuario_id=X, now=T)` is called
- **THEN** the result includes only RefreshToken records where revoked_at IS NULL and expires_at > T for usuario_id X

#### Scenario: get_own_by_id returns None for mismatched owner
- **WHEN** `get_own_by_id(token_id=ID, usuario_id=Y)` is called and ID belongs to user Z (Z ≠ Y)
- **THEN** the method returns None
