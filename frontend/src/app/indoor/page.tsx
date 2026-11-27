"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  Wind,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Cigarette,
  Layers,
  Droplets,
  Users,
  Gauge,
  Send,
  RefreshCw,
  Clock,
  ChevronRight,
  Info,
  Copy,
  Check,
  Trash2,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApiClient } from "@/services/api";
import {
  IndoorAssessment,
  IndoorAssessmentCreatePayload,
  IndoorAIAdviceResponse,
} from "@/types";

interface IndoorChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: IndoorAIAdviceResponse;
  timestamp: string;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-foreground-secondary">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1 py-0.5 rounded bg-surface-subtle border border-border-subtle font-mono text-[11px] text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedAssistantMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "bullet" | "number"; items: { prefix?: string; text: string }[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!currentList || currentList.items.length === 0) return;
    if (currentList.type === "bullet") {
      elements.push(
        <div key={`${keyPrefix}-bullet-group`} className="space-y-1.5 my-2">
          {currentList.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div className="flex-1">{renderInlineMarkdown(item.text)}</div>
            </div>
          ))}
        </div>
      );
    } else {
      elements.push(
        <div key={`${keyPrefix}-num-group`} className="space-y-1.5 my-2">
          {currentList.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.prefix || idx + 1}
              </span>
              <div className="flex-1">{renderInlineMarkdown(item.text)}</div>
            </div>
          ))}
        </div>
      );
    }
    currentList = null;
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(`flush-${idx}`);
      return;
    }

    if (line.startsWith("#")) {
      flushList(`hdr-${idx}`);
      const headerText = line.replace(/^#+\s*/, "");
      elements.push(
        <div key={`h-${idx}`} className="flex items-center gap-2 pt-3 pb-1 border-b border-border-subtle first:pt-0 mb-2">
          <div className="w-1.5 h-4 rounded-full bg-primary flex-shrink-0" />
          <h4 className="font-bold text-xs sm:text-sm tracking-tight text-foreground">
            {headerText}
          </h4>
        </div>
      );
      return;
    }

    const calloutMatch = line.match(/^\*\*(Simple Summary|Scientific Mechanism|Key Takeaway|Core Guidance|Key Insights|Actionable Guidance|Essential Action Steps|Health Warning|Emergency Notice):\*\*\s*(.*)/i);
    if (calloutMatch) {
      flushList(`callout-${idx}`);
      const [, title, rest] = calloutMatch;
      elements.push(
        <div key={`callout-${idx}`} className="p-3 my-2 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{title}</span>
          </div>
          {rest && (
            <p className="text-xs leading-relaxed text-foreground">
              {renderInlineMarkdown(rest)}
            </p>
          )}
        </div>
      );
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "bullet") {
        flushList(`switch-b-${idx}`);
        currentList = { type: "bullet", items: [] };
      }
      currentList.items.push({ text: bulletMatch[1] });
      return;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (!currentList || currentList.type !== "number") {
        flushList(`switch-n-${idx}`);
        currentList = { type: "number", items: [] };
      }
      currentList.items.push({ prefix: numMatch[1], text: numMatch[2] });
      return;
    }

    const sectionLabelMatch = line.match(/^\*\*([^*]+):\*\*\s*$/);
    if (sectionLabelMatch) {
      flushList(`sec-${idx}`);
      elements.push(
        <div key={`sec-${idx}`} className="font-semibold text-xs tracking-tight pt-2 pb-0.5 text-primary flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>{sectionLabelMatch[1]}</span>
        </div>
      );
      return;
    }

    flushList(`p-${idx}`);
    elements.push(
      <p key={`p-${idx}`} className="text-xs leading-relaxed text-foreground my-1">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList("final");

  return <div className="space-y-1">{elements}</div>;
}

function generateClientIndoorFallback(question: string, roomType: string = "bedroom"): IndoorAIAdviceResponse {
  const lower = question.toLowerCase().trim();
  const room = (roomType || "bedroom").replace("_", " ").toLowerCase();

  if (lower.includes("bedroom") || lower.includes("sleep") || lower.includes("night") || lower.includes("bed")) {
    return {
      explanation:
        "### Bedroom Air Quality & Restorative Sleep Protocol\n\n" +
        "**Simple Summary:**\n" +
        "During 7–8 hours of nocturnal sleep, closed windows and doors trap respiratory carbon dioxide (CO2 > 1200 ppm) and allow microscopic dust mite allergens to settle in your direct breathing zone.\n\n" +
        "**Scientific Mechanism:**\n" +
        "Human respiration expels carbon dioxide continuously. Without gentle cross-ventilation, elevated nocturnal CO2 impairs sleep depth, triggers restless micro-arousals, and causes morning grogginess. Bedding also acts as an allergen reservoir for dust mite fragments.\n\n" +
        "**Essential Action Steps:**\n" +
        "1. **Continuous Overnight Filtration:** Place a True HEPA air purifier 3–5 feet from the bed on quiet sleep mode.\n" +
        "2. **Allergen-Proof Encasements:** Cover mattresses and pillows with zippered micro-weave barrier encasements.\n" +
        "3. **Staggered Door Air Exchange:** Keep the bedroom door cracked open 2–4 inches to maintain air circulation and keep CO2 below 1000 ppm.\n" +
        "4. **Zero-Combustion Bedroom Rule:** Never burn incense, scented candles, or mosquito coils inside sleeping quarters.",
      action_steps: [
        "Keep the bedroom door cracked open 2–4 inches to prevent nocturnal CO2 buildup.",
        "Encase pillows and mattress in certified allergy-proof barrier covers.",
        "Run a True HEPA purifier in the bedroom continuously on quiet sleep mode.",
      ],
      daily_routine: [
        "Morning (7:30 AM): Open bedroom door and windows for 10 minutes if outdoor AQI is moderate or good.",
        "Afternoon (2:00 PM): Keep bedding turned back to let mattress moisture evaporate.",
        "Night (10:00 PM): Close exterior windows, turn on HEPA cleaner, and set room to 20–22°C.",
      ],
      weekly_maintenance: [
        "Wash pillowcases and bed sheets in hot water (>55°C / 130°F) to eliminate dust mites.",
        "Wipe headboards, blinds, and baseboards with a damp microfiber cloth.",
        "Vacuum mattress surface and under-bed carpeting using a HEPA vacuum.",
      ],
      model: "AIRWISE Grounded Environmental Engine",
      disclaimer: "Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement.",
    };
  }

  if (lower.includes("kitchen") || lower.includes("cook") || lower.includes("stove") || lower.includes("gas") || lower.includes("lpg") || lower.includes("fry")) {
    return {
      explanation:
        "### Kitchen Ventilation & Cooking Emission Control\n\n" +
        "**Simple Summary:**\n" +
        "Domestic cooking—especially frying, searing, and unvented gas combustion—is the single largest episodic source of indoor toxic air pollution, generating nitrogen dioxide (NO2), carbon monoxide (CO), and ultrafine lipid aerosols.\n\n" +
        "**Scientific Mechanism:**\n" +
        "Gas burners combust atmospheric air at temperatures exceeding 1,200°C, producing reactive nitrogen oxides (NOx) that inflame airways. Cooking oils heated past their smoke point undergo thermal degradation, releasing volatile aldehydes alongside PM2.5 particles.\n\n" +
        "**Essential Action Steps:**\n" +
        "1. **Pre-Ignition Exhaust Activation:** Turn on the kitchen exhaust hood 1 minute *before* igniting the stove and keep it running for 5–10 minutes *after* turning off the flame.\n" +
        "2. **Isolate Cooking Zones:** Keep kitchen doors closed to adjoining living spaces while cooking to prevent aerosol migration into bedrooms.\n" +
        "3. **Cooktop Lids & Splatter Screens:** Cover pots and frying pans with fitted lids to trap evaporating grease droplets before they aerosolize.\n" +
        "4. **Electric Induction Transition:** Transition to electric induction cooking where feasible, completely eliminating nitrogen dioxide and gas combustion hydrocarbons.",
      action_steps: [
        "Run kitchen exhaust fan on maximum before igniting burners and for 10 min after cooking.",
        "Keep kitchen doors closed to isolate cooking emissions from living spaces.",
        "Use cookware lids to capture aerosolized oil droplets and volatile organic vapors.",
      ],
      daily_routine: [
        "Morning: Ensure kitchen exhaust fan grilles are clear before preparing breakfast.",
        "Midday: Open kitchen exterior window and run exhaust fan simultaneously while cooking.",
        "Evening: Wipe stove surface and surrounding backsplash immediately after dinner preparation.",
      ],
      weekly_maintenance: [
        "Degrease kitchen exhaust hood baffle filters in hot soapy water to maintain airflow rate.",
        "Wipe kitchen cabinets and overhead range hood exterior with a degreasing cloth.",
        "Inspect gas stove burner ports to ensure clean, blue-flame combustion without yellow soot.",
      ],
      model: "AIRWISE Grounded Environmental Engine",
      disclaimer: "Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement.",
    };
  }

  if (lower.includes("dust") || lower.includes("allergen") || lower.includes("allergy") || lower.includes("vacuum") || lower.includes("mite")) {
    return {
      explanation:
        "### Indoor Dust & Allergen Abatement Protocol\n\n" +
        "**Simple Summary:**\n" +
        "Household dust is a complex suspension of shed human skin flakes, pet dander, microscopic fabric lint, outdoor soil, and dust mite fragments that continually resuspends into your breathing zone with everyday foot traffic.\n\n" +
        "**Scientific Mechanism:**\n" +
        "Dry sweeping and feather dusters break electrostatic adhesion, propelling settled particles into the air where PM2.5 can remain suspended for up to 6 hours. Inhaled dust mite fecal particles cross the epithelial barrier, provoking allergic rhinitis and chronic airway hyperresponsiveness.\n\n" +
        "**Essential Action Steps:**\n" +
        "1. **Damp Microfiber Technique:** Always clean surfaces with a damp microfiber cloth; dry dusters merely redistribute fine particles into the air.\n" +
        "2. **Sealed True HEPA Vacuuming:** Use a vacuum with a fully sealed HEPA filtration system so motor exhaust does not discharge fine particles back into the room.\n" +
        "3. **Thermal Linen Washing:** Wash all bed sheets, pillowcases, and duvet covers weekly in water at or above 55°C (130°F) to denature allergenic proteins.\n" +
        "4. **Declutter Horizontal Surfaces:** Keep books, soft plush toys, and knick-knacks inside glass cabinets to reduce dust-gathering surface area.",
      action_steps: [
        "Switch exclusively to damp microfiber cloths for wiping furniture and surfaces.",
        "Use a certified sealed HEPA vacuum cleaner on carpets and upholstered sofas.",
        "Wash bed linens weekly at 55°C+ to neutralize dust mite allergens.",
      ],
      daily_routine: [
        "Morning: Leave bedroom shoes at the front doorway to prevent outdoor soil tracking.",
        "Afternoon: Do a quick 2-minute damp wipe on the primary dining and desk surfaces.",
        "Evening: Run air purifier in active living zones to capture daytime resuspended dust.",
      ],
      weekly_maintenance: [
        "Vacuum mattresses, upholstered chairs, and rugs thoroughly with slow, deliberate strokes.",
        "Launder pet bedding in hot water and brush pets outdoors to minimize indoor dander shedding.",
        "Vacuum air conditioner return grilles and ceiling fan blades.",
      ],
      model: "AIRWISE Grounded Environmental Engine",
      disclaimer: "Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement.",
    };
  }

  if (lower.includes("smog") || lower.includes("outdoor") || lower.includes("wildfire") || lower.includes("stubble") || lower.includes("haze")) {
    return {
      explanation:
        "### Indoor Defense Strategy During Severe Outdoor Air Pollution\n\n" +
        "**Simple Summary:**\n" +
        "When ambient outdoor AQI enters Poor, Very Poor, or Severe categories (>200), toxic fine particulates (PM2.5) infiltrate indoor living spaces within 30 to 60 minutes through window crevices and door gaps unless physical sealing and mechanical filtration are actively maintained.\n\n" +
        "**Scientific Mechanism:**\n" +
        "Thermal stack effects and wind pressures force ambient air through micro-fissures in window sills and doors (the infiltration rate typically averages 0.5 to 1.5 air changes per hour). Without active indoor filtration, indoor particulate levels can rise to 70–80% of outdoor ambient concentrations.\n\n" +
        "**Essential Action Steps:**\n" +
        "1. **Seal Perimeter Entrances:** Apply silicone or adhesive rubber weatherstripping along exterior window sashes and place draft-stopper rolls at bottom door thresholds.\n" +
        "2. **Designate a Clean Air Sanctuary:** Fortify one primary room (such as the main bedroom) with an appropriately sized True HEPA air purifier running on continuous medium mode.\n" +
        "3. **HVAC Internal Recirculation:** Switch air conditioning or heat pumps strictly to internal recirculate mode to avoid drawing unfiltered outdoor smog.\n" +
        "4. **Halt Natural Ventilation:** Keep all exterior windows closed during high smog periods; postpone airing rooms until regional winds improve or rain washes out atmospheric particulates.",
      action_steps: [
        "Keep all exterior windows and balconies firmly closed throughout severe pollution spells.",
        "Apply draft stoppers to exterior door thresholds to restrict outdoor smog infiltration.",
        "Run a True HEPA air purifier continuously on medium/high in a designated clean room.",
      ],
      daily_routine: [
        "Morning (7:00 AM): Check real-time outdoor station AQI on AIRWISE AI before considering any ventilation.",
        "Midday (1:00 PM): Verify window seals and door draft stoppers are firmly in place.",
        "Night (9:00 PM): Keep all bedroom windows locked shut with air purifier set to medium sleep speed.",
      ],
      weekly_maintenance: [
        "Inspect air purifier pre-filters; gently vacuum off heavy particulate coatings.",
        "Wipe down window sills with a damp cloth to remove settled infiltration dust.",
        "Inspect window weatherstripping gaskets for any gaps or detachment.",
      ],
      model: "AIRWISE Grounded Environmental Engine",
      disclaimer: "Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement.",
    };
  }

  if (lower.includes("purifier") || lower.includes("hepa") || lower.includes("filter") || lower.includes("cadr")) {
    return {
      explanation:
        "### Air Purifier Selection & Optimization Strategy\n\n" +
        "**Simple Summary:**\n" +
        "A mechanical True HEPA air purifier is the most rigorously validated technology for reducing indoor particulate pollution, capturing 99.97% of airborne particles down to 0.3 micrometers without producing chemical byproducts.\n\n" +
        "**Scientific Mechanism:**\n" +
        "True HEPA filters use dense borosilicate glass fiber matrices that capture particles through direct impaction, interception, and Brownian diffusion. Particles smaller than 0.1 microns and larger than 0.4 microns are captured with >99.9% efficiency, while 0.3 microns represents the Most Penetrating Particle Size (MPPS).\n\n" +
        "**Essential Action Steps:**\n" +
        "1. **Confirm True HEPA Certification:** Reject ambiguous labels like 'HEPA-type' or 'HEPA-grade'; verify certified H13 or H14 medical-grade HEPA media.\n" +
        "2. **Check CADR Sizing:** Calculate room volume (length × width × height in meters) and ensure the purifier CADR provides at least 4 to 5 complete Air Changes per Hour (ACH).\n" +
        "3. **Optimal Placement:** Position the unit centrally in the room with at least 1.5 to 2 feet of clear clearance on all sides; avoid placing it flush against walls or behind curtains.\n" +
        "4. **Avoid Ozone Generators and Ionizers:** Avoid uncertified electrostatic precipitators or plasma ionizers that generate secondary ozone (O3), which is a potent lung irritant.",
      action_steps: [
        "Select an H13/H14 certified True HEPA purifier sized to provide 4–5 air changes per hour.",
        "Position the purifier centrally in the room with unobstructed airflow on all sides.",
        "Run the purifier on medium/sleep mode continuously rather than intermittent 10-minute bursts.",
      ],
      daily_routine: [
        "Morning: Turn purifier from sleep mode up to medium speed as room activity begins.",
        "Midday: Ensure no clothing, papers, or toys are obstructing the air intake grilles.",
        "Night: Set purifier to low/sleep mode in the bedroom 30 minutes before retiring to bed.",
      ],
      weekly_maintenance: [
        "Vacuum or rinse the front mesh pre-filter to stop coarse dust from clogging the main HEPA media.",
        "Check the unit's filter lifespan indicator on the console.",
        "Wipe the external plastic casing and particle sensor inlet with a dry microfiber cloth.",
      ],
      model: "AIRWISE Grounded Environmental Engine",
      disclaimer: "Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement.",
    };
  }

  if (lower.includes("mold") || lower.includes("damp") || lower.includes("humidity") || lower.includes("moisture") || lower.includes("fungus")) {
    return {
      explanation:
        "### Mold Prevention & Indoor Moisture Management\n\n" +
        "**Simple Summary:**\n" +
        "Relative indoor humidity consistently above 60% creates the microclimate required for mold colonies (Aspergillus, Cladosporium) to flourish on drywall, bathroom grout, and behind furniture, releasing allergenic spores and mycotoxins.\n\n" +
        "**Scientific Mechanism:**\n" +
        "Fungal spores are ubiquitous in ambient air and require only liquid moisture or sustained high relative humidity (>60% RH) on organic substrates to germinate. Inhaled fungal glucans provoke chronic mucosal inflammation, nasal congestion, and asthma flare-ups.\n\n" +
        "**Essential Action Steps:**\n" +
        "1. **Maintain 40%–50% Relative Humidity:** Use a digital thermo-hygrometer to monitor moisture; deploy a compressor dehumidifier if indoor humidity exceeds 55%.\n" +
        "2. **Bathroom Moisture Extraction:** Run bathroom exhaust fans during showers and for at least 20 minutes afterward with the bathroom door closed to outside rooms.\n" +
        "3. **Eliminate Cold Thermal Bridges:** Pull furniture, wardrobes, and beds at least 3 to 4 inches away from exterior cold walls to allow thermal circulation and prevent condensation.\n" +
        "4. **Non-Toxic Mold Remediation:** Clean minor surface mold using white distilled vinegar (5% acetic acid) or sodium percarbonate rather than household bleach, which fails to penetrate porous surfaces.",
      action_steps: [
        "Keep indoor relative humidity strictly between 40% and 50% using ventilation or dehumidifiers.",
        "Run bathroom exhaust fans for 20 minutes after bathing to exhaust moisture.",
        "Pull beds and wardrobes 3 inches away from cold exterior walls to prevent condensation.",
      ],
      daily_routine: [
        "Morning: Wipe down any condensation droplets on bedroom window glass and frames.",
        "Midday: Check digital hygrometer reading; if humidity exceeds 60%, activate dehumidification.",
        "Evening: Ensure kitchen and bathroom exhaust dampers close securely to prevent reverse drafts.",
      ],
      weekly_maintenance: [
        "Inspect under bathroom and kitchen sinks for slow pipe seepage or moisture stains.",
        "Wipe bathroom tile joints and silicone seals with an antifungal vinegar solution.",
        "Empty and rinse the dehumidifier water tank to prevent bacterial biofilm buildup.",
      ],
      model: "AIRWISE Grounded Environmental Engine",
      disclaimer: "Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement.",
    };
  }

  // Default general room synthesis
  return {
    explanation:
      `### Environmental Air Quality Protocol for ${room.charAt(0).toUpperCase() + room.slice(1)}\n\n` +
      "**Simple Summary:**\n" +
      `Optimizing air quality in your ${room} requires an integrated approach: eliminating internal pollutant sources, synchronizing ventilation with outdoor clean air windows, and deploying continuous particulate filtration.\n\n` +
      "**Scientific Mechanism:**\n" +
      "Indoor spaces concentrate respiratory CO2, volatile organic compounds (VOCs) from furnishings, and resuspended particulates up to 5 times higher than outdoor ambient air when ventilation is restricted. Active source elimination combined with HEPA filtration restores healthy respiration parameters.\n\n" +
      "**Essential Action Steps:**\n" +
      "1. **Source Control First:** Remove or isolate indoor emission sources (combustion fuels, synthetic sprays, incense, open flame) before relying on air filtration.\n" +
      "2. **Synchronized Ventilation:** Cross-ventilate for 15 minutes during early afternoon hours (1:00 PM – 3:00 PM) when atmospheric mixing is highest and outdoor AQI is at its daily minimum.\n" +
      "3. **Targeted True HEPA Filtration:** Run a certified H13 HEPA air purifier sized for your room volume to capture microscopic particulates (PM2.5, pollen, dander).\n" +
      "4. **Damp Microfiber Wiping:** Clean surfaces exclusively with damp microfiber towels to capture settled dust without resuspending it into the air.",
    action_steps: [
      `Target primary risk factor: address ventilation and room sources in your ${room}.`,
      "Wipe furniture and surfaces with damp microfiber cloths to capture settled particulates.",
      "Position a True HEPA air purifier in the central breathing zone of the room.",
    ],
    daily_routine: [
      "Morning (7:30 AM): Check outdoor AQI on AIRWISE AI before opening windows for ventilation.",
      "Midday (1:30 PM): Open opposing windows for 15 minutes of cross-ventilation if outdoor AQI is moderate.",
      "Evening (9:30 PM): Close exterior windows and run air cleaner on quiet mode overnight.",
    ],
    weekly_maintenance: [
      "Vacuum room floors and carpets using a vacuum with a sealed HEPA exhaust filter.",
      "Rinse or vacuum air purifier mesh pre-filters to prolong main HEPA filter lifespan.",
      "Inspect corners and window seals for moisture accumulation or dust buildup.",
    ],
    model: "AIRWISE Grounded Environmental Engine",
    disclaimer: "Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement.",
  };
}

export default function IndoorAirPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <IndoorAirContent />
      </AppLayout>
    </AuthGuard>
  );
}

function IndoorAirContent() {
  const [latestAssessment, setLatestAssessment] = useState<IndoorAssessment | null>(null);
  const [assessmentsHistory, setAssessmentsHistory] = useState<IndoorAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Questionnaire Form State
  const [formData, setFormData] = useState<IndoorAssessmentCreatePayload>({
    room_type: "bedroom",
    room_name: "Primary Bedroom",
    ventilation: "moderate",
    cooking_fuel: "lpg",
    smoking_exposure: false,
    air_purifier: false,
    dust_or_smoke: false,
    mold_dampness: false,
    occupants: 2,
    sensor_readings: null,
  });

  const [hasSensorInput, setHasSensorInput] = useState(false);
  const [sensorValues, setSensorValues] = useState({
    pm25: "",
    pm10: "",
    co2: "",
    temperature: "",
    humidity: "",
  });

  // AI Assistant State & Conversational Session
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<IndoorAIAdviceResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<IndoorChatMessage[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const [latestRes, listRes] = await Promise.all([
        ApiClient.getLatestIndoorAssessment(),
        ApiClient.getIndoorAssessments(10),
      ]);
      if (latestRes.success && latestRes.data) {
        setLatestAssessment(latestRes.data);
      }
      if (listRes.success && listRes.data) {
        setAssessmentsHistory(listRes.data);
      }
    } catch (err) {
      console.error("Failed to load indoor assessments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: IndoorAssessmentCreatePayload = {
        ...formData,
        sensor_readings: hasSensorInput
          ? {
            pm25: sensorValues.pm25 ? parseFloat(sensorValues.pm25) : undefined,
            pm10: sensorValues.pm10 ? parseFloat(sensorValues.pm10) : undefined,
            co2: sensorValues.co2 ? parseFloat(sensorValues.co2) : undefined,
            temperature: sensorValues.temperature ? parseFloat(sensorValues.temperature) : undefined,
            humidity: sensorValues.humidity ? parseFloat(sensorValues.humidity) : undefined,
          }
          : null,
      };

      const res = await ApiClient.submitIndoorAssessment(payload);
      if (res.success && res.data) {
        setLatestAssessment(res.data);
        setAssessmentsHistory((prev) => [res.data, ...prev]);
        setShowForm(false);
      }
    } catch (err) {
      console.error("Failed to submit assessment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskAI = async (queryText?: string) => {
    const question = (queryText || aiQuestion).trim();
    if (!question) return;

    const userMsg: IndoorChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setAiQuestion("");
    setAiLoading(true);
    setAiError(null);

    const activeRoom = latestAssessment?.room_type || formData.room_type || "bedroom";

    try {
      const res = await ApiClient.consultIndoorAi({
        question,
        room_type: activeRoom,
        assessment_id: latestAssessment?.id,
      });

      if (res.success && res.data) {
        const assistantMsg: IndoorChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: res.data.explanation,
          data: res.data,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
        setAiResponse(res.data);
      } else {
        const fallback = generateClientIndoorFallback(question, activeRoom);
        const assistantMsg: IndoorChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: fallback.explanation,
          data: fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
        setAiResponse(fallback);
      }
    } catch (err) {
      console.warn("Falling back to client-side grounded intelligence:", err);
      const fallback = generateClientIndoorFallback(question, activeRoom);
      const assistantMsg: IndoorChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: fallback.explanation,
        data: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
      setAiResponse(fallback);
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    setAiResponse(null);
    setAiError(null);
  };

  const quickPrompts = [
    "How can I improve my bedroom air quality?",
    "What should I do if my kitchen has poor ventilation?",
    "How can I reduce indoor dust and allergen accumulation?",
    "What precautions should I take indoors during severe outdoor smog?",
    "Is a True HEPA air purifier beneficial for my room configuration?",
    "How do I prevent bathroom mold and regulate indoor humidity?",
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-16">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Home className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Indoor Air Quality
            </h1>
          </div>
          <p className="text-sm text-foreground-secondary mt-1 max-w-2xl">
            Understand room-specific risk factors, evaluate ventilation conditions, and receive personalized mitigation guidance grounded by environmental intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssessments}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showForm ? "Close Questionnaire" : "Start New Assessment"}
          </Button>
        </div>
      </div>

      {/* SECTION 1: Status & Hardware Sensor Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 bg-surface border-border-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">
                Current Room Assessment Status
              </h2>
            </div>
            {latestAssessment ? (
              <Badge
                variant={
                  latestAssessment.risk_score >= 75
                    ? "hazardous"
                    : latestAssessment.risk_score >= 55
                      ? "poor"
                      : latestAssessment.risk_score >= 30
                        ? "moderate"
                        : "good"
                }
              >
                {latestAssessment.risk_level} ({latestAssessment.risk_score}/100)
              </Badge>
            ) : (
              <Badge variant="outline">No Assessment Yet</Badge>
            )}
          </div>

          {latestAssessment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                  <span className="text-[11px] text-foreground-muted uppercase tracking-wider font-semibold">
                    Target Room
                  </span>
                  <p className="text-base font-bold text-foreground mt-0.5 capitalize">
                    {latestAssessment.room_name}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                  <span className="text-[11px] text-foreground-muted uppercase tracking-wider font-semibold">
                    Ventilation
                  </span>
                  <p className="text-base font-bold text-foreground mt-0.5 capitalize">
                    {latestAssessment.ventilation} Airflow
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                  <span className="text-[11px] text-foreground-muted uppercase tracking-wider font-semibold">
                    Air Purifier
                  </span>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {latestAssessment.air_purifier ? "Active HEPA" : "None Detected"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                  <span className="text-[11px] text-foreground-muted uppercase tracking-wider font-semibold">
                    Evaluated
                  </span>
                  <p className="text-xs font-medium text-foreground-secondary mt-1">
                    {new Date(latestAssessment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Identified Sources & Risk Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-surface-subtle/50 border border-border-subtle">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Identified Potential Sources
                  </h3>
                  <ul className="space-y-1 text-xs text-foreground-secondary">
                    {latestAssessment.identified_sources.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-surface-subtle/50 border border-border-subtle">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Immediate Priority Actions
                  </h3>
                  <ul className="space-y-1 text-xs text-foreground-secondary">
                    {latestAssessment.priority_actions.map((a, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  No Indoor Assessment Recorded
                </h3>
                <p className="text-xs text-foreground-secondary max-w-sm mx-auto mt-1">
                  Complete the 2-minute Smart Questionnaire to identify indoor pollution sources and receive custom ventilation strategies.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowForm(true)}
              >
                Assess My Room Now
              </Button>
            </div>
          )}
        </Card>

        {/* Real Sensor Hardware Card (No Fake Data) */}
        <Card className="p-5 bg-surface border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                <Wind className="w-4 h-4 text-primary" />
                Indoor Sensor Hardware
              </h2>
              <Badge variant="outline" size="sm">
                Strict Transparency
              </Badge>
            </div>

            {latestAssessment?.sensor_readings ? (
              <div className="space-y-2 mt-2">
                <p className="text-xs text-foreground-secondary">
                  Active readings from your connected monitor:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {latestAssessment.sensor_readings.pm25 !== undefined && (
                    <div className="p-2 rounded bg-surface-subtle border border-border-subtle">
                      <span className="text-foreground-muted text-[10px]">PM2.5</span>
                      <p className="font-bold text-foreground">{latestAssessment.sensor_readings.pm25} µg/m³</p>
                    </div>
                  )}
                  {latestAssessment.sensor_readings.co2 !== undefined && (
                    <div className="p-2 rounded bg-surface-subtle border border-border-subtle">
                      <span className="text-foreground-muted text-[10px]">CO2</span>
                      <p className="font-bold text-foreground">{latestAssessment.sensor_readings.co2} ppm</p>
                    </div>
                  )}
                  {latestAssessment.sensor_readings.temperature !== undefined && (
                    <div className="p-2 rounded bg-surface-subtle border border-border-subtle">
                      <span className="text-foreground-muted text-[10px]">Temp</span>
                      <p className="font-bold text-foreground">{latestAssessment.sensor_readings.temperature} °C</p>
                    </div>
                  )}
                  {latestAssessment.sensor_readings.humidity !== undefined && (
                    <div className="p-2 rounded bg-surface-subtle border border-border-subtle">
                      <span className="text-foreground-muted text-[10px]">Humidity</span>
                      <p className="font-bold text-foreground">{latestAssessment.sensor_readings.humidity} %</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-3">
                <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    No Hardware Sensor Connected
                  </div>
                  <p className="text-[11px] text-foreground-secondary leading-relaxed">
                    AIRWISE AI never fabricates indoor sensor readings or uses outdoor ambient AQI as indoor air quality. You can use our Smart Questionnaire to reliably assess indoor risk factors without owning a hardware device.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border-subtle text-[11px] text-foreground-muted flex items-center justify-between">
            <span>Standard: WHO / ASHRAE 62.2</span>
            <span>Zero Synthetic Readings</span>
          </div>
        </Card>
      </div>

      {/* SECTION 2: Interactive Smart Indoor Assessment Questionnaire Form */}
      {showForm && (
        <Card className="p-6 bg-surface border-primary/30 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Smart Indoor Environmental Questionnaire
              </h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Answer these 9 practical questions to diagnose airflow obstacles and potential indoor sources.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close Questionnaire"
              className="text-xs text-foreground-muted hover:text-foreground p-1"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Q1: Room Type */}
              <div className="space-y-1.5">
                <label htmlFor="indoor-room-type" className="text-xs font-semibold text-foreground">
                  1. Room Type
                </label>
                <select
                  id="indoor-room-type"
                  value={formData.room_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      room_type: e.target.value,
                      room_name: e.target.value.replace("_", " ").toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="bedroom" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Bedroom</option>
                  <option value="living_room" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Living Room</option>
                  <option value="kitchen" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Kitchen</option>
                  <option value="office" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Office / Study Room</option>
                  <option value="other" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Other Indoor Space</option>
                </select>
              </div>

              {/* Q2: Ventilation Condition */}
              <div className="space-y-1.5">
                <label htmlFor="indoor-ventilation" className="text-xs font-semibold text-foreground">
                  2. Ventilation Condition
                </label>
                <select
                  id="indoor-ventilation"
                  value={formData.ventilation}
                  onChange={(e) => setFormData({ ...formData, ventilation: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="poor" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Poor (Closed windows, no airflow, stale smell)</option>
                  <option value="moderate" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Moderate (Single window, partial natural draft)</option>
                  <option value="good" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Good (Cross-ventilation, operable exterior windows)</option>
                </select>
              </div>

              {/* Q3: Cooking Fuel */}
              <div className="space-y-1.5">
                <label htmlFor="indoor-cooking-fuel" className="text-xs font-semibold text-foreground">
                  3. Cooking Fuel In / Near Room
                </label>
                <select
                  id="indoor-cooking-fuel"
                  value={formData.cooking_fuel}
                  onChange={(e) => setFormData({ ...formData, cooking_fuel: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="lpg" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">LPG Gas Cylinder / Piped Natural Gas</option>
                  <option value="electricity" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Electric Induction / Ceramic</option>
                  <option value="biomass" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Biomass / Wood / Coal Chulha</option>
                  <option value="other" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Other Fuel Type</option>
                  <option value="na" className="bg-white dark:bg-[#0A0D0B] text-gray-900 dark:text-gray-100">Not Applicable (Far from cooking area)</option>
                </select>
              </div>

              {/* Q4: Smoking Exposure */}
              <fieldset className="space-y-1.5 border-none p-0 m-0">
                <legend className="text-xs font-semibold text-foreground">
                  4. Indoor Smoking Exposure
                </legend>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="smoking"
                      checked={formData.smoking_exposure === true}
                      onChange={() => setFormData({ ...formData, smoking_exposure: true })}
                      className="accent-primary"
                    />
                    Yes (Tobacco / Shisha / Incense)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="smoking"
                      checked={formData.smoking_exposure === false}
                      onChange={() => setFormData({ ...formData, smoking_exposure: false })}
                      className="accent-primary"
                    />
                    No (Smoke-free space)
                  </label>
                </div>
              </fieldset>

              {/* Q5: Air Purifier */}
              <fieldset className="space-y-1.5 border-none p-0 m-0">
                <legend className="text-xs font-semibold text-foreground">
                  5. Air Purifier Availability
                </legend>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="purifier"
                      checked={formData.air_purifier === true}
                      onChange={() => setFormData({ ...formData, air_purifier: true })}
                      className="accent-primary"
                    />
                    Yes (True HEPA Unit)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="purifier"
                      checked={formData.air_purifier === false}
                      onChange={() => setFormData({ ...formData, air_purifier: false })}
                      className="accent-primary"
                    />
                    No Purifier
                  </label>
                </div>
              </fieldset>

              {/* Q6: Dust or Visible Smoke */}
              <fieldset className="space-y-1.5 border-none p-0 m-0">
                <legend className="text-xs font-semibold text-foreground">
                  6. Visible Dust or Settled Smog
                </legend>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="dust"
                      checked={formData.dust_or_smoke === true}
                      onChange={() => setFormData({ ...formData, dust_or_smoke: true })}
                      className="accent-primary"
                    />
                    Yes (Noticeable dust on surfaces)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="dust"
                      checked={formData.dust_or_smoke === false}
                      onChange={() => setFormData({ ...formData, dust_or_smoke: false })}
                      className="accent-primary"
                    />
                    No (Minimal surface dust)
                  </label>
                </div>
              </fieldset>

              {/* Q7: Dampness or Mold */}
              <fieldset className="space-y-1.5 border-none p-0 m-0">
                <legend className="text-xs font-semibold text-foreground">
                  7. Dampness or Mold Concerns
                </legend>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="mold"
                      checked={formData.mold_dampness === true}
                      onChange={() => setFormData({ ...formData, mold_dampness: true })}
                      className="accent-primary"
                    />
                    Yes (Musty odor or damp patches)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="mold"
                      checked={formData.mold_dampness === false}
                      onChange={() => setFormData({ ...formData, mold_dampness: false })}
                      className="accent-primary"
                    />
                    No (Dry interior walls)
                  </label>
                </div>
              </fieldset>

              {/* Q8: Number of Occupants */}
              <div className="space-y-1.5">
                <label htmlFor="indoor-occupants" className="text-xs font-semibold text-foreground">
                  8. Regular Occupants Count
                </label>
                <input
                  id="indoor-occupants"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.occupants}
                  onChange={(e) => setFormData({ ...formData, occupants: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                />
              </div>

              {/* Q9 Toggle: Optional Measured Hardware Sensor */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground block">
                  9. Physical Sensor Measurements
                </span>
                <div className="pt-1">
                  <label htmlFor="indoor-sensor-toggle" className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      id="indoor-sensor-toggle"
                      type="checkbox"
                      checked={hasSensorInput}
                      onChange={(e) => setHasSensorInput(e.target.checked)}
                      className="accent-primary rounded"
                    />
                    I own an indoor monitor & want to input readings
                  </label>
                </div>
              </div>
            </div>

            {/* Optional Hardware Measurements Input Row */}
            {hasSensorInput && (
              <div className="p-4 rounded-lg bg-surface-subtle border border-border-subtle space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Hardware Sensor Readings (Optional)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label htmlFor="sensor-pm25" className="text-[10px] text-foreground-muted block mb-1">PM2.5 (µg/m³)</label>
                    <input
                      id="sensor-pm25"
                      type="number"
                      placeholder="e.g. 35"
                      value={sensorValues.pm25}
                      onChange={(e) => setSensorValues({ ...sensorValues, pm25: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="sensor-pm10" className="text-[10px] text-foreground-muted block mb-1">PM10 (µg/m³)</label>
                    <input
                      id="sensor-pm10"
                      type="number"
                      placeholder="e.g. 70"
                      value={sensorValues.pm10}
                      onChange={(e) => setSensorValues({ ...sensorValues, pm10: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="sensor-co2" className="text-[10px] text-foreground-muted block mb-1">CO2 (ppm)</label>
                    <input
                      id="sensor-co2"
                      type="number"
                      placeholder="e.g. 800"
                      value={sensorValues.co2}
                      onChange={(e) => setSensorValues({ ...sensorValues, co2: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="sensor-temp" className="text-[10px] text-foreground-muted block mb-1">Temp (°C)</label>
                    <input
                      id="sensor-temp"
                      type="number"
                      placeholder="e.g. 24"
                      value={sensorValues.temperature}
                      onChange={(e) => setSensorValues({ ...sensorValues, temperature: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="sensor-humidity" className="text-[10px] text-foreground-muted block mb-1">Humidity (%)</label>
                    <input
                      id="sensor-humidity"
                      type="number"
                      placeholder="e.g. 50"
                      value={sensorValues.humidity}
                      onChange={(e) => setSensorValues({ ...sensorValues, humidity: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-foreground-muted max-w-lg">
                * Note: This questionnaire is an environmental risk-factor assessment, not a certified clinical or medical diagnosis.
              </p>
              <Button type="submit" variant="primary" disabled={submitting} className="gap-2">
                {submitting ? "Analyzing Assessment..." : "Calculate Risk & Recommendations"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* SECTION 3: Personalized Recommendations & Ventilation Strategy */}
      {latestAssessment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 bg-surface border-border-subtle space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                Personalized Recommendations
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-foreground-secondary">
              {latestAssessment.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 p-2 rounded bg-surface-subtle/40 border border-border-subtle/50">
                  <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 bg-surface border-border-subtle space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
              <Wind className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                Ventilation & Airflow Guidelines
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-foreground-secondary">
              {latestAssessment.ventilation_tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 p-2 rounded bg-surface-subtle/40 border border-border-subtle/50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* SECTION 4: Gemini AI Indoor Air Assistant */}
      <Card className="p-6 bg-surface border-border-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Gemini AI Indoor Air Assistant
                </h3>
                <Badge variant="good" size="sm">
                  Grounded Environmental Intelligence
                </Badge>
              </div>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Ask specific questions about indoor pollution mitigation, bedroom air, kitchen ventilation, allergens, and purifier strategies.
              </p>
            </div>
          </div>
          {chatMessages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="text-xs gap-1.5 h-8 border-border-subtle text-foreground-secondary hover:text-foreground hover:bg-surface-subtle"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Consultation</span>
            </Button>
          )}
        </div>

        {/* Suggested Consultation Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
              Suggested Consultations:
            </span>
            <span className="text-[10px] text-foreground-muted">Click any prompt to consult</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskAI(p)}
                disabled={aiLoading}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-subtle hover:bg-surface-hover border border-border-subtle text-foreground-secondary hover:text-foreground transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <span>{p}</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Conversational Message Thread */}
        <div className="space-y-4 pt-2">
          {chatMessages.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-border-subtle bg-surface-subtle/40 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">
                Ready for Room-Specific Indoor Air Intelligence
              </h4>
              <p className="text-xs text-foreground-secondary max-w-md mx-auto">
                Ask a question below or choose a suggested topic above. The AI evaluates your room context (ventilation condition, room type, and sensor data) to deliver structured recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {msg.role === "user" ? (
                    <div className="flex items-start justify-end gap-2.5">
                      <div className="max-w-2xl p-3.5 rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/25 text-foreground text-xs leading-relaxed shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="font-semibold text-[11px] text-primary">You</span>
                          <span className="text-[10px] text-foreground-muted">{msg.timestamp}</span>
                        </div>
                        <p>{msg.content}</p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center text-xs flex-shrink-0 mt-1">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 p-5 rounded-2xl rounded-tl-sm bg-surface-subtle border border-border-subtle space-y-4 shadow-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <Bot className="w-3.5 h-3.5" />
                              AIRWISE Environmental Intelligence
                            </span>
                            <Badge variant="outline" size="sm" className="text-[10px]">
                              {msg.data?.model || "Google Gemini 2.5 Flash"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className="text-[11px] px-2 py-1 rounded bg-surface hover:bg-surface-hover border border-border-subtle text-foreground-secondary hover:text-foreground flex items-center gap-1 transition-all"
                              title="Copy Answer"
                            >
                              {copiedMessageId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-primary" />
                                  <span className="text-primary font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <span className="text-[10px] text-foreground-muted">{msg.timestamp}</span>
                          </div>
                        </div>

                        {/* Structured Markdown Rendering */}
                        <div className="text-xs text-foreground leading-relaxed">
                          <FormattedAssistantMessage content={msg.content} />
                        </div>

                        {/* Action Steps, Daily Routine & Maintenance Grid */}
                        {msg.data && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border-subtle/50">
                            <div className="p-3.5 rounded-xl bg-surface border border-border-subtle space-y-2">
                              <h4 className="text-[11px] font-bold text-foreground flex items-center gap-1.5 text-primary">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                Priority Action Steps
                              </h4>
                              <ul className="space-y-1.5 text-[11px] text-foreground-secondary">
                                {msg.data.action_steps.map((step, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-primary font-bold">•</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3.5 rounded-xl bg-surface border border-border-subtle space-y-2">
                              <h4 className="text-[11px] font-bold text-foreground flex items-center gap-1.5 text-primary">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                Structured Daily Routine
                              </h4>
                              <ul className="space-y-1.5 text-[11px] text-foreground-secondary">
                                {msg.data.daily_routine.map((routine, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-primary font-bold">•</span>
                                    <span>{routine}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3.5 rounded-xl bg-surface border border-border-subtle space-y-2">
                              <h4 className="text-[11px] font-bold text-foreground flex items-center gap-1.5 text-primary">
                                <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                                Weekly Maintenance Check
                              </h4>
                              <ul className="space-y-1.5 text-[11px] text-foreground-secondary">
                                {msg.data.weekly_maintenance.map((maint, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-primary font-bold">•</span>
                                    <span>{maint}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-foreground-muted italic pt-1">
                          * {msg.data?.disclaimer || "Environmental recommendation advisory only. Not a medical diagnosis or hardware sensor measurement."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !aiLoading && handleAskAI()}
            placeholder="Type an indoor air quality question (e.g. How to vent kitchen without letting outside dust in?)..."
            className="flex-grow px-3.5 py-2.5 text-xs rounded-lg bg-surface dark:bg-[#0A0D0B] border border-border-subtle dark:border-white/10 text-foreground dark:text-[#F9FAFB] focus:outline-none focus:border-primary shadow-sm"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAskAI()}
            disabled={aiLoading || !aiQuestion.trim()}
            className="gap-1.5 px-4"
          >
            <Send className={`w-3.5 h-3.5 ${aiLoading ? "animate-pulse" : ""}`} />
            {aiLoading ? "Consulting..." : "Ask Gemini"}
          </Button>
        </div>
      </Card>

      {/* SECTION 5: Previous Assessment History */}
      {assessmentsHistory.length > 0 && (
        <Card className="p-5 bg-surface border-border-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Previous Room Assessments
            </h3>
            <span className="text-xs text-foreground-muted">
              {assessmentsHistory.length} Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-foreground-secondary">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] text-foreground-muted uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Ventilation</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {assessmentsHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover/50">
                    <td className="py-2.5 px-3 text-foreground-muted">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground capitalize">
                      {item.room_name}
                    </td>
                    <td className="py-2.5 px-3 capitalize">{item.ventilation}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        size="sm"
                        variant={
                          item.risk_score >= 75
                            ? "hazardous"
                            : item.risk_score >= 55
                              ? "poor"
                              : item.risk_score >= 30
                                ? "moderate"
                                : "good"
                        }
                      >
                        {item.risk_level}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                      {item.risk_score}/100
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setLatestAssessment(item);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-primary hover:text-primary-hover text-[11px] h-7 px-2"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
