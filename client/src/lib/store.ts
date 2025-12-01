import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'zh';

interface CampaignState {
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Customer Flow State
  selectedReview: string | null;
  selectedPhoto: string | null;
  setSelectedReview: (review: string) => void;
  setSelectedPhoto: (photo: string) => void;
  
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
      setSelectedReview: (review) => set({ selectedReview: review }),
      setSelectedPhoto: (photo) => set({ selectedPhoto: photo }),
      
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
    },
    customer: {
      drafting: {
        title: "Share Your Experience",
        subtitle: "Select a photo and a review snippet to get started.",
        selectPhoto: "Select a Photo",
        selectReview: "Select a Review",
        reviews: [
          "Absolutely loved the treatment! My hair feels so healthy and shiny. Highly recommend Regrow Group!",
          "Professional service and amazing results. The staff was very attentive to my needs.",
          "Best salon experience I've had in years. The before and after difference is incredible!",
          "Regrow Group transformed my look completely. So happy with the results!"
        ]
      },
      platform: {
        title: "Choose Platform",
        subtitle: "Select where you want to share your review.",
        instruction: "Click a platform to copy your review and open the app.",
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
        downloadKit: "Download Asset Kit"
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
    },
    customer: {
      drafting: {
        title: "分享您的体验",
        subtitle: "选择一张照片和一段评论以开始。",
        selectPhoto: "选择照片",
        selectReview: "选择评论",
        reviews: [
          "非常喜欢这次的护理！我的头发感觉非常健康有光泽。强烈推荐 Regrow Group！",
          "专业的服务和惊人的效果。工作人员非常关注我的需求。",
          "这是我几年来最好的沙龙体验。前后对比简直不可思议！",
          "Regrow Group 完全改变了我的造型。对结果非常满意！"
        ]
      },
      platform: {
        title: "选择平台",
        subtitle: "选择您想要分享评论的地方。",
        instruction: "点击平台以复制您的评论并打开应用程序。",
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
        downloadKit: "下载资源包"
      }
    }
  }
};
