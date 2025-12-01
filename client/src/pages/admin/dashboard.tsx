import { useStore, translations } from "@/lib/store";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, QrCode, Share2, TrendingUp, Users, MessageSquare, RefreshCw } from "lucide-react";
import regrowLogo from "@assets/generated_images/regrow_group_corporate_logo.png";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { language, stats, setSelectedPhoto, setSelectedReview } = useStore();
  const t = translations[language];
  const { toast } = useToast();

  const data = [
    { name: 'Google', value: stats.google, color: '#4285F4' },
    { name: 'Facebook', value: stats.facebook, color: '#1877F2' },
    { name: 'Instagram', value: stats.instagram, color: '#E1306C' },
    { name: 'XHS', value: stats.xiaohongshu, color: '#FF2442' },
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
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    {t.admin.dashboard.downloadKit}
                </Button>
                <Button>
                    <QrCode className="w-4 h-4 mr-2" />
                    {t.admin.dashboard.generateQR}
                </Button>
            </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Active QR Codes */}
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Deployed QR Codes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['Reception Desk', 'Table Tent #1', 'Table Tent #2', 'Exit Door'].map((loc, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                    <QrCode className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{loc}</p>
                                    <p className="text-xs text-muted-foreground">Active</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

      </div>
    </Layout>
  );
}
