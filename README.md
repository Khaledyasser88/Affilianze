# Affiliance – Frontend

واجهة ويب لمنصة Affiliance (ربط المسوّقين بالمعلنين مع مطابقة حملات بالذكاء الاصطناعي)، مبنية حسب التصاميم من Figma.

## التشغيل

```bash
npm install
npm run dev
```

ثم افتح المتصفح على الرابط الذي يظهر (عادةً `http://localhost:5173`).

## الصفحات

- **الرئيسية** `/` – لاندنج: Hero، How it works، Why choose، About، FAQ، CTA
- **تسجيل الدخول** `/login`
- **إنشاء حساب** `/signup` – خطوتان: نوع الحساب (Marketer / Company) ثم التفاصيل
- **اتصل بنا** `/contact`
- **لوحة الشركة** `/company` – إدارة الحملات، إحصائيات، جدول الحملات
- **إنشاء حملة** `/company/campaigns/new` – 3 خطوات: Basic Info، Budget & Commission، Requirements
- **الملف الشخصي** `/profile` – للمسوّق: إحصائيات، مهارات، فئات، المحفظة
- **الإعدادات** `/settings` – الحساب، الأمان، الإشعارات، الدفع، الخصوصية

## ربط الـ API (مُفعّل)

الواجهة مربوطة بـ **Affiliance API** (OpenAPI v1).

1. انسخ `.env.example` إلى `.env` وضَع عنوان الـ API:
   ```
   VITE_API_BASE_URL=https://your-api-url.com
   ```
2. **المصادقة:** تسجيل الدخول يعيد JWT ويُحفظ في `localStorage` ويُرسل تلقائياً كـ `Authorization: Bearer <token>` مع كل طلب محمي.
3. **ما تم ربطه:**
   - **Account:** تسجيل الدخول، تسجيل مسوّق (multipart: FullName, Email, Password, PhoneNumber, NationalIdImage)، تسجيل شركة (multipart: CompanyName, Email, Password, Address, PhoneNumber, CommercialRegisterFile، اختياري: Website, TaxId, LogoFile)، تسجيل الخروج.
   - **Campaign:** قائمة حملات الشركة (`/api/Campaign/my-campaigns`)، إنشاء حملة (`CreateCampaignDto`)، فئات من (`/api/Category/roots`) في نموذج إنشاء الحملة.
   - **Company:** إحصائيات الشركة (`/api/Company/my-statistics`) في لوحة الشركة.
   - **Marketer:** داشبورد المسوّق (`/api/Marketer/my/dashboard`) ورصيد الدفع (`/api/Payment/balance`) في صفحة الملف الشخصي.
4. **العميل:** استيراد من `src/api/client.ts`:
   - `accountApi.login(email, password)` ، `registerMarketer(formData)` ، `registerCompany(formData)` ، `logout()`
   - `campaignApi.myCampaigns()` ، `create(dto)` ؛ `categoryApi.roots()` ؛ `companyApi.myStatistics()` ؛ `marketerApi.dashboard()` ؛ `paymentApi.balance()`
   - الأنواع في `src/api/types.ts`.

## البناء للإنتاج

```bash
npm run build
```

الملفات الناتجة في مجلد `dist/`.
