# MediStore API Endpoints

Base URL: `http://localhost:14000/api/v1`

## Authentication

### Login
```
POST /account/login
Body: { "login": "admin", "password": "password" }
Response: { "token": "...", "refreshToken": "...", "user": {...} }
```

### Get Current User
```
GET /account/me
Headers: Authorization: Bearer <token>
Response: User object
```

### Refresh Token
```
POST /account/refresh
Body: { "refreshToken": "..." }
Response: { "token": "...", "refreshToken": "..." }
```

## Medicines

```
GET    /medicines              - List all medicines
GET    /medicines/{id}         - Get medicine by ID
GET    /medicines/search?query=... - Search medicines
POST   /medicines              - Create medicine
PUT    /medicines/{id}         - Update medicine
DELETE /medicines/{id}         - Delete medicine
```

**Medicine Schema:**
```json
{
  "id": 1,
  "name": "Aspirin",
  "description": "Pain reliever",
  "tempMax": 25.0,
  "tempMin": 15.0,
  "humidMax": 60.0,
  "humidMin": 40.0
}
```

## Batches

```
GET    /batches              - List all batches
GET    /batches/{id}         - Get batch by ID
GET    /batches/search?query=... - Search batches
POST   /batches              - Create batch
PUT    /batches/{id}         - Update batch
DELETE /batches/{id}         - Delete batch
```

**Batch Schema:**
```json
{
  "id": 1,
  "batchNumber": "B12345",
  "quantity": 100,
  "expireDate": "2025-12-31T00:00:00",
  "dateAdded": "2024-01-01T00:00:00",
  "medicineId": 1,
  "zoneId": 1
}
```

## Sensors & Readings

```
GET /sensors                          - List all sensors
GET /sensors/{id}                     - Get sensor by ID
GET /readings/sensor/{sensorId}       - Get all readings for sensor
GET /readings/sensor/{sensorId}/last  - Get last reading for sensor
GET /readings/zone/{zoneId}           - Get all readings for zone
GET /readings/zone/{zoneId}/last      - Get last readings for zone
```

**Reading Schema:**
```json
{
  "id": 1,
  "sensorId": 1,
  "temperature": 22.5,
  "humidity": 55.0,
  "timestamp": "2024-03-30T09:00:00"
}
```

## Alerts

```
GET    /alerts              - List all alerts
PATCH  /alerts/{id}/read    - Mark alert as read
DELETE /alerts/{id}         - Delete alert
```

## Users (Admin Only)

```
GET    /account/users?skip=0&take=50  - List users (paginated)
POST   /account                        - Create user
DELETE /account/{id}                   - Delete user
POST   /account/change-password        - Change password
POST   /account/roles                  - Change user roles
```

---

## Notes

- All endpoints require `Authorization: Bearer <token>` header except login
- Dates are in ISO 8601 format
- Pagination uses `skip` and `take` query parameters
- IDs are integers (except User.id which is string)
