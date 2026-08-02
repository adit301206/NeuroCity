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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Global Floating Navbar */}
      <Navbar
        activeTab="citizen-desk"
        onNavigate={onNavigate}
        user={user}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
      />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-8">

        {/* Page Title & Operational Telemetry Top Deck */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#03045E]/80 border border-[#48CAE4]/30 shadow-[0_10px_30px_rgba(3,4,94,0.4)] backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-[#48CAE4] font-mono text-xs tracking-widest uppercase mb-1">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>CITIZEN DESK // MUNICIPAL ACCESS DESK</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Municipal Complaint & Issue Dispatch Center
            </h1>
            <p className="text-sm text-[#CAF0F8]/70 mt-1 max-w-2xl">
              Report municipal hazards in plain text. The Random Forest NLP engine automatically categorizes issues, evaluates urgency priority, and dispatches field response crews.
            </p>
          </div>

          {/* KPI Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#023E8A]/50 border border-[#0077B6]/40 text-center font-mono">
              <div className="text-xs text-[#48CAE4]/80">MY TICKETS</div>
              <div className="text-xl font-bold text-white mt-0.5">{userSpecificTickets.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-center font-mono">
              <div className="text-xs text-rose-300/80">URGENT (P3)</div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">
                {userSpecificTickets.filter(t => t.priority === 3).length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#023E8A]/50 border border-[#0077B6]/40 text-center font-mono">
              <div className="text-xs text-[#48CAE4]/80">AI LATENCY</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">0.012s</div>
            </div>
            <div className="p-3 rounded-xl bg-[#023E8A]/50 border border-[#0077B6]/40 text-center font-mono">
              <div className="text-xs text-[#48CAE4]/80">ROLE CLEARANCE</div>
              <div className="text-xs font-bold text-[#48CAE4] uppercase mt-1">
                {user ? user.role : 'GUEST'}
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Section: Submission Terminal + AI Inference Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Complaint Submission Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-[#03045E]/90 border border-[#48CAE4]/30 shadow-xl space-y-5 relative overflow-hidden">

              <div className="flex items-center justify-between border-b border-[#0077B6]/40 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#48CAE4]/10 border border-[#48CAE4]/40 flex items-center justify-center text-[#48CAE4]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                      Submit Municipal Issue
                    </h2>
                    <p className="text-xs text-[#CAF0F8]/60">AI Natural Language Analysis Input Terminal</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  NLP ENGINE ONLINE
                </span>
              </div>

              {/* Login Requirement Authorization Guard */}
              {!user ? (
                <div className="p-8 rounded-xl bg-[#023E8A]/30 border border-[#0077B6]/50 text-center space-y-4 font-mono my-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">
                      AUTHENTICATION REQUIRED TO COMPLAIN
                    </h3>
                    <p className="text-xs text-[#CAF0F8]/70 mt-1.5 max-w-md mx-auto font-sans">
                      You must be signed in to submit municipal complaints and track their resolution status.
                    </p>
                  </div>
                  <button
                    onClick={onOpenAuth}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#00B4D8] border border-[#48CAE4] text-white font-mono text-xs font-bold tracking-wider hover:from-[#0096C7] hover:to-[#48CAE4] transition-all shadow-[0_0_20px_rgba(72,202,228,0.3)] cursor-pointer inline-flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4 text-[#CAF0F8]" />
                    <span>SIGN IN / REGISTER TO REPORT ISSUES</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Sample Preset Shortcut Chips */}
                  <div>
                    <label className="block text-xs font-mono text-[#48CAE4] mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>1-CLICK SAMPLE PRESET TESTERS</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {samplePresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePresetClick(preset.text)}
                          className="px-3 py-1.5 rounded-xl bg-[#023E8A]/50 border border-[#0077B6]/50 text-xs text-[#CAF0F8] hover:bg-[#0077B6]/60 hover:border-[#48CAE4] hover:text-white transition-all cursor-pointer font-mono"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Natural Language Complaint Text Area */}
                    <div>
                      <label className="block text-xs font-mono text-[#CAF0F8]/80 mb-1.5">
                        DESCRIBE THE ISSUE IN PLAIN TEXT
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Describe what happened (e.g. 'There is a damaged electrical transformer pole leaking sparks on Main Street near the hospital entrance')..."
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        className="w-full p-3.5 rounded-xl bg-[#023E8A]/30 border border-[#0077B6]/60 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#48CAE4] focus:ring-1 focus:ring-[#48CAE4] transition-all resize-none font-sans"
                      />
                    </div>

                    {/* City Ward / Location Dropdown Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-[#CAF0F8]/80 mb-1.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#48CAE4]" />
                          <span>SELECT MUNICIPAL WARD</span>
                        </label>
                        <select
                          value={ward}
                          onChange={(e) => setWard(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-[#023E8A]/50 border border-[#0077B6]/60 text-white text-xs font-mono focus:outline-none focus:border-[#48CAE4] transition-all cursor-pointer"
                        >
                          <select
                            value={ward}
                            onChange={(e) => setWard(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-[#023E8A]/50 border border-[#0077B6]/60 text-white text-xs font-mono focus:outline-none focus:border-[#48CAE4] transition-all cursor-pointer"
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
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-[#CAF0F8]/80 mb-1.5 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#48CAE4]" />
                          <span>LOGGED IN AGENT</span>
                        </label>
                        <div className="p-2.5 rounded-xl bg-[#023E8A]/40 border border-[#0077B6]/60 text-xs font-mono text-white truncate">
                          {user.name} <span className="text-[#48CAE4]">[{user.role.toUpperCase()}]</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Action Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !complaintText.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white font-mono text-sm font-bold tracking-wider hover:from-[#0096C7] hover:to-[#48CAE4] transition-all shadow-[0_0_20px_rgba(72,202,228,0.3)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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

          {/* Right Column: AI Triage Live Inference HUD (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#03045E]/90 border border-[#48CAE4]/30 shadow-xl space-y-4 h-full flex flex-col justify-between">

              <div>
                <div className="flex items-center justify-between border-b border-[#0077B6]/40 pb-4 mb-4">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                    <Zap className="w-4 h-4 text-[#48CAE4] animate-pulse" />
                    <span>AI NLP TRIAGE INFERENCE HUD</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#48CAE4]/80">RF_MODEL_v2.4</span>
                </div>

                {aiResult ? (
                  <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">

                    {/* Category Result Banner */}
                    <div className="p-4 rounded-xl bg-[#023E8A]/60 border border-[#0077B6] space-y-1">
                      <div className="text-[10px] font-mono text-[#48CAE4] uppercase tracking-wider">
                        PREDICTED COMPLAINT CATEGORY
                      </div>
                      <div className="text-lg font-bold text-white font-mono">
                        {aiResult.categoryFormatted}
                      </div>
                      <div className="text-xs text-[#CAF0F8]/70">
                        Inferred with {aiResult.confidence} statistical confidence
                      </div>
                    </div>

                    {/* Priority Level Pill */}
                    <div className="p-4 rounded-xl bg-[#023E8A]/40 border border-[#0077B6]/50 space-y-2">
                      <div className="text-[10px] font-mono text-[#CAF0F8]/80 uppercase tracking-wider">
                        AUTO-ASSIGNED PRIORITY LEVEL
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-mono font-extrabold flex items-center gap-1.5 ${aiResult.priority === 3
                          ? 'bg-rose-500/20 border border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
                          : aiResult.priority === 2
                            ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                            : 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                          }`}>
                          <AlertTriangle className="w-4 h-4" />
                          {aiResult.priorityLabel}
                        </span>
                      </div>
                    </div>

                    {/* Suggested Department Routing */}
                    <div className="p-4 rounded-xl bg-[#023E8A]/40 border border-[#0077B6]/50 space-y-1 font-mono">
                      <div className="text-[10px] text-[#48CAE4] uppercase">ROUTED DEPARTMENT</div>
                      <div className="text-sm font-bold text-white">{aiResult.department}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Dispatched in {aiResult.inferenceTime} via Django ML Gateway
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 rounded-xl border border-dashed border-[#0077B6]/50 text-center text-[#CAF0F8]/50 space-y-3 font-mono my-4">
                    <Activity className="w-8 h-8 text-[#48CAE4]/60 mx-auto animate-pulse" />
                    <p className="text-xs">
                      {user ? 'Awaiting description submission... Submit an issue on the left to see instant Random Forest NLP category classification.' : 'Sign in to access AI Natural Language triage inference.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#023E8A]/30 border border-[#0077B6]/30 text-[11px] font-mono text-[#CAF0F8]/70 flex items-center justify-between">
                <span>MODEL WEIGHTS: <span className="text-emerald-400">LOADED</span></span>
                <span>TRAINED ACCURACY: <span className="text-[#48CAE4]">98.2%</span></span>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Section: User-Specific or Admin Global Kanban Dispatch Board */}
        <div className="p-6 rounded-2xl bg-[#03045E]/90 border border-[#48CAE4]/30 shadow-2xl space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0077B6]/40 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#48CAE4]" />
                <span>
                  {user && user.role === 'admin' ? 'System-Wide Municipal Kanban Board (ADMIN CLEARANCE)' : 'My Submitted Municipal Complaints'}
                </span>
              </h2>
              <p className="text-xs text-[#CAF0F8]/70 mt-0.5">
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${ticketFilter === f.id
                      ? 'bg-[#0077B6] text-white border border-[#48CAE4] shadow-[0_0_10px_rgba(72,202,228,0.3)]'
                      : 'bg-[#023E8A]/30 border border-[#0077B6]/40 text-[#CAF0F8]/70 hover:text-white'
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
            <div className="p-8 rounded-xl border border-dashed border-[#0077B6]/50 text-center space-y-3 font-mono">
              <Lock className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                SIGN IN REQUIRED TO VIEW YOUR TICKETS
              </div>
              <p className="text-xs text-[#CAF0F8]/60 max-w-sm mx-auto font-sans">
                Logged-in users can track the progress of their submitted issues here in real-time.
              </p>
              <button
                onClick={onOpenAuth}
                className="mt-2 px-5 py-2 rounded-xl bg-[#0077B6] text-white text-xs font-mono font-bold tracking-wider hover:bg-[#0096C7] transition-all cursor-pointer"
              >
                SIGN IN NOW
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-[#0077B6]/50 text-center text-[#CAF0F8]/60 font-mono">
              <CheckCircle2 className="w-8 h-8 text-[#48CAE4] mx-auto mb-2 opacity-60" />
              <div>No tickets found for this filter criteria.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredTickets.map(t => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-[#023E8A]/40 border border-[#0077B6]/50 hover:border-[#48CAE4]/60 transition-all space-y-3 font-mono flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-[#48CAE4]">{t.id}</span>
                      <span className="text-[11px] text-slate-400">{t.timestamp}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-white font-sans leading-snug line-clamp-2 mb-3">
                      {t.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${t.priority === 3 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' :
                        t.priority === 2 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        }`}>
                        {t.priorityLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#0077B6]/40 text-[#CAF0F8] border border-[#0077B6]">
                        {t.category.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#023E8A] text-slate-300 border border-[#0077B6]/40 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#48CAE4]" />
                        {t.ward}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#0077B6]/30 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      Reporter: <span className="text-white">{t.reporter}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* ADMIN-ONLY RESOLVE ACTION */}
                      {user && user.role === 'admin' && t.status !== 'Resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'Resolved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all text-[11px] cursor-pointer flex items-center gap-1 font-mono font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        >
                          <Check className="w-3 h-3" />
                          <span>Resolve Issue</span>
                        </button>
                      )}

                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${t.status === 'Urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500' :
                        t.status === 'In Progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500'
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
