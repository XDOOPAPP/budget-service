# 🚀 Hướng dẫn Test Budget Service (Siêu nhanh)

Tài liệu này hướng dẫn cách chạy và test Budget Service từ lúc mới clone code về.

## 1. Khởi chạy hệ thống (Docker)
-------- NHỚ CHẠY EXPENSE-SERVICE TRƯỚC ----------

Mở terminal và chạy theo thứ tự:

```powershell
# B1: Chạy hạ tầng (Database, RabbitMQ)
cd deployment
docker-compose up -d

# B2: Chạy API Gateway & Auth Service (Để lấy Login/Token)
cd ../api-gateway
docker-compose up -d

# B3: Chạy Budget Service
cd ../budget-service
docker-compose up -d --build
```

---

## 2. Khởi tạo Database (BẮT BUỘC)

Sau khi container đã chạy, bạn cần tạo bảng trong database:

```powershell
# Tạo bảng trong Database
docker exec -it budget-service npx prisma migrate deploy
docker exec -it budget-service npx prisma db push
```

---

## 3. Test trên Postman

### Bước 1: Lấy Token (Login)
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/user/login`
*   **Body (JSON):**
    ```json
    {
      "email": "admin@fepa.com",
      "password": "admin123"
    }
    ```
*   **Kết quả:** Copy chuỗi `access_token` trả về.

### Bước 2: Tạo Ngân Sách (Create Budget)
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/budgets`
*   **Headers:** `Authorization`: `Bearer <Token>`
*   **Body (JSON):**
    ```json
    {
      "name": "Ngân sách ăn uống tháng 1",
      "limitAmount": 5000000,
      "category": "food",
      "startDate": "2026-01-01",
      "endDate": "2026-01-31"
    }
    ```

### Bước 3: Xem danh sách ngân sách
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/budgets`
*   **Headers:** `Authorization`: `Bearer <Token>`

### Bước 4: Xem chi tiết một ngân sách
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/budgets/<ID_CỦA_BUDGET>`
*   **Headers:** `Authorization`: `Bearer <Token>`

### Bước 5: Cập nhật ngân sách
*   **Method:** `PUT`
*   **URL:** `http://localhost:3000/api/v1/budgets/<ID_CỦA_BUDGET>`
*   **Headers:** `Authorization`: `Bearer <Token>`
*   **Body (JSON):**
    ```json
    {
      "limitAmount": 6000000,
      "name": "Ăn uống tháng 1 (Tăng hạn mức)"
    }
    ```

### Bước 6: Xóa ngân sách
*   **Method:** `DELETE`
*   **URL:** `http://localhost:3000/api/v1/budgets/<ID_CỦA_BUDGET>`
*   **Headers:** `Authorization`: `Bearer <Token>`

### Bước 7: Kiểm tra tiến độ ngân sách (Progress)
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/budgets/<ID_CỦA_BUDGET>/progress`
*   **Headers:** `Authorization`: `Bearer <Token>`

---

## 💡 Lưu ý quan trọng
*   **Lỗi 500:** Nếu gặp lỗi này, hãy chạy lệnh `docker logs budget-service` để xem lỗi.
*   **Cổng kết nối:** 
    *   API Gateway: `3000` (Sử dụng để test tập trung).
    *   Budget Service Port (Internal): `3003`.
    *   RabbitMQ: `http://localhost:15672` (fepa/fepa123).
