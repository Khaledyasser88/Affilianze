

export namespace Types {
export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
}

export interface PlatformOverviewDto {
  totalUsers?: number;
  totalCompanies?: number;
  totalMarketers?: number;
  totalCampaigns?: number;
  activeCampaigns?: number;
  totalRevenue?: number;
  totalPayouts?: number;
  pendingWithdrawals?: number;
  platformFeeTotal?: number;
}

export interface RevenueBreakdownDto {
  totalVolume?: number;
  platformFees?: number;
  netRevenue?: number;
  marketerEarnings?: number;
  startDate?: string;
  endDate?: string;
  dailyData?: Record<string, number> | null;
}

export interface TopPerformerDto {
  id?: number;
  name?: string | null;
  type?: string | null;
  totalEarnings?: number;
  totalSpend?: number;
  conversions?: number;
  score?: number;
}

export interface ComplaintDto {
  id?: number;
  complainantId?: number;
  complainantName?: string | null;
  defendantId?: number;
  defendantName?: string | null;
  campaignId?: number | null;
  campaignTitle?: string | null;
  subject?: string | null;
  description?: string | null;
  status?: ComplaintStatus;
  resolutionNote?: string | null;
  createdAt?: string;
}

export interface WithdrawalDto {
  id?: number;
  marketerId?: number;
  marketerName?: string | null;
  amount?: number;
  status?: WithdrawalStatus;
  paymentMethodId?: number;
  paymentMethod?: PaymentMethodDto;
  createdAt?: string;
  processedAt?: string | null;
  adminNotes?: string | null;
  transactionId?: string | null;
}

export interface PaymentMethodDto {
  id?: number;
  type?: PaymentMethodType;
  accountDetails?: string | null;
  accountHolderName?: string | null;
  isDefault?: boolean;
}

export interface WithdrawalDtoPagedResult {
  items?: WithdrawalDto[] | null;
  data?: WithdrawalDto[] | null; 
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface FinancialReportDto {
  totalProcessed?: number;
  totalFeesEarned?: number;
  totalPayouts?: number;
  totalRevenue?: number;
  periodStart?: string;
  periodEnd?: string;
  dailyReports?: Record<string, number> | null;
}

export interface ConversionFunnelDto {
  totalViews?: number;
  uniqueVisitors?: number;
  clicks?: number;
  applications?: number;
  conversions?: number;
  viewToClickRate?: number;
  clickToApplicationRate?: number;
  applicationToCompletionRate?: number;
  overallConversionRate?: number;
}

export interface NotificationDto {
  id?: number;
  title?: string | null;
  message?: string | null;
  type?: NotificationType;
  isRead?: boolean;
  createdAt?: string;
  data?: string | null;
}

export interface NotificationDtoPagedResult {
  items?: NotificationDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

export interface AiSuggestionDto {
  campaignId?: number;
  campaignTitle?: string | null;
  matchScore?: number;
  matchReason?: string | null;
}

export interface AiSuggestionDtoPagedResult {
  data?: AiSuggestionDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface AiSuggestionDtoPagedResultApiResponse {
  success?: boolean;
  message?: string | null;
  data?: AiSuggestionDtoPagedResult;
}

export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface AverageRatingDto {
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: Record<string, number> | null;
}

export interface AverageRatingDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: AverageRatingDto;
}

export interface BooleanApiResponse {
  success?: boolean;
  message?: string | null;
  data?: boolean;
}

export interface CampaignApplicationActionDto {
  applicationId: number;
  note?: string | null;
}

export interface CampaignApplicationDto {
  id?: number;
  marketerId?: number;
  campaignId?: number;
  campaignTitle?: string | null;
  status?: ApplicationStatus;
  appliedAt?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectReason?: string | null;
  marketerName?: string | null;
  marketerNiche?: string | null;
  marketerPerformanceScore?: number | null;
}

export interface CampaignApplicationDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CampaignApplicationDto;
}

export interface CampaignApplicationDtoPagedResult {
  data?: CampaignApplicationDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface CampaignApplicationDtoPagedResultApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CampaignApplicationDtoPagedResult;
}

export interface CampaignDetailsDto {
  id?: number;
  title?: string | null;
  description?: string | null;
  commissionType?: CommissionType;
  commissionValue?: number;
  budget?: number | null;
  startDate?: string;
  endDate?: string;
  status?: CampaignStatus;
  promotionalMaterials?: string | null;
  trackingBaseUrl?: string | null;
  responseNote?: string | null;
  createdAt?: string;
  companyId?: number;
  companyName?: string | null;
  categoryId?: number;
  categoryName?: string | null;
  applicationsCount?: number;
  acceptedApplicationsCount?: number;
  isActive?: boolean;
  daysRemaining?: number | null;
  approvedByName?: string | null;
  company?: CompanyBasicDto;
  category?: CategoryDto;
  statistics?: CampaignStatisticsDto;
}

export interface CampaignDetailsDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CampaignDetailsDto;
}

export interface CampaignDto {
  id?: number;
  title?: string | null;
  description?: string | null;
  commissionType?: CommissionType;
  commissionValue?: number;
  budget?: number | null;
  startDate?: string;
  endDate?: string;
  status?: CampaignStatus;
  promotionalMaterials?: string | null;
  trackingBaseUrl?: string | null;
  responseNote?: string | null;
  createdAt?: string;
  companyId?: number;
  companyName?: string | null;
  categoryId?: number;
  categoryName?: string | null;
  applicationsCount?: number;
  acceptedApplicationsCount?: number;
  isActive?: boolean;
  daysRemaining?: number | null;
  approvedByName?: string | null;
}

export interface CampaignDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CampaignDto;
}

export interface CampaignDtoPagedResult {
  items?: CampaignDto[] | null;
  data?: CampaignDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface CampaignDtoPagedResultApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CampaignDtoPagedResult;
}

export interface CampaignStatisticsDto {
  totalApplications?: number;
  pendingApplications?: number;
  acceptedApplications?: number;
  rejectedApplications?: number;
  withdrawnApplications?: number;
  totalClicks?: number;
  totalConversions?: number;
  totalEarnings?: number;
  totalSpent?: number;
  remainingBudget?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  conversionRate?: number | null;
  averageRoi?: number | null;
}

export interface CampaignStatisticsDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CampaignStatisticsDto;
}

export type CampaignStatus = 'Pending' | 'Active' | 'Inactive' | 'Paused' | 'Completed' | 'Rejected';

export interface CategoryDetailsDto {
  id?: number;
  nameEn?: string | null;
  nameAr?: string | null;
  slug?: string | null;
  icon?: string | null;
  parentId?: number | null;
  parentName?: string | null;
  childrenCount?: number;
  campaignsCount?: number;
  children?: CategoryDto[] | null;
  parent?: CategoryDto;
}

export interface CategoryDetailsDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CategoryDetailsDto;
}

export interface CategoryDto {
  id?: number;
  nameEn?: string | null;
  nameAr?: string | null;
  slug?: string | null;
  icon?: string | null;
  parentId?: number | null;
  parentName?: string | null;
  childrenCount?: number;
  campaignsCount?: number;
}

export interface CategoryDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CategoryDto;
}

export interface CategoryDtoIEnumerableApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CategoryDto[] | null;
}

export interface CategoryTreeDto {
  rootCategories?: CategoryTreeNodeDto[] | null;
}

export interface CategoryTreeDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CategoryTreeDto;
}

export interface CategoryTreeNodeDto {
  id?: number;
  nameEn?: string | null;
  nameAr?: string | null;
  slug?: string | null;
  icon?: string | null;
  parentId?: number | null;
  parentName?: string | null;
  childrenCount?: number;
  campaignsCount?: number;
  children?: CategoryTreeNodeDto[] | null;
}

export interface ChangePasswordDto {
  userId?: string | null;
  currentPassword: string;
  newPassword: string;
}

export type CommissionType = 'Percentage' | 'Fixed';

export interface CompanyActionDto {
  note?: string | null;
  responseNotes?: string | null;
}

export interface CompanyApprovalDto {
  id?: number;
  campanyName?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  taxId?: string | null;
  description?: string | null;
  commercialRegister?: string | null;
  logoUrl?: string | null;
  createdAt?: string;
  userEmail?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  status?: string | null;
  isVerified?: boolean;
}

export interface CompanyApprovalDtoPagedResult {
  data?: CompanyApprovalDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface CompanyApprovalDtoPagedResultApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CompanyApprovalDtoPagedResult;
}

export interface CompanyBasicDto {
  id?: number;
  companyName?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  isVerified?: boolean;
}

export interface CompanyDetailsDto {
  id?: number;
  campanyName?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  taxId?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  activeCampaignsCount?: number;
  totalCampaignsCount?: number;
  totalMarketerApplicationsCount?: number;
  approvedApplicationsCount?: number;
  averageConversionRate?: number;
  totalEarnings?: number;
  averageRating?: number;
  userEmail?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
}

export interface CompanyDetailsDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CompanyDetailsDto;
}

export interface CompanyDto {
  id?: number;
  campanyName?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CompanyDto;
}

export interface CompanyDtoPagedResult {
  data?: CompanyDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface CompanyDtoPagedResultApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CompanyDtoPagedResult;
}

export interface CompanyStatisticsDto {
  companyId?: number;
  companyName?: string | null;
  activeCampaignsCount?: number;
  pausedCampaignsCount?: number;
  completedCampaignsCount?: number;
  rejectedCampaignsCount?: number;
  totalApplicationsCount?: number;
  approvedApplicationsCount?: number;
  pendingApplicationsCount?: number;
  rejectedApplicationsCount?: number;
  approvalRate?: number;
  activeMarketersCount?: number;
  totalRevenue?: number;
  totalCommissionPaid?: number;
  averageConversionRate?: number;
  averageROI?: number;
  averageRating?: number;
  fromDate?: string;
  toDate?: string;
  totalClicks?: number;
  totalConversions?: number;
}

export interface CompanyStatisticsDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: CompanyStatisticsDto;
}

export type ComplaintStatus = 'Open' | 'InReview' | 'Resolved' | 'Dismissed' | 'ActionTaken';

export interface CreateCampaignDto {
  title: string;
  description?: string | null;
  categoryId: number;
  commissionType: CommissionType;
  commissionValue: number;
  budget?: number | null;
  startDate: string;
  endDate: string;
  promotionalMaterials?: string | null;
  trackingBaseUrl?: string | null;
}

export interface CreateCategoryDto {
  nameEn: string;
  nameAr: string;
  slug: string;
  icon?: string | null;
  parentId?: number | null;
}

export interface CreateComplaintDto {
  defendantId: number;
  campaignId?: number | null;
  subject: string;
  description: string;
  evidence?: string | null;
}

export interface CreatePaymentMethodDto {
  type: PaymentMethodType;
  accountDetails: string;
  accountHolderName?: string | null;
  setAsDefault?: boolean;
}

export interface CreateWithdrawalRequestDto {
  amount: number;
  paymentMethodId: number;
  notes?: string | null;
}

export interface DailyStatisticsDto {
  date?: string;
  clicks?: number;
  conversions?: number;
  earnings?: number;
}

export interface EarningsByPeriodDto {
  period?: string | null;
  earnings?: number;
  conversions?: number;
}

export interface EarningsReportDto {
  totalEarnings?: number;
  earningsByPeriod?: EarningsByPeriodDto[] | null;
}

export interface EarningsReportDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: EarningsReportDto;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
}

export interface MarketerDashboardDto {
  totalEarnings?: number;
  balance?: number;
  activeCampaigns?: number;
  totalApplications?: number;
  pendingApplications?: number;
  acceptedApplications?: number;
  performanceScore?: number;
  averageRating?: number;
  recentActivities?: RecentActivityDto[] | null;
}

export interface MarketerDashboardDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: MarketerDashboardDto;
}

export interface MarketerProfileDto {
  id?: number;
  userId?: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profilePicture?: string | null;
  balance?: number;
  bio?: string | null;
  niche?: string | null;
  totalEarnings?: number;
  performanceScore?: number;
  cvPath?: string | null;
  nationalIdPath?: string | null;
  socialLinks?: string | null;
  skillsExtracted?: string | null;
  personalityScore?: number | null;
  personalityTestTaken?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}

export interface MarketerProfileDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: MarketerProfileDto;
}

export interface MarketerPublicDto {
  id?: number;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
  bio?: string | null;
  niche?: string | null;
  performanceScore?: number;
  socialLinks?: string | null;
  skillsExtracted?: string | null;
  personalityScore?: number | null;
  isVerified?: boolean;
  averageRating?: number;
  reviewsCount?: number;
}

export interface MarketerPublicDtoPagedResult {
  data?: MarketerPublicDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface MarketerPublicDtoPagedResultApiResponse {
  success?: boolean;
  message?: string | null;
  data?: MarketerPublicDtoPagedResult;
}

export interface MarketerStatisticsDto {
  totalApplications?: number;
  acceptedApplications?: number;
  rejectedApplications?: number;
  totalClicks?: number;
  totalConversions?: number;
  totalEarnings?: number;
  averageEarningsPerConversion?: number;
  conversionRate?: number;
}

export interface MarketerStatisticsDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: MarketerStatisticsDto;
}

export type NotificationType = 'System' | 'CampaignUpdate' | 'ApplicationStatus' | 'NewEarning' | 'ComplaintUpdate' | 'AiMatch' | 'WithdrawalStatus' | 'ReviewReceived' | 'All';

export interface ObjectApiResponse {
  success?: boolean;
  message?: string | null;
  data?: any | null;
}

export type PaymentMethodType = 'BankAccount' | 'Ewallet' | 'Paypal' | 'MobileMoney' | 'Other';

export interface PerformanceHistoryDto {
  date?: string;
  performanceScore?: number;
}

export interface PerformanceHistoryDtoListApiResponse {
  success?: boolean;
  message?: string | null;
  data?: PerformanceHistoryDto[] | null;
}

export interface PersonalityTestAnswerDto {
  questionId?: number;
  answer?: number;
}

export interface PersonalityTestDto {
  answers?: PersonalityTestAnswerDto[] | null;
}

export interface PersonalityTestResultDto {
  personalityScore?: number;
  personalityType?: string | null;
  description?: string | null;
  testDate?: string;
}

export interface PersonalityTestResultDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: PersonalityTestResultDto;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
}

export interface ProcessWithdrawalDto {
  isApproved: boolean;
  reason?: string | null;
  adminNotes?: string | null;
  transactionId?: string | null;
}

export interface RecentActivityDto {
  type?: string | null;
  description?: string | null;
  date?: string;
}

export interface ResolveComplaintDto {
  status: ComplaintStatus;
  resolutionNote: string;
}

export interface ReviewDto {
  id?: number;
  reviewerId?: number;
  reviewerName?: string | null;
  reviewedId?: number;
  campaignId?: number | null;
  campaignTitle?: string | null;
  rating?: number;
  comment?: string | null;
  createdAt?: string;
}

export interface ReviewDtoPagedResult {
  data?: ReviewDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface ReviewDtoPagedResultApiResponse {
  success?: boolean;
  message?: string | null;
  data?: ReviewDtoPagedResult;
}

export interface StringApiResponse {
  success?: boolean;
  message?: string | null;
  data?: string | null;
}

export interface TrackingLinkDto {
  id?: number;
  campaignId?: number;
  campaignTitle?: string | null;
  uniqueLink?: string | null;
  clicks?: number;
  conversions?: number;
  earnings?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface TrackingLinkDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: TrackingLinkDto;
}

export interface TrackingLinkDtoPagedResult {
  data?: TrackingLinkDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface TrackingLinkDtoPagedResultApiResponse {
  success?: boolean;
  message?: string | null;
  data?: TrackingLinkDtoPagedResult;
}

export interface TrackingLinkStatisticsDto {
  totalClicks?: number;
  totalConversions?: number;
  totalEarnings?: number;
  conversionRate?: number;
  dailyStatistics?: DailyStatisticsDto[] | null;
}

export interface TrackingLinkStatisticsDtoApiResponse {
  success?: boolean;
  message?: string | null;
  data?: TrackingLinkStatisticsDto;
}

export interface UpdateCampaignDto {
  title?: string | null;
  description?: string | null;
  categoryId?: number | null;
  commissionType?: CommissionType;
  commissionValue?: number | null;
  budget?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  promotionalMaterials?: string | null;
  trackingBaseUrl?: string | null;
}

export interface UpdateCategoryDto {
  nameEn?: string | null;
  nameAr?: string | null;
  slug?: string | null;
  icon?: string | null;
  parentId?: number | null;
}

export interface UpdateCompanyDto {
  campanyName?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  description?: string | null;
  contactEmail?: string | null;
}

export interface UpdateMarketerProfileDto {
  bio?: string | null;
  niche?: string | null;
  socialLinks?: string | null;
  skillsExtracted?: string | null;
}

export interface UpdateNotificationPreferenceDto {
  notificationType: NotificationType;
  isEmailEnabled?: boolean | null;
  isPushEnabled?: boolean | null;
  isInAppEnabled?: boolean | null;
}

export interface UpdatePaymentMethodDto {
  accountHolderName?: string | null;
  setAsDefault?: boolean | null;
}

export type WithdrawalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Completed' | 'Failed';




}

export const API_BASE_URL = import.meta.env.PROD ? '' : ((import.meta.env.VITE_API_BASE_URL as string) || '');

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url
  
  const base = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL as string || '').replace(/\/$/, '')
  return base ? `${base}${url.startsWith('/') ? '' : '/'}${url}` : `${url.startsWith('/') ? '' : '/'}${url}`
}
const TOKEN_KEY = 'affiliance_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit & { skipUnwrap?: boolean } = {}
): Promise<T> {
  const { skipUnwrap, ...init } = options;
  // In development, we use relative paths for /api calls to let the Vite proxy (in vite.config.ts) handle it.
  // This avoids CORS issues on the browser side.
  const useProxy = import.meta.env.DEV && path.startsWith('/api');
  const url = useProxy ? path : (API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}${path}` : path);
  const token = getToken();
  const headers: Record<string, string> = {};
  
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string>) },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (networkErr: any) {
    clearTimeout(timeoutId);
    if (networkErr?.name === 'AbortError') {
      throw new Error('الاتصال بالسيرفر انتهى وقته (timeout). يرجى التحقق من اتصالك أو إعادة المحاولة لاحقاً.');
    }
    const msg = networkErr instanceof Error ? networkErr.message : 'Failed to fetch';
    console.error(`[API Network Error] ${init.method || 'GET'} ${url}:`, networkErr);
    throw new Error(
      import.meta.env.DEV
        ? `الـ API مش متصل أو البورت غلط.\nالرابط المحاول استدعاؤه: ${url}\nتأكد من تشغيل الباكند وصحة الرابط في .env (VITE_API_BASE_URL).`
        : msg
    );
  }
  
  const text = await res.text();
  let json: (Types.ApiResponse<T> & { detail?: string }) | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as Types.ApiResponse<T> & { detail?: string };
    } catch {
      if (!res.ok) throw new Error(text || res.statusText);
      return undefined as T;
    }
  }
  
  if (!res.ok) {
    const err = json as { message?: string; detail?: string; title?: string; errors?: Record<string, string[]> } | null;
    
    if (err?.errors && typeof err.errors === 'object') {
      const details = Object.entries(err.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join('. ');
      if (details) throw new Error(details);
    }
    const msg = err?.message ?? err?.detail ?? err?.title ?? res.statusText;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  
  if (skipUnwrap || json === null) return json as T;
  const wrapped = json as Types.ApiResponse<T>;
  if (wrapped.success === false && wrapped.message) {
    throw new Error(wrapped.message);
  }
  return (wrapped.data ?? json) as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestInit) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body: unknown, opts?: RequestInit) =>
    request<T>(path, {
      ...opts,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown, opts?: RequestInit) =>
    request<T>(path, {
      ...opts,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(path: string, body?: unknown, opts?: RequestInit) => 
    request<T>(path, { 
      ...opts, 
      method: 'DELETE',
      ...(body ? { body: JSON.stringify(body) } : {})
    }),
};



export const accountApi = {
  registerMarketer: (form: FormData) => {
    return api.post<any>(`/api/Account/register-marketer`, form);
  },
  login: (data: Types.LoginDto) => {
    return api.post<LoginResponse>(`/api/Account/login`, data);
  },
  logout: () => {
    return api.post<any>(`/api/Account/logout`, {});
  },
  registerCompany: (form: FormData) => {
    return api.post<any>(`/api/Account/campany_Register`, form);
  },
  postChangePassword: (data: Types.ChangePasswordDto) => {
    return api.post<any>(`/api/Account/ChangePassword`, data);
  }
};

export const affilianceApiApi = {
  get: () => {
    return api.get<any>(`/`);
  }
};

export const analyticsApi = {
  getcompanyoverview: (params?: { StartDate?: string, EndDate?: string, CompanyId?: number, CampaignId?: number, MarketerId?: number, CategoryId?: number, GroupBy?: string, companyId?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
      if (params.CompanyId !== undefined && params.CompanyId !== null) sp.append('CompanyId', String(params.CompanyId));
      if (params.CampaignId !== undefined && params.CampaignId !== null) sp.append('CampaignId', String(params.CampaignId));
      if (params.MarketerId !== undefined && params.MarketerId !== null) sp.append('MarketerId', String(params.MarketerId));
      if (params.CategoryId !== undefined && params.CategoryId !== null) sp.append('CategoryId', String(params.CategoryId));
      if (params.GroupBy !== undefined && params.GroupBy !== null) sp.append('GroupBy', String(params.GroupBy));
      if (params.companyId !== undefined && params.companyId !== null) sp.append('companyId', String(params.companyId));
    }
    const q = sp.toString();
    const finalUrl = `/api/Analytics/company/overview${q ? '?' + q : ''}`;
    return api.get<Types.CompanyStatisticsDto>(`${finalUrl}`);
  },
  getcompanymarketerperformance: (params?: { StartDate?: string, EndDate?: string, CompanyId?: number, CampaignId?: number, MarketerId?: number, CategoryId?: number, GroupBy?: string, companyId?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
      if (params.CompanyId !== undefined && params.CompanyId !== null) sp.append('CompanyId', String(params.CompanyId));
      if (params.CampaignId !== undefined && params.CampaignId !== null) sp.append('CampaignId', String(params.CampaignId));
      if (params.MarketerId !== undefined && params.MarketerId !== null) sp.append('MarketerId', String(params.MarketerId));
      if (params.CategoryId !== undefined && params.CategoryId !== null) sp.append('CategoryId', String(params.CategoryId));
      if (params.GroupBy !== undefined && params.GroupBy !== null) sp.append('GroupBy', String(params.GroupBy));
      if (params.companyId !== undefined && params.companyId !== null) sp.append('companyId', String(params.companyId));
    }
    const q = sp.toString();
    const finalUrl = `/api/Analytics/company/marketer-performance${q ? '?' + q : ''}`;
    return api.get<any[]>(`${finalUrl}`);
  },
  getcompanyconversionfunnel: (campaignId: number, params?: { StartDate?: string, EndDate?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
    }
    const q = sp.toString();
    const finalUrl = `/api/Analytics/company/conversion-funnel/${campaignId}${q ? '?' + q : ''}`;
    return api.get<Types.ConversionFunnelDto>(`${finalUrl}`);
  },
  getadminplatformoverview: () => {
    return api.get<Types.PlatformOverviewDto>(`/api/Analytics/admin/platform-overview`);
  },
  getadminrevenuebreakdown: (params?: { StartDate?: string, EndDate?: string, CompanyId?: number, CampaignId?: number, MarketerId?: number, CategoryId?: number, GroupBy?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
      if (params.CompanyId !== undefined && params.CompanyId !== null) sp.append('CompanyId', String(params.CompanyId));
      if (params.CampaignId !== undefined && params.CampaignId !== null) sp.append('CampaignId', String(params.CampaignId));
      if (params.MarketerId !== undefined && params.MarketerId !== null) sp.append('MarketerId', String(params.MarketerId));
      if (params.CategoryId !== undefined && params.CategoryId !== null) sp.append('CategoryId', String(params.CategoryId));
      if (params.GroupBy !== undefined && params.GroupBy !== null) sp.append('GroupBy', String(params.GroupBy));
    }
    const q = sp.toString();
    const finalUrl = `/api/Analytics/admin/revenue-breakdown${q ? '?' + q : ''}`;
    return api.get<any>(`${finalUrl}`);
  },
  getadmintopperformers: (params?: { topCount?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.topCount !== undefined && params.topCount !== null) sp.append('topCount', String(params.topCount));
    }
    const q = sp.toString();
    const finalUrl = `/api/Analytics/admin/top-performers${q ? '?' + q : ''}`;
    return api.get<any>(`${finalUrl}`);
  }
};

export const campaignApi = {
  get: (params?: { Status?: Types.CampaignStatus, CategoryId?: number, CompanyId?: number, StartDateFrom?: string, StartDateTo?: string, EndDateFrom?: string, EndDateTo?: string, Page?: number, PageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Status !== undefined && params.Status !== null) sp.append('Status', String(params.Status));
      if (params.CategoryId !== undefined && params.CategoryId !== null) sp.append('CategoryId', String(params.CategoryId));
      if (params.CompanyId !== undefined && params.CompanyId !== null) sp.append('CompanyId', String(params.CompanyId));
      if (params.StartDateFrom !== undefined && params.StartDateFrom !== null) sp.append('StartDateFrom', String(params.StartDateFrom));
      if (params.StartDateTo !== undefined && params.StartDateTo !== null) sp.append('StartDateTo', String(params.StartDateTo));
      if (params.EndDateFrom !== undefined && params.EndDateFrom !== null) sp.append('EndDateFrom', String(params.EndDateFrom));
      if (params.EndDateTo !== undefined && params.EndDateTo !== null) sp.append('EndDateTo', String(params.EndDateTo));
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign${q ? '?' + q : ''}`;
    return api.get<Types.CampaignDtoPagedResult>(`${finalUrl}`);
  },
  post: (data: Types.CreateCampaignDto) => {
    return api.post<any>(`/api/Campaign`, data);
  },
  getactive: (params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign/active${q ? '?' + q : ''}`;
    return api.get<Types.CampaignDtoPagedResult>(`${finalUrl}`);
  },
  get1: (id: number) => {
    return api.get<Types.CampaignDetailsDto>(`/api/Campaign/${id}`);
  },
  put: (id: number, data: Types.UpdateCampaignDto) => {
    return api.put<Types.CampaignDto>(`/api/Campaign/${id}`, data);
  },
  delete: (id: number) => {
    return api.delete<boolean>(`/api/Campaign/${id}`);
  },
  getcategory: (categoryId: number, params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign/category/${categoryId}${q ? '?' + q : ''}`;
    return api.get<Types.CampaignDtoPagedResult>(`${finalUrl}`);
  },
  getcompany: (companyId: number, params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign/company/${companyId}${q ? '?' + q : ''}`;
    return api.get<Types.CampaignDtoPagedResult>(`${finalUrl}`);
  },
  getsearch: (params?: { Keyword?: string, CategoryId?: number, MinCommission?: number, CommissionType?: Types.CommissionType, StartDateFrom?: string, StartDateTo?: string, EndDateFrom?: string, EndDateTo?: string, IsActive?: boolean, Page?: number, PageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Keyword !== undefined && params.Keyword !== null) sp.append('Keyword', String(params.Keyword));
      if (params.CategoryId !== undefined && params.CategoryId !== null) sp.append('CategoryId', String(params.CategoryId));
      if (params.MinCommission !== undefined && params.MinCommission !== null) sp.append('MinCommission', String(params.MinCommission));
      if (params.CommissionType !== undefined && params.CommissionType !== null) sp.append('CommissionType', String(params.CommissionType));
      if (params.StartDateFrom !== undefined && params.StartDateFrom !== null) sp.append('StartDateFrom', String(params.StartDateFrom));
      if (params.StartDateTo !== undefined && params.StartDateTo !== null) sp.append('StartDateTo', String(params.StartDateTo));
      if (params.EndDateFrom !== undefined && params.EndDateFrom !== null) sp.append('EndDateFrom', String(params.EndDateFrom));
      if (params.EndDateTo !== undefined && params.EndDateTo !== null) sp.append('EndDateTo', String(params.EndDateTo));
      if (params.IsActive !== undefined && params.IsActive !== null) sp.append('IsActive', String(params.IsActive));
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign/search${q ? '?' + q : ''}`;
    return api.get<Types.CampaignDtoPagedResult>(`${finalUrl}`);
  },
  getstatus: (status: Types.CampaignStatus, params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign/status/${status}${q ? '?' + q : ''}`;
    return api.get<Types.CampaignDtoPagedResult>(`${finalUrl}`);
  },
  getrecommended: (params?: { limit?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.limit !== undefined && params.limit !== null) sp.append('limit', String(params.limit));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign/recommended${q ? '?' + q : ''}`;
    return api.get<Types.CampaignDtoPagedResult>(`${finalUrl}`);
  },
  getmycampaigns: (params?: { Status?: Types.CampaignStatus, CategoryId?: number, CompanyId?: number, StartDateFrom?: string, StartDateTo?: string, EndDateFrom?: string, EndDateTo?: string, Page?: number, PageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Status !== undefined && params.Status !== null) sp.append('Status', String(params.Status));
      if (params.CategoryId !== undefined && params.CategoryId !== null) sp.append('CategoryId', String(params.CategoryId));
      if (params.CompanyId !== undefined && params.CompanyId !== null) sp.append('CompanyId', String(params.CompanyId));
      if (params.StartDateFrom !== undefined && params.StartDateFrom !== null) sp.append('StartDateFrom', String(params.StartDateFrom));
      if (params.StartDateTo !== undefined && params.StartDateTo !== null) sp.append('StartDateTo', String(params.StartDateTo));
      if (params.EndDateFrom !== undefined && params.EndDateFrom !== null) sp.append('EndDateFrom', String(params.EndDateFrom));
      if (params.EndDateTo !== undefined && params.EndDateTo !== null) sp.append('EndDateTo', String(params.EndDateTo));
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign/my-campaigns${q ? '?' + q : ''}`;
    return api.get<Types.CampaignDtoPagedResult>(`${finalUrl}`);
  },
  getmycampaigns1: (id: number) => {
    return api.get<Types.CampaignDetailsDto>(`/api/Campaign/my-campaigns/${id}`);
  },
  getapplications: (id: number, params?: { status?: Types.ApplicationStatus, page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.status !== undefined && params.status !== null) sp.append('status', String(params.status));
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign/${id}/applications${q ? '?' + q : ''}`;
    return api.get<Types.CampaignApplicationDtoPagedResult>(`${finalUrl}`);
  },
  getstatistics: (id: number, params?: { from?: string, to?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.from !== undefined && params.from !== null) sp.append('from', String(params.from));
      if (params.to !== undefined && params.to !== null) sp.append('to', String(params.to));
    }
    const q = sp.toString();
    const finalUrl = `/api/Campaign/${id}/statistics${q ? '?' + q : ''}`;
    return api.get<Types.CampaignStatisticsDto>(`${finalUrl}`);
  },
  postapply: (id: number) => {
    return api.post<Types.CampaignApplicationDto>(`/api/Campaign/${id}/apply`, {});
  },
  postapplicationswithdraw: (applicationId: number) => {
    return api.post<boolean>(`/api/Campaign/applications/${applicationId}/withdraw`, {});
  },
  postapplicationsapprove: (applicationId: number, data: Types.CampaignApplicationActionDto) => {
    return api.post<boolean>(`/api/Campaign/applications/${applicationId}/approve`, data);
  },
  postapplicationsreject: (applicationId: number, data: Types.CampaignApplicationActionDto) => {
    return api.post<boolean>(`/api/Campaign/applications/${applicationId}/reject`, data);
  },
  putstatus: (id: number, data: Types.CampaignStatus) => {
    return api.put<boolean>(`/api/Campaign/${id}/status`, data);
  },
  putpause: (id: number) => {
    return api.put<boolean>(`/api/Campaign/${id}/pause`, {});
  },
  putresume: (id: number) => {
    return api.put<boolean>(`/api/Campaign/${id}/resume`, {});
  },
  putadminapprove: (id: number, note: string) => {
    return api.put<Types.CampaignDto>(`/api/Campaign/${id}/admin/approve`, JSON.stringify(note), {
      headers: { 'Content-Type': 'application/json' }
    });
  },
  putadminreject: (id: number, reason: string) => {
    return api.put<Types.CampaignDto>(`/api/Campaign/${id}/admin/reject`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    });
  },
  posttogglefeatured: (id: number) => {
    return api.post<boolean>(`/api/Campaign/admin/toggle-featured/${id}`, {});
  },
  getadminfeatured: () => {
    return api.get<Types.CampaignDto[]>(`/api/Campaign/admin/featured`);
  },
  getadminall: (params?: { Status?: Types.CampaignStatus, CategoryId?: number, CompanyId?: number, Page?: number, PageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) sp.append(k, String(v));
      });
    }
    const q = sp.toString();
    return api.get<Types.CampaignDtoPagedResult>(`/api/Campaign/admin/all${q ? '?' + q : ''}`);
  }
};

export const categoryApi = {
  get: () => {
    return api.get<Types.CategoryDto[]>(`/api/Category`);
  },
  post: (data: Types.CreateCategoryDto) => {
    return api.post<Types.CategoryDto>(`/api/Category`, data);
  },
  getroots: () => {
    return api.get<Types.CategoryDto[]>(`/api/Category/roots`);
  },
  get1: (id: number) => {
    return api.get<Types.CategoryDetailsDto>(`/api/Category/${id}`);
  },
  put: (id: number, data: Types.UpdateCategoryDto) => {
    return api.put<Types.CategoryDto>(`/api/Category/${id}`, data);
  },
  delete: (id: number) => {
    return api.delete<boolean>(`/api/Category/${id}`);
  },
  getchildren: (id: number) => {
    return api.get<Types.CategoryDto[]>(`/api/Category/${id}/children`);
  },
  gethierarchy: () => {
    return api.get<Types.CategoryTreeDto>(`/api/Category/hierarchy`);
  },
  getslug: (slug: string) => {
    return api.get<Types.CategoryDto>(`/api/Category/slug/${slug}`);
  },
  getcampaigns: (id: number, params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Category/${id}/campaigns${q ? '?' + q : ''}`;
    return api.get<any>(`${finalUrl}`);
  },
  postbulk: (data: Types.CreateCategoryDto[]) => {
    return api.post<Types.CategoryDto[]>(`/api/Category/bulk`, data);
  },
  deletesafe: (id: number) => {
    return api.delete<boolean>(`/api/Category/${id}/safe`);
  }
};

export const chatbotApi = {
  
  postsend: (input: string | FormData) => {
    let form: FormData;
    if (typeof input === 'string') {
      form = new FormData();
      form.append('Text', input);
    } else {
      form = input;
      
      if (form.has('message') && !form.has('Text')) {
        const msg = form.get('message') as string;
        form.delete('message');
        form.append('Text', msg);
      }
    }
    return api.post<any>(`/api/Chatbot/send`, form);
  }
};

export const companyApi = {
  get: (id: number) => {
    return api.get<Types.CompanyDetailsDto>(`/api/Company/${id}`);
  },
  getsearch: (params?: { keyword?: string, page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.keyword !== undefined && params.keyword !== null) sp.append('keyword', String(params.keyword));
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Company/search${q ? '?' + q : ''}`;
    return api.get<Types.CompanyDtoPagedResult>(`${finalUrl}`);
  },
  getmyprofile: () => {
    return api.get<Types.CompanyDetailsDto>(`/api/Company/my-profile`);
  },
  putmyprofile: (data: Types.UpdateCompanyDto) => {
    return api.put<Types.CompanyDto>(`/api/Company/my-profile`, data);
  },
  getmystatistics: (params?: { from?: string, to?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.from !== undefined && params.from !== null) sp.append('from', String(params.from));
      if (params.to !== undefined && params.to !== null) sp.append('to', String(params.to));
    }
    const q = sp.toString();
    const finalUrl = `/api/Company/my-statistics${q ? '?' + q : ''}`;
    return api.get<Types.CompanyStatisticsDto>(`${finalUrl}`);
  },
  putmylogo: (form: FormData) => {
    return api.put<string>(`/api/Company/my-logo`, form);
  },
  getadminpending: (params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Company/admin/pending${q ? '?' + q : ''}`;
    return api.get<Types.CompanyApprovalDtoPagedResult>(`${finalUrl}`);
  },
  getadminverified: (params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Company/admin/verified${q ? '?' + q : ''}`;
    return api.get<Types.CompanyDtoPagedResult>(`${finalUrl}`);
  },
  getadminall: (params?: { Page?: number, PageSize?: number, SearchKeyword?: string, IsVerified?: boolean, SortBy?: string, IsDescending?: boolean }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
      if (params.SearchKeyword !== undefined && params.SearchKeyword !== null) sp.append('SearchKeyword', String(params.SearchKeyword));
      if (params.IsVerified !== undefined && params.IsVerified !== null) sp.append('IsVerified', String(params.IsVerified));
      if (params.SortBy !== undefined && params.SortBy !== null) sp.append('SortBy', String(params.SortBy));
      if (params.IsDescending !== undefined && params.IsDescending !== null) sp.append('IsDescending', String(params.IsDescending));
    }
    const q = sp.toString();
    const finalUrl = `/api/Company/admin/all${q ? '?' + q : ''}`;
    return api.get<Types.CompanyDtoPagedResult>(`${finalUrl}`);
  },
  postapprove: (id: number, data: Types.CompanyActionDto) => {
    return api.post<Types.CompanyDto>(`/api/Company/${id}/approve`, data);
  },
  postreject: (id: number, data: Types.CompanyActionDto) => {
    return api.post<string>(`/api/Company/${id}/reject`, data);
  },
  putverify: (id: number) => {
    return api.put<boolean>(`/api/Company/${id}/verify`, {});
  },
  putsuspend: (id: number, data: Types.CompanyActionDto) => {
    return api.put<boolean>(`/api/Company/${id}/suspend`, data);
  },
  putreactivate: (id: number) => {
    return api.put<boolean>(`/api/Company/${id}/reactivate`, {});
  }
};

export const complaintApi = {
  post: (data: Types.CreateComplaintDto) => {
    return api.post<any>(`/api/Complaint`, data);
  },
  getmy: (params?: { Page?: number, PageSize?: number, ComplainantId?: number, DefendantId?: number, CampaignId?: number, Status?: Types.ComplaintStatus, StartDate?: string, EndDate?: string, SearchTerm?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
      if (params.ComplainantId !== undefined && params.ComplainantId !== null) sp.append('ComplainantId', String(params.ComplainantId));
      if (params.DefendantId !== undefined && params.DefendantId !== null) sp.append('DefendantId', String(params.DefendantId));
      if (params.CampaignId !== undefined && params.CampaignId !== null) sp.append('CampaignId', String(params.CampaignId));
      if (params.Status !== undefined && params.Status !== null) sp.append('Status', String(params.Status));
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
      if (params.SearchTerm !== undefined && params.SearchTerm !== null) sp.append('SearchTerm', String(params.SearchTerm));
    }
    const q = sp.toString();
    const finalUrl = `/api/Complaint/my${q ? '?' + q : ''}`;
    return api.get<any>(`${finalUrl}`);
  },
  getagainstme: (params?: { Page?: number, PageSize?: number, ComplainantId?: number, DefendantId?: number, CampaignId?: number, Status?: Types.ComplaintStatus, StartDate?: string, EndDate?: string, SearchTerm?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
      if (params.ComplainantId !== undefined && params.ComplainantId !== null) sp.append('ComplainantId', String(params.ComplainantId));
      if (params.DefendantId !== undefined && params.DefendantId !== null) sp.append('DefendantId', String(params.DefendantId));
      if (params.CampaignId !== undefined && params.CampaignId !== null) sp.append('CampaignId', String(params.CampaignId));
      if (params.Status !== undefined && params.Status !== null) sp.append('Status', String(params.Status));
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
      if (params.SearchTerm !== undefined && params.SearchTerm !== null) sp.append('SearchTerm', String(params.SearchTerm));
    }
    const q = sp.toString();
    const finalUrl = `/api/Complaint/against-me${q ? '?' + q : ''}`;
    return api.get<any>(`${finalUrl}`);
  },
  get: (id: number) => {
    return api.get<any>(`/api/Complaint/${id}`);
  },
  getadminall: (params?: { Page?: number, PageSize?: number, ComplainantId?: number, DefendantId?: number, CampaignId?: number, Status?: Types.ComplaintStatus, StartDate?: string, EndDate?: string, SearchTerm?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
      if (params.ComplainantId !== undefined && params.ComplainantId !== null) sp.append('ComplainantId', String(params.ComplainantId));
      if (params.DefendantId !== undefined && params.DefendantId !== null) sp.append('DefendantId', String(params.DefendantId));
      if (params.CampaignId !== undefined && params.CampaignId !== null) sp.append('CampaignId', String(params.CampaignId));
      if (params.Status !== undefined && params.Status !== null) sp.append('Status', String(params.Status));
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
      if (params.SearchTerm !== undefined && params.SearchTerm !== null) sp.append('SearchTerm', String(params.SearchTerm));
    }
    const q = sp.toString();
    const finalUrl = `/api/Complaint/admin/all${q ? '?' + q : ''}`;
    return api.get<any>(`${finalUrl}`);
  },
  postresolve: (id: number, data: Types.ResolveComplaintDto) => {
    return api.post<any>(`/api/Complaint/${id}/resolve`, data);
  },
  getadminstatistics: () => {
    return api.get<any>(`/api/Complaint/admin/statistics`);
  }
};

export const marketerApi = {
  getmydashboard: () => {
    return api.get<Types.MarketerDashboardDto>(`/api/Marketer/my/dashboard`);
  },
  getmystatistics: (params?: { startDate?: string, endDate?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.startDate !== undefined && params.startDate !== null) sp.append('startDate', String(params.startDate));
      if (params.endDate !== undefined && params.endDate !== null) sp.append('endDate', String(params.endDate));
    }
    const q = sp.toString();
    const finalUrl = `/api/Marketer/my/statistics${q ? '?' + q : ''}`;
    return api.get<Types.MarketerStatisticsDto>(`${finalUrl}`);
  },
  getmyearningsreport: (params?: { startDate?: string, endDate?: string, groupBy?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.startDate !== undefined && params.startDate !== null) sp.append('startDate', String(params.startDate));
      if (params.endDate !== undefined && params.endDate !== null) sp.append('endDate', String(params.endDate));
      if (params.groupBy !== undefined && params.groupBy !== null) sp.append('groupBy', String(params.groupBy));
    }
    const q = sp.toString();
    const finalUrl = `/api/Marketer/my/earnings-report${q ? '?' + q : ''}`;
    return api.get<Types.EarningsReportDto>(`${finalUrl}`);
  },
  getmyperformancehistory: () => {
    return api.get<Types.PerformanceHistoryDto[]>(`/api/Marketer/my/performance-history`);
  },
  getmyapplications: (params?: { Status?: Types.ApplicationStatus, CampaignId?: number, Page?: number, PageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Status !== undefined && params.Status !== null) sp.append('Status', String(params.Status));
      if (params.CampaignId !== undefined && params.CampaignId !== null) sp.append('CampaignId', String(params.CampaignId));
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Marketer/my/applications${q ? '?' + q : ''}`;
    return api.get<Types.CampaignApplicationDtoPagedResult>(`${finalUrl}`);
  },
  getmyapplications1: (applicationId: number) => {
    return api.get<Types.CampaignApplicationDto>(`/api/Marketer/my/applications/${applicationId}`);
  },
  getmyaisuggestions: (params?: { limit?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.limit !== undefined && params.limit !== null) sp.append('limit', String(params.limit));
    }
    const q = sp.toString();
    const finalUrl = `/api/Marketer/my/ai-suggestions${q ? '?' + q : ''}`;
    return api.get<Types.AiSuggestionDtoPagedResult>(`${finalUrl}`);
  },
  getmypersonalitytest: () => {
    return api.get<Types.PersonalityTestResultDto>(`/api/Marketer/my/personality-test`);
  },
  postmypersonalitytest: (data: Types.PersonalityTestDto) => {
    return api.post<Types.PersonalityTestResultDto>(`/api/Marketer/my/personality-test`, data);
  },
  getmyprofile: () => {
    return api.get<Types.MarketerProfileDto>(`/api/Marketer/my/profile`);
  },
  putmyprofile: (data: Types.UpdateMarketerProfileDto) => {
    return api.put<Types.MarketerProfileDto>(`/api/Marketer/my/profile`, data);
  },
  putmyprofilepicture: (form: FormData) => {
    return api.put<string>(`/api/Marketer/my/profile-picture`, form);
  },
  putmycv: (form: FormData) => {
    return api.put<string>(`/api/Marketer/my/cv`, form);
  },
  putmynationalid: (form: FormData) => {
    return api.put<string>(`/api/Marketer/my/national-id`, form);
  },
  putmyskills: (data: string) => {
    return api.put<boolean>(`/api/Marketer/my/skills`, data);
  },
  putmybio: (data: string) => {
    return api.put<boolean>(`/api/Marketer/my/bio`, data);
  },
  putmyniche: (data: string) => {
    return api.put<boolean>(`/api/Marketer/my/niche`, data);
  },
  putmysociallinks: (data: string) => {
    return api.put<boolean>(`/api/Marketer/my/social-links`, data);
  },
  getmyreviews: (params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('Page', String(params.page));
    if (params?.pageSize) sp.append('PageSize', String(params.pageSize));
    const q = sp.toString();
    return api.get<Types.ReviewDtoPagedResult>(`/api/marketer/my/reviews${q ? '?' + q : ''}`);
  },
  getmyreviewsgiven: (params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('Page', String(params.page));
    if (params?.pageSize) sp.append('PageSize', String(params.pageSize));
    const q = sp.toString();
    return api.get<Types.ReviewDtoPagedResult>(`/api/marketer/my/reviews/given${q ? '?' + q : ''}`);
  },
  postmyapplicationswithdraw: (applicationId: number) => {
    return api.post<boolean>(`/api/Marketer/my/applications/${applicationId}/withdraw`, {});
  },
  putverify: (marketerId: number) => {
    return api.put<boolean>(`/api/Marketer/${marketerId}/verify`, {});
  },
  putunverify: (marketerId: number) => {
    return api.put<boolean>(`/api/Marketer/${marketerId}/unverify`, {});
  },
  putperformancescore: (marketerId: number, data: number) => {
    return api.put<boolean>(`/api/Marketer/${marketerId}/performance-score`, data);
  },
  getadminpendingverification: (params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/Marketer/admin/pending-verification${q ? '?' + q : ''}`;
    return api.get<Types.MarketerPublicDtoPagedResult>(`${finalUrl}`);
  }
};

export const notificationApi = {
  getmy: (params?: { Page?: number, PageSize?: number, IsRead?: boolean, Type?: string, StartDate?: string, EndDate?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
      if (params.IsRead !== undefined && params.IsRead !== null) sp.append('IsRead', String(params.IsRead));
      if (params.Type !== undefined && params.Type !== null) sp.append('Type', String(params.Type));
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
    }
    const q = sp.toString();
    const finalUrl = `/api/Notification/my${q ? '?' + q : ''}`;
    return api.get<Types.NotificationDtoPagedResult>(`${finalUrl}`);
  },
  getsummary: () => {
    return api.get<any>(`/api/Notification/summary`);
  },
  putread: (id: number) => {
    return api.put<any>(`/api/Notification/${id}/read`, {});
  },
  putreadall: () => {
    return api.put<any>(`/api/Notification/read-all`, {});
  },
  delete: (id: number) => {
    return api.delete<any>(`/api/Notification/${id}`);
  },
  getpreferences: () => {
    return api.get<any>(`/api/Notification/preferences`);
  },
  putpreferences: (data: Types.UpdateNotificationPreferenceDto) => {
    return api.put<any>(`/api/Notification/preferences`, data);
  }
};

export const paymentApi = {
  postwithdrawalrequest: (data: Types.CreateWithdrawalRequestDto) => {
    return api.post<any>(`/api/Payment/withdrawal-request`, data);
  },
  getwithdrawalhistory: (params?: { Page?: number, PageSize?: number, MarketerId?: number, Status?: Types.WithdrawalStatus, StartDate?: string, EndDate?: string, MinAmount?: number, MaxAmount?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
      if (params.MarketerId !== undefined && params.MarketerId !== null) sp.append('MarketerId', String(params.MarketerId));
      if (params.Status !== undefined && params.Status !== null) sp.append('Status', String(params.Status));
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
      if (params.MinAmount !== undefined && params.MinAmount !== null) sp.append('MinAmount', String(params.MinAmount));
      if (params.MaxAmount !== undefined && params.MaxAmount !== null) sp.append('MaxAmount', String(params.MaxAmount));
    }
    const q = sp.toString();
    const finalUrl = `/api/Payment/withdrawal-history${q ? '?' + q : ''}`;
    return api.get<Types.WithdrawalDtoPagedResult>(`${finalUrl}`);
  },
  getbalance: () => {
    return api.get<any>(`/api/Payment/balance`);
  },
  getearnings: (campaignId: number) => {
    return api.get<any>(`/api/Payment/earnings/${campaignId}`);
  },
  getearnings1: () => {
    return api.get<any>(`/api/Payment/earnings`);
  },
  postpaymentmethod: (data: Types.CreatePaymentMethodDto) => {
    return api.post<any>(`/api/Payment/payment-method`, data);
  },
  getpaymentmethods: () => {
    return api.get<any>(`/api/Payment/payment-methods`);
  },
  putpaymentmethod: (id: number, data: Types.UpdatePaymentMethodDto) => {
    return api.put<any>(`/api/Payment/payment-method/${id}`, data);
  },
  deletepaymentmethod: (id: number) => {
    return api.delete<any>(`/api/Payment/payment-method/${id}`);
  },
  getadminwithdrawals: (params?: { Page?: number, PageSize?: number, MarketerId?: number, Status?: Types.WithdrawalStatus, StartDate?: string, EndDate?: string, MinAmount?: number, MaxAmount?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
      if (params.MarketerId !== undefined && params.MarketerId !== null) sp.append('MarketerId', String(params.MarketerId));
      if (params.Status !== undefined && params.Status !== null) sp.append('Status', String(params.Status));
      if (params.StartDate !== undefined && params.StartDate !== null) sp.append('StartDate', String(params.StartDate));
      if (params.EndDate !== undefined && params.EndDate !== null) sp.append('EndDate', String(params.EndDate));
      if (params.MinAmount !== undefined && params.MinAmount !== null) sp.append('MinAmount', String(params.MinAmount));
      if (params.MaxAmount !== undefined && params.MaxAmount !== null) sp.append('MaxAmount', String(params.MaxAmount));
    }
    const q = sp.toString();
    const finalUrl = `/api/Payment/admin/withdrawals${q ? '?' + q : ''}`;
    return api.get<Types.WithdrawalDtoPagedResult>(`${finalUrl}`);
  },
  postadminwithdrawalsapprove: (id: number, data: Types.ProcessWithdrawalDto) => {
    return api.post<any>(`/api/Payment/admin/withdrawals/${id}/approve`, { ...data, isApproved: true });
  },
  postadminwithdrawalsreject: (id: number, data: Types.ProcessWithdrawalDto) => {
    return api.post<any>(`/api/Payment/admin/withdrawals/${id}/reject`, { ...data, isApproved: false });
  },
  getadminfinancialreports: (params?: { startDate?: string, endDate?: string }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.startDate !== undefined && params.startDate !== null) sp.append('startDate', String(params.startDate));
      if (params.endDate !== undefined && params.endDate !== null) sp.append('endDate', String(params.endDate));
    }
    const q = sp.toString();
    const finalUrl = `/api/Payment/admin/financial-reports${q ? '?' + q : ''}`;
    return api.get<Types.FinancialReportDto>(`${finalUrl}`);
  },
};

export const reviewApi = {
  getmarketermyreviews: (params?: { Rating?: number, CampaignId?: number, Page?: number, PageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.Rating !== undefined && params.Rating !== null) sp.append('Rating', String(params.Rating));
      if (params.CampaignId !== undefined && params.CampaignId !== null) sp.append('CampaignId', String(params.CampaignId));
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/marketer/my/reviews${q ? '?' + q : ''}`;
    return api.get<Types.ReviewDtoPagedResult>(`${finalUrl}`);
  },
  getmarketermyreviewsgiven: (params?: { page?: number, pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) sp.append('page', String(params.page));
      if (params.pageSize !== undefined && params.pageSize !== null) sp.append('pageSize', String(params.pageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/marketer/my/reviews/given${q ? '?' + q : ''}`;
    return api.get<Types.ReviewDtoPagedResult>(`${finalUrl}`);
  },
  getmarketermyaveragerating: () => {
    return api.get<Types.AverageRatingDto>(`/api/marketer/my/average-rating`);
  }
};

export const trackingLinkApi = {
  getmarketermytrackinglinks: (params?: { CampaignId?: number, IsActive?: boolean, Page?: number, PageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.CampaignId !== undefined && params.CampaignId !== null) sp.append('CampaignId', String(params.CampaignId));
      if (params.IsActive !== undefined && params.IsActive !== null) sp.append('IsActive', String(params.IsActive));
      if (params.Page !== undefined && params.Page !== null) sp.append('Page', String(params.Page));
      if (params.PageSize !== undefined && params.PageSize !== null) sp.append('PageSize', String(params.PageSize));
    }
    const q = sp.toString();
    const finalUrl = `/api/marketer/my/tracking-links${q ? '?' + q : ''}`;
    return api.get<Types.TrackingLinkDtoPagedResult>(`${finalUrl}`);
  },
  getmarketermytrackinglinks1: (linkId: number) => {
    return api.get<Types.TrackingLinkDto>(`/api/marketer/my/tracking-links/${linkId}`);
  },
  getmarketermytrackinglinksstatistics: (linkId: number) => {
    return api.get<Types.TrackingLinkStatisticsDto>(`/api/marketer/my/tracking-links/${linkId}/statistics`);
  }
};


// Top-level type aliases for convenience
export type ApiResponse<T> = Types.ApiResponse<T>;
export type PlatformOverviewDto = Types.PlatformOverviewDto;
export type RevenueBreakdownDto = Types.RevenueBreakdownDto;
export type TopPerformerDto = Types.TopPerformerDto;
export type ComplaintDto = Types.ComplaintDto;
export type WithdrawalDto = Types.WithdrawalDto;
export type PaymentMethodDto = Types.PaymentMethodDto;
export type WithdrawalDtoPagedResult = Types.WithdrawalDtoPagedResult;
export type FinancialReportDto = Types.FinancialReportDto;
export type ConversionFunnelDto = Types.ConversionFunnelDto;
export type NotificationDto = Types.NotificationDto;
export type NotificationDtoPagedResult = Types.NotificationDtoPagedResult;
export type AiSuggestionDto = Types.AiSuggestionDto;
export type AiSuggestionDtoPagedResult = Types.AiSuggestionDtoPagedResult;
export type AiSuggestionDtoPagedResultApiResponse = Types.AiSuggestionDtoPagedResultApiResponse;
export type ApplicationStatus = Types.ApplicationStatus;
export type AverageRatingDto = Types.AverageRatingDto;
export type AverageRatingDtoApiResponse = Types.AverageRatingDtoApiResponse;
export type BooleanApiResponse = Types.BooleanApiResponse;
export type CampaignApplicationActionDto = Types.CampaignApplicationActionDto;
export type CampaignApplicationDto = Types.CampaignApplicationDto;
export type CampaignApplicationDtoApiResponse = Types.CampaignApplicationDtoApiResponse;
export type CampaignApplicationDtoPagedResult = Types.CampaignApplicationDtoPagedResult;
export type CampaignApplicationDtoPagedResultApiResponse = Types.CampaignApplicationDtoPagedResultApiResponse;
export type CampaignDetailsDto = Types.CampaignDetailsDto;
export type CampaignDetailsDtoApiResponse = Types.CampaignDetailsDtoApiResponse;
export type CampaignDto = Types.CampaignDto;
export type CampaignDtoApiResponse = Types.CampaignDtoApiResponse;
export type CampaignDtoPagedResult = Types.CampaignDtoPagedResult;
export type CampaignDtoPagedResultApiResponse = Types.CampaignDtoPagedResultApiResponse;
export type CampaignStatisticsDto = Types.CampaignStatisticsDto;
export type CampaignStatisticsDtoApiResponse = Types.CampaignStatisticsDtoApiResponse;
export type CampaignStatus = Types.CampaignStatus;
export type CategoryDetailsDto = Types.CategoryDetailsDto;
export type CategoryDetailsDtoApiResponse = Types.CategoryDetailsDtoApiResponse;
export type CategoryDto = Types.CategoryDto;
export type CategoryDtoApiResponse = Types.CategoryDtoApiResponse;
export type CategoryDtoIEnumerableApiResponse = Types.CategoryDtoIEnumerableApiResponse;
export type CategoryTreeDto = Types.CategoryTreeDto;
export type CategoryTreeDtoApiResponse = Types.CategoryTreeDtoApiResponse;
export type CategoryTreeNodeDto = Types.CategoryTreeNodeDto;
export type ChangePasswordDto = Types.ChangePasswordDto;
export type CommissionType = Types.CommissionType;
export type CompanyActionDto = Types.CompanyActionDto;
export type CompanyApprovalDto = Types.CompanyApprovalDto;
export type CompanyApprovalDtoPagedResult = Types.CompanyApprovalDtoPagedResult;
export type CompanyApprovalDtoPagedResultApiResponse = Types.CompanyApprovalDtoPagedResultApiResponse;
export type CompanyBasicDto = Types.CompanyBasicDto;
export type CompanyDetailsDto = Types.CompanyDetailsDto;
export type CompanyDetailsDtoApiResponse = Types.CompanyDetailsDtoApiResponse;
export type CompanyDto = Types.CompanyDto;
export type CompanyDtoApiResponse = Types.CompanyDtoApiResponse;
export type CompanyDtoPagedResult = Types.CompanyDtoPagedResult;
export type CompanyDtoPagedResultApiResponse = Types.CompanyDtoPagedResultApiResponse;
export type CompanyStatisticsDto = Types.CompanyStatisticsDto;
export type CompanyStatisticsDtoApiResponse = Types.CompanyStatisticsDtoApiResponse;
export type ComplaintStatus = Types.ComplaintStatus;
export type CreateCampaignDto = Types.CreateCampaignDto;
export type CreateCategoryDto = Types.CreateCategoryDto;
export type CreateComplaintDto = Types.CreateComplaintDto;
export type CreatePaymentMethodDto = Types.CreatePaymentMethodDto;
export type CreateWithdrawalRequestDto = Types.CreateWithdrawalRequestDto;
export type DailyStatisticsDto = Types.DailyStatisticsDto;
export type EarningsByPeriodDto = Types.EarningsByPeriodDto;
export type EarningsReportDto = Types.EarningsReportDto;
export type EarningsReportDtoApiResponse = Types.EarningsReportDtoApiResponse;
export type LoginDto = Types.LoginDto;
export type MarketerDashboardDto = Types.MarketerDashboardDto;
export type MarketerDashboardDtoApiResponse = Types.MarketerDashboardDtoApiResponse;
export type MarketerProfileDto = Types.MarketerProfileDto;
export type MarketerProfileDtoApiResponse = Types.MarketerProfileDtoApiResponse;
export type MarketerPublicDto = Types.MarketerPublicDto;
export type MarketerPublicDtoPagedResult = Types.MarketerPublicDtoPagedResult;
export type MarketerPublicDtoPagedResultApiResponse = Types.MarketerPublicDtoPagedResultApiResponse;
export type MarketerStatisticsDto = Types.MarketerStatisticsDto;
export type MarketerStatisticsDtoApiResponse = Types.MarketerStatisticsDtoApiResponse;
export type NotificationType = Types.NotificationType;
export type ObjectApiResponse = Types.ObjectApiResponse;
export type PaymentMethodType = Types.PaymentMethodType;
export type PerformanceHistoryDto = Types.PerformanceHistoryDto;
export type PerformanceHistoryDtoListApiResponse = Types.PerformanceHistoryDtoListApiResponse;
export type PersonalityTestAnswerDto = Types.PersonalityTestAnswerDto;
export type PersonalityTestDto = Types.PersonalityTestDto;
export type PersonalityTestResultDto = Types.PersonalityTestResultDto;
export type PersonalityTestResultDtoApiResponse = Types.PersonalityTestResultDtoApiResponse;
export type ProblemDetails = Types.ProblemDetails;
export type ProcessWithdrawalDto = Types.ProcessWithdrawalDto;
export type RecentActivityDto = Types.RecentActivityDto;
export type ResolveComplaintDto = Types.ResolveComplaintDto;
export type ReviewDto = Types.ReviewDto;
export type ReviewDtoPagedResult = Types.ReviewDtoPagedResult;
export type ReviewDtoPagedResultApiResponse = Types.ReviewDtoPagedResultApiResponse;
export type StringApiResponse = Types.StringApiResponse;
export type TrackingLinkDto = Types.TrackingLinkDto;
export type TrackingLinkDtoApiResponse = Types.TrackingLinkDtoApiResponse;
export type TrackingLinkDtoPagedResult = Types.TrackingLinkDtoPagedResult;
export type TrackingLinkDtoPagedResultApiResponse = Types.TrackingLinkDtoPagedResultApiResponse;
export type TrackingLinkStatisticsDto = Types.TrackingLinkStatisticsDto;
export type TrackingLinkStatisticsDtoApiResponse = Types.TrackingLinkStatisticsDtoApiResponse;
export type UpdateCampaignDto = Types.UpdateCampaignDto;
export type UpdateCategoryDto = Types.UpdateCategoryDto;
export type UpdateCompanyDto = Types.UpdateCompanyDto;
export type UpdateMarketerProfileDto = Types.UpdateMarketerProfileDto;
export type UpdateNotificationPreferenceDto = Types.UpdateNotificationPreferenceDto;
export type UpdatePaymentMethodDto = Types.UpdatePaymentMethodDto;
export type WithdrawalStatus = Types.WithdrawalStatus;
export type LoginResponse = Types.LoginResponse;