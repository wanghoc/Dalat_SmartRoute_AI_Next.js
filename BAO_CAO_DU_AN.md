# Báo cáo dự án: Dalat SmartRoute AI

## I. Tóm tắt điều hành
Dalat SmartRoute AI là nền tảng web ứng dụng toàn phần (full‑stack) được thiết kế nhằm cung cấp dịch vụ gợi ý tham quan và khám phá điểm đến tại thành phố Đà Lạt, dựa trên ngữ cảnh thời tiết, thông tin địa địa và đóng góp từ cộng đồng người dùng. Hệ thống tích hợp khả năng tương tác với trợ lý AI để cung cấp các đề xuất cá nhân hóa và tư vấn thực tiễn. 

Kiến trúc kỹ thuật bao gồm: lớp trình bày sử dụng Next.js (App Router), lớp API backend với xử lý logic nghiệp vụ, lớp truy cập dữ liệu sử dụng Prisma ORM kết nối tới cơ sở dữ liệu PostgreSQL (Supabase), và các tích hợp dịch vụ bên ngoài như OpenWeather API và mô hình AI (Google Generative AI).

Báo cáo này trình bày mục tiêu, phạm vi, phân tích chức năng, kiến trúc hệ thống, tổ chức dữ liệu, luồng hoạt động và các khuyến nghị vận hành.

## II. Mục tiêu dự án

### 2.1 Mục tiêu chính
- Xây dựng nền tảng gợi ý du lịch thông minh, cá nhân hóa theo điều kiện thời tiết và sở thích người dùng, nhằm nâng cao chất lượng trải nghiệm du khách tại Đà Lạt.
- Tạo ra một hệ sinh thái dữ liệu cộng đồng (community-driven) thông qua các chức năng review, đánh giá và lưu danh sách yêu thích.

### 2.2 Mục tiêu kỹ thuật
- Xây dựng kiến trúc phần mềm có khả năng mở rộng (scalable), dễ bảo trì và độc lập về tính năng.
- Đảm bảo tính bảo mật thông tin người dùng thông qua xác thực JWT và quản lý quyền hạn (role-based access control).
- Tối ưu hóa chi phí vận hành thông qua việc sử dụng cơ sở hạ tầng quản lý (managed services) như Supabase.

### 2.3 Mục tiêu sản phẩm
- Cung cấp gợi ý địa điểm thông minh dựa trên dữ liệu thời tiết thực tế (mưa/nắng, nhiệt độ).
- Tích hợp trợ lý AI để sinh nội dung tư vấn dựa trên dữ liệu miền (domain-specific) và ngữ cảnh hiện tại.
- Cho phép người dùng xây dựng hồ sơ cá nhân với lịch sử yêu thích, đánh giá và các tuỳ chỉnh sở thích.

## III. Phạm vi dự án

### 3.1 Thành phần chính
- **Giao diện người dùng (UI):** Các trang web để tìm kiếm, duyệt danh sách, xem chi tiết địa điểm; chức năng đăng ký/đăng nhập; quản lý hồ sơ người dùng.
- **API Backend:** Các endpoint REST để xác thực, quản lý người dùng, địa điểm, review, favorite, dữ liệu thời tiết và gợi ý được cá nhân hóa.
- **Tầng dữ liệu:** Lược đồ cơ sở dữ liệu Prisma, các script migration/seed, vận hành trên nền tảng Supabase PostgreSQL.
- **Tích hợp bên ngoài:** Dịch vụ thời tiết OpenWeather, mô hình AI sinh nội dung.

### 3.2 Phạm vi loại trừ
- Hệ thống thanh toán, quản lý giao dịch tài chính.
- Ứng dụng di động (hiện tại chỉ là web).
- Hệ thống quản lý nội dung (CMS) cho quản trị viên; quản lý thông qua API và database trực tiếp.

## IV. Phân tích chức năng dự án

### 4.1 Xác thực & Quản lý người dùng
- **Đăng ký (Registration):** Người dùng tạo tài khoản bằng email/username và mật khẩu. Mật khẩu được mã hóa bằng bcryptjs trước khi lưu vào cơ sở dữ liệu.
- **Đăng nhập (Authentication):** Hệ thống xác minh thông tin đăng nhập và phát hành JWT token có thời gian sống 7 ngày.
- **Phân quyền (Authorization):** Hai loại vai trò: ADMIN (quản trị) và VISITOR (khách). Các endpoint nhạy cảm kiểm tra token JWT và vai trò trước khi thực thi.
- **Thay đổi mật khẩu & Thông tin tài khoản:** Người dùng xác thực có thể cập nhật thông tin cá nhân.

### 4.2 Quản lý địa điểm (Place Management)
- **CRUD địa điểm:** Quản trị viên tạo, cập nhật, xóa thông tin địa điểm. Mỗi địa điểm chứa thông tin như tiêu đề, mô tả, hình ảnh, vị trí địa lý (latitude/longitude), giờ mở cửa, liên hệ, đường dẫn Google Maps.
- **Phân loại:** Mỗi địa điểm gắn với một danh mục (Category) để hỗ trợ lọc và tổ chức.
- **Đánh giá động:** Hệ thống cập nhật điểm đánh giá trung bình (rating) và số lượng review dựa trên đóng góp của người dùng.
- **Hỗ trợ ngữ cảnh thời tiết:** Trường `indoorSuitable` cho biết địa điểm có phù hợp cho hoạt động trong nhà (mưa, nắng) hay không.

### 4.3 Đánh giá & Tương tác cộng đồng (Reviews & Community Engagement)
- **Tạo đánh giá:** Người dùng đã xác thực có thể viết đánh giá cho địa điểm, bao gồm tiêu đề, nội dung, điểm sao (1‑5) và ngôn ngữ.
- **Ghi nhận độ hữu ích:** Các người dùng khác có thể đánh dấu một review hữu ích, giúp xác định các đánh giá chất lượng cao.
- **Cập nhật điểm đánh giá tổng hợp:** Khi review mới được tạo, hệ thống tính toán lại rating trung bình và reviewCount của địa điểm.

### 4.4 Yêu thích (Favorites / Wishlist)
- **Lưu yêu thích:** Người dùng lưu các địa điểm yêu thích vào danh sách cá nhân.
- **Quản lý danh sách:** API cho phép xem, thêm, xóa các mục yêu thích.
- **Cô lập dữ liệu:** Mỗi người dùng chỉ thấy được danh sách yêu thích của chính họ.

### 4.5 API thời tiết & Gợi ý theo ngữ cảnh
- **Lấy dữ liệu thời tiết:** Hệ thống gọi OpenWeather API để lấy dữ liệu thời tiết hiện tại của Đà Lạt (nhiệt độ, độ ẩm, trạng thái - mưa/nắng).
- **Gợi ý thông minh:** Dựa trên điều kiện thời tiết, hệ thống lọc và ưu tiên các địa điểm:
  - Nếu mưa: ưu tiên những địa điểm indoor (indoorSuitable = true).
  - Nếu nắng: gợi ý các hoạt động ngoài trời.
  - Theo nhiệt độ: phù hợp với các hoạt động cụ thể.

### 4.6 Trợ lý AI (AI Assistant & Chat)
- **Tích hợp mô hình AI:** Sử dụng Google Generative AI (GEMINI) để sinh nội dung.
- **Ngữ cảnh miền:** API chat không chỉ tương tác chung chung mà kết hợp:
  - Thông tin địa điểm từ cơ sở dữ liệu.
  - Review và đánh giá từ cộng đồng.
  - Dữ liệu thời tiết hiện tại.
  - Dữ liệu miền được lưu trong `src/lib/data.json`.
- **Sinh gợi ý:** Trợ lý AI có thể tư vấn địa điểm dựa trên sở thích, thời tiết và lịch sử người dùng.

### 4.7 Quản trị & Công cụ nội bộ
- **Endpoint quản lý người dùng:** Xem, cập nhật, xóa tài khoản (chỉ admin).
- **Script provision/seed:** Tự động khởi tạo schema cơ sở dữ liệu, chạy migration, và nạp dữ liệu ban đầu.
- **Reset admin:** Script để reset mật khẩu admin khi cần.

## V. Kiến trúc hệ thống

### 5.1 Sơ đồ kiến trúc tổng quan
```
┌─────────────────────────────────────────────────────────┐
│                      Web Browser                        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/HTTPS
           ┌─────────────▼──────────────┐
           │   Next.js Frontend (SSR)   │
           │  - App Router              │
           │  - React Components        │
           │  - Context (Auth)          │
           └─────────────┬──────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │    Next.js API Routes (/api)      │
        │  - Authentication & JWT           │
        │  - Business Logic                 │
        │  - External API Integration       │
        └────────────────┬───────────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │    Prisma ORM                     │
        │  - Query Builder                  │
        │  - Schema Definition              │
        └────────────────┬───────────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │   PostgreSQL (Supabase)           │
        │  - User, Place, Category          │
        │  - Review, Favorite               │
        └───────────────────────────────────┘

        External Services:
        - OpenWeather API → Weather Data
        - Google Generative AI → Content Generation
```

### 5.2 Các tầng kiến trúc
1. **Tầng Trình bày (Presentation Layer):**
   - Sử dụng Next.js App Router để tổ chức các route theo tính năng.
   - React components xử lý rendering giao diện.
   - Context API quản lý trạng thái xác thực (AuthContext).
   - Hỗ trợ đa ngôn ngữ (i18next).

2. **Tầng API Backend (Application Layer):**
   - API routes nằm trong `src/app/api/` theo cấu trúc hệ thống tệp Next.js.
   - Mỗi endpoint xử lý logic nghiệp vụ cụ thể.
   - Middleware xác thực JWT kiểm tra token và vai trò.
   - Tích hợp các dịch vụ bên ngoài (OpenWeather, AI).

3. **Tầng truy cập dữ liệu (Data Access Layer):**
   - Prisma ORM định nghĩa schema và điều phối truy vấn.
   - Tránh viết SQL thô, giảm lỗi SQL injection.
   - Hỗ trợ migration version cho quản lý schema.

4. **Tầng cơ sở dữ liệu (Database Layer):**
   - PostgreSQL trên Supabase.
   - Hỗ trợ kết nối pooled (runtime) và direct (migration).

## VI. Tổ chức cơ sở dữ liệu

### 6.1 Lược đồ dữ liệu (Database Schema)

#### Model: User
```prisma
model User {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  username     String     @unique
  passwordHash String
  avatar       String?
  role         UserRole   @default(VISITOR)  // ADMIN | VISITOR
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  reviews      Review[]                       // 1-to-many
  favorites    Favorite[]                     // 1-to-many
}
```
**Mục đích:** Lưu trữ thông tin người dùng, xác thực và phân quyền.

#### Model: Category
```prisma
model Category {
  id     Int     @id @default(autoincrement())
  name   String  @unique                      // English name
  nameVi String                               // Vietnamese name
  places Place[]                              // 1-to-many
}
```
**Mục đích:** Phân loại địa điểm (ví dụ: Scenic Spots, Restaurants, Cafes).

#### Model: Place
```prisma
model Place {
  id            Int        @id @default(autoincrement())
  title         String
  titleVi       String?
  location      String
  locationVi    String?
  description   String
  descriptionVi String?
  imagePath     String
  googleMapsLink String?
  rating        Float      @default(0)       // Average rating
  reviewCount   Int        @default(0)       // Total reviews
  categoryId    Int
  category      Category   @relation(fields: [categoryId], references: [id])
  openingHours  String?
  phone         String?
  latitude      Float?
  longitude     Float?
  indoorSuitable Boolean  @default(false)   // Weather-based recommendation flag
  designerTip   String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  reviews       Review[]                     // 1-to-many
  favorites     Favorite[]                   // 1-to-many
}
```
**Mục đích:** Lưu trữ thông tin chi tiết các địa điểm du lịch.

#### Model: Review
```prisma
model Review {
  id        Int      @id @default(autoincrement())
  title     String?
  content   String
  rating    Int                              // 1-5 stars
  language  String   @default("en")
  helpful   Int      @default(0)             // Number of helpful votes
  tags      String   @default("[]")          // JSON array as string
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  placeId   Int
  place     Place    @relation(fields: [placeId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime   @updatedAt
}
```
**Mục đích:** Lưu trữ đánh giá, nhận xét của người dùng cho từng địa điểm.

#### Model: Favorite
```prisma
model Favorite {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  placeId   Int
  place     Place    @relation(fields: [placeId], references: [id])
  createdAt DateTime @default(now())
  @@unique([userId, placeId])                // Unique constraint: each user can only favorite a place once
}
```
**Mục đích:** Lưu danh sách địa điểm yêu thích của từng người dùng.

### 6.2 Quan hệ dữ liệu
```
User (1) ──────────────── (n) Review
User (1) ──────────────── (n) Favorite

Place (1) ──────────────── (n) Review
Place (1) ──────────────── (n) Favorite
Place (n) ──────────────── (1) Category
```

## VII. Liên kết Supabase với cơ sở dữ liệu

### 7.1 Cấu hình kết nối
Hệ thống sử dụng hai loại kết nối PostgreSQL:
- **Pooled URL** (`DATABASE_URL`): Sử dụng cho runtime, hỗ trợ connection pooling giúp quản lý kết nối hiệu quả trong môi trường production.
- **Direct URL** (`DIRECT_URL`): Sử dụng cho migration/seed, đảm bảo các tác vụ schema được thực thi đồng bộ.

### 7.2 Cơ chế ánh xạ biến môi trường
File `src/lib/prisma.ts` tự động ánh xạ các biến Supabase-centric sang format chuẩn Prisma:
```javascript
if (!process.env.DATABASE_URL && process.env.SUPABASE_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.SUPABASE_DATABASE_URL;
}
if (!process.env.DIRECT_URL && process.env.SUPABASE_DIRECT_URL) {
  process.env.DIRECT_URL = process.env.SUPABASE_DIRECT_URL;
}
```
Điều này cho phép khai báo biến Supabase mà không cần sửa đổi code Prisma.

### 7.3 Quá trình khởi tạo cơ sở dữ liệu
1. **Provision schema:** Script `scripts/db-provision.mjs` chạy migration hoặc db push để đưa schema từ `prisma/schema.prisma` lên Supabase.
2. **Seed dữ liệu:** Script `prisma/seed.js` chạy sau provision để nạp dữ liệu ban đầu (địa điểm, danh mục, tài khoản admin).
3. **Automated deployment:** Khi build trên Vercel, script `vercel-build` tự động chạy `db:provision:soft` để đảm bảo schema được cập nhật.

### 7.4 Quản lý migration
- Sử dụng `prisma migrate` để tạo và theo dõi các thay đổi schema.
- Các migration lưu trong `prisma/migrations/` với timestamp để dễ theo dõi.
- Script provision có cơ chế retry và fallback:
  - Ưu tiên `prisma migrate deploy`.
  - Nếu gặp lỗi kết nối hoặc schema, fallback sang `prisma db push`.

## VIII. Luồng hoạt động hệ thống

### 8.1 Luồng đăng ký người dùng
```
1. User nhập email/username/password → Frontend
2. Frontend gọi POST /api/auth/register
3. API xác thực input, hash mật khẩu (bcryptjs)
4. API tạo bản ghi User trong cơ sở dữ liệu
5. API trả về token JWT (thời gian sống 7 ngày)
6. Frontend lưu token vào context/localStorage
7. User được chuyển hướng đến trang chính
```

### 8.2 Luồng xem gợi ý theo thời tiết
```
1. User truy cập trang Recommendations
2. Frontend gọi GET /api/weather để lấy dữ liệu thời tiết
3. API gọi OpenWeather API với tọa độ Đà Lạt
4. API xử lý response, trả về trạng thái thời tiết
5. Frontend gọi GET /api/places/weather-recommendations?weather=rainy (hoặc sunny)
6. API lọc địa điểm theo indoorSuitable flag
7. Frontend hiển thị danh sách địa điểm được gợi ý
```

### 8.3 Luồng tạo review
```
1. User nhấn "Write Review" trên trang chi tiết địa điểm
2. Frontend hiển thị form, người dùng nhập title/content/rating
3. Frontend gọi POST /api/reviews với JWT token
4. API xác thực token → kiểm tra user đã đăng nhập
5. API validate dữ liệu review
6. API tạo bản ghi Review trong cơ sở dữ liệu
7. API tính toán lại rating trung bình và reviewCount của Place
8. API cập nhật Place record
9. API trả về kết quả; Frontend cập nhật giao diện
```

### 8.4 Luồng tương tác với trợ lý AI
```
1. User nhập câu hỏi vào chat widget
2. Frontend gọi POST /api/chat với message và JWT token
3. API xác thực người dùng
4. API thu thập:
   - Dữ liệu miền từ src/lib/data.json
   - Thông tin địa điểm từ cơ sở dữ liệu (Prisma)
   - Dữ liệu thời tiết hiện tại (OpenWeather)
5. API tạo prompt cho Google Generative AI (GEMINI) bao gồm ngữ cảnh
6. API gọi GEMINI API để sinh response
7. API trả về nội dung AI cho frontend
8. Frontend hiển thị câu trả lời trong chat
```

### 8.5 Luồng quản lý yêu thích
```
1. User nhấn "Add to Favorite" trên trang chi tiết
2. Frontend gọi POST /api/favorites với placeId và JWT token
3. API xác thực người dùng
4. API tạo bản ghi Favorite (userId, placeId)
5. Nếu favorite đã tồn tại, API xóa nó (toggle behavior)
6. API trả về status; Frontend cập nhật UI (heart icon)
```

## IX. Công nghệ & Dependencies

| Thành phần | Công nghệ | Phiên bản |
|-----------|-----------|----------|
| Framework | Next.js | 16.2.4 |
| Runtime UI | React | 19.2.4 |
| Database ORM | Prisma | 5.7.0 |
| Database | PostgreSQL (Supabase) | Latest |
| Auth | JWT (jsonwebtoken) | 9.0.3 |
| Hashing | bcryptjs | 3.0.3 |
| AI | Google Generative AI | 0.24.1 |
| i18n | i18next | 26.0.6 |
| CSS | Tailwind CSS | 4 |
| Markdown | react-markdown | 10.1.0 |

## X. Ưu điểm & Hạn chế

### 10.1 Ưu điểm
- **Kiến trúc rõ ràng:** Tách biệt các tầng giữa frontend, API, dữ liệu giúp dễ bảo trì và mở rộng.
- **Tích hợp thời tiết & AI:** Cho phép gợi ý ngữ cảnh, nâng cao trải nghiệm người dùng.
- **Quản lý schema linh hoạt:** Sử dụng Prisma giúp quản lý migration và seed dữ liệu dễ dàng.
- **Bảo mật:** JWT-based authentication, role-based authorization, password hashing.
- **Khả năng mở rộng:** Hỗ trợ thêm các model dữ liệu, endpoint hoặc dịch vụ bên ngoài.

### 10.2 Hạn chế
- **Thiếu observability:** Cần bổ sung logging, error tracking (ví dụ Sentry), metrics monitoring.
- **Không có caching:** Các gọi tới OpenWeather và AI không được cache, dẫn đến chi phí cao và tốc độ chậm.
- **Thiếu test tự động:** Không có unit/integration test, tăng rủi ro khi thay đổi code.
- **Giới hạn rate limiting:** Không có cơ chế rate limiting cho API, dễ bị abuse.
- **Dokumentasi code:** Cần thêm JSDoc comments và API documentation.

## XI. Khuyến nghị & Hướng phát triển

### 11.1 Ngắn hạn (1-2 tháng)
1. **Thêm caching:** Sử dụng Redis để cache kết quả thời tiết (15 phút) và gợi ý (1 giờ).
2. **Bổ sung logging:** Tích hợp Pino hoặc Winston để ghi log, sử dụng Sentry để tracking error.
3. **Rate limiting:** Thêm middleware rate-limit cho API endpoints.
4. **API documentation:** Tạo Swagger/OpenAPI documentation cho các endpoint.

### 11.2 Trung hạn (3-6 tháng)
1. **CI/CD pipeline:** Thiết lập GitHub Actions để chạy lint, test, migration trước deploy.
2. **Unit & Integration tests:** Viết test cho các business logic chính (auth, reviews, recommendations).
3. **Performance optimization:** Profile API endpoints, optimize database queries, implement pagination.
4. **Mobile app:** Phát triển ứng dụng React Native dùng chung backend API.

### 11.3 Dài hạn (6-12 tháng)
1. **ML/Analytics:** Phân tích dữ liệu user behavior để cải thiện recommendations.
2. **Recommendation engine:** Thay thế hardcoded rules bằng collaborative filtering hoặc content-based recommendation.
3. **Multi-language support:** Mở rộng hỗ trợ ngôn ngữ (hiện tại chỉ EN/VI).
4. **Admin dashboard:** Xây dựng giao diện quản trị để thêm/sửa/xóa địa điểm mà không cần code.

## XII. Kết luận

Dalat SmartRoute AI đã xây dựng được nền tảng kỹ thuật vững chắc với kiến trúc full-stack rõ ràng, tích hợp thành công các dịch vụ AI và thời tiết. Hệ thống hiện tại đủ tiềm năng để phục vụ những người dùng ban đầu và có khả năng mở rộng theo nhu cầu.

Để đưa sản phẩm tới giai đoạn production và mở rộng quy mô, cần ưu tiên:
1. **Hoàn thiện observability & monitoring** để phát hiện vấn đề sớm.
2. **Tối ưu hóa chi phí** thông qua caching và quản lý rate limits.
3. **Bổ sung test tự động** để giảm rủi ro khi phát triển tính năng mới.
4. **Xây dựng CI/CD pipeline** để tự động hóa quy trình deploy.

Với những cải tiến này, Dalat SmartRoute AI có thể trở thành một nền tảng gợi ý du lịch tiêu biểu, kết hợp hiệu quả dữ liệu, cộng đồng và công nghệ AI.

---

**Tài liệu tham chiếu:**
- Prisma Schema: `prisma/schema.prisma`
- API Routes: `src/app/api/`
- Configuration: `src/lib/prisma.ts`, `src/lib/auth.ts`
- Database Provision: `scripts/db-provision.mjs`, `prisma/seed.js`
- Package Configuration: `package.json`, `next.config.ts`
