import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'zh';

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
    },
    customer: {
      drafting: {
        title: "Share Your Experience",
        subtitle: "Select a photo and a review snippet to get started.",
        selectPhoto: "Select a Photo",
        selectReview: "Select a Review",
        reviewSets: [
          [
            "Absolutely loved the treatment! My hair feels so healthy and shiny. Highly recommend Regrow Group!",
            "Professional service and amazing results. The staff was very attentive to my needs.",
            "Best salon experience I've had in years. The before and after difference is incredible!",
            "Regrow Group transformed my look completely. So happy with the results!"
          ],
          [
            "The team at Regrow Group truly understands hair care. My hair has never looked better!",
            "Amazing transformation! The stylists are so talented and really listen to what you want.",
            "Five stars all the way! From consultation to final result, everything was perfect.",
            "Can't believe the difference after just one session. Will definitely be coming back!"
          ],
          [
            "Regrow Group exceeded all my expectations. The quality of service is unmatched!",
            "My friends keep asking what I did to my hair. So grateful I found this place!",
            "The staff made me feel so comfortable. Professional, friendly, and incredibly skilled.",
            "Worth every penny! The results speak for themselves. Highly recommend to everyone!"
          ],
          [
            "Life-changing experience at Regrow Group! My confidence has skyrocketed since my visit.",
            "I've been to many salons but none compare to the expertise at Regrow Group.",
            "The attention to detail is outstanding. They really care about their clients.",
            "Incredible results and wonderful service. This is my new go-to salon!"
          ]
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
        reviewSets: [
          [
            "非常喜欢这次的护理！我的头发感觉非常健康有光泽。强烈推荐 Regrow Group！",
            "专业的服务和惊人的效果。工作人员非常关注我的需求。",
            "这是我几年来最好的沙龙体验。前后对比简直不可思议！",
            "Regrow Group 完全改变了我的造型。对结果非常满意！"
          ],
          [
            "Regrow Group 的团队真正了解护发。我的头发从未如此好看过！",
            "惊人的转变！造型师非常有才华，真的会倾听你的需求。",
            "五星好评！从咨询到最终结果，一切都很完美。",
            "一次疗程后就看到如此大的变化，简直不敢相信。一定会再来！"
          ],
          [
            "Regrow Group 超出了我所有的期望。服务质量无与伦比！",
            "我的朋友们一直问我头发做了什么。很感激找到了这个地方！",
            "员工让我感到非常舒适。专业、友好，技术精湛。",
            "物超所值！效果不言自明。强烈推荐给所有人！"
          ],
          [
            "在 Regrow Group 的体验改变了我的生活！自从来过之后，我的自信心大增。",
            "我去过很多沙龙，但没有一家能比得上 Regrow Group 的专业水平。",
            "对细节的关注令人印象深刻。他们真的很关心客户。",
            "效果惊人，服务周到。这是我新的首选沙龙！"
          ]
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
