"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImagePlus, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AUTH_CSS, Field, SubmitButton, ErrorBox } from "@/components/auth/AuthShell";
import "@/app/auth.css";

const WRAP = "mx-auto max-w-[1100px] px-6 md:px-10";
const BIO_MAX = 280;

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Commander profile",
    title: "Edit profile",
    preview: "Live preview",
    photo: "Profile photo",
    drop: "Drop an image here or click to choose",
    limit: "PNG or JPG, up to 2MB",
    uploading: "Uploading…",
    username: "Username",
    bio: "Bio",
    bioPh: "Your main faction, favourite maps, when you play…",
    save: "Save changes",
    saving: "Saving…",
    cancel: "Cancel",
    unsaved: "Unsaved changes",
    tooBig: "Image must be under 2MB.",
    noBio: "No bio yet.",
    loading: "Loading profile…",
  },
  ar: {
    eyebrow: "ملف القائد",
    title: "تعديل الملف",
    preview: "معاينة مباشرة",
    photo: "الصورة الشخصية",
    drop: "أفلت صورة هنا أو اضغط للاختيار",
    limit: "PNG أو JPG حتى 2 ميغابايت",
    uploading: "جارٍ الرفع…",
    username: "اسم المستخدم",
    bio: "نبذة",
    bioPh: "فصيلك المفضّل، خرائطك المفضّلة، أوقات لعبك…",
    save: "حفظ التغييرات",
    saving: "جارٍ الحفظ…",
    cancel: "إلغاء",
    unsaved: "تغييرات غير محفوظة",
    tooBig: "يجب أن تكون الصورة أقل من 2 ميغابايت.",
    noBio: "لا توجد نبذة بعد.",
    loading: "جارٍ تحميل الملف…",
  },
};

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [original, setOriginal] = useState({ username: "", bio: "" });
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
        setAvatarPreview(profile.avatar_url ?? "");
        setOriginal({ username: profile.username ?? "", bio: profile.bio ?? "" });
      }

      setLoading(false);
    }

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function acceptFile(file: File | undefined | null) {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError(tx.tooBig);
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    acceptFile(e.target.files?.[0]);
  }

  async function uploadAvatarIfNeeded(): Promise<string> {
    if (!avatarFile || !userId) return avatarUrl;

    setUploading(true);

    const ext = avatarFile.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    setUploading(false);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so the new image shows immediately instead of a stale cached one
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!userId) {
      router.push("/login");
      return;
    }

    try {
      const finalAvatarUrl = await uploadAvatarIfNeeded();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username, bio, avatar_url: finalAvatarUrl })
        .eq("id", userId);

      if (updateError) throw new Error(updateError.message);

      router.push(`/profile/${username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const dirty = !!avatarFile || username !== original.username || bio !== original.bio;
  const bioRatio = Math.min(1, bio.length / BIO_MAX);
  const R = 11;
  const CIRC = 2 * Math.PI * R;

  return (
    <main className="min-h-[calc(100vh-var(--cz-header-h,64px))] w-full cz-grid-bg pb-20" style={{ color: C.paper }}>
      <style>{AUTH_CSS}</style>
      <div className={`${WRAP} pt-14 md:pt-20`}>
        <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>{tx.eyebrow}</div>
        <h1 className="cz-display mt-2 text-5xl uppercase leading-none md:text-6xl" style={{ fontWeight: 700 }}>{tx.title}</h1>

        {loading ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[340px_1fr]" aria-label={tx.loading}>
            <div className="h-80 border" style={{ background: C.panel, borderColor: C.line, opacity: 0.6 }} />
            <div className="h-96 border" style={{ background: C.panel, borderColor: C.line, opacity: 0.6 }} />
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[340px_1fr] lg:items-start">
            {/* Live preview */}
            <aside className="czau-in lg:sticky lg:top-[calc(var(--cz-header-h,64px)+24px)]">
              <div className="mb-3 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>{tx.preview}</div>
              <div className="relative overflow-hidden border" style={{ background: C.panel, borderColor: C.amberDim }}>
                <div className="h-24" style={{ background: "radial-gradient(ellipse 70% 120% at 80% 0%, rgba(232,166,61,0.25), transparent 60%), linear-gradient(rgba(39,43,30,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(39,43,30,0.6) 1px, transparent 1px)", backgroundSize: "100% 100%, 24px 24px, 24px 24px" }} />
                <div className="-mt-12 px-6 pb-6">
                  <div className="relative h-24 w-24">
                    <div className="absolute -inset-[4px] rounded-full" style={{ background: `conic-gradient(from 0deg, ${C.amber}, transparent 30%, ${C.radar} 50%, transparent 70%, ${C.amber})` }} />
                    <div className="absolute -inset-[1px] rounded-full" style={{ background: C.void }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img key={avatarPreview} src={avatarPreview || "/default-avatar.svg"} alt="" className="czau-pop relative h-full w-full rounded-full object-cover" />
                  </div>
                  <div className="cz-display mt-4 break-words text-3xl uppercase leading-none" style={{ fontWeight: 700 }}>{username || "—"}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.radar }}>
                    <ShieldCheck size={12} aria-hidden="true" />
                    {tx.eyebrow}
                  </div>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed" style={{ color: bio ? C.paper : C.muted }}>{bio || tx.noBio}</p>
                </div>
              </div>
            </aside>

            {/* Form */}
            <form onSubmit={handleSave} className="czau-in border p-6 md:p-8" style={{ background: C.panel, borderColor: C.line, animationDelay: "0.1s" }}>
              <div className="mb-6">
                <div className="mb-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{tx.photo}</div>
                <label
                  htmlFor="avatarFile"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    acceptFile(e.dataTransfer.files?.[0]);
                  }}
                  className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-4 text-center transition-colors"
                  style={{ borderColor: dragOver ? C.amber : C.amberDim, background: dragOver ? "rgba(232,166,61,0.08)" : C.void }}
                >
                  {uploading ? <Loader2 size={26} className="animate-spin" style={{ color: C.amber }} aria-hidden="true" /> : dragOver ? <UploadCloud size={26} style={{ color: C.amber }} aria-hidden="true" /> : <ImagePlus size={26} style={{ color: C.amber }} aria-hidden="true" />}
                  <span className="text-sm" style={{ color: C.paper, fontWeight: 600 }}>{uploading ? tx.uploading : avatarFile ? avatarFile.name : tx.drop}</span>
                  <span className="text-xs" style={{ color: C.muted }}>{tx.limit}</span>
                </label>
                <input id="avatarFile" type="file" accept="image/*" onChange={handleFileSelect} className="sr-only" />
              </div>

              <Field id="username" label={tx.username} hint={<span className="tabular-nums">{username.length}/24</span>}>
                <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={24} className="czau-input" dir="ltr" />
              </Field>

              <Field id="bio" label={tx.bio}>
                <div className="relative">
                  <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={BIO_MAX} rows={4} placeholder={tx.bioPh} className="czau-input pe-12" />
                  <span className="pointer-events-none absolute bottom-3 inline-flex items-center justify-center" style={{ insetInlineEnd: 12 }} title={`${bio.length}/${BIO_MAX}`}>
                    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                      <circle cx="13" cy="13" r={R} fill="none" stroke={C.line} strokeWidth="2.5" />
                      <circle cx="13" cy="13" r={R} fill="none" stroke={bioRatio > 0.9 ? "#F87171" : bioRatio > 0.75 ? C.amber : C.radar} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - bioRatio)} transform="rotate(-90 13 13)" style={{ transition: "stroke-dashoffset 0.15s ease" }} />
                    </svg>
                  </span>
                </div>
                <div className="mt-1.5 text-end text-xs tabular-nums" style={{ color: C.muted }}>{bio.length}/{BIO_MAX}</div>
              </Field>

              <ErrorBox message={error} />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="sm:flex-1">
                  <SubmitButton disabled={uploading} loading={saving} label={tx.save} loadingLabel={tx.saving} />
                </div>
                <Link href={original.username ? `/profile/${original.username}` : "/"} className="inline-flex min-h-[52px] items-center justify-center border px-6 text-sm uppercase tracking-[0.14em] transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.muted }}>
                  {tx.cancel}
                </Link>
              </div>
              {dirty && (
                <p className="czau-in mt-4 flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: C.amber }} aria-live="polite">
                  <span className="cz-blink inline-block h-1.5 w-1.5 rounded-full" style={{ background: C.amber }} />
                  {tx.unsaved}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
