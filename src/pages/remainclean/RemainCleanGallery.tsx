import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Phone, Play, ImageOff, X } from "lucide-react";
import { T, RCGlobalStyles, RCStatusBar, RCNav, RCPromo, RCFooter } from "./RCLayout";
import { supabase } from "@/lib/supabase";

interface GalleryMediaItem {
  signed_url: string;
  file_type: string;
}

interface GalleryPair {
  before: GalleryMediaItem | null;
  after: GalleryMediaItem | null;
}

function MediaThumb({
  item,
  label,
  onOpen,
}: {
  item: GalleryMediaItem | null;
  label: string;
  onOpen: (item: GalleryMediaItem) => void;
}) {
  const isVideo = item && (item.file_type.startsWith("video/") || item.file_type === "video");

  if (!item) {
    return (
      <div style={{ position: "relative", flex: 1, backgroundColor: T.secondary, borderRadius: "0.625rem", overflow: "hidden", aspectRatio: "4/3" }}>
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImageOff size={24} style={{ color: T.border }} />
        </div>
        <div style={{ position: "absolute", bottom: "0.375rem", left: "0.5rem", backgroundColor: label === "Before" ? "rgba(0,0,0,0.55)" : "oklch(40% .13 150)", color: "#fff", fontSize: "0.6875rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", letterSpacing: "0.04em" }}>
          {label}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`Open ${label} media`}
      style={{ position: "relative", flex: 1, backgroundColor: T.secondary, borderRadius: "0.625rem", overflow: "hidden", aspectRatio: "4/3", border: "none", padding: 0, cursor: "pointer" }}
    >
      {isVideo ? (
        <video
          src={item.signed_url}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img src={item.signed_url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      {isVideo && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
          <Play size={28} style={{ color: "#fff" }} />
        </div>
      )}
      <div style={{ position: "absolute", bottom: "0.375rem", left: "0.5rem", backgroundColor: label === "Before" ? "rgba(0,0,0,0.55)" : "oklch(40% .13 150)", color: "#fff", fontSize: "0.6875rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", letterSpacing: "0.04em" }}>
        {label}
      </div>
    </button>
  );
}

export default function RemainCleanGallery() {
  const [pairs, setPairs] = useState<GalleryPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState<GalleryMediaItem | null>(null);

  useEffect(() => {
    supabase.functions
      .invoke("public-gallery", { body: { orgSlug: "remainclean" } })
      .then(({ data }) => {
        setPairs(data?.items ?? []);
      })
      .catch(() => setPairs([]))
      .finally(() => setLoading(false));
  }, []);

  const activeIsVideo = activeMedia && (activeMedia.file_type.startsWith("video/") || activeMedia.file_type === "video");

  return (
    <>
      <RCGlobalStyles />
      <Seo
        title="Gallery | Remain Clean Services"
        description="Before & after photos from Remain Clean Services — premium mobile detailing in Fort Lauderdale, Miami-Dade & West Palm Beach."
        canonicalPath="/remainclean/gallery"
      />

      <div style={{ backgroundColor: T.bg, color: T.fg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <RCStatusBar />
        <RCNav />
        <RCPromo />

        <main style={{ flex: 1 }}>
          <section style={{ padding: "5rem 1.5rem 3.5rem", textAlign: "center", background: `linear-gradient(180deg, oklch(16% .007 285) 0%, ${T.bg} 100%)` }}>
            <p style={{ color: T.primary, fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Before &amp; After</p>
            <h1 className="rc-s" style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, color: T.fg, marginBottom: "1rem" }}>
              Our Work
            </h1>
            <p style={{ color: T.mutedFg, fontSize: "1.0625rem", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
              Real results from real vehicles we've detailed.
            </p>
          </section>

          <section style={{ padding: "2rem 1.5rem 5rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "4rem 0", color: T.mutedFg }}>
                  Loading gallery...
                </div>
              ) : pairs.length === 0 ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "1.25rem", padding: "3.5rem 2rem", maxWidth: "520px", margin: "0 auto" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1.25rem" }}>📸</div>
                    <h2 className="rc-s" style={{ color: T.fg, fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.75rem" }}>Gallery Coming Soon</h2>
                    <p style={{ color: T.mutedFg, lineHeight: 1.7, fontSize: "0.9375rem" }}>
                      We're putting together photos of our best work. Check back soon!
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                  {pairs.map((pair, i) => (
                    <div key={i} className="rc-card" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "1rem", padding: "1rem", display: "flex", gap: "0.625rem" }}>
                      <MediaThumb item={pair.before} label="Before" onOpen={setActiveMedia} />
                      <MediaThumb item={pair.after} label="After" onOpen={setActiveMedia} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section style={{ padding: "5rem 1.5rem", textAlign: "center", backgroundColor: T.card }}>
            <div style={{ maxWidth: "520px", margin: "0 auto" }}>
              <h2 className="rc-s" style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 800, color: T.fg, marginBottom: "1rem" }}>
                Want Results Like These?
              </h2>
              <p style={{ color: T.mutedFg, lineHeight: 1.7, marginBottom: "2rem" }}>
                Book your mobile detail today and see the difference.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
                <Link to="/book/remainclean" className="rc-btn"
                  style={{ backgroundColor: T.primary, color: T.primaryFg, padding: "0.9375rem 2.25rem", borderRadius: "9999px", fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
                  Book Now
                </Link>
                <a href="tel:9549131307" className="rc-btn"
                  style={{ backgroundColor: "transparent", color: T.fg, padding: "0.9375rem 2.25rem", borderRadius: "9999px", fontWeight: 600, fontSize: "1rem", textDecoration: "none", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Phone size={16} />Call (954)-913-1307
                </a>
              </div>
            </div>
          </section>
        </main>

        <RCFooter />

        {activeMedia && (
          <div
            onClick={() => setActiveMedia(null)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
          >
            <button
              type="button"
              aria-label="Close gallery preview"
              onClick={() => setActiveMedia(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", width: "2.75rem", height: "2.75rem", borderRadius: "9999px", border: `1px solid ${T.border}`, backgroundColor: T.card, color: T.fg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={18} />
            </button>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: "1000px", maxHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {activeIsVideo ? (
                <video
                  src={activeMedia.signed_url}
                  controls
                  autoPlay
                  playsInline
                  style={{ width: "100%", maxHeight: "85vh", borderRadius: "1rem", backgroundColor: T.bg }}
                />
              ) : (
                <img
                  src={activeMedia.signed_url}
                  alt="Gallery preview"
                  style={{ width: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: "1rem" }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
