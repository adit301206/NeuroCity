import React from 'react';

export default function Navbar({ onNavigate, activeTab, currentUser, onLogout, onOpenSettings, unreadNotificationsCount }) {
  const links = [
    { id: 'global-hub', label: 'Global Hub' },
    { id: 'traffic-eye', label: 'Traffic Eye' },
    { id: 'energy-sentinel', label: 'Energy Sentinel' },
    { id: 'citizen-desk', label: 'Citizen Desk' },
  ];

  const user = currentUser || (() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })();

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    }
    if (onNavigate) {
      onNavigate('login');
    }
  };

  return (
    <nav className="mx-6 mt-4 p-4 rounded-2xl bg-[#03045E]/95 backdrop-blur-md border border-[#48CAE4]/30 shadow-[0_10px_30px_rgba(3,4,94,0.3),0_0_25px_rgba(72,202,228,0.15)] flex items-center justify-between select-none relative z-50">

      {/* Left Side - The NeuroCity Integrated Artistic Signature */}
      <div
        className="flex items-center cursor-pointer h-[52px]"
        onClick={() => onNavigate && onNavigate('global-hub')}
      >
        <svg
          width="312"
          height="52"
          viewBox="0 0 240 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="brand-grad" x1="10" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#48CAE4" />
            </linearGradient>

            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M 22 24 C 60 31, 100 31, 150 27 C 170 25, 190 29, 215 29"
            stroke="#48CAE4"
            strokeWidth="0.8"
            opacity="0.3"
            fill="none"
            className="animate-pulse"
          />
          <path
            d="M 12 30 C 50 35, 110 35, 170 33 C 185 32, 205 35, 218 35"
            stroke="#48CAE4"
            strokeWidth="0.6"
            opacity="0.25"
            fill="none"
            className="animate-pulse"
          />

          <g>
            <rect x="10" y="8" width="4.5" height="20" rx="0.75" fill="url(#brand-grad)" />
            <rect x="25.5" y="8" width="4.5" height="20" rx="0.75" fill="url(#brand-grad)" />
            <line x1="14.5" y1="9.5" x2="25.5" y2="26.5" stroke="#48CAE4" strokeWidth="1.2" opacity="0.7" className="animate-pulse" filter="url(#node-glow)" />
            <line x1="14.5" y1="14.5" x2="21" y2="24.5" stroke="#48CAE4" strokeWidth="0.8" opacity="0.5" className="animate-pulse" />
            <line x1="19.5" y1="11.5" x2="25.5" y2="21.5" stroke="#48CAE4" strokeWidth="0.8" opacity="0.5" className="animate-pulse" />
            <circle cx="17.5" cy="14" r="1.75" fill="#48CAE4" className="animate-pulse" filter="url(#node-glow)" />
            <circle cx="21" cy="19.5" r="1.25" fill="#FFFFFF" className="animate-pulse" />
            <circle cx="23.5" cy="23.5" r="1.75" fill="#48CAE4" className="animate-pulse" filter="url(#node-glow)" />
          </g>

          <g>
            <text
              y="26"
              fill="url(#brand-grad)"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="20"
              style={{ letterSpacing: '0.12em' }}
            >
              <tspan x="34">E</tspan>
              <tspan x="53">U</tspan>
              <tspan x="72">R</tspan>
              <tspan x="91">O</tspan>
              <tspan x="110">C</tspan>
              <tspan x="126" style={{ letterSpacing: '0.06em' }}>I</tspan>
              <tspan x="135">T</tspan>
              <tspan x="154">Y</tspan>
            </text>

            <polygon
              points="128.25,5.5 131.25,8.5 128.25,11.5 125.25,8.5"
              fill="#48CAE4"
              className="animate-pulse"
              filter="url(#node-glow)"
            />
          </g>
        </svg>
      </div>

      {/* Center Area - Unified Command Links */}
      <div className="flex items-center gap-8">
        {links.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onNavigate && onNavigate(link.id)}
              className="relative py-1 text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer group"
            >
              <span className={`transition-colors duration-300 ${isActive ? 'text-[#48CAE4] font-semibold' : 'text-[#CAF0F8]/70 group-hover:text-[#48CAE4]'}`}>
                {link.label}
              </span>

              <span className={`absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#48CAE4] rounded-full transition-all duration-300 shadow-[0_0_8px_#48CAE4] ${isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}></span>
            </button>
          );
        })}
      </div>

      {/* Right Side - Auth or User Profile */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3.5 text-white">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-[#CAF0F8]">
                {user.name || user.email}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                user.role === 'admin' 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : 'bg-[#48CAE4]/20 text-[#90E0EF] border border-[#48CAE4]/30'
              }`}>
                {user.role || 'citizen'}
              </span>
            </div>
            
            {/* Account Settings Button (View Details, Change Password & Delete Account) */}
            <div className="relative">
              <button
                onClick={() => onOpenSettings && onOpenSettings('profile')}
                title="Account Settings (View Details / Change Password / Delete Account)"
                className="p-2 rounded-lg border border-[#48CAE4]/40 bg-[#0077B6]/30 text-[#48CAE4] hover:bg-[#0077B6]/60 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-[0_0_10px_rgba(72,202,228,0.15)]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center shadow-md animate-pulse z-10 pointer-events-none">
                  {unreadNotificationsCount}
                </span>
              )}
            </div>

            <button
              onClick={handleLogoutClick}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer bg-red-600 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.2)]"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onNavigate && onNavigate('login')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'login' 
                  ? 'bg-white text-[#03045E] font-semibold shadow-[0_0_10px_rgba(255,255,255,0.4)]' 
                  : 'bg-[#48CAE4] text-[#03045E] hover:bg-[#90E0EF] shadow-[0_0_10px_rgba(72,202,228,0.2)]'
              }`}
            >
              Login
            </button>

            <button
              onClick={() => onNavigate && onNavigate('signup')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'signup' 
                  ? 'bg-white text-[#03045E] font-semibold shadow-[0_0_10px_rgba(255,255,255,0.4)]' 
                  : 'bg-[#48CAE4] text-[#03045E] hover:bg-[#90E0EF] shadow-[0_0_10px_rgba(72,202,228,0.2)]'
              }`}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
