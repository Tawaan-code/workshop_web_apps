# TaskFlow • ASP.NET Core Web API & Modern To-Do Web App

โปรเจกต์เว็บแอปพลิเคชันจัดการรายการงาน (To-Do List) พัฒนาด้วย **ASP.NET Core Web API (.NET 10)** พร้อมระบบฐานข้อมูลจำลองในหน่วยความจำ (EF Core In-Memory Database) และหน้าบ้าน **Web UI** ที่สวยงาม ทันสมัย ใช้งานง่าย

---

## 🌟 ฟีเจอร์เด่น (Key Features)

### 🖥️ Frontend (Web UI)
- **Modern Glassmorphism UI:** ดีไซน์เรียบหรู รองรับทั้ง Dark Mode และ Light Mode
- **Real-time Task Management:** เพิ่ม, แก้ไข, ลบ และทำเครื่องหมายเสร็จสิ้น
- **Interactive Celebration:** เอฟเฟกต์ Confetti ฉลองเมื่องานสำเร็จ 🎉
- **Search & Filter:** ระบบค้นหาแบบเรียลไทม์ และตัวกรองแยกตามหมวดหมู่ (Work, Study, Personal, Urgent)
- **Progress Dashboard:** สรุปสถิติจำนวนงานทั้งหมด และแถบแสดงเปอร์เซ็นต์ความคืบหน้ารวม
- **API Documentation Shortcuts:** ลิงก์ตรงเข้าสู่ Swagger UI และ Scalar Docs ที่มุมขวาบน

### ⚙️ Backend (ASP.NET Core Minimal API)
- **.NET 10 Minimal APIs** สำหรับการทำงานที่รวดเร็วและกระชับ
- **Entity Framework Core In-Memory Database** สำหรับจัดเก็บข้อมูลในหน่วยความจำ
- **OpenAPI 3.1 & Interactive Docs:**
  - **Swagger UI:** `/swagger`
  - **Scalar API Reference:** `/scalar`
- **Static Files Middleware:** เสิร์ฟหน้าเว็บ Frontend ผ่าน `wwwroot` อัตโนมัติ

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── TodoApi/
│   ├── Program.cs                  # กำหนดการตั้งค่า Services, Middleware และ CRUD Endpoints
│   ├── TodoApi.csproj              # กำหนด Packages และ Target Framework (.NET 10)
│   ├── Properties/
│   │   └── launchSettings.json     # กำหนด Port (HTTP: 5066, HTTPS: 7083)
│   └── wwwroot/                    # ไฟล์หน้าเว็บ Frontend
│       ├── index.html              # โครงสร้างหน้าเว็บ Semantic HTML5
│       ├── css/
│       │   └── style.css           # ดีไซน์ระบบ UI, ธีม Dark/Light และ Animations
│       └── js/
│           └── app.js              # ระบบควบคุมการทำงาน และเชื่อมต่อ REST API
├── .gitignore                      # กรองไฟล์ที่ไม่จำเป็น เช่น bin, obj, user settings
└── README.md                       # เอกสารแนะนำและคู่มือการใช้งาน
```

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Getting Started)

### ความต้องการพื้นฐาน (Prerequisites)
- [.NET 10 SDK](https://dotnet.microsoft.com/download)

### ขั้นตอนการรัน
1. Clone หรือเปิดโฟลเดอร์โปรเจกต์:
   ```bash
   git clone https://github.com/Tawaan-code/workshop_web_apps.git
   cd workshop_web_apps/TodoApi
   ```

2. รันโปรเจกต์ด้วยคำสั่ง:
   ```bash
   dotnet run
   ```

3. เปิดเบราว์เซอร์เข้าใช้งาน:
   - **หน้าเว็บ To-Do List (Web UI):** [http://localhost:5066](http://localhost:5066)
   - **Swagger UI:** [http://localhost:5066/swagger](http://localhost:5066/swagger)
   - **Scalar API Docs:** [http://localhost:5066/scalar](http://localhost:5066/scalar)

---

## 📡 API Endpoints

| Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- |
| `GET` | `/api/todos` | ดึงรายการงานทั้งหมด (รองรับ query `search`, `completed`, `category`) |
| `GET` | `/api/todos/{id}` | ดึงข้อมูลงานตาม ID |
| `POST` | `/api/todos` | สร้างงานใหม่ |
| `PUT` | `/api/todos/{id}` | อัปเดตข้อมูลงาน |
| `PUT` | `/api/todos/{id}/toggle` | สลับสถานะ เสร็จสิ้น / ยังไม่เสร็จ |
| `DELETE` | `/api/todos/{id}` | ลบงานตาม ID |
| `DELETE` | `/api/todos/completed` | ลบงานที่เสร็จสิ้นแล้วทั้งหมด |
