import { useState, useEffect } from "react";
import { ImageIcon, Video, Play, Maximize2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MediaItem {
  id: string;
  media_type: string;
  file_type: string;
  file_url: string;
  file_name: string;
  notes: string | null;
  uploaded_at: string;
}

interface PortalBookingMediaProps {
  bookingId: string;
}

export function PortalBookingMedia({ bookingId }: PortalBookingMediaProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("job_media")
        .select("id, media_type, file_type, file_url, file_name, notes, uploaded_at")
        .eq("booking_id", bookingId)
        .order("uploaded_at");
      setMedia((data as any[]) || []);
      setLoading(false);
    };
    fetchMedia();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (media.length === 0) return null;

  const beforeMedia = media.filter((m) => m.media_type === "before");
  const afterMedia = media.filter((m) => m.media_type === "after");

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <MediaColumn label="Before" items={beforeMedia} onImageClick={setLightboxUrl} />
        <MediaColumn label="After" items={afterMedia} onImageClick={setLightboxUrl} />
      </div>

      {afterMedia.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Share your results! Tag us <strong>@remainclean</strong> 🚗
        </p>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Enlarged" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}

function MediaColumn({
  label,
  items,
  onImageClick,
}: {
  label: string;
  items: MediaItem[];
  onImageClick: (url: string) => void;
}) {
  const photoCount = items.filter((i) => i.file_type === "photo").length;
  const videoCount = items.filter((i) => i.file_type === "video").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {photoCount > 0 && (
            <span className="flex items-center gap-0.5">
              <ImageIcon className="h-3 w-3" /> {photoCount}
            </span>
          )}
          {videoCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Video className="h-3 w-3" /> {videoCount}
            </span>
          )}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No {label.toLowerCase()} media</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <SignedMediaItem key={item.id} item={item} onImageClick={onImageClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function SignedMediaItem({
  item,
  onImageClick,
}: {
  item: MediaItem;
  onImageClick: (url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const bucket = item.media_type === "before" ? "job-before-media" : "job-after-media";
    supabase.storage
      .from(bucket)
      .createSignedUrl(item.file_url, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setUrl(data.signedUrl);
      });
  }, [item]);

  if (!url) return <div className="h-16 rounded-lg bg-muted animate-pulse" />;

  if (item.file_type === "video") {
    return (
      <video src={url} controls className="w-full rounded-lg" preload="metadata" />
    );
  }

  return (
    <img
      src={url}
      alt={item.notes || "Service photo"}
      className="w-full h-16 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => onImageClick(url)}
    />
  );
}
