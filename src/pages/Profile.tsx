import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { useThemeCustomizer } from "@/hooks/useThemeCustomizer";
import { User, Palette, Moon, Sun, Monitor, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { currentPalette, defaultPalettes, selectPalette, hslToHex } = useThemeCustomizer();
  
  const [username, setUsername] = useState(currentUser?.username || "");

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', currentUser.id);

    if (error) {
      toast.error("Failed to update profile", { description: error.message });
      return;
    }

    // Refresh local state
    useAuth.setState({
      currentUser: { ...currentUser, username },
    });
    toast.success("Profile updated successfully");
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences</p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Display Name</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter display name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="px-3 py-2 rounded-md bg-muted text-sm capitalize">
                {currentUser.roles.join(', ')}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Active Role</Label>
              <div className="px-3 py-2 rounded-md bg-muted text-sm capitalize">
                {currentUser.activeRole}
              </div>
            </div>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Mode */}
            <div className="space-y-3">
              <Label>Theme Mode</Label>
              <div className="flex gap-2">
                {themeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(option.value)}
                    className="flex items-center gap-2"
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-3">
              <Label>Color Palette</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {defaultPalettes.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => selectPalette(palette)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-left",
                      currentPalette.id === palette.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{palette.name}</span>
                      {currentPalette.id === palette.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: hslToHex(palette.primary) }}
                      />
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: hslToHex(palette.accent) }}
                      />
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: hslToHex(palette.success) }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
