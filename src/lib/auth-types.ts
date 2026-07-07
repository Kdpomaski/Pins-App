export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

export const GENDERS = ['male', 'female', 'non-binary', 'prefer-not-to-say'] as const;
export type Gender = (typeof GENDERS)[number];

export type UserProfile = {
  id: string;
  age_range: AgeRange;
  gender: Gender;
  terms_accepted_at: string;
  created_at: string;
  updated_at: string;
};

export const TERMS_DATA_COLLECTION =
  'We may collect anonymous usage data to improve the app. During signup we ask for age range and gender for statistical purposes only. No personal health data is ever sent to our servers unless you explicitly enable cloud backup.';

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  'non-binary': 'Non-binary',
  'prefer-not-to-say': 'Prefer not to say',
};