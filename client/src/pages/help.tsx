import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function HelpPage() {
  const [_, setLocation] = useLocation();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/admin')}
          className="mb-6"
          data-testid="button-back-to-admin"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>

        <div className="prose prose-slate max-w-none">
          <h1>ShareLor User Guide</h1>
          <p className="lead">Welcome to ShareLor! This guide will help you understand how to use the review sharing platform to grow your business through customer reviews on social media.</p>

          <hr />

          <h2>Before You Start</h2>
          
          <h3>Browser Settings</h3>
          <ul>
            <li><strong>Allow Pop-ups</strong>: Some features open social media apps or websites in new windows. Make sure your browser allows pop-ups from this site.</li>
            <li><strong>Best Browsers</strong>: Chrome, Safari, or Firefox work best.</li>
            <li><strong>Mobile Devices</strong>: For the best experience on phones, use the device's default browser.</li>
          </ul>

          <hr />

          <h2>Shop View - Customer Experience</h2>
          <p>The Shop View is what your customers see when they visit your ShareLor page. It's designed to make sharing reviews quick and easy.</p>

          <h3>Platform Buttons</h3>
          <Card className="my-4">
            <CardContent className="p-4">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Button</th>
                    <th className="text-left p-2">What It Does</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 font-medium">Google Reviews</td>
                    <td className="p-2">Opens the review drafting flow for Google</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">XiaoHongShu</td>
                    <td className="p-2">Shows review preview, copies to clipboard, opens XiaoHongShu</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Instagram</td>
                    <td className="p-2">Opens review drafting for Instagram posts</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Facebook</td>
                    <td className="p-2">Opens review drafting for Facebook posts</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Follow Facebook</td>
                    <td className="p-2">Opens your Facebook page directly</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Follow Instagram</td>
                    <td className="p-2">Opens your Instagram profile directly</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <h3>Follow Facebook / Instagram Flow</h3>
          <ol>
            <li>Customer taps the button</li>
            <li>A popup appears with your business name</li>
            <li>They tap "Follow on Facebook/Instagram"</li>
            <li>Your profile opens (app on mobile, website on desktop)</li>
            <li>They tap Follow - done!</li>
          </ol>

          <h3>XiaoHongShu Flow</h3>
          <ol>
            <li>Customer taps "XiaoHongShu" button</li>
            <li>A popup shows a preview of the review text</li>
            <li>They tap "Copy & Open XiaoHongShu"</li>
            <li>Text is copied to clipboard automatically</li>
            <li>XiaoHongShu app opens</li>
            <li>They paste the text and post!</li>
          </ol>

          <hr />

          <h2>Quick View - Mobile Experience</h2>
          <p>The Quick View is a streamlined mobile version accessed by scanning the QR code.</p>

          <h3>How to Use</h3>
          <ol>
            <li>Print the QR code from your Admin Dashboard</li>
            <li>Display it at your business (table tents, counter signs, etc.)</li>
            <li>Customers scan with their phone camera</li>
            <li>They're taken directly to the mobile sharing experience</li>
          </ol>

          <hr />

          <h2>Admin Dashboard</h2>
          <p>The Admin Dashboard is where you manage your ShareLor settings.</p>

          <h3>Configuration</h3>
          <ul>
            <li><strong>Website URL</strong>: Your business website (used for AI to discover social links)</li>
            <li><strong>Google Place ID</strong>: Links to your Google Business for reviews</li>
            <li><strong>Social Media URLs</strong>: Set up links for each platform</li>
            <li><strong>Shop Photos</strong>: Upload photos that customers can choose when sharing</li>
            <li><strong>Slider Photos</strong>: Upload photos for the Shop View photo slider</li>
            <li><strong>Review Hashtags</strong>: Add hashtags that customers can include in their posts</li>
          </ul>

          <Card className="my-4 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-amber-800 font-medium">Tip: Only platforms with URLs configured will show buttons in Shop View!</p>
            </CardContent>
          </Card>

          <hr />

          <h2>Troubleshooting</h2>

          <h3>"Nothing happens when I click a button"</h3>
          <p><strong>Solution:</strong> Check your browser's pop-up blocker</p>
          <ol>
            <li>Look for a blocked pop-up icon in your browser's address bar</li>
            <li>Click it and choose "Always allow pop-ups from this site"</li>
            <li>Try the button again</li>
          </ol>

          <h3>"Platform button is not showing"</h3>
          <p><strong>Solution:</strong> The URL is not configured</p>
          <ol>
            <li>Go to Admin Dashboard</li>
            <li>Check that the platform URL is filled in</li>
            <li>Click "Save Changes"</li>
          </ol>

          <h3>"XiaoHongShu doesn't open the app"</h3>
          <p><strong>Solution:</strong> The app may not be installed</p>
          <ul>
            <li>On mobile: Install the XiaoHongShu app from the App Store or Play Store</li>
            <li>On desktop: The website opens instead (normal behavior)</li>
          </ul>

          <h3>"Instagram opens the website instead of the app"</h3>
          <p><strong>Solution:</strong> This can happen if the Instagram app isn't installed or you're on a desktop computer. The website works the same way - just log in and follow!</p>

          <hr />

          <p className="text-sm text-muted-foreground">Last updated: December 2024</p>
        </div>
      </div>
    </Layout>
  );
}
