// Shared option lists used by both Onboarding and Profile editing.
// Every picker built from these also exposes an "Other" option for custom entries.

export const EDUCATION_STATUSES = [
  { value: "high_school", label: "High school" },
  { value: "college", label: "Community college" },
  { value: "university", label: "University" },
  { value: "other", label: "Other" },
];

export const GRADE_OPTIONS = ["9th grade", "10th grade", "11th grade", "12th grade"];
export const YEAR_OPTIONS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

export const SKILLS = [
  "Design", "Coding", "Tutoring", "Writing", "Organizing", "Social media",
  "Event support", "Translation", "Research", "Photography", "Public speaking",
  "Data entry", "Graphic design", "Video editing", "Fundraising", "Mentoring",
];

export const INTERESTS = [
  "Education", "Youth mentoring", "Food insecurity", "Mosque service", "Environment",
  "Health", "Arts", "Technology", "Family support", "Community events", "Social justice",
  "Elder care", "Student support", "Refugee support", "Interfaith", "Mental health",
];

export const CAREER_INTERESTS = [
  "Medicine / Health", "Engineering", "Computer Science / Tech", "Education / Teaching",
  "Law / Policy", "Business / Entrepreneurship", "Arts & Media", "Social Work",
  "Environmental Science", "Psychology / Counseling", "Journalism / Communications",
  "Nonprofit / Community", "Government / Public Service", "Research / Science",
  "Healthcare", "Finance",
];

export const FIELDS_OF_STUDY = [
  "STEM", "Pre-med / Health sciences", "Computer Science", "Humanities",
  "Social Sciences", "Business", "Education", "Arts", "Communications",
  "Public Health", "Law / Pre-law", "Engineering",
];

export const INTERNSHIP_INTERESTS = [
  "Research", "Government / Public service", "Healthcare / Clinical",
  "Tech / Software", "Nonprofit", "Communications / Marketing", "Policy / Advocacy",
  "Lab / Science", "Education", "Business",
];

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const TIMES = ["Morning", "Afternoon", "Evening", "Weekend only", "After school"];

export const SAFETY = [
  "Women-led", "Mosque-based", "Youth-friendly", "Family-safe", "No transportation needed",
];

export const OPPORTUNITY_TYPES = ["volunteer", "internship", "ssl", "job", "other"];
