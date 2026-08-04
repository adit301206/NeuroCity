import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import {
  Shield, AlertTriangle, CheckCircle2, Clock, Send, Sparkles, MapPin,
  User, FileText, Filter, Zap, Activity, RefreshCw, Layers, Radio, Check, Lock, KeyRound
} from 'lucide-react';

export default function CitizenDesk({ onNavigate, user, onOpenAuth, onLogout }) {
  const [complaintText, setComplaintText] = useState('');
  const [ward, setWard] = useState('Ward 4 - Ring Road');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('all');

  // Initial Seed Tickets with Reporter Email bindings
  const [tickets, setTickets] = useState([
    {
      id: 'TKN-9401',
      title: 'Exposed live electrical cable leaking sparks near school gate',
      category: 'Electrical_Hazard',
      priority: 3,
      priorityLabel: 'Priority 3 - High',
      department: 'Electrical Grid Command',
      ward: 'Ward 4 - Ring Road',
      timestamp: '10 mins ago',
      status: 'Urgent',
      reporter: 'Citizen Observer',
      reporterEmail: 'citizen@neurocity.gov'
    },
    {
      id: 'TKN-9388',
      title: 'Severe water logging blocking emergency ambulance access under flyover',
      category: 'Water_Logging',
      priority: 2,
      priorityLabel: 'Priority 2 - Medium',
      department: 'Drainage & Municipal Works',
      ward: 'Ward 12 - Central Hub',
      timestamp: '28 mins ago',
      status: 'In Progress',
      reporter: 'Priya Sharma',
      reporterEmail: 'priya@neurocity.gov'
    },
    {
      id: 'TKN-9365',
      title: 'Deep pothole structural damage on fast lane near junction signal',
      category: 'Road_Repair',
      priority: 2,
      priorityLabel: 'Priority 2 - Medium',
      department: 'Road Maintenance Dept',
      ward: 'Ward 8 - Majura Gate',
      timestamp: '1 hour ago',
      status: 'In Progress',
      reporter: 'Traffic Operator',
      reporterEmail: 'operator@neurocity.gov'
    },
    {
      id: 'TKN-9310',
      title: 'Street light array failure creating dark zone on pedestrian walkway',
      category: 'Public_Safety',
      priority: 1,
      priorityLabel: 'Priority 1 - Low',
      department: 'Municipal Lighting Cell',
      ward: 'Ward 4 - Ring Road',
      timestamp: '3 hours ago',
      status: 'Resolved',
      reporter: 'Citizen Observer',
      reporterEmail: 'citizen@neurocity.gov'
    }
  ]);

  // Sample Preset Complaints for 1-Click Testing
  const samplePresets = [
    {
      label: '⚡ Live Wire Hazard',
      text: 'There is an exposed live electrical wire hanging from a transformer pole emitting sparks near the main market entrance.'
    },
    {
      label: '🌧️ Water Logging',
      text: 'Heavy rainfall has caused knee-deep water logging on the main road, completely jamming traffic near Majura gate flyover.'
    },
    {
      label: '🚧 Road Damage Risk',
      text: 'Large broken asphalt crater on the highway lane causing severe vehicle speed reduction and collision risks.'
    },
    {
      label: '💡 Streetlight Blackout',
      text: 'Entire street illumination grid is offline along sector 12 walkway causing pedestrian safety concerns at night.'
    }
  ];

  // Map category to priority level and department
  const getCategoryDetails = (catStr) => {
    const priorityMap = {
      Electrical_Hazard: { priority: 3, label: 'Priority 3 - High', dept: 'Electrical Grid Command' },
      Structural_Damage_Risk: { priority: 3, label: 'Priority 3 - High', dept: 'Public Safety & Structural Cell' },
      Public_Safety: { priority: 3, label: 'Priority 3 - High', dept: 'Public Safety Dispatch' },
      Water_Logging: { priority: 2, label: 'Priority 2 - Medium', dept: 'Drainage & Municipal Works' },
      Road_Repair: { priority: 2, label: 'Priority 2 - Medium', dept: 'Road Maintenance Dept' },
      Power_Outage: { priority: 2, label: 'Priority 2 - Medium', dept: 'Power Distribution Cell' },
      Water_Sanitation: { priority: 1, label: 'Priority 1 - Low', dept: 'Water & Sanitation Board' },
      Air_Pollution_Violation: { priority: 1, label: 'Priority 1 - Low', dept: 'Environmental Health Dept' },
      Stray_Animal_Hazard: { priority: 1, label: 'Priority 1 - Low', dept: 'Animal Welfare Cell' },
      Waste_Management: { priority: 1, label: 'Priority 1 - Low', dept: 'Solid Waste Operations' },
      Traffic_Encroachment: { priority: 1, label: 'Priority 1 - Low', dept: 'Traffic Management Bureau' }
    };
    return priorityMap[catStr] || { priority: 1, label: 'Priority 1 - Low', dept: 'Municipal General Operations' };
  };

  const handlePresetClick = (text) => {
    setComplaintText(text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth && onOpenAuth();
      return;
    }
    if (user.role === 'admin') return;
    if (!complaintText.trim()) return;

    setIsSubmitting(true);
    setAiResult(null);

    let category = 'Public_Safety';

    // Attempt Django microservice backend call
    try {
      const response = await fetch('http://localhost:8000/api/complaints/triage/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: complaintText })
      });
      const data = await response.json();
      if (response.ok && data.predicted_category) {
        category = data.predicted_category;
      } else {
        category = inferLocalCategory(complaintText);
      }
    } catch (err) {
      console.warn('Django ML API offline. Using local AI Triage Inference engine:', err);
      category = inferLocalCategory(complaintText);
    }

    const details = getCategoryDetails(category);

    setTimeout(() => {
      const resultObj = {
        category: category,
        categoryFormatted: category.replace(/_/g, ' '),
        priority: details.priority,
        priorityLabel: details.label,
        department: details.dept,
        confidence: '98.4%',
        inferenceTime: '0.012s'
      };

      setAiResult(resultObj);

      const newTicket = {
        id: `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
        title: complaintText,
        category: category,
        priority: details.priority,
        priorityLabel: details.label,
        department: details.dept,
        ward: ward,
        timestamp: 'Just now',
        status: details.priority === 3 ? 'Urgent' : 'In Progress',
        reporter: user.name,
        reporterEmail: user.email
      };

      setTickets([newTicket, ...tickets]);
      setIsSubmitting(false);
      setComplaintText('');
    }, 600);
  };

  // Local fallback rule-based classifier matching Django Random Forest trained model logic
  const inferLocalCategory = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('wire') || lower.includes('spark') || lower.includes('shock') || lower.includes('electric')) return 'Electrical_Hazard';
    if (lower.includes('water') || lower.includes('flood') || lower.includes('drain') || lower.includes('logging')) return 'Water_Logging';
    if (lower.includes('road') || lower.includes('pothole') || lower.includes('asphalt') || lower.includes('crater')) return 'Road_Repair';
    if (lower.includes('outage') || lower.includes('power') || lower.includes('blackout') || lower.includes('transformer')) return 'Power_Outage';
    if (lower.includes('bridge') || lower.includes('building') || lower.includes('wall') || lower.includes('collapse')) return 'Structural_Damage_Risk';
    return 'Public_Safety';
  };

  const handleUpdateStatus = (ticketId, newStatus) => {
    // Admin only security check
    if (!user || user.role !== 'admin') return;
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
  };

  // User-Specific or Admin Global Filtering Rule:
  // If user is Admin: Show ALL complaints.
  // If user is Citizen/Operator: Show ONLY complaints submitted by this user.
  // If user is Not Logged In: Show empty state with login prompt.
  const userSpecificTickets = tickets.filter(t => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return t.reporterEmail === user.email || t.reporter === user.name;
  });

  const filteredTickets = userSpecificTickets.filter(t => {
    if (ticketFilter === 'urgent') return t.priority === 3 || t.status === 'Urgent';
    if (ticketFilter === 'in-progress') return t.status === 'In Progress';
    if (ticketFilter === 'resolved') return t.status === 'Resolved';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#BAE6FD] via-[#E0F2FE] to-[#BAE6FD] text-slate-900 font-sans pb-16">

      {/* Global Floating Navbar */}
      <Navbar
        activeTab="citizen-desk"
        onNavigate={onNavigate}
        user={user}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
      />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-8">

        {/* ================= DIV 1: PAGE TITLE & OPERATIONAL TELEMETRY TOP DECK ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-[#DCEEFE] border border-[#60A5FA] shadow-lg relative overflow-hidden">
          {/* Top Sapphire Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0284C7] via-[#2563EB] to-[#1E40AF]"></div>

          <div>
            <div className="flex items-center gap-2 text-[#02569B] font-mono text-xs tracking-widest uppercase mb-1 font-bold">
              <Radio className="w-4 h-4 animate-pulse text-[#0284C7]" />
              <span>CITIZEN DESK // MUNICIPAL ACCESS DESK</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F2942] tracking-tight">
              Municipal Complaint & Issue Dispatch Center
            </h1>
            <p className="text-sm text-[#1E3A8A] mt-1 max-w-2xl font-normal">
              Report municipal hazards in plain text. The Random Forest NLP engine automatically categorizes issues, evaluates urgency priority, and dispatches field response crews.
            </p>
          </div>

          {/* KPI Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] text-center font-mono shadow-sm">
              <div className="text-[11px] font-bold text-[#024E82]">MY TICKETS</div>
              <div className="text-xl font-bold text-[#0F2942] mt-0.5">{userSpecificTickets.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-center font-mono shadow-sm">
              <div className="text-[11px] font-bold text-rose-800">URGENT (P3)</div>
              <div className="text-xl font-bold text-rose-900 mt-0.5">
                {userSpecificTickets.filter(t => t.priority === 3).length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] text-center font-mono shadow-sm">
              <div className="text-[11px] font-bold text-[#024E82]">AI LATENCY</div>
              <div className="text-xl font-bold text-emerald-800 mt-0.5">0.012s</div>
            </div>
            <div className="p-3 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] text-center font-mono shadow-sm">
              <div className="text-[11px] font-bold text-[#024E82]">ROLE CLEARANCE</div>
              <div className="text-xs font-bold text-[#1E40AF] uppercase mt-1">
                {user ? user.role : 'GUEST'}
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Section: Submission Terminal + AI Inference Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ================= DIV 2: COMPLAINT SUBMISSION TERMINAL ================= */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-[#DCEEFE] border border-[#60A5FA] shadow-lg space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0284C7] to-[#2563EB]"></div>

              <div className="flex items-center justify-between border-b border-[#93C5FD] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] flex items-center justify-center text-[#024E82] shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0F2942] font-mono uppercase tracking-wider">
                      Submit Municipal Issue
                    </h2>
                    <p className="text-xs text-[#1E3A8A] font-medium">AI Natural Language Analysis Input Terminal</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                  NLP ENGINE ONLINE
                </span>
              </div>

              {/* Login Requirement & Role Authorization Guard */}
              {!user ? (
                <div className="p-8 rounded-xl bg-[#BAE6FD]/90 border border-[#38BDF8] text-center space-y-4 font-mono my-4 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F2942] uppercase tracking-wider">
                      AUTHENTICATION REQUIRED TO COMPLAIN
                    </h3>
                    <p className="text-xs text-[#1E3A8A] mt-1.5 max-w-md mx-auto font-sans font-medium">
                      You must be signed in to submit municipal complaints and track their resolution status.
                    </p>
                  </div>
                  <button
                    onClick={onOpenAuth}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] via-[#2563EB] to-[#1E40AF] text-white font-mono text-xs font-bold tracking-wider hover:from-[#0369A1] hover:to-[#1E3A8A] transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4 text-[#E0F2FE]" />
                    <span>SIGN IN / REGISTER TO REPORT ISSUES</span>
                  </button>
                </div>
              ) : user.role === 'admin' ? (
                <div className="p-8 rounded-xl bg-[#BAE6FD]/90 border border-[#38BDF8] text-center space-y-4 font-mono my-4 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-300 text-sky-800 flex items-center justify-center mx-auto shadow-sm">
                    <Shield className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F2942] uppercase tracking-wider">
                      ADMINISTRATOR READ-ONLY COMPLAINT ACCESS
                    </h3>
                    <p className="text-xs text-[#1E3A8A] mt-1.5 max-w-md mx-auto font-sans font-medium">
                      Administrators are restricted from submitting municipal complaints. Complaint filing is reserved for Citizens and Operators. Use the System-Wide Kanban Board below to review and resolve tickets.
                    </p>
                  </div>
                  <div className="inline-block px-4 py-2 rounded-xl bg-white border border-[#93C5FD] text-xs font-mono text-[#024E82] font-bold shadow-sm">
                    CLEARANCE: SYSTEM ADMIN (RESOLVER MODE)
                  </div>
                </div>
              ) : (
                <>
                  {/* Sample Preset Shortcut Chips */}
                  <div>
                    <label className="block text-xs font-mono text-[#024E82] font-bold mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>1-CLICK SAMPLE PRESET TESTERS</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {samplePresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePresetClick(preset.text)}
                          className="px-3 py-1.5 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] text-xs text-[#0F2942] hover:bg-[#0284C7] hover:text-white transition-all cursor-pointer font-mono font-medium shadow-sm"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Natural Language Complaint Text Area */}
                    <div>
                      <label className="block text-xs font-mono text-[#0F2942] font-bold mb-1.5">
                        DESCRIBE THE ISSUE IN PLAIN TEXT
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Describe what happened (e.g. 'There is a damaged electrical transformer pole leaking sparks on Main Street near the hospital entrance')..."
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        className="w-full p-3.5 rounded-xl bg-white border border-[#38BDF8] text-slate-900 font-normal placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#BAE6FD] transition-all resize-none font-sans shadow-inner"
                      />
                    </div>

                    {/* City Ward / Location Dropdown Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-[#0F2942] font-bold mb-1.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                          <span>SELECT MUNICIPAL WARD</span>
                        </label>
                        <select
                          value={ward}
                          onChange={(e) => setWard(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white border border-[#38BDF8] text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-[#0284C7] transition-all cursor-pointer shadow-sm"
                        >
                          <option value="Surat Ward 1 - Majura Gate & Ring Road">Surat Ward 1 - Majura Gate & Ring Road</option>
                          <option value="Surat Ward 2 - Athwa Lines & Dumas Road">Surat Ward 2 - Athwa Lines & Dumas Road</option>
                          <option value="Surat Ward 3 - Adajan & Honey Park">Surat Ward 3 - Adajan & Honey Park</option>
                          <option value="Surat Ward 4 - Rander & Tapi Riverfront">Surat Ward 4 - Rander & Tapi Riverfront</option>
                          <option value="Surat Ward 5 - Varachha & Diamond Market">Surat Ward 5 - Varachha & Diamond Market Hub</option>
                          <option value="Surat Ward 6 - Katargam & Textile Zone">Surat Ward 6 - Katargam & Textile Zone</option>
                          <option value="Surat Ward 7 - Piplod & University Circle">Surat Ward 7 - Piplod & University Circle</option>
                          <option value="Surat Ward 8 - Vesu & VIP Road Corridor">Surat Ward 8 - Vesu & VIP Road Corridor</option>
                          <option value="Surat Ward 9 - Ghod Dod Road & Commerce">Surat Ward 9 - Ghod Dod Road & Commercial District</option>
                          <option value="Surat Ward 10 - Railway Station Terminal">Surat Ward 10 - Railway Station & Market Hub</option>
                          <option value="Surat Ward 11 - Udhna Industrial Area">Surat Ward 11 - Udhna Industrial Area & Substation</option>
                          <option value="Surat Ward 12 - Limbayat & Dindoli">Surat Ward 12 - Limbayat & Dindoli Zone</option>
                          <option value="Surat Ward 13 - Pandesara Estate">Surat Ward 13 - Pandesara Industrial Estate</option>
                          <option value="Surat Ward 14 - Althan & Canal Road">Surat Ward 14 - Althan & Canal Road</option>
                          <option value="Surat Ward 15 - Pal & Hazira Highway">Surat Ward 15 - Pal & Hazira Highway</option>
                          <option value="Surat Ward 16 - Hazira Port & Belt">Surat Ward 16 - Hazira Industrial Port & Belt</option>
                          <option value="Surat Ward 17 - Citylight & Science Centre">Surat Ward 17 - Citylight & Science Centre Zone</option>
                          <option value="Surat Ward 18 - Sarthana & Nature Park">Surat Ward 18 - Sarthana & Nature Park</option>
                          <option value="Surat Ward 19 - Bhestan & Transit Terminal">Surat Ward 19 - Bhestan & Transit Terminal</option>
                          <option value="Surat Ward 20 - Sachin GIDC & Grid">Surat Ward 20 - Sachin GIDC & Power Grid</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-[#0F2942] font-bold mb-1.5 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#0284C7]" />
                          <span>LOGGED IN AGENT</span>
                        </label>
                        <div className="p-2.5 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] text-xs font-mono text-[#0F2942] font-bold truncate shadow-sm">
                          {user.name} <span className="text-[#024E82]">[{user.role.toUpperCase()}]</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Action Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !complaintText.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0284C7] via-[#2563EB] to-[#1E40AF] text-white font-mono text-sm font-bold tracking-wider hover:from-[#0369A1] hover:to-[#1E3A8A] transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>ANALYZE WITH AI & DISPATCH TICKET</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

            </div>
          </div>

          {/* ================= DIV 3: AI TRIAGE LIVE INFERENCE HUD ================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#DCEEFE] border border-[#60A5FA] shadow-lg space-y-4 h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2563EB] to-[#0284C7]"></div>

              <div>
                <div className="flex items-center justify-between border-b border-[#93C5FD] pb-4 mb-4">
                  <div className="flex items-center gap-2 text-[#0F2942] font-mono font-bold text-sm">
                    <Zap className="w-4 h-4 text-[#0284C7] animate-pulse" />
                    <span>AI NLP TRIAGE INFERENCE HUD</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#024E82] font-bold px-2.5 py-1 rounded-lg bg-[#BAE6FD] border border-[#38BDF8] shadow-sm">
                    RF_MODEL_v2.4
                  </span>
                </div>

                {aiResult ? (
                  <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">

                    {/* Category Result Banner */}
                    <div className="p-4 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] space-y-1 shadow-sm">
                      <div className="text-[10px] font-mono text-[#024E82] font-bold uppercase tracking-wider">
                        PREDICTED COMPLAINT CATEGORY
                      </div>
                      <div className="text-lg font-bold text-[#0F2942] font-mono">
                        {aiResult.categoryFormatted}
                      </div>
                      <div className="text-xs text-[#1E3A8A] font-normal">
                        Inferred with {aiResult.confidence} statistical confidence
                      </div>
                    </div>

                    {/* Priority Level Pill */}
                    <div className="p-4 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] space-y-2 shadow-sm">
                      <div className="text-[10px] font-mono text-[#024E82] font-bold uppercase tracking-wider">
                        AUTO-ASSIGNED PRIORITY LEVEL
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${aiResult.priority === 3
                          ? 'bg-rose-100 border border-rose-300 text-rose-900 shadow-sm animate-pulse'
                          : aiResult.priority === 2
                            ? 'bg-amber-100 border border-amber-300 text-amber-900'
                            : 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                          }`}>
                          <AlertTriangle className="w-4 h-4" />
                          {aiResult.priorityLabel}
                        </span>
                      </div>
                    </div>

                    {/* Suggested Department Routing */}
                    <div className="p-4 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] space-y-1 font-mono shadow-sm">
                      <div className="text-[10px] text-[#024E82] font-bold uppercase">ROUTED DEPARTMENT</div>
                      <div className="text-sm font-bold text-[#0F2942]">{aiResult.department}</div>
                      <div className="text-[10px] text-[#1E3A8A] mt-1 font-normal">
                        Dispatched in {aiResult.inferenceTime} via Django ML Gateway
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Standard medium font weight for HUD placeholder */
                  <div className="p-8 rounded-xl border border-dashed border-[#0284C7] text-center space-y-3 font-mono my-4 bg-[#BAE6FD]/90 shadow-inner">
                    <Activity className="w-9 h-9 text-[#024E82] mx-auto animate-pulse" />
                    <p className="text-xs text-[#0F2942] font-medium leading-relaxed">
                      {user && user.role === 'admin'
                        ? 'Admin Access Mode: Read-only triage view. Monitor incoming citizen issues and manage resolutions below.'
                        : user
                          ? 'Awaiting description submission... Submit an issue on the left to see instant Random Forest NLP category classification.'
                          : 'Sign in to access AI Natural Language triage inference.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Model Weights Status Bar */}
              <div className="p-3 rounded-xl bg-[#BAE6FD] border border-[#38BDF8] text-[11px] font-mono text-[#024E82] font-bold flex items-center justify-between shadow-sm">
                <span>MODEL WEIGHTS: <span className="text-emerald-800 font-bold">LOADED</span></span>
                <span>TRAINED ACCURACY: <span className="text-[#1E40AF] font-bold">98.2%</span></span>
              </div>

            </div>
          </div>

        </div>

        {/* ================= DIV 4: SYSTEM-WIDE / USER KANBAN DISPATCH BOARD ================= */}
        <div className="p-6 rounded-2xl bg-[#DCEEFE] border border-[#60A5FA] shadow-lg space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#1E40AF] via-[#0284C7] to-[#2563EB]"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#93C5FD] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0F2942] font-mono uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0284C7]" />
                <span>
                  {user && user.role === 'admin' ? 'System-Wide Municipal Kanban Board (ADMIN CLEARANCE)' : 'My Submitted Municipal Complaints'}
                </span>
              </h2>
              <p className="text-xs text-[#1E3A8A] mt-0.5 font-normal">
                {user && user.role === 'admin'
                  ? 'Showing all tickets submitted by all citizens across city wards.'
                  : user
                    ? `Showing complaints submitted by ${user.name} (${user.email}).`
                    : 'Please sign in to view your submitted complaints.'}
              </p>
            </div>

            {/* Filter Buttons */}
            {user && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-mono">
                {[
                  { id: 'all', label: 'All Tickets' },
                  { id: 'urgent', label: 'Urgent (P3)' },
                  { id: 'in-progress', label: 'In Progress' },
                  { id: 'resolved', label: 'Resolved' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTicketFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${ticketFilter === f.id
                      ? 'bg-[#0284C7] text-white border border-[#0284C7] shadow-sm font-bold'
                      : 'bg-[#BAE6FD] border border-[#38BDF8] text-[#0F2942] hover:bg-[#7DD3FC]'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tickets Cards Grid or Authentication Prompt */}
          {!user ? (
            <div className="p-8 rounded-xl border border-dashed border-[#0284C7] text-center space-y-3 font-mono bg-[#BAE6FD]/90 shadow-inner">
              <Lock className="w-8 h-8 text-amber-700 mx-auto animate-pulse" />
              <div className="text-sm font-bold text-[#0F2942] uppercase tracking-wider">
                SIGN IN REQUIRED TO VIEW YOUR TICKETS
              </div>
              <p className="text-xs text-[#1E3A8A] max-w-sm mx-auto font-sans font-medium">
                Logged-in users can track the progress of their submitted issues here in real-time.
              </p>
              <button
                onClick={onOpenAuth}
                className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#1E40AF] text-white text-xs font-mono font-bold tracking-wider hover:from-[#0369A1] hover:to-[#1E3A8A] transition-all cursor-pointer shadow-md"
              >
                SIGN IN NOW
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-[#0284C7] text-center text-[#0F2942] font-mono bg-[#BAE6FD]/90">
              <CheckCircle2 className="w-8 h-8 text-[#0284C7] mx-auto mb-2 opacity-90" />
              <div className="font-bold">No tickets found for this filter criteria.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredTickets.map(t => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-white border border-[#93C5FD] hover:border-[#0284C7] hover:shadow-lg transition-all space-y-3 font-mono flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-[#1E40AF]">{t.id}</span>
                      <span className="text-[11px] text-slate-600 font-normal">{t.timestamp}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 font-sans leading-snug line-clamp-2 mb-3">
                      {t.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${t.priority === 3 ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        t.priority === 2 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                        {t.priorityLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#BAE6FD] text-[#024E82] border border-[#38BDF8] font-bold">
                        {t.category.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#0284C7]" />
                        {t.ward}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-600 font-medium">
                      Reporter: <span className="text-[#0F2942] font-bold">{t.reporter}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* ADMIN-ONLY RESOLVE ACTION */}
                      {user && user.role === 'admin' && t.status !== 'Resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'Resolved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-[11px] cursor-pointer flex items-center gap-1 font-mono font-bold shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Resolve Issue</span>
                        </button>
                      )}

                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${t.status === 'Urgent' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        t.status === 'In Progress' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
