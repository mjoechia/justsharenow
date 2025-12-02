import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ExternalLink, ImagePlus, Trash2, Search, Loader2, Sparkles, Check, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreConfig, updateStoreConfig, discoverSocialLinks, approvePhoto, SuggestedPhoto } from "@/lib/api";

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
  const [suggestedPhotos, setSuggestedPhotos] = useState<SuggestedPhoto[]>([]);
  const [approvingPhoto, setApprovingPhoto] = useState<string | null>(null);

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
    setSuggestedPhotos([]);
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

      // Store suggested photos
      if (result.suggestedPhotos && result.suggestedPhotos.length > 0) {
        setSuggestedPhotos(result.suggestedPhotos);
      }

      const foundCount = Object.values(result.discoveredLinks).filter(Boolean).length;
      const photoCount = result.suggestedPhotos?.length || 0;
      
      if (foundCount > 0 || photoCount > 0) {
        let message = '';
        if (foundCount > 0) message += `${foundCount} social link${foundCount > 1 ? 's' : ''}`;
        if (foundCount > 0 && photoCount > 0) message += ' and ';
        if (photoCount > 0) message += `${photoCount} photo suggestion${photoCount > 1 ? 's' : ''}`;
        
        toast({ 
          title: "Discovery Complete!", 
          description: `AI found ${message} from your website.` 
        });
      } else {
        toast({ 
          title: "No Content Found", 
          description: "No social media links or photos were found on your website.", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Discovery Failed", 
        description: error.message || "Failed to discover content. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleApprovePhoto = async (photo: SuggestedPhoto) => {
    if (shopPhotos.length >= 9) {
      toast({ 
        title: "Limit Reached", 
        description: "Maximum 9 photos allowed. Remove some photos first.", 
        variant: "destructive" 
      });
      return;
    }

    setApprovingPhoto(photo.url);
    try {
      const result = await approvePhoto(photo.url);
      setShopPhotos(result.shopPhotos);
      setSuggestedPhotos(prev => prev.filter(p => p.url !== photo.url));
      queryClient.invalidateQueries({ queryKey: ['storeConfig'] });
      toast({ 
        title: "Photo Added!", 
        description: `Photo added to your shop photos (${result.photoCount}/9).` 
      });
    } catch (error: any) {
      toast({ 
        title: "Failed to Add Photo", 
        description: error.message || "Could not add this photo. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setApprovingPhoto(null);
    }
  };

  const handleDismissPhoto = (photo: SuggestedPhoto) => {
    setSuggestedPhotos(prev => prev.filter(p => p.url !== photo.url));
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
                                AI will scan your website to find social media links and suggest photos for your shop.
                            </p>
                        </div>

                        {/* Suggested Photos Section */}
                        {suggestedPhotos.length > 0 && (
                            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Image className="w-5 h-5 text-amber-600" />
                                    <span className="font-semibold text-amber-900">Suggested Photos from Your Website</span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {shopPhotos.length}/9 photos used
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    AI found these photos that might work well in your shop. Click approve to add them.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {suggestedPhotos.map((photo, idx) => (
                                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-amber-200 bg-white">
                                            <img 
                                                src={photo.url} 
                                                alt={photo.reason}
                                                className="w-full aspect-square object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                                data-testid={`img-suggested-photo-${idx}`}
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                                <p className="text-white text-xs text-center line-clamp-2">{photo.reason}</p>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-green-600 hover:bg-green-700 h-8"
                                                        onClick={() => handleApprovePhoto(photo)}
                                                        disabled={approvingPhoto === photo.url || shopPhotos.length >= 9}
                                                        data-testid={`button-approve-photo-${idx}`}
                                                    >
                                                        {approvingPhoto === photo.url ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="destructive"
                                                        className="h-8"
                                                        onClick={() => handleDismissPhoto(photo)}
                                                        data-testid={`button-dismiss-photo-${idx}`}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
