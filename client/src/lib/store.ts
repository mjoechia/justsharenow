import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'zh' | 'ta' | 'ms';

interface CampaignState {
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Customer Flow State
  selectedReview: string | null;
  selectedPhoto: string | null;
  selectedPlatform: string | null;
  setSelectedReview: (review: string) => void;
  setSelectedPhoto: (photo: string) => void;
  setSelectedPlatform: (platform: string) => void;
  
  // Admin/Stats State
  stats: Record<string, number>;
  incrementStat: (platform: string) => void;

  // Shop Configuration
  shopPhotos: string[];
  addShopPhoto: (photo: string) => void;
  removeShopPhoto: (index: number) => void;
  
  socialLinks: {
    google: string;
    facebook: string;
    instagram: string;
    xiaohongshu: string;
    website: string;
  };
  updateSocialLink: (platform: keyof CampaignState['socialLinks'], url: string) => void;
}

export const useStore = create<CampaignState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      
      selectedReview: null,
      selectedPhoto: null,
      selectedPlatform: null,
      setSelectedReview: (review) => set({ selectedReview: review }),
      setSelectedPhoto: (photo) => set({ selectedPhoto: photo }),
      setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
      
      stats: {
        google: 124,
        facebook: 85,
        instagram: 210,
        xiaohongshu: 340,
      },
      incrementStat: (platform) => set((state) => ({
        stats: {
          ...state.stats,
          [platform]: (state.stats[platform] || 0) + 1
        }
      })),

      shopPhotos: [],
      addShopPhoto: (photo) => set((state) => ({ shopPhotos: [...state.shopPhotos, photo] })),
      removeShopPhoto: (index) => set((state) => ({
        shopPhotos: state.shopPhotos.filter((_, i) => i !== index)
      })),

      socialLinks: {
        google: "",
        facebook: "",
        instagram: "",
        xiaohongshu: "",
        website: ""
      },
      updateSocialLink: (platform, url) => set((state) => ({
        socialLinks: { ...state.socialLinks, [platform]: url }
      })),
    }),
    {
      name: 'sharelor-storage',
    }
  )
);

export const translations = {
  en: {
    common: {
      next: "Next Step",
      back: "Back",
      confirm: "Confirm",
      share: "Share",
      copy: "Copy Text",
      copied: "Copied!",
      switch: "Switch",
      save: "Save",
      download: "Download",
      cancel: "Cancel",
      close: "Close",
      loading: "Loading...",
      error: "Error",
      success: "Success",
    },
    landing: {
      welcome: "Welcome to JustShareNow",
      uploadPhotos: "Upload photos in Admin Dashboard to display here",
      shareExperience: "Share Your Experience",
      tapPlatform: "Tap a platform to get started",
    },
    quickView: {
      shareUnlock: "Share and Unlock Rewards",
      scanToShare: "Scan to share your experience and get instant perks.",
      startReview: "Start Review Process",
      qrDownloaded: "QR Code Downloaded",
      imageSaved: "Image saved to your device.",
      downloadQR: "Download QR Code",
      cardSaved: "Card Saved!",
      cardImageSaved: "The card has been saved as an image.",
      saveAsImage: "Save as Image",
    },
    customer: {
      drafting: {
        title: "Share Your Experience",
        subtitle: "Select a photo and a review snippet to get started.",
        selectPhoto: "Select a Photo",
        selectReview: "Select a Review",
        addHashtags: "Add Hashtags (Optional)",
        hashtagsAdded: "hashtag(s) will be added to your review",
        switched: "Switched!",
        newPhotosReady: "New photos and reviews are ready for you.",
        reviewCopied: "Review Copied!",
        pasteInGoogle: "Your review text is copied. Paste it in Google Reviews.",
        textCopiedReady: "Text copied! Ready to paste.",
        photoDownloaded: "Photo Downloaded!",
        uploadPhoto: "Upload this photo when posting your review.",
        photoOpened: "Photo Opened",
        savePhoto: "Save the photo and upload it to your review.",
        copyAndOpen: "Copy & Open Google Review",
        savePhotoBtn: "Save Photo",
        yourPhoto: "Your Photo (download to upload on Google)",
        yourReview: "Your Review",
        reviewCopiedAuto: "Your review will be copied automatically!",
        step1: "1. Click Share",
        step2: "2. Paste in Google",
        step3: "3. Add Photo",
        reviewSets: [
          [
            "Wow, what an amazing experience! The team really knows what they're doing. Already planning my next visit!",
            "Best decision I've made this month. Professional, friendly, and the results speak for themselves!"
          ],
          [
            "Quick, professional, and exactly what I needed. 10/10 would come back!",
            "Finally found my go-to spot. Great vibes, great results, great people!"
          ],
          [
            "A friend recommended this place and I'm so glad I listened. Everything was seamless from start to finish.",
            "Been searching for quality service for months. This place exceeded every expectation!"
          ],
          [
            "Left feeling renewed and refreshed. Such a positive experience from start to finish.",
            "The approach here made all the difference. I felt valued as a customer the entire time."
          ],
          [
            "Super happy with my visit! Staff were so friendly and welcoming. Will definitely be back!",
            "Loved it! Chill atmosphere and fair prices. What more could you ask for?"
          ],
          [
            "Excellent service quality. Highly professional team that knows their craft.",
            "Impressed by the attention to detail. Thorough and results-oriented. Would recommend!"
          ],
          [
            "Thank you for such a wonderful experience! The team made me feel right at home.",
            "So grateful I discovered this place. You've gained a loyal customer!"
          ],
          [
            "First time here and I'm hooked! Now I understand why everyone raves about this place.",
            "New here but the team made it so easy. Patient, knowledgeable, and genuinely helpful."
          ],
          [
            "Tried several places before finding this one. The difference is night and day!",
            "After searching for ages, finally found the best spot. Quality is unmatched!"
          ],
          [
            "Outstanding service. Beautiful results. Five stars, no hesitation!",
            "Best experience I've had. Simple as that. Highly recommend!"
          ],
          [
            "The moment I walked in, I knew this was special. Pure quality from start to finish.",
            "Such attention to detail! Every aspect was thoughtfully crafted. Perfection."
          ],
          [
            "Back for my third visit and it keeps getting better! Consistent quality every time.",
            "Regular customer now and proud of it. If you haven't tried them, what are you waiting for?"
          ]
        ]
      },
      platform: {
        title: "Choose Platform",
        subtitle: "Select where you want to share your review.",
        instruction: "Click a platform to copy your review and open the app.",
        noPlatforms: "No sharing platforms are configured yet.",
        askOwner: "Please ask the store owner to set up social media links.",
        leaveReview: "Leave a Review",
        contactUs: "Contact Us",
        shareExperience: "Share Your Experience",
        googleFeedback: "We'd love to hear your feedback on Google!",
        copyXHS: "Copy your text and share your photo on XiaoHongShu!",
        xhsCopied: "Content Copied!",
        xhsPasteReady: "Open Xiaohongshu and paste to post.",
        xhsFlow: "Xiaohongshu Sharing Flow",
        xhsStep1: "Copy Content",
        xhsStep2: "Open XHS",
        xhsStep3: "Paste & Post",
        xhsDownloadPhoto: "Download photo to select in Xiaohongshu",
        xhsSavePhoto: "Save Photo",
        xhsOpenApp: "Open Xiaohongshu",
        xhsFastShare: "Fastest way to share on Xiaohongshu - just paste once!",
        shareFriends: "Share your experience with your friends!",
        shareTikTok: "Share your transformation on TikTok!",
        chatWhatsApp: "Chat with us on WhatsApp!",
        copyShare: "Copy & Share",
        openWhatsApp: "Open WhatsApp",
        selectRating: "Please select a rating",
        rateExperience: "How was your experience?",
        instagramNote: "Your review will be saved. Then you'll be directed to Instagram.",
        goToInstagram: "Go to Instagram",
        reviewCopied: "Review copied. Ready to paste!",
        facebookThankYou: "Thank you! Just one more step 👇",
        facebookPasteReady: "Your review and business link are copied. Create a post on your wall!",
        copyReviewText: "Copy Text",
        continueToFacebook: "Continue to Facebook",
        facebookNote: "Create a new post on your wall, paste your review, and tag the business!",
        everythingCopied: "Everything copied. Create a post on your wall and tag the business!",
        postOnFacebook: "Post on My Wall",
        followFbTitle: "Follow Us",
        followFbSubtitle: "Stay connected with us on Facebook!",
        followOnFacebook: "Follow on Facebook",
        followIgTitle: "Follow Us",
        followIgSubtitle: "Follow us on Instagram!",
        followOnInstagram: "Follow on Instagram",
        copied: "Copied!",
        shareOnXhs: "Share on XiaoHongShu",
        xhsSubtitle: "Copy and share your experience on XiaoHongShu!",
        copyAndOpen: "Copy & Open XiaoHongShu",
      }
    },
    admin: {
      dashboard: {
        title: "Campaign Dashboard",
        subtitle: "Track performance and manage your review campaigns.",
        totalScans: "Total Scans",
        topPlatform: "Top Platform",
        recentActivity: "Recent Activity",
        generateQR: "Generate QR Code",
        downloadKit: "Download Asset Kit",
        socialLinks: "Social Links",
        shopPhotos: "Shop Photos",
        sliderPhotos: "Slider Photos",
        aiDiscovery: "AI-Powered Discovery",
        aiScan: "AI will scan your website to find social media links and suggest photos for your shop.",
        findLinks: "Find Links",
        searching: "Searching...",
        suggestedPhotos: "Suggested Photos from Your Website",
        aiFoundPhotos: "AI found these photos that might work well in your shop. Click approve to add them.",
        suggestedHashtags: "Suggested Hashtags for Reviews",
        hashtagsHelp: "These hashtags can help customers when sharing reviews. Approve the ones you'd like to offer.",
        reviewHashtags: "Review Hashtags",
        customersUse: "Customers can use these hashtags when sharing their reviews.",
        addHashtag: "Add custom hashtag...",
        alreadyInList: "This hashtag is already in your list.",
        noHashtags: "No hashtags selected yet. Use AI discovery or add custom ones.",
        googleMapsHelp: "How to Find Your Google Maps Link",
        step1Open: "STEP 1 — Open Google Maps",
        step2Search: "STEP 2 — Search for Your Business",
        step3Select: "STEP 3 — Select Your Business",
        step4Copy: "STEP 4 — Copy Your Business Link",
        step5Paste: "STEP 5 — Paste the Link Into the App",
        done: "Done!",
        linkExplain: "You now have the correct Google Maps business link. This link ensures the system can detect the right business name, address, and review page.",
        googleReviewsUrl: "Google Reviews URL",
        facebookUrl: "Facebook URL",
        instagramUrl: "Instagram URL",
        xiaohongshuUrl: "XiaoHongShu URL",
        tiktokUrl: "TikTok URL",
        whatsappUrl: "WhatsApp URL",
        saveChanges: "Save Changes",
        saveRequired: "Save Changes (Required)",
        saving: "Saving...",
        unsavedChanges: "You have unsaved changes. Please save before leaving.",
        shopViewPhotos: "Shop View Photos",
        managePhotos: "Manage the photos available for customers to select.",
        maxPhotos: "Max 9 photos.",
        maxSliderPhotos: "Max 3 photos.",
        uploadPhoto: "Upload Photo",
        noSliderPhotos: "No slider photos yet.",
        uploadSliderHelp: "Upload photos or use AI discovery to add photos for your carousel.",
        aiSliderPhotos: "AI Suggested Slider Photos",
        sliderPerfect: "These eye-catching photos are perfect for your hero carousel. Click approve to add them.",
        placeIdRequired: "Place ID Required",
        enterPlaceId: "Please enter a Google Place ID or Google Maps link.",
        converting: "Converting your Google Maps link to a Place ID.",
        businessLink: "Google Maps business link",
        extractFailed: "Could not extract Place ID from the URL",
        businessVerified: "Business Verified & Saved!",
        verifiedSave: "Business verified. Please click Save Changes to persist.",
        enterPlaceFirst: "Please enter a Google Place ID first.",
        apiKeyRequired: "API Key Required",
        addApiKey: "Please add GOOGLE_PLACES_API_KEY in your secrets to fetch reviews.",
        noReviews: "No Reviews Found",
        noReviewsFound: "No reviews were found for this business.",
        limitReached: "Limit Reached",
        maxPhotosReached: "You can only upload up to 9 photos.",
        checkGoogle: "Check in Google",
        verify: "Verify",
        businessConfirmed: "Business Confirmed!",
        nameUpdated: "Business name updated everywhere.",
        viewMaps: "View on Google Maps",
      }
    }
  },
  zh: {
    common: {
      next: "下一步",
      back: "返回",
      confirm: "确认",
      share: "分享",
      copy: "复制文本",
      copied: "已复制!",
      switch: "切换",
      save: "保存",
      download: "下载",
      cancel: "取消",
      close: "关闭",
      loading: "加载中...",
      error: "错误",
      success: "成功",
    },
    landing: {
      welcome: "欢迎来到 JustShareNow",
      uploadPhotos: "在管理后台上传照片以在此显示",
      shareExperience: "分享您的体验",
      tapPlatform: "点击平台开始",
    },
    quickView: {
      shareUnlock: "分享并解锁奖励",
      scanToShare: "扫描分享您的体验并获得即时福利。",
      startReview: "开始评论流程",
      qrDownloaded: "二维码已下载",
      imageSaved: "图片已保存到您的设备。",
      downloadQR: "下载二维码",
      cardSaved: "卡片已保存！",
      cardImageSaved: "卡片已保存为图片。",
      saveAsImage: "保存为图片",
    },
    customer: {
      drafting: {
        title: "分享您的体验",
        subtitle: "选择一张照片和一段评论以开始。",
        selectPhoto: "选择照片",
        selectReview: "选择评论",
        addHashtags: "添加标签（可选）",
        hashtagsAdded: "个标签将添加到您的评论中",
        switched: "已切换！",
        newPhotosReady: "新的照片和评论已为您准备好。",
        reviewCopied: "评论已复制！",
        pasteInGoogle: "您的评论文本已复制。请粘贴到Google评论中。",
        textCopiedReady: "文本已复制！准备粘贴。",
        photoDownloaded: "照片已下载！",
        uploadPhoto: "发布评论时上传此照片。",
        photoOpened: "照片已打开",
        savePhoto: "保存照片并上传到您的评论。",
        copyAndOpen: "复制并打开Google评论",
        savePhotoBtn: "保存照片",
        yourPhoto: "您的照片（下载后上传到Google）",
        yourReview: "您的评论",
        reviewCopiedAuto: "您的评论将自动复制！",
        step1: "1. 点击分享",
        step2: "2. 粘贴到Google",
        step3: "3. 添加照片",
        reviewSets: [
          [
            "哇，体验太棒了！团队真的很专业，已经在计划下次光顾了！",
            "这个月做的最好决定！专业、友好，效果显著！"
          ],
          [
            "快速、专业，正是我需要的。10分满分会再来！",
            "终于找到我的心仪之地。氛围好，效果棒，人也nice！"
          ],
          [
            "朋友推荐来的，真的没让我失望。整个过程都很顺畅。",
            "找了好几个月，这家完全超出预期！"
          ],
          [
            "离开时感觉焕然一新。从头到尾都是积极的体验。",
            "这里的服务让我感觉被重视。体验非常好！"
          ],
          [
            "非常满意这次光顾！员工很友好热情，一定会再来！",
            "太喜欢了！氛围轻松，价格公道，还要啥自行车？"
          ],
          [
            "服务质量一流。非常专业的团队。",
            "对细节的把控让我印象深刻，强烈推荐！"
          ],
          [
            "感谢这次美好的体验！团队让我有宾至如归的感觉。",
            "很庆幸发现了这家店，你们又多了一个忠实顾客！"
          ],
          [
            "第一次来就被圈粉了！终于明白大家为什么这么推荐了。",
            "新手友好！团队耐心、专业，非常贴心。"
          ],
          [
            "之前试过好几家，这家真的是天花板！",
            "找了好久终于找到最好的店，品质无敌！"
          ],
          [
            "服务一流，效果完美，五星好评！",
            "最好的体验，没有之一！强烈推荐！"
          ],
          [
            "一进门就觉得这里不一般。从头到尾都是高品质。",
            "每个细节都很用心。完美！"
          ],
          [
            "第三次来了，越来越好！每次品质都很稳定。",
            "已经是常客了！还没来过的朋友们，还在等什么？"
          ]
        ]
      },
      platform: {
        title: "选择平台",
        subtitle: "选择您想要分享评论的地方。",
        instruction: "点击平台以复制您的评论并打开应用程序。",
        noPlatforms: "尚未配置分享平台。",
        askOwner: "请联系店主设置社交媒体链接。",
        leaveReview: "留下评论",
        contactUs: "联系我们",
        shareExperience: "分享您的体验",
        googleFeedback: "我们很想听听您在Google上的反馈！",
        copyXHS: "复制文本并在小红书上分享您的照片！",
        xhsCopied: "内容已复制！",
        xhsPasteReady: "打开小红书后直接粘贴发布",
        xhsFlow: "小红书分享流程",
        xhsStep1: "复制内容",
        xhsStep2: "打开小红书",
        xhsStep3: "粘贴发布",
        xhsDownloadPhoto: "下载照片后在小红书中选择",
        xhsSavePhoto: "保存照片",
        xhsOpenApp: "打开小红书发布",
        xhsFastShare: "最快发布到小红书，只需粘贴一次",
        shareFriends: "与朋友分享您的体验！",
        shareTikTok: "在TikTok上分享您的转变！",
        chatWhatsApp: "在WhatsApp上与我们聊天！",
        copyShare: "复制并分享",
        openWhatsApp: "打开WhatsApp",
        selectRating: "请选择评分",
        rateExperience: "您的体验如何？",
        instagramNote: "您的评论将被保存。然后您将被引导到Instagram。",
        goToInstagram: "前往Instagram",
        reviewCopied: "评论已复制。准备粘贴！",
        facebookThankYou: "谢谢！只剩最后一步了 👇",
        facebookPasteReady: "您的评论和商家链接已复制。在您的动态发帖吧！",
        copyReviewText: "复制文本",
        continueToFacebook: "继续到Facebook",
        facebookNote: "在您的动态创建新帖子，粘贴评论并标记商家！",
        everythingCopied: "已复制全部内容。在您的动态发帖并标记商家！",
        postOnFacebook: "发布到我的动态",
        followFbTitle: "关注我们",
        followFbSubtitle: "在Facebook上与我们保持联系！",
        followOnFacebook: "在Facebook上关注",
        followIgTitle: "关注我们",
        followIgSubtitle: "在Instagram上关注我们！",
        followOnInstagram: "在Instagram上关注",
        copied: "已复制!",
        shareOnXhs: "分享到小红书",
        xhsSubtitle: "复制并在小红书上分享您的体验!",
        copyAndOpen: "复制并打开小红书",
      }
    },
    admin: {
      dashboard: {
        title: "活动仪表板",
        subtitle: "跟踪表现并管理您的评论活动。",
        totalScans: "总扫描数",
        topPlatform: "最佳平台",
        recentActivity: "近期活动",
        generateQR: "生成二维码",
        downloadKit: "下载资源包",
        socialLinks: "社交链接",
        shopPhotos: "店铺照片",
        sliderPhotos: "轮播照片",
        aiDiscovery: "AI智能发现",
        aiScan: "AI将扫描您的网站以查找社交媒体链接并为您的商店推荐照片。",
        findLinks: "查找链接",
        searching: "搜索中...",
        suggestedPhotos: "来自您网站的推荐照片",
        aiFoundPhotos: "AI发现这些照片可能适合您的商店。点击批准添加它们。",
        suggestedHashtags: "推荐的评论标签",
        hashtagsHelp: "这些标签可以帮助客户分享评论。批准您想提供的标签。",
        reviewHashtags: "评论标签",
        customersUse: "客户在分享评论时可以使用这些标签。",
        addHashtag: "添加自定义标签...",
        alreadyInList: "此标签已在您的列表中。",
        noHashtags: "尚未选择标签。使用AI发现或添加自定义标签。",
        googleMapsHelp: "如何查找您的Google地图链接",
        step1Open: "第1步 — 打开Google地图",
        step2Search: "第2步 — 搜索您的商家",
        step3Select: "第3步 — 选择您的商家",
        step4Copy: "第4步 — 复制您的商家链接",
        step5Paste: "第5步 — 将链接粘贴到应用程序中",
        done: "完成！",
        linkExplain: "您现在拥有正确的Google地图商家链接。此链接可确保系统检测到正确的商家名称、地址和评论页面。",
        googleReviewsUrl: "Google评论链接",
        facebookUrl: "Facebook链接",
        instagramUrl: "Instagram链接",
        xiaohongshuUrl: "小红书链接",
        tiktokUrl: "TikTok链接",
        whatsappUrl: "WhatsApp链接",
        saveChanges: "保存更改",
        saveRequired: "保存更改（必需）",
        saving: "保存中...",
        unsavedChanges: "您有未保存的更改。请在离开前保存。",
        shopViewPhotos: "店铺展示照片",
        managePhotos: "管理客户可选择的照片。",
        maxPhotos: "最多9张照片。",
        maxSliderPhotos: "最多3张照片。",
        uploadPhoto: "上传照片",
        noSliderPhotos: "尚无轮播照片。",
        uploadSliderHelp: "上传照片或使用AI发现为您的轮播添加照片。",
        aiSliderPhotos: "AI推荐的轮播照片",
        sliderPerfect: "这些引人注目的照片非常适合您的轮播展示。点击批准添加它们。",
        placeIdRequired: "需要Place ID",
        enterPlaceId: "请输入Google Place ID或Google地图链接。",
        converting: "正在将您的Google地图链接转换为Place ID。",
        businessLink: "Google地图商家链接",
        extractFailed: "无法从URL中提取Place ID",
        businessVerified: "商家已验证并保存！",
        verifiedSave: "商家已验证。请点击保存更改以保存。",
        enterPlaceFirst: "请先输入Google Place ID。",
        apiKeyRequired: "需要API密钥",
        addApiKey: "请在secrets中添加GOOGLE_PLACES_API_KEY以获取评论。",
        noReviews: "未找到评论",
        noReviewsFound: "未找到此商家的评论。",
        limitReached: "已达上限",
        maxPhotosReached: "您最多只能上传9张照片。",
        checkGoogle: "在Google中检查",
        verify: "验证",
        businessConfirmed: "商家已确认！",
        nameUpdated: "商家名称已在所有位置更新。",
        viewMaps: "在Google地图上查看",
      }
    }
  },
  ta: {
    common: {
      next: "அடுத்த படி",
      back: "பின்",
      confirm: "உறுதிப்படுத்து",
      share: "பகிர்",
      copy: "உரை நகலெடு",
      copied: "நகலெடுக்கப்பட்டது!",
      switch: "மாற்று",
      save: "சேமி",
      download: "பதிவிறக்கு",
      cancel: "ரத்து",
      close: "மூடு",
      loading: "ஏற்றுகிறது...",
      error: "பிழை",
      success: "வெற்றி",
    },
    landing: {
      welcome: "JustShareNow க்கு வரவேற்கிறோம்",
      uploadPhotos: "இங்கே காட்ட நிர்வாக டாஷ்போர்டில் புகைப்படங்களை பதிவேற்றவும்",
      shareExperience: "உங்கள் அனுபவத்தைப் பகிரவும்",
      tapPlatform: "தொடங்க ஒரு தளத்தைத் தட்டவும்",
    },
    quickView: {
      shareUnlock: "பகிர்ந்து வெகுமதிகளைப் பெறுங்கள்",
      scanToShare: "உங்கள் அனுபவத்தைப் பகிர்ந்து உடனடி சலுகைகளைப் பெற ஸ்கேன் செய்யவும்.",
      startReview: "மதிப்புரை செயல்முறையைத் தொடங்கு",
      qrDownloaded: "QR குறியீடு பதிவிறக்கப்பட்டது",
      imageSaved: "படம் உங்கள் சாதனத்தில் சேமிக்கப்பட்டது.",
      downloadQR: "QR குறியீட்டைப் பதிவிறக்கு",
      cardSaved: "அட்டை சேமிக்கப்பட்டது!",
      cardImageSaved: "அட்டை படமாக சேமிக்கப்பட்டது.",
      saveAsImage: "படமாக சேமி",
    },
    customer: {
      drafting: {
        title: "உங்கள் அனுபவத்தைப் பகிரவும்",
        subtitle: "ஒரு புகைப்படமும் மதிப்புரையும் தேர்ந்தெடுக்கவும்.",
        selectPhoto: "புகைப்படம் தேர்வு",
        selectReview: "மதிப்புரை தேர்வு",
        addHashtags: "ஹாஷ்டேக்குகள் சேர் (விருப்பமானது)",
        hashtagsAdded: "ஹாஷ்டேக்(கள்) உங்கள் மதிப்புரையில் சேர்க்கப்படும்",
        switched: "மாற்றப்பட்டது!",
        newPhotosReady: "புதிய புகைப்படங்களும் மதிப்புரைகளும் உங்களுக்குத் தயாராக உள்ளன.",
        reviewCopied: "மதிப்புரை நகலெடுக்கப்பட்டது!",
        pasteInGoogle: "உங்கள் மதிப்புரை உரை நகலெடுக்கப்பட்டது. Google மதிப்புரைகளில் ஒட்டவும்.",
        textCopiedReady: "உரை நகலெடுக்கப்பட்டது! ஒட்ட தயார்.",
        photoDownloaded: "புகைப்படம் பதிவிறக்கப்பட்டது!",
        uploadPhoto: "மதிப்புரை இடும்போது இந்தப் புகைப்படத்தைப் பதிவேற்றவும்.",
        photoOpened: "புகைப்படம் திறக்கப்பட்டது",
        savePhoto: "புகைப்படத்தைச் சேமித்து உங்கள் மதிப்புரையில் பதிவேற்றவும்.",
        copyAndOpen: "நகலெடுத்து Google மதிப்புரையைத் திற",
        savePhotoBtn: "புகைப்படம் சேமி",
        yourPhoto: "உங்கள் புகைப்படம் (Google-ல் பதிவேற்ற பதிவிறக்கவும்)",
        yourReview: "உங்கள் மதிப்புரை",
        reviewCopiedAuto: "உங்கள் மதிப்புரை தானாக நகலெடுக்கப்படும்!",
        step1: "1. பகிர் கிளிக் செய்",
        step2: "2. Google-ல் ஒட்டு",
        step3: "3. புகைப்படம் சேர்",
        reviewSets: [
          [
            "அற்புதமான அனுபவம்! குழு மிகவும் தொழில்முறையானது. அடுத்த வருகையை ஏற்கனவே திட்டமிடுகிறேன்!",
            "இந்த மாதம் எடுத்த சிறந்த முடிவு! தொழில்முறை, நட்பான, முடிவுகள் அற்புதம்!"
          ],
          [
            "வேகமான, தொழில்முறையான, எனக்கு தேவையான அனைத்தும். 10/10 மீண்டும் வருவேன்!",
            "என் விருப்பமான இடத்தைக் கண்டுபிடித்தேன். நல்ல சூழல், நல்ல முடிவுகள், நல்ல மக்கள்!"
          ],
          [
            "நண்பர் பரிந்துரைத்தார், கேட்டதில் மகிழ்ச்சி. எல்லாம் சீராக நடந்தது.",
            "பல மாதங்கள் தேடியபின், இது எல்லா எதிர்பார்ப்புகளையும் மீறியது!"
          ],
          [
            "புத்துணர்வுடன் வெளியேறினேன். ஆரம்பம் முதல் இறுதி வரை நேர்மறையான அனுபவம்.",
            "இங்கு நான் மதிப்பு பெற்றதாக உணர்ந்தேன். அற்புதமான அனுபவம்!"
          ],
          [
            "என் வருகையில் மிகவும் மகிழ்ச்சி! ஊழியர்கள் நட்பானவர்கள். நிச்சயம் மீண்டும் வருவேன்!",
            "மிகவும் பிடித்தது! அமைதியான சூழல், நியாயமான விலை!"
          ],
          [
            "சிறந்த சேவை தரம். மிகவும் தொழில்முறையான குழு.",
            "விவரங்களுக்கான கவனம் ஈர்த்தது. கண்டிப்பாகப் பரிந்துரைக்கிறேன்!"
          ],
          [
            "அற்புதமான அனுபவத்திற்கு நன்றி! குழு என்னை வீட்டில் உள்ளதுபோல் உணர வைத்தது.",
            "இந்த இடத்தைக் கண்டுபிடித்ததில் நன்றி. நீங்கள் ஒரு விசுவாசமான வாடிக்கையாளரைப் பெற்றீர்கள்!"
          ],
          [
            "முதல் முறை இங்கு, ஆனால் மிகவும் பிடித்தது! ஏன் எல்லோரும் பரிந்துரைக்கிறார்கள் என்று இப்போது புரிகிறது.",
            "புதியவர்களுக்கு ஏற்றது! குழு பொறுமையான, அறிவுள்ள, உதவிகரமானவர்கள்."
          ],
          [
            "பல இடங்களை முயற்சித்தேன், இது சிறந்தது! தரமும் சேவையும் ஒப்பற்றது!",
            "பல ஆண்டுகள் தேடியபின், சிறந்த இடத்தைக் கண்டுபிடித்தேன்!"
          ],
          [
            "சிறந்த சேவை. அழகான முடிவுகள். ஐந்து நட்சத்திரங்கள்!",
            "என்னுடைய சிறந்த அனுபவம். கண்டிப்பாகப் பரிந்துரைக்கிறேன்!"
          ],
          [
            "நுழைந்த தருணமே இது சிறப்பானது என்று தெரிந்தது. தரம் முதல் கடைசி வரை.",
            "ஒவ்வொரு விவரமும் கவனமாக செய்யப்பட்டது. சரியான!"
          ],
          [
            "மூன்றாவது முறை வருகிறேன், இன்னும் சிறப்பாகிறது! ஒவ்வொரு முறையும் ஒரே தரம்.",
            "இப்போது வழக்கமான வாடிக்கையாளர்! இன்னும் வராதவர்கள், என்ன காத்திருக்கிறீர்கள்?"
          ]
        ]
      },
      platform: {
        title: "தளம் தேர்வு",
        subtitle: "உங்கள் மதிப்புரையைப் பகிர விரும்பும் இடத்தைத் தேர்ந்தெடுக்கவும்.",
        instruction: "உங்கள் மதிப்புரையை நகலெடுத்து ஆப்பைத் திறக்க தளத்தைக் கிளிக் செய்யவும்.",
        noPlatforms: "இன்னும் பகிர்வு தளங்கள் உள்ளமைக்கப்படவில்லை.",
        askOwner: "சமூக ஊடக இணைப்புகளை அமைக்க கடை உரிமையாளரைக் கேளுங்கள்.",
        leaveReview: "மதிப்புரை எழுது",
        contactUs: "எங்களைத் தொடர்புகொள்ள",
        shareExperience: "உங்கள் அனுபவத்தைப் பகிரவும்",
        googleFeedback: "Google-ல் உங்கள் கருத்தைக் கேட்க விரும்புகிறோம்!",
        copyXHS: "உரையை நகலெடுத்து XiaoHongShu-ல் புகைப்படத்தைப் பகிரவும்!",
        xhsCopied: "உள்ளடக்கம் நகலெடுக்கப்பட்டது!",
        xhsPasteReady: "Xiaohongshu திறந்து ஒட்டவும்.",
        xhsFlow: "Xiaohongshu பகிர்வு",
        xhsStep1: "நகலெடு",
        xhsStep2: "XHS திற",
        xhsStep3: "ஒட்டு & பதிவிடு",
        xhsDownloadPhoto: "Xiaohongshu-ல் தேர்வுக்கு புகைப்படத்தைப் பதிவிறக்கு",
        xhsSavePhoto: "புகைப்படத்தைச் சேமி",
        xhsOpenApp: "Xiaohongshu திற",
        xhsFastShare: "Xiaohongshu-ல் பகிர்வதற்கான வேகமான வழி!",
        shareFriends: "உங்கள் நண்பர்களுடன் அனுபவத்தைப் பகிரவும்!",
        shareTikTok: "TikTok-ல் உங்கள் மாற்றத்தைப் பகிரவும்!",
        chatWhatsApp: "WhatsApp-ல் எங்களுடன் அரட்டையடிக்கவும்!",
        copyShare: "நகலெடுத்துப் பகிர்",
        openWhatsApp: "WhatsApp திற",
        selectRating: "மதிப்பீட்டைத் தேர்ந்தெடுக்கவும்",
        rateExperience: "உங்கள் அனுபவம் எப்படி இருந்தது?",
        instagramNote: "உங்கள் மதிப்புரை சேமிக்கப்படும். பின்னர் Instagram-க்கு அழைத்துச் செல்லப்படுவீர்கள்.",
        goToInstagram: "Instagram-க்கு செல்",
        reviewCopied: "மதிப்புரை நகலெடுக்கப்பட்டது. ஒட்ட தயார்!",
        facebookThankYou: "நன்றி! இன்னும் ஒரு படி மட்டுமே 👇",
        facebookPasteReady: "உங்கள் மதிப்புரை மற்றும் வணிக இணைப்பு நகலெடுக்கப்பட்டது. உங்கள் சுவரில் பதிவிடுங்கள்!",
        copyReviewText: "உரை நகலெடு",
        continueToFacebook: "Facebook-க்கு தொடரவும்",
        facebookNote: "உங்கள் சுவரில் புதிய பதிவை உருவாக்கி, மதிப்புரையை ஒட்டி, வணிகத்தை குறிக்கவும்!",
        everythingCopied: "அனைத்தும் நகலெடுக்கப்பட்டது. உங்கள் சுவரில் பதிவிட்டு வணிகத்தை குறிக்கவும்!",
        postOnFacebook: "என் சுவரில் பதிவிடு",
        followFbTitle: "எங்களைப் பின்தொடருங்கள்",
        followFbSubtitle: "Facebook-ல் எங்களுடன் இணைந்திருங்கள்!",
        followOnFacebook: "Facebook-ல் பின்தொடர்",
        followIgTitle: "எங்களைப் பின்தொடருங்கள்",
        followIgSubtitle: "Instagram-ல் எங்களைப் பின்தொடருங்கள்!",
        followOnInstagram: "Instagram-ல் பின்தொடர்",
        copied: "நகலெடுக்கப்பட்டது!",
        shareOnXhs: "XiaoHongShu-ல் பகிரவும்",
        xhsSubtitle: "XiaoHongShu-ல் உங்கள் அனுபவத்தை நகலெடுத்து பகிரவும்!",
        copyAndOpen: "நகலெடுத்து XiaoHongShu திறக்கவும்",
      }
    },
    admin: {
      dashboard: {
        title: "பிரச்சார டாஷ்போர்டு",
        subtitle: "செயல்திறனைக் கண்காணித்து உங்கள் மதிப்புரை பிரச்சாரங்களை நிர்வகிக்கவும்.",
        totalScans: "மொத்த ஸ்கேன்கள்",
        topPlatform: "சிறந்த தளம்",
        recentActivity: "சமீபத்திய செயல்பாடு",
        generateQR: "QR குறியீடு உருவாக்கு",
        downloadKit: "சொத்து தொகுப்பைப் பதிவிறக்கு",
        socialLinks: "சமூக இணைப்புகள்",
        shopPhotos: "கடை புகைப்படங்கள்",
        sliderPhotos: "ஸ்லைடர் புகைப்படங்கள்",
        aiDiscovery: "AI இயக்கப்படும் கண்டுபிடிப்பு",
        aiScan: "AI உங்கள் வலைத்தளத்தை ஸ்கேன் செய்து சமூக ஊடக இணைப்புகளைக் கண்டுபிடித்து புகைப்படங்களை பரிந்துரைக்கும்.",
        findLinks: "இணைப்புகளைக் கண்டுபிடி",
        searching: "தேடுகிறது...",
        suggestedPhotos: "உங்கள் வலைத்தளத்திலிருந்து பரிந்துரைக்கப்பட்ட புகைப்படங்கள்",
        aiFoundPhotos: "AI இந்த புகைப்படங்கள் உங்கள் கடைக்கு நன்றாக வேலை செய்யலாம் என்று கண்டுபிடித்தது. சேர்க்க ஒப்புக்கொள்ளவும்.",
        suggestedHashtags: "பரிந்துரைக்கப்பட்ட ஹாஷ்டேக்குகள்",
        hashtagsHelp: "இந்த ஹாஷ்டேக்குகள் வாடிக்கையாளர்கள் மதிப்புரைகளைப் பகிரும்போது உதவும்.",
        reviewHashtags: "மதிப்புரை ஹாஷ்டேக்குகள்",
        customersUse: "வாடிக்கையாளர்கள் மதிப்புரைகளைப் பகிரும்போது இந்த ஹாஷ்டேக்குகளைப் பயன்படுத்தலாம்.",
        addHashtag: "தனிப்பயன் ஹாஷ்டேக் சேர்...",
        alreadyInList: "இந்த ஹாஷ்டேக் ஏற்கனவே உங்கள் பட்டியலில் உள்ளது.",
        noHashtags: "இன்னும் ஹாஷ்டேக்குகள் தேர்ந்தெடுக்கப்படவில்லை.",
        googleMapsHelp: "உங்கள் Google Maps இணைப்பைக் கண்டுபிடிப்பது எப்படி",
        step1Open: "படி 1 — Google Maps திற",
        step2Search: "படி 2 — உங்கள் வணிகத்தைத் தேடு",
        step3Select: "படி 3 — உங்கள் வணிகத்தைத் தேர்ந்தெடு",
        step4Copy: "படி 4 — உங்கள் வணிக இணைப்பை நகலெடு",
        step5Paste: "படி 5 — இணைப்பை ஆப்பில் ஒட்டு",
        done: "முடிந்தது!",
        linkExplain: "இப்போது உங்களிடம் சரியான Google Maps வணிக இணைப்பு உள்ளது.",
        googleReviewsUrl: "Google மதிப்புரைகள் URL",
        facebookUrl: "Facebook URL",
        instagramUrl: "Instagram URL",
        xiaohongshuUrl: "XiaoHongShu URL",
        tiktokUrl: "TikTok URL",
        whatsappUrl: "WhatsApp URL",
        saveChanges: "மாற்றங்களைச் சேமி",
        saveRequired: "மாற்றங்களைச் சேமி (தேவை)",
        saving: "சேமிக்கிறது...",
        unsavedChanges: "சேமிக்கப்படாத மாற்றங்கள் உள்ளன.",
        shopViewPhotos: "கடை காட்சி புகைப்படங்கள்",
        managePhotos: "வாடிக்கையாளர்கள் தேர்ந்தெடுக்கக்கூடிய புகைப்படங்களை நிர்வகிக்கவும்.",
        maxPhotos: "அதிகபட்சம் 9 புகைப்படங்கள்.",
        maxSliderPhotos: "அதிகபட்சம் 3 புகைப்படங்கள்.",
        uploadPhoto: "புகைப்படம் பதிவேற்று",
        noSliderPhotos: "இன்னும் ஸ்லைடர் புகைப்படங்கள் இல்லை.",
        uploadSliderHelp: "புகைப்படங்களைப் பதிவேற்றவும் அல்லது AI கண்டுபிடிப்பைப் பயன்படுத்தவும்.",
        aiSliderPhotos: "AI பரிந்துரைத்த ஸ்லைடர் புகைப்படங்கள்",
        sliderPerfect: "இந்த கவர்ச்சியான புகைப்படங்கள் உங்கள் காரோசலுக்கு சரியானவை.",
        placeIdRequired: "Place ID தேவை",
        enterPlaceId: "Google Place ID அல்லது Google Maps இணைப்பை உள்ளிடவும்.",
        converting: "உங்கள் Google Maps இணைப்பை Place ID ஆக மாற்றுகிறது.",
        businessLink: "Google Maps வணிக இணைப்பு",
        extractFailed: "URL-லிருந்து Place ID பிரித்தெடுக்க முடியவில்லை",
        businessVerified: "வணிகம் சரிபார்க்கப்பட்டு சேமிக்கப்பட்டது!",
        verifiedSave: "வணிகம் சரிபார்க்கப்பட்டது. சேமிக்க Save Changes கிளிக் செய்யவும்.",
        enterPlaceFirst: "முதலில் Google Place ID உள்ளிடவும்.",
        apiKeyRequired: "API விசை தேவை",
        addApiKey: "மதிப்புரைகளைப் பெற secrets-ல் GOOGLE_PLACES_API_KEY சேர்க்கவும்.",
        noReviews: "மதிப்புரைகள் இல்லை",
        noReviewsFound: "இந்த வணிகத்திற்கு மதிப்புரைகள் இல்லை.",
        limitReached: "வரம்பை எட்டிவிட்டது",
        maxPhotosReached: "9 புகைப்படங்கள் வரை மட்டுமே பதிவேற்ற முடியும்.",
        checkGoogle: "Google-ல் சரிபார்",
        verify: "சரிபார்",
        businessConfirmed: "வணிகம் உறுதிப்படுத்தப்பட்டது!",
        nameUpdated: "வணிகப் பெயர் எல்லா இடங்களிலும் புதுப்பிக்கப்பட்டது.",
        viewMaps: "Google Maps-ல் காண்க",
      }
    }
  },
  ms: {
    common: {
      next: "Langkah Seterusnya",
      back: "Kembali",
      confirm: "Sahkan",
      share: "Kongsi",
      copy: "Salin Teks",
      copied: "Disalin!",
      switch: "Tukar",
      save: "Simpan",
      download: "Muat Turun",
      cancel: "Batal",
      close: "Tutup",
      loading: "Memuatkan...",
      error: "Ralat",
      success: "Berjaya",
    },
    landing: {
      welcome: "Selamat Datang ke JustShareNow",
      uploadPhotos: "Muat naik gambar di Papan Pemuka Admin untuk dipaparkan di sini",
      shareExperience: "Kongsi Pengalaman Anda",
      tapPlatform: "Ketik platform untuk bermula",
    },
    quickView: {
      shareUnlock: "Kongsi dan Buka Ganjaran",
      scanToShare: "Imbas untuk berkongsi pengalaman anda dan dapatkan faedah segera.",
      startReview: "Mulakan Proses Ulasan",
      qrDownloaded: "Kod QR Dimuat Turun",
      imageSaved: "Imej disimpan ke peranti anda.",
      downloadQR: "Muat Turun Kod QR",
      cardSaved: "Kad Disimpan!",
      cardImageSaved: "Kad telah disimpan sebagai imej.",
      saveAsImage: "Simpan sebagai Imej",
    },
    customer: {
      drafting: {
        title: "Kongsi Pengalaman Anda",
        subtitle: "Pilih gambar dan ulasan untuk bermula.",
        selectPhoto: "Pilih Gambar",
        selectReview: "Pilih Ulasan",
        addHashtags: "Tambah Hashtag (Pilihan)",
        hashtagsAdded: "hashtag akan ditambah ke ulasan anda",
        switched: "Ditukar!",
        newPhotosReady: "Gambar dan ulasan baharu sedia untuk anda.",
        reviewCopied: "Ulasan Disalin!",
        pasteInGoogle: "Teks ulasan anda disalin. Tampal di Google Reviews.",
        textCopiedReady: "Teks disalin! Sedia untuk ditampal.",
        photoDownloaded: "Gambar Dimuat Turun!",
        uploadPhoto: "Muat naik gambar ini semasa membuat ulasan.",
        photoOpened: "Gambar Dibuka",
        savePhoto: "Simpan gambar dan muat naik ke ulasan anda.",
        copyAndOpen: "Salin & Buka Google Review",
        savePhotoBtn: "Simpan Gambar",
        yourPhoto: "Gambar Anda (muat turun untuk dimuat naik ke Google)",
        yourReview: "Ulasan Anda",
        reviewCopiedAuto: "Ulasan anda akan disalin secara automatik!",
        step1: "1. Klik Kongsi",
        step2: "2. Tampal di Google",
        step3: "3. Tambah Gambar",
        reviewSets: [
          [
            "Wow, pengalaman yang luar biasa! Pasukan sangat profesional. Sudah merancang lawatan seterusnya!",
            "Keputusan terbaik bulan ini! Profesional, mesra, dan hasilnya hebat!"
          ],
          [
            "Cepat, profesional, dan tepat apa yang saya perlukan. 10/10 akan kembali!",
            "Akhirnya jumpa tempat kegemaran saya. Suasana bagus, hasil bagus, orang bagus!"
          ],
          [
            "Kawan cadangkan tempat ini dan saya gembira mendengarnya. Semuanya lancar dari awal hingga akhir.",
            "Cari tempat berkualiti berbulan-bulan. Tempat ini melebihi semua jangkaan!"
          ],
          [
            "Keluar dengan rasa segar dan diperbaharui. Pengalaman positif dari awal hingga akhir.",
            "Pendekatan di sini membuat perbezaan. Saya berasa dihargai sebagai pelanggan!"
          ],
          [
            "Sangat gembira dengan lawatan saya! Kakitangan mesra dan ramah. Pasti akan kembali!",
            "Suka sangat! Suasana santai dan harga berpatutan. Apa lagi yang anda mahu?"
          ],
          [
            "Kualiti perkhidmatan cemerlang. Pasukan sangat profesional.",
            "Kagum dengan perhatian terhadap perincian. Sangat mengesyorkan!"
          ],
          [
            "Terima kasih untuk pengalaman yang indah! Pasukan buat saya rasa seperti di rumah.",
            "Sangat bersyukur menemui tempat ini. Anda dapat pelanggan setia!"
          ],
          [
            "Pertama kali di sini dan terus suka! Sekarang faham kenapa semua orang puji tempat ini.",
            "Baru di sini tapi pasukan buat ia mudah. Sabar, berpengetahuan, dan sangat membantu."
          ],
          [
            "Dah cuba beberapa tempat sebelum ini. Yang ini memang yang terbaik!",
            "Selepas bertahun-tahun mencari, akhirnya jumpa tempat terbaik. Kualiti tiada tandingan!"
          ],
          [
            "Perkhidmatan cemerlang. Hasil cantik. Lima bintang, tiada keraguan!",
            "Pengalaman terbaik yang pernah saya alami. Sangat mengesyorkan!"
          ],
          [
            "Dari saat saya masuk, saya tahu ini istimewa. Kualiti dari awal hingga akhir.",
            "Perhatian terhadap perincian! Setiap aspek dibuat dengan teliti. Sempurna."
          ],
          [
            "Kembali untuk lawatan ketiga dan makin baik! Kualiti konsisten setiap kali.",
            "Sekarang pelanggan tetap dan bangga! Kalau belum cuba, tunggu apa lagi?"
          ]
        ]
      },
      platform: {
        title: "Pilih Platform",
        subtitle: "Pilih di mana anda mahu berkongsi ulasan anda.",
        instruction: "Klik platform untuk menyalin ulasan anda dan buka aplikasi.",
        noPlatforms: "Tiada platform perkongsian dikonfigurasi lagi.",
        askOwner: "Sila minta pemilik kedai untuk menyediakan pautan media sosial.",
        leaveReview: "Tinggalkan Ulasan",
        contactUs: "Hubungi Kami",
        shareExperience: "Kongsi Pengalaman Anda",
        googleFeedback: "Kami ingin mendengar maklum balas anda di Google!",
        copyXHS: "Salin teks anda dan kongsi gambar di XiaoHongShu!",
        xhsCopied: "Kandungan Disalin!",
        xhsPasteReady: "Buka Xiaohongshu dan tampal untuk pos.",
        xhsFlow: "Aliran Perkongsian Xiaohongshu",
        xhsStep1: "Salin",
        xhsStep2: "Buka XHS",
        xhsStep3: "Tampal & Pos",
        xhsDownloadPhoto: "Muat turun foto untuk dipilih di Xiaohongshu",
        xhsSavePhoto: "Simpan Foto",
        xhsOpenApp: "Buka Xiaohongshu",
        xhsFastShare: "Cara terpantas untuk berkongsi di Xiaohongshu!",
        shareFriends: "Kongsi pengalaman anda dengan rakan-rakan!",
        shareTikTok: "Kongsi transformasi anda di TikTok!",
        chatWhatsApp: "Sembang dengan kami di WhatsApp!",
        copyShare: "Salin & Kongsi",
        openWhatsApp: "Buka WhatsApp",
        selectRating: "Sila pilih penarafan",
        rateExperience: "Bagaimana pengalaman anda?",
        instagramNote: "Ulasan anda akan disimpan. Kemudian anda akan dibawa ke Instagram.",
        goToInstagram: "Pergi ke Instagram",
        reviewCopied: "Ulasan disalin. Sedia untuk ditampal!",
        facebookThankYou: "Terima kasih! Satu langkah lagi 👇",
        facebookPasteReady: "Ulasan dan pautan perniagaan anda disalin. Pos di dinding anda!",
        copyReviewText: "Salin Teks",
        continueToFacebook: "Teruskan ke Facebook",
        facebookNote: "Buat pos baru di dinding anda, tampal ulasan, dan tag perniagaan!",
        everythingCopied: "Semua disalin. Pos di dinding anda dan tag perniagaan!",
        postOnFacebook: "Pos di Dinding Saya",
        followFbTitle: "Ikuti Kami",
        followFbSubtitle: "Kekal berhubung dengan kami di Facebook!",
        followOnFacebook: "Ikuti di Facebook",
        followIgTitle: "Ikuti Kami",
        followIgSubtitle: "Ikuti kami di Instagram!",
        followOnInstagram: "Ikuti di Instagram",
        copied: "Disalin!",
        shareOnXhs: "Kongsi di XiaoHongShu",
        xhsSubtitle: "Salin dan kongsi pengalaman anda di XiaoHongShu!",
        copyAndOpen: "Salin & Buka XiaoHongShu",
      }
    },
    admin: {
      dashboard: {
        title: "Papan Pemuka Kempen",
        subtitle: "Jejaki prestasi dan urus kempen ulasan anda.",
        totalScans: "Jumlah Imbasan",
        topPlatform: "Platform Teratas",
        recentActivity: "Aktiviti Terkini",
        generateQR: "Jana Kod QR",
        downloadKit: "Muat Turun Kit Aset",
        socialLinks: "Pautan Sosial",
        shopPhotos: "Gambar Kedai",
        sliderPhotos: "Gambar Slider",
        aiDiscovery: "Penemuan Berkuasa AI",
        aiScan: "AI akan mengimbas laman web anda untuk mencari pautan media sosial dan mencadangkan gambar.",
        findLinks: "Cari Pautan",
        searching: "Mencari...",
        suggestedPhotos: "Gambar Dicadangkan dari Laman Web Anda",
        aiFoundPhotos: "AI mendapati gambar ini mungkin sesuai untuk kedai anda. Klik luluskan untuk menambahnya.",
        suggestedHashtags: "Hashtag Dicadangkan untuk Ulasan",
        hashtagsHelp: "Hashtag ini boleh membantu pelanggan semasa berkongsi ulasan.",
        reviewHashtags: "Hashtag Ulasan",
        customersUse: "Pelanggan boleh menggunakan hashtag ini semasa berkongsi ulasan mereka.",
        addHashtag: "Tambah hashtag tersuai...",
        alreadyInList: "Hashtag ini sudah ada dalam senarai anda.",
        noHashtags: "Tiada hashtag dipilih lagi. Gunakan penemuan AI atau tambah yang tersuai.",
        googleMapsHelp: "Cara Mencari Pautan Google Maps Anda",
        step1Open: "LANGKAH 1 — Buka Google Maps",
        step2Search: "LANGKAH 2 — Cari Perniagaan Anda",
        step3Select: "LANGKAH 3 — Pilih Perniagaan Anda",
        step4Copy: "LANGKAH 4 — Salin Pautan Perniagaan Anda",
        step5Paste: "LANGKAH 5 — Tampal Pautan ke dalam Aplikasi",
        done: "Selesai!",
        linkExplain: "Anda kini mempunyai pautan perniagaan Google Maps yang betul.",
        googleReviewsUrl: "URL Google Reviews",
        facebookUrl: "URL Facebook",
        instagramUrl: "URL Instagram",
        xiaohongshuUrl: "URL XiaoHongShu",
        tiktokUrl: "URL TikTok",
        whatsappUrl: "URL WhatsApp",
        saveChanges: "Simpan Perubahan",
        saveRequired: "Simpan Perubahan (Diperlukan)",
        saving: "Menyimpan...",
        unsavedChanges: "Anda mempunyai perubahan yang belum disimpan.",
        shopViewPhotos: "Gambar Paparan Kedai",
        managePhotos: "Urus gambar yang tersedia untuk pelanggan pilih.",
        maxPhotos: "Maksimum 9 gambar.",
        maxSliderPhotos: "Maksimum 3 gambar.",
        uploadPhoto: "Muat Naik Gambar",
        noSliderPhotos: "Tiada gambar slider lagi.",
        uploadSliderHelp: "Muat naik gambar atau gunakan penemuan AI untuk menambah gambar.",
        aiSliderPhotos: "Gambar Slider Dicadangkan AI",
        sliderPerfect: "Gambar menarik ini sesuai untuk karusel hero anda.",
        placeIdRequired: "Place ID Diperlukan",
        enterPlaceId: "Sila masukkan Google Place ID atau pautan Google Maps.",
        converting: "Menukar pautan Google Maps anda kepada Place ID.",
        businessLink: "Pautan perniagaan Google Maps",
        extractFailed: "Tidak dapat mengekstrak Place ID dari URL",
        businessVerified: "Perniagaan Disahkan & Disimpan!",
        verifiedSave: "Perniagaan disahkan. Sila klik Simpan Perubahan untuk menyimpan.",
        enterPlaceFirst: "Sila masukkan Google Place ID terlebih dahulu.",
        apiKeyRequired: "Kunci API Diperlukan",
        addApiKey: "Sila tambah GOOGLE_PLACES_API_KEY dalam secrets untuk mendapatkan ulasan.",
        noReviews: "Tiada Ulasan Ditemui",
        noReviewsFound: "Tiada ulasan ditemui untuk perniagaan ini.",
        limitReached: "Had Dicapai",
        maxPhotosReached: "Anda hanya boleh memuat naik sehingga 9 gambar.",
        checkGoogle: "Semak di Google",
        verify: "Sahkan",
        businessConfirmed: "Perniagaan Disahkan!",
        nameUpdated: "Nama perniagaan dikemas kini di semua tempat.",
        viewMaps: "Lihat di Google Maps",
      }
    }
  }
};
