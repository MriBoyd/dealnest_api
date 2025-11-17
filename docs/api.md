# DealNest API Documentation

This document describes all public API endpoints exposed by the backend, organized by module. It includes authentication/authorization requirements, request/response payloads, and error conventions.

- Base URL: depends on deployment (e.g., `http://localhost:3000` in development)
- Content-Type: `application/json` unless specified (multipart for some KYC uploads)
- Authentication: Bearer JWT (`Authorization: Bearer <token>`) for protected endpoints
- Roles: Enforced with role-based access where specified

## Authentication

### POST `/auth/login`
- Auth: Local (email/password), returns JWT
- Body (LoginDto):
  - `email` (string, required)
  - `password` (string, required)
- Responses:
  - 200: `{ access_token: string, user: { ... } }`
  - 401: Invalid credentials

### POST `/auth/register`
- Body (CreateUserDto):
  - `email` (string, required)
  - `password` (string, min 8, required)
  - `name` (string, required)
  - `phone_number` (string, optional)
  - `role` (enum Role, required)
- Responses: 201 Created with user payload

### POST `/auth/logout`
- Auth: Local guard; ends session for stateless JWT setups returns message
- Response: `{ message: 'Logout successful' }`

### GET `/auth/verify-email`
- Query: `email` (string), `token` (string)
- Response: verification result

### POST `/auth/resend-verification`
- Body: `{ email: string }`
- Throttle: 5 requests per 60 seconds
- Response: blind message to prevent user enumeration

### GET `/auth/google`
- Starts Google OAuth flow

### GET `/auth/google/callback`
- Completes Google OAuth, returns JWT like login

## Users

All endpoints require JWT.

### GET `/user/profile`
- Returns authenticated user's profile (`UserResponseDto`)

### PATCH `/user/profile`
- Body (UpdateProfileDto):
  - `name?`, `phone_number?`, `preferred_language?`, `profile_pic_base64?`, `profile_pic_mimetype?`
- Returns updated profile

### DELETE `/user/profile`
- Deletes authenticated user account

### POST `/user/profile/picture`
- Body (UploadProfilePicDto): `base64`, `mimetype`
- Uploads and sets profile picture

### GET `/user/profile/picture`
- Returns profile picture metadata/payload

### PATCH `/user/change-password`
- Body (ChangePasswordDto): `current_password`, `new_password`

## Listings

All endpoints require JWT unless noted.

### POST `/listings`
- Roles: `homeowner`, `corporate_client`, `professional_seller`
- Body (CreateListingDto):
  - `vertical` (enum Vertical), `title`, `description?`, `price`, `currency?` (default ETB),
  - `location?` { `city?`, `subcity?`, `lat?` [-90..90], `lon?` [-180..180] },
  - `available_from?`, `square_meters?`, `amenities?[]`, `pet_policy?`, `nearby?[]`,
  - `extra_costs?[]` [{ `name`, `amount>=0` }], `mediaIds?` (UUID[])
- Response: listing resource

### GET `/listings`
- Query (FilterListingsDto): `city?`, `vertical?`, `minPrice?`, `maxPrice?`, `q?`,
  - pagination: `page>=1` (default 1), `limit>=1` (default 10)
  - sorting: `sortBy` in `price|created_at` (default `created_at`), `order` in `ASC|DESC` (default `DESC`)
  - geo: `lat?`, `lon?`, `radiusKm?`
- Response: paginated list (implementation specific)

### GET `/listings/:id`
- Param: `id` UUID
- Response: `ListingResponseDto`

### PATCH `/listings/:id/status`
- Roles: `admin`
- Body (UpdateListingStatusDto): `status` (`pending_verification|approved|rejected`)
- Response: updated listing

### PATCH `/listings/:id/media`
- Roles: `homeowner|corporate_client|professional_seller`
- Body (UpdateListingMediaDto): `mediaIds: UUID[]`

## Bookings

All endpoints require JWT.

### POST `/bookings`
- Body (CreateBookingDto): `listingId` (UUID), `start_date` (ISO), `end_date` (ISO), `notes?`

### GET `/bookings`
- Returns bookings for current user

### PATCH `/bookings/:id/status`
- Body (UpdateBookingStatusDto): `status` (enum BookingStatus)

### GET `/bookings/seller`
- Returns bookings for current seller

### Admin Bookings
- Base: `/admin/bookings` (JWT + Role: admin)
  - GET `/admin/bookings`
  - PATCH `/admin/bookings/:id/status` (body: UpdateBookingStatusDto)

## Reviews

All routes under `/reviews` require JWT.

### POST `/reviews`
- Body: `{ targetType: 'listing'|'seller', targetId: string(UUID), rating: 1..5, comment?: string }`
- Validates `rating` in 1..5; for `listing` target, `targetId` must exist.

### GET `/reviews/listing/:listingId`
- Returns approved reviews for a listing (newest first)

### GET `/reviews/seller/:sellerId`
- Returns approved seller reviews (newest first)

### Admin Reviews
- Base: `/admin/reviews` (JWT; typically role: admin)
  - GET `/admin/reviews` — list all reviews
  - PATCH `/admin/reviews/:id/approve` — body: `{ approve: boolean }`

## Ads

All routes require JWT.

### POST `/ads/slots`
- Body (CreateAdSlotDto): `listing_id` (UUID), `type` (`banner|featured`), `start_date` (ISO), `end_date` (ISO), `price` (number)

### GET `/ads/slots`
- Seller's ad slots

### Admin Ads (JWT + Role: admin)
- GET `/admin/ads/slots`
- PATCH `/admin/ads/slots/:id/status` — body: `{ status: 'pending'|'approved'|'rejected'|'active'|'expired' }`

## KYC

User KYC endpoints (JWT)

### POST `/kyc/docs`
- Multipart (FileFieldsInterceptor)
- Required fields: `gov_id_front`, `gov_id_back`, `selfie` (each single file)

### GET `/kyc/status`
- Returns user's KYC status

### Admin KYC (JWT + Role: admin)
- GET `/admin/kyc/pending` — Query (FilterKycDto): `search?`, `page?`, `limit?`, `sortBy?`, `order?`
- GET `/admin/kyc/:id` — specific submission details
- PATCH `/admin/kyc/:id` — body: `{ status: 'not_submitted'|'pending'|'approved'|'rejected', notes?: string }`

## Media

All routes require JWT.

### POST `/media/upload-url`
- Body (UploadMediaDto): `base64` (required), `filename?`, `mimetype?`
- Response: upload result / storage reference

### GET `/media/:id`
- Returns media meta + base64 data

## Messaging

All routes require JWT.

### POST `/threads`
- Body (CreateThreadDto):
  - `type`: 'direct'|'listing'|'booking'|'group'
  - `listing_id?`, `booking_id?`
  - `participantIds`: UUID[4]

### POST `/threads/:id/messages`
- Body (SendMessageDto): `text?`, `mediaId?`

### GET `/threads/:id/messages`
- Query: `page=1`, `limit=50` (defaults)

### GET `/threads`
- List threads for current user

## Admin Listings (consolidated)

- GET `/admin/listings` (JWT + Role: admin) — list for review
- PATCH `/admin/listings/:id/status` — body: `UpdateListingStatusDto`

## Security & Auth

- JWT required via `Authorization: Bearer <token>` for all protected routes
- Role restrictions via `@Roles(Role.X)` on relevant controllers/actions
- Throttling: `/auth/resend-verification` limited to 5 req / 60s

## Errors

- Standard NestJS error structure:
  - `400` Bad Request — validation failures (class-validator)
  - `401` Unauthorized — missing/invalid JWT
  - `403` Forbidden — insufficient role/permission
  - `404` Not Found — resource does not exist
  - `409` Conflict — business rule conflicts (where applicable)

Example error:
```json
{
  "statusCode": 400,
  "message": ["price must be a number conforming to the specified constraints"],
  "error": "Bad Request"
}
```

## Pagination & Sorting

- Listings: `page`, `limit`, `sortBy`, `order` supported; similar patterns may apply in admin KYC list.

## Notes

- DTO field validations are enforced via `class-validator` on inputs.
- Timestamps are ISO 8601 strings unless otherwise noted.
- IDs are UUIDs unless specified.

---

If you prefer an OpenAPI (Swagger) UI, we can enable Nest Swagger to generate schema docs from the decorators and DTOs. Let me know and I’ll wire it up under `/docs`.
