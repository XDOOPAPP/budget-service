# 📊 API Documentation - Budget Service

## 📋 Tổng Quan

Budget Service cung cấp các RESTful API endpoints để quản lý ngân sách cá nhân, theo dõi chi tiêu theo danh mục và thời gian. Service này giúp người dùng kiểm soát tài chính và đạt được mục tiêu tiết kiệm.

**Base URL (qua API Gateway):** `http://localhost:3000/api/v1/budgets`

**Service Internal:** NestJS Microservice trên RabbitMQ queue `budget_queue`

---

## 🔐 Authentication

Service sử dụng authentication thông qua API Gateway với JWT token.

**Required Headers:**

```http
Authorization: Bearer {JWT_TOKEN}
x-user-id: {USER_ID}  # Được inject từ Gateway
```

---

## 📌 HTTP Endpoints

### Danh sách Endpoints

| Method | Endpoint                | Auth     | Description                     |
| ------ | ----------------------- | -------- | ------------------------------- |
| POST   | `/budgets`              | ✅       | Tạo ngân sách mới               |
| GET    | `/budgets`              | ✅       | Lấy danh sách ngân sách của tôi |
| GET    | `/budgets/:id`          | ✅       | Lấy chi tiết ngân sách          |
| GET    | `/budgets/:id/progress` | ✅       | Xem tiến độ ngân sách           |
| PUT    | `/budgets/:id`          | ✅       | Cập nhật ngân sách              |
| DELETE | `/budgets/:id`          | ✅       | Xóa ngân sách                   |
| GET    | `/budgets/admin/stats`  | ✅ Admin | Thống kê admin                  |

---

## 🔹 Endpoints Chi Tiết

### 1. Tạo Ngân Sách Mới

Tạo ngân sách cho một danh mục cụ thể với giới hạn chi tiêu.

**Endpoint:**

```http
POST /api/v1/budgets
```

**Headers:**

```http
Authorization: Bearer {token}
x-user-id: {userId}
Content-Type: application/json
```

**Request Body:**

```json
{
  "category": "FOOD",
  "amount": 5000000,
  "period": "MONTHLY",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-31T23:59:59.999Z"
}
```

**Body Parameters:**

| Field       | Type   | Required | Description                                                                                             |
| ----------- | ------ | -------- | ------------------------------------------------------------------------------------------------------- |
| `category`  | string | ✅       | Danh mục: `FOOD`, `TRANSPORT`, `ENTERTAINMENT`, `SHOPPING`, `BILLS`, `HEALTHCARE`, `EDUCATION`, `OTHER` |
| `amount`    | number | ✅       | Số tiền ngân sách (VND)                                                                                 |
| `period`    | string | ✅       | Chu kỳ: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`                                                          |
| `startDate` | string | ✅       | Ngày bắt đầu (ISO 8601)                                                                                 |
| `endDate`   | string | ✅       | Ngày kết thúc (ISO 8601)                                                                                |

**Response - 201 Created:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user123",
    "category": "FOOD",
    "amount": 5000000,
    "spent": 0,
    "remaining": 5000000,
    "period": "MONTHLY",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-31T23:59:59.999Z",
    "createdAt": "2026-01-22T10:30:00.000Z",
    "updatedAt": "2026-01-22T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-22T10:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Ngân sách đã tồn tại cho category và period
{
  "statusCode": 400,
  "message": "Budget already exists for this category and period",
  "timestamp": "2026-01-22T10:30:00.000Z"
}

// 400 Bad Request - Amount không hợp lệ
{
  "statusCode": 400,
  "message": "Amount must be greater than 0",
  "timestamp": "2026-01-22T10:30:00.000Z"
}

// 400 Bad Request - End date trước start date
{
  "statusCode": 400,
  "message": "End date must be after start date",
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

**Example cURL:**

```bash
curl -X POST http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "FOOD",
    "amount": 5000000,
    "period": "MONTHLY",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-31T23:59:59.999Z"
  }'
```

**Use Cases:**

- Đặt giới hạn chi tiêu hàng tháng cho đồ ăn
- Kiểm soát chi phí vận chuyển hàng tuần
- Quản lý ngân sách giải trí hàng năm

---

### 2. Lấy Danh Sách Ngân Sách

Lấy tất cả ngân sách của user với filter và pagination.

**Endpoint:**

```http
GET /api/v1/budgets
```

**Headers:**

```http
Authorization: Bearer {token}
x-user-id: {userId}
```

**Query Parameters:**

| Parameter  | Type   | Required | Default | Description          |
| ---------- | ------ | -------- | ------- | -------------------- |
| `category` | string | ❌       | -       | Filter theo danh mục |
| `period`   | string | ❌       | -       | Filter theo chu kỳ   |
| `page`     | number | ❌       | 1       | Số trang             |
| `limit`    | number | ❌       | 10      | Số lượng items/trang |

**Response - 200 OK:**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "userId": "user123",
      "category": "FOOD",
      "amount": 5000000,
      "spent": 3200000,
      "remaining": 1800000,
      "period": "MONTHLY",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T23:59:59.999Z",
      "progress": 64,
      "status": "ON_TRACK",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-22T10:30:00.000Z"
    },
    {
      "id": "uuid-2",
      "category": "TRANSPORT",
      "amount": 2000000,
      "spent": 2100000,
      "remaining": -100000,
      "period": "MONTHLY",
      "progress": 105,
      "status": "EXCEEDED",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T23:59:59.999Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "timestamp": "2026-01-22T11:00:00.000Z"
  }
}
```

**Example cURL:**

```bash
# Lấy tất cả budgets
curl -X GET "http://localhost:3000/api/v1/budgets" \
  -H "Authorization: Bearer {token}" \
  -H "x-user-id: user123"

# Filter theo category
curl -X GET "http://localhost:3000/api/v1/budgets?category=FOOD" \
  -H "Authorization: Bearer {token}" \
  -H "x-user-id: user123"

# Filter theo period
curl -X GET "http://localhost:3000/api/v1/budgets?period=MONTHLY&page=1&limit=20" \
  -H "Authorization: Bearer {token}" \
  -H "x-user-id: user123"
```

---

### 3. Lấy Chi Tiết Ngân Sách

Lấy thông tin chi tiết của một ngân sách cụ thể.

**Endpoint:**

```http
GET /api/v1/budgets/:id
```

**Headers:**

```http
Authorization: Bearer {token}
x-user-id: {userId}
```

**URL Parameters:**

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | ✅       | UUID của budget |

**Response - 200 OK:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user123",
    "category": "FOOD",
    "amount": 5000000,
    "spent": 3200000,
    "remaining": 1800000,
    "period": "MONTHLY",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-31T23:59:59.999Z",
    "progress": 64,
    "status": "ON_TRACK",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-22T10:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "Budget not found",
  "timestamp": "2026-01-22T11:00:00.000Z"
}

// 403 Forbidden - Không phải budget của user
{
  "statusCode": 403,
  "message": "You can only access your own budgets",
  "timestamp": "2026-01-22T11:00:00.000Z"
}
```

**Example cURL:**

```bash
curl -X GET http://localhost:3000/api/v1/budgets/{budgetId} \
  -H "Authorization: Bearer {token}" \
  -H "x-user-id: user123"
```

---

### 4. Xem Tiến Độ Ngân Sách

Lấy thông tin tiến độ chi tiêu so với ngân sách.

**Endpoint:**

```http
GET /api/v1/budgets/:id/progress
```

**Headers:**

```http
Authorization: Bearer {token}
x-user-id: {userId}
```

**URL Parameters:**

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | ✅       | UUID của budget |

**Response - 200 OK:**

```json
{
  "data": {
    "budgetId": "550e8400-e29b-41d4-a716-446655440000",
    "category": "FOOD",
    "amount": 5000000,
    "spent": 3200000,
    "remaining": 1800000,
    "progress": 64,
    "status": "ON_TRACK",
    "daysLeft": 9,
    "averageDailySpent": 145454.55,
    "projectedTotal": 4509090.91,
    "projectedStatus": "UNDER_BUDGET",
    "expenses": [
      {
        "id": "expense-1",
        "amount": 250000,
        "description": "Siêu thị",
        "date": "2026-01-20T10:00:00.000Z"
      },
      {
        "id": "expense-2",
        "amount": 150000,
        "description": "Nhà hàng",
        "date": "2026-01-21T12:00:00.000Z"
      }
    ]
  }
}
```

**Response Fields:**

| Field               | Type   | Description                                |
| ------------------- | ------ | ------------------------------------------ |
| `progress`          | number | Phần trăm đã chi (0-100+)                  |
| `status`            | string | `ON_TRACK`, `AT_RISK`, `EXCEEDED`          |
| `daysLeft`          | number | Số ngày còn lại trong period               |
| `averageDailySpent` | number | Chi tiêu trung bình mỗi ngày               |
| `projectedTotal`    | number | Dự kiến tổng chi tiêu cuối period          |
| `projectedStatus`   | string | `UNDER_BUDGET`, `ON_TARGET`, `OVER_BUDGET` |

**Example cURL:**

```bash
curl -X GET http://localhost:3000/api/v1/budgets/{budgetId}/progress \
  -H "Authorization: Bearer {token}" \
  -H "x-user-id: user123"
```

**Use Case:**

- Dashboard widget hiển thị progress bars
- Cảnh báo khi sắp vượt ngân sách
- Phân tích xu hướng chi tiêu

---

### 5. Cập Nhật Ngân Sách

Cập nhật thông tin ngân sách (amount, dates).

**Endpoint:**

```http
PATCH /api/v1/budgets/:id
```

**Headers:**

```http
Authorization: Bearer {token}
x-user-id: {userId}
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | ✅       | UUID của budget |

**Request Body (tất cả fields optional):**

```json
{
  "amount": 6000000,
  "endDate": "2026-01-31T23:59:59.999Z"
}
```

**Body Parameters:**

| Field       | Type   | Required | Description           |
| ----------- | ------ | -------- | --------------------- |
| `amount`    | number | ❌       | Số tiền ngân sách mới |
| `startDate` | string | ❌       | Ngày bắt đầu mới      |
| `endDate`   | string | ❌       | Ngày kết thúc mới     |

**Response - 200 OK:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 6000000,
    "spent": 3200000,
    "remaining": 2800000,
    "progress": 53.33,
    "updatedAt": "2026-01-22T12:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Amount must be greater than 0",
  "timestamp": "2026-01-22T12:00:00.000Z"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You can only update your own budgets",
  "timestamp": "2026-01-22T12:00:00.000Z"
}
```

**Example cURL:**

```bash
curl -X PATCH http://localhost:3000/api/v1/budgets/{budgetId} \
  -H "Authorization: Bearer {token}" \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 6000000
  }'
```

---

### 6. Xóa Ngân Sách

Xóa ngân sách đã tạo.

**Endpoint:**

```http
DELETE /api/v1/budgets/:id
```

**Headers:**

```http
Authorization: Bearer {token}
x-user-id: {userId}
```

**URL Parameters:**

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | ✅       | UUID của budget |

**Response - 200 OK:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Budget deleted successfully"
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "Budget not found",
  "timestamp": "2026-01-22T12:30:00.000Z"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You can only delete your own budgets",
  "timestamp": "2026-01-22T12:30:00.000Z"
}
```

**Example cURL:**

```bash
curl -X DELETE http://localhost:3000/api/v1/budgets/{budgetId} \
  -H "Authorization: Bearer {token}" \
  -H "x-user-id: user123"
```

---

### 7. Thống Kê Admin

Xem thống kê tổng quan về budgets (admin only).

**Endpoint:**

```http
GET /api/v1/budgets/admin/stats
```

**Headers:**

```http
Authorization: Bearer {admin_token}
x-user-id: {adminId}
```

**Response - 200 OK:**

```json
{
  "data": {
    "totalBudgets": 1523,
    "totalAmount": 7615000000,
    "totalSpent": 5234120000,
    "averageBudgetAmount": 5000000,
    "categoriesBreakdown": {
      "FOOD": { "count": 456, "totalAmount": 2280000000 },
      "TRANSPORT": { "count": 324, "totalAmount": 1296000000 },
      "ENTERTAINMENT": { "count": 243, "totalAmount": 1215000000 }
    },
    "periodBreakdown": {
      "MONTHLY": 1203,
      "WEEKLY": 215,
      "YEARLY": 105
    },
    "statusBreakdown": {
      "ON_TRACK": 856,
      "AT_RISK": 423,
      "EXCEEDED": 244
    }
  }
}
```

**Example cURL:**

```bash
curl -X GET http://localhost:3000/api/v1/budgets/admin/stats \
  -H "Authorization: Bearer {admin_token}" \
  -H "x-user-id: admin123"
```

---

## 💡 Use Cases & Examples

### Use Case 1: Tạo và Theo Dõi Ngân Sách Tháng

**Tạo Budget Tháng 1:**

```javascript
const createMonthlyBudget = async () => {
  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-01-31T23:59:59.999Z');

  const response = await fetch('http://localhost:3000/api/v1/budgets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-user-id': userId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category: 'FOOD',
      amount: 5000000,
      period: 'MONTHLY',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
  });

  const { data: budget } = await response.json();
  console.log(`Created budget: ${budget.id}`);
  return budget;
};
```

**Theo Dõi Progress:**

```javascript
const checkBudgetProgress = async (budgetId) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/budgets/${budgetId}/progress`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-user-id': userId,
      },
    },
  );

  const { data: progress } = await response.json();

  // Hiển thị warning nếu vượt 80%
  if (progress.progress >= 80) {
    showWarning(
      `Cảnh báo: Bạn đã chi ${progress.progress}% ngân sách ${progress.category}!`,
    );
  }

  // Hiển thị progress bar
  updateProgressBar(progress.progress, progress.status);

  return progress;
};
```

### Use Case 2: Dashboard Widget

**Display All Budgets with Progress:**

```javascript
const displayBudgetDashboard = async () => {
  const response = await fetch('http://localhost:3000/api/v1/budgets', {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-user-id': userId,
    },
  });

  const { data: budgets } = await response.json();

  budgets.forEach((budget) => {
    renderBudgetCard({
      category: budget.category,
      amount: formatCurrency(budget.amount),
      spent: formatCurrency(budget.spent),
      remaining: formatCurrency(budget.remaining),
      progress: budget.progress,
      status: budget.status,
      statusColor: getStatusColor(budget.status),
    });
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'ON_TRACK':
      return 'green';
    case 'AT_RISK':
      return 'orange';
    case 'EXCEEDED':
      return 'red';
    default:
      return 'gray';
  }
};
```

### Use Case 3: Cập Nhật Budget Khi Cần

```javascript
const increaseBudget = async (budgetId, newAmount) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/budgets/${budgetId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: newAmount }),
    },
  );

  if (response.ok) {
    const { data: updated } = await response.json();
    showSuccess(`Ngân sách đã được tăng lên ${formatCurrency(updated.amount)}`);
  }
};
```

---

## 🧪 Testing Examples

### Postman Collection

#### Test 1: Create Monthly Food Budget

```
POST http://localhost:3000/api/v1/budgets
Headers:
  Authorization: Bearer {token}
  x-user-id: user123
  Content-Type: application/json
Body:
{
  "category": "FOOD",
  "amount": 5000000,
  "period": "MONTHLY",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-31T23:59:59.999Z"
}
```

#### Test 2: Get All Budgets

```
GET http://localhost:3000/api/v1/budgets
Headers:
  Authorization: Bearer {token}
  x-user-id: user123
```

#### Test 3: Check Budget Progress

```
GET http://localhost:3000/api/v1/budgets/{budgetId}/progress
Headers:
  Authorization: Bearer {token}
  x-user-id: user123
```

#### Test 4: Update Budget Amount

```
PATCH http://localhost:3000/api/v1/budgets/{budgetId}
Headers:
  Authorization: Bearer {token}
  x-user-id: user123
  Content-Type: application/json
Body:
{
  "amount": 6000000
}
```

---

## 🔐 Security Best Practices

### 1. Authorization

- Users can only access their own budgets
- Admin endpoints require admin role
- Validate userId from token matches budget owner

### 2. Data Validation

- Amount must be positive number
- End date must be after start date
- Category must be valid enum value
- Prevent duplicate budgets for same category/period

### 3. Business Rules

- One budget per category per period
- Budget period must not overlap with existing budgets
- Cannot delete budget with associated expenses (optional)

---

## 📈 Performance Tips

### 1. Caching

- Cache budget progress calculations (5-minute TTL)
- Cache admin stats (15-minute TTL)
- Invalidate cache when expenses are added/updated

### 2. Database Indexing

- Composite index on (userId, category, period)
- Index on (userId, startDate, endDate)
- Index on status for filtering

### 3. Query Optimization

- Calculate spent amount efficiently
- Use aggregation for progress calculation
- Pagination for budget lists

---

## 📞 Support & Contact

- **Service Name:** Budget Service
- **Default Port:** 3005 (microservice), 3000 (via Gateway)
- **RabbitMQ Queue:** `budget_queue`
- **Database:** PostgreSQL (Prisma)

---

**Last Updated:** January 22, 2026  
**Version:** 1.0.0
