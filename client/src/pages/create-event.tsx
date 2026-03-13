import { useState } from "react";
import { useLocation } from "wouter";
import { eventCreatorClient, type CreateEventPayload } from "@/api/eventCreator";
import { ArrowLeft, ImagePlus, Loader2, Sparkles, Wand2, Image as ImageIcon, Check } from "lucide-react";
import { usePlacesWidget } from "react-google-autocomplete";
import { useAuth } from "@/hooks/useAuth";
import { EVENT_CATEGORIES } from "@/lib/categories";

export default function CreateEventPage() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    // AI State
    const [imageSource, setImageSource] = useState<'upload' | 'ai'>('upload');
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isRefiningDescription, setIsRefiningDescription] = useState(false);
    const [isRefined, setIsRefined] = useState(false);

    const { ref: placesRef } = usePlacesWidget({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        onPlaceSelected: (place: any) => {
            const loc = place?.formatted_address || place?.name || "";
            const lat = place?.geometry?.location?.lat();
            const lng = place?.geometry?.location?.lng();
            const placeId = place?.place_id;
            
            setFormData((p: CreateEventPayload) => ({ 
                ...p, 
                location: loc,
                lat: typeof lat === 'function' ? lat() : lat,
                lng: typeof lng === 'function' ? lng() : lng,
                placeId: placeId
            }));
        },
        options: {
            types: ["geocode", "establishment"],
        }
    });

    const [formData, setFormData] = useState<CreateEventPayload>({
        title: "",
        description: "",
        location: "",
        date: new Date().toISOString().split("T")[0],
        startTime: "18:00",
        endTime: "21:00",
        isPublic: true,
        minAge: 18,
        maxAge: 50,
        categoryId: 1,
        gender: 'all',
        maxClients: 10,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setImageSource('upload');
        }
    };

    const handleGenerateImage = async () => {
        if (!aiPrompt.trim()) return;
        setIsGeneratingImage(true);
        try {
            const res = await fetch("/api/ai/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt })
            });
            const data = await res.json();
            if (data.url) {
                setPreviewUrl(data.url);
                setFile(null); // Clear local file if any
                setImageSource('ai');
            }
        } catch (err) {
            console.error(err);
            alert("Failed to generate image");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleRefineDescription = async () => {
        if (formData.description.split(/\s+/).filter(Boolean).length < 5) return;
        setIsRefiningDescription(true);
        try {
            const res = await fetch("/api/ai/refine-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: formData.description })
            });
            const data = await res.json();
            if (data.refined) {
                setFormData(p => ({ ...p, description: data.refined }));
                setIsRefined(true);
                setTimeout(() => setIsRefined(false), 2000);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to refine text");
        } finally {
            setIsRefiningDescription(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!previewUrl) {
            alert("Please provide an image for your event (upload or AI generated).");
            return;
        }

        setIsLoading(true);

        try {
            // Get real Firebase auth token
            let token = "no-token";
            if (user) {
                token = await user.getIdToken();
            } else {
                alert("You must be logged in to create an event.");
                setIsLoading(false);
                return;
            }

            const imagePayload = imageSource === 'upload' && file 
                ? { file } 
                : { url: previewUrl || undefined };

            const createdEventId = await eventCreatorClient.executeCreationFlow(formData, imagePayload, token);
            
            // Redirect to the event details page to show the user what it looks like
            setLocation(`/event/${createdEventId}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create event. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 font-sans">
            <header className="flex items-center gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur-md z-10 py-3">
                <button
                    onClick={() => setLocation("/")}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-xl font-bold">Create New Event</h1>
            </header>

            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6 pb-20">
                {/* Image Selection Tabs */}
                <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
                    <button
                        type="button"
                        onClick={() => setImageSource('upload')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${imageSource === 'upload' ? 'bg-violet-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                        <ImagePlus className="w-4 h-4" />
                        My Photo
                    </button>
                    <button
                        type="button"
                        onClick={() => setImageSource('ai')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${imageSource === 'ai' ? 'bg-violet-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                        <Sparkles className="w-4 h-4" />
                        NanoBanana 2
                    </button>
                </div>

                {/* Conditional Image Area */}
                {imageSource === 'upload' ? (
                    <div 
                        className="w-full aspect-video rounded-2xl overflow-hidden bg-white/5 border-2 border-dashed border-white/20 relative flex items-center justify-center group cursor-pointer hover:border-violet-500 transition-colors"
                        onClick={() => document.getElementById("file-upload")?.click()}
                    >
                        {previewUrl && file ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-white/50 group-hover:text-violet-400 transition-colors">
                                <ImagePlus className="w-10 h-10" />
                                <span className="font-medium">Tap to upload a photo</span>
                            </div>
                        )}
                        <input
                            type="file"
                            id="file-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-white/5 border-2 border-white/10 relative flex items-center justify-center group">
                            {previewUrl && !file ? (
                                <div className="relative w-full h-full">
                                    <img src={previewUrl} alt="AI Preview" className="w-full h-full object-cover" />
                                    {isGeneratingImage && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-white/50">
                                    {isGeneratingImage ? (
                                        <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-10 h-10" />
                                            <span className="font-medium italic">Ready for NanoBanana logic...</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="What kind of photo do we need? (e.g. party at neon night)"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || !aiPrompt}
                                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-4 rounded-xl text-sm font-bold transition-all"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-white/70 mb-1.5">Event Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData((p: CreateEventPayload) => ({ ...p, title: e.target.value }))}
                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500 transition-colors"
                            placeholder="Awesome party, casual meetup..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-white/70 mb-1.5 flex justify-between items-center">
                            Description
                            {formData.description.split(/\s+/).filter(Boolean).length >= 5 && (
                                <button
                                    type="button"
                                    onClick={handleRefineDescription}
                                    disabled={isRefiningDescription}
                                    className="flex items-center gap-1.5 text-xs text-violet-400 font-bold hover:text-violet-300 transition-all bg-violet-400/10 px-2 py-1 rounded-lg border border-violet-400/20"
                                >
                                    {isRefiningDescription ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : isRefined ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <Wand2 className="w-3 h-3" />
                                    )}
                                    {isRefined ? 'DONE' : 'REFINE WITH AI'}
                                </button>
                            )}
                        </label>
                        <div className="relative group">
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData((p: CreateEventPayload) => ({ ...p, description: e.target.value }))}
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500 transition-colors min-h-[120px]"
                                placeholder="Tell people what to expect..."
                            />
                            {isRefiningDescription && (
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-xl flex items-center justify-center pointer-events-none">
                                    <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-white/70 mb-1.5">Location</label>
                        <input
                            type="text"
                            required
                            ref={placesRef as any}
                            defaultValue={formData.location}
                            onChange={(e) => setFormData((p: CreateEventPayload) => ({ ...p, location: e.target.value }))}
                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500 transition-colors"
                            placeholder="Address or venue name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-white/70 mb-1.5">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData((p: CreateEventPayload) => ({ ...p, date: e.target.value }))}
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-white/70 mb-1.5">Start</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.startTime}
                                    onChange={(e) => setFormData((p: CreateEventPayload) => ({ ...p, startTime: e.target.value }))}
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-white/70 mb-1.5">End</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.endTime}
                                    onChange={(e) => setFormData((p: CreateEventPayload) => ({ ...p, endTime: e.target.value }))}
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-white/70 mb-1.5">Category</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 1, name: "Sports", icon: "🏀" },
                                    { id: 2, name: "Food", icon: "🍕" },
                                    { id: 4, name: "Travel", icon: "✈️" },
                                    { id: 6, name: "Evening", icon: "🌙" },
                                    { id: 15, name: "Concerts", icon: "🎸" },
                                    { id: 13, name: "Other", icon: "✨" },
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setFormData((p: CreateEventPayload) => ({ ...p, categoryId: cat.id }))}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${formData.categoryId === cat.id ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                    >
                                        <span className="text-xl">{cat.icon}</span>
                                        <span className="text-[10px] font-bold uppercase">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white/70 mb-1.5">Gender Selection</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData((p: CreateEventPayload) => ({ ...p, gender: e.target.value as any }))}
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                            >
                                <option value="all" className="bg-black">Anyone</option>
                                <option value="male" className="bg-black">Men Only</option>
                                <option value="female" className="bg-black">Women Only</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white/70 mb-1.5">Capacity (People)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="1000"
                                value={formData.maxClients}
                                onChange={(e) => setFormData((p: CreateEventPayload) => ({ ...p, maxClients: parseInt(e.target.value) || 1 }))}
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                            />
                        </div>



                        <div className="col-span-2">
                            <label className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={formData.isPublic}
                                    onChange={(e) => setFormData((p: CreateEventPayload) => ({ ...p, isPublic: e.target.checked }))}
                                    className="w-5 h-5 rounded text-violet-500 bg-black border-white/30 focus:ring-violet-500"
                                />
                                <div>
                                    <div className="font-semibold text-white">Public Event</div>
                                    <div className="text-xs text-white/50">Show in community feed</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating Event...</>
                        ) : (
                            "Create Event"
                        )}
                    </button>
                    {!isLoading && <p className="text-center text-xs text-white/40 mt-3 flex flex-col items-center"><span>Event will be published immediately to Joiner.</span></p>}
                </div>
            </form>
        </div>
    );
}
