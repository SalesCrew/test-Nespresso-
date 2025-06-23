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

interface SimpleOnboardingModalProps {
  isOpen: boolean
  onComplete: (data: any) => void
  onClose?: () => void
}

export default function SimpleOnboardingModal({ isOpen, onComplete, onClose }: SimpleOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCompleted, setIsCompleted] = useState(false)
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: "",
    lastName: "",
    title: "",
    
    // Step 2: Address
    address: "",
    postalCode: "",
    city: "",
    
    // Step 3: Contact
    phone: "",
    email: "",
    
    // Step 4: Registration Data
    socialSecurityNumber: "",
    birthDate: "",
    citizenship: "",
    workPermit: null as boolean | null,
    
    // Step 5: Car
    drivingLicense: null as boolean | null,
    carAvailable: null as boolean | null,
    willingToDrive: null as boolean | null,
    
    // Step 6: Body & Clothing
    clothingSize: "",
    height: "",
    
    // Step 7: Education
    education: "",
    qualifications: "",
    currentJob: "",
    
    // Step 8: Spontaneity
    spontaneity: "",
    
    // Step 9: Region
    preferredRegion: "",
    
    // Step 10: Working Days
    workingDays: [] as string[],
    
    // Step 11: Hours
    hoursPerWeek: ""
  })

  const totalSteps = 11
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
    if (currentStep === 4 && shouldShowWorkPermit() && formData.workPermit === null) {
      // Stay on step 4 until work permit is answered
      return
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsCompleted(true)
      setTimeout(() => {
        onComplete(formData)
      }, 2000) // Show simple completion message for 2 seconds
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
        return formData.address && formData.postalCode && formData.city
      case 3:
        return formData.phone && formData.email
      case 4:
        const basicData = formData.socialSecurityNumber && formData.birthDate && formData.citizenship
        if (shouldShowWorkPermit()) {
          return basicData && formData.workPermit !== null
        }
        return basicData
      case 5:
        return formData.drivingLicense !== null && formData.carAvailable !== null && formData.willingToDrive !== null
      case 6:
        return formData.clothingSize && formData.height
      case 7:
        return formData.education
      case 8:
        return formData.spontaneity
      case 9:
        return formData.preferredRegion
      case 10:
        return formData.workingDays.length > 0
      case 11:
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
              <MapPin className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Wo wohnst du?</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Adresse"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="PLZ"
                  value={formData.postalCode}
                  onChange={(e) => updateFormData("postalCode", e.target.value)}
                  className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
                />
                <Input
                  placeholder="Stadt"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Phone className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Wie erreichen wir dich?</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Telefonnummer"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="E-Mail"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <FileText className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Zur Anmeldung</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Sozialversicherungsnummer"
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
              <Input
                placeholder="Staatsbürgerschaft"
                value={formData.citizenship}
                onChange={(e) => updateFormData("citizenship", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              
              {shouldShowWorkPermit() && (
                <div>
                  <p className="text-sm font-medium mb-3">Hast du eine gültige Arbeitserlaubnis für Österreich?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => updateFormData("workPermit", true)}
                      className={`${
                        formData.workPermit === true 
                          ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                          : "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20"
                      }`}
                    >
                      Ja
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateFormData("workPermit", false)}
                      className={`${
                        formData.workPermit === false 
                          ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                          : "hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20"
                      }`}
                    >
                      Nein
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Car className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Auto & Mobilität</h2>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3">Hast du einen Führerschein?</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => updateFormData("drivingLicense", true)}
                    className={`${
                      formData.drivingLicense === true 
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                        : "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20"
                    }`}
                  >
                    Ja
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateFormData("drivingLicense", false)}
                    className={`${
                      formData.drivingLicense === false 
                        ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                        : "hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20"
                    }`}
                  >
                    Nein
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Steht dir ein Auto zur Verfügung?</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => updateFormData("carAvailable", true)}
                    className={`${
                      formData.carAvailable === true 
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                        : "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20"
                    }`}
                  >
                    Ja
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateFormData("carAvailable", false)}
                    className={`${
                      formData.carAvailable === false 
                        ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                        : "hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20"
                    }`}
                  >
                    Nein
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Bist du bereit, zu Einsätzen zu fahren?</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => updateFormData("willingToDrive", true)}
                    className={`${
                      formData.willingToDrive === true 
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                        : "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20"
                    }`}
                  >
                    Ja
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateFormData("willingToDrive", false)}
                    className={`${
                      formData.willingToDrive === false 
                        ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                        : "hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20"
                    }`}
                  >
                    Nein
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Ruler className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Körper & Kleidung</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Kleidergröße (z.B. M, L, XL)"
                value={formData.clothingSize}
                onChange={(e) => updateFormData("clothingSize", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="Körpergröße in cm"
                value={formData.height}
                onChange={(e) => updateFormData("height", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <GraduationCap className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Bildung & Erfahrung</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Höchste Ausbildung"
                value={formData.education}
                onChange={(e) => updateFormData("education", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="Weitere Qualifikationen (optional)"
                value={formData.qualifications}
                onChange={(e) => updateFormData("qualifications", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Input
                placeholder="Aktueller Job/Beruf (optional)"
                value={formData.currentJob}
                onChange={(e) => updateFormData("currentJob", e.target.value)}
                className="!border-0 !ring-0 !ring-offset-0 focus-visible:!ring-2 focus-visible:!ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-6">
              <Clock className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Spontaneität</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium mb-3">Wie spontan kannst du Einsätze übernehmen?</p>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => updateFormData("spontaneity", "sehr")}
                  className={`w-full ${
                    formData.spontaneity === "sehr" 
                      ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                      : "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20"
                  }`}
                >
                  Sehr spontan (gleicher Tag)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateFormData("spontaneity", "mittel")}
                  className={`w-full ${
                    formData.spontaneity === "mittel" 
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500" 
                      : "hover:bg-yellow-50 hover:border-yellow-200 dark:hover:bg-yellow-900/20"
                  }`}
                >
                  Mittel (1-2 Tage Vorlauf)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateFormData("spontaneity", "wenig")}
                  className={`w-full ${
                    formData.spontaneity === "wenig" 
                      ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" 
                      : "hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20"
                  }`}
                >
                  Wenig (1 Woche Vorlauf)
                </Button>
                <Button
                  variant="outline"
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

      case 9:
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

      case 10:
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

      case 11:
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 border-none shadow-2xl bg-white dark:bg-gray-900">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}
        
        {isCompleted ? (
          /* Simple Completion Message */
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-white" 
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Bewerbung eingereicht! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Vielen Dank für dein Interesse. Wir melden uns bald bei dir!
              </p>
            </div>
          </div>
        ) : (
          /* Normal onboarding flow */
          <>
            <CardHeader className="pb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Werde Promotor</CardTitle>
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
    </div>
  )
} 