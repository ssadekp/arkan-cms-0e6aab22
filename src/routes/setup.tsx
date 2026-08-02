import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Check, ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { createFirstAdmin, getSetupStatus, saveSetupBranding, saveSetupIdentity } from "@/lib/setup.functions";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "First-run setup — install your CMS" },
      {
        name: "description",
        content:
          "Guided first-run setup: create the administrator account, name the site, and apply your logo and brand color.",
      },
      { property: "og:title", content: "First-run setup — install your CMS" },
      {
        property: "og:description",
        content: "Create the administrator account and brand this installation in a few steps.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/setup" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/setup" }],
  }),
  component: SetupWizard,
});

const STEPS = ["Administrator", "Site identity", "Branding", "Done"];

function SetupWizard() {
  const navigate = useNavigate();
  const statusFn = useServerFn(getSetupStatus);
  const createAdmin = useServerFn(createFirstAdmin);
  const saveIdentity = useServerFn(saveSetupIdentity);
  const saveBranding = useServerFn(saveSetupBranding);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["setup-status"],
    queryFn: () => statusFn(),
    staleTime: 0,
  });

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // admin step
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // identity step
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const [taglineAr, setTaglineAr] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [defaultLang, setDefaultLang] = useState<"ar" | "en">("ar");

  // branding step
  const [primary, setPrimary] = useState("#00A651");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  useEffect(() => {
    if (status && !status.needsSetup && signedIn) setStep((s) => (s === 0 ? 1 : s));
  }, [status, signedIn]);

  if (isLoading || signedIn === null) {
    return (
      <Centered>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Centered>
    );
  }

  if (status && !status.needsSetup && !signedIn) {
    return (
      <Centered>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>This instance is already set up</CardTitle>
            <CardDescription>
              An administrator account already exists. Sign in to continue configuring the site.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">View site</Link>
            </Button>
          </CardContent>
        </Card>
      </Centered>
    );
  }

  async function submitAdmin() {
    if (!email.trim() || password.length < 8) {
      toast.error("Enter an email and a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await createAdmin({ data: { email: email.trim(), password, fullName: fullName.trim() } });
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message);
      setSignedIn(true);
      setContactEmail((v) => v || email.trim());
      await refetch();
      setStep(1);
      toast.success("Administrator created");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create the administrator");
    } finally {
      setBusy(false);
    }
  }

  async function submitIdentity() {
    if (!nameEn.trim() && !nameAr.trim()) {
      toast.error("Enter the site name in at least one language.");
      return;
    }
    setBusy(true);
    try {
      await saveIdentity({
        data: {
          default_language: defaultLang,
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim(),
          i18n: [
            { lang: "en", site_name: nameEn.trim() || nameAr.trim(), tagline: taglineEn.trim() },
            { lang: "ar", site_name: nameAr.trim() || nameEn.trim(), tagline: taglineAr.trim() },
          ],
        },
      });
      setStep(2);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the site identity");
    } finally {
      setBusy(false);
    }
  }

  async function submitBranding() {
    if (!/^#[0-9a-fA-F]{6}$/.test(primary)) {
      toast.error("Brand color must be a hex value like #00A651.");
      return;
    }
    setBusy(true);
    try {
      await saveBranding({
        data: { primary_hex: primary, logo_url: logoUrl || null, favicon_url: faviconUrl || null },
      });
      setStep(3);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save branding");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Centered>
      <div className="w-full max-w-2xl space-y-6">
        <header className="space-y-2 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Rocket className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Set up your CMS</h1>
          <p className="text-sm text-muted-foreground">
            Four short steps — no terminal required.
          </p>
        </header>

        <ol className="flex items-center justify-center gap-2 text-xs">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 font-medium ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={i === step ? "font-medium" : "text-muted-foreground"}>{label}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Create the administrator</CardTitle>
              <CardDescription>
                This account gets full access to the control panel. You can add more users later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Full name (optional)">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.org"
                />
              </Field>
              <Field label="Password" help="At least 8 characters.">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button onClick={submitAdmin} disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Site identity</CardTitle>
              <CardDescription>Name and tagline shown in the header, footer, and search results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Site name (English)">
                  <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
                </Field>
                <Field label="اسم الموقع (عربي)">
                  <Input dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
                </Field>
                <Field label="Tagline (English)">
                  <Input value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)} />
                </Field>
                <Field label="الشعار النصي (عربي)">
                  <Input dir="rtl" value={taglineAr} onChange={(e) => setTaglineAr(e.target.value)} />
                </Field>
                <Field label="Contact email">
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </Field>
                <Field label="Contact phone">
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </Field>
              </div>
              <Field label="Default language">
                <Select value={defaultLang} onValueChange={(v) => setDefaultLang(v as "ar" | "en")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex gap-2">
                <Button onClick={submitIdentity} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
                </Button>
                <Button variant="ghost" onClick={() => setStep(2)} disabled={busy}>
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Logo, browser icon, and the brand color used across the site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                label="Logo"
                value={logoUrl}
                onChange={setLogoUrl}
                folder="branding"
                help="Transparent PNG or SVG works best."
              />
              <ImageUpload
                label="Favicon"
                value={faviconUrl}
                onChange={setFaviconUrl}
                folder="branding"
                accept="image/png,image/svg+xml,image/x-icon"
                help="Square image, at least 64×64."
              />
              <Field label="Brand color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-border bg-background"
                    aria-label="Brand color"
                  />
                  <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="max-w-[10rem]" />
                </div>
              </Field>
              <div className="flex gap-2">
                <Button onClick={submitBranding} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finish <ArrowRight className="h-4 w-4" /></>}
                </Button>
                <Button variant="ghost" onClick={() => setStep(3)} disabled={busy}>
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" /> You&apos;re ready
              </CardTitle>
              <CardDescription>
                Add content and fine-tune everything from the control panel. Branding, homepage sections, menus, and
                users all live under Admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => navigate({ to: "/admin" })}>Open the control panel</Button>
              <Button variant="outline" onClick={() => navigate({ to: "/" })}>
                View the site
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">{children}</main>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
