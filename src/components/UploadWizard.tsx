import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronLeft, MapPin, Building2, ShieldCheck } from 'lucide-react';

interface WizardData {
  country: string;
  region: string;
  consent: boolean;
}

interface UploadWizardProps {
  onComplete: (data: WizardData) => void;
}

const europeanCountries: Record<string, string[]> = {
  'Austria': ['Vienna', 'Salzburg', 'Tyrol', 'Styria', 'Upper Austria', 'Lower Austria', 'Carinthia', 'Vorarlberg', 'Burgenland'],
  'Belgium': ['Brussels', 'Flanders', 'Wallonia', 'Antwerp', 'East Flanders', 'West Flanders', 'Limburg', 'Liège', 'Hainaut'],
  'Bulgaria': ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven'],
  'Croatia': ['Zagreb', 'Split-Dalmatia', 'Istria', 'Primorje-Gorski Kotar', 'Osijek-Baranja', 'Dubrovnik-Neretva'],
  'Cyprus': ['Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta', 'Kyrenia'],
  'Czech Republic': ['Prague', 'Central Bohemia', 'South Bohemia', 'Moravia-Silesia', 'South Moravia', 'Olomouc', 'Liberec'],
  'Denmark': ['Capital Region', 'Central Denmark', 'North Denmark', 'Zealand', 'Southern Denmark'],
  'Estonia': ['Harju', 'Tartu', 'Ida-Viru', 'Pärnu', 'Lääne-Viru', 'Viljandi', 'Rapla', 'Võru'],
  'Finland': ['Uusimaa', 'Southwest Finland', 'Pirkanmaa', 'North Ostrobothnia', 'Central Finland', 'Lapland', 'Satakunta'],
  'France': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Hauts-de-France', 'Grand Est', 'Pays de la Loire', 'Brittany', 'Normandy'],
  'Germany': ['Bavaria', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Hesse', 'Lower Saxony', 'Saxony', 'Berlin', 'Hamburg', 'Rhineland-Palatinate', 'Schleswig-Holstein', 'Brandenburg', 'Thuringia'],
  'Greece': ['Attica', 'Central Macedonia', 'Thessaly', 'Crete', 'Western Greece', 'Peloponnese', 'Eastern Macedonia and Thrace', 'South Aegean'],
  'Hungary': ['Budapest', 'Pest', 'Borsod-Abaúj-Zemplén', 'Hajdú-Bihar', 'Győr-Moson-Sopron', 'Csongrád-Csanád', 'Baranya', 'Fejér'],
  'Ireland': ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kerry', 'Mayo', 'Donegal', 'Wicklow', 'Kildare'],
  'Italy': ['Lombardy', 'Lazio', 'Campania', 'Veneto', 'Emilia-Romagna', 'Piedmont', 'Sicily', 'Tuscany', 'Puglia', 'Liguria'],
  'Latvia': ['Riga', 'Vidzeme', 'Latgale', 'Kurzeme', 'Zemgale', 'Pierīga'],
  'Lithuania': ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys', 'Alytus', 'Marijampolė', 'Tauragė'],
  'Luxembourg': ['Luxembourg City', 'Diekirch', 'Grevenmacher', 'Capellen', 'Esch-sur-Alzette', 'Mersch', 'Clervaux', 'Redange'],
  'Malta': ['Northern Region', 'Southern Region', 'South Eastern Region', 'Western Region', 'Northern Harbour', 'Southern Harbour', 'Gozo and Comino'],
  'Netherlands': ['North Holland', 'South Holland', 'North Brabant', 'Gelderland', 'Utrecht', 'Limburg', 'Overijssel', 'Flevoland', 'Friesland', 'Groningen'],
  'Poland': ['Masovia', 'Lesser Poland', 'Silesia', 'Greater Poland', 'Lower Silesia', 'Łódź', 'Pomerania', 'Lublin', 'West Pomerania'],
  'Portugal': ['Lisbon', 'Norte', 'Centro', 'Algarve', 'Alentejo', 'Azores', 'Madeira'],
  'Romania': ['Bucharest', 'Cluj', 'Timiș', 'Iași', 'Constanța', 'Brașov', 'Prahova', 'Dolj', 'Galați'],
  'Slovakia': ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica', 'Nitra', 'Trnava', 'Trenčín'],
  'Slovenia': ['Central Slovenia', 'Drava', 'Savinja', 'Coastal–Karst', 'Upper Carniola', 'Gorizia', 'Southeast Slovenia', 'Mura'],
  'Spain': ['Catalonia', 'Andalusia', 'Madrid', 'Valencia', 'Galicia', 'Castile and León', 'Basque Country', 'Canary Islands', 'Castilla-La Mancha', 'Aragon'],
  'Sweden': ['Stockholm', 'Västra Götaland', 'Skåne', 'Östergötland', 'Uppsala', 'Jönköping', 'Halland', 'Örebro', 'Gävleborg', 'Dalarna'],
};

const steps = [
  { id: 'country', title: 'Select Country', icon: MapPin },
  { id: 'region', title: 'Select Region', icon: Building2 },
  { id: 'consent', title: 'Consent', icon: ShieldCheck },
];

export function UploadWizard({ onComplete }: UploadWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    country: '',
    region: '',
    consent: false,
  });

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return wizardData.country !== '';
      case 1:
        return wizardData.region !== '';
      case 2:
        return wizardData.consent;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(wizardData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCountryChange = (country: string) => {
    setWizardData({ ...wizardData, country, region: '' });
  };

  return (
    <Card className="w-full max-w-lg glass">
      <CardHeader className="text-center">
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-primary text-primary-foreground scale-110'
                    : index < currentStep
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
            );
          })}
        </div>
        <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
        <CardDescription>
          Step {currentStep + 1} of {steps.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <Label htmlFor="country">Which European country are you from?</Label>
            <Select value={wizardData.country} onValueChange={handleCountryChange}>
              <SelectTrigger id="country" className="w-full">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(europeanCountries).sort().map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <Label htmlFor="region">Which region in {wizardData.country}?</Label>
            <Select
              value={wizardData.region}
              onValueChange={(region) => setWizardData({ ...wizardData, region })}
            >
              <SelectTrigger id="region" className="w-full">
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent>
                {europeanCountries[wizardData.country]?.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h4 className="font-medium mb-2">Your Information</h4>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Country:</span> {wizardData.country}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Region:</span> {wizardData.region}
              </p>
            </div>
            <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
              <Checkbox
                id="consent"
                checked={wizardData.consent}
                onCheckedChange={(checked) =>
                  setWizardData({ ...wizardData, consent: checked === true })
                }
                className="mt-1"
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                I confirm that I have the legal right to upload this data and that I am authorized 
                to process any personal information contained within. I understand my responsibilities 
                under applicable data protection regulations.
              </Label>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
            {currentStep === steps.length - 1 ? 'Continue to Data Studio' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
