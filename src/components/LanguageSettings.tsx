import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
}

const availableLanguages: Language[] = [
  { code: "en", name: "English", nativeName: "English", enabled: true },
  { code: "es", name: "Spanish", nativeName: "Español", enabled: false },
  { code: "fr", name: "French", nativeName: "Français", enabled: false },
  { code: "de", name: "German", nativeName: "Deutsch", enabled: false },
  { code: "zh", name: "Chinese", nativeName: "中文", enabled: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", enabled: false },
  { code: "ko", name: "Korean", nativeName: "한국어", enabled: false },
  { code: "pt", name: "Portuguese", nativeName: "Português", enabled: false },
  { code: "ar", name: "Arabic", nativeName: "العربية", enabled: false },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", enabled: false },
];

const LanguageSettings = () => {
  const [languages, setLanguages] = useState<Language[]>(() => {
    const saved = localStorage.getItem("byod-languages");
    return saved ? JSON.parse(saved) : availableLanguages;
  });
  const [defaultLanguage, setDefaultLanguage] = useState(() => {
    return localStorage.getItem("byod-default-language") || "en";
  });

  useEffect(() => {
    localStorage.setItem("byod-languages", JSON.stringify(languages));
  }, [languages]);

  useEffect(() => {
    localStorage.setItem("byod-default-language", defaultLanguage);
  }, [defaultLanguage]);

  const enabledLanguages = languages.filter((l) => l.enabled);
  const disabledLanguages = languages.filter((l) => !l.enabled);

  const toggleLanguage = (code: string) => {
    setLanguages((prev) =>
      prev.map((lang) =>
        lang.code === code ? { ...lang, enabled: !lang.enabled } : lang
      )
    );
    const lang = languages.find((l) => l.code === code);
    if (lang) {
      toast.success(lang.enabled ? `${lang.name} disabled` : `${lang.name} enabled`);
    }
  };

  const handleDefaultChange = (code: string) => {
    // Ensure the language is enabled first
    const lang = languages.find((l) => l.code === code);
    if (lang && !lang.enabled) {
      setLanguages((prev) =>
        prev.map((l) => (l.code === code ? { ...l, enabled: true } : l))
      );
    }
    setDefaultLanguage(code);
    toast.success(`Default language set to ${lang?.name}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language Settings
          </CardTitle>
          <CardDescription>
            Configure available languages for the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Language */}
          <div className="space-y-2">
            <Label>Default Language</Label>
            <Select value={defaultLanguage} onValueChange={handleDefaultChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select default language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      {lang.name} ({lang.nativeName})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This will be the default language for new users
            </p>
          </div>

          {/* Enabled Languages */}
          <div className="space-y-3">
            <Label>Enabled Languages</Label>
            <div className="flex flex-wrap gap-2">
              {enabledLanguages.map((lang) => (
                <Badge
                  key={lang.code}
                  variant="secondary"
                  className="px-3 py-1.5 flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Check className="h-3 w-3" />
                  {lang.name} ({lang.nativeName})
                  {lang.code !== "en" && (
                    <button
                      onClick={() => toggleLanguage(lang.code)}
                      className="ml-1 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  {lang.code === defaultLanguage && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      Default
                    </Badge>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Available Languages to Add */}
          <div className="space-y-3">
            <Label>Available Languages</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {disabledLanguages.map((lang) => (
                <Button
                  key={lang.code}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleLanguage(lang.code)}
                  className="justify-start gap-2"
                >
                  <Plus className="h-3 w-3" />
                  {lang.name} ({lang.nativeName})
                </Button>
              ))}
            </div>
            {disabledLanguages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All languages are enabled
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Translation Status</CardTitle>
          <CardDescription>
            Current translation completion for enabled languages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enabledLanguages.map((lang) => (
              <div key={lang.code} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({lang.nativeName})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: lang.code === "en" ? "100%" : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {lang.code === "en" ? "100%" : "0%"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Note: Translation files need to be added for each language. Currently only English is fully translated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSettings;
