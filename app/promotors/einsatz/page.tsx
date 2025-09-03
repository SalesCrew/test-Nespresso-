"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Info,
  MessageSquare,
  Package,
  Play,
  Plus,
  Send,
  X,
  ArrowLeft,
  ArrowRight,
  MapPin,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Check,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  Video,
  Briefcase,
  Stethoscope,
  Upload,
  Camera,
  Image,
  Thermometer,
  MoreHorizontal,
  AlertCircle,
  SlidersHorizontal,
  ShoppingCart,
  Minus,
  Box,
  Truck,
  RotateCcw,
  GraduationCap,
  UserCheck,
  Separator as LucideSeparator
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

// Mock data for today's assignment
const getFutureDate = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Removed temp data: assignment selection mock now empty (real invites only)
const assignmentSelectionMock: any[] = [];

// No mock data - only real assignments from API
const replacementAssignmentsMock: any[] = [];

export default function EinsatzPage() {
  const router = useRouter();
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  const [einsatzStatus, setEinsatzStatus] = useState<"idle" | "started" | "completed">("idle");
  const [remainingTime, setRemainingTime] = useState(0); // in seconds
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const assignmentEndDateRef = useRef<Date | null>(null); // To store the specific end date of the current/last assignment

  const [isSwiped, setIsSwiped] = useState(false); // New state for swipe toggle

  const [lastCompletedAssignmentDate, setLastCompletedAssignmentDate] = useState<Date | null>(null);

  // Early start functionality
  const [showEarlyStartModal, setShowEarlyStartModal] = useState(false);
  const [earlyStartReason, setEarlyStartReason] = useState("");
  const [minutesEarly, setMinutesEarly] = useState(0);

  // Active einsatz functionality
  const [abweichendePauseSubmitted, setAbweichendePauseSubmitted] = useState(false);
  const [showEarlyEndModal, setShowEarlyEndModal] = useState(false);
  const [earlyEndReason, setEarlyEndReason] = useState("");
  const [minutesEarlyEnd, setMinutesEarlyEnd] = useState(0);

  // For buddy tags
  const [buddyTags, setBuddyTags] = useState<any[]>([]);
  const [selectedBuddyTagId, setSelectedBuddyTagId] = useState<string | null>(null);
  const [showBuddyTagConfirmation, setShowBuddyTagConfirmation] = useState(false);

  // Photo upload states
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [photoUploadStep, setPhotoUploadStep] = useState<1 | 2 | 3>(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<{
    foto_maschine: string | null;
    foto_kapsellade: string | null;
    foto_pos_gesamt: string | null;
  }>({
    foto_maschine: null,
    foto_kapsellade: null,
    foto_pos_gesamt: null
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // NEW: Simplified process state management
  const [processState, setProcessState] = useState<{
    stage: 'loading' | 'idle' | 'select_assignment' | 'waiting' | 'declined' | 'accepted' | 'partially_accepted';
    invitedAssignments: any[];
    waitingAssignments: any[];
    acceptedAssignments: any[];
    rejectedAssignments: any[];
    replacementAssignments: any[];
    selectedIds: string[];
  }>({
    stage: 'loading',
    invitedAssignments: [],
    waitingAssignments: [],
    acceptedAssignments: [],
    rejectedAssignments: [],
    replacementAssignments: [],
    selectedIds: []
  });
  
  // Keep old state variables temporarily for compatibility
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>([]);
  const [isAssignmentCollapsed, setIsAssignmentCollapsed] = useState(false);
  
  // Stub variables to fix build errors (old flow - not used)
  const showReplacementAssignments = false;
  const setShowReplacementAssignments = () => {};
  const setShowAssignmentConfirmation = () => {};
  const setCurrentProcess = () => {};
  const selectedReplacementIds: any[] = [];
  const setSelectedReplacementIds = () => {};
  const setReplacementStatuses = () => {};
  const setProcessCompleted = () => {};
  const selectedAssignment = null;
  const [assignmentStatuses, setAssignmentStatuses] = useState<{[key: string]: 'pending' | 'confirmed' | 'declined'}>({});
  const [hasAvailableAssignments, setHasAvailableAssignments] = useState(false);
  const [replacementAssignments, setReplacementAssignments] = useState<any[]>([]);
  
  // State for next upcoming assignment
  const [nextAssignment, setNextAssignment] = useState<any | null>(null);
  const [nextAssignmentLoading, setNextAssignmentLoading] = useState<boolean>(false);
  
  // State for tracking data (for persistent status)
  const [trackingData, setTrackingData] = useState<any | null>(null);
  
  // Load process state from API
  const loadBuddyTags = async () => {
  try {
    const res = await fetch('/api/assignments/buddy-tags', { 
      cache: 'no-store',
      credentials: 'include' 
    });
    
    if (res.ok) {
      const data = await res.json();
      const tags = data.buddy_tags || [];
      console.log('Loaded buddy tags:', tags);
      setBuddyTags(tags);
    } else {
      console.error('Failed to load buddy tags:', res.status);
      setBuddyTags([]);
    }
  } catch (error) {
    console.error('Error loading buddy tags:', error);
    setBuddyTags([]);
  }
};

const loadProcessState = async () => {
    try {
      console.log('Loading process state...');
      const res = await fetch('/api/assignments/invites/process-state', {
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (!res.ok) {
        console.error('Failed to load process state:', res.status, res.statusText);
        // Try to get error details
        const text = await res.text();
        console.error('Error response:', text);
        throw new Error('Process state API failed'); // Throw to trigger fallback
      }
      
      const data = await res.json();
      console.log('Process state loaded:', data);
      
      setProcessState({
        stage: data.stage || 'idle',
        invitedAssignments: data.invitedAssignments || [],
        waitingAssignments: data.waitingAssignments || [],
        acceptedAssignments: data.acceptedAssignments || [],
        rejectedAssignments: data.rejectedAssignments || [],
        replacementAssignments: data.replacementAssignments || [],
        selectedIds: []
      });
      
      console.log('Process state set from API response');
      // Don't update old compatibility state - we're using the new UI only
    } catch (error) {
      console.error('Error loading process state:', error);
      
      // Fallback: Try to load invitations using the existing API
      try {
        console.log('Falling back to existing invites API...');
        const res = await fetch('/api/assignments/invites', { // Remove status filter to get all invites
          cache: 'no-store', 
          credentials: 'include' 
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Fallback API response:', data);
          const invites = Array.isArray(data?.invites) ? data.invites : [];
                      console.log('Fallback invites loaded:', invites.length);
            console.log('Invites data:', invites);
            console.log('First invite details:', invites[0]);
          
          if (invites.length > 0) {
            // Map function for consistent formatting
            const mapInvite = (i: any) => {
              const a = i.assignment || {};
              const start = a.start_ts ? new Date(a.start_ts) : null;
              const end = a.end_ts ? new Date(a.end_ts) : null;
              return {
                id: a.id,
                date: start ? start.toLocaleDateString('de-DE', { 
                  weekday: 'short', 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                }) : 'Datum',
                time: (start && end)
                  ? `${String(start.getUTCHours()).padStart(2, '0')}:${String(start.getUTCMinutes()).padStart(2, '0')}-${String(end.getUTCHours()).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')}`
                  : 'Zeit',
                location: a.location_text || '',
                status: i.status
              };
            };
            
            // Categorize invitations by status
            // Filter out assignments with status 'verstanden'
            const nonVerstandenInvites = invites.filter((i: any) => i.status !== 'verstanden');
            
            // Separate replacements from originals
            // Only consider it a replacement if replacement_for is NOT null and NOT undefined
            const originalInvites = nonVerstandenInvites.filter((i: any) => !i.replacement_for || i.replacement_for === null);
            const replacementInvites = nonVerstandenInvites.filter((i: any) => i.replacement_for && i.replacement_for !== null);
            
            // For original invites - normal categorization
            const invitedInvites = originalInvites.filter((i: any) => 
              i.status === 'invited');
            const appliedInvites = originalInvites.filter((i: any) => 
              i.status === 'applied');
            const acceptedInvites = originalInvites.filter((i: any) => 
              i.status === 'accepted');
            const rejectedInvites = originalInvites.filter((i: any) => 
              i.status === 'rejected');
            
            // Only uninvited replacement invites should be shown as options
            const replacementInvitedInvites = replacementInvites.filter((i: any) => 
              i.status === 'invited');
            
            // Also get applied replacement invites - these should trigger waiting stage
            const replacementAppliedInvites = replacementInvites.filter((i: any) => 
              i.status === 'applied');
            
            // Also get accepted replacement invites - these should trigger accepted stage
            const replacementAcceptedInvites = replacementInvites.filter((i: any) => 
              i.status === 'accepted');
            
            console.log('Categorized invites:');
            console.log('- invited:', invitedInvites.length);
            console.log('- applied:', appliedInvites.length);
            console.log('- accepted:', acceptedInvites.length);
            console.log('- rejected:', rejectedInvites.length);
            console.log('- replacement invited:', replacementInvitedInvites.length);
            console.log('- replacement applied:', replacementAppliedInvites.length);
            console.log('- replacement accepted:', replacementAcceptedInvites.length);
            console.log('Raw rejected invites:', rejectedInvites);
            console.log('Raw replacement invites:', replacementInvites);
            
            // Debug: log each invite to see replacement_for values
            invites.forEach((inv: any) => {
              console.log(`Invite ${inv.assignment_id}: status=${inv.status}, replacement_for=${inv.replacement_for}`);
            });
            
            const mappedInvited = invitedInvites.map(mapInvite).filter((x: any) => x.id);
            // Include both original applied AND replacement applied invites for waiting
            const mappedWaiting = [...appliedInvites, ...replacementAppliedInvites]
              .map(mapInvite).filter((x: any) => x.id);
            // Include both original accepted AND replacement accepted invites
            const mappedAccepted = [...acceptedInvites, ...replacementAcceptedInvites]
              .map(mapInvite).filter((x: any) => x.id);
            const mappedRejected = rejectedInvites.map(mapInvite).filter((x: any) => x.id);
            const mappedReplacements = replacementInvitedInvites.map(mapInvite).filter((x: any) => x.id);
            
            // Determine the stage based on what we have
            let stage: string = 'idle';
            
            // Priority order - REJECTED ALWAYS TAKES PRECEDENCE
            if (mappedRejected.length > 0 && mappedAccepted.length === 0) {
              // Only rejected - show declined UI (with or without replacements)
              stage = 'declined';
            } else if (mappedRejected.length > 0 && mappedAccepted.length > 0) {
              // Mix of accepted and rejected
              stage = 'partially_accepted';
            } else if (mappedAccepted.length > 0) {
              // Only accepted
              stage = 'accepted';
            } else if (mappedWaiting.length > 0) {
              // Waiting for response
              stage = 'waiting';
            } else if (mappedInvited.length > 0) {
              // New invitations to select (but NOT if they are replacements for rejected)
              stage = 'select_assignment';
            } else if (mappedReplacements.length > 0) {
              // If we ONLY have replacements with no rejected (original was already acknowledged)
              // Show declined UI so replacements appear in the correct Ersatztermin UI
              stage = 'declined';
              
              // Get the original rejected invitations that these are replacements for
              const replacementForIds = [...new Set(replacementInvites
                .map((inv: any) => inv.replacement_for)
                .filter((id: string | null) => id !== null))];
              
              if (replacementForIds.length > 0) {
                // Fetch the original invitations to show what was rejected
                try {
                  const originalInvitesRes = await fetch(`/api/assignments/invites?invitation_ids=${replacementForIds.join(',')}`, { 
                    cache: 'no-store',
                    credentials: 'include' 
                  });
                  
                  if (originalInvitesRes.ok) {
                    const originalData = await originalInvitesRes.json();
                    const originalInvites = originalData.invites || [];
                    
                    // Map original invitations to rejected format
                    mappedRejected = originalInvites.map((invite: any) => {
                      const assignment = invite.assignment;
                      if (!assignment) return null;
                      
                      return {
                        id: assignment.id,
                        date: new Date(assignment.start_ts).toLocaleDateString('de-DE', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        }),
                        time: `${new Date(assignment.start_ts).getUTCHours().toString().padStart(2, '0')}:${new Date(assignment.start_ts).getUTCMinutes().toString().padStart(2, '0')}-${new Date(assignment.end_ts).getUTCHours().toString().padStart(2, '0')}:${new Date(assignment.end_ts).getUTCMinutes().toString().padStart(2, '0')}`,
                        location: assignment.location_text,
                        status: 'rejected'
                      };
                    }).filter(Boolean);
                  }
                } catch (error) {
                  console.error('Error fetching original rejected invitations:', error);
                }
              }
            }
            
            console.log('=== SETTING PROCESS STATE FROM FALLBACK ===');
            console.log('Determined stage:', stage);
            console.log('mappedInvited:', mappedInvited);
            console.log('mappedWaiting:', mappedWaiting);
            console.log('mappedAccepted:', mappedAccepted);
            console.log('mappedRejected:', mappedRejected);
            console.log('mappedReplacements:', mappedReplacements);
            
            setProcessState({
              stage: stage as any,
              invitedAssignments: mappedInvited,
              waitingAssignments: mappedWaiting,
              acceptedAssignments: mappedAccepted,
              rejectedAssignments: mappedRejected,
              replacementAssignments: mappedReplacements,
              selectedIds: []
            });
            
            console.log('Process state set to', stage, 'with invitations');
            
            // Also clear old state to prevent old UI from showing
            setHasAvailableAssignments(false);
            setAssignments([]);
            return; // IMPORTANT: Return here to avoid setting to idle
          } else {
            // No invitations at all
            console.log('No invitations found in fallback');
            setProcessState(prev => ({ ...prev, stage: 'idle' }));
            return;
          }
        } else {
          console.log('Fallback API failed:', res.status);
          setProcessState(prev => ({ ...prev, stage: 'idle' }));
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setProcessState(prev => ({ ...prev, stage: 'idle' }));
      }
    }
  };
  
  // Load assignment tracking data for persistent status
  const loadAssignmentTracking = async (assignmentId: string) => {
    try {
      console.log('[loadAssignmentTracking] Fetching tracking data for:', assignmentId);
      const res = await fetch('/api/me/assignment-tracking', { cache: 'no-store', credentials: 'include' });
      console.log('[loadAssignmentTracking] Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[loadAssignmentTracking] Raw response data:', data);
        const assignments = data.assignments || [];
        const tracking = assignments.find((a: any) => a.assignment_id === assignmentId);
        setTrackingData(tracking || null);
        console.log('[loadAssignmentTracking] Found tracking for assignment:', tracking);
        
        // Set persistent status based on tracking data
        if (tracking) {
          // Check if tracking data is from today (reset if it's from yesterday)
          const trackingDate = tracking.actual_start_time ? new Date(tracking.actual_start_time) : null;
          const isTrackingFromToday = trackingDate ? isDateToday(trackingDate) : true; // Allow if no timestamp yet
          
          if (!isTrackingFromToday) {
            // Tracking data is from previous day - reset to idle for new day
            setEinsatzStatus("idle");
            setIsSwiped(false);
            console.log('[loadAssignmentTracking] Status reset to idle (new day)');
          } else if (tracking.actual_start_time && tracking.actual_end_time) {
            // Both start and end times exist - completed
            setEinsatzStatus("completed");
            setIsSwiped(true);
            setLastCompletedAssignmentDate(new Date()); // Set completion date for UI logic
            console.log('[loadAssignmentTracking] Status set to completed (both timestamps)');
          } else if (tracking.actual_start_time && !tracking.actual_end_time) {
            // Only start time exists - active/started
            setEinsatzStatus("started");
            setIsSwiped(true);
            console.log('[loadAssignmentTracking] Status set to started (start timestamp only)');
          } else {
            // No start time - idle
            setEinsatzStatus("idle");
            setIsSwiped(false);
            console.log('[loadAssignmentTracking] Status set to idle (no timestamps)');
          }
        }
      } else {
        const errorText = await res.text().catch(() => 'No error text');
        console.error('[loadAssignmentTracking] Failed to fetch tracking data:', res.status, errorText);
      }
    } catch (e) {
      console.error('[loadAssignmentTracking] Exception:', e);
    }
  };

  // Load next upcoming assignment (status assigned or buddy_tag) for this promotor
  const loadNextAssignment = async () => {
    try {
      setNextAssignmentLoading(true);
      console.log('[loadNextAssignment] Fetching next assignment...');
      const res = await fetch('/api/me/next-assignment', { cache: 'no-store', credentials: 'include' });
      console.log('[loadNextAssignment] Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[loadNextAssignment] Response data:', data);
        setNextAssignment(data.assignment || null);
        
        // Load tracking data for persistent status if assignment is for today
        if (data.assignment?.id) {
          const assignmentDate = data.assignment.start_ts ? new Date(data.assignment.start_ts) : null;
          const isToday = assignmentDate ? isDateToday(assignmentDate) : false;
          if (isToday) {
            await loadAssignmentTracking(data.assignment.id);
          }
        }
      } else {
        console.error('[loadNextAssignment] Failed with status:', res.status);
        const errorData = await res.text();
        console.error('[loadNextAssignment] Error response:', errorData);
        setNextAssignment(null);
      }
    } catch (e) {
      console.error('[loadNextAssignment] Exception:', e);
      setNextAssignment(null);
    } finally {
      setNextAssignmentLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('=== MOUNTING EINSATZ PAGE ===');
    console.log('Initial processState:', processState);
    console.log('Initial hasAvailableAssignments:', hasAvailableAssignments);
    console.log('Initial assignments:', assignments);
    loadProcessState();
    loadBuddyTags();
    loadNextAssignment();
    checkActiveSpecialStatus();
    
    // Refresh next assignment every 60s to reflect instant changes
    const iv = setInterval(loadNextAssignment, 60000);
    
    // Check special status every 30s to detect approval/changes
    const statusIv = setInterval(checkActiveSpecialStatus, 30000);
    
    return () => {
      clearInterval(iv);
      clearInterval(statusIv);
    };
  }, []);
  
  // Track processState changes
  useEffect(() => {
    console.log('=== PROCESS STATE CHANGED ===');
    console.log('New processState:', processState);
  }, [processState]);
  
  // Track nextAssignment changes
  useEffect(() => {
    console.log('=== NEXT ASSIGNMENT CHANGED ===');
    console.log('nextAssignment:', nextAssignment);
  }, [nextAssignment]);

  
  // Load process state from database on mount
  useEffect(() => {
    (async () => {
      try {
        // First load saved process state
        const processRes = await fetch('/api/assignments/process', {
          cache: 'no-store',
          credentials: 'include'
        });
        
        if (processRes.ok) {
          const { process } = await processRes.json();
          if (process && process.process_stage !== 'idle') {
            // Skip - process restoration is handled in loadProcessState now
            
            // Don't load old assignments if we have an active process
            console.log('Active process found:', process.process_stage);
            
            // Restore UI state based on process stage
            if (process.process_stage !== 'idle') {
              // For waiting stage, we need to set the replacement IDs as selected
              if (process.process_stage === 'waiting' && process.replacement_assignment_ids.length > 0) {
                setSelectedAssignmentIds(process.replacement_assignment_ids.map((id: string) => parseInt(id)));
                const statuses: {[key: string]: 'pending' | 'confirmed' | 'declined'} = {};
                process.replacement_assignment_ids.forEach((id: string) => {
                  statuses[id] = 'pending';
                });
                setAssignmentStatuses(statuses);
              } else {
                // For other stages, use original IDs
                setSelectedAssignmentIds(process.original_assignment_ids.map((id: string) => parseInt(id)));
                const statuses: {[key: string]: 'pending' | 'confirmed' | 'declined'} = {};
                
                if (process.process_stage === 'confirmed') {
                  process.original_assignment_ids.forEach((id: string) => {
                    statuses[id] = 'confirmed';
                  });
                } else if (process.process_stage === 'declined') {
                  process.original_assignment_ids.forEach((id: string) => {
                    statuses[id] = 'declined';
                  });
                  setShowReplacementAssignments(true);
                } else {
                  process.original_assignment_ids.forEach((id: string) => {
                    statuses[id] = 'pending';
                  });
                }
                setAssignmentStatuses(statuses);
              }
              
              setIsAssignmentCollapsed(true);
              setHasAvailableAssignments(true);
              
              // For confirmed stage, show assignment confirmation
              if (process.process_stage === 'confirmed') {
                setShowAssignmentConfirmation(false); // This will show the green check UI
              }
              
              // Load assignment details for the IDs we have
              const allIds = [...process.original_assignment_ids, ...process.replacement_assignment_ids];
              if (allIds.length > 0) {
                // Fetch assignment details
                const assignmentRes = await fetch(`/api/assignments?ids=${allIds.join(',')}`, {
                  cache: 'no-store',
                  credentials: 'include'
                });
                
                if (assignmentRes.ok) {
                  const { assignments: assignmentData } = await assignmentRes.json();
                  if (assignmentData && assignmentData.length > 0) {
                    const mapped = assignmentData.map((a: any) => {
                      const start = a.start_ts ? new Date(a.start_ts) : null;
                      const end = a.end_ts ? new Date(a.end_ts) : null;
                      return {
                        id: a.id,
                        date: start ? start.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Datum',
                        time: (start && end)
                          ? `${String(start.getUTCHours()).padStart(2, '0')}:${String(start.getUTCMinutes()).padStart(2, '0')}-${String(end.getUTCHours()).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')}`
                          : 'Zeit',
                        location: a.location_text || '',
                        description: a.description || ''
                      };
                    });
                    
                    // For waiting stage, put replacement assignments in replacementAssignments state
                    if (process.process_stage === 'waiting' && process.replacement_assignment_ids.length > 0) {
                      const replacementData = mapped.filter((a: any) => 
                        process.replacement_assignment_ids.includes(String(a.id))
                      );
                      setReplacementAssignments(replacementData);
                      
                      // Set original assignments too
                      const originalData = mapped.filter((a: any) => 
                        process.original_assignment_ids.includes(String(a.id))
                      );
                      setAssignments(originalData);
                    } else {
                      setAssignments(mapped);
                    }
                  }
                }
              }
            }
            
            return;
          }
        }
        // Load accepted assignments that haven't been acknowledged
        const res = await fetch('/api/assignments/invites/unacknowledged-accepted', { 
          cache: 'no-store', 
          credentials: 'include' 
        });
        
        let unacknowledgedAccepted: any[] = [];
        if (res.ok) {
          const data = await res.json();
          unacknowledgedAccepted = Array.isArray(data?.invites) ? data.invites : [];
          
          if (unacknowledgedAccepted.length > 0) {
            // Map accepted assignments
            const acceptedAssignments = unacknowledgedAccepted.map((i: any) => {
              const a = i.assignment || {};
              const start = a.start_ts ? new Date(a.start_ts) : null;
              const end = a.end_ts ? new Date(a.end_ts) : null;
              return {
                id: a.id,
                date: start ? start.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Datum',
                time: (start && end)
                  ? `${String(start.getUTCHours()).padStart(2, '0')}:${String(start.getUTCMinutes()).padStart(2, '0')}-${String(end.getUTCHours()).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')}`
                  : 'Zeit',
                location: a.location_text || '',
                description: a.description || ''
              };
            }).filter((x: any) => x.id);
            
            // Set up state to show confirmation card
            const ids = acceptedAssignments.map((a: any) => a.id);
            const statuses: {[key: string]: 'pending' | 'confirmed' | 'declined'} = {};
            ids.forEach((id: number) => {
              statuses[String(id)] = 'confirmed';
            });
            
            console.log('Setting up accepted assignments state:', {
              ids,
              statuses,
              acceptedAssignmentsCount: acceptedAssignments.length
            });
            
            setSelectedAssignmentIds(ids);
            setAssignmentStatuses(statuses);
            setIsAssignmentCollapsed(true);
            setHasAvailableAssignments(true); // Important: Show the card container
            
            // Set process to confirmed stage
            setCurrentProcess({
              originalIds: ids,
              replacementIds: [],
              stage: 'confirmed'
            });
            
            // Add to assignments if not already there
            setAssignments(prev => {
              const existingIds = new Set(prev.map(a => a.id));
              const newAssignments = acceptedAssignments.filter((a: any) => !existingIds.has(a.id));
              return [...prev, ...newAssignments];
            });
          }
        }

        // Only load rejected assignments if there are NO accepted assignments
        // This prevents old rejected assignments from interfering with new accepted ones
        if (unacknowledgedAccepted.length === 0) {
          const resRejected = await fetch('/api/assignments/invites/unacknowledged-rejected', { 
            cache: 'no-store', 
            credentials: 'include' 
          });
          
          if (resRejected.ok) {
            const dataRejected = await resRejected.json();
            const unacknowledgedRejected = Array.isArray(dataRejected?.invites) ? dataRejected.invites : [];
            
            if (unacknowledgedRejected.length > 0) {
            // Map rejected assignments
            const rejectedAssignments = unacknowledgedRejected.map((i: any) => {
              const a = i.assignment || {};
              const start = a.start_ts ? new Date(a.start_ts) : null;
              const end = a.end_ts ? new Date(a.end_ts) : null;
              return {
                id: a.id,
                date: start ? start.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Datum',
                time: (start && end)
                  ? `${String(start.getUTCHours()).padStart(2, '0')}:${String(start.getUTCMinutes()).padStart(2, '0')}-${String(end.getUTCHours()).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')}`
                  : 'Zeit',
                location: a.location_text || '',
                description: a.description || ''
              };
            }).filter((x: any) => x.id);
            
            // Set state for rejected assignments
            const rejectedIds = rejectedAssignments.map((a: any) => a.id);
            const statuses: {[key: string]: 'pending' | 'confirmed' | 'declined'} = {};
            rejectedIds.forEach((id: number) => {
              statuses[String(id)] = 'declined';
            });
            
            console.log('Setting up rejected assignments state:', {
              rejectedIds,
              statuses,
              rejectedAssignmentsCount: rejectedAssignments.length
            });
            
            setSelectedAssignmentIds(rejectedIds);
            setAssignmentStatuses(statuses);
            setIsAssignmentCollapsed(true);
            setHasAvailableAssignments(true);
            setShowReplacementAssignments(true); // Show replacement UI
            
            // Set process to declined stage with rejected IDs
            setCurrentProcess({
              originalIds: rejectedIds,
              replacementIds: [],
              stage: 'declined'
            });
            
            // Add to assignments if not already there
            setAssignments(prev => {
              const existingIds = new Set(prev.map(a => a.id));
              const newAssignments = rejectedAssignments.filter((a: any) => !existingIds.has(a.id));
              return [...prev, ...newAssignments];
            });
            
            // Fetch available replacement assignments
            const resReplacements = await fetch('/api/assignments/invites?status=invited', { 
              cache: 'no-store', 
              credentials: 'include' 
            });
            
            if (resReplacements.ok) {
              const dataReplacements = await resReplacements.json();
              const replacementInvites = Array.isArray(dataReplacements?.invites) ? dataReplacements.invites : [];
              
              // Replace mock data with real replacement assignments
              if (replacementInvites.length > 0) {
                const mappedReplacements = replacementInvites.map((i: any) => {
                  const a = i.assignment || {};
                  const start = a.start_ts ? new Date(a.start_ts) : null;
                  const end = a.end_ts ? new Date(a.end_ts) : null;
                  return {
                    id: a.id,
                    date: start ? start.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) : 'Datum',
                    time: (start && end)
                      ? `${String(start.getUTCHours()).padStart(2, '0')}:${String(start.getUTCMinutes()).padStart(2, '0')}-${String(end.getUTCHours()).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')}`
                      : 'Zeit',
                    location: a.location_text || '',
                    description: a.description || ''
                  };
                }).filter((x: any) => x.id);
                
                // Set replacement assignments in state
                setReplacementAssignments(mappedReplacements);
                console.log('Set replacement assignments:', mappedReplacements.length, 'items');
              }
            }
          }
        }
        }
      } catch (error) {
        console.error('Error loading accepted/rejected assignments:', error);
      }
    })();
  }, []);
  
  // Check assignment status periodically
  useEffect(() => {
    // Only check status when in waiting stage
    if (processState.stage !== 'waiting') return;
    if (selectedAssignmentIds.length === 0) return;
    
    const checkAssignmentStatus = async () => {
      try {
        // Check status for each submitted assignment
        const statusChecks = await Promise.all(
          selectedAssignmentIds.map(async (id) => {
            const res = await fetch(`/api/assignments/${id}/invites/status`, {
              credentials: 'include'
            });
            if (res.ok) {
              const data = await res.json();
              return { id: String(id), status: data.status };
            }
            return { id: String(id), status: 'pending' };
          })
        );
        
        // Update statuses
        const newStatuses: {[key: string]: 'pending' | 'confirmed' | 'declined'} = {};
        statusChecks.forEach(({ id, status }) => {
          if (status === 'accepted') {
            newStatuses[id] = 'confirmed';
          } else if (status === 'rejected') {
            newStatuses[id] = 'declined';
          } else {
            newStatuses[id] = 'pending';
          }
        });
        
        setAssignmentStatuses(newStatuses);
        
        // Check if all are confirmed
        const allConfirmed = Object.values(newStatuses).every(status => status === 'confirmed');
        const hasDeclined = Object.values(newStatuses).some(status => status === 'declined');
        
        if (allConfirmed) {
          setCurrentProcess(prev => ({ ...prev, stage: 'confirmed' }));
        } else if (hasDeclined) {
          setShowReplacementAssignments(true);
          setCurrentProcess(prev => ({ ...prev, stage: 'declined' }));
        }
      } catch (error) {
        console.error('Error checking assignment status:', error);
      }
    };
    
    // Check immediately
    checkAssignmentStatus();
    
    // Check every 3 seconds
    const interval = setInterval(checkAssignmentStatus, 3000);
    
    return () => clearInterval(interval);
  }, [processState.stage, selectedAssignmentIds]);

  // For sickness and emergency reporting
  const [activeTab, setActiveTab] = useState<"krankheit" | "notfall">("krankheit");
  const [isWaitingForSickConfirmation, setIsWaitingForSickConfirmation] = useState(false);
  const [showDoctorNoteUpload, setShowDoctorNoteUpload] = useState(false);
  const [doctorNoteUploaded, setDoctorNoteUploaded] = useState(false);
  const [isWaitingForEmergencyConfirmation, setIsWaitingForEmergencyConfirmation] = useState(false);
  
  // Active special status
  const [activeSpecialStatus, setActiveSpecialStatus] = useState<any>(null);
  const [checkingSpecialStatus, setCheckingSpecialStatus] = useState(true);
  const [pendingSpecialStatusRequest, setPendingSpecialStatusRequest] = useState<any>(null);
  
  // Check for active special status and pending requests
  const checkActiveSpecialStatus = async () => {
    try {
      setCheckingSpecialStatus(true);
      
      // Check for active status
      const activeResponse = await fetch('/api/special-status/active', {
        credentials: 'include'
      });
      
      if (activeResponse.ok) {
        const { activeStatus } = await activeResponse.json();
        setActiveSpecialStatus(activeStatus);
        
        // If we have active status, no need to check pending
        if (activeStatus?.is_active) {
          setPendingSpecialStatusRequest(null);
          setIsWaitingForSickConfirmation(false);
          setIsWaitingForEmergencyConfirmation(false);
          return;
        }
      } else {
        setActiveSpecialStatus(null);
      }
      
      // Check for pending requests if no active status
      const pendingResponse = await fetch('/api/special-status/requests', {
        credentials: 'include'
      });
      
      if (pendingResponse.ok) {
        const { requests } = await pendingResponse.json();
        const myPendingRequest = requests?.find((r: any) => r.status === 'pending');
        setPendingSpecialStatusRequest(myPendingRequest);
        
        if (myPendingRequest) {
          if (myPendingRequest.request_type === 'krankenstand') {
            setIsWaitingForSickConfirmation(true);
            setIsWaitingForEmergencyConfirmation(false);
          } else if (myPendingRequest.request_type === 'notfall') {
            setIsWaitingForSickConfirmation(false);
            setIsWaitingForEmergencyConfirmation(true);
          }
        } else {
          setIsWaitingForSickConfirmation(false);
          setIsWaitingForEmergencyConfirmation(false);
        }
      } else {
        setPendingSpecialStatusRequest(null);
        setIsWaitingForSickConfirmation(false);
        setIsWaitingForEmergencyConfirmation(false);
      }
      
    } catch (error) {
      console.warn('Special status feature not available:', error);
      setActiveSpecialStatus(null);
      setPendingSpecialStatusRequest(null);
      setIsWaitingForSickConfirmation(false);
      setIsWaitingForEmergencyConfirmation(false);
    } finally {
      setCheckingSpecialStatus(false);
    }
  };
  
  // Create special status request
  const createSpecialStatusRequest = async (requestType: 'krankenstand' | 'notfall') => {
    try {
      const response = await fetch('/api/special-status/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ request_type: requestType })
      });
      
      if (response.ok) {
        console.log(`${requestType} request created successfully`);
        // Re-check status to update UI
        await checkActiveSpecialStatus();
      } else {
        const error = await response.json();
        console.error('Failed to create special status request:', error);
        // Reset the waiting state on error
        if (requestType === 'krankenstand') {
          setIsWaitingForSickConfirmation(false);
        } else {
          setIsWaitingForEmergencyConfirmation(false);
        }
      }
    } catch (error) {
      console.error('Error creating special status request:', error);
      // Reset the waiting state on error
      if (requestType === 'krankenstand') {
        setIsWaitingForSickConfirmation(false);
      } else {
        setIsWaitingForEmergencyConfirmation(false);
      }
    }
  };
  
  // End active special status
  const endActiveSpecialStatus = async () => {
    try {
      const response = await fetch('/api/special-status/active', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setActiveSpecialStatus(null);
        // Reload to refresh assignment status
        window.location.reload();
      }
    } catch (error) {
      console.error('Error ending special status:', error);
    }
  };

  // For equipment ordering
  const [showEquipmentCard, setShowEquipmentCard] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [equipmentQuantity, setEquipmentQuantity] = useState(1);
  const [equipmentOrderStep, setEquipmentOrderStep] = useState<"list" | "confirm">("list");

  // For rotating calendar
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [animating, setAnimating] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [miniCalendarDisplayMonth, setMiniCalendarDisplayMonth] = useState(new Date());
  const miniCalendarButtonRef = useRef<HTMLButtonElement>(null);
  const miniCalendarPopupRef = useRef<HTMLDivElement>(null);
  const [hoveredMiniCalendarDate, setHoveredMiniCalendarDate] = useState<Date | null>(null);
  const [showLegendPopup, setShowLegendPopup] = useState(false);
  const legendIconRef = useRef<HTMLButtonElement>(null);
  const legendPopupRef = useRef<HTMLDivElement>(null);

  // Mock equipment data
  const equipmentItems = [
    { id: 1, name: "Samsung Smartphones", description: "Dummy-Geräte für Präsentation", image: "/placeholder-phone.jpg" },
    { id: 2, name: "Tablet Ständer", description: "Display-Ständer für Tablets", image: "/placeholder-stand.jpg" },
    { id: 3, name: "Werbeflyer", description: "Produktinformationen", image: "/placeholder-flyer.jpg" },
    { id: 4, name: "Netzteile", description: "Ladegeräte für Vorführung", image: "/placeholder-charger.jpg" },
    { id: 5, name: "Bluetooth Kopfhörer", description: "Demonstration Audio-Features", image: "/placeholder-headphones.jpg" },
    { id: 6, name: "Displayreiniger", description: "Reinigungsset für Geräte", image: "/placeholder-cleaner.jpg" },
  ];

  // Helper functions for calendar
  const getCalendarDays = () => {
    const days = [];
    const startDay = new Date(currentCalendarDate);
    startDay.setDate(currentCalendarDate.getDate() - 4);
    for (let i = 0; i < 9; i++) {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateDays = (steps: number) => {
    if (animating || steps === 0) return;
    setAnimating(true);
    setTimeout(() => {
      const newCurrentDate = new Date(currentCalendarDate);
      newCurrentDate.setDate(currentCalendarDate.getDate() + steps);
      setCurrentCalendarDate(newCurrentDate);
      setSelectedCalendarDate(newCurrentDate);
      setTimeout(() => setAnimating(false), 400);
    }, 50);
  };

  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const startMonth = startDate.toLocaleDateString('de-DE', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('de-DE', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    if (startMonth === endMonth) {
      return `${startMonth}, ${String(startDay).padStart(2, '0')} - ${String(endDay).padStart(2, '0')}`;
    }
    return `${startMonth} ${String(startDay).padStart(2, '0')} - ${endMonth} ${String(endDay).padStart(2, '0')}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = [];
    let startingDayOfWeek = firstDayOfMonth.getDay();
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysInMonth.push(null);
    }
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      daysInMonth.push(new Date(year, month, i));
    }
    return daysInMonth;
  };

  const navigateMiniCalendarMonth = (direction: number) => {
    setMiniCalendarDisplayMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  // Effect for mini calendar outside click
  useEffect(() => {
    const handleClickOutsideMiniCalendar = (event: MouseEvent) => {
      if (showMiniCalendar && miniCalendarButtonRef.current && !miniCalendarButtonRef.current.contains(event.target as Node) && miniCalendarPopupRef.current && !miniCalendarPopupRef.current.contains(event.target as Node)) {
        setShowMiniCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMiniCalendar);
    return () => document.removeEventListener('mousedown', handleClickOutsideMiniCalendar);
  }, [showMiniCalendar]);

  // Effect for legend popup outside click
  useEffect(() => {
    const handleClickOutsideLegend = (event: MouseEvent) => {
      if (showLegendPopup && legendIconRef.current && !legendIconRef.current.contains(event.target as Node) && legendPopupRef.current && !legendPopupRef.current.contains(event.target as Node)) {
        setShowLegendPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideLegend);
    return () => document.removeEventListener('mousedown', handleClickOutsideLegend);
  }, [showLegendPopup]);

  // Maps Modal Logic (copied from dashboard)
  const handleAddressClick = (address: string) => {
    setSelectedAddress(address);
    setShowMapsModal(true);
  };

  // Handle info icon click to show details modal
  const handleInfoClick = (e: React.MouseEvent, proposal: any) => {
    e.stopPropagation(); // Prevent triggering the parent card onClick
    setSelectedProposal(proposal);
    setShowDetailsModal(true);
  };

  const openInGoogleMaps = () => {
    if (!selectedAddress) return;
    const encodedAddress = encodeURIComponent(selectedAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    setShowMapsModal(false);
  };

  const openInAppleMaps = () => {
    if (!selectedAddress) return;
    const encodedAddress = encodeURIComponent(selectedAddress);
    window.open(`maps://maps.apple.com/?q=${encodedAddress}`, '_blank');
    setShowMapsModal(false);
  };

  const handleEinsatzStart = (assignment: any) => {
    router.push(`/einsatz/${assignment.id}`);
  };

  // New Timer Logic
  useEffect(() => {
    if (einsatzStatus === "started" && nextAssignment?.end_ts) {
      const now = new Date();
      // Use the actual end_ts from the assignment
      const endDate = new Date(nextAssignment.end_ts);
      assignmentEndDateRef.current = new Date(endDate); // Store the actual end date for this assignment

      let initialRemaining = Math.floor((endDate.getTime() - now.getTime()) / 1000);
      
      // If the assignment is for a future date, remaining time should be calculated from its start, or simply be very large
      // For now, if it's a future assignment being "started", the countdown will be negative or huge.
      // This test setup assumes we are "forcing" a start.
      // If assignmentDateForEndDate is today, initialRemaining is correct.
      // If assignmentDateForEndDate is future, this countdown is not really "active" until that day.
      // For the purpose of testing the "completed" state by setting a past time, this is okay.
      // For a real scenario, one wouldn't "start" a future assignment this way.

      if (new Date(nextAssignment?.start_ts || 0).toDateString() !== now.toDateString() && initialRemaining > 0) {
         // If starting a future assignment, we might not want the timer to run realistically yet.
         // However, for testing the 'completed' state by setting a past time on the mock, we let it run.
      }
      
      if (initialRemaining < 0) initialRemaining = 0; // If already past
      
      setRemainingTime(initialRemaining);

      if (initialRemaining === 0) {
        handleCompleteEinsatz();
        return;
      }

      timerIntervalRef.current = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 1) {
            if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            handleCompleteEinsatz();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [einsatzStatus, nextAssignment?.start_ts, nextAssignment?.end_ts]); // Added dependencies

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60; // Kept for potential future use, but prompt asked for HH:MM
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  const handleStartEinsatz = async () => {
    try {
      // Get Austrian local time as ISO string WITHOUT timezone conversion
      const now = new Date();
      // Use sv-SE locale which gives YYYY-MM-DD HH:mm:ss format
      const austrianTimeString = now.toLocaleString('sv-SE', { 
        timeZone: 'Europe/Vienna',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(' ', 'T') + '.000Z';  // Add T and fake Z to make it look like ISO but with Austrian time
      
      // Update assignment tracking with actual start time and early start reason if applicable
      if (displayedAssignment?.id) {
        const updateData: any = {
          assignment_id: displayedAssignment.id,
          actual_start_time: austrianTimeString,
          status: 'gestartet'
        };
        
        // Add early start reason if this was an early start
        console.log('🔵 [START] Checking early start reason:', earlyStartReason, 'Minutes early:', minutesEarly);
        if (earlyStartReason.trim()) {
          updateData.early_start_reason = earlyStartReason.trim();
          updateData.minutes_early_start = minutesEarly;
          console.log('✅ [START] Added early start reasoning to API call');
        } else {
          console.log('ℹ️ [START] No early start reasoning to add');
        }
        
        const response = await fetch('/api/assignments/today', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
          console.error('Failed to update start time');
        } else {
          console.log('✅ Successfully updated start time for assignment:', displayedAssignment.id);
          // Clear early start reason after successful submission
          setEarlyStartReason("");
          setMinutesEarly(0);
        }
      }
      
      setEinsatzStatus("started");
      setIsSwiped(true); // Set swiped to true
    } catch (error) {
      console.error('Error starting einsatz:', error);
      // Still update UI even if API fails
      setEinsatzStatus("started");
      setIsSwiped(true);
    }
  };

  const handleSwipeStart = () => {
    if (!isSwiped) {
      // Check if this is an early start (15+ minutes before actual assignment start time)
      const now = new Date();
      
      if (displayedAssignment?.start_ts) {
        // Extract time from ISO string and create today's date with Austrian timezone
        const startTimeString = displayedAssignment.start_ts.substring(11, 16); // e.g. "09:00"
        const [hours, minutes] = startTimeString.split(':').map(Number);
        
        // Create assignment start time for today in Austrian timezone
        const today = new Date();
        const assignmentStartTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
        
        const timeDiffMinutes = (assignmentStartTime.getTime() - now.getTime()) / (1000 * 60);
        
        if (timeDiffMinutes >= 15) {
          // Early start - show modal for reason
          setMinutesEarly(Math.round(timeDiffMinutes));
          setShowEarlyStartModal(true);
        } else {
          // Normal start
          handleStartEinsatz();
        }
      } else {
        // No assignment start time - just start normally
        handleStartEinsatz();
      }
    }
  };

  const handleEarlyStartSubmit = () => {
    if (earlyStartReason.trim()) {
      setShowEarlyStartModal(false);
      // Don't clear earlyStartReason here - let handleStartEinsatz use it and clear it after API success
      handleStartEinsatz();
    }
  };

  const handleAbweichendePause = () => {
    setAbweichendePauseSubmitted(true);
    setTimeout(() => setAbweichendePauseSubmitted(false), 3000); // Reset after 3 seconds
  };

  const handleEarlyEnd = () => {
    // Calculate how many minutes early (before 16:15)
    const now = new Date();
    const today = new Date();
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 15, 0); // 16:15
    const timeDiffMinutes = (endTime.getTime() - now.getTime()) / (1000 * 60);
    
    setMinutesEarlyEnd(Math.round(timeDiffMinutes));
    setShowEarlyEndModal(true);
  };

  const handleEarlyEndSubmit = async () => {
    if (earlyEndReason.trim()) {
      setShowEarlyEndModal(false);
      // Don't clear earlyEndReason here - let handleCompleteEinsatz use it and clear it after API success
      await handleCompleteEinsatz();
    }
  };

  const getPhotoTypeTitle = (step: 1 | 2 | 3) => {
    switch (step) {
      case 1: return "Foto Maschine";
      case 2: return "Foto Kapsellade";
      case 3: return "Foto POS gesamt";
      default: return "";
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!displayedAssignment?.id) return;

    setIsUploadingPhoto(true);
    try {
      const photoType = photoUploadStep === 1 ? 'foto_maschine' : 
                       photoUploadStep === 2 ? 'foto_kapsellade' : 'foto_pos_gesamt';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('photo_type', photoType);
      formData.append('assignment_id', displayedAssignment.id);
      
      const response = await fetch('/api/me/einsatz-photos/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadedPhotos(prev => ({
          ...prev,
          [photoType]: data.photo_url
        }));
        
        if (photoUploadStep < 3) {
          setPhotoUploadStep(prev => (prev + 1) as 1 | 2 | 3);
        } else {
          // All photos uploaded, complete the einsatz
          setShowPhotoUploadModal(false);
          await handleCompleteEinsatz(true); // Skip photo upload check
        }
      } else {
        console.error('Failed to upload photo');
        alert('Fehler beim Hochladen des Fotos. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Fehler beim Hochladen des Fotos. Bitte versuchen Sie es erneut.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCompleteEinsatz = async (skipPhotoUpload = false) => {
    // Check if all photos are uploaded (unless skipping photo upload)
    const allPhotosUploaded = uploadedPhotos.foto_maschine && uploadedPhotos.foto_kapsellade && uploadedPhotos.foto_pos_gesamt;
    
    if (!skipPhotoUpload && !allPhotosUploaded) {
      // Show photo upload modal first
      setPhotoUploadStep(1);
      setShowPhotoUploadModal(true);
      return;
    }
    
    try {
      // Get Austrian local time as ISO string WITHOUT timezone conversion
      const now = new Date();
      // Use sv-SE locale which gives YYYY-MM-DD HH:mm:ss format
      const austrianTimeString = now.toLocaleString('sv-SE', { 
        timeZone: 'Europe/Vienna',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(' ', 'T') + '.000Z';  // Add T and fake Z to make it look like ISO but with Austrian time
      
      // Update assignment tracking with actual end time and early end reason if applicable
      if (displayedAssignment?.id) {
        const updateData: any = {
          assignment_id: displayedAssignment.id,
          actual_end_time: austrianTimeString,
          status: 'beendet'
        };
        
        // Add early end reason if this was an early end
        console.log('🔵 [END] Checking early end reason:', earlyEndReason, 'Minutes early end:', minutesEarlyEnd);
        if (earlyEndReason.trim()) {
          updateData.early_end_reason = earlyEndReason.trim();
          updateData.minutes_early_end = minutesEarlyEnd;
          console.log('✅ [END] Added early end reasoning to API call');
        } else {
          console.log('ℹ️ [END] No early end reasoning to add');
        }
        
        // Add photo URLs if available
        if (uploadedPhotos.foto_maschine) {
          updateData.foto_maschine_url = uploadedPhotos.foto_maschine;
        }
        if (uploadedPhotos.foto_kapsellade) {
          updateData.foto_kapsellade_url = uploadedPhotos.foto_kapsellade;
        }
        if (uploadedPhotos.foto_pos_gesamt) {
          updateData.foto_pos_gesamt_url = uploadedPhotos.foto_pos_gesamt;
        }
        
        const response = await fetch('/api/assignments/today', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
          console.error('Failed to update end time');
        } else {
          console.log('✅ Successfully updated end time for assignment:', displayedAssignment.id);
          // Clear early end reason after successful submission
          setEarlyEndReason("");
          setMinutesEarlyEnd(0);
        }
      }
      
      setEinsatzStatus("completed");
      setLastCompletedAssignmentDate(assignmentEndDateRef.current ? new Date(assignmentEndDateRef.current) : new Date());
    } catch (error) {
      console.error('Error completing einsatz:', error);
      // Still update UI even if API fails
      setEinsatzStatus("completed");
      setLastCompletedAssignmentDate(assignmentEndDateRef.current ? new Date(assignmentEndDateRef.current) : new Date());
    }
  };

  const handleBuddyTagSelect = (id: string) => {
    console.log("Selected buddy tag ID:", id);
    setSelectedBuddyTagId(id);
  };

  const handleSubmitBuddyTag = async () => {
    if (!selectedBuddyTagId) return;
    
    try {
      // Submit selected buddy tag - it gets accepted immediately
      const res = await fetch(`/api/assignments/${selectedBuddyTagId}/invites/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'accepted' })
      });
      
      if (res.ok) {
        // Mark unselected buddy tags as withdrawn
        const unselectedTags = buddyTags.filter(tag => tag.assignment_id !== selectedBuddyTagId);
        for (const tag of unselectedTags) {
          try {
            await fetch(`/api/assignments/${tag.assignment_id}/invites/respond`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ status: 'withdrawn' })
            });
          } catch (e) {
            console.error('Failed to withdraw unselected buddy tag:', e);
          }
        }
        
        // Show confirmation and reload
        setShowBuddyTagConfirmation(true);
        setTimeout(() => {
          setShowBuddyTagConfirmation(false);
          setBuddyTags([]);
          setSelectedBuddyTagId(null);
          loadProcessState(); // Reload to show accepted state
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting buddy tag:', error);
    }
  };

  const handleAssignmentSelect = async (id: number) => {
    const assignment = assignments.find(a => a.id === id);
    
    if (assignment?.isBuddyTag) {
      // For buddy tags, auto-submit immediately
      setSelectedAssignmentIds([id]);
      const newStatuses: {[key: string]: 'pending' | 'confirmed' | 'declined'} = {};
      newStatuses[String(id)] = 'pending';
      setAssignmentStatuses(newStatuses);
      setIsAssignmentCollapsed(true);
      
      try {
        const res = await fetch(`/api/assignments/${id}/invites/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'applied' })
        });
        if (!res.ok) {
          console.error('Failed to submit buddy tag application:', id, await res.text());
        }
      } catch (error) {
        console.error('Error submitting buddy tag:', error);
      }
    } else {
      // Regular assignments allow multiple selection
    setSelectedAssignmentIds(prev => 
      prev.includes(id) 
        ? prev.filter(assignmentId => assignmentId !== id)
        : [...prev, id]
    );
    }
  };

  // NEW: Simplified flow handlers
  const handleNewAssignmentSelect = (assignmentId: string) => {
    console.log('=== SELECTING ASSIGNMENT ===');
    console.log('assignmentId:', assignmentId);
    
    setProcessState(prev => {
      const isSelected = prev.selectedIds.includes(assignmentId);
      const newSelectedIds = isSelected 
        ? prev.selectedIds.filter(id => id !== assignmentId)
        : [...prev.selectedIds, assignmentId];
      
      console.log('Current selectedIds:', prev.selectedIds);
      console.log('New selectedIds:', newSelectedIds);
      
      return {
        ...prev,
        selectedIds: newSelectedIds
      };
    });
  };

  const handleNewSubmitAssignments = async () => {
    console.log('=== SUBMITTING ASSIGNMENTS ===');
    console.log('processState.selectedIds:', processState.selectedIds);
    console.log('processState.invitedAssignments:', processState.invitedAssignments);
    
    if (processState.selectedIds.length === 0) {
      console.error('No assignments selected!');
      return;
    }
    
    try {
      // Submit selected assignments
      for (const assignmentId of processState.selectedIds) {
        console.log('Submitting assignment:', assignmentId);
        await fetch(`/api/assignments/${assignmentId}/invites/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'applied' })
        });
      }
      
      // Withdraw unselected assignments
      const unselectedIds = processState.invitedAssignments
        .filter(a => !processState.selectedIds.includes(a.id))
        .map(a => a.id);
        
      for (const assignmentId of unselectedIds) {
        await fetch(`/api/assignments/${assignmentId}/invites/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'withdrawn' })
        });
      }
      
      // Reload state
      await loadProcessState();
    } catch (error) {
      console.error('Error submitting assignments:', error);
    }
  };

  const handleNewSubmitReplacements = async () => {
    try {
      // First, mark the original rejected invitations as 'rejected_handled'
      // This prevents them from triggering the declined UI state
      for (const rejectedAssignment of processState.rejectedAssignments) {
        try {
          await fetch(`/api/assignments/${rejectedAssignment.id}/invites/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'rejected_handled' })
          });
        } catch (e) {
          console.error('Failed to mark rejected as handled:', e);
        }
      }
      
      // Submit selected replacement assignments
      for (const assignmentId of processState.selectedIds) {
        await fetch(`/api/assignments/${assignmentId}/invites/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'applied' })
        });
      }
      
      // Mark unselected replacement assignments as 'rejected_handled'
      // This prevents them from appearing again
      const unselectedReplacements = processState.replacementAssignments
        .filter(a => !processState.selectedIds.includes(a.id));
      
      for (const unselectedAssignment of unselectedReplacements) {
        try {
          await fetch(`/api/assignments/${unselectedAssignment.id}/invites/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'rejected_handled' })
          });
        } catch (e) {
          console.error('Failed to mark unselected replacement as handled:', e);
        }
      }
      
      // Reload state
      await loadProcessState();
    } catch (error) {
      console.error('Error submitting replacements:', error);
    }
  };

  const handleNewAcknowledge = async () => {
    console.log('User pressed Verstanden - marking as verstanden in DB');
    
    // Mark assignments as verstanden in database
    const assignmentIds = [
      ...processState.acceptedAssignments.map(a => a.id),
      ...processState.rejectedAssignments.map(a => a.id)
    ];
    
    // Update status to 'verstanden' for each assignment
    for (const assignmentId of assignmentIds) {
      try {
        await fetch(`/api/assignments/${assignmentId}/invites/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'verstanden' })
        });
      } catch (e) {
        console.error('Failed to mark as verstanden:', e);
      }
    }
    
    // Immediately go to loading state
    setProcessState({
      stage: 'loading',
      invitedAssignments: [],
      waitingAssignments: [],
      acceptedAssignments: [],
      rejectedAssignments: [],
      replacementAssignments: [],
      selectedIds: []
    });
    
    // Load new assignments after short delay
    setTimeout(() => {
      loadProcessState();
    }, 500);
  };

  const handleSubmitAssignment = async () => {
    if (selectedAssignmentIds.length > 0) {
      // Get all available assignment IDs
      const allAvailableIds = assignments.map(a => a.id);
      const unselectedIds = allAvailableIds.filter(id => !selectedAssignmentIds.includes(id));
      
      // Optimistic: set pending for selected
      const newStatuses: {[key: string]: 'pending' | 'confirmed' | 'declined'} = {};
      selectedAssignmentIds.forEach(id => { newStatuses[String(id)] = 'pending'; });
    setAssignmentStatuses(newStatuses);
      setIsAssignmentCollapsed(true);
      
      // Update process to applied stage
      setCurrentProcess(prev => ({
        ...prev,
        stage: 'applied'
      }));
      
      try {
        // Submit selected assignments
        await Promise.all(selectedAssignmentIds.map(async (id) => {
          const res = await fetch(`/api/assignments/${id}/invites/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'applied' })
          });
          if (!res.ok) {
            console.error('Failed to submit assignment application:', id, await res.text());
          }
        }));
        
        // Withdraw unselected assignments so they don't appear again
        await Promise.all(unselectedIds.map(async (id) => {
          const res = await fetch(`/api/assignments/${id}/invites/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'withdrawn' })
          });
          if (!res.ok) {
            console.error('Failed to withdraw unselected assignment:', id, await res.text());
          }
        }));
      } catch (error) {
        console.error('Error submitting assignments:', error);
      }
    }
  };



  const handleAssignmentInfoClick = (e: React.MouseEvent, assignment: typeof assignmentSelectionMock[0]) => {
    e.stopPropagation(); // Prevent triggering the parent card onClick
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  const handleReplacementSelect = (id: number) => {
    const maxReplacements = selectedAssignmentIds.filter(assignmentId => assignmentStatuses[assignmentId] === 'declined').length;
    
    setSelectedReplacementIds(prev => {
      if (prev.includes(id)) {
        // If already selected, remove it
        return prev.filter(assignmentId => assignmentId !== id);
      } else if (prev.length < maxReplacements) {
        // If not selected and under limit, add it
        return [...prev, id];
      } else {
        // If at limit, don't add
        return prev;
      }
    });
  };

  const handleSubmitReplacement = async () => {
    if (selectedReplacementIds.length > 0) {
      // Get all available replacement assignment IDs
      const allReplacementIds = replacementAssignments.map(a => a.id);
      const unselectedReplacementIds = allReplacementIds.filter(id => !selectedReplacementIds.includes(id));
      
      // Optimistic update: set replacement assignments as pending
      const newReplacementStatuses: {[key: number]: 'pending' | 'confirmed' | 'declined'} = {};
      selectedReplacementIds.forEach(id => {
        newReplacementStatuses[id] = 'pending';
      });
      setReplacementStatuses(newReplacementStatuses);
      
      try {
        // Submit selected replacement assignments
        await Promise.all(selectedReplacementIds.map(async (id) => {
          const res = await fetch(`/api/assignments/${id}/invites/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'applied' })
          });
          if (!res.ok) {
            console.error('Failed to submit replacement application:', id, await res.text());
          }
        }));
        
        // Withdraw unselected replacement assignments
        await Promise.all(unselectedReplacementIds.map(async (id) => {
          const res = await fetch(`/api/assignments/${id}/invites/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'withdrawn' })
          });
          if (!res.ok) {
            console.error('Failed to withdraw unselected replacement:', id, await res.text());
          }
        }));
        
        // Update main assignment statuses to pending (waiting for approval)
        const pendingStatuses: {[key: string]: 'pending' | 'confirmed' | 'declined'} = {};
        selectedReplacementIds.forEach(id => {
          pendingStatuses[String(id)] = 'pending';
        });
        setAssignmentStatuses(pendingStatuses);
        
        // Update selected assignment IDs to the replacement ones
        setSelectedAssignmentIds(selectedReplacementIds);
        
        // Update process with replacement IDs and set to waiting
        setCurrentProcess(prev => ({
          ...prev,
          replacementIds: selectedReplacementIds,
          stage: 'waiting'
        }));
        
        // Clear replacement states and hide replacement section
      setSelectedReplacementIds([]);
      setReplacementStatuses({});
      setShowReplacementAssignments(false);
      
      } catch (error) {
        console.error('Error submitting replacement assignments:', error);
      }
    }
  };

  // Helper Date Functions
  const isDateToday = (date: Date): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getCalendarDaysUntil = (date: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Determine which assignment to display: always show next upcoming if available
  const displayedAssignment = nextAssignment;
  const assignmentDate = displayedAssignment?.start_ts ? new Date(displayedAssignment.start_ts) : null;
  const endDate = displayedAssignment?.end_ts ? new Date(displayedAssignment.end_ts) : null;
  const isAssignmentForToday = assignmentDate ? isDateToday(assignmentDate) : false;
  const daysUntilAssignment = assignmentDate ? getCalendarDaysUntil(assignmentDate) : 0;

  let cardTitle = isAssignmentForToday ? "Heutiger Einsatz" : "Nächster Einsatz";
  let daysIndicatorValue: number | null = null;
  let daysIndicatorUnit: string | null = null;

  if (displayedAssignment && !isAssignmentForToday && daysUntilAssignment >= 0) {
    daysIndicatorValue = daysUntilAssignment;
    if (daysUntilAssignment === 1) {
      daysIndicatorUnit = "Tag";
    } else {
      daysIndicatorUnit = "Tage";
    }
  }

  return (
    <>
        {/* Welcome section specific to Einsatz Page - can use a general greeting or a specific one */}
        <section className="mb-6">
          {/* Example of a page-specific greeting if needed, otherwise SiteLayout provides one */}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-1">Deine Einsätze</h1>
          <div className="text-gray-600 dark:text-gray-400">
            <div className="inline-block typing-animation typing-container" style={{animationDuration: '2.5s', width: 'fit-content'}}>
              Verwalte hier deine geplanten Einsätze.
            </div>
          </div>
        </section>

        {/* Today's Planned Einsatz / Next Einsatz */}
        <Card className="mb-6 border-blue-300 dark:border-blue-700 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg flex flex-row justify-between items-center py-3 px-4">
            <div>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <Briefcase className="mr-2 h-5 w-5" /> {cardTitle}
              </CardTitle>
              <CardDescription className="text-blue-100 mt-0.5 text-xs md:text-sm">
                {assignmentDate ? assignmentDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </CardDescription>
            </div>
            {displayedAssignment && daysIndicatorValue !== null && daysIndicatorUnit !== null && (
              <div className="text-right">
                <p className="text-2xl font-bold">{daysIndicatorValue}</p>
                <p className="text-xs uppercase -mt-1">{daysIndicatorUnit}</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {!displayedAssignment ? (
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Kein Einsatz für heute geplant.</h3>
            ) : (
            <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{displayedAssignment.location_text || displayedAssignment.title}</h3>
            {/* Time display with pill style - made smaller */}
            <div className="mb-2 mt-1">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
                <Clock className="h-3.5 w-3.5 mr-1" /> 
                <span className="text-xs font-medium">{displayedAssignment?.start_ts && displayedAssignment?.end_ts ? `${displayedAssignment.start_ts.substring(11, 16)}-${displayedAssignment.end_ts.substring(11, 16)}` : ''}</span>
              </div>
            </div>
            <div 
              className="text-sm text-gray-600 dark:text-gray-400 flex items-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
              onClick={() => displayedAssignment && handleAddressClick(displayedAssignment.address || displayedAssignment.location_text || '')}
            >
              <MapPin className="h-4 w-4 mr-1.5 text-blue-500" /> {displayedAssignment?.address || displayedAssignment?.location_text || ''}
            </div>
            </>
            )}
            {/* Swipe to Start Einsatz - available from beginning of assignment day, status is idle, and not sick or in emergency */}
                          {isAssignmentForToday && einsatzStatus === "idle" && !isSwiped && !activeSpecialStatus?.is_active && (
              <div className="mt-4">
                <div 
                  className="relative w-full h-14 bg-gray-100 dark:bg-gray-800 rounded-full p-1 cursor-pointer select-none flex items-center justify-center shadow-inner"
                  onClick={handleSwipeStart}
                >
                  <div 
                    className={`absolute left-1 top-1 flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-md transition-transform duration-300 ease-in-out transform ${
                      isSwiped ? 'translate-x-[calc(100%-3.5rem)]' : 'translate-x-0'
                    }`}
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </div>
                  <span className={`text-sm font-medium transition-opacity duration-300 ${isSwiped ? 'opacity-0' : 'opacity-100 text-gray-700 dark:text-gray-300'}`}>
                    Swipe zum Starten
                  </span>
                  {isSwiped && (
                     <span className="text-sm font-medium text-green-500 dark:text-green-400">
                        Einsatz gestartet!
                     </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Bestätige hier den Beginn deines Einsatzes.</p>
              </div>
            )}
            
            {/* Completed Status - Show when einsatz is completed */}
            {isAssignmentForToday && einsatzStatus === "completed" && (
                <div className="mt-4 p-3 rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-300 dark:border-sky-700 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-sky-500 mr-2" />
                    <p className="text-sm font-medium text-sky-600 dark:text-sky-400">Einsatz abgeschlossen</p>
                </div>
            )}
            

            {/* Confirmation message after swipe, if assignment was for today */}
             {isAssignmentForToday && isSwiped && einsatzStatus === "started" && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Einsatz gestartet!</p>
                </div>
            )}
            {/* If not for today, maybe show a placeholder or different info if needed, for now it's blank if no swipe */}
            {!isAssignmentForToday && (
                 <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Dieser Einsatz ist für einen zukünftigen Tag geplant.</p>
                 </div>
            )}
          </CardContent>
        </Card>

        {/* Einsatz Control: Start / In Progress / Finish */}
        {/* The existing button to start Einsatz is now removed if the swipe toggle is the primary way */}
        {/* {einsatzStatus === "idle" && !isSwiped && (
          <Card className="mb-6 shadow-md">
// ... existing code ...
          </Card>
        )} */}

        {einsatzStatus === "started" && (
          <Card className="mb-6 border-green-300 dark:border-green-700 shadow-xl bg-gradient-to-br from-green-50 dark:from-green-900/30 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-green-600 dark:text-green-400">
                <div className="relative flex items-center mr-2">
                    <div className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></div>
                    <PlayCircle className="h-5 w-5 text-green-500" />
                </div>
                Einsatz aktiv
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold my-4 text-gray-800 dark:text-gray-100">{formatTime(remainingTime)}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Verbleibende Zeit. Dein Einsatz wird erfasst.</p>
              
              {/* Action buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleAbweichendePause}
                  disabled={abweichendePauseSubmitted}
                  className={`w-full py-2.5 transition-all duration-200 ${
                    abweichendePauseSubmitted 
                      ? "bg-green-500 hover:bg-green-500 text-white" 
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {abweichendePauseSubmitted ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Gemeldet
                    </>
                  ) : (
                    "Abweichende Pause"
                  )}
                </Button>
                
                <Button 
                  onClick={handleEarlyEnd}
                  variant="outline"
                  className="w-full py-2.5 border-rose-200 dark:border-rose-700 text-red-600 dark:text-red-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  Einsatz frühzeitig beenden
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Einsatz abgeschlossen Card - show when completed OR when both timestamps exist from tracking data */}
        {(einsatzStatus === "completed" && 
          ((lastCompletedAssignmentDate && isDateToday(lastCompletedAssignmentDate)) || 
           (trackingData?.actual_start_time && trackingData?.actual_end_time))) && (
          <Card className="mb-6 border-sky-300 dark:border-sky-700 shadow-lg bg-gradient-to-br from-sky-50 dark:from-sky-900/40 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sky-600 dark:text-sky-400">
                <CheckCircle2 className="mr-2.5 h-6 w-6" />
                Einsatz abgeschlossen
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="my-4 space-y-2">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Dein Einsatz für heute ist beendet.</p> {/* Clarified "for today" */}
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm text-gray-700 dark:text-gray-300">
                  <Info className="inline-block h-4 w-4 mr-1.5 mb-0.5 text-sky-500" />
                  Bitte vergiss nicht, deine genauen Arbeits- und Pausenzeiten im <strong>Demotool</strong> einzutragen.
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {/* Newcomer Date Selection Card */}
        {!showBuddyTagConfirmation ? (
          buddyTags.length > 0 ? (
          <Card className="mb-6 border-dashed border-blue-400 dark:border-blue-600 shadow-sm">
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-blue-400 text-center">
                Suche dir <span className="text-blue-600 dark:text-blue-400">deinen</span> <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Buddy Tag</span> <span className="text-blue-600 dark:text-blue-400">selber aus!</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-center">Bitte wähle einen der vorgeschlagenen Termine für deinen nächsten Einsatz aus.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {buddyTags.map((buddyTag) => (
                  <div
                    key={buddyTag.assignment_id}
                    className={`p-2.5 border-2 rounded-lg cursor-pointer transition-all relative min-h-[100px]
                                ${selectedBuddyTagId === buddyTag.assignment_id 
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md scale-105' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'}`}
                    onClick={() => handleBuddyTagSelect(buddyTag.assignment_id)}
                  >
                    <div className="flex flex-col relative">
                      <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                        {new Date(buddyTag.assignment.start_ts).toLocaleDateString('de-DE', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-1.5">
                        {buddyTag.assignment.location_text}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="relative inline-flex">
                          <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
                          <Badge className="relative text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
                            <span className="flex items-center">
                              {`${new Date(buddyTag.assignment.start_ts).getUTCHours().toString().padStart(2, '0')}:${new Date(buddyTag.assignment.start_ts).getUTCMinutes().toString().padStart(2, '0')}-${new Date(buddyTag.assignment.end_ts).getUTCHours().toString().padStart(2, '0')}:${new Date(buddyTag.assignment.end_ts).getUTCMinutes().toString().padStart(2, '0')}`}
                            </span>
                          </Badge>
                        </div>
                        {buddyTag.buddy_name && (
                          <Badge className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
                            <span className="flex items-center">Buddy: {buddyTag.buddy_name}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md"
                onClick={handleSubmitBuddyTag}
                disabled={selectedBuddyTagId === null}
              >
                <Check className="mr-2 h-4 w-4" /> Auswahl bestätigen
              </Button>
            </CardContent>
          </Card>
          ) : null
        ) : (
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="relative">
              {/* Outer glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 rounded-lg blur-sm opacity-75 animate-pulse"></div>
              
              {/* Main card */}
              <Card className="relative bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 border-0 shadow-xl overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-purple-500/20 to-pink-500/20 animate-pulse"></div>
                
                {/* Content */}
                <CardContent className="relative p-0">
                  <div className="text-center">
                    <div className="flex items-center justify-center h-[140px] w-full px-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
                        <div className="text-white">
                          <div className="text-lg font-semibold mb-2">✓ Buddy Tag bestätigt!</div>
                          <div className="text-sm">Dein Buddy Tag wurde erfolgreich bestätigt.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Assignment Selection Card - NEW FLOW */}
        {(() => {
          console.log('=== RENDER DECISION ===');
          console.log('processState.stage:', processState.stage);
          console.log('processState.invitedAssignments:', processState.invitedAssignments);
          console.log('hasAvailableAssignments:', hasAvailableAssignments);
          console.log('assignments:', assignments);
          return null;
        })()}
        {processState.stage === 'loading' ? (
          // Loading state
          <Card className="mb-6 border-dashed border-gray-400 dark:border-gray-600 shadow-sm">
            <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Prüfe Anfragen...</p>
                        </div>
            </CardContent>
          </Card>
        ) : processState.stage === 'idle' ? (
          // No invitations state
          <Card className="mb-6 border-dashed border-blue-400 dark:border-blue-600 shadow-sm">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <UserCheck className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Keine Einladungen verfügbar</p>
                      </div>
            </CardContent>
          </Card>
        ) : processState.stage === 'select_assignment' ? (
          // NEW: Assignment selection UI
          <Card className="mb-6 border-dashed border-blue-400 dark:border-blue-600 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-600 dark:text-gray-400 text-center">
                Suche dir <span className="text-gray-600 dark:text-gray-400">deinen</span> <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">nächsten Einsatz</span> <span className="text-gray-600 dark:text-gray-400">selber aus!</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-center">
                Wähle einen verfügbaren Einsatz für die kommenden Tage aus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="space-y-3 max-h-[280px] overflow-y-auto py-3 px-4 [&::-webkit-scrollbar]:hidden"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {processState.invitedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-2.5 border rounded-lg cursor-pointer transition-all relative min-h-[80px]
                                ${processState.selectedIds.includes(assignment.id) 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-105 z-10' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm z-0'}`}
                    onClick={() => handleNewAssignmentSelect(assignment.id)}
                  >
                    <button 
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-40 hover:opacity-100 transition-opacity"
                      onClick={(e) => handleAssignmentInfoClick(e, assignment)}
                      aria-label="Mehr Details"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <div className="flex flex-col">
                      <div className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
                        {assignment.date}
                    </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {assignment.location}
                  </div>
                        <div className="relative inline-flex">
                          <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
                          <Badge className="relative text-xs font-medium px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full text-[10px]">
                            <span className="flex items-center">{assignment.time}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                onClick={handleNewSubmitAssignments}
                disabled={processState.selectedIds.length === 0}
              >
                Auswählen
              </Button>
                </CardContent>
              </Card>
        ) : ['waiting', 'accepted', 'declined', 'partially_accepted'].includes(processState.stage) ? (
          // NEW: Status UI (waiting/accepted/declined)
          <Card className="mb-6 border-dashed border-blue-400 dark:border-blue-600 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-600 dark:text-blue-400 text-center text-lg">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Einsatz-Anfragen</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-center text-sm">
                {processState.stage === 'waiting' && "Du bist in der Warteschlange für diese Termine."}
                {processState.stage === 'accepted' && "Deine Einsätze wurden bestätigt!"}
                {processState.stage === 'declined' && "Leider war jemand schneller als du."}
                {processState.stage === 'partially_accepted' && "Einige deiner Einsätze wurden bestätigt."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {([...processState.waitingAssignments, ...processState.acceptedAssignments, ...processState.rejectedAssignments].length > 0) && (
                <div className="space-y-3">
                  {[...processState.waitingAssignments, ...processState.acceptedAssignments, ...processState.rejectedAssignments].map((assignment) => {
                  const isAccepted = processState.acceptedAssignments.some(a => a.id === assignment.id);
                  const isRejected = processState.rejectedAssignments.some(a => a.id === assignment.id);
                  const isWaiting = processState.waitingAssignments.some(a => a.id === assignment.id);
                  
                  return (
                    <div key={assignment.id} className="p-2.5 border rounded-lg relative min-h-[80px] border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col">
                        <div className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {assignment.date}
            </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {assignment.location}
          </div>
                          <div className="flex items-center space-x-2">
                            <div className="relative inline-flex">
                              <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
                              <Badge className="relative text-xs font-medium px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full text-[10px]">
                                <span className="flex items-center">{assignment.time}</span>
                              </Badge>
                            </div>
                            {isWaiting && (
                              <Loader2 className="h-4 w-4 text-orange-400 animate-spin" />
                            )}
                            {isAccepted && (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                            {isRejected && (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
              
              {/* Show replacement assignments if needed */}
              {(processState.stage === 'declined' || processState.stage === 'partially_accepted') && (
                <>
                  <Separator className="my-4" />
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {processState.rejectedAssignments.length > 0 
                      ? `Wähle ${processState.rejectedAssignments.length} Ersatztermin${processState.rejectedAssignments.length > 1 ? 'e' : ''}:`
                      : 'Wähle Ersatztermine aus:'}
                  </div>
                  {processState.replacementAssignments.length > 0 ? (
                    <div className="space-y-3">
                      {processState.replacementAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className={`p-2.5 border rounded-lg cursor-pointer transition-all relative min-h-[80px]
                                    ${processState.selectedIds.includes(assignment.id) 
                                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 shadow-md scale-105 z-10' 
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm z-0'}`}
                        onClick={() => handleNewAssignmentSelect(assignment.id)}
                      >
                        <div className="flex flex-col">
                          <div className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
                            {assignment.date}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {assignment.location}
                            </div>
                            <div className="relative inline-flex">
                              <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
                              <Badge className="relative text-xs font-medium px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full text-[10px]">
                                <span className="flex items-center">{assignment.time}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                                          ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                      Ersatztermine werden geladen...
                    </div>
                  )}
                </>
              )}
              
              {/* Action buttons */}
              {(processState.stage === 'accepted' || 
                (processState.stage === 'declined' && processState.replacementAssignments.length === 0) ||
                (processState.stage === 'partially_accepted' && processState.replacementAssignments.length === 0)) && (
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  onClick={handleNewAcknowledge}
                >
                  Verstanden
                </Button>
              )}
              
              {(processState.stage === 'declined' || processState.stage === 'partially_accepted') && 
               processState.replacementAssignments.length > 0 && (
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  onClick={handleNewSubmitReplacements}
                  disabled={processState.selectedIds.length === 0 || 
                           (processState.rejectedAssignments.length > 0 && 
                            processState.selectedIds.length !== processState.rejectedAssignments.length)}
                >
                  Auswählen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}
        
        {false ? ( // Disable old UI completely
          (() => {
            console.log('Assignment card should render:', {
              hasAvailableAssignments,
              isAssignmentCollapsed,
              selectedAssignmentIds,
              assignmentStatuses
            });
            return (
          <Card className="mb-6 border-dashed border-blue-400 dark:border-blue-600 shadow-sm">
            {!isAssignmentCollapsed ? (
            <>
              <CardHeader>
                <CardTitle className="text-gray-600 dark:text-gray-400 text-center">
                  Suche dir <span className="text-gray-600 dark:text-gray-400">deinen</span> <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">nächsten Einsatz</span> <span className="text-gray-600 dark:text-gray-400">selber aus!</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-center">Wähle einen verfügbaren Einsatz für die kommenden Tage aus.</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="space-y-3 max-h-[280px] overflow-y-auto py-3 px-4 [&::-webkit-scrollbar]:hidden"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {assignments.slice(0, 6).map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`p-2.5 border rounded-lg cursor-pointer transition-all relative min-h-[80px]
                                  ${selectedAssignmentIds.includes(assignment.id) 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-105 z-10' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm z-0'}`}
                      onClick={() => handleAssignmentSelect(assignment.id)}
                    >
                      <button 
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-40 hover:opacity-100 transition-opacity"
                        onClick={(e) => handleAssignmentInfoClick(e, assignment)}
                        aria-label="Mehr Details"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      <div className="flex flex-col">
                        <div className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {assignment.date}
                          {assignment.isBuddyTag && (
                            <span className="ml-2 text-xs font-normal text-purple-600 dark:text-purple-400">
                              Buddy mit {assignment.buddyName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {assignment.location}
                          </div>
                          <div className="relative inline-flex">
                            <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
                            <Badge className={`relative text-xs font-medium px-1.5 py-0.5 ${assignment.isBuddyTag ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white border-0 shadow-sm whitespace-nowrap rounded-full text-[10px]`}>
                              <span className="flex items-center">{assignment.time}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full mt-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                  onClick={handleSubmitAssignment}
                  disabled={selectedAssignmentIds.length === 0}
                >
                  <Check className="mr-2 h-4 w-4" /> Auswahl bestätigen
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-600 dark:text-blue-400 text-center text-lg">
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Einsatz-Anfragen</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-center text-sm">
                  {selectedAssignmentIds.every(id => assignmentStatuses[String(id)] === 'declined') 
                    ? "Leider war jemand schneller als du, suche dir bitte einen Ersatztermin aus."
                    : selectedAssignmentIds.some(id => assignmentStatuses[String(id)] === 'declined')
                    ? `Einige deiner Einsätze wurden abgelehnt. Suche dir bitte ${selectedAssignmentIds.filter(id => assignmentStatuses[String(id)] === 'declined').length} Ersatztermin${selectedAssignmentIds.filter(id => assignmentStatuses[String(id)] === 'declined').length > 1 ? 'e' : ''} aus.`
                    : selectedAssignmentIds.every(id => assignmentStatuses[String(id)] === 'confirmed')
                    ? "Deine Einsätze wurden bestätigt und sind jetzt in deinem Kalender sichtbar. Drücke 'Verstanden' um diese Aufgabe als erledigt zu markieren."
                    : "Du bist in der Warteschlange für diese Termine. Sobald sie vom Nespresso Team bestätigt sind, werden sie in deinem Kalender erscheinen."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {selectedAssignmentIds.length > 0 && selectedAssignmentIds.map((assignmentId) => {
                    // Look in both original and replacement assignments
                    let assignment = assignments.find(a => a.id === assignmentId);
                    if (!assignment) {
                      assignment = replacementAssignments.find(a => a.id === assignmentId);
                    }
                    const status = assignmentStatuses[String(assignmentId)] || 'pending';
                    if (!assignment) return null;
                    
                    return (
                      <div key={assignmentId} className="p-2.5 border rounded-lg relative min-h-[80px] border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col">
                          <div className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
                              {assignment.date}
                            {assignment.isBuddyTag && (
                              <span className="ml-2 text-xs font-normal text-purple-600 dark:text-purple-400">
                                Buddy mit {assignment.buddyName}
                              </span>
                            )}
                            </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                            {assignment.location}
                          </div>
                            <div className="flex items-center space-x-2">
                              <div className="relative inline-flex">
                                <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
                                <Badge className={`relative text-xs font-medium px-1.5 py-0.5 ${assignment.isBuddyTag ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white border-0 shadow-sm whitespace-nowrap rounded-full text-[10px]`}>
                                  <span className="flex items-center">{assignment.time}</span>
                                </Badge>
                        </div>
                          {status === 'pending' && (
                            <Loader2 className="h-4 w-4 text-orange-400 animate-spin" />
                          )}
                          {status === 'confirmed' && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                          {status === 'declined' && (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Replacement Assignment Selection - Integrated */}
                {(() => {
                  const hasDeclined = selectedAssignmentIds.some(id => assignmentStatuses[String(id)] === 'declined');
                  console.log('Replacement UI check:', {
                    showReplacementAssignments,
                    selectedAssignmentIds,
                    assignmentStatuses,
                    hasDeclined,
                    replacementCount: replacementAssignments.length
                  });
                  return showReplacementAssignments && hasDeclined;
                })() && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Ersatztermine auswählen</span>
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Wähle {selectedAssignmentIds.filter(id => assignmentStatuses[String(id)] === 'declined').length} Ersatztermin{selectedAssignmentIds.filter(id => assignmentStatuses[String(id)] === 'declined').length > 1 ? 'e' : ''} aus ({selectedReplacementIds.length}/{selectedAssignmentIds.filter(id => assignmentStatuses[String(id)] === 'declined').length} ausgewählt)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {replacementAssignments.map((assignment) => {
                        const maxReplacements = selectedAssignmentIds.filter(id => assignmentStatuses[String(id)] === 'declined').length;
                        const isSelected = selectedReplacementIds.includes(assignment.id);
                        const isDisabled = !isSelected && selectedReplacementIds.length >= maxReplacements;
                        
                        return (
                        <div
                          key={assignment.id}
                          className={`p-2.5 border rounded-lg transition-all relative min-h-[80px]
                                      ${isSelected 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-[1.02] z-10 cursor-pointer' 
                                        : isDisabled
                                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-50 cursor-not-allowed z-0'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm z-0 cursor-pointer'}`}
                          onClick={() => !isDisabled && handleReplacementSelect(assignment.id)}
                        >
                          <button 
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-40 hover:opacity-100 transition-opacity"
                            onClick={(e) => handleAssignmentInfoClick(e, assignment)}
                            aria-label="Mehr Details"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          <div className="flex flex-col">
                            <div className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
                              {assignment.date}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {assignment.location}
                              </div>
                              <div className="relative inline-flex">
                                <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
                                <Badge className="relative text-xs font-medium px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full text-[10px]">
                                  <span className="flex items-center">{assignment.time}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    
                    <Button 
                      className="w-full mt-3 text-white transition-all duration-300 hover:scale-[1.01]"
                      style={{
                        background: 'linear-gradient(135deg, #22C55E, #105F2D)'
                      }}
                      onClick={handleSubmitReplacement}
                      disabled={selectedReplacementIds.length === 0}
                    >
                      <Check className="mr-2 h-3 w-3" /> Auswählen
                    </Button>
                  </div>
                )}
                

                
                {/* Show "Verstanden" button only when all assignments are confirmed */}
                {selectedAssignmentIds.every(id => assignmentStatuses[String(id)] === 'confirmed') && 
                 !showReplacementAssignments && (
                  <Button 
                    className="w-full mt-4 text-white transition-all duration-300 hover:scale-[1.01]"
                    style={{
                      background: 'linear-gradient(135deg, #22C55E, #105F2D)'
                    }}
                    onClick={async () => {
                      // Mark ALL assignments in the process as acknowledged
                      try {
                        // Get all assignment IDs from the process state
                        const allAssignmentIds = [
                          ...processState.waitingAssignments.map(a => a.id),
                          ...processState.acceptedAssignments.map(a => a.id),
                          ...processState.rejectedAssignments.map(a => a.id)
                        ];
                        console.log('Acknowledging all assignments in process:', allAssignmentIds);
                        
                        await Promise.all(
                          allAssignmentIds.map(id => 
                            fetch(`/api/assignments/${id}/invites/acknowledge`, {
                              method: 'POST',
                              credentials: 'include'
                            })
                          )
                        );
                      } catch (error) {
                        console.error('Error acknowledging assignments:', error);
                      }
                      
                      // Clear process in database
                      try {
                        await fetch('/api/assignments/process', {
                          method: 'DELETE',
                          credentials: 'include'
                        });
                      } catch (error) {
                        console.error('Error clearing process:', error);
                      }
                      
                      // Immediately clear critical state to stop all processes
                      setShowAssignmentConfirmation(true);
                      setIsAssignmentCollapsed(false); // This stops the status checking
                      setShowReplacementAssignments(false); // Prevent replacement UI
                      setProcessCompleted(true); // Mark process as complete
                      
                      // After showing confirmation, clear ALL remaining state
                      setTimeout(() => {
                        // Clear ALL assignment-related state
                        setSelectedAssignmentIds([]);
                        setAssignmentStatuses({});
                        setAssignments([]);
                        setHasAvailableAssignments(false);
                        setSelectedReplacementIds([]);
                        setReplacementStatuses({});
                        setReplacementAssignments([]); // Clear replacement data
                        setShowAssignmentConfirmation(false);
                        
                        // Reset process to idle
                        setCurrentProcess({
                          originalIds: [],
                          replacementIds: [],
                          stage: 'idle'
                        });
                        
                        // Reset process completed flag after everything is cleared
                        // This allows new invitations to be loaded
                        setProcessCompleted(false);
                      }, 5000); // Show confirmation for 5 seconds
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" /> Verstanden
                  </Button>
                )}
                

              </CardContent>
            </>
          )}
          </Card>
            );
          })()
        ) : null}



        {/* Health Status Card - Always show this card */}
        <Card className="mb-6 border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button 
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors relative ${
                activeTab === "krankheit" 
                  ? "text-red-600 dark:text-red-400 bg-gradient-to-t from-rose-50/50 to-transparent dark:from-rose-900/10 dark:to-transparent" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("krankheit")}
            >
              <div className="flex items-center justify-center">
                <Thermometer className="h-4 w-4 mr-2 ml-0.5" />
                Krankheit

              </div>
              {activeTab === "krankheit" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-red-600 to-rose-600"></div>
              )}
            </button>
            <button 
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors relative ${
                activeTab === "notfall" 
                  ? "text-orange-600 dark:text-orange-400 bg-gradient-to-t from-orange-50/50 to-transparent dark:from-orange-900/10 dark:to-transparent" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("notfall")}
            >
              <div className="flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-2 ml-0.5" />
                Notfall
              </div>
              {activeTab === "notfall" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
              )}
            </button>
          </div>
          
          <CardContent className={`p-4 ${activeTab === "krankheit" ? "bg-gradient-to-b from-rose-50/60 to-white dark:from-rose-900/10 dark:to-transparent" : "bg-gradient-to-b from-orange-50/60 to-white dark:from-orange-900/10 dark:to-transparent"}`}>
            {activeTab === "krankheit" && (
              <div className="bg-white/80 dark:bg-gray-900/30 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-3 justify-center">
                  <Thermometer className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Krankenstand-Center</h3>
                  </div>
                
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3 mb-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-center">
                    <p className="mb-2 text-sm whitespace-nowrap">Bei Krankheit ruf bitte diese Nummer an:</p>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Mo-Do 7:30-17:00</div>
                      <div>Fr 7:30-14:00</div>
                      <div>Sa 9:00-12:00</div>
                        </div>
                            </div>
                  <a 
                    href="tel:+43699141630" 
                    className="flex items-center justify-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-rose-100 dark:border-rose-800/50 mb-1.5 hover:bg-rose-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium text-base text-red-600 dark:text-red-400">+43 699 141 630</span>
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Nachdem du angerufen hast, drücke den Button, um einen Krankenstand zu beantragen.
                  </p>
                            </div>
                            
                {activeSpecialStatus?.is_active && activeSpecialStatus?.status_type === 'krankenstand' ? (
                  <div className="space-y-3">
                    <div className="w-full py-2 px-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium rounded-lg shadow-md flex items-center justify-center text-sm">
                      <div className="flex items-center">
                        <div className="relative mr-2">
                          <div className="absolute inset-0 rounded-full bg-green-200 dark:bg-green-700 animate-ping opacity-50"></div>
                          <CheckCircle2 className="h-4 w-4 relative" />
                        </div>
                        <span>Aktiver Krankenstand</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={endActiveSpecialStatus}
                      className="w-full py-2 px-3 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center text-sm"
                    >
                      <Thermometer className="h-4 w-4 mr-1.5" />
                      Krankenstand beenden
                    </button>
                  </div>
                ) : !isWaitingForSickConfirmation ? (
        <button 
                    className="w-full py-2 px-3 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center text-sm"
                    onClick={() => {
                      setIsWaitingForSickConfirmation(true);
                      createSpecialStatusRequest('krankenstand');
                    }}
        >
                    <Thermometer className="h-4 w-4 mr-1.5" />
                    Krankenstand anfordern
        </button>
                ) : (
                  <div className="space-y-3">
                    <div className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 font-medium rounded-lg shadow-md flex items-center justify-center text-sm">
                            <div className="flex items-center">
                        <span>Warten auf Bestätigung</span>
                        <span className="ml-1.5 flex">
                          <span className="animate-bounce mx-0.5 delay-0">.</span>
                          <span className="animate-bounce mx-0.5 delay-100">.</span>
                          <span className="animate-bounce mx-0.5 delay-200">.</span>
                        </span>
                              </div>
                      </div>
                      

                  </div>
                )}
              </div>
            )}
            
            {activeTab === "notfall" && (
              <div className="bg-white/80 dark:bg-gray-900/30 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-3 justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                  <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Notfall-Center</h3>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-center">
                    <p className="mb-2">Im Notfall ruf bitte diese Nummer an:</p>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Mo-Do 7:30-17:00</div>
                      <div>Fr 7:30-14:00</div>
                      <div>Sa 9:00-12:00</div>
                    </div>
                  </div>
                  <a 
                    href="tel:+43699141630" 
                    className="flex items-center justify-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-orange-100 dark:border-orange-800/50 mb-1.5 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium text-base text-orange-600 dark:text-orange-400">+43 699 141 630</span>
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Nachdem du angerufen hast, drücke den Button, um einen Notfall zu beantragen.
                  </p>
                </div>
                
                {activeSpecialStatus?.is_active && activeSpecialStatus?.status_type === 'notfall' ? (
                  <div className="space-y-3">
                    <div className="w-full py-2 px-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium rounded-lg shadow-md flex items-center justify-center text-sm">
                      <div className="flex items-center">
                        <div className="relative mr-2">
                          <div className="absolute inset-0 rounded-full bg-green-200 dark:bg-green-700 animate-ping opacity-50"></div>
                          <CheckCircle2 className="h-4 w-4 relative" />
                        </div>
                        <span>Aktiver Notfall</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={endActiveSpecialStatus}
                      className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg shadow-md transition-colors flex items-center justify-center text-sm"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1.5" />
                      Notfall beenden
                    </button>
                  </div>
                ) : !isWaitingForEmergencyConfirmation ? (
                  <button 
                    className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg shadow-md transition-colors flex items-center justify-center text-sm"
                    onClick={() => {
                      setIsWaitingForEmergencyConfirmation(true);
                      createSpecialStatusRequest('notfall');
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    Notfall anfordern
                  </button>
                ) : (
                  <div className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-800 text-orange-600 dark:text-orange-400 font-medium rounded-lg shadow-md flex items-center justify-center text-sm">
                    <div className="flex items-center">
                      <span>Warten auf Bestätigung</span>
                      <span className="ml-1.5 flex">
                        <span className="animate-bounce mx-0.5 delay-0">.</span>
                        <span className="animate-bounce mx-0.5 delay-100">.</span>
                        <span className="animate-bounce mx-0.5 delay-200">.</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment Ordering Card */}
        <Card className="mb-6 border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
            <CardTitle className="text-lg flex items-center">
              <Box className="mr-2 h-5 w-5" />
              Equipment bestellen
            </CardTitle>
            <CardDescription className="text-green-100">
              Bestelle Artikel für deinen nächsten Einsatz
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4">
            {equipmentOrderStep === "list" ? (
              <div className="space-y-3 h-64 overflow-y-auto">
                {equipmentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedEquipment(item);
                      setEquipmentOrderStep("confirm");
                    }}
                  >
                    {/* Placeholder image container */}
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    
                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    
                    {/* Arrow indicator */}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected item display */}
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedEquipment?.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedEquipment?.description}
                    </p>
                  </div>
                </div>
                
                {/* Quantity selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Anzahl
                  </label>
                  <div className="flex items-center justify-center space-x-6">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEquipmentQuantity(Math.max(1, equipmentQuantity - 1))}
                      disabled={equipmentQuantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      type="number"
                      min="1"
                      value={equipmentQuantity}
                      onChange={(e) => setEquipmentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-lg font-medium w-16 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEquipmentQuantity(equipmentQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex space-x-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEquipmentOrderStep("list");
                      setSelectedEquipment(null);
                      setEquipmentQuantity(1);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Zurück
                  </Button>
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      // Handle order submission here
                      console.log(`Ordered ${equipmentQuantity}x ${selectedEquipment?.name}`);
                      // Reset to list view
                      setEquipmentOrderStep("list");
                      setSelectedEquipment(null);
                      setEquipmentQuantity(1);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Bestellen
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anstehende Einsätze with Rotating Calendar - REMOVED (belongs only on main dashboard) */}

        {/* Quick Actions - REMOVED (belongs only on main dashboard) */}



      {/* Details Modal */}
      {showDetailsModal && (selectedProposal || selectedAssignment) && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-[70] p-0 w-96 overflow-hidden">
            {/* Header section */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
              <h3 className="text-lg font-medium flex items-center">
                <Briefcase className="h-5 w-5 mr-2" /> Einsatz Details
              </h3>
              <p className="text-sm text-blue-100 mt-1">
                {selectedProposal ? selectedProposal.date.split(' ')[0] + ' ' + selectedProposal.date.split(' ')[1] : selectedAssignment?.date} 
                <span className="relative inline-flex ml-1">
                <div className="absolute inset-0 bg-white dark:bg-white opacity-15 rounded-full"></div>
                  <span className="relative px-2 py-0.5 rounded-full">
                    {selectedProposal ? selectedProposal.date.split(' ')[2] : selectedAssignment?.time}
                  </span>
                </span>
              </p>
            </div>
            
            {/* Content section */}
            <div className="p-4 space-y-4">
              {/* Market name */}
              <div className="mb-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedProposal ? selectedProposal.location : selectedAssignment?.location}
                </h4>
                <p 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mt-1 flex items-center"
                  onClick={() => handleAddressClick(selectedProposal ? selectedProposal.location : selectedAssignment?.location || '')}
                >
                  <MapPin className="h-4 w-4 mr-1.5 text-blue-500" />
                  {selectedProposal ? selectedProposal.location : selectedAssignment?.location}
                </p>
              </div>
              
              {/* Buddy pill - only show for proposals */}
              {selectedProposal && (
              <div className="flex items-center mt-3">
                <Badge className="text-xs font-medium px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md whitespace-nowrap rounded-full">
                  <span className="flex items-center">Buddy: Cesira</span>
                </Badge>
              </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Schließen
              </button>
            </div>
          </div>
        </>
      )}

      {/* Doctor Note Upload Modal */}
      {showDoctorNoteUpload && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            onClick={() => setShowDoctorNoteUpload(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 w-[90vw] max-w-md overflow-hidden">
            {/* Header with red gradient */}
            <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white p-6">
              <button 
                onClick={() => setShowDoctorNoteUpload(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-1">Krankenbestätigung</h2>
                <p className="text-red-100 text-sm">Füge deine ärztliche Krankenbestätigung hinzu</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {!doctorNoteUploaded ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    Wähle eine Option, um deine Krankenbestätigung hinzuzufügen:
                  </p>
                  
                  <div className="flex flex-col space-y-3">
              <Button 
                      onClick={() => setDoctorNoteUploaded(true)}
                      className="w-full py-3 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Mit Kamera aufnehmen
                    </Button>
                    
                    <Button 
                      onClick={() => setDoctorNoteUploaded(true)}
                variant="outline"
                      className="w-full py-3 border-rose-200 dark:border-rose-700 text-red-600 dark:text-red-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium rounded-lg shadow-md transition-all flex items-center justify-center"
              >
                      <Image className="h-5 w-5 mr-2" />
                      Aus Galerie wählen
              </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Erfolgreich hochgeladen
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Deine Krankenbestätigung wurde erfolgreich übermittelt.
                    </p>
                  </div>
              <Button 
                    onClick={() => setShowDoctorNoteUpload(false)}
                    className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Schließen
              </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Early Start Reason Modal */}
      {showEarlyStartModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            onClick={() => setShowEarlyStartModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 w-[90vw] max-w-md overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                  <button 
                onClick={() => setShowEarlyStartModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
                  </button>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  <Clock className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-1">Früher Start</h2>
                <p className="text-blue-100 text-sm">Du startest {minutesEarly} Minuten vor der geplanten Zeit</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grund für den frühen Start
                </label>
                <Textarea
                  value={earlyStartReason}
                  onChange={(e) => setEarlyStartReason(e.target.value)}
                  placeholder="Bitte gib einen Grund für den frühen Start an..."
                  className="w-full min-h-[100px] resize-none border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>
                
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowEarlyStartModal(false)}
                  className="flex-1 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleEarlyStartSubmit}
                  disabled={!earlyStartReason.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Einsatz starten
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Early End Reason Modal */}
      {showEarlyEndModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            onClick={() => setShowEarlyEndModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 w-[90vw] max-w-md overflow-hidden">
            {/* Header with red gradient */}
            <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white p-6">
                  <button
                onClick={() => setShowEarlyEndModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
                  </button>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  <StopCircle className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-1">Früher Abschluss</h2>
                <p className="text-red-100 text-sm">Du beendest {minutesEarlyEnd} Minuten vor der geplanten Zeit</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grund für das frühe Ende
                </label>
                <Textarea
                  value={earlyEndReason}
                  onChange={(e) => setEarlyEndReason(e.target.value)}
                  placeholder="Bitte gib einen Grund für das frühe Ende an..."
                  className="w-full min-h-[100px] resize-none border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowEarlyEndModal(false)}
                  className="flex-1 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleEarlyEndSubmit}
                  disabled={!earlyEndReason.trim()}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
                  Einsatz beenden
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Maps Modal (copied from dashboard) */}
      {showMapsModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-sm" // Ensure modal overlay is above footer but below modal content
            onClick={() => setShowMapsModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-[70] p-4 w-72">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">Wegbeschreibung zu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedAddress}</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={openInGoogleMaps}
                className="flex items-center justify-center py-2.5 px-3 bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <img src="/icons/google-maps-icon.svg" alt="Google Maps" width={20} height={20} className="mr-2"/>
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">Google Maps</span>
              </button>
              <button 
                onClick={openInAppleMaps}
                className="flex items-center justify-center py-2.5 px-3 bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                 <img src="/icons/apple-maps-icon.svg" alt="Apple Maps" width={20} height={20} className="mr-2"/>
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">Apple Maps</span>
              </button>
            </div>
            <button 
              onClick={() => setShowMapsModal(false)}
              className="w-full mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-200"
            >
              Abbrechen
            </button>
          </div>
        </>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[90vw] max-w-md overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  📸
                </div>
                <h2 className="text-xl font-bold mb-1">{getPhotoTypeTitle(photoUploadStep)}</h2>
                <p className="text-blue-100 text-sm">Schritt {photoUploadStep}/3</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Bitte machen Sie ein Foto von {getPhotoTypeTitle(photoUploadStep).toLowerCase()}
                  </p>
                </div>
                
                {/* Photo Upload Area */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePhotoUpload(file);
                      }
                    }}
                    className="hidden"
                    id="photo-upload"
                    disabled={isUploadingPhoto}
                  />
                  <label 
                    htmlFor="photo-upload" 
                    className={`cursor-pointer ${isUploadingPhoto ? 'opacity-50' : ''}`}
                  >
                    {isUploadingPhoto ? (
                      <div className="space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-4xl">📸</div>
                        <p className="text-sm text-gray-600">Tippen zum Foto machen</p>
                      </div>
                    )}
                  </label>
                </div>
                
                {/* Progress Indicator */}
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-3 h-3 rounded-full ${
                        step < photoUploadStep 
                          ? 'bg-green-500'  // Completed steps
                          : step === photoUploadStep 
                          ? 'bg-blue-500'   // Current step
                          : 'bg-gray-300'   // Future steps
                      }`}
                    />
                  ))}
                </div>
                
                {photoUploadStep > 1 && (
                  <button
                    onClick={() => setPhotoUploadStep(prev => (prev - 1) as 1 | 2 | 3)}
                    className="w-full mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-200"
                    disabled={isUploadingPhoto}
                  >
                    Zurück zum vorherigen Foto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 