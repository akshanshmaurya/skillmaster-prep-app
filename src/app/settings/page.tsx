"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, getAuthUser, removeAuthToken, removeAuthUser } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Trash2, 
  Download, 
  Upload,
  Save,
  Eye,
  EyeOff,
  Mail,
  Github,
  Linkedin,
  Globe as GlobeIcon,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  AlertTriangle
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
    company: "",
    college: "",
    gradYear: "",
    targetRole: "",
    linkedin: "",
    github: "",
    portfolio: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    testReminders: true,
    achievementAlerts: true,
    weeklyReports: true,
    marketingEmails: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showLocation: true,
    showCompany: true,
    showStats: true,
  });

  const [themeSettings, setThemeSettings] = useState({
    theme: "system",
    fontSize: "medium",
    animations: true,
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      const userData = getAuthUser();
      
      if (!token || !userData) {
        router.push('/login');
        return;
      }

      if (!userData.isProfileComplete) {
        router.push('/complete-profile');
        return;
      }

      setUser(userData);
      setProfileData({
        name: userData.name || "",
        email: userData.email || "",
        bio: userData.bio || "",
        location: userData.location || "",
        company: userData.company || "",
        college: userData.college || "",
        gradYear: userData.gradYear || "",
        targetRole: userData.targetRole || "",
        linkedin: userData.linkedin || "",
        github: userData.github || "",
        portfolio: userData.portfolio || "",
      });
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:5000/api/auth/complete-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...profileData,
          gradYear: profileData.gradYear ? parseInt(profileData.gradYear) : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Update localStorage
        localStorage.setItem('authUser', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match");
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        alert("Password updated successfully");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    removeAuthUser();
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Implement account deletion
      alert("Account deletion feature coming soon");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Settings</h1>
          <p className="text-gray-600 text-lg">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-6 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl font-bold">
                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user?.name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <Badge variant="outline" className="mt-2">
                    Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    placeholder="Enter your location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                    placeholder="Enter your company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college">College/University</Label>
                  <Input 
                    id="college"
                    value={profileData.college}
                    onChange={(e) => setProfileData({...profileData, college: e.target.value})}
                    placeholder="Enter your college"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradYear">Graduation Year</Label>
                  <Input 
                    id="gradYear"
                    type="number"
                    value={profileData.gradYear}
                    onChange={(e) => setProfileData({...profileData, gradYear: e.target.value})}
                    placeholder="Enter graduation year"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role</Label>
                  <Input 
                    id="targetRole"
                    value={profileData.targetRole}
                    onChange={(e) => setProfileData({...profileData, targetRole: e.target.value})}
                    placeholder="Enter your target role"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input 
                    id="linkedin"
                    type="url"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Profile</Label>
                  <Input 
                    id="github"
                    type="url"
                    value={profileData.github}
                    onChange={(e) => setProfileData({...profileData, github: e.target.value})}
                    placeholder="https://github.com/yourusername"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio Website</Label>
                  <Input 
                    id="portfolio"
                    type="url"
                    value={profileData.portfolio}
                    onChange={(e) => setProfileData({...profileData, portfolio: e.target.value})}
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleProfileUpdate} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Enter new password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button onClick={handlePasswordChange} disabled={saving}>
                  <Shield className="w-4 h-4 mr-2" />
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="font-semibold text-red-800 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-sm text-gray-600">
                        {key === 'emailNotifications' && 'Receive general email notifications'}
                        {key === 'testReminders' && 'Get reminded about upcoming tests'}
                        {key === 'achievementAlerts' && 'Get notified about new achievements'}
                        {key === 'weeklyReports' && 'Receive weekly progress reports'}
                        {key === 'marketingEmails' && 'Receive promotional emails and updates'}
                      </p>
                    </div>
                    <Switch 
                      checked={value}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, [key]: checked})}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Visibility</h3>
              <div className="space-y-4">
                {Object.entries(privacySettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-sm text-gray-600">
                        {key === 'profileVisibility' && 'Who can see your profile'}
                        {key === 'showEmail' && 'Show email address on profile'}
                        {key === 'showLocation' && 'Show location on profile'}
                        {key === 'showCompany' && 'Show company on profile'}
                        {key === 'showStats' && 'Show statistics on profile'}
                      </p>
                    </div>
                    {key === 'profileVisibility' ? (
                      <select 
                        value={value}
                        onChange={(e) => setPrivacySettings({...privacySettings, [key]: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="friends">Friends Only</option>
                      </select>
                    ) : (
                      <Switch 
                        checked={value}
                        onCheckedChange={(checked) => setPrivacySettings({...privacySettings, [key]: checked})}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-gray-600">Choose your preferred theme</p>
                  </div>
                  <select 
                    value={themeSettings.theme}
                    onChange={(e) => setThemeSettings({...themeSettings, theme: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Font Size</Label>
                    <p className="text-sm text-gray-600">Adjust text size for better readability</p>
                  </div>
                  <select 
                    value={themeSettings.fontSize}
                    onChange={(e) => setThemeSettings({...themeSettings, fontSize: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Animations</Label>
                    <p className="text-sm text-gray-600">Enable smooth animations and transitions</p>
                  </div>
                  <Switch 
                    checked={themeSettings.animations}
                    onCheckedChange={(checked) => setThemeSettings({...themeSettings, animations: checked})}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout Button */}
        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
            <User className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
