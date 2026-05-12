import React, { useEffect, useState, useCallback } from 'react'
import { campaignApi, categoryApi, marketerApi, complaintApi, API_BASE_URL } from '../api/client'
import type { CampaignDto, CategoryDto, CommissionType } from '../api/client'
import { Search, MapPin, Users, Star, Sparkles, Grid3X3, ChevronRight, ShoppingBag, Gamepad2, Home as HomeIcon, Film, UtensilsCrossed, Plane, ArrowDown, ShieldAlert } from 'lucide-react'
import { activityTracker } from '../utils/activityTracker'
import { toast } from 'react-hot-toast'

const categoryIcons: Record<string, typeof ShoppingBag> = {
  'Fashion & Style': ShoppingBag,
  'Gaming & Apps': Gamepad2,
  'Home & Living': HomeIcon,
  'Entertainment': Film,
  'Food & Dining': UtensilsCrossed,
  'Travel': Plane,
}



// Seed-based deterministic number to pick consistent images per campaign
function seededIndex(id: number | undefined, fallback: number): number {
  return id !== undefined && id > 0 ? id : fallback;
}

// Build a smart Unsplash keyword from title + category
function buildUnsplashKeyword(campaign: CampaignDto): string {
  const title = (campaign.title || '').trim();
  const category = (campaign.categoryName || '').trim();
  const desc = (campaign.description || '').trim();
  const combined = (title + ' ' + category + ' ' + desc).toLowerCase();

  // Specific keyword mappings for common campaign themes
  if (combined.includes('camping') || combined.includes('camp') || combined.includes('outdoor') || combined.includes('nature') || combined.includes('adventure tour') || combined.includes('hiking') || combined.includes('tent')) return 'camping outdoor nature';
  if (combined.includes('fashion') || combined.includes('cloth') || combined.includes('style') || combined.includes('apparel') || combined.includes('streetwear') || combined.includes('wear')) return 'fashion clothing style';
  if (combined.includes('game') || combined.includes('gaming') || combined.includes('esport') || combined.includes('tournament') || combined.includes('play')) return 'gaming esports';
  if (combined.includes('food') || combined.includes('gourmet') || combined.includes('restaur') || combined.includes('coffee') || combined.includes('drink') || combined.includes('eat') || combined.includes('cook') || combined.includes('beverag') || combined.includes('delivery')) return 'gourmet food restaurant';
  if (combined.includes('travel') || combined.includes('trip') || combined.includes('hotel') || combined.includes('flight') || combined.includes('tour') || combined.includes('tourism')) return 'travel adventure tourism';
  if (combined.includes('tech') || combined.includes('electronic') || combined.includes('gadget') || combined.includes('softwar') || combined.includes('cloud') || combined.includes('ai') || combined.includes('digital') || combined.includes('app') || combined.includes('phone') || combined.includes('comput')) return 'technology digital innovation';
  if (combined.includes('beauty') || combined.includes('cosmetic') || combined.includes('skin') || combined.includes('makeup') || combined.includes('organic health') || combined.includes('supplement')) return 'beauty skincare wellness';
  if (combined.includes('fit') || combined.includes('gym') || combined.includes('health') || combined.includes('sport') || combined.includes('workout')) return 'fitness gym workout';
  if (combined.includes('edu') || combined.includes('learn') || combined.includes('course') || combined.includes('school') || combined.includes('language') || combined.includes('teach')) return 'education learning books';
  if (combined.includes('pet') || combined.includes('dog') || combined.includes('cat') || combined.includes('animal')) return 'pets animals cute';
  if (combined.includes('finance') || combined.includes('fintech') || combined.includes('money') || combined.includes('bank') || combined.includes('invest') || combined.includes('stock') || combined.includes('platform referral')) return 'finance investment business';
  if (combined.includes('home') || combined.includes('furniture') || combined.includes('interior') || combined.includes('decor') || combined.includes('living')) return 'home interior design';
  if (combined.includes('music') || combined.includes('concert') || combined.includes('audio') || combined.includes('podcast')) return 'music concert audio';
  if (combined.includes('book') || combined.includes('reading') || combined.includes('novel') || combined.includes('author')) return 'books reading library';
  if (combined.includes('car') || combined.includes('auto') || combined.includes('vehicle') || combined.includes('drive')) return 'automobile car luxury';
  if (combined.includes('real estate') || combined.includes('property') || combined.includes('house') || combined.includes('apartment')) return 'real estate property';
  if (combined.includes('medical') || combined.includes('health') || combined.includes('clinic') || combined.includes('doctor') || combined.includes('iron') || combined.includes('pharma')) return 'healthcare medical wellness';
  if (combined.includes('baby') || combined.includes('kids') || combined.includes('children') || combined.includes('family')) return 'family children happy';
  if (combined.includes('wedding') || combined.includes('bride') || combined.includes('event') || combined.includes('party')) return 'wedding event celebration';
  if (combined.includes('holiday') || combined.includes('summer') || combined.includes('winter') || combined.includes('season')) return 'seasonal lifestyle';
  if (combined.includes('spiro') || combined.includes('beverage') || combined.includes('soda') || combined.includes('carbonat')) return 'beverage drink refreshing';

  const stopWords = new Set(['the','a','an','and','or','of','in','for','to','with','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','on','at','by','from','as','into','through','about','above','below','between','up','down','out','off','over','under','again','further','then','once','its','our','your','their','per','&']);
  const words = title.split(/[\s,-]+/).filter(w => w.length > 2 && !stopWords.has(w.toLowerCase())).slice(0, 3);
  if (words.length > 0) return words.join(' ');

  return 'marketing business professional';
}

function isRealImageUrl(materials: string): boolean {
  if (!materials || materials.length < 6) return false;
  const m = materials.trim();
  if (m.startsWith('blob:http://localhost') || m.startsWith('blob:http://127')) return false;
  if (m.startsWith('[IMAGE:') || m.startsWith('[image:')) return false;
  const ext = m.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  if (['zip','pdf','doc','docx','txt','mp4','avi','mov'].includes(ext)) return false;
  if (m.includes('\n') || m.includes('Target Audience') || m.includes('Min Followers') || m.includes('Campaign Brief')) return false;
  if (m.startsWith('http') || m.startsWith('https')) {
    const hasImgExt = ['jpg','jpeg','png','webp','gif','avif','svg'].some(e => m.toLowerCase().includes(e));
    const isCDN = m.includes('unsplash') || m.includes('cloudinary') || m.includes('imgix') || m.includes('cdn');
    return hasImgExt || isCDN;
  }
  if (m.startsWith('/')) {
    return ['jpg','jpeg','png','webp','gif','avif','svg'].some(e => m.toLowerCase().endsWith(e));
  }
  return false;
}

function getCampaignImage(campaign: CampaignDto, index: number): string {
  const materials = (campaign.promotionalMaterials || '').trim();
  const title = (campaign.title || '').trim();

  const localImages: Record<string, string> = {
    'Back to School Fashion': '/images/campaigns/Back to School Fashion.png',
    'Cloud Services Campaign': '/images/campaigns/Cloud Services Campaign.png',
    'Coffee Brand Ambassador': '/images/campaigns/Coffee Brand Ambassador.png',
    'FinTech App Launch': '/images/campaigns/FinTech App Launch.png',
    'Fitness Supplement Launch': '/images/campaigns/Fitness Supplement Launch.png',
    'Gadget Review Program': '/images/campaigns/Gadget Review Program.png',
    'Language Learning App': '/images/campaigns/Language Learning App.png',
    "Men's Streetwear Drop": "/images/campaigns/Men's Streetwear Drop.png",
    'Summer Tech Sale': '/images/campaigns/Summer Tech Sale.png',
    'Gaming Tournament Sponsor': '/images/campaigns/gaming-tournament-sponsor..png',
    'AI Tools Early Access': '/images/campaigns/AI Tools Early Access.png',
    'Adventure Tours Campaign': '/images/campaigns/Adventure Tours Campaign.png',
    'Gourmet Delivery Service': '/images/campaigns/Gourmet Delivery Service.png',
    'Investment Platform Referral': '/images/campaigns/Investment Platform Referral.png',
    'Online Courses Promo': '/images/campaigns/Online Courses Promo.png',
    'Organic Health Products': '/images/campaigns/Organic Health Products.png',
    'Winter Fashion Collection': '/images/campaigns/Winter Fashion Collection.png',
    'Spiro Spathis': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&auto=format&fit=crop',
    'Iron Vital ': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop',
    'Iron Vital': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop',
    'DawaUK - Smart Med': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop',
    'PureWave: The Eco-Clean Revolution': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop',
    'Titan X Pro: Infinite Vision Launch': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop',
    'Healthy Meal Prep 2026': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop',
    'Tech Synergy': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
    'Global Sustainable Energy Drive 2026': 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop',
    'Back to School Tech Expo 2026': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop',
    'Software Launch Promo': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop',
  };

  if (localImages[title]) return localImages[title];
  if (localImages[title.trim()]) return localImages[title.trim()];

  if (isRealImageUrl(materials)) {
    if (materials.startsWith('http')) return materials;
    return `${API_BASE_URL.replace(/\/$/, '')}${materials.startsWith('/') ? '' : '/'}${materials}`;
  }

  const keyword = buildUnsplashKeyword(campaign);
  const seed = seededIndex(campaign.id, index + 1);
  return `https://images.unsplash.com/photo-${getUnsplashPhotoId(keyword, seed)}?w=800&auto=format&fit=crop`;
}

// Deterministic high-quality Unsplash photo IDs mapped to themes
function getUnsplashPhotoId(keyword: string, seed: number): string {
  const themed: Record<string, string[]> = {
    'camping outdoor nature': ['1504280390367-361c6d9f38f4','1478131143081-80374eb27a30','1532339142463-fd0a8979791a','1510672981848-a1d8e04ce3c3','1464822759023-fed622ff2c3b'],
    'fashion clothing style': ['1490481651871-ab68de25d43d','1483985988355-763728e1935b','1558769132-cb1aea458c5e','1515886657613-9f3515b0c78f','1469334031218-e382a71b716b'],
    'gaming esports': ['1542751371-adc38448a05e','1511512578047-dfb367046420','1606318801954-d46d07ceec7e','1493711662062-fa541adb3fc8','1550745165-9bc0b252726f'],
    'gourmet food restaurant': ['1504674900247-0877df9cc836','1476224484781-7c8918ad773f','1414235077428-338989a2e8c0','1565299624946-b28f40a0ae38','1567620905732-2d1ec7ab7445'],
    'travel adventure tourism': ['1476514525535-07fb3b4ae5f1','1503220317375-aaad61436b1b','1488085061851-e3d3e3f5b0a4','1501555088652-021faa106b9b','1530521954074-e64f4ca239d5'],
    'technology digital innovation': ['1550009158-9ebf69173e03','1519389950473-47ba0277781c','1518770660439-4636190af475','1531297484001-80022131f5a1','1488229297570-58520851e868'],
    'beauty skincare wellness': ['1522335789203-aabd1fc54bc9','1596462502278-27bfad450526','1487412947147-5cebf100d293','1598440947619-2c35fc9aa181','1571781926291-c226a4aeee37'],
    'fitness gym workout': ['1517836357463-d25dfeac3438','1534438327276-14e5300c3a48','1571019613454-1cb2f99b2d8b','1540496905036-5937c10647cc','1526506118085-60ce8714f8c5'],
    'education learning books': ['1497633762265-9d179a990aa6','1524178232363-1fb2b075b655','1456513080510-7bf3a84b82f8','1434030216411-0b793f4b6f6e','1513258496099-48168024aec0'],
    'pets animals cute': ['1450778869180-41d0601e046e','1587300003388-59208cc962cb','1548681286-6f8a38a6e30d','1518020382113-a7e8fc38eac9','1615751072497-5571d1fdfd54'],
    'finance investment business': ['1591696208181-1c2c56a4274c','1560472354-b33ff0c44a43','1518458028785-8fbcd101ebb9','1611974789855-9c2a0a7236a3','1554224155-8d04cb21cd6c'],
    'home interior design': ['1586023492125-27b2c045efd3','1484101403633-562f891dc89a','1555041469-a586c61ea9bc','1616046229478-9d57a56b6a97','1449844908441-8931da31e96d'],
    'music concert audio': ['1514320291840-2e0a9bf2a9ae','1501386761578-eac5c294458a','1493225457124-a3eb161ffa5f','1471478331149-d8a5e4ebca1e','1505740420928-5e560c06d30e'],
    'healthcare medical wellness': ['1576091160399-112ba8d25d1d','1559757148-5c350d0d3c56','1505751171990-4a85f0f5e6a0','1628348068343-c6a848d2b6dd','1582750433449-648ed127bb54'],
    'automobile car luxury': ['1492144534655-ae79c964c9d7','1502877338535-766e1452684a','1568605117036-5fe5e7bab0b7','1553440569-bcc63803a83d','1544636331-9884bcd05f49'],
    'family children happy': ['1476703768199-a77f0c8f6a4a','1511895426328-dc8714191011','1502086223501-7ea6ecd79368','1473978488099-b28ec7d00c98','1545558014-8692077e9b5c'],
    'beverage drink refreshing': ['1544145945-f90425340c7e','1551024709-8f23befc548e','1495474472287-4d71bcdd2085','1516062423079-7ca13cdc7f54','1559181567-c3190af32376'],
    'real estate property': ['1560518883-ce09059eeffa','1582407947304-9ee126363a89','1484154218962-a197022b5858','1600607687939-a83c1c27e27c','1522708323590-d24dbb2b065e'],
    'marketing business professional': ['1557804506-669a67965ba0','1521737604082-abdcbcbd1e26','1454165804606-c3d57bc86b40','1507679799987-c73779587ccf','1516321318423-f06f85e504b3'],
  };

  // Find the best matching theme
  const kwLow = keyword.toLowerCase();
  for (const [theme, ids] of Object.entries(themed)) {
    const themeWords = theme.split(' ');
    if (themeWords.some(w => kwLow.includes(w))) {
      return ids[seed % ids.length];
    }
  }

  // Default business/marketing images
  const defaults = themed['marketing business professional'];
  return defaults[seed % defaults.length];
}


function getCommissionLabel(type?: CommissionType, value?: number): string {
  if (!value || isPlaceholder(String(value))) return '—'
  switch (type) {
    case 'Percentage': return `${value}% per sale`
    case 'Fixed': return `EGP ${value} per action`
    default: return `${value}%`
  }
}

function isPlaceholder(val?: string | null): boolean {
  if (!val) return true;
  const v = val.toLowerCase().trim();
  return v === 'string' || v === 'undefined' || v === 'null';
}

export default function FindCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([])
  const [recommended, setRecommended] = useState<CampaignDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState(() => {
    return localStorage.getItem('affiliance_campaigns_search') || ''
  })
  const [selectedCategory, setSelectedCategory] = useState<number | null>(() => {
    const saved = localStorage.getItem('affiliance_campaigns_category')
    return saved ? parseInt(saved) : null
  })
  const [showRecommended, setShowRecommended] = useState(() => {
    return localStorage.getItem('affiliance_campaigns_recommended') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('affiliance_campaigns_search', search)
    localStorage.setItem('affiliance_campaigns_category', selectedCategory ? String(selectedCategory) : '')
    localStorage.setItem('affiliance_campaigns_recommended', String(showRecommended))
  }, [search, selectedCategory, showRecommended])
  const [applying, setApplying] = useState<number | null>(null)
  const [withdrawing, setWithdrawing] = useState<number | null>(null)
  const [applicationMap, setApplicationMap] = useState<Record<number, { id: number, status: string }>>(() => {
    return JSON.parse(localStorage.getItem('affiliance_application_map') || '{}')
  })
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null)
  const [loadingCampaignId, setLoadingCampaignId] = useState<number | null>(null)
  const [restrictedAlert, setRestrictedAlert] = useState<{isOpen: boolean, campaignName: string, campaignId?: number}>({isOpen: false, campaignName: ''})
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false)

  const saveApplicationMap = (map: Record<number, { id: number, status: string }>) => {
    localStorage.setItem('affiliance_application_map', JSON.stringify(map))
    setApplicationMap(map)
  }

  const handleViewDetails = async (id: number) => {
    setLoadingCampaignId(id)
    try {
      const res = await campaignApi.get1(id)
      setSelectedDetails((res as any)?.data || res)
    } catch (err: any) {
      toast.error('Failed to load campaign details')
    } finally {
      setLoadingCampaignId(null)
    }
  }

  const loadCampaigns = useCallback(async (isNextPage = false) => {
    if (isNextPage) setLoadingMore(true);
    else setLoading(true)

    try {
      const pageSize = 12
      const currentPage = isNextPage ? page + 1 : 1

      const params: any = {
        IsActive: true,
        Page: currentPage,
        PageSize: pageSize,
      }
      if (search) params.SearchKeyword = search
      if (selectedCategory) params.CategoryId = selectedCategory

      const [searchRes, recCampaignsRes, aiMetaRes] = await Promise.all([
        campaignApi.getsearch(params),
        showRecommended && !isNextPage ? campaignApi.getrecommended({ limit: 4 }).catch(() => null) : Promise.resolve(null),
        showRecommended && !isNextPage ? marketerApi.getmyaisuggestions({ limit: 4 }).catch(() => null) : Promise.resolve(null),
      ])

      const isReal = (c: any) => {
        const title = (c.title || c.campaignTitle || '').toLowerCase()
        return !title.includes('test') && !title.includes('loai') && title !== 'string'
      }
      
      const searchData = (searchRes as any)?.items || (searchRes as any)?.data?.items || (searchRes as any)?.data || []
      const filtered = Array.isArray(searchData) ? searchData.filter(isReal) : []
      
      if (isNextPage) {
        setCampaigns(prev => [...prev, ...filtered])
        setPage(currentPage)
      } else {
        setCampaigns(filtered)
        setPage(1)
      }

      setHasMore(filtered.length === pageSize)
      
      // Zip Recommended Campaigns with AI Meta (Score & Reason)
      if (recCampaignsRes && !isNextPage) {
        const recRaw = (recCampaignsRes as any)?.items || (recCampaignsRes as any)?.data?.items || (recCampaignsRes as any)?.data || []
        const metaRaw = (aiMetaRes as any)?.items || (aiMetaRes as any)?.data?.items || (aiMetaRes as any)?.data || []
        
        const recList = Array.isArray(recRaw) ? recRaw : []
        const metaList = Array.isArray(metaRaw) ? metaRaw : []

        const enriched = recList.filter(isReal).map((c: any) => {
          const meta = metaList.find((m: any) => (m.campaignId || m.CampaignId) === c.id)
          return {
            ...c,
            matchScore: meta ? (meta.matchScore || meta.MatchScore) : Math.floor(92 + Math.random() * 7),
            matchReason: meta ? (meta.matchReason || meta.MatchReason) : 'Top match for your audience'
          }
        })
        setRecommended(enriched)
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err)
      if (!isNextPage) setCampaigns([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [search, selectedCategory, showRecommended, page])

  useEffect(() => {
    // Sync Category List
    categoryApi.get().then(res => {
      const apiList = (res as any)?.items || (res as any)?.data || res || []
      const filtered = Array.isArray(apiList) ? apiList.filter((cat: any) => {
        const nameEn = (cat.nameEn || '').toLowerCase().trim()
        const isTest = nameEn.includes('test') || nameEn.includes('loai') || nameEn === 'string' || nameEn === ''
        return !isTest
      }) : []
      setCategories(filtered)
    }).catch(() => setCategories([]))

    // Sync Existing Applications Map
    marketerApi.getmyapplications({ PageSize: 100 }).then(res => {
      const apps = (res as any)?.items || (res as any)?.data?.items || (res as any)?.data || []
      if (Array.isArray(apps)) {
        const map: Record<number, { id: number, status: string }> = {}
        apps.forEach((app: any) => {
          if (app.campaignId && app.id) {
            map[app.campaignId] = { id: app.id, status: app.status || 'Pending' }
          }
        })
        saveApplicationMap(map)
      }
    }).catch(err => console.error('Failed to sync applications', err))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadCampaigns(false), 300)
    return () => clearTimeout(timer)
  }, [search, selectedCategory, showRecommended])

  const handleApply = async (id: number) => {
    const appInfo = applicationMap[id]
    
    // If it's withdrawn, the user can't re-apply due to backend lock
    if (appInfo?.status === 'Withdrawn') {
      const camp = displayCampaigns.find(c => c.id === id) || campaigns.find(c => c.id === id)
      setRestrictedAlert({ isOpen: true, campaignName: camp?.title || 'this campaign', campaignId: id })
      return
    }

    if (appInfo) {
      // Withdraw Path
      setWithdrawing(id)
      try {
        await campaignApi.postapplicationswithdraw(appInfo.id)
        const next = { ...applicationMap, [id]: { ...appInfo, status: 'Withdrawn' } }
        saveApplicationMap(next)
        toast.success('Application withdrawn successfully')
        loadCampaigns()
      } catch (err: any) {
        toast.error('Failed to withdraw application')
      } finally {
        setWithdrawing(null)
      }
      return
    }

    // Apply Path
    setApplying(id)
    const campaign = displayCampaigns.find(c => c.id === id)
    if (campaign) {
      activityTracker.addActivity({
        description: `Applied to ${campaign.title} campaign`,
        type: 'application'
      })
    }

    try {
      const res = await campaignApi.postapply(id)
      const newApp = (res as any)?.data || res
      const next = { ...applicationMap, [id]: { id: newApp.id, status: 'Pending' } }
      saveApplicationMap(next)
      toast.success('Applied successfully!')
      loadCampaigns()
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('409') || msg.includes('400') || msg.includes('already exists')) {
        toast.error('Application already processed. Refreshing status...')
        // Sync map again to find the hidden application ID
        marketerApi.getmyapplications({ PageSize: 100, CampaignId: id }).then(res => {
          const apps = (res as any)?.items || (res as any)?.data?.items || (res as any)?.data || []
          if (Array.isArray(apps) && apps.length > 0) {
            saveApplicationMap({ ...applicationMap, [id]: { id: apps[0].id, status: apps[0].status } })
          }
        })
      } else {
        toast.error('Failed to apply. Please try again.')
      }
    } finally {
      setApplying(null)
    }
  }

  const handleRequestReapply = async () => {
    if (!restrictedAlert.campaignId) return;
    const appInfo = applicationMap[restrictedAlert.campaignId];
    setIsSubmittingSupport(true);
    try {
      await complaintApi.post({
        subject: 'Re-apply Request',
        description: `Marketer wants to re-apply for campaign: "${restrictedAlert.campaignName}" (ID: ${restrictedAlert.campaignId}). Application ID: ${appInfo?.id || 'Unknown'}. Please review and enable re-application.`,
        campaignId: restrictedAlert.campaignId,
        defendantId: 1 // Default to admin
      });
      toast.success('Admin has been notified of your request');
      setRestrictedAlert({ isOpen: false, campaignName: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    } finally {
      setIsSubmittingSupport(false);
    }
  }

  const recommendedIds = new Set(recommended.map(c => c.id))
  // displayCampaigns now always contains the searched items
  const displayCampaigns = campaigns

  const totalCount = displayCampaigns.length

  return (
    <div className="flex gap-8">
      {/* Left Sidebar */}
      <aside className="hidden lg:block w-[240px] flex-shrink-0">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] placeholder:text-gray-400"
          />
        </div>

        {/* Recommended Toggle */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#FBBF24]" />
            <span className="text-[13px] font-bold text-slate-900">Recommended</span>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showRecommended}
              onChange={(e) => setShowRecommended(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
            <span className="text-[13px] text-gray-600">Show AI Recommended</span>
          </label>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wide mb-4">Categories</h3>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-[#1E3A8A] text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Grid3X3 className="w-4 h-4" />
                  All Categories
                </span>
                <span className={`text-[11px] font-bold ${selectedCategory === null ? 'text-blue-200' : 'text-gray-400'}`}>
                  {totalCount}
                </span>
              </button>
            </li>
            {categories.map((cat) => {
              const CatIcon = categoryIcons[cat.nameEn ?? ''] || ChevronRight
              const catCount = campaigns.filter(c => c.categoryId === cat.id).length
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat.id ?? null)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[#1E3A8A] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <CatIcon className="w-4 h-4" />
                      {cat.nameEn}
                    </span>
                    <span className={`text-[11px] font-bold ${selectedCategory === cat.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {catCount}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="text-[28px] font-black text-slate-900 tracking-tight">
              {showRecommended ? 'For You' : 'All Campaigns'}
            </h1>
            <p className="text-[14px] text-gray-500 mt-1 font-medium">
              {showRecommended && recommended.length > 0
                ? `Showing ${recommended.length} top matches based on your profile`
                : `${totalCount} active campaigns available today`}
            </p>
          </div>
          {showRecommended && (
             <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
               <Sparkles className="w-3.5 h-3.5 text-[#1E3A8A] animate-pulse" />
               <span className="text-[11px] font-black text-[#1E3A8A] uppercase tracking-wider">Genie Active</span>
             </div>
          )}
        </div>

        {/* AI RECOMMENDED SECTION - Premium Display */}
        {showRecommended && recommended.length > 0 && (
          <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-[18px] font-black text-slate-900">Top AI Matches</h2>
                <p className="text-[12px] text-slate-500 font-medium">Personalized recommendations for your niche</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6 p-1">
              {recommended.map((campaign: any) => {
                const rating = (4.5 + Math.random() * 0.4).toFixed(1)
                
                return (
                  <div 
                    key={`rec-${campaign.id}`} 
                    className="group bg-white rounded-[32px] p-6 border-2 border-blue-50 hover:border-blue-200 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden flex flex-col h-full"
                  >
                    {/* Premium Match Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-white/90 backdrop-blur-sm border border-blue-100 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[11px] font-black text-[#1E3A8A]">{campaign.matchScore || 98}% Match</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                        {categoryIcons[campaign.categoryName || ''] ? React.createElement(categoryIcons[campaign.categoryName || ''], { className: "w-8 h-8 text-[#1E3A8A]" }) : '🚀'}
                      </div>
                      <div className="flex-1 min-w-0 pr-16">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{campaign.categoryName || 'General'}</span>
                        </div>
                        <h3 className="font-black text-[17px] text-slate-900 leading-tight group-hover:text-[#1E3A8A] transition-colors">{campaign.title || campaign.campaignTitle}</h3>
                        {campaign.matchReason && (
                          <p className="text-[11px] text-slate-500 mt-2 font-medium line-clamp-1 italic">
                            "{campaign.matchReason}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Earning</p>
                        <p className="font-black text-[#1E3A8A] text-[15px]">{campaign.commissionValue || '15'}% <span className="text-[10px] text-slate-400 font-bold ml-0.5">Rev</span></p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                        <p className="font-black text-slate-900 text-[15px]">{rating} <span className="text-yellow-400 ml-0.5">★</span></p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <button
                        onClick={() => handleViewDetails(campaign.id!)}
                        className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-[13px] hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleApply(campaign.id!)}
                        disabled={applying === campaign.id || withdrawing === campaign.id}
                        className={`flex-1 px-4 py-3 rounded-2xl font-black text-[13px] transition-all shadow-sm active:scale-95 disabled:opacity-50 relative group/btn ${
                          applicationMap[campaign.id!]?.status === 'Withdrawn'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : applicationMap[campaign.id!]
                              ? 'bg-emerald-500 text-white hover:bg-rose-500 hover:shadow-rose-100'
                              : 'bg-white text-slate-900 border-2 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span className={applicationMap[campaign.id!] && applicationMap[campaign.id!]?.status !== 'Withdrawn' ? 'group-hover/btn:hidden' : ''}>
                          {applying === campaign.id ? '...' : 
                           withdrawing === campaign.id ? '...' : 
                           applicationMap[campaign.id!]?.status === 'Withdrawn' ? 'Withdrawn' :
                           applicationMap[campaign.id!] ? 'Applied ✓' : 'Quick Apply'}
                        </span>
                        {applicationMap[campaign.id!] && applicationMap[campaign.id!]?.status !== 'Withdrawn' && (
                          <span className="hidden group-hover/btn:inline text-white">
                            Withdraw?
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-12 flex items-center gap-4">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Explore More Campaigns</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>
          </div>
        )}

        {/* Mobile search */}
        <div className="lg:hidden mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A]"
          />
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-20">
            <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading campaigns...
          </div>
        ) : displayCampaigns.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="font-bold text-[20px] text-slate-900 mb-2">No campaigns found</h3>
            <p className="text-[14px] text-gray-500 max-w-sm mx-auto mb-8">
              We couldn't find any campaigns matching your filters. Try adjusting your search or ask Genie for help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => {setSearch(''); setSelectedCategory(null);}}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-[14px] hover:bg-gray-200 transition-all"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {displayCampaigns.map((campaign, index) => {
              const isRec = recommendedIds.has(campaign.id)
              const rating = (4 + Math.random() * 0.9).toFixed(1)
              return (
                <div key={campaign.id ?? index} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  {/* Image */}
                  <div className="relative h-[200px] overflow-hidden">
                    <img
                      src={getCampaignImage(campaign, index)}
                      alt={campaign.title ?? 'Campaign'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {loadingCampaignId === campaign.id && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {isRec && (
                      <div className="absolute top-3 right-3 bg-[#1E3A8A] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" /> Recommended
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[16px] text-slate-900 leading-snug group-hover:text-[#1E3A8A] transition-colors truncate">
                          {isPlaceholder(campaign.title) ? 'Featured Campaign' : campaign.title}
                        </h3>
                        <p className="text-[12px] text-gray-400 mt-0.5">{isPlaceholder(campaign.companyName) ? 'Verified Company' : campaign.companyName}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[13px] font-bold text-slate-900 ml-3">
                        <Star className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" /> {rating}
                      </div>
                    </div>
                    
                    <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-5">
                      {campaign.description || 'Promote our products and earn commissions. Join this exciting campaign to grow your affiliate marketing portfolio.'}
                    </p>

                    {/* Meta Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-[13px] text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>Cairo, Egypt</span>
                      </div>
                      <div className="flex items-center gap-4 text-[13px]">
                        <span className="flex items-center gap-1.5 text-green-600 font-bold">
                          <span className="text-[14px]">$</span> {getCommissionLabel(campaign.commissionType, campaign.commissionValue)}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <Users className="w-4 h-4 text-[#1E3A8A]" /> {campaign.acceptedApplicationsCount ?? 0} marketers
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                      <div className="flex items-center gap-2 pt-5 border-t border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5 truncate">Total Budget</p>
                          <p className="text-[14px] font-bold text-slate-900 truncate">
                            EGP {campaign.budget ? Number(campaign.budget).toLocaleString() : '—'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(campaign.id!)}
                            className="px-4 py-2 rounded-lg text-[13px] font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => campaign.id && handleApply(campaign.id)}
                            disabled={applying === campaign.id || withdrawing === campaign.id}
                            className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 relative group/btn ${
                              applicationMap[campaign.id!]?.status === 'Withdrawn'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : applicationMap[campaign.id!]
                                  ? 'bg-emerald-500 text-white hover:bg-rose-500 hover:shadow-rose-100'
                                  : 'bg-[#1E3A8A] text-white hover:bg-[#152C6E]'
                            }`}
                          >
                            <span className={applicationMap[campaign.id!] && applicationMap[campaign.id!]?.status !== 'Withdrawn' ? 'group-hover/btn:hidden' : ''}>
                              {applying === campaign.id ? 'Applying...' : 
                               withdrawing === campaign.id ? 'Removing...' : 
                               applicationMap[campaign.id!]?.status === 'Withdrawn' ? 'Withdrawn' :
                               applicationMap[campaign.id!] ? 'Applied ✓' : 'Apply Now'}
                            </span>
                            {applicationMap[campaign.id!] && applicationMap[campaign.id!]?.status !== 'Withdrawn' && (
                              <span className="hidden group-hover/btn:inline text-white">
                                Withdraw?
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Campaign Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDetails(null)}>
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedDetails(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all z-10"
            >
              <Users className="w-5 h-5 rotate-45" /> 
            </button>

            <div className="overflow-y-auto flex-1">
              <div className="h-64 relative">
                <img 
                  src={getCampaignImage(selectedDetails, 0)} 
                  alt={selectedDetails.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-600/30 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                      {selectedDetails.categoryName || 'Campaign'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white">{selectedDetails.title}</h2>
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commission</p>
                    <p className="text-xl font-black text-emerald-600">{getCommissionLabel(selectedDetails.commissionType, selectedDetails.commissionValue)}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Budget</p>
                    <p className="text-xl font-black text-[#1E3A8A]">EGP {selectedDetails.budget?.toLocaleString() || 'Unlimited'}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ends In</p>
                    <p className="text-xl font-black text-amber-600">{selectedDetails.daysRemaining || 30} Days</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-5 gap-10">
                  <div className="md:col-span-3 space-y-8">
                    <section>
                      <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        Campaign Description
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-[15px]">
                        {selectedDetails.description || 'No description provided.'}
                      </p>
                    </section>

                    {selectedDetails.promotionalMaterials && (
                      <section>
                        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                          <Grid3X3 className="w-5 h-5 text-purple-500" />
                          Marketer Brief
                        </h3>
                        <div className="bg-purple-50/50 p-6 rounded-3xl border border-purple-100 text-purple-900 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedDetails.promotionalMaterials}
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-8">
                    <div className="bg-slate-900 rounded-[32px] p-8 text-white">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Company Information</h4>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-white">
                          {selectedDetails.companyName?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="font-black text-[15px]">{selectedDetails.companyName || 'Affiliate Partner'}</p>
                          <p className="text-[11px] font-bold text-slate-400">Verified Brand</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleApply(selectedDetails.id!)}
                      disabled={applying === selectedDetails.id || withdrawing === selectedDetails.id}
                      className={`w-full py-5 rounded-2xl font-black text-[15px] transition-all shadow-xl active:scale-95 group/modal-btn ${
                        applicationMap[selectedDetails.id!]?.status === 'Withdrawn'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : applicationMap[selectedDetails.id!]
                            ? 'bg-emerald-500 text-white hover:bg-rose-500 shadow-emerald-100 hover:shadow-rose-100'
                            : 'bg-white text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className={applicationMap[selectedDetails.id!] && applicationMap[selectedDetails.id!]?.status !== 'Withdrawn' ? 'group-hover/modal-btn:hidden' : ''}>
                        {applying === selectedDetails.id ? 'Applying...' : 
                         withdrawing === selectedDetails.id ? 'Removing...' : 
                         applicationMap[selectedDetails.id!]?.status === 'Withdrawn' ? 'Previously Withdrawn' :
                         applicationMap[selectedDetails.id!] ? 'Already Applied' : 'Apply for Campaign'}
                      </span>
                      {applicationMap[selectedDetails.id!] && applicationMap[selectedDetails.id!]?.status !== 'Withdrawn' && (
                        <span className="hidden group-hover/modal-btn:inline">
                          Withdraw Application?
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasMore && (
            <div className="mt-12 flex justify-center pb-10">
              <button
                onClick={() => loadCampaigns(true)}
                disabled={loadingMore}
                className="px-8 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-900 font-black text-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 group disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Campaigns
                    <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {restrictedAlert.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[4px] animate-in fade-in duration-200" onClick={() => setRestrictedAlert({isOpen: false, campaignName: ''})}>
          <div className="bg-white rounded-[32px] w-full max-w-sm md:max-w-md shadow-2xl border border-slate-100 p-8 text-center animate-in zoom-in-95 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-rose-600"></div>
            
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-red-50/50">
              <ShieldAlert className="w-10 h-10" />
            </div>
            
            <h3 className="text-[22px] font-black text-slate-900 mb-3 tracking-tight">Access Restricted</h3>
            <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed">
              You have previously withdrawn your application for <span className="font-bold text-slate-900">"{restrictedAlert.campaignName}"</span>. For security reasons, re-applying to the same campaign is currently restricted.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setRestrictedAlert({isOpen: false, campaignName: ''})}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-[14px] hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 active:scale-[0.98]"
              >
                Understood
              </button>
              <button 
                onClick={handleRequestReapply}
                disabled={isSubmittingSupport}
                className="w-full py-3.5 bg-white border-2 border-slate-100 text-[#1E3A8A] rounded-2xl font-bold text-[14px] hover:bg-blue-50 hover:border-blue-100 transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmittingSupport ? 'Sending...' : 'Contact Support'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
