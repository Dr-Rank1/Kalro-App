import React from 'react';

/**
 * High-fidelity, self-contained SVG artwork and illustrations for Sericulture cards.
 * Provides authentic biological representations of Bombyx mori, Eri (Samia ricini),
 * lifecycle stages, and microclimate monitors.
 */

// 1. Large Illustrated Banner for Bombyx mori Species Card
export const BombyxSpeciesBanner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 420 130"
    className={`sericulture-banner-svg ${className}`}
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bombyx-banner-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8F5E9" />
        <stop offset="60%" stopColor="#C8E6C9" />
        <stop offset="100%" stopColor="#A5D6A7" />
      </linearGradient>
      <linearGradient id="silk-thread-gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="50%" stopColor="#FFEE58" />
        <stop offset="100%" stopColor="#FBC02D" />
      </linearGradient>
      <linearGradient id="cocoon-body" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#FFFDE7" />
        <stop offset="85%" stopColor="#FFF9C4" />
        <stop offset="100%" stopColor="#FBC02D" />
      </linearGradient>
      <linearGradient id="leaf-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#43A047" />
        <stop offset="60%" stopColor="#2E7D32" />
        <stop offset="100%" stopColor="#1B5E20" />
      </linearGradient>
      <linearGradient id="leaf-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#66BB6A" />
        <stop offset="100%" stopColor="#388E3C" />
      </linearGradient>
      <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodColor="#1B5E20" floodOpacity="0.18" />
      </filter>
    </defs>

    {/* Backdrop with soft curved terrain */}
    <rect width="420" height="130" rx="10" fill="url(#bombyx-banner-bg)" />
    <path
      d="M0 80 Q100 50 210 75 T420 70 L420 130 L0 130 Z"
      fill="#81C784"
      opacity="0.35"
    />
    <path
      d="M0 100 Q140 85 280 110 T420 95 L420 130 L0 130 Z"
      fill="#4CAF50"
      opacity="0.25"
    />

    {/* Mulberry Branch & Serrated Leaves */}
    <g filter="url(#soft-shadow)">
      {/* Branch Stem */}
      <path
        d="M-10 60 Q60 55 130 75 Q180 88 230 78"
        stroke="#5D4037"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Background Mulberry Leaf */}
      <path
        d="M20 70 C5 35, 35 15, 80 20 C105 23, 115 50, 95 72 C75 90, 35 85, 20 70 Z"
        fill="url(#leaf-gradient-2)"
        opacity="0.9"
      />
      <path
        d="M20 70 Q60 45 95 30 M45 55 Q70 42 85 45 M35 62 Q50 60 75 62"
        stroke="#A5D6A7"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />

      {/* Main Vibrant Mulberry Leaf */}
      <path
        d="M75 80 C60 40, 100 10, 160 18 C195 24, 210 60, 175 88 C145 110, 95 105, 75 80 Z"
        fill="url(#leaf-gradient-1)"
      />
      {/* Main leaf venation */}
      <path
        d="M80 82 Q125 55 170 32"
        stroke="#C8E6C9"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M105 68 Q125 45 150 48"
        stroke="#A5D6A7"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M125 56 Q150 40 162 42"
        stroke="#A5D6A7"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M115 75 Q140 70 165 72"
        stroke="#A5D6A7"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </g>

    {/* Authentic Bombyx mori 5th-Instar Caterpillar on Leaf */}
    <g filter="url(#soft-shadow)">
      {/* Silkworm Body Segments */}
      <path
        d="M100 68 C115 62, 130 63, 145 68 C160 73, 175 74, 190 70 C200 67, 208 62, 215 58 C218 56, 222 55, 225 58 C227 61, 226 66, 222 70 C212 78, 195 82, 175 81 C155 80, 135 78, 115 76 C105 75, 96 73, 98 69 Z"
        fill="#FAFAFA"
        stroke="#D5D9D6"
        strokeWidth="1"
      />
      {/* Body segment creases & spiracles */}
      <line x1="120" y1="65" x2="122" y2="76" stroke="#CFD8DC" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="138" y1="66" x2="140" y2="78" stroke="#CFD8DC" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="156" y1="71" x2="158" y2="80" stroke="#CFD8DC" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="174" y1="73" x2="175" y2="81" stroke="#CFD8DC" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="192" y1="70" x2="193" y2="78" stroke="#CFD8DC" strokeWidth="1.2" strokeLinecap="round" />
      {/* Characteristic eye spots / thoracic markings */}
      <ellipse cx="218" cy="61" rx="1.8" ry="2.2" fill="#78909C" />
      <circle cx="218.5" cy="61" r="0.8" fill="#37474F" />
      {/* Caudal horn on 8th abdominal segment */}
      <path d="M110 66 Q106 58 104 56 Q106 60 112 66" fill="#B0BEC5" />
      {/* True thoracic legs clinging to leaf */}
      <line x1="208" y1="73" x2="209" y2="78" stroke="#78909C" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="202" y1="75" x2="203" y2="80" stroke="#78909C" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="196" y1="76" x2="197" y2="81" stroke="#78909C" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Spun Silk Filament Streams */}
    <g opacity="0.6">
      <path
        d="M215 58 Q260 20 310 40 T360 35"
        stroke="url(#silk-thread-gold)"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="4 2"
      />
      <path
        d="M230 68 Q270 45 320 60"
        stroke="#FFF9C4"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M300 95 Q335 110 380 90"
        stroke="#FFF59D"
        strokeWidth="0.9"
        fill="none"
      />
    </g>

    {/* Golden & White Bivoltine Cocoons */}
    <g filter="url(#soft-shadow)">
      {/* Secondary Cocoon */}
      <g transform="translate(305, 55) rotate(22)">
        <ellipse cx="0" cy="0" rx="22" ry="14" fill="url(#cocoon-body)" stroke="#FBC02D" strokeWidth="1.2" />
        <path d="M-12 -3 Q0 -10 12 -2" stroke="#F57F17" strokeWidth="0.7" fill="none" opacity="0.5" />
        <path d="M-8 4 Q0 10 10 3" stroke="#F57F17" strokeWidth="0.7" fill="none" opacity="0.5" />
      </g>

      {/* Primary Prime Cocoon */}
      <g transform="translate(352, 70) rotate(-18)">
        <ellipse cx="0" cy="0" rx="28" ry="18" fill="url(#cocoon-body)" stroke="#FBC02D" strokeWidth="1.6" />
        {/* Fine cross-spun silk texture */}
        <path d="M-18 -6 Q-5 -14 14 -5" stroke="#F57F17" strokeWidth="0.9" fill="none" opacity="0.5" />
        <path d="M-15 5 Q2 14 18 3" stroke="#F57F17" strokeWidth="0.9" fill="none" opacity="0.5" />
        <path d="M-8 -10 Q8 0 -5 12" stroke="#F57F17" strokeWidth="0.8" fill="none" opacity="0.4" />
        {/* Shiny highlight */}
        <ellipse cx="-6" cy="-6" rx="14" ry="7" fill="#FFFFFF" opacity="0.7" />
      </g>
    </g>

    {/* Badge Tag */}
    <g transform="translate(290, 16)">
      <rect width="120" height="20" rx="10" fill="#1B5E20" opacity="0.9" />
      <text x="60" y="14" fill="#FFFFFF" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
        BIVOLTINE • CSR2
      </text>
    </g>
  </svg>
);

// 2. Large Illustrated Banner for Eri Silkworm Species Card
export const EriSpeciesBanner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 420 130"
    className={`sericulture-banner-svg ${className}`}
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="eri-banner-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF3E0" />
        <stop offset="50%" stopColor="#FFE0B2" />
        <stop offset="100%" stopColor="#FFCC80" />
      </linearGradient>
      <linearGradient id="castor-leaf-green" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#43A047" />
        <stop offset="50%" stopColor="#2E7D32" />
        <stop offset="100%" stopColor="#1B5E20" />
      </linearGradient>
      <linearGradient id="eri-caterpillar-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E0F2F1" />
        <stop offset="70%" stopColor="#B2DFDB" />
        <stop offset="100%" stopColor="#80CBC4" />
      </linearGradient>
      <linearGradient id="eri-cocoon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#EFEBE9" />
        <stop offset="100%" stopColor="#D7CCC8" />
      </linearGradient>
      <filter id="eri-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodColor="#5D4037" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Backdrop */}
    <rect width="420" height="130" rx="10" fill="url(#eri-banner-bg)" />
    <path
      d="M0 85 Q110 60 220 80 T420 75 L420 130 L0 130 Z"
      fill="#FFB74D"
      opacity="0.35"
    />
    <path
      d="M0 105 Q150 90 290 115 T420 100 L420 130 L0 130 Z"
      fill="#FB8C00"
      opacity="0.25"
    />

    {/* Castor Palmate Leaf & Foliage */}
    <g filter="url(#eri-shadow)">
      {/* Reddish Castor Stem */}
      <path
        d="M-10 75 Q60 65 140 85 Q190 95 240 85"
        stroke="#B71C1C"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Palmate Castor Leaf (Star-shaped 7-lobed leaf) */}
      <g transform="translate(90, 65) scale(1.05)">
        <path
          d="M0 0 
             L16 -46 L26 -40 L13 -13 
             L46 -30 L52 -20 L19 0 
             L56 10 L49 22 L16 15 
             L31 46 L19 49 L5 20 
             L-16 51 L-26 43 L-8 16 
             L-46 31 L-49 19 L-17 2 
             L-41 -26 L-31 -33 L-10 -10 Z"
          fill="url(#castor-leaf-green)"
          stroke="#1B5E20"
          strokeWidth="0.8"
        />
        {/* Reddish central veins reaching each lobe */}
        <line x1="0" y1="0" x2="21" y2="-43" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="0" x2="49" y2="-25" stroke="#D32F2F" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="0" y1="0" x2="53" y2="15" stroke="#D32F2F" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="0" y1="0" x2="25" y2="46" stroke="#D32F2F" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="0" y1="0" x2="-21" y2="46" stroke="#D32F2F" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="0" y1="0" x2="-46" y2="25" stroke="#D32F2F" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="0" y1="0" x2="-36" y2="-29" stroke="#D32F2F" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="0" cy="0" r="3.5" fill="#B71C1C" />
      </g>
    </g>

    {/* Authentic Eri Silkworm (Samia ricini) with Yellow/Black Tubercles */}
    <g filter="url(#eri-shadow)">
      {/* Body: Distinctive chalky bluish-white / pale greenish with segments */}
      <path
        d="M125 74 C142 66, 160 65, 178 70 C195 75, 212 76, 228 71 C238 67, 246 62, 252 57 C255 55, 260 55, 262 58 C264 61, 261 67, 256 71 C245 79, 228 83, 206 83 C184 82, 162 80, 140 79 C130 78, 122 77, 124 73 Z"
        fill="url(#eri-caterpillar-grad)"
        stroke="#4DB6AC"
        strokeWidth="1.3"
      />
      {/* Eri characteristic dorsal tubercles (yellow fleshy bumps) */}
      <circle cx="150" cy="68" r="2.6" fill="#FFD600" stroke="#E65100" strokeWidth="0.8" />
      <circle cx="168" cy="67" r="2.6" fill="#FFD600" stroke="#E65100" strokeWidth="0.8" />
      <circle cx="186" cy="71" r="2.6" fill="#FFD600" stroke="#E65100" strokeWidth="0.8" />
      <circle cx="204" cy="73" r="2.6" fill="#FFD600" stroke="#E65100" strokeWidth="0.8" />
      <circle cx="222" cy="71" r="2.6" fill="#FFD600" stroke="#E65100" strokeWidth="0.8" />
      <circle cx="238" cy="66" r="2.6" fill="#FFD600" stroke="#E65100" strokeWidth="0.8" />
      {/* Segment lines */}
      <line x1="160" y1="67" x2="162" y2="79" stroke="#80CBC4" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="178" y1="69" x2="180" y2="81" stroke="#80CBC4" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="196" y1="73" x2="197" y2="83" stroke="#80CBC4" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="214" y1="73" x2="215" y2="82" stroke="#80CBC4" strokeWidth="1.3" strokeLinecap="round" />
      {/* Head */}
      <circle cx="255" cy="60" r="4.2" fill="#FFE082" stroke="#FFA000" strokeWidth="1" />
      <circle cx="256" cy="59.5" r="1.2" fill="#3E2723" />
    </g>

    {/* Open-ended Spun Eri Silk Cocoons with loose floss */}
    <g filter="url(#eri-shadow)">
      {/* Fluffy surrounding loose floss */}
      <ellipse cx="340" cy="68" rx="36" ry="26" fill="#FFFFFF" opacity="0.5" stroke="#BCAAA4" strokeWidth="1" strokeDasharray="3 3" />

      {/* Main Spindle-shaped Eri Cocoon with natural open orifice */}
      <g transform="translate(345, 68) rotate(12)">
        <path
          d="M-24 0 C-22 -16, 12 -16, 26 -7 C30 -2, 30 2, 26 7 C12 16, -22 16, -24 0 Z"
          fill="url(#eri-cocoon-grad)"
          stroke="#795548"
          strokeWidth="1.6"
        />
        {/* Open-ended natural exit hole on right (Ahimsa / Non-violent silk) */}
        <ellipse cx="25" cy="0" rx="3.5" ry="6" fill="#3E2723" />
        {/* Spun fiber layers */}
        <path d="M-16 -7 Q0 -11 14 -5" stroke="#8D6E63" strokeWidth="1" fill="none" opacity="0.65" />
        <path d="M-13 6 Q2 11 17 5" stroke="#8D6E63" strokeWidth="1" fill="none" opacity="0.65" />
      </g>
    </g>

    {/* Badge Tag */}
    <g transform="translate(285, 16)">
      <rect width="125" height="20" rx="10" fill="#BF360C" opacity="0.95" />
      <text x="62.5" y="14" fill="#FFFFFF" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
        AHIMSA • SAMIA
      </text>
    </g>
  </svg>
);

// 3. Compact Header Banner for Batches (Bombyx mori)
export const BombyxBatchCardHeader: React.FC<{ day: number; maxDays: number; stageName: string }> = ({
  day,
  maxDays,
  stageName,
}) => (
  <div className="batch-header-visual bombyx-card-header">
    <svg viewBox="0 0 320 64" preserveAspectRatio="none" className="batch-header-svg" aria-hidden="true">
      <defs>
        <linearGradient id="b-card-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1B5E20" />
          <stop offset="70%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#388E3C" />
        </linearGradient>
      </defs>
      <rect width="320" height="64" fill="url(#b-card-grad)" />
      {/* Stylized Leaf Silhouette */}
      <path
        d="M-20 64 C20 10, 80 0, 140 25 C110 50, 70 70, 0 64 Z"
        fill="#ffffff"
        opacity="0.08"
      />
      {/* Mulberry leaf icon */}
      <path
        d="M260 48 C250 25, 275 10, 305 15 C295 40, 275 55, 260 48 Z"
        fill="#81C784"
        opacity="0.25"
      />
      {/* Cocoon silhouette */}
      <ellipse cx="295" cy="38" rx="14" ry="9" transform="rotate(-20 295 38)" fill="#FFF9C4" opacity="0.4" />
      {/* Silkworm outline */}
      <path
        d="M170 42 C185 38, 200 40, 215 36 C225 33, 230 38, 225 43 C210 48, 190 47, 170 45 Z"
        fill="#FFFFFF"
        opacity="0.2"
      />
    </svg>
    <div className="batch-header-overlay">
      <div className="batch-species-info">
        <span className="batch-species-title">Bombyx mori (Mulberry)</span>
        <span className="batch-cycle-counter">Day {day} of {maxDays}</span>
      </div>
      <div className="batch-stage-pill bombyx">
        <span className="live-pulse-dot" />
        <span>{stageName}</span>
      </div>
    </div>
  </div>
);

// 4. Compact Header Banner for Batches (Eri Silkworm)
export const EriBatchCardHeader: React.FC<{ day: number; maxDays: number; stageName: string }> = ({
  day,
  maxDays,
  stageName,
}) => (
  <div className="batch-header-visual eri-card-header">
    <svg viewBox="0 0 320 64" preserveAspectRatio="none" className="batch-header-svg" aria-hidden="true">
      <defs>
        <linearGradient id="e-card-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BF360C" />
          <stop offset="70%" stopColor="#D84315" />
          <stop offset="100%" stopColor="#E64A19" />
        </linearGradient>
      </defs>
      <rect width="320" height="64" fill="url(#e-card-grad)" />
      {/* Castor Leaf Silhouette */}
      <path
        d="M275 35 L285 15 L295 28 L310 20 L305 38 L320 48 L300 50 L295 65 L282 52 L268 62 L275 45 Z"
        fill="#ffffff"
        opacity="0.1"
      />
      {/* Spun Cocoon */}
      <ellipse cx="250" cy="36" rx="13" ry="8" transform="rotate(25 250 36)" fill="#FFE0B2" opacity="0.35" />
    </svg>
    <div className="batch-header-overlay">
      <div className="batch-species-info">
        <span className="batch-species-title">Eri Silkworm (Castor)</span>
        <span className="batch-cycle-counter">Day {day} of {maxDays}</span>
      </div>
      <div className="batch-stage-pill eri">
        <span className="live-pulse-dot" />
        <span>{stageName}</span>
      </div>
    </div>
  </div>
);

// 5. Stage Illustrated Icons for Lifecycle Roadmap (PlanView)
export const StageMilestoneIcon: React.FC<{
  stageName: string;
  isMoult?: boolean;
  isHarvest?: boolean;
}> = ({ stageName, isMoult, isHarvest }) => {
  const s = stageName.toLowerCase();

  if (s.includes('egg') || s.includes('incubation')) {
    return (
      <svg viewBox="0 0 36 36" width="34" height="34" className="stage-milestone-svg" aria-hidden="true">
        <circle cx="18" cy="18" r="16" fill="#FFF9C4" stroke="#FBC02D" strokeWidth="1.5" />
        {/* Egg cluster on egg card */}
        <circle cx="14" cy="14" r="2.5" fill="#5D4037" />
        <circle cx="20" cy="13" r="2.5" fill="#5D4037" />
        <circle cx="23" cy="18" r="2.5" fill="#4E342E" />
        <circle cx="18" cy="21" r="2.5" fill="#5D4037" />
        <circle cx="13" cy="19" r="2.5" fill="#4E342E" />
        <circle cx="18" cy="17" r="2" fill="#8D6E63" />
      </svg>
    );
  }

  if (isMoult || s.includes('moult')) {
    return (
      <svg viewBox="0 0 36 36" width="34" height="34" className="stage-milestone-svg" aria-hidden="true">
        <circle cx="18" cy="18" r="16" fill="#FFF3E0" stroke="#FF9800" strokeWidth="1.5" />
        {/* Caterpillar in raised-head resting moult posture */}
        <path
          d="M10 24 Q18 25 22 21 Q25 15 27 12 Q28 15 26 18 Q23 26 10 26 Z"
          fill="#FFB74D"
        />
        <circle cx="26" cy="13" r="2" fill="#E65100" />
      </svg>
    );
  }

  if (isHarvest || s.includes('cocoon') || s.includes('harvest')) {
    return (
      <svg viewBox="0 0 36 36" width="34" height="34" className="stage-milestone-svg" aria-hidden="true">
        <circle cx="18" cy="18" r="16" fill="#FFFDE7" stroke="#FBC02D" strokeWidth="1.5" />
        {/* Golden silk cocoon */}
        <ellipse cx="18" cy="18" rx="10" ry="6.5" transform="rotate(-25 18 18)" fill="#FFF59D" stroke="#F57F17" strokeWidth="1.2" />
        <path d="M12 17 Q18 14 24 19" stroke="#E65100" strokeWidth="0.8" fill="none" opacity="0.6" />
      </svg>
    );
  }

  if (s.includes('spinning') || s.includes('mount')) {
    return (
      <svg viewBox="0 0 36 36" width="34" height="34" className="stage-milestone-svg" aria-hidden="true">
        <circle cx="18" cy="18" r="16" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="1.5" />
        {/* Rotary Chandrike frame & spinning larva */}
        <rect x="8" y="8" width="20" height="20" rx="3" fill="none" stroke="#81C784" strokeWidth="1.5" />
        <line x1="8" y1="18" x2="28" y2="18" stroke="#A5D6A7" strokeWidth="1" />
        <line x1="18" y1="8" x2="18" y2="28" stroke="#A5D6A7" strokeWidth="1" />
        <path d="M12 14 Q18 10 24 22" stroke="#FDD835" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  if (s.includes('moth') || s.includes('emergence')) {
    return (
      <svg viewBox="0 0 36 36" width="34" height="34" className="stage-milestone-svg" aria-hidden="true">
        <circle cx="18" cy="18" r="16" fill="#F3E5F5" stroke="#BA68C8" strokeWidth="1.5" />
        {/* Silk Moth Wings */}
        <ellipse cx="12" cy="16" rx="6" ry="4" transform="rotate(-30 12 16)" fill="#E1BEE7" stroke="#8E24AA" strokeWidth="0.8" />
        <ellipse cx="24" cy="16" rx="6" ry="4" transform="rotate(30 24 16)" fill="#E1BEE7" stroke="#8E24AA" strokeWidth="0.8" />
        <ellipse cx="18" cy="18" rx="2.5" ry="6" fill="#6A1B9A" />
      </svg>
    );
  }

  // Active feeding larval stage (Chawki or Late age)
  return (
    <svg viewBox="0 0 36 36" width="34" height="34" className="stage-milestone-svg" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="1.5" />
      {/* Mulberry Leaf + Larva */}
      <path d="M10 24 C8 15, 18 10, 26 12 C24 22, 18 28, 12 26 Z" fill="#4CAF50" />
      <path d="M14 20 Q20 18 25 21" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};
