import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart3, Settings, Eye, Users, TrendingUp, Activity,
    Save, CheckCircle, ExternalLink, Tag, Globe, Shield,
    Zap, MousePointer, AlertCircle, ChevronRight, X, Home, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AnalyticsConfig {
    gtm_id: string;
    meta_pixel_id: string;
    ga_measurement_id: string;
    clarity_id: string;
    hotjar_id: string;
    hotjar_sv: string;
    mixpanel_token: string;
    allowed_countries: string[];
    is_login_enabled: boolean;
}

const TOOL_DOCS: Record<string, string> = {
    gtm_id: "https://support.google.com/tagmanager/answer/6103696",
    meta_pixel_id: "https://developers.facebook.com/docs/meta-pixel/get-started",
    ga_measurement_id: "https://support.google.com/analytics/answer/9539598",
    clarity_id: "https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup",
    hotjar_id: "https://help.hotjar.com/hc/en-us/articles/115009336727",
    mixpanel_token: "https://docs.mixpanel.com/docs/tracking-methods/js",
};

type Tab = "dashboard" | "analytics";

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    change?: string;
    positive?: boolean;
    color: string;
}

function StatCard({ icon, label, value, change, positive, color }: StatCardProps) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${color}`}>
                {icon}
            </div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">{label}</div>
            {change && (
                <div className={`text-xs font-bold mt-2 ${positive ? "text-emerald-600" : "text-red-500"}`}>
                    {positive ? "↑" : "↓"} {change}
                </div>
            )}
        </div>
    );
}

interface ToolCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    fieldKey: keyof AnalyticsConfig;
    placeholder: string;
    value: string;
    onChange: (key: keyof AnalyticsConfig, value: string) => void;
    badge?: string;
    badgeColor?: string;
}

function ToolCard({ icon, title, description, fieldKey, placeholder, value, onChange, badge, badgeColor = "bg-blue-100 text-blue-700" }: ToolCardProps) {
    const [focused, setFocused] = useState(false);
    const isConfigured = !!value;

    return (
        <div className={`relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${focused ? "border-orange-400 shadow-lg shadow-orange-100" : isConfigured ? "border-emerald-300 shadow-sm" : "border-gray-100 shadow-sm"}`}>
            {isConfigured && (
                <div className="absolute top-4 right-4">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
            )}
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{title}</h3>
                            {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                    </div>
                </div>

                <div className="mt-5 flex gap-2">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(fieldKey, e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder={placeholder}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                    />
                    <a
                        href={TOOL_DOCS[fieldKey]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Documentation"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const [tab, setTab] = useState<Tab>("dashboard");
    const [config, setConfig] = useState<AnalyticsConfig>({
        gtm_id: "",
        meta_pixel_id: "",
        ga_measurement_id: "",
        clarity_id: "",
        hotjar_id: "",
        hotjar_sv: "",
        mixpanel_token: "",
        allowed_countries: ["PT", "LT", "LV"], // Default all 3 for now
        is_login_enabled: true,
    });
    const [showDisableLoginAlert, setShowDisableLoginAlert] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(false);

    const { data: gaStats, isLoading: gaLoading } = useQuery({
        queryKey: ["admin-ga-stats"],
        queryFn: () => fetch("/api/admin/ga-stats").then(r => {
            if (!r.ok) throw new Error("GA not configured");
            return r.json();
        }),
        enabled: authenticated && tab === "dashboard"
    });

    // Simple client-side password protection
    const ADMIN_PASSWORD = "joiner2024";

    useEffect(() => {
        if (!authenticated) return;
        fetch("/api/admin/analytics-config")
            .then((r) => r.json())
            .then((data) => {
                if (data && typeof data === "object") {
                    setConfig((prev) => ({ 
                        ...prev, 
                        ...data,
                        is_login_enabled: data.is_login_enabled !== false // Default to true if missing
                    }));
                }
            })
            .catch(() => setLoadError(true));
    }, [authenticated]);

    const handleChange = (key: keyof AnalyticsConfig, value: string) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await fetch("/api/admin/analytics-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert("Failed to save configuration.");
        } finally {
            setSaving(false);
        }
    };

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-xl">J</div>
                        <h1 className="text-2xl font-black text-white">Admin Access</h1>
                        <p className="text-gray-400 text-sm mt-1">Enter the admin password to continue</p>
                    </div>
                    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && password === ADMIN_PASSWORD && setAuthenticated(true)}
                            placeholder="Password"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
                        />
                        <Button
                            className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
                            onClick={() => {
                                if (password === ADMIN_PASSWORD) setAuthenticated(true);
                                else alert("Incorrect password");
                            }}
                        >
                            Enter Admin Panel
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const configuredCount = Object.values(config).filter(Boolean).length;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top Nav */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">J</div>
                        <span className="font-black text-gray-900">Joiner</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-500">Admin</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <a className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <Home className="w-4 h-4" />
                                View Site
                            </a>
                        </Link>
                        <button
                            onClick={() => setAuthenticated(false)}
                            className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Log Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 flex gap-1">
                    {([
                        { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
                        { id: "analytics", label: "Analytics & Tracking", icon: <Settings className="w-4 h-4" /> },
                    ] as const).map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition-colors ${tab === t.id ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 py-10">
                {/* DASHBOARD TAB */}
                {tab === "dashboard" && (
                    <div className="space-y-10">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
                            <p className="text-gray-500 mt-1">Overview of your Joiner event feed.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                icon={<Eye className="w-6 h-6 text-blue-600" />}
                                label="Page Views (7d)"
                                value={gaLoading ? "..." : (gaStats?.metrics?.pageViews || "—")}
                                color="bg-blue-50"
                                change={gaStats ? "Last 7 days" : "Connect GA ↗"}
                            />
                            <StatCard
                                icon={<Users className="w-6 h-6 text-violet-600" />}
                                label="Unique Visitors (7d)"
                                value={gaLoading ? "..." : (gaStats?.metrics?.activeUsers || "—")}
                                color="bg-violet-50"
                                change={gaStats ? "Last 7 days" : "Connect GA ↗"}
                            />
                            <StatCard
                                icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                                label="Engagement Rate"
                                value={gaLoading ? "..." : (gaStats?.metrics?.engagementRate || "—")}
                                color="bg-emerald-50"
                                positive
                                change={gaStats ? "Avg session quality" : "From API"}
                            />
                            <StatCard
                                icon={<Activity className="w-6 h-6 text-orange-600" />}
                                label="Tracking Tools"
                                value={`${configuredCount}/7`}
                                color="bg-orange-50"
                                positive={configuredCount > 0}
                                change={configuredCount === 0 ? "None configured" : `${configuredCount} active`}
                            />
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Tools Status */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                    <h2 className="font-bold text-gray-900">Analytics Tools Status</h2>
                                    <button
                                        onClick={() => setTab("analytics")}
                                        className="text-sm font-semibold text-orange-600 hover:underline flex items-center gap-1"
                                    >
                                        Configure <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {[
                                        { label: "Google Tag Manager", key: "gtm_id", icon: "🏷️" },
                                        { label: "Meta Pixel", key: "meta_pixel_id", icon: "🔵" },
                                        { label: "Google Analytics 4", key: "ga_measurement_id", icon: "📊" },
                                        { label: "Microsoft Clarity", key: "clarity_id", icon: "🔍" },
                                        { label: "Hotjar", key: "hotjar_id", icon: "🔥" },
                                        { label: "Mixpanel", key: "mixpanel_token", icon: "📈" },
                                    ].map(({ label, key, icon }) => {
                                        const val = config[key as keyof AnalyticsConfig];
                                        return (
                                            <div key={key} className="px-6 py-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{icon}</span>
                                                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                                                </div>
                                                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${val ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${val ? "bg-emerald-500" : "bg-gray-400"}`} />
                                                    {val ? "Active" : "Not configured"}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Top Events */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                    <h2 className="font-bold text-gray-900">Top Events (7d)</h2>
                                    <BarChart3 className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="p-6">
                                    {gaLoading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex justify-between items-center animate-pulse">
                                                    <div className="w-24 h-4 bg-gray-100 rounded" />
                                                    <div className="w-8 h-4 bg-gray-100 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : gaStats?.topEvents?.length > 0 ? (
                                        <div className="space-y-4">
                                            {gaStats.topEvents.map((event: any) => (
                                                <div key={event.name} className="flex justify-between items-center group">
                                                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 truncate pr-4">{event.name}</span>
                                                    <span className="text-sm font-bold text-gray-900">{event.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <TrendingUp className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                            <p className="text-xs text-gray-400">No events found in GA4</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info banner */}
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">Real-time metrics require Google Analytics</p>
                                <p className="text-sm text-amber-700 mt-1">Configure Google Analytics 4 in the Analytics & Tracking tab to see page views and user reports here. After saving, a new deployment will inject the scripts.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ANALYTICS TAB */}
                {tab === "analytics" && (
                    <div className="space-y-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900">Analytics & Tracking</h1>
                                <p className="text-gray-500 mt-1">Configure analytics tools. Scripts are injected automatically on each page load.</p>
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className={`shrink-0 h-11 px-6 font-bold rounded-xl transition-all ${saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-900 hover:bg-black"} text-white`}
                            >
                                {saving ? (
                                    "Saving..."
                                ) : saved ? (
                                    <><CheckCircle className="w-4 h-4 mr-2" />Saved!</>
                                ) : (
                                    <><Save className="w-4 h-4 mr-2" />Save Configuration</>
                                )}
                            </Button>
                        </div>

                        {loadError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                Could not load saved configuration. Changes will be saved fresh.
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <ToolCard
                                icon={<Tag className="w-5 h-5 text-blue-600" />}
                                title="Google Tag Manager"
                                description="Centralized tag management. Use this to deploy all other tracking tools without code changes."
                                fieldKey="gtm_id"
                                placeholder="GTM-XXXXXXX"
                                value={config.gtm_id}
                                onChange={handleChange}
                                badge="Recommended first"
                                badgeColor="bg-blue-100 text-blue-700"
                            />
                            <ToolCard
                                icon={<Globe className="w-5 h-5 text-indigo-600" />}
                                title="Google Analytics 4"
                                description="Track pageviews, sessions, conversions and user behavior with Google's latest analytics platform."
                                fieldKey="ga_measurement_id"
                                placeholder="G-XXXXXXXXXX"
                                value={config.ga_measurement_id}
                                onChange={handleChange}
                            />
                            <ToolCard
                                icon={<svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-500"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>}
                                title="Meta Pixel"
                                description="Measure ad effectiveness, build audiences and retarget visitors across Facebook and Instagram."
                                fieldKey="meta_pixel_id"
                                placeholder="123456789012345"
                                value={config.meta_pixel_id}
                                onChange={handleChange}
                            />
                            <ToolCard
                                icon={<MousePointer className="w-5 h-5 text-purple-600" />}
                                title="Microsoft Clarity"
                                description="Free heatmaps and session recordings. See exactly how users interact with your pages."
                                fieldKey="clarity_id"
                                placeholder="abcdefghij"
                                value={config.clarity_id}
                                onChange={handleChange}
                                badge="Free"
                                badgeColor="bg-purple-100 text-purple-700"
                            />
                            <ToolCard
                                icon={<Zap className="w-5 h-5 text-orange-500" />}
                                title="Hotjar"
                                description="Heatmaps, session recordings and user surveys. Great for understanding UX problems."
                                fieldKey="hotjar_id"
                                placeholder="1234567"
                                value={config.hotjar_id}
                                onChange={handleChange}
                                badge="Recommended"
                                badgeColor="bg-orange-100 text-orange-700"
                            />
                            <ToolCard
                                icon={<Activity className="w-5 h-5 text-green-600" />}
                                title="Mixpanel"
                                description="Product analytics focused on user actions and event funnels. Great for tracking shares, deep links, and conversions."
                                fieldKey="mixpanel_token"
                                placeholder="your_project_token"
                                value={config.mixpanel_token}
                                onChange={handleChange}
                                badge="Our pick"
                                badgeColor="bg-green-100 text-green-700"
                            />
                        </div>

                        {/* Feed Countries Configuration */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-8">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="shrink-0 w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                                        <MapPin className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Event Feed Countries</h3>
                                        <p className="text-sm text-gray-500">Enable or disable event visibility for specific countries in the app header.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { id: "PT", name: "Portugal", flag: "🇵🇹" },
                                        { id: "LT", name: "Lithuania", flag: "🇱🇹" },
                                        { id: "LV", name: "Latvia", flag: "🇱🇻" },
                                    ].map((country) => {
                                        const isEnabled = config.allowed_countries?.includes(country.id);
                                        return (
                                            <button
                                                key={country.id}
                                                onClick={() => {
                                                    const current = config.allowed_countries || [];
                                                    const next = current.includes(country.id)
                                                        ? current.filter(id => id !== country.id)
                                                        : [...current, country.id];
                                                    setConfig(prev => ({ ...prev, allowed_countries: next }));
                                                    setSaved(false);
                                                }}
                                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isEnabled ? "border-orange-200 bg-orange-50/50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{country.flag}</span>
                                                    <span className="font-semibold text-sm text-gray-700">{country.name}</span>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isEnabled ? "bg-orange-600 border-orange-600" : "bg-white border-gray-300"}`}>
                                                    {isEnabled && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* App Features Configuration */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-8">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">App Features</h3>
                                        <p className="text-sm text-gray-500">Toggle global app functionality.</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200">
                                            <Users className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">User Login & Profile</div>
                                            <div className="text-xs text-gray-500">Enable authentication and personal social features.</div>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={config.is_login_enabled}
                                        onCheckedChange={(checked) => {
                                            if (!checked) {
                                                setShowDisableLoginAlert(true);
                                            } else {
                                                setConfig((prev) => ({ ...prev, is_login_enabled: true }));
                                                setSaved(false);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <AlertDialog open={showDisableLoginAlert} onOpenChange={setShowDisableLoginAlert}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Disable Login Functionality?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will hide all login buttons and disable personal features like profiles, joining events, and following other users. The site will operate in "Public Only" mode.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            setConfig((prev) => ({ ...prev, is_login_enabled: false }));
                                            setSaved(false);
                                            setShowDisableLoginAlert(false);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        Yes, Disable Login
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* How it works */}
                        <div className="bg-gray-900 rounded-2xl p-6 text-white">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-5 h-5 text-orange-400" />
                                <h3 className="font-bold">How injection works</h3>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                After saving, the configuration is stored server-side. On every page load, the server dynamically injects the tracking scripts into <code className="bg-gray-800 px-1.5 py-0.5 rounded text-orange-400 text-xs">&lt;head&gt;</code> of the HTML — no re-deployment required. GTM, GA4, Meta Pixel, Clarity, Hotjar and Mixpanel are all supported.
                            </p>
                        </div>

                        {/* Save button at bottom */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className={`h-12 px-8 font-bold rounded-xl text-base transition-all ${saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-900 hover:bg-black"} text-white`}
                            >
                                {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Configuration"}
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
