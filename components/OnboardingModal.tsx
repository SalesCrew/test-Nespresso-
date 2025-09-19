"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  User, 
  MapPin, 
  Phone, 
  FileText, 
  Car, 
  Ruler, 
  GraduationCap, 
  Clock, 
  Target,
  Calendar,
  Timer,
  X
} from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: (data: any) => void
  onClose?: () => void
}

export default function OnboardingModal({ isOpen, onComplete, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCompleted, setIsCompleted] = useState(false)
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: "",
    lastName: "",
    title: "",
    
    // Step 2: Gender
    gender: "",
    pronouns: "",
    
    // Step 3: Address
    address: "",
    postalCode: "",
    city: "",
    
    // Step 4: Contact
    phone: "",
    email: "",
    
    // Step 5: Registration Data
    socialSecurityNumber: "",
    birthDate: "",
    citizenship: "",
    workPermit: null as boolean | null,
    
    // Step 6: Car
    drivingLicense: null as boolean | null,
    carAvailable: null as boolean | null,
    willingToDrive: null as boolean | null,
    
    // Step 7: Body & Clothing
    clothingSize: "",
    height: "",
    
    // Step 8: Education
    education: "",
    qualifications: "",
    currentJob: "",
    
    // Step 9: Spontaneity
    spontaneity: "",
    
    // Step 10: Region
    preferredRegion: "",
    
    // Step 11: Working Days
    workingDays: [] as string[],
    
    // Step 12: Hours
    hoursPerWeek: ""
  })

  // Standardized list of countries (German names), prioritized for AT job market
  const COUNTRIES: string[] = [
    // DACH & neighbors
    "Österreich","Deutschland","Schweiz","Italien","Frankreich","Spanien","Portugal","Niederlande","Belgien","Luxemburg","Dänemark","Schweden","Norwegen","Finnland","Island",
    // Central & Eastern Europe / Balkans
    "Polen","Tschechien","Slowakei","Ungarn","Slowenien","Kroatien","Bosnien und Herzegowina","Serbien","Montenegro","Kosovo","Nordmazedonien","Albanien","Griechenland","Bulgarien","Rumänien","Moldau","Ukraine","Belarus","Litauen","Lettland","Estland","Malta","Zypern","Türkei",
    // Western Europe & microstates
    "Vereinigtes Königreich","Irland","Andorra","Monaco","San Marino","Liechtenstein","Vatikanstadt",
    // Caucasus
    "Georgien","Armenien","Aserbaidschan",
    // Middle East
    "Israel","Palästina","Jordanien","Libanon","Syrien","Irak","Iran","Saudi-Arabien","Vereinigte Arabische Emirate","Katar","Bahrain","Kuwait","Oman","Jemen",
    // North Africa
    "Ägypten","Libyen","Tunesien","Algerien","Marokko",
    // West Africa
    "Mauretanien","Senegal","Gambia","Guinea","Guinea-Bissau","Sierra Leone","Liberia","Elfenbeinküste","Ghana","Togo","Benin","Burkina Faso","Kap Verde","Nigeria",
    // Central Africa
    "Kamerun","Äquatorialguinea","Gabun","Sao Tomé und Príncipe","Tschad","Zentralafrikanische Republik","Kongo (Republik)","Demokratische Republik Kongo","Angola",
    // East Africa & Horn
    "Sudan","Südsudan","Äthiopien","Eritrea","Dschibuti","Somalia","Kenia","Uganda","Ruanda","Burundi","Tansania","Madagaskar","Mauritius","Seychellen","Komoren",
    // Southern Africa
    "Südafrika","Namibia","Botswana","Simbabwe","Sambia","Malawi","Mosambik","Lesotho","Eswatini",
    // Central Asia
    "Kasachstan","Usbekistan","Kirgistan","Tadschikistan","Turkmenistan",
    // South Asia
    "Indien","Pakistan","Bangladesch","Sri Lanka","Nepal","Bhutan","Malediven","Afghanistan",
    // East Asia
    "China","Hongkong","Macau","Taiwan","Japan","Südkorea","Nordkorea","Mongolei",
    // Southeast Asia
    "Myanmar","Thailand","Laos","Kambodscha","Vietnam","Malaysia","Singapur","Indonesien","Brunei","Philippinen","Timor-Leste",
    // Oceania
    "Australien","Neuseeland","Papua-Neuguinea","Fidschi","Samoa","Tonga","Vanuatu","Salomonen","Kiribati","Tuvalu","Nauru","Mikronesien","Marshallinseln","Palau",
    // North America
    "Kanada","USA","Mexiko",
    // Central America
    "Guatemala","Belize","Honduras","El Salvador","Nicaragua","Costa Rica","Panama",
    // Caribbean
    "Bahamas","Kuba","Jamaika","Haiti","Dominikanische Republik","Barbados","Trinidad und Tobago","Grenada","Antigua und Barbuda","St. Kitts und Nevis","St. Lucia","St. Vincent und die Grenadinen",
    // South America
    "Kolumbien","Venezuela","Ecuador","Peru","Bolivien","Chile","Argentinien","Uruguay","Paraguay","Brasilien","Guyana","Suriname"
  ]

  // Citizenship input supports free typing but requires selection from list to validate
  const [citizenshipInput, setCitizenshipInput] = useState("")
  const [citizenshipConfirmed, setCitizenshipConfirmed] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)

  const totalSteps = 12
  const progress = (currentStep / totalSteps) * 100

  const isNonSchengenCountry = (citizenship: string) => {
    const schengenCountries = [
      "österreich", "deutschland", "schweiz", "italien", "frankreich", 
      "spanien", "portugal", "niederlande", "belgien", "luxemburg",
      "dänemark", "schweden", "norwegen", "finnland", "island",
      "polen", "tschechien", "slowakei", "ungarn", "slowenien",
      "estland", "lettland", "litauen", "malta", "griechenland"
    ]
    return !schengenCountries.some(country => 
      citizenship.toLowerCase().includes(country)
    )
  }

  const shouldShowWorkPermit = () => {
    return formData.citizenship && isNonSchengenCountry(formData.citizenship)
  }

  const handleNext = () => {
    if (currentStep === 5 && shouldShowWorkPermit() && formData.workPermit === null) {
      // Stay on step 5 until work permit is answered
      return
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Submit the form data
      onComplete(formData);
      setIsCompleted(true);
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isValidEmail = (email: string): boolean => {
    if (!email) return false
    // Basic but robust email pattern
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(email.trim())
  }

  const toggleWorkingDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName
      case 2:
        if (formData.gender === "divers") {
          return formData.gender && formData.pronouns
        }
        return formData.gender
      case 3:
        return formData.address && formData.postalCode && formData.city
      case 4:
        return formData.phone && isValidEmail(formData.email)
      case 5:
        const basicData = formData.socialSecurityNumber && formData.birthDate && formData.citizenship && citizenshipConfirmed
        if (shouldShowWorkPermit()) {
          return basicData && formData.workPermit !== null
        }
        return basicData
      case 6:
        return formData.drivingLicense !== null && formData.carAvailable !== null && formData.willingToDrive !== null
      case 7:
        return formData.clothingSize && formData.height
      case 8:
        return formData.education
      case 9:
        return formData.spontaneity
      case 10:
        return formData.preferredRegion
      case 11:
        return formData.workingDays.length > 0
      case 12:
        return formData.hoursPerWeek
      default:
        return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Wer bist du?</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Vorname"
                value={formData.firstName}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="Nachname"
                value={formData.lastName}
                onChange={(e) => updateFormData("lastName", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="Titel (optional)"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Geschlecht</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium mb-3">Wie möchtest du angesprochen werden?</p>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => updateFormData("gender", "männlich")}
                  className={`w-full ${
                    formData.gender === "männlich" 
                      ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500" 
                      : "hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                  }`}
                >
                  Männlich
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateFormData("gender", "weiblich")}
                  className={`w-full ${
                    formData.gender === "weiblich" 
                      ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500" 
                      : "hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                  }`}
                >
                  Weiblich
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateFormData("gender", "divers")}
                  className={`w-full ${
                    formData.gender === "divers" 
                      ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500" 
                      : "hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                  }`}
                >
                  Divers
                </Button>
              </div>
              
              {formData.gender === "divers" && (
                <div className="mt-4">
                  <Input
                    placeholder="Pronomen (z.B. sie/ihr, er/ihn, they/them)"
                    value={formData.pronouns}
                    onChange={(e) => updateFormData("pronouns", e.target.value)}
                    className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <MapPin className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Adresse</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Adresse"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="PLZ"
                  value={formData.postalCode}
                  onChange={(e) => updateFormData("postalCode", e.target.value)}
                  className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
                />
                <Input
                  placeholder="Ort"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Phone className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Kontaktdaten</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Telefonnummer"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <div>
                <Input
                  placeholder="E-Mail (gültiges Format erforderlich)"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className={`!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 ${formData.email && !isValidEmail(formData.email) ? 'focus-visible:!ring-red-500' : 'focus-visible:!ring-blue-500'} bg-gray-50 dark:bg-gray-800 text-sm`}
                />
                {formData.email && !isValidEmail(formData.email) && (
                  <p className="mt-1 text-xs text-red-600">Bitte eine gültige E-Mail-Adresse eingeben (z.B. name@example.com).</p>
                )}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <FileText className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Anmeldungsdaten</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="SV-Nummer"
                value={formData.socialSecurityNumber}
                onChange={(e) => updateFormData("socialSecurityNumber", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="Geburtsdatum (TT.MM.JJJJ)"
                value={formData.birthDate}
                onChange={(e) => updateFormData("birthDate", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              {/* Citizenship with typeahead + enforced selection */}
              <div className="relative">
                <Input
                  placeholder="Staatsbürgerschaft (Land eingeben, dann aus Liste auswählen)"
                  value={citizenshipInput}
                  onChange={(e) => {
                    setCitizenshipInput(e.target.value)
                    setCitizenshipConfirmed(false)
                    updateFormData("citizenship", e.target.value)
                    setCountryOpen(Boolean(e.target.value.trim()))
                  }}
                  onFocus={() => setCountryOpen(Boolean(citizenshipInput.trim()))}
                  className={`!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 ${citizenshipConfirmed ? '!ring-green-500' : '!ring-blue-500'} bg-gray-50 dark:bg-gray-800 text-sm pr-9`}
                />
                {/* Dropdown */}
                {countryOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-56 overflow-auto">
                    {COUNTRIES.filter(c => c.toLowerCase().includes(citizenshipInput.toLowerCase())).slice(0, 100).map((c) => (
                      <button
                        type="button"
                        key={c}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          updateFormData("citizenship", c)
                          setCitizenshipInput(c)
                          setCitizenshipConfirmed(true)
                          setCountryOpen(false)
                        }}
                      >
                        {c}
                      </button>
                    ))}
                    {COUNTRIES.filter(c => c.toLowerCase().includes(citizenshipInput.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">Kein Treffer – bitte anders eingeben</div>
                    )}
                  </div>
                )}
                {/* Hint badge */}
                {!citizenshipConfirmed && citizenshipInput.trim().length > 0 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-200">Aus Liste wählen</span>
                  </div>
                )}
              </div>
              
              {shouldShowWorkPermit() && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-3">Arbeitsbewilligung vorhanden?</p>
                  <div className="flex gap-3">
                    <Button
                      variant={formData.workPermit === true ? "default" : "outline"}
                      onClick={() => updateFormData("workPermit", true)}
                      className="flex-1"
                    >
                      Ja
                    </Button>
                    <Button
                      variant={formData.workPermit === false ? "default" : "outline"}
                      onClick={() => updateFormData("workPermit", false)}
                      className="flex-1"
                    >
                      Nein
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Car className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Auto</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3">Führerschein vorhanden?</p>
                <div className="flex gap-3">
                  <Button
                    variant={formData.drivingLicense === true ? "default" : "outline"}
                    onClick={() => updateFormData("drivingLicense", true)}
                    className="flex-1"
                  >
                    Ja
                  </Button>
                  <Button
                    variant={formData.drivingLicense === false ? "default" : "outline"}
                    onClick={() => updateFormData("drivingLicense", false)}
                    className="flex-1"
                  >
                    Nein
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Auto vorhanden?</p>
                <div className="flex gap-3">
                  <Button
                    variant={formData.carAvailable === true ? "default" : "outline"}
                    onClick={() => updateFormData("carAvailable", true)}
                    className="flex-1"
                  >
                    Ja
                  </Button>
                  <Button
                    variant={formData.carAvailable === false ? "default" : "outline"}
                    onClick={() => updateFormData("carAvailable", false)}
                    className="flex-1"
                  >
                    Nein
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Bereitschaft zu fahren?</p>
                <div className="flex gap-3">
                  <Button
                    variant={formData.willingToDrive === true ? "default" : "outline"}
                    onClick={() => updateFormData("willingToDrive", true)}
                    className="flex-1"
                  >
                    Ja
                  </Button>
                  <Button
                    variant={formData.willingToDrive === false ? "default" : "outline"}
                    onClick={() => updateFormData("willingToDrive", false)}
                    className="flex-1"
                  >
                    Nein
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Ruler className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Körper und Kleidungsgröße</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Kleidergröße (z.B. S, M, L, XL oder 38, 40, 42...)"
                value={formData.clothingSize}
                onChange={(e) => updateFormData("clothingSize", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="Körpergröße (in cm)"
                type="number"
                value={formData.height}
                onChange={(e) => updateFormData("height", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <GraduationCap className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Schulische Ausbildung</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Höchste abgeschlossene Schulausbildung"
                value={formData.education}
                onChange={(e) => updateFormData("education", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="Zusatzqualifikationen (optional)"
                value={formData.qualifications}
                onChange={(e) => updateFormData("qualifications", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="Derzeitige Beschäftigung (optional)"
                value={formData.currentJob}
                onChange={(e) => updateFormData("currentJob", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        )

      case 9:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Clock className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Spontanität</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium mb-3">Wie oft kannst du spontan für Einsätze einspringen?</p>
              <div className="flex flex-col gap-3">
                <Button
                  variant={formData.spontaneity === "oft" ? "default" : "outline"}
                  onClick={() => updateFormData("spontaneity", "oft")}
                  className={`w-full ${
                    formData.spontaneity === "oft" 
                      ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                      : "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20"
                  }`}
                >
                  Oft
                </Button>
                <Button
                  variant={formData.spontaneity === "selten" ? "default" : "outline"}
                  onClick={() => updateFormData("spontaneity", "selten")}
                  className={`w-full ${
                    formData.spontaneity === "selten" 
                      ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" 
                      : "hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20"
                  }`}
                >
                  Selten
                </Button>
                <Button
                  variant={formData.spontaneity === "nie" ? "default" : "outline"}
                  onClick={() => updateFormData("spontaneity", "nie")}
                  className={`w-full ${
                    formData.spontaneity === "nie" 
                      ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                      : "hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20"
                  }`}
                >
                  Nie
                </Button>
              </div>
            </div>
          </div>
        )

      case 10:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Target className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Einsatzregion</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium mb-3">Bevorzugte Einsatz Region (z.B. Wien, Graz, Linz...)</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: "wien-noe-bgl", name: "Wien/NÖ/Bgl" },
                  { key: "steiermark", name: "Steiermark" },
                  { key: "salzburg", name: "Salzburg" },
                  { key: "oberoesterreich", name: "Oberösterreich" },
                  { key: "tirol", name: "Tirol" },
                  { key: "vorarlberg", name: "Vorarlberg" },
                  { key: "kaernten", name: "Kärnten" }
                ].map((region) => (
                  <Button
                    key={region.key}
                    variant="outline"
                    onClick={() => updateFormData("preferredRegion", region.key)}
                    className={`w-full ${
                      formData.preferredRegion === region.key
                        ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                        : "bg-white hover:bg-blue-50 hover:border-blue-200 text-gray-700 border-gray-200"
                    }`}
                  >
                    {region.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )

      case 11:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Einsatzort</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium mb-3">An welchen Tagen kannst du arbeiten?</p>
              <div className="grid grid-cols-4 gap-2">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                  <Badge
                    key={day}
                    variant={formData.workingDays.includes(day) ? "default" : "outline"}
                    className="cursor-pointer py-2 px-4 text-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900"
                    onClick={() => toggleWorkingDay(day)}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )

      case 12:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Timer className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Stundenwunsch</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Gewünschte Stunden pro Woche"
                type="number"
                value={formData.hoursPerWeek}
                onChange={(e) => updateFormData("hoursPerWeek", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
        onClick={onClose}
      />
      
      {/* Modal */}
              <Card 
          className="relative w-full max-w-md mx-4 border-none shadow-2xl bg-white dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >

        {isCompleted ? (
          /* Completion Animation */
          <div className="p-8 text-center">
            <div className="mb-6">
              {/* Animated checkmark */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce">
                <svg 
                  className="w-10 h-10 text-white animate-pulse" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 animate-fade-in">
                Du bist einen Schritt näher dem Team beizutreten! 🎉
              </h2>
                             <p className="text-gray-600 dark:text-gray-400 animate-fade-in-delay">
                Das Team meldet sich bei dir, sobald alle Daten ausgewertet wurden.
               </p>
              
              {/* Loading dots */}
              <div className="flex justify-center space-x-2 mt-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Vielen Dank für dein Interesse!
              </p>
            </div>
          </div>
        ) : (
          /* Normal onboarding flow */
          <>
            <CardHeader className="pb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Willkommen bei SalesCrew</CardTitle>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {currentStep}/{totalSteps}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {renderStep()}
              
              <div className="flex gap-3 pt-4">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Zurück
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {currentStep === totalSteps ? "Abschließen" : "Weiter"}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.3s both;
        }
      `}</style>
    </div>
  )
} 