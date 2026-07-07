import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TermsContent } from '@/components/TermsContent';
import { useAuth } from '@/lib/auth-context';
import { AGE_RANGES, GENDER_LABELS, GENDERS, type AgeRange, type Gender } from '@/lib/auth-types';
import { upsertProfile } from '@/lib/profile';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [ageRange, setAgeRange] = useState<AgeRange | ''>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!ageRange || !gender) {
      setError('Please select your age range and gender.');
      return;
    }
    if (!acceptedTerms) {
      setError('You must accept the Terms & Conditions to continue.');
      return;
    }
    if (!user) {
      setError('Session expired. Please sign in again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await upsertProfile(user.id, {
        age_range: ageRange,
        gender,
        terms_accepted_at: new Date().toISOString(),
      });
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Complete your profile</h1>
          <p className="text-sm text-muted-foreground">
            Anonymous stats only — used for aggregate reporting, never linked to health data.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Age range</label>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value as AgeRange)}
              className="w-full bg-input/50 border border-border rounded-lg p-3 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="" disabled>Select age range</option>
              {AGE_RANGES.map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full bg-input/50 border border-border rounded-lg p-3 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="" disabled>Select gender</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{GENDER_LABELS[g]}</option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-background/50 p-4">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(v) => setAcceptedTerms(v === true)}
            />
            <label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
              I agree to the{' '}
              <button type="button" className="text-primary underline" onClick={() => setShowTerms(true)}>
                Terms &amp; Conditions
              </button>
              , including anonymous usage data collection.
            </label>
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <Button className="w-full" disabled={loading} onClick={() => void handleSubmit()}>
            Continue to Pins
          </Button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6 shadow-xl">
            <TermsContent />
            <Button className="w-full mt-6" onClick={() => setShowTerms(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}