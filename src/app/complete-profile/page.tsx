"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { setAuthUser, getAuthToken } from "@/lib/auth";
import { Github, Linkedin, Globe, User, GraduationCap, MapPin, Briefcase } from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    college: "",
    gradYear: "",
    targetRole: "",
    linkedin: "",
    github: "",
    portfolio: "",
    location: "",
    company: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/complete-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          gradYear: formData.gradYear ? parseInt(formData.gradYear) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Profile completion failed');
        setLoading(false);
        return;
      }

      // Update user data in localStorage
      setAuthUser(data.user);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error('Profile completion error:', err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex">
      {/* Left Sidebar - Branding */}
      <div className="hidden lg:flex lg:w-[35%] bg-[#E8E5F5] items-start p-12 relative overflow-hidden">
        {/* Decorative blob shapes */}
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D1CCE8] rounded-tr-[100px] opacity-60" />
        <div className="absolute bottom-20 left-12 w-40 h-40 bg-[#D1CCE8] rounded-tr-[120px] opacity-40" />
        <div className="absolute bottom-40 left-0 w-24 h-24 bg-[#C5BFE0] rounded-tr-[80px] opacity-50" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6633FF] to-[#AA66FF] flex items-center justify-center">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <span className="text-2xl font-bold text-[#6633FF]">PrepPro</span>
        </div>
      </div>

      {/* Right Side - Profile Completion Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1A1A40] mb-3">Complete your profile</h1>
            <p className="text-[#1A1A40]/60 text-lg">Help us personalize your experience</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1A1A40] flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-[#1A1A40]">
                      Full Name *
                    </Label>
                    <Input 
                      id="name" 
                      name="name" 
                      type="text" 
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="h-12 border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-[#1A1A40]">
                      Location
                    </Label>
                    <Input 
                      id="location" 
                      name="location" 
                      type="text" 
                      placeholder="San Francisco, CA"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="h-12 border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-[#1A1A40]">
                    Bio
                  </Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    placeholder="Tell us about yourself, your goals, and what you're working on..."
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="min-h-[100px] border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Education & Career */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1A1A40] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Education & Career
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="college" className="text-sm font-medium text-[#1A1A40]">
                      College/University
                    </Label>
                    <Input 
                      id="college" 
                      name="college" 
                      type="text" 
                      placeholder="Stanford University"
                      value={formData.college}
                      onChange={handleInputChange}
                      className="h-12 border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradYear" className="text-sm font-medium text-[#1A1A40]">
                      Graduation Year
                    </Label>
                    <Input 
                      id="gradYear" 
                      name="gradYear" 
                      type="number" 
                      placeholder="2024"
                      value={formData.gradYear}
                      onChange={handleInputChange}
                      className="h-12 border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                      disabled={loading}
                      min="1950"
                      max="2030"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetRole" className="text-sm font-medium text-[#1A1A40]">
                      Target Role
                    </Label>
                    <Input 
                      id="targetRole" 
                      name="targetRole" 
                      type="text" 
                      placeholder="Software Engineer"
                      value={formData.targetRole}
                      onChange={handleInputChange}
                      className="h-12 border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-[#1A1A40]">
                      Current Company
                    </Label>
                    <Input 
                      id="company" 
                      name="company" 
                      type="text" 
                      placeholder="Google"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="h-12 border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1A1A40] flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Social Links
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-sm font-medium text-[#1A1A40] flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn Profile
                    </Label>
                    <Input 
                      id="linkedin" 
                      name="linkedin" 
                      type="url" 
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="h-12 border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github" className="text-sm font-medium text-[#1A1A40] flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      GitHub Profile
                    </Label>
                    <Input 
                      id="github" 
                      name="github" 
                      type="url" 
                      placeholder="https://github.com/yourusername"
                      value={formData.github}
                      onChange={handleInputChange}
                      className="h-12 border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio" className="text-sm font-medium text-[#1A1A40] flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Portfolio Website
                    </Label>
                    <Input 
                      id="portfolio" 
                      name="portfolio" 
                      type="url" 
                      placeholder="https://yourportfolio.com"
                      value={formData.portfolio}
                      onChange={handleInputChange}
                      className="h-12 border-[#6666CC]/30 bg-white focus:border-[#6633FF] focus:ring-[#6633FF]"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={loading || !formData.name.trim()}
                  className="w-full h-12 bg-[#00CC66] hover:bg-[#00DD77] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00CC66]/30"
                >
                  {loading ? "Completing profile..." : "Complete Profile"}
                </Button>
              </div>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-[#1A1A40]/60">
            You can always update this information later in your profile settings
          </p>
        </div>
      </div>
    </main>
  );
}
