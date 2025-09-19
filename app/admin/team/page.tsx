"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Settings,
  User,
  BarChart2,
  Home,
  Briefcase,
  MessagesSquare,
  X,
  Send,
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  MoreVertical,
  Star,
  Activity,
  FileText,
  GraduationCap,
  Check,
  ChevronDown,
  Loader2,
  Eye,
  Video,
  HelpCircle,
  FileSignature,
  Cake,
  ArrowLeft,
  Download,
  CreditCard,
  Ruler
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DienstvertragTemplate } from "@/components/DienstvertragTemplate";
import AdminNavigation from "@/components/AdminNavigation";
import AdminEddieAssistant from "@/components/AdminEddieAssistant";


export default function PromotorenPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Simple skeleton fade animation CSS
  const skeletonStyles = `
    .animate-skeleton-fade {
      animation: skeleton-fade 0.7s ease-in-out infinite alternate;
    }
    @keyframes skeleton-fade {
      0% {
        background-color: #f9fafb;
      }
      100% {
        background-color: #f3f4f6;
      }
    }
  `;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  


  // Notes functionality
  const [notesOpen, setNotesOpen] = useState<number | null>(null);
  const [notes, setNotes] = useState<{[key: number]: string}>({});
  const [notesPosition, setNotesPosition] = useState<Record<number, 'left' | 'right'>>({});
  const [detailedViewOpen, setDetailedViewOpen] = useState<number | null>(null);
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  
  // Magic touch functionality (copied from admin/statistiken)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [magicTouchCategories, setMagicTouchCategories] = useState<Record<number, string>>({});

  // Magic touch categories (copied from admin/statistiken)
  const categories = [
    { name: 'Neutral', color: '#f8f9fa', bgColor: '#f8f9fa', borderColor: '#e9ecef', icon: <GraduationCap className="h-3 w-3" /> },
    { name: 'Beeindruckt', color: '#d1f7eb', bgColor: '#d1f7eb', borderColor: '#a7f3d0', icon: <Star className="h-3 w-3" /> },
    { name: 'Zufrieden', color: '#fff0c7', bgColor: '#fff0c7', borderColor: '#fde68a', icon: <CheckCircle className="h-3 w-3" /> },
    { name: 'Verbesserung', color: '#d7ecfb', bgColor: '#d7ecfb', borderColor: '#bfdbfe', icon: <TrendingUp className="h-3 w-3" /> },
    { name: 'Motivierend (unzufrieden)', color: '#eadaff', bgColor: '#eadaff', borderColor: '#ddd6fe', icon: <Activity className="h-3 w-3" /> },
    { name: 'Verschlechterung', color: '#ffe3e3', bgColor: '#ffe3e3', borderColor: '#fecaca', icon: <AlertCircle className="h-3 w-3" /> }
  ];
  
  // Dienstvertrag functionality
  const [showDienstvertragPopup, setShowDienstvertragPopup] = useState(false);
  const [showDienstvertragContent, setShowDienstvertragContent] = useState(false);
  const [selectedPromotorForContract, setSelectedPromotorForContract] = useState<number | null>(null);
  const [contractForm, setContractForm] = useState({
    hoursPerWeek: '',
    monthlyGross: '',
    startDate: '',
    endDate: '',
    isTemporary: false,
    employmentType: 'geringfügig' as 'geringfügig' | 'teilzeit' | 'vollzeit' | 'freelancer'
  });
  // Contracts for selected promotor
  const [promotorContracts, setPromotorContracts] = useState<any[] | null>(null);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const refreshPromotorContracts = async (promotorId: string) => {
    try {
      setLoadingContracts(true);
      const res = await fetch(`/api/promotors/${promotorId}/contracts`, { cache: 'no-store' });
      const j = await res.json();
      setPromotorContracts(Array.isArray(j.contracts) ? j.contracts : []);
    } catch {
      setPromotorContracts([]);
    } finally { setLoadingContracts(false); }
  };

  useEffect(() => {
    const uid = selectedPromotorForContract ? String(selectedPromotorForContract) : null;
    if (uid && showDienstvertragPopup) {
      refreshPromotorContracts(uid);
    }
  }, [selectedPromotorForContract, showDienstvertragPopup]);
  
  // Bank details functionality - for showing/hiding IBAN
  const [ibanVisible, setIbanVisible] = useState<Record<number, boolean>>({});
  const [ibanTimeouts, setIbanTimeouts] = useState<Record<number, NodeJS.Timeout>>({});
  const [ibanCopied, setIbanCopied] = useState<Record<number, boolean>>({});
  const [accountHolderCopied, setAccountHolderCopied] = useState<Record<number, boolean>>({});
  const [bicCopied, setBicCopied] = useState<Record<number, boolean>>({});

  // Status confirmation modal state
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [statusChangePromotorId, setStatusChangePromotorId] = useState<number | null>(null);
  
  // Document management state
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, string>>({});
  
  // Track if Strafregister is deactivated
  const [strafregisterDeactivated, setStrafregisterDeactivated] = useState(false);
  
  // Track which documents have files submitted (variable based on actual submissions)
  const [documentsWithFiles, setDocumentsWithFiles] = useState<Record<string, boolean>>({});
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [showStammdatenblatt, setShowStammdatenblatt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveForm, setApproveForm] = useState<{email: string; display_name: string; password: string; applicationId: string | null}>({ email: '', display_name: '', password: '', applicationId: null });
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approveResultPw, setApproveResultPw] = useState<string | null>(null);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [promotorStammdaten, setPromotorStammdaten] = useState<Record<number, any>>({});
  const [openStammdatenPreviewFor, setOpenStammdatenPreviewFor] = useState<number | null>(null);
  
  // Stammdatenblatt (submitted onboarding data)
  const [submittedOnboardingData, setSubmittedOnboardingData] = useState<any[]>([
    {
      id: 1,
      submittedAt: "2024-01-15T10:30:00Z",
      firstName: "Maria",
      lastName: "Huber",
      title: "",
      gender: "weiblich",
      pronouns: "",
      address: "Mariahilfer Straße 45",
      postalCode: "1060",
      city: "Wien",
      phone: "+43 664 789 0123",
      email: "maria.huber@email.at",
      socialSecurityNumber: "1234567890",
      birthDate: "15.03.1995",
      citizenship: "Österreich",
      workPermit: null,
      drivingLicense: true,
      carAvailable: true,
      willingToDrive: true,
      clothingSize: "M",
      height: "165",
      education: "Matura",
      qualifications: "Verkaufserfahrung im Einzelhandel",
      currentJob: "Teilzeit im Einzelhandel",
      spontaneity: "mittel",
      preferredRegion: "wien-noe-bgl",
      workingDays: ["Mo", "Di", "Mi", "Do", "Fr"],
      hoursPerWeek: "25"
    },
    {
      id: 2,
      submittedAt: "2024-01-14T14:20:00Z",
      firstName: "Stefan",
      lastName: "Mayer",
      title: "Mag.",
      gender: "männlich",
      pronouns: "",
      address: "Herrengasse 12",
      postalCode: "8010",
      city: "Graz",
      phone: "+43 676 456 7890",
      email: "stefan.mayer@gmail.com",
      socialSecurityNumber: "0987654321",
      birthDate: "22.07.1992",
      citizenship: "Deutschland",
      workPermit: true,
      drivingLicense: true,
      carAvailable: false,
      willingToDrive: false,
      clothingSize: "L",
      height: "180",
      education: "Universitätsabschluss",
      qualifications: "Marketing Studium",
      currentJob: "Student",
      spontaneity: "sehr",
      preferredRegion: "steiermark",
      workingDays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      hoursPerWeek: "30"
    },
    {
      id: 3,
      submittedAt: "2024-01-13T09:15:00Z",
      firstName: "Jennifer",
      lastName: "Schmidt",
      title: "",
      gender: "divers",
      pronouns: "sie/ihr",
      address: "Mozartplatz 3",
      postalCode: "5020",
      city: "Salzburg",
      phone: "+43 650 123 4567",
      email: "j.schmidt@outlook.com",
      socialSecurityNumber: "1122334455",
      birthDate: "08.11.1998",
      citizenship: "Österreich",
      workPermit: null,
      drivingLicense: false,
      carAvailable: false,
      willingToDrive: false,
      clothingSize: "S",
      height: "160",
      education: "Lehre",
      qualifications: "Einzelhandelskauffrau",
      currentJob: "Arbeitslos",
      spontaneity: "wenig",
      preferredRegion: "salzburg",
      workingDays: ["Mo", "Mi", "Fr"],
      hoursPerWeek: "20"
    }
  ]);

  // Submit application to backend
  const submitApplication = async (entry: any) => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: `${entry.firstName} ${entry.lastName}`.trim(),
          email: entry.email,
          phone: entry.phone,
          notes: `region=${entry.preferredRegion}; hours=${entry.hoursPerWeek}`
        })
      });
      if (!res.ok) throw new Error('Fehler beim Absenden des Stammdatenblatts');
      setToastMsg('Stammdatenblatt gespeichert');
    } catch (e: any) {
      setToastMsg(e.message || 'Fehler');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  function generateRandomPassword(length: number = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let out = '';
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  const copyEmailToClipboard = async () => {
    const emailText = `Hallo ${approveForm.display_name},

Willkommen in der Zukunft der Nespresso Promotions!

Deine Login-Daten sind:
E-Mail: ${approveForm.email}
Passwort: ${approveResultPw}

Wir freuen uns, dich im Team zu haben!

Beste Grüße,
Dein Nespresso Team`;

    try {
      await navigator.clipboard.writeText(emailText);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  // (Dialog JSX is rendered once at root to avoid remounts that cause input selection/focus jumps)

  // Approve (Annehmen) → create promotor account from submission
  const approveSubmission = async (entry: any) => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/create-promotor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: approveForm.email,
          display_name: approveForm.display_name,
          password: approveForm.password?.trim() ? approveForm.password : undefined,
          applicationId: approveForm.applicationId ?? entry.id,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Fehler bei Annehmen');
      setApproveResultPw(data?.password ?? null);
      setApproveError(null);
      setToastMsg(`Promotor angelegt`);
      setShowEmailTemplate(true);
      // Create a promotor card locally from the matching Stammdaten submission
      const applicationId = approveForm.applicationId ?? entry.id;
      const matchedSubmission = submittedOnboardingData.find((s: any) => String(s.id) === String(applicationId));
      if (matchedSubmission) {
        const newPromotor = {
          id: Date.now(),
          name: `${matchedSubmission.firstName} ${matchedSubmission.lastName}`.trim() || approveForm.display_name,
          email: matchedSubmission.email || approveForm.email,
          phone: matchedSubmission.phone || '',
          address: [matchedSubmission.address, matchedSubmission.postalCode, matchedSubmission.city].filter(Boolean).join(', '),
          birthDate: matchedSubmission.birthDate || '',
          region: matchedSubmission.preferredRegion || 'wien-noe-bgl',
          workingDays: matchedSubmission.workingDays || [],
          status: 'active',
          lastActivity: new Date().toISOString().slice(0, 10),
          performance: { mcet: 0, tma: 0, vlshare: 0 },
          assignments: 0,
          completedTrainings: 0,
          onboardingProgress: 0,
          ausfaelle: { krankenstand: 0, notfaelle: 0 },
      avatar: "/placeholder.svg",
          bankDetails: { accountHolder: '', bankName: '', iban: '', bic: '' },
          clothingInfo: { height: matchedSubmission.height || '', size: matchedSubmission.clothingSize || '' }
        } as any;
        setPromotors(prev => [newPromotor, ...prev]);
        setPromotorStammdaten(prev => ({ ...prev, [newPromotor.id]: matchedSubmission }));
      }
      await loadSubmissions();
    } catch (e: any) {
      setApproveError(e.message || 'Fehler');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  // Load real applications from backend
  const loadSubmissions = async () => {
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && Array.isArray(json.applications)) {
        // Map server shape to UI shape expected here
        const mapped = json.applications.map((a: any) => ({
          id: a.id as string, // keep DB id (uuid) for actions like approve
          submittedAt: a.created_at ?? new Date().toISOString(),
          firstName: (a.full_name ?? '').split(' ')[0] ?? '',
          lastName: (a.full_name ?? '').split(' ').slice(1).join(' ') ?? '',
          title: a.title ?? '',
          gender: a.gender ?? '',
          pronouns: a.pronouns ?? '',
          address: a.address ?? '',
          postalCode: a.postalCode ?? '',
          city: a.city ?? '',
          phone: a.phone ?? '',
          email: a.email ?? '',
          socialSecurityNumber: a.socialSecurityNumber ?? '',
          birthDate: a.birthDate ?? '',
          citizenship: a.citizenship ?? '',
          workPermit: a.workPermit ?? null,
          drivingLicense: a.drivingLicense ?? null,
          carAvailable: a.carAvailable ?? null,
          willingToDrive: a.willingToDrive ?? null,
          clothingSize: a.clothingSize ?? '',
          height: a.height ?? '',
          education: a.education ?? '',
          qualifications: a.qualifications ?? '',
          currentJob: a.currentJob ?? '',
          spontaneity: a.spontaneity ?? '',
          preferredRegion: a.preferredRegion ?? '',
          workingDays: a.workingDays ?? [],
          hoursPerWeek: a.hoursPerWeek ?? '',
          status: a.status ?? 'received'
        }));
        setSubmittedOnboardingData(mapped);
      }
    } catch (e) {
      // fail silent for now
    }
  };

  useEffect(() => {
    // Always load initially and whenever toggled
    loadSubmissions();
    loadPromotors();
  }, []);

  // When a detailed promotor view opens, load their document statuses from backend
  useEffect(() => {
    if (detailedViewOpen) {
      try {
        const uid = String(detailedViewOpen)
        loadPromotorDocuments(uid)
      } catch {}
    }
  }, [detailedViewOpen]);

  // Load documents for selected promotor into the documentStatuses/withFiles maps
  const loadPromotorDocuments = async (uid: string) => {
    try {
      const res = await fetch(`/api/promotors/${uid}/documents`, { cache: 'no-store' })
      const json = await res.json()
      const rows: Array<{ doc_type: string; status: string; file_path?: string }> = Array.isArray(json.documents) ? json.documents : []
      const nameFromType = (t: string) => t === 'citizenship' ? 'Staatsbürgerschaftsnachweis' : t === 'passport' ? 'Pass' : t === 'arbeitserlaubnis' ? 'Arbeitserlaubnis' : t === 'strafregister' ? 'Strafregister' : 'Zusätzliche Dokumente'
      const statuses: Record<string, string> = {}
      const files: Record<string, boolean> = {}
      for (const r of rows) {
        const name = nameFromType(r.doc_type)
        if (r.status === 'approved') {
          statuses[name] = 'approved'
          files[name] = !!r.file_path
        } else if (r.status === 'uploaded') {
          statuses[name] = 'pending'
          files[name] = !!r.file_path
        } else if (r.status === 'rejected') {
          statuses[name] = 'missing'
          files[name] = false
        }
      }
      setDocumentStatuses(statuses)
      setDocumentsWithFiles(files)
    } catch {}
  }
  useEffect(() => {
    if (showStammdatenblatt) loadSubmissions();
  }, [showStammdatenblatt]);



  // Promotors state (real data only; no mock fallback)
  const [promotors, setPromotors] = useState<any[]>([]);
  const [promotorsLoading, setPromotorsLoading] = useState(true); // Start loading immediately
  const [promotorsError, setPromotorsError] = useState(false);

  // Load promotors from backend
  const loadPromotors = async () => {
    try {
      setPromotorsLoading(true);
      setPromotorsError(false);
      const res = await fetch('/api/promotors', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && Array.isArray(json.promotors)) {
        const normalized = json.promotors.map((p: any) => ({
          id: p.id,
          name: p.name || 'Unbekannt',
          email: p.email || '',
          phone: p.phone || '',
          address: p.address || '',
          birthDate: p.birthDate || '',
          region: p.region || 'wien-noe-bgl',
          workingDays: Array.isArray(p.workingDays) ? p.workingDays : [],
          status: p.status || 'active',
          lastActivity: p.lastActivity || new Date().toISOString().slice(0, 10),
          // keep UI-specific metrics from existing data; only set if provided
          performance: p.performance && typeof p.performance === 'object' ? p.performance : undefined,
          assignments: typeof p.assignments === 'number' ? p.assignments : undefined,
          completedTrainings: typeof p.completedTrainings === 'number' ? p.completedTrainings : undefined,
          onboardingProgress: typeof p.onboardingProgress === 'number' ? p.onboardingProgress : undefined,
          ausfaelle: p.ausfaelle && typeof p.ausfaelle === 'object' ? p.ausfaelle : undefined,
          avatar: p.avatar || undefined,
          bankDetails: p.bankDetails && typeof p.bankDetails === 'object' ? p.bankDetails : undefined,
          clothingInfo: p.clothingInfo || undefined,
          applicationId: p.applicationId || null,
        }));

        // Use backend data only; map to UI shape with safe KPI defaults
        const cards = normalized.map((inc: any) => ({
          id: inc.id,
          name: inc.name,
          email: inc.email,
          phone: inc.phone,
          address: inc.address,
          birthDate: inc.birthDate,
          region: inc.region,
          workingDays: inc.workingDays,
          status: inc.status,
          lastActivity: inc.lastActivity,
          performance: { mcet: 0, tma: 0, vlshare: 0 },
          assignments: 0,
          completedTrainings: 0,
          onboardingProgress: 0,
          ausfaelle: { krankenstand: 0, notfaelle: 0 },
          avatar: inc.avatar || '/placeholder.svg',
      bankDetails: {
            accountHolder: inc.bankDetails?.accountHolder ?? '',
            bankName: inc.bankDetails?.bankName ?? '',
            iban: inc.bankDetails?.iban ?? '',
            bic: inc.bankDetails?.bic ?? ''
      },
      clothingInfo: {
            height: inc.clothingInfo?.height ?? '',
            size: inc.clothingInfo?.size ?? ''
          },
          applicationId: inc.applicationId ?? null,
        }));
        // Fetch onboarding status per promotor and compute progress
        const withProgress = await Promise.all(cards.map(async (card: any) => {
          try {
            const r = await fetch(`/api/promotors/${card.id}/onboarding`, { cache: 'no-store' });
            const j = await r.json();
            const steps = Array.isArray(j.steps) ? j.steps : [];
            if (!steps.length) return card;
            const done = steps.filter((s: any) => s.status === 'done').length;
            const progress = Math.round((done / steps.length) * 100);
            return { ...card, onboardingProgress: progress };
          } catch { return card; }
        }));
        setPromotors(withProgress);
      } else {
        setPromotorsError(true);
        setPromotors([]);
      }
    } catch {
      setPromotorsError(true);
      setPromotors([]);
    } finally {
      setPromotorsLoading(false);
    }
  };

  // Link promotor -> stammdaten when both lists are available
  useEffect(() => {
    try {
      const map: Record<string | number, any> = {};
      promotors.forEach((p: any) => {
        if (p?.applicationId) {
          const s = submittedOnboardingData.find((x: any) => String(x.id) === String(p.applicationId));
          if (s) map[p.id] = s;
        } else {
          // Fallback matching by email or name when no explicit link exists
          const byEmail = p.email ? submittedOnboardingData.find((x: any) => String(x.email || '').toLowerCase() === String(p.email || '').toLowerCase()) : null;
          if (byEmail) {
            map[p.id] = byEmail;
          } else {
            const pName = String(p.name || '').trim().toLowerCase();
            const byName = submittedOnboardingData.find((x: any) => `${String(x.firstName||'').trim()} ${String(x.lastName||'').trim()}`.toLowerCase() === pName);
            if (byName) map[p.id] = byName;
          }
        }
      });
      if (Object.keys(map).length) setPromotorStammdaten((prev) => ({ ...prev, ...map }));
      // Also enrich promotor cards with contact/address fields from matched stammdaten
      let needsUpdate = false;
      const updated = promotors.map((p: any) => {
        const s = map[p.id];
        if (!s) return p;
        const mergedAddress = [s.address, s.postalCode, s.city].filter(Boolean).join(', ');
        const next = {
          ...p,
          email: p.email || s.email || '',
          phone: p.phone || s.phone || '',
          address: p.address || mergedAddress,
          birthDate: p.birthDate || s.birthDate || '',
          region: p.region || s.preferredRegion || p.region,
          workingDays: (p.workingDays && p.workingDays.length) ? p.workingDays : (s.workingDays || []),
          clothingInfo: {
            height: p.clothingInfo?.height ?? s?.height ?? '',
            size: p.clothingInfo?.size ?? s?.clothingSize ?? ''
          },
        };
        if (
          next.email !== p.email ||
          next.phone !== p.phone ||
          next.address !== p.address ||
          next.birthDate !== p.birthDate ||
          next.region !== p.region ||
          (Array.isArray(next.workingDays) && Array.isArray(p.workingDays) && next.workingDays.join(',') !== p.workingDays.join(',')) ||
          next.clothingInfo?.height !== p.clothingInfo?.height ||
          next.clothingInfo?.size !== p.clothingInfo?.size
        ) {
          needsUpdate = true;
        }
        return next;
      });
      if (needsUpdate) setPromotors(updated);
    } catch {}
  }, [promotors, submittedOnboardingData]);

  // Region mapping for display
  const regionNames = {
    "wien-noe-bgl": "Wien/NÖ/Bgl",
    "steiermark": "Steiermark",
    "salzburg": "Salzburg",
    "oberoesterreich": "Oberösterreich",
    "tirol": "Tirol",
    "vorarlberg": "Vorarlberg",
    "kaernten": "Kärnten"
  };

  // Region colors for badges - matching admin dashboard popup styling
  const getRegionGradient = (region: string) => {
    // Match add-promotor window pastel colors (dashboard helper)
    switch (region) {
      case "wien-noe-bgl": return "bg-[#E8F0FE]"; // pastel blue
      case "steiermark": return "bg-[#E7F5ED]"; // pastel green
      case "salzburg": return "bg-[#F0E9FF]"; // pastel indigo
      case "oberoesterreich": return "bg-[#FFF3E6]"; // pastel orange
      case "tirol": return "bg-[#FDEBF3]"; // pastel pink
      case "vorarlberg": return "bg-[#EAF8FF]"; // pastel cyan
      case "kaernten": return "bg-[#EAF6FF]"; // soft sky
      default: return "bg-gray-50";
    }
  };

  const getRegionBorder = (region: string) => {
    // Matching soft borders per cluster
    switch (region) {
      case "wien-noe-bgl": return "border-[#CBD7F5]";
      case "steiermark": return "border-[#CFECDD]";
      case "salzburg": return "border-[#DDD4FF]";
      case "oberoesterreich": return "border-[#FFE3C7]";
      case "tirol": return "border-[#F8D5E5]";
      case "vorarlberg": return "border-[#CFEFFF]";
      case "kaernten": return "border-[#D6ECFF]";
      default: return "border-gray-200";
    }
  };

  const getRegionPillColors = (region: string) => {
    return `${getRegionGradient(region)} ${getRegionBorder(region)} text-gray-700`;
  };

  const getRegionHoverClass = (region: string) => {
    switch (region) {
      case "wien-noe-bgl": return "hover:bg-red-100/50";
      case "steiermark": return "hover:bg-green-100/50";
      case "salzburg": return "hover:bg-blue-100/50";
      case "oberoesterreich": return "hover:bg-yellow-100/50";
      case "tirol": return "hover:bg-purple-100/50";
      case "vorarlberg": return "hover:bg-orange-100/50";
      case "kaernten": return "hover:bg-teal-100/50";
      default: return "hover:bg-gray-50";
    }
  };

  // KPI color functions - matching statistics page rules
  const getKpiColor = (category: "mcet" | "tma" | "vlshare", value: number) => {
    if (category === "mcet") {
      if (value >= 4.5) return "text-green-600";
      if (value >= 4.0) return "text-[#FD7E14]";
      return "text-red-600";
    } else if (category === "tma") {
      if (value >= 75) return "text-green-600";
      if (value >= 65) return "text-[#FD7E14]";
      return "text-red-600";
    } else if (category === "vlshare") {
      if (value >= 10) return "text-green-600";
      if (value >= 6) return "text-[#FD7E14]";
      return "text-red-600";
    }
    return "text-gray-600";
  };

  const getKpiStyle = (colorClass: string) => {
    if (colorClass === "text-[#FD7E14]") {
      return { color: "#FD7E14" };
    }
    return {};
  };

  // Magic touch functions (copied from admin/statistiken)
  const handleMagicTouchClick = (promotorId: number) => {
    setOpenDropdown(openDropdown === promotorId ? null : promotorId);
  };

  const handleCategorySelect = (promotorId: number, category: string) => {
    setMagicTouchCategories(prev => ({ ...prev, [promotorId]: category }));
    setOpenDropdown(null);
  };

  const getMagicTouchStyle = (promotorId: number) => {
    const selectedCategory = magicTouchCategories[promotorId];
    if (!selectedCategory) return {};
    
    // If Neutral is selected, return empty object to use default styling
    if (selectedCategory === 'Neutral') return {};
    
    const category = categories.find(c => c.name === selectedCategory);
    if (!category) return {};
    
    // Convert hex to rgba with 80% opacity for background
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    return { 
      backgroundColor: hexToRgba(category.bgColor, 0.8),
      borderColor: category.borderColor,
      boxShadow: `0 1px 3px 0 ${category.borderColor}40, 0 1px 2px 0 ${category.borderColor}60`
    };
  };

  // Status indicator
  const getStatusIcon = (status: string) => {
    return status === "active" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-gray-400" />
    );
  };

  // Filter promotors
  const filteredPromotors = promotors.filter(promotor => {
    const matchesSearch = promotor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         promotor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === "all" || promotor.region === regionFilter;
    const matchesStatus = statusFilter === "all" || promotor.status === statusFilter;
    
    return matchesSearch && matchesRegion && matchesStatus;
  }).sort((a, b) => {
    // Sort by status: active promotors first, inactive last
    if (a.status === 'active' && b.status === 'inactive') return -1;
    if (a.status === 'inactive' && b.status === 'active') return 1;
    return 0;
  });

  // Filter submitted onboarding data
  const filteredSubmittedData = submittedOnboardingData.filter(submission => {
    const fullName = `${submission.firstName} ${submission.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                         submission.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === "all" || submission.preferredRegion === regionFilter;
    const notApproved = submission.status !== 'approved';
    return matchesSearch && matchesRegion && notApproved;
  });

  // Format submitted date
  const formatSubmittedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format boolean values for display
  const formatBooleanValue = (value: boolean | null) => {
    if (value === null) return "N/A";
    return value ? "Ja" : "Nein";
  };

  // Format working days for display
  const formatWorkingDays = (days: string[]) => {
    return days.join(", ");
  };

  // Format spontaneity for display
  const formatSpontaneity = (value: string) => {
    const spontaneityMap = {
      "sehr": "Sehr spontan (gleicher Tag)",
      "mittel": "Mittel (1-2 Tage Vorlauf)",
      "wenig": "Wenig (1 Woche Vorlauf)",
      "nie": "Nie"
    };
    return spontaneityMap[value as keyof typeof spontaneityMap] || value;
  };

  // Format last activity
  const formatLastActivity = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Heute";
    if (diffDays === 2) return "Gestern";
    return `vor ${diffDays - 1} Tagen`;
  };



  // Notes functions
  const toggleNotes = (promotorId: number) => {
    setNotesOpen(notesOpen === promotorId ? null : promotorId);
  };

  // Check if notes should open to the left (when card is too close to right edge)
  const shouldOpenLeft = (cardElement: HTMLElement) => {
    const rect = cardElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const spaceToRight = windowWidth - rect.right;
    return spaceToRight < 320; // 320px is the width of notes panel
  };

  const updateNotes = (promotorId: number, noteText: string) => {
    setNotes(prev => ({
      ...prev,
      [promotorId]: noteText
    }));
  };

  // Detailed view functions
  const toggleDetailedView = (promotorId: number) => {
    setDetailedViewOpen(detailedViewOpen === promotorId ? null : promotorId);
  };

  // Copy function
  const copyToClipboard = async (text: string, type: 'email' | 'phone', promotorId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      const key = `${promotorId}-${type}`;
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Document action functions
  const handleDocumentApprove = (documentName: string) => {
    setDocumentStatuses(prev => ({ ...prev, [documentName]: "approved" }));
  };

  const handleDocumentDecline = (documentName: string) => {
    setDocumentStatuses(prev => ({ ...prev, [documentName]: "pending" }));
  };

  const handleViewDocument = async (documentName: string) => {
    try {
      const type = documentName === 'Staatsbürgerschaftsnachweis' ? 'citizenship' : documentName === 'Pass' ? 'passport' : documentName === 'Arbeitserlaubnis' ? 'arbeitserlaubnis' : documentName === 'Strafregister' ? 'strafregister' : 'additional'
      const uid = String(promotors.find(p=>p.id===detailedViewOpen)?.id || detailedViewOpen || '')
      if (!uid) return
      const r = await fetch(`/api/promotors/${uid}/documents/signed-url?doc_type=${encodeURIComponent(type)}`)
      const j = await r.json()
      if (j?.url) window.open(j.url, '_blank')
    } catch {}
  };

  // Dienstvertrag handler functions
  const handleDienstvertragSelect = () => {
    setShowDienstvertragPopup(false);
    setShowDienstvertragContent(true);
  };

  // Handle Strafregister special logic
  const handleStrafregisterAction = (action: 'approve' | 'decline') => {
    if (action === 'approve') {
      // When check is pressed, promotor must submit (simulate file submission)
      setDocumentStatuses(prev => ({ ...prev, "Strafregister": "pending" }));
      setDocumentsWithFiles(prev => ({ ...prev, "Strafregister": true })); // File submitted
      setStrafregisterDeactivated(false);
    } else {
      // When X is pressed, deactivate
      setStrafregisterDeactivated(true);
    }
  };

  // IBAN masking and click functionality
  const maskIban = (iban: string) => {
    if (iban.length <= 5) return iban;
    return "x".repeat(iban.length - 5) + iban.slice(-5);
  };

  const handleIbanClick = async (promotorId: number) => {
    const promotor = promotors.find(p => p.id === promotorId);
    if (!promotor) return;

    if (ibanVisible[promotorId]) {
      // IBAN is already visible, copy it
      try {
        await navigator.clipboard.writeText(promotor.bankDetails.iban);
        
        // Show copied state
        setIbanCopied(prev => ({ ...prev, [promotorId]: true }));
        
        // Hide copied state after 2 seconds
        setTimeout(() => {
          setIbanCopied(prev => ({ ...prev, [promotorId]: false }));
        }, 2000);
      } catch (error) {
        console.error('Failed to copy IBAN:', error);
      }
    } else {
      // Show full IBAN
      setIbanVisible(prev => ({ ...prev, [promotorId]: true }));
      
      // Clear any existing timeout for this promotor
      if (ibanTimeouts[promotorId]) {
        clearTimeout(ibanTimeouts[promotorId]);
      }
      
      // Set timeout to hide IBAN after 3 seconds
      const timeout = setTimeout(() => {
        setIbanVisible(prev => ({ ...prev, [promotorId]: false }));
        setIbanTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[promotorId];
          return newTimeouts;
        });
      }, 3000);
      
      setIbanTimeouts(prev => ({ ...prev, [promotorId]: timeout }));
    }
  };

  const handleAccountHolderClick = async (promotorId: number) => {
    const promotor = promotors.find(p => p.id === promotorId);
    if (!promotor) return;

    try {
      await navigator.clipboard.writeText(promotor.bankDetails.accountHolder);
      
      // Show copied state
      setAccountHolderCopied(prev => ({ ...prev, [promotorId]: true }));
      
      // Hide copied state after 2 seconds
      setTimeout(() => {
        setAccountHolderCopied(prev => ({ ...prev, [promotorId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy account holder:', error);
    }
  };

  const handleBicClick = async (promotorId: number) => {
    const promotor = promotors.find(p => p.id === promotorId);
    if (!promotor) return;

    try {
      await navigator.clipboard.writeText(promotor.bankDetails.bic);
      
      // Show copied state
      setBicCopied(prev => ({ ...prev, [promotorId]: true }));
      
      // Hide copied state after 2 seconds
      setTimeout(() => {
        setBicCopied(prev => ({ ...prev, [promotorId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy BIC:', error);
    }
  };

  // Handle status change
  const handleStatusClick = (promotorId: number) => {
    const promotor = promotors.find(p => p.id === promotorId);
    if (promotor && promotor.status === 'active') {
      setStatusChangePromotorId(promotorId);
      setShowStatusConfirmation(true);
    }
  };

  const handleStatusChange = () => {
    if (statusChangePromotorId) {
      // In a real app, this would update the database
      setPromotors(prev => prev.map(promotor => 
        promotor.id === statusChangePromotorId 
          ? { ...promotor, status: 'inactive' }
          : promotor
      ));
      setShowStatusConfirmation(false);
      setStatusChangePromotorId(null);
    }
  };

  // Export Dienstvertrag as PDF
  const exportDienstvertragAsPDF = async () => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const element = document.getElementById('dienstvertrag-content');
    if (!element) return;

    const promotor = promotors.find(p => p.id === selectedPromotorForContract);
    const filename = promotor 
      ? `Dienstvertrag_${promotor.name.replace(/\s+/g, '_')}.pdf` 
      : 'Dienstvertrag.pdf';

    const opt = {
      margin: 15,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Use a cloned element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Apply styles to help with page breaking
    const style = document.createElement('style');
    style.textContent = `
      p, li, h1, h2, h3, h4, h5, h6, div, tr, td {
        page-break-inside: avoid !important;
      }
    `;
    clonedElement.appendChild(style);

    try {
      // Dynamically import html2pdf only when needed (client-side)
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Generate the PDF
      html2pdf().from(clonedElement).set(opt).save();
    } catch (error) {
      console.error('Error loading html2pdf:', error);
    }
  };

  // Handle outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setRegionDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      
      // Close magic touch dropdown
      if (!event.target || !(event.target as HTMLElement).closest('.magic-touch-dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup IBAN timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(ibanTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [ibanTimeouts]);

  return (
    <>
      {/* Vercel-style skeleton animation styles */}
      <style dangerouslySetInnerHTML={{ __html: skeletonStyles }} />
      
      <div className="min-h-screen bg-gray-50/30">
      {/* Approval Dialog (mounted once at root) */}
      <Dialog open={approveOpen} onOpenChange={(open) => { 
        setApproveOpen(open); 
        if (!open) { 
          setShowEmailTemplate(false); 
          setCopiedEmail(false); 
          setApproveError(null); 
          setApproveResultPw(null); 
        } 
      }}>
        <DialogContent>
          {!showEmailTemplate ? (
            <>
              <DialogHeader>
                <DialogTitle>Promotor anlegen</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <Input value={approveForm.display_name} onChange={(e) => setApproveForm(f => ({...f, display_name: e.target.value}))} className="bg-white focus-visible:ring-0 focus-visible:ring-offset-0 outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">E-Mail</label>
                  <Input value={approveForm.email} onChange={(e) => setApproveForm(f => ({...f, email: e.target.value}))} className="bg-white focus-visible:ring-0 focus-visible:ring-offset-0 outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Passwort</label>
                  <Input value={approveForm.password} onChange={(e) => setApproveForm(f => ({...f, password: e.target.value}))} className="bg-white focus-visible:ring-0 focus-visible:ring-offset-0 outline-none" />
                  <div className="mt-1 text-xs text-gray-500">Dieses Passwort wird für den neuen Account verwendet.</div>
                </div>
                {approveError && <p className="text-sm text-red-600">{approveError}</p>}
                {approveResultPw && <p className="text-sm text-green-600">Erstellt. Initiales Passwort: <strong>{approveResultPw}</strong></p>}
              </div>
              <DialogFooter>
                <Button variant="outline" className="focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" onClick={() => setApproveOpen(false)}>Schließen</Button>
                <Button className="text-white focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}} onClick={() => approveSubmission({ id: approveForm.applicationId })} disabled={submitting}>
                  {submitting ? 'Erstelle...' : 'Erstellen'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="relative min-h-[400px] bg-white rounded-lg cursor-pointer" onClick={copyEmailToClipboard}>
              <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">E-Mail Template</h2>
                <div className="bg-gray-50 p-6 rounded-lg text-left space-y-4 text-sm text-gray-700 leading-relaxed">
                  <p>Hallo {approveForm.display_name},</p>
                  <p>Willkommen in der Zukunft der Nespresso Promotions!</p>
                  <div className="bg-white p-4 rounded border">
                    <p className="font-medium">Deine Login-Daten sind:</p>
                    <p>E-Mail: <span className="font-mono text-blue-600">{approveForm.email}</span></p>
                    <p>Passwort: <span className="font-mono text-blue-600">{approveResultPw}</span></p>
                  </div>
                  <p>Wir freuen uns, dich im Team zu haben!</p>
                  <p>Beste Grüße,<br />Dein Nespresso Team</p>
                </div>
                <p className="mt-4 text-xs text-gray-500">Klicken um E-Mail-Text zu kopieren</p>
              </div>
              
              {/* Copy confirmation icon */}
              {copiedEmail && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-green-600">Kopiert!</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Admin Navigation */}
      <AdminNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="flex items-center justify-between">
              <div>
              <h1 className="text-2xl font-semibold text-gray-900">{showStammdatenblatt ? 'Stammdatenblatt' : 'Promotoren'}</h1>
              <p className="text-gray-500 text-sm">{showStammdatenblatt ? 'Stammdaten-Verwaltung' : 'Team Management'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowStammdatenblatt(false)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                  !showStammdatenblatt 
                    ? 'bg-gray-100 text-gray-900 border-gray-300 scale-[1.02] shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>Promotoren</span>
              </button>
              <button 
                onClick={() => setShowStammdatenblatt(true)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                  showStammdatenblatt 
                    ? 'bg-gray-100 text-gray-900 border-gray-300 scale-[1.02] shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>Stammdatenblatt</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {showStammdatenblatt ? (
            /* Stammdatenblatt View */
            <>
              {/* Search and Filters */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Stammdaten suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-200 focus:border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                
                <div className="flex gap-3">
                  {/* Region Filter Dropdown */}
                  <div className="relative" ref={regionDropdownRef}>
                    <button
                      onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                      className="flex items-center justify-between min-w-[140px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 transition-all duration-200"
                    >
                      <span>{regionFilter === "all" ? "Alle Regionen" : regionNames[regionFilter as keyof typeof regionNames]}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-200 ${regionDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {regionDropdownOpen && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setRegionFilter("all");
                              setRegionDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              regionFilter === "all" 
                                ? "bg-gray-50 text-gray-900" 
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            Alle Regionen
                          </button>
                          {Object.entries(regionNames).map(([key, name]) => (
                            <button
                              key={key}
                              onClick={() => {
                                setRegionFilter(key);
                                setRegionDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                regionFilter === key 
                                  ? "bg-gray-50 text-gray-900" 
                                  : `text-gray-600 ${getRegionHoverClass(key)}`
                              }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
              </div>
            )}
          </div>

                  {/* Status Filter Dropdown */}
                  <div className="relative" ref={statusDropdownRef}>
              <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="flex items-center justify-between min-w-[120px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 transition-all duration-200"
                    >
                      <span>{statusFilter === "all" ? "Alle Status" : statusFilter === "active" ? "Aktiv" : "Inaktiv"}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {statusDropdownOpen && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                        <div className="py-1">
                          <button
                onClick={() => {
                              setStatusFilter("all");
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              statusFilter === "all" 
                                ? "bg-gray-50 text-gray-900" 
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            Alle Status
              </button>
                          <button
                            onClick={() => {
                              setStatusFilter("active");
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              statusFilter === "active" 
                                ? "bg-gray-50 text-gray-900" 
                                : "text-gray-600 hover:bg-green-100/50"
                            }`}
                          >
                            Aktiv
                          </button>
                          <button
                            onClick={() => {
                              setStatusFilter("inactive");
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              statusFilter === "inactive" 
                                ? "bg-gray-50 text-gray-900" 
                                : "text-gray-600 hover:bg-red-100/50"
                            }`}
                          >
                            Inaktiv
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stammdatenblatt Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubmittedData.map((submission) => (
                  <Card 
                    key={submission.id} 
                    className="group hover:shadow-xl hover:shadow-gray-900/5 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden"
                  >
                    {/* Subtle gradient border effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200/20 via-transparent to-gray-200/20 rounded-lg"></div>
                    <div className="absolute inset-[1px] bg-white rounded-lg"></div>
                    
                    <CardContent className="relative p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 truncate">
                            {submission.firstName} {submission.lastName}
                            {submission.title && ` (${submission.title})`}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatSubmittedDate(submission.submittedAt)}
                          </p>
                        </div>
                        <Badge className={`${getRegionPillColors(submission.preferredRegion)} border text-xs px-2.5 py-1 pointer-events-none`}>
                          {regionNames[submission.preferredRegion as keyof typeof regionNames]}
                        </Badge>
                      </div>

                      {/* Contact Information with Icons */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => copyToClipboard(submission.phone, 'phone', submission.id)}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            copiedItems[`${submission.id}-phone`] ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {copiedItems[`${submission.id}-phone`] ? (
                              <Check className="h-2.5 w-2.5 text-green-600" />
                            ) : (
                              <Phone className="h-2.5 w-2.5 text-gray-500" />
                            )}
                          </div>
                          <span className="text-xs text-gray-600 truncate group-hover:text-gray-800 transition-colors">{submission.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => copyToClipboard(submission.email, 'email', submission.id)}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            copiedItems[`${submission.id}-email`] ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {copiedItems[`${submission.id}-email`] ? (
                              <Check className="h-2.5 w-2.5 text-green-600" />
                            ) : (
                              <Mail className="h-2.5 w-2.5 text-gray-500" />
                            )}
                          </div>
                          <span className="text-xs text-gray-600 truncate group-hover:text-gray-800 transition-colors">{submission.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(`${submission.address}, ${submission.postalCode} ${submission.city}`)}`,'_blank')}>
                          <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-2.5 w-2.5 text-gray-500" />
                          </div>
                          <span className="text-xs text-gray-600 truncate group-hover:text-gray-600 transition-colors">{submission.address}, {submission.postalCode} {submission.city}</span>
                        </div>
                      </div>

                      {/* Personal Info Grid */}
                      <div className="bg-slate-50/30 border border-slate-200/40 rounded-lg p-3 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>
                        <div className="relative grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">Geschlecht</span>
                            <p className="font-medium capitalize text-gray-900">{submission.gender}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Geboren</span>
                            <p className="font-medium text-gray-900">{submission.birthDate}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Körpergröße</span>
                            <p className="font-medium text-gray-900">{submission.height} cm</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Kleidergröße</span>
                            <p className="font-medium text-gray-900">{submission.clothingSize}</p>
                          </div>
                        </div>
                      </div>

                      {/* Working Days - Reusing Promotor Style */}
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Arbeitstage</p>
                        <div className="flex space-x-1.5">
                          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                            <div
                              key={day}
                              className={`relative w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-all duration-200 ${
                                submission.workingDays.includes(day)
                                  ? 'bg-slate-100 text-slate-700 shadow-sm border border-slate-200/60'
                                  : 'bg-gray-50/50 text-gray-400 border border-transparent'
                              }`}
                            >
                              {submission.workingDays.includes(day) && (
                                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent"></div>
                              )}
                              <span className="relative z-10">{day[0]}</span>
                            </div>
                          ))}
        </div>
      </div>

                      {/* Mobility Status */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <span className="text-xs text-gray-500 block mb-1">Führerschein</span>
                          <div 
                            className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center text-xs font-bold text-white ${!submission.drivingLicense ? 'bg-gray-400' : ''}`}
                            style={submission.drivingLicense ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {}}
                          >
                            {submission.drivingLicense ? '✓' : '✗'}
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-gray-500 block mb-1">Auto</span>
                          <div 
                            className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center text-xs font-bold text-white ${!submission.carAvailable ? 'bg-gray-400' : ''}`}
                            style={submission.carAvailable ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {}}
                          >
                            {submission.carAvailable ? '✓' : '✗'}
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-gray-500 block mb-1">Fahrbereit</span>
                          <div 
                            className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center text-xs font-bold text-white ${!submission.willingToDrive ? 'bg-gray-400' : ''}`}
                            style={submission.willingToDrive ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {}}
                          >
                            {submission.willingToDrive ? '✓' : '✗'}
                          </div>
                        </div>
                      </div>

                      {/* Education & Experience */}
                      <div className="space-y-2 text-xs">
            <div>
                          <span className="text-gray-500">Ausbildung:</span>
                          <p className="font-medium text-gray-900">{submission.education}</p>
            </div>
                        {submission.qualifications && (
                          <div>
                            <span className="text-gray-500">Qualifikationen:</span>
                            <p className="font-medium text-gray-900">{submission.qualifications}</p>
          </div>
                        )}
                        {submission.currentJob && (
                          <div>
                            <span className="text-gray-500">Aktueller Job:</span>
                            <p className="font-medium text-gray-900">{submission.currentJob}</p>
                          </div>
                        )}
                      </div>

                      {/* Work Preferences - Pill Style */}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full font-medium">
                          {submission.hoursPerWeek}h/Woche
                        </span>
                        <span className={`px-2.5 py-1 rounded-full font-medium ${
                          submission.spontaneity === "oft" ? "text-green-700 bg-green-50" :
                          submission.spontaneity === "selten" ? "text-orange-700 bg-orange-50" :
                          submission.spontaneity === "nie" ? "text-red-700 bg-red-50" :
                          "text-gray-600 bg-gray-50"
                        }`}>
                          {submission.spontaneity === "oft" ? "Oft spontan" : 
                           submission.spontaneity === "selten" ? "Selten spontan" :
                           submission.spontaneity === "nie" ? "Nie spontan" : "Unbekannt"}
                        </span>
                      </div>

                      {/* Citizenship & Work Permit */}
              {/* Approval dialog is mounted at root to preserve input focus state */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Staatsbürgerschaft:</span>
                          <p className="font-medium text-gray-900">{submission.citizenship}</p>
                        </div>
                        {submission.workPermit !== null && (
                          <div>
                            <span className="text-gray-500">Arbeitserlaubnis:</span>
                            <p className={`font-medium ${submission.workPermit ? 'text-green-600' : 'text-red-600'}`}>
                              {formatBooleanValue(submission.workPermit)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          size="sm"
                          className="flex-1 text-white text-xs"
                          style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}
                          onClick={() => { setApproveOpen(true); setApproveForm({ email: submission.email || '', display_name: `${submission.firstName} ${submission.lastName}`.trim(), password: generateRandomPassword(12), applicationId: String(submission.id ?? '') }); setApproveResultPw(null); setApproveError(null); }}
                        >
                          Annehmen
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:text-red-700 text-xs">
                          Ablehnen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State for Stammdatenblatt */}
              {filteredSubmittedData.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Keine Stammdaten gefunden
                  </h3>
                  <p className="text-gray-500">
                    Es wurden noch keine Bewerbungen eingereicht oder sie entsprechen nicht den Filterkriterien.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Promotoren View */
            <>
          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Promotor suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            
            <div className="flex gap-3">
              {/* Region Filter Dropdown */}
              <div className="relative" ref={regionDropdownRef}>
                <button
                  onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                  className="flex items-center justify-between min-w-[140px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 transition-all duration-200"
                >
                  <span>{regionFilter === "all" ? "Alle Regionen" : regionNames[regionFilter as keyof typeof regionNames]}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-200 ${regionDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {regionDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setRegionFilter("all");
                          setRegionDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          regionFilter === "all" 
                            ? "bg-gray-50 text-gray-900" 
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Alle Regionen
                      </button>
                      {Object.entries(regionNames).map(([key, name]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setRegionFilter(key);
                            setRegionDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            regionFilter === key 
                              ? "bg-gray-50 text-gray-900" 
                              : `text-gray-600 ${getRegionHoverClass(key)}`
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Status Filter Dropdown */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="flex items-center justify-between min-w-[120px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 transition-all duration-200"
                >
                  <span>{statusFilter === "all" ? "Alle Status" : statusFilter === "active" ? "Aktiv" : "Inaktiv"}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {statusDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setStatusFilter("all");
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "all" 
                            ? "bg-gray-50 text-gray-900" 
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Alle Status
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter("active");
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "active" 
                            ? "bg-gray-50 text-gray-900" 
                            : "text-gray-600 hover:bg-green-100/50"
                        }`}
                      >
                        Aktiv
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter("inactive");
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "inactive" 
                            ? "bg-gray-50 text-gray-900" 
                            : "text-gray-600 hover:bg-red-100/50"
                        }`}
                      >
                        Inaktiv
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Promotor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotorsLoading ? (
              // Simple Loading Skeletons - plain grey cards matching real card dimensions
              [...Array(6)].map((_, index) => (
                <div key={`skeleton-${index}`} className="relative">
                  <Card className="h-[28rem] border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden animate-skeleton-fade">
                  </Card>
                </div>
              ))
            ) : !promotorsLoading && filteredPromotors.length === 0 ? (
              // Empty/Error State - only show after loading is complete
              <div className="col-span-full text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {promotorsError ? 'Fehler beim Laden der Promotoren' : 'Keine Promotoren gefunden'}
                </h3>
                <p className="text-gray-500">
                  {promotorsError ? 'Versuchen Sie es später erneut.' : 'Versuchen Sie andere Suchkriterien oder Filter.'}
                </p>
              </div>
            ) : (
              // Real Promotor Cards
              filteredPromotors.map((promotor) => (
              <div key={promotor.id} className="relative">
                <Card 
                  className="group shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden cursor-pointer"
                  style={getMagicTouchStyle(promotor.id)}
                  onClick={() => toggleDetailedView(promotor.id)}
                >
                  {/* Subtle gradient border effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200/20 via-transparent to-gray-200/20 rounded-lg"></div>
                  <div className="absolute inset-[1px] bg-white rounded-lg"></div>
                
                <CardContent className="relative p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-11 w-11 ring-2 ring-gray-100 ring-offset-2">
                          <AvatarImage src={promotor.avatar} alt={promotor.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 font-medium text-sm">
                            {promotor.name.split(' ').map((n: string) => (n && typeof n === 'string' ? n[0] : '')).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {/* Status indicator dot */}
                        <div className="absolute -bottom-0.5 -right-0.5">
                          {promotor.status === 'active' ? (
                            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                          ) : (
                            <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-base truncate">{promotor.name}</h3>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{promotor.status}</p>
                      </div>
                    </div>

                  </div>

                  {/* Region Badge */}
                  <div>
                    <Badge className={`${getRegionPillColors(promotor.region)} border text-xs px-2.5 py-1 pointer-events-none`}>
                      {regionNames[promotor.region as keyof typeof regionNames]}
                    </Badge>
                  </div>

                  {/* Working Days */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-3">Arbeitstage</p>
                    <div className="flex space-x-1.5">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                        <div
                          key={day}
                          className={`relative w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-all duration-200 ${
                            promotor.workingDays.includes(day)
                              ? 'bg-slate-100 text-slate-700 shadow-sm border border-slate-200/60'
                              : 'bg-gray-50/50 text-gray-400 border border-transparent'
                          }`}
                        >
                          {promotor.workingDays.includes(day) && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent"></div>
                          )}
                          <span className="relative z-10">{day[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Performance</p>
                    <div className="bg-slate-50/30 border border-slate-200/40 rounded-lg p-2.5 backdrop-blur-sm relative overflow-hidden">
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>
                      
                      <div className="relative grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <p 
                            className={`text-sm font-semibold transition-colors ${getKpiColor("mcet", promotor.performance.mcet)}`}
                            style={getKpiStyle(getKpiColor("mcet", promotor.performance.mcet))}
                          >
                            {promotor.performance.mcet.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">MC/ET</p>
                        </div>
                        <div className="text-center border-l border-r border-slate-200/40">
                          <p 
                            className={`text-sm font-semibold transition-colors ${getKpiColor("tma", promotor.performance.tma)}`}
                            style={getKpiStyle(getKpiColor("tma", promotor.performance.tma))}
                          >
                            {promotor.performance.tma}%
                          </p>
                          <p className="text-xs text-gray-500 font-medium">TMA</p>
                        </div>
                        <div className="text-center">
                          <p 
                            className={`text-sm font-semibold transition-colors ${getKpiColor("vlshare", promotor.performance.vlshare)}`}
                            style={getKpiStyle(getKpiColor("vlshare", promotor.performance.vlshare))}
                          >
                            {promotor.performance.vlshare}%
                          </p>
                          <p className="text-xs text-gray-500 font-medium">VL Share</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full text-xs font-medium">
                      {promotor.assignments} Einsätze
                    </span>
                    <span className="text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full text-xs font-medium">
                      {promotor.completedTrainings} Schulungen
                    </span>
                  </div>

                  {/* Onboarding Progress as Divider */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-600">Onboarding</p>
                      <span className="text-xs text-gray-500 font-medium">{promotor.onboardingProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100/60 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          promotor.onboardingProgress === 100 
                            ? 'bg-gradient-to-r from-green-500/60 to-green-800/60' 
                            : promotor.onboardingProgress >= 50 
                            ? 'bg-gradient-to-r from-yellow-400/60 to-orange-400/60'
                            : 'bg-gradient-to-r from-red-600/60 to-red-500/60'
                        }`}
                        style={{ width: `${promotor.onboardingProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Contact & Last Activity */}
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="text-xs text-gray-600 truncate">{promotor.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="text-xs text-gray-600">
                        Letzte Aktivität: {formatLastActivity(promotor.lastActivity)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Notes Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening detailed view
                      const cardElement = e.currentTarget.closest('.relative') as HTMLElement;
                      const openLeft = shouldOpenLeft(cardElement);
                      setNotesPosition(prev => ({ ...prev, [promotor.id]: openLeft ? 'left' : 'right' }));
                      toggleNotes(promotor.id);
                    }}
                    className="absolute bottom-4 right-4 p-2 text-gray-400/30 hover:text-gray-600 hover:bg-gray-100/60 rounded-lg transition-all duration-200"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>

              {/* Notes Panel */}
              {notesOpen === promotor.id && (
                <div className={`absolute top-1/2 -translate-y-1/2 w-80 h-80 bg-transparent z-20 ${
                  notesPosition[promotor.id] === 'left' 
                    ? 'right-full' 
                    : 'left-full'
                }`}>
                  <textarea
                    value={notes[promotor.id] || ''}
                    onChange={(e) => updateNotes(promotor.id, e.target.value)}
                    placeholder="Notizen zu diesem Promotor hinzufügen..."
                    className="w-full h-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-gray-200 text-sm bg-white shadow-xl [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  />
                </div>
              )}
            </div>
              ))
            )}
          </div>
            </>
          )}
        </main>
      </div>

      {/* Detailed Promotor View Modal */}
      {detailedViewOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 transition-opacity duration-300 z-[60]"
            onClick={() => {
              if (!showDienstvertragPopup && !showDienstvertragContent) {
                setDetailedViewOpen(null);
              }
            }}
          ></div>

          {/* Modal Content */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden relative">
              {/* Dark overlay when Dienstvertrag is open */}
              {(showDienstvertragPopup || showDienstvertragContent) && (
                <div className="absolute inset-0 bg-black/40 z-[5] rounded-2xl"></div>
              )}
              {(() => {
                const promotor = promotors.find(p => p.id === detailedViewOpen);
                if (!promotor) return null;

                return (
                  <>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 relative">
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        {/* Stammdaten Preview Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenStammdatenPreviewFor(prev => prev === promotor.id ? null : promotor.id);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Stammdatenblatt anzeigen"
                        >
                          <FileText className="h-5 w-5" />
                        </button>
                      <button
                        onClick={() => {
                          if (!showDienstvertragPopup && !showDienstvertragContent) {
                            setDetailedViewOpen(null);
                          }
                        }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      </div>
                      
                      {/* Dropdown-like Stammdaten preview */}
                      {openStammdatenPreviewFor === promotor.id && (
                        <div className="absolute top-14 right-6 z-[80] w-[380px] max-w-[90vw]">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/10 rounded-xl blur-md"></div>
                            <div className="relative rounded-xl border border-white/20 bg-white text-gray-900 shadow-2xl overflow-hidden">
                              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500">Stammdatenblatt</p>
                                  <h3 className="text-sm font-semibold truncate">{promotor.name}</h3>
                                </div>
                                <button
                                  className="p-1.5 rounded-md hover:bg-gray-50"
                                  onClick={() => setOpenStammdatenPreviewFor(null)}
                                >
                                  <X className="h-4 w-4 text-gray-500" />
                                </button>
                              </div>
                              <div className="p-4 max-h-[520px] overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {(() => {
                                  const s = promotorStammdaten[promotor.id];
                                  if (!s) {
                                    return <p className="text-sm text-gray-500">Keine Stammdaten verfügbar.</p>;
                                  }
                                  return (
                                    <div className="space-y-3 text-sm">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="text-gray-500">Name</p>
                                          <p className="font-medium">{s.firstName} {s.lastName}{s.title ? ` (${s.title})` : ''}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">E-Mail</p>
                                          <p className="font-medium truncate">{s.email || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">Telefon</p>
                                          <p className="font-medium">{s.phone || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">Geburtsdatum</p>
                                          <p className="font-medium">{s.birthDate || '-'}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Adresse</p>
                                        <p className="font-medium">{[s.address, s.postalCode, s.city].filter(Boolean).join(', ') || '-'}</p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="text-gray-500">Region</p>
                                          <p className="font-medium">{s.preferredRegion || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">Kleidergröße</p>
                                          <p className="font-medium">{s.clothingSize || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">Körpergröße</p>
                                          <p className="font-medium">{s.height ? `${s.height} cm` : '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500">Geschlecht</p>
                                          <p className="font-medium capitalize">{s.gender || '-'}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Arbeitstage</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {(s.workingDays || []).map((d: string) => (
                                            <span key={d} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">{d}</span>
                                          ))}
                                          {(!s.workingDays || s.workingDays.length === 0) && (
                                            <span className="text-gray-400">-</span>
                                          )}
                                        </div>
                                      </div>
                                      {/* Mobility */}
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center">
                                          <span className="text-xs text-gray-500 block mb-1">Führerschein</span>
                                          <div 
                                            className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center text-xs font-bold text-white ${!s.drivingLicense ? 'bg-gray-400' : ''}`}
                                            style={s.drivingLicense ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {}}
                                          >
                                            {s.drivingLicense ? '✓' : '✗'}
                                          </div>
                                        </div>
                                        <div className="text-center">
                                          <span className="text-xs text-gray-500 block mb-1">Auto</span>
                                          <div 
                                            className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center text-xs font-bold text-white ${!s.carAvailable ? 'bg-gray-400' : ''}`}
                                            style={s.carAvailable ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {}}
                                          >
                                            {s.carAvailable ? '✓' : '✗'}
                                          </div>
                                        </div>
                                        <div className="text-center">
                                          <span className="text-xs text-gray-500 block mb-1">Fahrbereit</span>
                                          <div 
                                            className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center text-xs font-bold text-white ${!s.willingToDrive ? 'bg-gray-400' : ''}`}
                                            style={s.willingToDrive ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {}}
                                          >
                                            {s.willingToDrive ? '✓' : '✗'}
                                          </div>
                                        </div>
                                      </div>
                                      {/* Education & Experience */}
                                      <div className="space-y-1 text-xs">
                                        <div>
                                          <span className="text-gray-500">Ausbildung:</span>
                                          <p className="font-medium text-gray-900">{s.education || '-'}</p>
                                        </div>
                                        {s.qualifications && (
                                          <div>
                                            <span className="text-gray-500">Qualifikationen:</span>
                                            <p className="font-medium text-gray-900">{s.qualifications}</p>
                                          </div>
                                        )}
                                        {s.currentJob && (
                                          <div>
                                            <span className="text-gray-500">Aktueller Job:</span>
                                            <p className="font-medium text-gray-900">{s.currentJob}</p>
                                          </div>
                                        )}
                                      </div>
                                      {/* Work Preferences */}
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full font-medium">
                                          {s.hoursPerWeek ? `${s.hoursPerWeek}h/Woche` : 'Stunden unbekannt'}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full font-medium ${
                                          s.spontaneity === 'oft' ? 'text-green-700 bg-green-50' :
                                          s.spontaneity === 'selten' ? 'text-orange-700 bg-orange-50' :
                                          s.spontaneity === 'nie' ? 'text-red-700 bg-red-50' :
                                          'text-gray-600 bg-gray-50'
                                        }`}>
                                          {s.spontaneity === 'oft' ? 'Oft spontan' : s.spontaneity === 'selten' ? 'Selten spontan' : s.spontaneity === 'nie' ? 'Nie spontan' : 'Spontanität unbekannt'}
                                        </span>
                                      </div>
                                      {/* Citizenship & Work Permit */}
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-gray-500">Staatsbürgerschaft:</span>
                                          <p className="font-medium text-gray-900">{s.citizenship || '-'}</p>
                                        </div>
                                        {s.workPermit !== null && (
                                          <div>
                                            <span className="text-gray-500">Arbeitserlaubnis:</span>
                                            <p className={`font-medium ${s.workPermit ? 'text-green-600' : 'text-red-600'}`}>
                                              {s.workPermit ? 'Ja' : 'Nein'}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16 ring-4 ring-white/20">
                          <AvatarImage src={promotor.avatar} alt={promotor.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-medium">
                            {promotor.name.split(' ').map((n: string) => (n as string)[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold">{promotor.name}</h2>
                          <p className="text-white/80">{promotor.email}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge className={`${getRegionPillColors(promotor.region)} border text-xs`}>
                              {regionNames[promotor.region as keyof typeof regionNames]}
                            </Badge>
                            <span 
                              className={`text-sm font-medium cursor-pointer hover:underline ${
                              promotor.status === 'active' ? 'text-green-300' : 'text-gray-400'
                              }`}
                              onClick={() => handleStatusClick(promotor.id)}
                            >
                              {promotor.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        
                        {/* Left Column - Personal & Contact */}
                        <div className="space-y-6">
                          {/* Personal Information */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="h-4 w-4 mr-2 text-blue-500" />
                                Persönliche Daten
                              </h3>
                                                             <div className="space-y-3 text-sm">
                                 <div 
                                   className="flex items-center space-x-2 cursor-pointer"
                                   onClick={() => copyToClipboard(promotor.phone, 'phone', promotor.id)}
                                 >
                                   {copiedItems[`${promotor.id}-phone`] ? (
                                     <Check className="h-4 w-4 text-green-500" />
                                   ) : (
                                     <Phone className="h-4 w-4 text-gray-400" />
                                   )}
                                   <span>{promotor.phone}</span>
                                 </div>
                                 <div 
                                   className="flex items-center space-x-2 cursor-pointer"
                                   onClick={() => copyToClipboard(promotor.email, 'email', promotor.id)}
                                 >
                                   {copiedItems[`${promotor.id}-email`] ? (
                                     <Check className="h-4 w-4 text-green-500" />
                                   ) : (
                                     <Mail className="h-4 w-4 text-gray-400" />
                                   )}
                                   <span>{promotor.email}</span>
                                 </div>
                                <div 
                                  className="flex items-center space-x-2 cursor-pointer"
                                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(promotor.address)}`, '_blank')}
                                >
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span>{promotor.address}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span>Dabei seit März 2023</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Cake className="h-4 w-4 text-gray-400" />
                                  <span>{promotor.birthDate}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Documents */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-green-500" />
                                Dokumente
                              </h3>
                              <div className="space-y-3">
                                {[
                                  "Staatsbürgerschaftsnachweis",
                                  "Pass", 
                                  "Arbeitserlaubnis",
                                  "Strafregister",
                                  "Zusätzliche Dokumente"
                                ].map((docName, index) => {
                                  const status = documentStatuses[docName];
                                  return (
                                    <div key={index} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600 dark:text-gray-300">{docName}</span>
                                      <div className="flex items-center space-x-2">
                                                                                {status === "pending" ? (
                                          <div className="flex items-center space-x-1">
                                            {documentsWithFiles[docName] && (
                                              <button
                                                onClick={() => handleViewDocument(docName)}
                                                className="p-0 hover:bg-transparent transition-all duration-300 opacity-40 hover:opacity-80"
                                              >
                                                <Eye className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                                              </button>
                                            )}
                                            <button
                                              onClick={async () => {
                                                // Admin approve
                                                const type = docName === 'Staatsbürgerschaftsnachweis' ? 'citizenship' : docName === 'Pass' ? 'passport' : docName === 'Arbeitserlaubnis' ? 'arbeitserlaubnis' : docName === 'Strafregister' ? 'strafregister' : docName === 'Zusätzliche Dokumente' ? 'additional' : 'additional'
                                                const uid = String(promotors.find(p=>p.id===detailedViewOpen)?.id || detailedViewOpen || '')
                                                if (!uid) return
                                                await fetch('/api/admin/documents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid, doc_type: type, status: 'approved' })})
                                                await loadPromotorDocuments(uid)
                                              }}
                                              className="p-0 hover:bg-transparent transition-all duration-300 opacity-60 hover:opacity-100"
                                            >
                                              <Check className="h-4 w-4 text-green-500 hover:text-green-600" />
                                            </button>
                                            <button
                                              onClick={async () => {
                                                const type = docName === 'Staatsbürgerschaftsnachweis' ? 'citizenship' : docName === 'Pass' ? 'passport' : docName === 'Arbeitserlaubnis' ? 'arbeitserlaubnis' : docName === 'Strafregister' ? 'strafregister' : docName === 'Zusätzliche Dokumente' ? 'additional' : 'additional'
                                                const uid = String(promotors.find(p=>p.id===detailedViewOpen)?.id || detailedViewOpen || '')
                                                if (!uid) return
                                                await fetch('/api/admin/documents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid, doc_type: type, status: 'rejected' })})
                                                await loadPromotorDocuments(uid)
                                              }}
                                              className="p-0 hover:bg-transparent transition-all duration-300 opacity-60 hover:opacity-100"
                                            >
                                              <X className="h-4 w-4 text-red-500 hover:text-red-600" />
                                            </button>
                                            <Loader2 className="h-4 w-4 text-orange-400 animate-spin ml-1" />
                                          </div>
                                        ) : status === "approved" ? (
                                          <div className="flex items-center space-x-1">
                                            {documentsWithFiles[docName] && (
                                              <button
                                                onClick={() => handleViewDocument(docName)}
                                                className="p-0 hover:bg-transparent transition-all duration-300 opacity-40 hover:opacity-80"
                                              >
                                                <Eye className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                                              </button>
                                            )}
                                            <Check className="h-4 w-4 text-green-500" />
                                          </div>
                                        ) : docName === "Strafregister" && strafregisterDeactivated ? (
                                          <X className="h-4 w-4 text-gray-400" />
                                        ) : (
                                          <X className="h-4 w-4 text-red-500" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Working Days */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4">Arbeitstage</h3>
                              <div className="flex justify-center space-x-2">
                                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                                  <div
                                    key={day}
                                    className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center ${
                                      promotor.workingDays.includes(day)
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-gray-50 text-gray-400'
                                    }`}
                                  >
                                    {day[0]}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Dienstvertrag */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <FileSignature className="h-4 w-4 mr-2 text-blue-500" />
                                Dienstvertrag
                              </h3>
                              <div className="space-y-3">
                                {/* Current Active Contract */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-blue-700">Aktiver Vertrag</span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Aktiv</span>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-2">
                                    <div>Wochenstunden: 32h</div>
                                    <div>Laufzeit: 01.12.2024 - unbefristet</div>
                                    <div>Status: geringfügig</div>
                                  </div>
                                  <button 
                                    className="w-full p-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                                    onClick={() => {
                                      setSelectedPromotorForContract(promotor.id);
                                      setShowDienstvertragPopup(true);
                                    }}
                                  >
                                    Alle Verträge anzeigen
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Middle Column - Performance & Training */}
                        <div className="space-y-6">
                          {/* Performance Metrics */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <BarChart2 className="h-4 w-4 mr-2 text-purple-500" />
                                Performance KPIs
                              </h3>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <p 
                                    className={`text-lg font-bold ${getKpiColor("mcet", promotor.performance.mcet)}`}
                                    style={getKpiStyle(getKpiColor("mcet", promotor.performance.mcet))}
                                  >
                                    {promotor.performance.mcet.toFixed(1)}
                                  </p>
                                  <p className="text-xs text-gray-500 font-medium">MC/ET</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <p 
                                    className={`text-lg font-bold ${getKpiColor("tma", promotor.performance.tma)}`}
                                    style={getKpiStyle(getKpiColor("tma", promotor.performance.tma))}
                                  >
                                    {promotor.performance.tma}%
                                  </p>
                                  <p className="text-xs text-gray-500 font-medium">TMA</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <p 
                                    className={`text-lg font-bold ${getKpiColor("vlshare", promotor.performance.vlshare)}`}
                                    style={getKpiStyle(getKpiColor("vlshare", promotor.performance.vlshare))}
                                  >
                                    {promotor.performance.vlshare}%
                                  </p>
                                  <p className="text-xs text-gray-500 font-medium">VL Share</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Training Progress */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <GraduationCap className="h-4 w-4 mr-2 text-indigo-500" />
                                Schulungen & Training
                              </h3>
                              <div className="space-y-2 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {[
                                  { 
                                    name: "Grundlagen des Verkaufs", 
                                    status: "erledigt",
                                    components: {
                                      video: { required: true, completed: true },
                                      pdf: { required: true, completed: true },
                                      quiz: { required: true, completed: true }
                                    }
                                  },
                                  { 
                                    name: "Produktpräsentation", 
                                    status: "unterbrochen",
                                    components: {
                                      video: { required: true, completed: true },
                                      pdf: { required: true, completed: false },
                                      quiz: { required: true, completed: false }
                                    }
                                  },
                                  { 
                                    name: "Kundeneinwände behandeln", 
                                    status: "nicht erledigt",
                                    components: {
                                      video: { required: false, completed: false },
                                      pdf: { required: true, completed: false },
                                      quiz: { required: true, completed: false }
                                    }
                                  },
                                  { 
                                    name: "Teamarbeit & Kommunikation", 
                                    status: "erledigt",
                                    components: {
                                      video: { required: true, completed: true },
                                      pdf: { required: false, completed: false },
                                      quiz: { required: true, completed: true }
                                    }
                                  },
                                  { 
                                    name: "Digitale Tools & Apps", 
                                    status: "nicht erledigt",
                                    components: {
                                      video: { required: true, completed: false },
                                      pdf: { required: true, completed: false },
                                      quiz: { required: true, completed: false }
                                    }
                                  }
                                ].map((training, index) => {
                                  // Component indicators
                                  const indicators = [];
                                  if (training.components.video.required) {
                                    indicators.push({ icon: Video, completed: training.components.video.completed, key: 'video' });
                                  }
                                  if (training.components.pdf.required) {
                                    indicators.push({ icon: FileText, completed: training.components.pdf.completed, key: 'pdf' });
                                  }
                                  if (training.components.quiz.required) {
                                    indicators.push({ icon: HelpCircle, completed: training.components.quiz.completed, key: 'quiz' });
                                  }

                                  // Status icon
                                  const getStatusIcon = (status: string) => {
                                    switch (status) {
                                      case "erledigt":
                                        return <Check className="h-4 w-4 text-green-500" />
                                      case "unterbrochen":
                                        return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                                      case "nicht erledigt":
                                        return <X className="h-4 w-4 text-red-500" />
                                      default:
                                        return <X className="h-4 w-4 text-red-500" />
                                    }
                                  };

                                  return (
                                    <div key={index} className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium text-gray-700">{training.name}</span>
                                          <div className="scale-75">
                                            {getStatusIcon(training.status)}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          {indicators.map((indicator) => {
                                            const IconComponent = indicator.icon;
                                            return (
                                              <div key={indicator.key} className="relative">
                                                <IconComponent 
                                                  className={`h-3 w-3 ${
                                                    indicator.completed 
                                                      ? 'text-green-500' 
                                                      : 'text-gray-300'
                                                  }`} 
                                                />
                                                {indicator.completed && (
                                                  <Check className="h-1.5 w-1.5 text-green-500 absolute -top-0.5 -right-0.5 bg-white rounded-full" />
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Onboarding Progress */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                Onboarding Status
                              </h3>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Fortschritt</span>
                                  <span className="text-sm font-bold text-gray-900">{promotor.onboardingProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      promotor.onboardingProgress === 100 
                        ? 'bg-gradient-to-r from-green-500 to-green-800' 
                                        : promotor.onboardingProgress >= 50 
                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                        : 'bg-gradient-to-r from-red-600 to-red-500'
                                    }`}
                                    style={{ width: `${promotor.onboardingProgress}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {promotor.onboardingProgress === 100 ? 'Onboarding abgeschlossen' : 
                                   promotor.onboardingProgress >= 75 ? 'Fast abgeschlossen' :
                                   promotor.onboardingProgress >= 50 ? 'In Bearbeitung' : 'Gerade begonnen'}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Bank Details */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                                Bankdaten
                              </h3>
                              <div className="space-y-2">
                                {/* Account Holder and Bank Name - Side by Side */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-0.5">
                                    <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                      Kontoinhaber
                                    </label>
                                    <div className="flex items-center space-x-2">
                                      <p 
                                        className="text-sm font-medium text-gray-900 cursor-pointer"
                                        onClick={() => handleAccountHolderClick(promotor.id)}
                                      >
                                        {promotor.bankDetails.accountHolder || 'Keine Daten'}
                                      </p>
                                      {accountHolderCopied[promotor.id] && (
                                        <Check className="h-3 w-3 text-green-500" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                      Bankname
                                    </label>
                                    <p className="text-sm font-medium text-gray-900">
                                      {promotor.bankDetails.bankName || 'Keine Daten'}
                                    </p>
                                  </div>
                                </div>

                                {/* IBAN */}
                                <div className="space-y-0.5">
                                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                    IBAN
                                  </label>
                                  <div className="flex items-center space-x-2">
                                    <p 
                                      className="text-sm font-mono font-medium text-gray-900 tracking-wider cursor-pointer"
                                      onClick={() => handleIbanClick(promotor.id)}
                                    >
                                      {promotor.bankDetails.iban ? (ibanVisible[promotor.id] ? promotor.bankDetails.iban : maskIban(promotor.bankDetails.iban)) : 'Keine Daten'}
                                    </p>
                                    {ibanCopied[promotor.id] && (
                                      <Check className="h-3 w-3 text-green-500" />
                                    )}
                                  </div>
                                </div>

                                {/* BIC */}
                                <div className="space-y-0.5">
                                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                    BIC
                                  </label>
                                  <div className="flex items-center space-x-2">
                                                                         <p 
                                       className="text-sm font-mono font-medium text-gray-900 tracking-wider cursor-pointer"
                                       onClick={() => handleBicClick(promotor.id)}
                                     >
                                      {promotor.bankDetails.bic || 'Keine Daten'}
                                    </p>
                                    {bicCopied[promotor.id] && (
                                      <Check className="h-3 w-3 text-green-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Right Column - Activity & Assignments */}
                        <div className="space-y-6">
                                                     {/* Recent Activity */}
                           <Card className="shadow-sm border-gray-200/60">
                             <CardContent className="p-4">
                               <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                 <Activity className="h-4 w-4 mr-2 text-orange-500" />
                                 Aktivität & Einsätze
                               </h3>
                               <div className="space-y-3 text-sm">
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Gesamte Einsätze</span>
                                   <span className="font-bold text-blue-600">{promotor.assignments}</span>
                                 </div>
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Abgeschlossene Schulungen</span>
                                   <span className="font-bold text-green-600">{promotor.completedTrainings}</span>
                                 </div>
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Krankenstand</span>
                                   <span className="font-bold text-red-600">{promotor.ausfaelle.krankenstand}</span>
                                 </div>
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Notfälle</span>
                                   <span className="font-bold text-orange-500">{promotor.ausfaelle.notfaelle}</span>
                                 </div>
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Letzte Aktivität</span>
                                   <span className="text-gray-600">{formatLastActivity(promotor.lastActivity)}</span>
                                 </div>
                               </div>
                             </CardContent>
                           </Card>

                                                     {/* Upcoming Assignments */}
                           <Card className="shadow-sm border-gray-200/60">
                             <CardContent className="p-4">
                               <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                 <Briefcase className="h-4 w-4 mr-2 text-teal-500" />
                                 Kommende Einsätze
                               </h3>
                               <div className="space-y-3 h-[260px]">
                                 {[
                                   { date: "Heute", time: "10:00-18:00", location: "MediaMarkt Seiersberg", type: "Promotion" },
                                   { date: "Morgen", time: "09:00-17:30", location: "Saturn Klagenfurt", type: "Buddy Tag" },
                                   { date: "Do, 25. Jan", time: "14:00-20:00", location: "Saturn Graz", type: "Promotion" }
                                 ].map((assignment, index) => (
                                   <div key={index} className="p-3 border border-gray-200 rounded-lg">
                                     <div className="flex items-center justify-between mb-1">
                                       <span className="text-sm font-medium text-gray-900">{assignment.date}</span>
                                       <Badge 
                                         variant="outline" 
                                         className={`text-xs border-0 text-white font-medium ${
                                           assignment.type === "Promotion" 
                                             ? "bg-gradient-to-r from-blue-500 to-blue-600" 
                                             : "bg-gradient-to-r from-purple-500 to-pink-500"
                                         }`}
                                       >
                                         {assignment.type}
                                       </Badge>
                                     </div>
                                     <p className="text-xs text-gray-600">{assignment.time}</p>
                                     <p className="text-xs text-gray-500">{assignment.location}</p>
                                   </div>
                                 ))}
                               </div>
                             </CardContent>
                           </Card>

                           {/* Clothing Size Information */}
                           <Card className="shadow-sm border-gray-200/60">
                             <CardContent className="p-4">
                               <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                 <Ruler className="h-4 w-4 mr-2 text-purple-500" />
                                 Kleidergröße
                               </h3>
                               <div className="space-y-3">
                                 <div className="grid grid-cols-2 gap-3">
                                   <div className="space-y-1 text-center">
                                     <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                       Körpergröße
                                     </label>
                                     <div className="bg-gray-50 rounded-lg py-4 px-3 flex items-center justify-center">
                                       <p className="text-lg font-bold text-gray-900">
                                         {promotor.clothingInfo.height}
                                       </p>
                                       <span className="text-xs text-gray-500 ml-1 font-medium">cm</span>
                                     </div>
                                   </div>
                                   <div className="space-y-1 text-center">
                                     <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                       Kleidergröße
                                     </label>
                                     <div className="bg-gray-50 rounded-lg py-4 px-3 flex items-center justify-center">
                                       <p className="text-lg font-bold text-gray-900">
                                         {promotor.clothingInfo.size}
                                       </p>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             </CardContent>
                           </Card>

                          
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Dienstvertrag Popup */}
      {showDienstvertragPopup && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-[75] backdrop-blur-sm"
            onClick={() => {
              setShowDienstvertragPopup(false);
              setSelectedPromotorForContract(null);
              setContractForm({
                hoursPerWeek: '',
                monthlyGross: '',
                startDate: '',
                endDate: '',
                isTemporary: false,
                employmentType: 'geringfügig'
              });
            }}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl z-[80] p-0 w-[600px] max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="text-white p-6 rounded-t-xl" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Dienstvertrag Management</h3>
                <button
                  onClick={() => {
                    setShowDienstvertragPopup(false);
                    setSelectedPromotorForContract(null);
                    setContractForm({
                      hoursPerWeek: '',
                      monthlyGross: '',
                      startDate: '',
                      endDate: '',
                      isTemporary: false,
                      employmentType: 'geringfügig'
                    });
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {/* Contract Creation Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Neuen Vertrag erstellen</h4>
                
                {/* Employee Info - Fetched from Promotor */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <h5 className="font-medium text-gray-700 mb-2">Mitarbeiter Information</h5>
                  <div className="border-b border-gray-200 mb-3"></div>
                  {(() => {
                    const promotor = promotors.find(p => p.id === selectedPromotorForContract);
                    if (!promotor) return null;
                    
                    return (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Name:</span>
                          <p className="font-medium">{promotor.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="font-medium">{promotor.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Region:</span>
                          <p className="font-medium">{regionNames[promotor.region as keyof typeof regionNames]}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <p className="font-medium">{promotor.status === 'active' ? 'Aktiv' : 'Inaktiv'}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Contract Details Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wochenstunden
                      </label>
                      <input
                        type="number"
                        placeholder="z.B. 32"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={contractForm.hoursPerWeek}
                        onChange={(e) => setContractForm({...contractForm, hoursPerWeek: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monatsgehalt (Brutto)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                        <input
                          type="number"
                          placeholder="2000"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={contractForm.monthlyGross}
                          onChange={(e) => setContractForm({...contractForm, monthlyGross: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Anstellungsart
                      </label>
                      <Select value={contractForm.employmentType} onValueChange={(v) => setContractForm({ ...contractForm, employmentType: v as any })}>
                        <SelectTrigger className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0">
                          <SelectValue placeholder="Anstellungsart wählen" />
                        </SelectTrigger>
                        <SelectContent className="z-[100] rounded-md border border-gray-200 bg-white shadow-xl">
                          <SelectItem value="geringfügig" className="text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50">geringfügig</SelectItem>
                          <SelectItem value="teilzeit" className="text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50">teilzeit</SelectItem>
                          <SelectItem value="vollzeit" className="text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50">vollzeit</SelectItem>
                          <SelectItem value="freelancer" className="text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50">freelancer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vertragsbeginn
                    </label>
                    <DatePicker
                      value={contractForm.startDate}
                      onChange={(value) => setContractForm({...contractForm, startDate: value})}
                      placeholder="tt.mm.jjjj"
                      className="w-full"
                    />
                  </div>

                  {/* Befristung Option */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-0"
                        checked={contractForm.isTemporary}
                        onChange={(e) => setContractForm({...contractForm, isTemporary: e.target.checked})}
                      />
                      <span className="text-sm font-medium text-gray-700">Befristeter Vertrag</span>
                    </label>
                    
                    {contractForm.isTemporary && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vertragsende
                        </label>
                        <DatePicker
                          value={contractForm.endDate}
                          onChange={(value) => setContractForm({...contractForm, endDate: value})}
                          placeholder="tt.mm.jjjj"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={async () => {
                    const promotorId = selectedPromotorForContract ? String(selectedPromotorForContract) : null;
                    if (!promotorId) return;
                    try {
                      const res = await fetch('/api/admin/contracts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          user_id: promotorId,
                          hours_per_week: contractForm.hoursPerWeek,
                          monthly_gross: contractForm.monthlyGross,
                          start_date: contractForm.startDate,
                          end_date: contractForm.endDate || null,
                          is_temporary: contractForm.isTemporary,
                          employment_type: contractForm.employmentType,
                          is_active: false,
                        })
                      });
                      const j = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(j?.error || 'Fehler beim Erstellen des Vertrags');
                      await refreshPromotorContracts(promotorId);
                      setToastMsg('Vertrag erfolgreich erstellt und versendet!');
                    } catch (e: any) {
                      console.error(e);
                      setToastMsg(e.message || 'Fehler beim Erstellen des Vertrags');
                    }
                    // Keep modal open so admin sees the new pending row
                  }}
                  disabled={!contractForm.hoursPerWeek || !contractForm.monthlyGross || !contractForm.startDate}
                  className={`w-full py-3 rounded-lg font-medium transition-all duration-200 text-white ${
                    contractForm.hoursPerWeek && contractForm.monthlyGross && contractForm.startDate
                      ? ''
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={contractForm.hoursPerWeek && contractForm.monthlyGross && contractForm.startDate
                    ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'}
                    : {background: '#9CA3AF'}
                  }
                >
                  Vertrag erstellen & senden
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Vertragshistorie</h4>

                {/* Contracts List */}
                <div className="space-y-3">
                  {/* No contracts state */}
                  {(() => {
                    const contracts = Array.isArray(promotorContracts) ? promotorContracts : [];
                    if (contracts.length === 0) {
                      return (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                          <span className="text-sm text-gray-600">Kein Dienstvertrag verfügbar</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Pending Contract (dynamic) */}
                  {(() => {
                    const contracts = Array.isArray(promotorContracts) ? promotorContracts : [];
                    const activeContract = contracts.find((c: any) => c.is_active);
                    const nonActive = contracts.filter((c: any) => !c.is_active);
                    const sortedNonActive = [...nonActive].sort(
                      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );

                    let newestPending: any | null = null;
                    if (activeContract?.created_at) {
                      // Only treat as pending if it is newer than the current active contract
                      newestPending = sortedNonActive.find(
                        (c: any) => new Date(c.created_at).getTime() > new Date(activeContract.created_at).getTime()
                      ) || null;
                    } else {
                      newestPending = sortedNonActive[0] || null;
                    }
                    if (!newestPending) return null;

                    const contract = newestPending;
                    return (
                      <div key={contract.id} className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-orange-700">Ausstehender Vertrag</span>
                  <div className="flex items-center space-x-2">
                            {contract.file_path ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                        <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                            )}
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                              {contract.file_path ? 'Unterschrieben' : 'Warte auf Unterschrift'}
                            </span>
                  </div>
                </div>
                        <div className="text-xs text-gray-600 mb-3">
                          <div>Wochenstunden: {contract.hours_per_week || 'N/A'}</div>
                          <div>Monatsgehalt: {contract.monthly_gross ? `€ ${contract.monthly_gross},-- brutto` : 'N/A'}</div>
                          <div>Laufzeit: {contract.start_date ? new Date(contract.start_date).toLocaleDateString('de-DE') : 'N/A'} - {contract.end_date ? new Date(contract.end_date).toLocaleDateString('de-DE') : 'unbefristet'}</div>
                          <div>Anstellungsart: {contract.employment_type || 'N/A'}</div>
                </div>
                    <div className="flex space-x-2">
                          {contract.file_path ? (
                            <>
                <button 
                                className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/admin/contracts', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: contract.id, is_active: true }),
                                    });
                                    if (!res.ok) throw new Error('Fehler beim Annehmen des Vertrags');
                                    await refreshPromotorContracts(String(selectedPromotorForContract));
                                    setToastMsg('Vertrag erfolgreich angenommen!');
                                  } catch (e: any) {
                                    setToastMsg(e.message || 'Fehler beim Annehmen des Vertrags');
                                    console.error(e);
                                  }
                                }}
                              >
                                Vertrag annehmen
                      </button>
                      <button 
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 border border-gray-300"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/admin/promotors/${selectedPromotorForContract}/contracts/signed-url?contract_id=${contract.id}`, {
                                      cache: 'no-store'
                                    });
                                    const j = await res.json();
                                    if (j?.url) window.open(j.url, '_blank');
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                title="Unterschriebenen Vertrag ansehen"
                              >
                                <Eye className="h-4 w-4" />
                </button>
                            </>
                          ) : (
                            <button 
                              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300"
                              onClick={handleDienstvertragSelect}
                            >
                              Details anzeigen
                            </button>
                          )}
                    </div>
              </div>
                    );
                  })()}

              {/* Current Active Contract */}
                  {(() => {
                    const contracts = Array.isArray(promotorContracts) ? promotorContracts : [];
                    const activeContract = contracts.find(c => c.is_active);
                    if (!activeContract) return null;
                    
                    return (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-green-700">Aktiver Vertrag</span>
                      <div className="flex items-center space-x-2">
                            {activeContract.file_path && (
                        <button 
                                className="p-1 hover:bg-green-100/50 rounded transition-colors"
                          title="Unterschriebenen Vertrag ansehen"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/admin/promotors/${selectedPromotorForContract}/contracts/signed-url?contract_id=${activeContract.id}`, {
                                      cache: 'no-store'
                                    });
                                    const j = await res.json();
                                    if (j?.url) window.open(j.url, '_blank');
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                        >
                          <Eye className="h-3 w-3 text-green-600" />
                        </button>
                            )}
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktiv</span>
                </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                          <div>Wochenstunden: {activeContract.hours_per_week || 'N/A'}</div>
                          <div>Monatsgehalt: {activeContract.monthly_gross ? `€ ${activeContract.monthly_gross},-- brutto` : 'N/A'}</div>
                          <div>Laufzeit: {activeContract.start_date ? new Date(activeContract.start_date).toLocaleDateString('de-DE') : 'N/A'} - {activeContract.end_date ? new Date(activeContract.end_date).toLocaleDateString('de-DE') : 'unbefristet'}</div>
                          <div>Anstellungsart: {activeContract.employment_type || 'N/A'}</div>
                </div>
                <button 
                      className="w-full py-2 text-white text-sm font-medium rounded-lg transition-all duration-200"
                      style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                  onClick={handleDienstvertragSelect}
                >
                  Vertrag ansehen
                </button>
              </div>
                    );
                  })()}

              {/* Previous Contracts */}
              {(() => {
                const contracts = Array.isArray(promotorContracts) ? promotorContracts : [];
                const activeContract = contracts.find((c: any) => c.is_active);
                const nonActiveWithFile = contracts.filter((c: any) => !c.is_active && c.file_path);

                // Determine the newest pending (awaiting acceptance) contract id
                let newestPendingId: string | null = null;
                if (activeContract?.created_at) {
                  const pending = [...nonActiveWithFile]
                    .filter((c: any) => new Date(c.created_at).getTime() > new Date(activeContract.created_at).getTime())
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  newestPendingId = pending?.id || null;
                } else {
                  // No active contract yet → the topmost non-active-with-file is the one in the pending box
                  const top = [...nonActiveWithFile].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  newestPendingId = top?.id || null;
                }

                const previousContracts = nonActiveWithFile
                  .filter((c: any) => {
                    if (newestPendingId && c.id === newestPendingId) return false; // exclude the contract currently shown as pending
                    if (activeContract?.created_at) {
                      return new Date(c.created_at).getTime() <= new Date(activeContract.created_at).getTime();
                    }
                    return true;
                  })
                  .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                if (previousContracts.length === 0) return null;

                return (
              <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Frühere Verträge</h5>
                    {previousContracts.map((contract: any, index: number) => (
                      <div key={contract.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            Vertrag v{previousContracts.length - index}.0
                          </span>
                    <div className="flex items-center space-x-2">
                            {contract.file_path && (
                      <button 
                                className="p-1 hover:bg-gray-200/50 rounded transition-colors"
                        title="Unterschriebenen Vertrag ansehen"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/admin/promotors/${selectedPromotorForContract}/contracts/signed-url?contract_id=${contract.id}`, {
                                      cache: 'no-store'
                                    });
                                    const j = await res.json();
                                    if (j?.url) window.open(j.url, '_blank');
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                      >
                        <Eye className="h-3 w-3 text-gray-600" />
                      </button>
                            )}
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Beendet</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                          <div>Wochenstunden: {contract.hours_per_week || 'N/A'} • {contract.monthly_gross ? `€ ${contract.monthly_gross},--/Monat` : 'N/A'}</div>
                          <div>Laufzeit: {contract.start_date ? new Date(contract.start_date).toLocaleDateString('de-DE') : 'N/A'} - {contract.end_date ? new Date(contract.end_date).toLocaleDateString('de-DE') : 'N/A'}</div>
                  </div>
                  <button 
                        className="w-full py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-all duration-200"
                    onClick={handleDienstvertragSelect}
                  >
                    Archiv ansehen
                  </button>
                </div>
                    ))}
                    </div>
                );
              })()}
                  </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dienstvertrag Content Popup */}
      {showDienstvertragContent && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[75] backdrop-blur-sm"
            onClick={() => setShowDienstvertragContent(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-[80] p-0 w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 text-white p-4 rounded-t-lg" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      setShowDienstvertragContent(false);
                      setShowDienstvertragPopup(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                <h3 className="text-xl font-bold">Dienstvertrag</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={exportDienstvertragAsPDF}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Als PDF exportieren"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                <button 
                  onClick={() => setShowDienstvertragContent(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-8 [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              <div className="max-w-3xl mx-auto" id="dienstvertrag-content">
                {/* Get promotor data for dynamic fields */}
                {(() => {
                  const promotor = promotors.find(p => p.id === selectedPromotorForContract);
                  const promotorName = promotor?.name || "Vorname Nachname";
                  const promotorBirthDate = promotor?.birthDate || "Tag.Monat.Jahr";
                  const promotorAddress = promotor?.address || "Adresse";
                  
                  // pick which contract to render in template: prefer newest pending if present, else active
                  const contracts = Array.isArray(promotorContracts) ? promotorContracts : [];
                  const active = contracts.find((c: any) => c.is_active);
                  const newestPending = [...contracts]
                    .filter((c: any) => !c.is_active)
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  const selected = newestPending || active || {} as any;
                  
                  return (
                    <DienstvertragTemplate
                      promotorName={promotorName}
                      promotorBirthDate={promotorBirthDate}
                      promotorAddress={promotorAddress}
                      hoursPerWeek={String(selected?.hours_per_week || '')}
                      monthlyGross={String(selected?.monthly_gross || '')}
                      startDate={selected?.start_date ? new Date(selected.start_date).toLocaleDateString('de-DE') : ''}
                      endDate={selected?.end_date ? new Date(selected.end_date).toLocaleDateString('de-DE') : ''}
                      isTemporary={!!selected?.is_temporary}
                    />
                  );
                })()}
                    </div>
                    </div>
                    </div>
        </>
      )}

      {/* Status Confirmation Modal */}
      {showStatusConfirmation && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
            onClick={() => setShowStatusConfirmation(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-[100] p-6 w-[400px]">
            <div className="text-center">
              <div className="mb-4">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Promotor als inaktiv setzen?
                </h3>
                <p className="text-sm text-gray-600">
                  Möchten Sie diesen Promotor wirklich als inaktiv markieren? Diese Aktion kann später rückgängig gemacht werden.
                </p>
                </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowStatusConfirmation(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleStatusChange}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Bestätigen
                </button>
              </div>
            </div>
          </div>
        </>
      )}

        {/* Eddie KI Assistant */}
        <AdminEddieAssistant />
      </div>
    </>
  );
} 