import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import justShareNowLogo from "@assets/JustSharenow_logo_1766216638301.png";

export default function LoginQRPage() {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const loginUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/login`
    : '/login';

  const handleDownload = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "justsharenow-login-qr.png";
    link.href = url;
    link.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={justShareNowLogo} alt="JustShareNow" className="w-48 h-auto mx-auto mb-4" />
          <CardTitle>Login QR Code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-[#2D7FF9]/20">
            <QRCodeCanvas 
              value={loginUrl}
              size={250}
              level="H"
              includeMargin={true}
              fgColor="#2D7FF9"
              ref={qrCanvasRef}
              imageSettings={{
                src: justShareNowLogo,
                height: 50,
                width: 50,
                excavate: true,
              }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code to access the login page
          </p>
          
          <Button 
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-[#2D7FF9] to-[#23C7C3] hover:from-[#2D7FF9]/90 hover:to-[#23C7C3]/90 text-white"
            data-testid="button-download-login-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
