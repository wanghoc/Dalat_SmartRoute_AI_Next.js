# BAO CAO ACTOR - USECASE

## 1. Muc tieu tai lieu
Tai lieu nay tong hop va chuan hoa cac **Actor** va **Use case** cua he thong Dalat SmartRoute dua tren code hien co, phuc vu:
- Ve so do Use Case bang PlantUML/Mermaid.
- Bao ve phan tich he thong trong do an.
- Thong nhat cach hieu ve pham vi tac nhan va chuc nang.

## 2. Quy uoc phan loai actor
De tranh mo ho "vi sao co qua nhieu actor", tai lieu nay tach actor thanh 2 nhom:
- **Actor nghiep vu (human actor):** Nguoi su dung truc tiep he thong.
- **Actor tich hop ngoai he thong (external service actor):** Dich vu ben thu 3 ma he thong goi API.

> Luu y: Database/Prisma la thanh phan ha tang noi bo, **khong xem la actor nghiep vu chinh** trong so do use case muc business.

## 3. Danh sach actor chuan hoa

### 3.1 Actor nghiep vu
1. **Guest (Khach chua dang nhap)**
2. **User (Nguoi dung da dang nhap)**
3. **Admin (Quan tri vien)**

### 3.2 Actor tich hop ngoai he thong
4. **Weather API**
5. **AI Service (Gemini/Generative AI)**
6. **Maps Service (Google Maps link/directions)**

=> Tong khuyen nghi cho so do day du: **6 actor**.

Neu can so do gon de trinh bay tren slide: chi dung 3 actor nghiep vu (Guest/User/Admin).

## 4. Use case theo tung actor

## 4.1 Guest
- Browse places (xem danh sach dia diem)
- Search places (tim kiem dia diem)
- View place details (xem chi tiet dia diem)
- Read reviews (xem danh gia)
- View weather summary (xem thong tin thoi tiet)

Bang chung code:
- `src/app/(pages)/page.tsx`
- `src/app/api/places/route.ts`
- `src/app/(pages)/place/[id]/page.tsx`
- `src/views/Detail.jsx`
- `src/app/api/weather/route.ts`

## 4.2 User
- Register / Login / Logout
- View/Edit profile
- Favorite place / Unfavorite place
- Write review
- Delete own review
- Chat with AI assistant
- Get weather-based recommendations
- Create post (community)

Bang chung code:
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/context/AuthContext.jsx`
- `src/views/UserProfile.jsx`
- `src/app/api/favorites/route.ts`
- `src/app/api/reviews/route.ts`
- `src/app/api/chat/route.ts`
- `src/components/ChatWidget.jsx`
- `src/components/WritePostModal.jsx`

## 4.3 Admin
- Manage places (tao/sua/xoa)
- Manage users (danh sach, cap nhat role, khoa/mo)
- Moderate reviews (quan tri noi dung danh gia)

Bang chung code:
- `src/views/AdminPlaces.jsx`
- `src/app/api/admin/users/route.ts`
- `src/app/api/places/route.ts`
- `src/app/api/reviews/route.ts`

## 4.4 Weather API (external)
- Cung cap du lieu weather hien tai/du bao cho he thong

Bang chung code:
- `src/app/api/weather/route.ts`
- `src/app/api/weather/forecast/route.ts`
- `src/app/api/weather/forecast-detailed/route.ts`

## 4.5 AI Service (external)
- Sinh cau tra loi chat
- De xuat hanh trinh/goi y theo ngu canh

Bang chung code:
- `src/app/api/chat/route.ts`

## 4.6 Maps Service (external)
- Ho tro mo link ban do/chi duong

Bang chung code:
- `src/views/Detail.jsx`
- `src/views/AdminPlaces.jsx`

## 5. Ma tran Actor - Usecase (tom tat)

| Actor | Nhom | Use case chinh |
|---|---|---|
| Guest | Nghiep vu | Browse/Search place, View detail, Read review, View weather |
| User | Nghiep vu | Auth, Profile, Favorites, Reviews, Chat AI, Recommendation, Community post |
| Admin | Nghiep vu | Quan ly dia diem, quan ly user, dieu tiet danh gia |
| Weather API | Ngoai he thong | Cung cap du lieu weather/forecast |
| AI Service | Ngoai he thong | Chat va de xuat |
| Maps Service | Ngoai he thong | Link chi duong ban do |

## 6. Tai sao so do co nhieu actor?
- Neu chi can goc nhin nghiep vu co ban: dung 3 actor (Guest/User/Admin).
- Neu can dung kien truc tich hop thuc te: them Weather API, AI Service, Maps Service.
- Vi vay, so luong actor lon hon 3 la hop ly khi muc tieu so do la phan tich day du he thong.

## 7. Khuyen nghi dung trong bao cao
- **Ban bao cao tong quan:** dung 3 actor nghiep vu de de doc.
- **Ban ky thuat chi tiet:** dung day du 6 actor de phan anh tich hop ben ngoai.
- Giu ten use case o dang dong tu + bo ngu (vi du: "Write review", "Manage users") de nhat quan UML.
