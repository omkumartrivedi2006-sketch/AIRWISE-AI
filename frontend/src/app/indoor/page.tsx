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

  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<IndoorAIAdviceResponse | null>(null);

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
    const question = queryText || aiQuestion;
    if (!question.trim()) return;

    setAiLoading(true);
    try {
      const res = await ApiClient.consultIndoorAi({
        question,
        room_type: latestAssessment?.room_type || formData.room_type,
        assessment_id: latestAssessment?.id,
      });
      if (res.success && res.data) {
        setAiResponse(res.data);
      }
    } catch (err) {
      console.error("Failed to consult indoor AI:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const quickPrompts = [
    "How can I improve my bedroom air quality?",
    "What should I do if my kitchen has poor ventilation?",
    "How can I reduce indoor dust and allergen accumulation?",
    "What precautions should I take indoors during severe outdoor smog?",
    "Is a True HEPA air purifier beneficial for my room configuration?",
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
              onClick={() => setShowForm(false)}
              className="text-xs text-foreground-muted hover:text-foreground p-1"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Q1: Room Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  1. Room Type
                </label>
                <select
                  value={formData.room_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      room_type: e.target.value,
                      room_name: e.target.value.replace("_", " ").toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface-subtle border border-border-subtle text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="bedroom">Bedroom</option>
                  <option value="living_room">Living Room</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="office">Office / Study Room</option>
                  <option value="other">Other Indoor Space</option>
                </select>
              </div>

              {/* Q2: Ventilation Condition */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  2. Ventilation Condition
                </label>
                <select
                  value={formData.ventilation}
                  onChange={(e) => setFormData({ ...formData, ventilation: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface-subtle border border-border-subtle text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="poor">Poor (Closed windows, no airflow, stale smell)</option>
                  <option value="moderate">Moderate (Single window, partial natural draft)</option>
                  <option value="good">Good (Cross-ventilation, operable exterior windows)</option>
                </select>
              </div>

              {/* Q3: Cooking Fuel */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  3. Cooking Fuel In / Near Room
                </label>
                <select
                  value={formData.cooking_fuel}
                  onChange={(e) => setFormData({ ...formData, cooking_fuel: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface-subtle border border-border-subtle text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="lpg">LPG Gas Cylinder / Piped Natural Gas</option>
                  <option value="electricity">Electric Induction / Ceramic</option>
                  <option value="biomass">Biomass / Wood / Coal Chulha</option>
                  <option value="other">Other Fuel Type</option>
                  <option value="na">Not Applicable (Far from cooking area)</option>
                </select>
              </div>

              {/* Q4: Smoking Exposure */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  4. Indoor Smoking Exposure
                </label>
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
              </div>

              {/* Q5: Air Purifier */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  5. Air Purifier Availability
                </label>
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
              </div>

              {/* Q6: Dust or Visible Smoke */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  6. Visible Dust or Settled Smog
                </label>
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
              </div>

              {/* Q7: Dampness or Mold */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  7. Dampness or Mold Concerns
                </label>
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
              </div>

              {/* Q8: Number of Occupants */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  8. Regular Occupants Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.occupants}
                  onChange={(e) => setFormData({ ...formData, occupants: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface-subtle border border-border-subtle text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Q9 Toggle: Optional Measured Hardware Sensor */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  9. Physical Sensor Measurements
                </label>
                <div className="pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
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
                    <label className="text-[10px] text-foreground-muted block mb-1">PM2.5 (µg/m³)</label>
                    <input
                      type="number"
                      placeholder="e.g. 35"
                      value={sensorValues.pm25}
                      onChange={(e) => setSensorValues({ ...sensorValues, pm25: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded bg-surface border border-border-subtle text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-foreground-muted block mb-1">PM10 (µg/m³)</label>
                    <input
                      type="number"
                      placeholder="e.g. 70"
                      value={sensorValues.pm10}
                      onChange={(e) => setSensorValues({ ...sensorValues, pm10: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded bg-surface border border-border-subtle text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-foreground-muted block mb-1">CO2 (ppm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 800"
                      value={sensorValues.co2}
                      onChange={(e) => setSensorValues({ ...sensorValues, co2: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded bg-surface border border-border-subtle text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-foreground-muted block mb-1">Temp (°C)</label>
                    <input
                      type="number"
                      placeholder="e.g. 24"
                      value={sensorValues.temperature}
                      onChange={(e) => setSensorValues({ ...sensorValues, temperature: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded bg-surface border border-border-subtle text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-foreground-muted block mb-1">Humidity (%)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={sensorValues.humidity}
                      onChange={(e) => setSensorValues({ ...sensorValues, humidity: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded bg-surface border border-border-subtle text-foreground"
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
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
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
                  Grounded Environmental AI
                </Badge>
              </div>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Ask specific questions about indoor pollution mitigation, ventilation routines, and allergen defense.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
            Suggested Consultations:
          </span>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiQuestion(p);
                  handleAskAI(p);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-subtle hover:bg-surface-hover border border-border-subtle text-foreground-secondary hover:text-foreground transition-all flex items-center gap-1.5"
              >
                <span>{p}</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
            placeholder="Type an indoor air quality question (e.g. How to vent kitchen without letting outside dust in?)..."
            className="flex-grow px-3.5 py-2.5 text-xs rounded-lg bg-surface-subtle border border-border-subtle text-foreground focus:outline-none focus:border-primary"
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

        {/* AI Response Display */}
        {aiResponse && (
          <div className="mt-4 p-5 rounded-xl bg-surface-subtle/80 border border-primary/20 space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle/50">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Expert Scientific Synthesis
                </span>
                <span className="text-[10px] text-foreground-muted">{aiResponse.model}</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                {aiResponse.explanation}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-surface border border-border-subtle">
                <h4 className="text-[11px] font-bold text-foreground mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Action Steps
                </h4>
                <ul className="space-y-1 text-[11px] text-foreground-secondary">
                  {aiResponse.action_steps.map((step, idx) => (
                    <li key={idx}>• {step}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-border-subtle">
                <h4 className="text-[11px] font-bold text-foreground mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Daily Routine
                </h4>
                <ul className="space-y-1 text-[11px] text-foreground-secondary">
                  {aiResponse.daily_routine.map((routine, idx) => (
                    <li key={idx}>• {routine}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-border-subtle">
                <h4 className="text-[11px] font-bold text-foreground mb-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Weekly Maintenance
                </h4>
                <ul className="space-y-1 text-[11px] text-foreground-secondary">
                  {aiResponse.weekly_maintenance.map((maint, idx) => (
                    <li key={idx}>• {maint}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-[10px] text-foreground-muted italic pt-1">
              * {aiResponse.disclaimer}
            </p>
          </div>
        )}
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
