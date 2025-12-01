import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, QrCode, Share2, TrendingUp, Users, MessageSquare, RefreshCw, ExternalLink, ImagePlus, Trash2, Globe, Search, CheckCircle, Loader2 } from "lucide-react";
import regrowLogo from "@assets/generated_images/regrow_group_corporate_logo.png";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreConfig, updateStoreConfig, getAnalytics } from "@/lib/api";

export default function AdminDashboard() {
  const { language, setSelectedPhoto, setSelectedReview } = useStore();
  const t = translations[language];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch config and analytics from API
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  });

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [fbUrl, setFbUrl] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [xhsUrl, setXhsUrl] = useState("");
  const [shopPhotos, setShopPhotos] = useState<string[]>([]);

  // Update local state when config loads
  useEffect(() => {
    if (config) {
      setWebsiteUrl(config.websiteUrl || "");
      setGoogleUrl(config.googleUrl || "");
      setFbUrl(config.facebookUrl || "");
      setIgUrl(config.instagramUrl || "");
      setXhsUrl(config.xiaohongshuUrl || "");
      setShopPhotos(config.shopPhotos || []);
    }
  }, [config]);

  // Prepare chart data from analytics
  const stats = analyticsData?.reduce((acc, item) => {
    acc[item.platform] = item.clicks;
    return acc;
  }, {} as Record<string, number>) || {};

  const data = [
    { name: 'Google', value: stats.google || 0, color: '#4285F4' },
    { name: 'Facebook', value: stats.facebook || 0, color: '#1877F2' },
    { name: 'Instagram', value: stats.instagram || 0, color: '#E1306C' },
    { name: 'XHS', value: stats.xiaohongshu || 0, color: '#FF2442' },
  ];

  const totalScans = Object.values(stats).reduce((a, b) => a + b, 0);
  const topPlatform = data.reduce((prev, current) => (prev.value > current.value) ? prev : current);

  const handleReset = () => {
    setSelectedPhoto("");
    setSelectedReview("");
    toast({
        title: "Demo Reset",
        description: "Selection state has been cleared.",
    });
  };

  const updateConfigMutation = useMutation({
    mutationFn: updateStoreConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeConfig'] });
      toast({ title: "Saved", description: "Configuration updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
    },
  });

  const handleSaveSocials = () => {
    updateConfigMutation.mutate({
      websiteUrl,
      googleUrl,
      facebookUrl: fbUrl,
      instagramUrl: igUrl,
      xiaohongshuUrl: xhsUrl,
      shopPhotos,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (shopPhotos.length >= 9) {
            toast({
                title: "Limit Reached",
                description: "You can only upload up to 9 photos.",
                variant: "destructive"
            });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const newPhotos = [...shopPhotos, reader.result as string];
            setShopPhotos(newPhotos);
            updateConfigMutation.mutate({
              websiteUrl,
              googleUrl,
              facebookUrl: fbUrl,
              instagramUrl: igUrl,
              xiaohongshuUrl: xhsUrl,
              shopPhotos: newPhotos,
            });
        };
        reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = shopPhotos.filter((_, i) => i !== index);
    setShopPhotos(newPhotos);
    updateConfigMutation.mutate({
      websiteUrl,
      googleUrl,
      facebookUrl: fbUrl,
      instagramUrl: igUrl,
      xiaohongshuUrl: xhsUrl,
      shopPhotos: newPhotos,
    });
  };

  return (
    <Layout isAdmin>
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">{t.admin.dashboard.title}</h1>
                <p className="text-muted-foreground">{t.admin.dashboard.subtitle}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={handleReset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Demo
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/quick-view">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Quick View
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Shop View
                    </Link>
                </Button>
            </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-8">
            <TabsList>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="socials">Social Links</TabsTrigger>
                <TabsTrigger value="photos">Shop Photos</TabsTrigger>
            </TabsList>

            <TabsContent value="socials" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Social Media Links</CardTitle>
                        <CardDescription>Manage the social media links for your store.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="website">Website URL</Label>
                                <Input 
                                    type="url" 
                                    id="website" 
                                    placeholder="https://your-business.com" 
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                />
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="google">Google Maps URL</Label>
                                <Input 
                                    type="url" 
                                    id="google" 
                                    placeholder="https://maps.google.com/..."
                                    value={googleUrl}
                                    onChange={(e) => setGoogleUrl(e.target.value)} 
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="facebook">Facebook URL</Label>
                                <Input 
                                    type="url" 
                                    id="facebook" 
                                    placeholder="https://facebook.com/..."
                                    value={fbUrl}
                                    onChange={(e) => setFbUrl(e.target.value)} 
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="instagram">Instagram URL</Label>
                                <Input 
                                    type="url" 
                                    id="instagram" 
                                    placeholder="https://instagram.com/..." 
                                    value={igUrl}
                                    onChange={(e) => setIgUrl(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="xhs">XiaoHongShu URL</Label>
                                <Input 
                                    type="url" 
                                    id="xhs" 
                                    placeholder="https://xiaohongshu.com/..."
                                    value={xhsUrl}
                                    onChange={(e) => setXhsUrl(e.target.value)} 
                                />
                            </div>

                            <Button onClick={handleSaveSocials}>
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-white to-indigo-50/50 border-indigo-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t.admin.dashboard.totalScans}</p>
                                <p className="text-3xl font-bold text-foreground">{totalScans}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-white to-purple-50/50 border-purple-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t.admin.dashboard.topPlatform}</p>
                                <p className="text-3xl font-bold text-foreground">{topPlatform.name}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-white to-emerald-50/50 border-emerald-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                                <p className="text-3xl font-bold text-foreground">3</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Platform Performance</CardTitle>
                            <CardDescription>Click-through rates by social platform</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* AI Recommendations */}
                    <Card className="lg:col-span-1 bg-muted/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">AI Insights</span>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold">Beta</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-white border shadow-sm">
                                <h4 className="font-medium text-sm mb-1">Boost XiaoHongShu</h4>
                                <p className="text-xs text-muted-foreground">Engagement on XHS is 40% higher than average. Consider adding a dedicated QR code at the front desk.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-white border shadow-sm">
                                <h4 className="font-medium text-sm mb-1">Photo Update</h4>
                                <p className="text-xs text-muted-foreground">The "Hair Treatment" photo has a 15% higher selection rate. Add more hair transformation examples.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Shop View Photos</h2>
                        <p className="text-muted-foreground">Manage the photos available for customers to select. Max 9 photos.</p>
                    </div>
                    <div className="relative">
                         <Input 
                            type="file" 
                            className="hidden" 
                            id="photo-upload" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={shopPhotos.length >= 9}
                        />
                        <Button asChild disabled={shopPhotos.length >= 9}>
                            <Label htmlFor="photo-upload" className="cursor-pointer">
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Upload Photo ({shopPhotos.length}/9)
                            </Label>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Placeholder/Default Photos from Mock Data */}
                    <Card className="group relative overflow-hidden border-dashed bg-muted/20">
                         <CardContent className="p-0 aspect-square flex items-center justify-center text-muted-foreground">
                            <span className="text-sm">Default: Hair</span>
                         </CardContent>
                    </Card>
                     <Card className="group relative overflow-hidden border-dashed bg-muted/20">
                         <CardContent className="p-0 aspect-square flex items-center justify-center text-muted-foreground">
                            <span className="text-sm">Default: Skin</span>
                         </CardContent>
                    </Card>
                    
                    {/* User Uploaded Photos */}
                    {shopPhotos.map((photo, index) => (
                        <Card key={index} className="group relative overflow-hidden">
                            <CardContent className="p-0">
                                <img src={photo} alt={`Uploaded ${index}`} className="w-full aspect-square object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="icon" onClick={() => removePhoto(index)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
