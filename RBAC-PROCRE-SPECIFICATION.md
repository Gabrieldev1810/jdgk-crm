# ProCRM Dynamic & Secure RBAC (Role-Based Access Control) System
# React + NestJS + PostgreSQL + Prisma + JWT + Redis

## OBJECTIVE
Develop a robust, fully dynamic RBAC system for the ProCRM application where:
- All roles, permissions, and user-role assignments are defined and enforced at runtime.
- No hardcoded role logic or static permissions exist.
- The design prevents privilege escalation, enforces least privilege, and supports auditing and caching.

---

## CORE REQUIREMENTS

1. Roles and permissions must be stored in the database (PostgreSQL) using Prisma.
   - Tables: roles, permissions, user_roles, role_permissions, audit_logs.
   - Many-to-many mapping between roles and permissions.

2. Authorization checks must execute on every request (middleware/guard).
   - Backend must verify if the user has the specific permission for the attempted action.
   - Frontend can hide restricted controls but backend must always re-validate.

3. Only administrative roles (Super Admin or equivalent) can:
   - Create, modify, assign, or delete roles and permissions.
   - Manage role-permission and user-role assignments.

4. Permission caching is allowed using Redis or in-memory cache, but must include proper invalidation when:
   - A role or permission is changed.
   - A user's role assignment is modified.

5. Audit logging for all RBAC changes:
   - Log who made the change, when, and what was modified.
   - Prevent privilege escalation by validating that no user can assign roles higher than their own.

---

## KEY PRINCIPLES FOR DYNAMIC, SECURE RBAC

• Least Privilege — Each role only has the permissions required for its tasks.  
• Separation of Duties — Prevent conflicting permissions from being assigned to the same user.  
• Consistent Enforcement — Frontend may hide restricted UI elements, but backend always validates.  
• Dynamic Role-Permission Mapping — No hardcoding; always fetched and validated from DB.  
• Cache with Safe Invalidation — Invalidate on any permission or role change.  
• Strong Input Validation & Sanitization — Reject invalid or duplicate role/permission entries.  
• Audit & Traceability — Every RBAC modification must be logged.  
• Prevent Privilege Escalation — Users cannot modify or assign permissions beyond their scope.  
• Session / Token Safety — Refresh or invalidate JWTs when RBAC state changes.

---

## TECH & INTEGRATION NOTES

Backend: NestJS (TypeScript)  
Frontend: React (TypeScript)  
Database: PostgreSQL with Prisma ORM  
Authentication: JWT (access + refresh tokens)  
Cache: Redis with invalidation logic  
APIs: Role & Permission CRUD, User-Role assignment, Permission verification endpoints  
Validation: Strict schema validation, reject unknown or duplicate keys

---

## DEVELOPMENT CYCLES

### CYCLE 1 — Schema & Role Creation API
**Tasks:**
- Define DB schema for `roles`, `permissions`, `user_roles`, `role_permissions`, `audit_logs`.
- Implement `POST /api/roles` endpoint for Super Admin to create new roles.
- Add validation for role name uniqueness and allowed permission keys.
- Implement audit log creation for every role creation.
- Unit tests for valid/invalid role creation.

**Acceptance Criteria:**
✔ Role creation works for authorized (Super Admin) users only.  
✔ Invalid or duplicate role names rejected.  
✔ Permissions validated from predefined allowed set.  
✔ Audit entry created on success.  
✔ Snapshot committed after passing all tests.

---

### CYCLE 2 — Permissions & Role Assignment
**Tasks:**
- Implement `POST /api/permissions` and `POST /api/role/:id/assign-permissions`.
- Validation for invalid permission keys.
- Ensure dynamic many-to-many mapping works in Prisma.
- Add audit logging for permission assignments.

**Acceptance Criteria:**
✔ Permissions added dynamically to roles.  
✔ Super Admin only access enforced.  
✔ Audit logs for assignment and modification.  
✔ Test for duplicate or invalid permission keys.

---

### CYCLE 3 — Authorization Middleware / Guard
**Tasks:**
- Implement NestJS `RbacGuard` to validate user permissions on every request.
- Fetch roles and permissions from cache (Redis) or DB.
- Implement safe cache invalidation on updates.
- Backend re-validates permission before allowing protected route access.

**Acceptance Criteria:**
✔ Guard denies unauthorized access.  
✔ Cache invalidation triggers correctly on permission/role changes.  
✔ No privilege escalation possible.  
✔ Logging and metrics available for all authorization events.

---

### CYCLE 4 — Audit Logging & Monitoring
**Tasks:**
- Extend audit log schema to include `action`, `entity`, `actorId`, `timestamp`, `oldValue`, `newValue`.
- Create `/api/audit` endpoint for viewing changes (Super Admin only).
- Include token/session invalidation when user roles or permissions change.

**Acceptance Criteria:**
✔ All RBAC actions logged with before/after values.  
✔ Access restricted to Super Admin.  
✔ Token invalidation tested and confirmed.

---

## DESIGN DECISIONS
- RBAC enforcement must be centralized (via guard/middleware).
- Role and permission mapping dynamically queried (no static imports).
- Session invalidation ensures security consistency across layers.
- Prisma transactions ensure atomic writes for role/permission changes.
- Redis caching improves performance with safety checks.

---

## TESTING & VALIDATION
- Unit tests for all role/permission CRUD and RBAC guards.
- Integration tests simulating revoked permission mid-session.
- Fuzz testing for invalid or malicious inputs.
- Ensure privilege escalation prevention works even with concurrent updates.

---

## FINAL ACCEPTANCE CHECKLIST
✅ Fully dynamic RBAC with DB-driven mapping  
✅ Middleware/guards enforce least privilege  
✅ Safe permission caching with invalidation  
✅ Complete audit log trail  
✅ Prevent privilege escalation or self-elevation  
✅ JWT/session invalidation on RBAC changes  

---

# Confirmation Step
✅ **CONFIRMED**: This specification has been integrated into Task.md and plan.md

## Integration Status
- **Task 1.3**: Updated to include all 4 development cycles
- **Timeline**: Extended Phase 1 from 3 to 4 weeks to accommodate comprehensive RBAC implementation  
- **Dependencies**: All subsequent phases now depend on fully functional dynamic RBAC system
- **Testing**: Comprehensive test suite required before proceeding to Phase 2

## Next Steps
1. Begin Task 1.1.1: Database Schema Design (including RBAC tables)
2. Implement CYCLE 1: Schema & Role Creation API
3. Progress through all 4 RBAC cycles with proper testing
4. Complete acceptance checklist before moving to Phase 2