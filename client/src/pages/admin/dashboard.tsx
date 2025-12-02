import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ExternalLink, ImagePlus, Trash2, Search, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreConfig, updateStoreConfig, discoverSocialLinks } from "@/lib/api";

export default function AdminDashboard() {
  const { language, setSelectedPhoto, setSelectedReview } = useStore();
  const t = translations[language];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: getStoreConfig,
  });

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [fbUrl, setFbUrl] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [xhsUrl, setXhsUrl] = useState("");
  const [shopPhotos, setShopPhotos] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

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

  const handleDiscoverLinks = async () => {
    if (!websiteUrl) {
      toast({ title: "Error", description: "Please enter your website URL first.", variant: "destructive" });
      return;
    }

    setIsDiscovering(true);
    try {
      const result = await discoverSocialLinks(websiteUrl);
      
      if (result.discoveredLinks.google) {
        setGoogleUrl(result.discoveredLinks.google);
      }
      if (result.discoveredLinks.facebook) {
        setFbUrl(result.discoveredLinks.facebook);
      }
      if (result.discoveredLinks.instagram) {
        setIgUrl(result.discoveredLinks.instagram);
      }
      if (result.discoveredLinks.xiaohongshu) {
        setXhsUrl(result.discoveredLinks.xiaohongshu);
      }

      const foundCount = Object.values(result.discoveredLinks).filter(Boolean).length;
      if (foundCount > 0) {
        toast({ 
          title: "Links Found!", 
          description: `AI discovered ${foundCount} social media link${foundCount > 1 ? 's' : ''} from your website.` 
        });
      } else {
        toast({ 
          title: "No Links Found", 
          description: "No social media links were found on your website. Please enter them manually.", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Discovery Failed", 
        description: error.message || "Failed to discover social links. Please enter them manually.", 
        variant: "destructive" 
      });
    } finally {
      setIsDiscovering(false);
    }
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

        <Tabs defaultValue="socials" className="space-y-8">
            <TabsList>
                <TabsTrigger value="socials">Social Links</TabsTrigger>
                <TabsTrigger value="photos">Shop Photos</TabsTrigger>
            </TabsList>

            <TabsContent value="socials" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Social Media Links</CardTitle>
                        <CardDescription>Enter your website URL and let AI find your social media links automatically.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Website URL with AI Discovery */}
                        <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                <span className="font-semibold text-indigo-900">AI-Powered Discovery</span>
                            </div>
                            <div className="flex gap-2">
                                <Input 
                                    type="url" 
                                    placeholder="https://your-business.com" 
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    className="flex-1"
                                    data-testid="input-website-url"
                                />
                                <Button 
                                    onClick={handleDiscoverLinks}
                                    disabled={isDiscovering || !websiteUrl}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                    data-testid="button-discover-links"
                                >
                                    {isDiscovering ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4 mr-2" />
                                            Find Links
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                AI will scan your website and automatically find your social media profile links.
                            </p>
                        </div>

                        <div className="grid gap-4">
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

                            <Button onClick={handleSaveSocials} disabled={updateConfigMutation.isPending}>
                                {updateConfigMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
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
