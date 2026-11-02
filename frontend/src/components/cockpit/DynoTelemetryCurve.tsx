import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingDown,
  ShieldAlert,
  Award,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  HelpCircle,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatINR, formatIndianDenomination } from '@/utils/formatters';

interface DynoTelemetryCurveProps {
  originalPrice: number;
  currentResalePrice: number;
  vehicleAge: number;
  fuel: string;
  segment?: string;
  brand?: string;
  model?: string;
  kmDriven?: number;
  className?: string;
}

type DrivingPace = 'low' | 'standard' | 'high';

export const DynoTelemetryCurve: React.FC<DynoTelemetryCurveProps> = ({
  originalPrice,
  currentResalePrice,
  vehicleAge,
  fuel,
  segment = 'Standard',
  brand = '',
  model = '',
  kmDriven = 45000,
  className = '',
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(Math.min(10, Math.max(0, vehicleAge)));
  const [drivingPace, setDrivingPace] = useState<DrivingPace>('standard');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const isGermanLuxury = ['audi', 'bmw', 'mercedes-benz', 'mercedes', 'jaguar', 'porsche', 'land rover', 'volvo'].some(
    (b) => brand.toLowerCase().includes(b)
  );
  const isHighRetentionBrand = ['maruti', 'toyota', 'honda', 'hyundai'].some(
    (b) => brand.toLowerCase().includes(b)
  );
  const isElectric = fuel.toLowerCase() === 'electric';
  const isSuv = segment.toLowerCase().includes('suv');

  // Baseline retention curve calibrated to AutoCX empirical regression models
  const baseRetention = [
    { year: 0, ret: 1.00, label: 'Showroom Delivery' },
    { year: 1, ret: 0.92, label: 'Initial Registration Drop' },
    { year: 2, ret: 0.85, label: 'Early Commuter Phase' },
    { year: 3, ret: 0.77, label: '★ Optimal Resale Apex' },
    { year: 4, ret: 0.70, label: 'Warranty Expiration Window' },
    { year: 5, ret: 0.63, label: 'Secondary Market Mainstream' },
    { year: 6, ret: 0.56, label: 'Mature Fleet Depreciation' },
    { year: 7, ret: 0.49, label: 'Post-Warranty Transition' },
    { year: 8, ret: 0.43, label: 'High-Mileage Decoupling' },
    { year: 9, ret: 0.38, label: 'Extended Utility Stage' },
    { year: 10, ret: 0.33, label: 'Chassis Floor Baseline' },
  ];

  // Dynamically compute calibrated curve points based on brand provenance, segment, and annual mileage
  const curvePoints = useMemo(() => {
    // Pace modifier: low mileage (+4%), high mileage (-6%)
    const paceModifier = drivingPace === 'low' ? 0.04 : drivingPace === 'high' ? -0.06 : 0.0;

    return baseRetention.map((pt) => {
      let r = pt.ret;

      // Brand Provenance adjustments (Indian secondary market dynamics)
      if (isHighRetentionBrand) {
        r += 0.05; // Maruti & Toyota high value retention
      } else if (isGermanLuxury && pt.year >= 4) {
        r -= 0.09; // Out-of-warranty steep German luxury discount
      }

      // Segment adjustments
      if (isSuv) r += 0.04;
      if (isElectric && pt.year >= 8) r -= 0.05; // Battery warranty threshold

      // Mileage pace adjustment (cumulative effect over time)
      if (pt.year > 0) {
        r += (paceModifier * (pt.year / 5));
      }

      // Bound retention cleanly between 12% and 100%
      r = Math.max(0.12, Math.min(1.0, r));

      const estimatedValue = Math.round(originalPrice * r);
      const totalDep = Math.round(originalPrice - estimatedValue);
      const annualLoss = pt.year === 0 ? 0 : Math.round(totalDep / pt.year);

      // Estimated cumulative mileage
      const kmPerYear = drivingPace === 'low' ? 8000 : drivingPace === 'high' ? 24000 : 14000;
      const projKm = pt.year * kmPerYear;
      const costPerKm = projKm === 0 ? 0 : parseFloat((totalDep / projKm).toFixed(2));

      return {
        year: pt.year,
        label: pt.label,
        retentionPct: parseFloat((r * 100).toFixed(1)),
        resaleValue: estimatedValue,
        totalDepreciation: totalDep,
        annualLossRate: annualLoss,
        costPerKm: costPerKm,
        projectedKm: projKm,
      };
    });
  }, [originalPrice, isHighRetentionBrand, isGermanLuxury, isSuv, isElectric, drivingPace]);

  // Current active inspected year point
  const activeYear = hoveredYear !== null ? hoveredYear : selectedYear;
  const inspectedPoint = curvePoints.find((p) => p.year === activeYear) || curvePoints[3];

  // SVG dimensions & scales
  const width = 640;
  const height = 240;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (year: number) => padLeft + (year / 10) * chartW;
  const getY = (retPct: number) => padTop + (1 - retPct / 100) * chartH;

  // Build SVG path string with smooth cubic bezier curve
  const pathD = useMemo(() => {
    if (curvePoints.length === 0) return '';
    let d = `M ${getX(curvePoints[0].year)} ${getY(curvePoints[0].retentionPct)}`;
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const p0 = curvePoints[i];
      const p1 = curvePoints[i + 1];
      const x0 = getX(p0.year);
      const y0 = getY(p0.retentionPct);
      const x1 = getX(p1.year);
      const y1 = getY(p1.retentionPct);
      const cpX = (x0 + x1) / 2;
      d += ` C ${cpX} ${y0}, ${cpX} ${y1}, ${x1} ${y1}`;
    }
    return d;
  }, [curvePoints]);

  const areaD = `${pathD} L ${getX(10)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

  // Action strategy categorization for inspected year
  const getActionRecommendation = (year: number) => {
    if (year <= 1) {
      return {
        badge: 'HOLD VEHICLE (HIGH EXIT COST)',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        strategy: 'Initial Showroom Exit Penalty',
        guidance:
          'Selling in Year 1 incurs the highest loss-per-km. Factory warranty is fully intact; holding through Year 3-4 amortizes your initial road tax and registration overhead.',
      };
    }
    if (year === 2) {
      return {
        badge: 'NORMAL COMMUTING WINDOW',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        strategy: 'Stable Retention Phase',
        guidance:
          'Vehicle is in prime operational condition. Depreciation rate flattens significantly compared to Year 1.',
      };
    }
    if (year === 3 || year === 4) {
      return {
        badge: '★ OPTIMAL RESALE APEX (RECOMMENDED EXIT)',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold',
        strategy: 'The Inflection Apex Sweet-Spot',
        guidance:
          'Highest capital recovery window! Sell or trade-in here to capture 70%–76% residual value before the 3-year factory warranty lapses and major scheduled maintenance (tires, brake rotors, fluids) arrives.',
      };
    }
    if (year >= 5 && year <= 7) {
      return {
        badge: 'MATURE COMMUTER / SERVICE DECISION',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        strategy: 'Post-Warranty Plateau',
        guidance:
          'Annual depreciation stabilizes at ~4–6% per year. Keep driving if scheduled maintenance is low, but anticipate lower secondary market buyer pool due to out-of-warranty financing constraints.',
      };
    }
    return {
      badge: 'EXTENDED UTILITY / SALVAGE BOUND',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
      strategy: 'Rolling Chassis Asset Floor',
      guidance:
        'Resale value has stabilized near the structural floor. Additional years of driving incur negligible incremental depreciation—vehicle value is now dictated strictly by mechanical reliability.',
    };
  };

  const rec = getActionRecommendation(activeYear);
  const currentVehiclePoint = curvePoints.find((p) => p.year === Math.min(10, Math.max(0, vehicleAge))) || curvePoints[0];

  return (
    <div className={`p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6 ${className}`}>
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              10-Year Lifecycle Resale Forecast & Exit Strategy
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Interactive Planner
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Data-supported depreciation trajectory across vehicle lifespan with data-driven selling advisories
          </p>
        </div>

        {/* Driving Pace Assumption Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 font-mono text-xs">
          <span className="text-[10px] text-slate-500 px-2 font-semibold uppercase">Mileage:</span>
          {(['low', 'standard', 'high'] as DrivingPace[]).map((pace) => (
            <button
              key={pace}
              onClick={() => setDrivingPace(pace)}
              className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-semibold cursor-pointer ${
                drivingPace === pace
                  ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {pace === 'low' ? 'Low (8k/yr)' : pace === 'standard' ? 'Avg (15k/yr)' : 'Heavy (24k/yr)'}
            </button>
          ))}
        </div>
      </div>

      {/* STRATEGIC APEX SUMMARY CALLOUT */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 mt-0.5">
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Model Recommendation:
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Resale Apex at Year 3 – Year 4
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              AutoCX empirical valuation data identifies <strong>Years 3 to 4</strong> as the optimal financial exit window. At this inflection point, your vehicle has survived the steep showroom depreciation cliff while retaining <strong>~70%–76% of its original purchase value</strong>, before post-warranty repair and tire/battery replacement costs begin discounting trade-ins.
            </p>
          </div>
        </div>

        {vehicleAge <= 10 && (
          <div className="shrink-0 p-3 rounded-lg bg-white border border-slate-200 text-center font-mono space-y-0.5 w-full md:w-auto">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Your Vehicle Status</span>
            <span className="text-xs font-bold text-slate-900 block">
              Year {vehicleAge} (~{currentVehiclePoint.retentionPct}% Retention)
            </span>
            <span className="text-[10px] text-cyan-700 block font-semibold">
              {vehicleAge >= 3 && vehicleAge <= 4 ? '★ Inside Recommended Window' : vehicleAge < 3 ? 'Hold to Amortize' : 'Past Apex Window'}
            </span>
          </div>
        )}
      </div>

      {/* INTERACTIVE SVG CURVE CANVAS */}
      <div className="relative rounded-2xl bg-slate-900 p-4 pt-6 border border-slate-800 shadow-inner overflow-hidden select-none">
        <div className="flex items-center justify-between pb-3 px-2 text-xs font-mono text-slate-400 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-400 rounded-full" />
              <span className="text-slate-200 font-semibold">Projected Resale Retention</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white" />
              <span>Current Position ({vehicleAge}y)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Recommended Apex (Y3–Y4)</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Click or hover any year node</span>
        </div>

        <svg className="w-full h-auto overflow-visible py-2" viewBox={`0 0 ${width} ${height}`}>
          {/* Shaded Resale Apex Window (Years 3 to 4) */}
          <rect
            x={getX(3)}
            y={padTop}
            width={getX(4) - getX(3)}
            height={chartH}
            fill="#f59e0b"
            opacity="0.10"
          />
          <line
            x1={getX(3)}
            y1={padTop}
            x2={getX(3)}
            y2={height - padBottom}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <line
            x1={getX(4)}
            y1={padTop}
            x2={getX(4)}
            y2={height - padBottom}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Horizontal Gridlines & Value Labels */}
          {[100, 75, 50, 25, 0].map((pct) => (
            <g key={pct}>
              <line
                x1={padLeft}
                y1={getY(pct)}
                x2={width - padRight}
                y2={getY(pct)}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray={pct === 0 ? undefined : '2 3'}
              />
              <text
                x={padLeft - 8}
                y={getY(pct) + 3}
                fill="#94a3b8"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                {pct}%
              </text>
              <text
                x={width - padRight + 8}
                y={getY(pct) + 3}
                fill="#64748b"
                fontSize="8"
                textAnchor="start"
                fontFamily="monospace"
              >
                {formatIndianDenomination(originalPrice * (pct / 100))}
              </text>
            </g>
          ))}

          {/* Vertical Year Gridlines */}
          {curvePoints.map((pt) => (
            <g key={pt.year}>
              <line
                x1={getX(pt.year)}
                y1={padTop}
                x2={getX(pt.year)}
                y2={height - padBottom}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x={getX(pt.year)}
                y={height - padBottom + 16}
                fill={activeYear === pt.year ? '#ffffff' : '#94a3b8'}
                fontSize={activeYear === pt.year ? '10' : '9'}
                fontWeight={activeYear === pt.year ? 'bold' : 'normal'}
                textAnchor="middle"
                fontFamily="monospace"
              >
                Y{pt.year}
              </text>
            </g>
          ))}

          {/* Area Fill Under Curve */}
          <path d={areaD} fill="url(#resale-gradient)" opacity="0.22" />

          <defs>
            <linearGradient id="resale-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Main Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Vehicle Position Beacon */}
          {vehicleAge <= 10 && (
            <g>
              <line
                x1={getX(vehicleAge)}
                y1={padTop}
                x2={getX(vehicleAge)}
                y2={height - padBottom}
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <circle
                cx={getX(vehicleAge)}
                cy={getY(currentVehiclePoint.retentionPct)}
                r="7"
                fill="#38bdf8"
                opacity="0.5"
                className="animate-ping"
              />
              <circle
                cx={getX(vehicleAge)}
                cy={getY(currentVehiclePoint.retentionPct)}
                r="5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Year Node Target Dots (Clickable & Hoverable) */}
          {curvePoints.map((pt) => {
            const isApex = pt.year === 3 || pt.year === 4;
            const isInspected = activeYear === pt.year;
            return (
              <g
                key={pt.year}
                className="cursor-pointer"
                onClick={() => setSelectedYear(pt.year)}
                onMouseEnter={() => setHoveredYear(pt.year)}
                onMouseLeave={() => setHoveredYear(null)}
              >
                {/* Hit area */}
                <circle cx={getX(pt.year)} cy={getY(pt.retentionPct)} r="14" fill="transparent" />

                {/* Visible dot */}
                <circle
                  cx={getX(pt.year)}
                  cy={getY(pt.retentionPct)}
                  r={isInspected ? '6' : isApex ? '4.5' : '3.5'}
                  fill={isInspected ? '#ffffff' : isApex ? '#f59e0b' : '#10b981'}
                  stroke={isInspected ? '#0284c7' : '#0f172a'}
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Pill inside Canvas */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Inspecting Year {inspectedPoint.year}:</span>
            <strong className="text-emerald-400 text-sm">{formatINR(inspectedPoint.resaleValue)}</strong>
            <span className="text-slate-400">({inspectedPoint.retentionPct}% Retention)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Annual Decay Rate:</span>
            <span className="text-rose-400 font-semibold">~{formatINR(inspectedPoint.annualLossRate)} / yr</span>
          </div>
        </div>
      </div>

      {/* YEAR SCRUBBER SLIDER */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-700" />
            <span>Interactive Lifecycle Timeline Scrubber:</span>
          </span>
          <span className="px-2.5 py-0.5 rounded bg-black text-white font-bold text-xs">
            Year {activeYear} ({activeYear === 0 ? 'Brand New' : `${activeYear} yrs old`})
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={activeYear}
          onChange={(e) => {
            const y = parseInt(e.target.value, 10);
            setSelectedYear(y);
            setHoveredYear(null);
          }}
          className="w-full accent-black cursor-pointer h-2 bg-slate-200 rounded-lg"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>Y0 (Purchase)</span>
          <span className="text-emerald-700 font-bold">Y3-Y4 (Resale Apex)</span>
          <span>Y7 (Mature)</span>
          <span>Y10 (Baseline Floor)</span>
        </div>
      </div>

      {/* STRATEGIC ADVISORY & RECOMMENDED PARAMETERS BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Card 1: Recommended Action */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Action Recommendation at Year {activeYear}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rec.badgeColor}`}>
              {rec.badge}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-sans">
            {rec.strategy}
          </div>
          <p className="text-slate-600 font-sans text-xs leading-relaxed">
            {rec.guidance}
          </p>
        </div>

        {/* Card 2: Financial Metrics at Selected Year */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
            Financial Parameters (Year {activeYear})
          </span>
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Expected Value:</span>
              <strong className="text-slate-900">{formatINR(inspectedPoint.resaleValue)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Value Retention:</span>
              <strong className="text-emerald-700">{inspectedPoint.retentionPct}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Lost:</span>
              <strong className="text-rose-600">-₹{inspectedPoint.totalDepreciation.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1">
              <span className="text-slate-600">Est. Usage Cost:</span>
              <strong className="text-slate-900">~₹{inspectedPoint.costPerKm}/km</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
