# Recommendation API

## Lấy gợi ý món

`GET /api/recommendations/menu-items?limit=4`

- Yêu cầu Bearer token của customer.
- `limit`: 1–12, mặc định 4.
- Chỉ dùng đơn `delivered` trong 180 ngày gần nhất; user chưa có lịch sử nhận trending 30 ngày.

Response:

```json
{
  "data": [
    {
      "_id": "menuItemId",
      "name": "Tên món",
      "restaurantId": {
        "_id": "restaurantId",
        "name": "Tên quán",
        "slug": "ten-quan",
        "ratingSummary": { "average": 4.6, "count": 120 },
        "delivery": { "fee": 15000, "minMinutes": 20, "maxMinutes": 30 }
      },
      "reasonCode": "ordered_before",
      "reasonLabel": "Bạn từng đặt món này"
    }
  ],
  "meta": {
    "requestId": "uuid",
    "algorithmVersion": "history-hybrid-v1",
    "strategy": "history-hybrid",
    "personalized": true,
    "generatedAt": "ISO-8601"
  }
}
```

## Ghi nhận tương tác

`POST /api/recommendations/events`

```json
{
  "eventId": "uuid",
  "requestId": "uuid-from-recommendation-response",
  "algorithmVersion": "history-hybrid-v1",
  "surface": "home",
  "eventType": "impression",
  "menuItemId": "24-character-object-id",
  "position": 1
}
```

`eventType` nhận `impression`, `click` hoặc `add_to_cart`. API trả `202`; event trùng `eventId` không được ghi lại và tự hết hạn sau 90 ngày.
