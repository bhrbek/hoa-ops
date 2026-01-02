// Navigation items for the sidebar
export const NAV_ITEMS = [
  {
    title: 'Command Center',
    href: '/',
    icon: 'LayoutDashboard',
    description: 'Dashboard overview',
  },
  {
    title: 'Sensor Log',
    href: '/sensor-log',
    icon: 'Activity',
    description: 'Client engagement tracking',
  },
  {
    title: 'Commitment Board',
    href: '/commitment-board',
    icon: 'Grid3X3',
    description: 'Weekly capacity planning',
  },
  {
    title: 'The Quarry',
    href: '/quarry',
    icon: 'Mountain',
    description: 'Strategic rocks management',
  },
  {
    title: 'Matrix',
    href: '/matrix',
    icon: 'BarChart3',
    description: 'Reports and analytics',
  },
] as const

// Days of the week for the Commitment Board
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
export const WEEKDAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

// Priority options
export const PRIORITIES = [
  { value: 'High', label: 'High', color: 'text-red-500' },
  { value: 'Medium', label: 'Medium', color: 'text-yellow-500' },
  { value: 'Low', label: 'Low', color: 'text-green-500' },
] as const

// Engagement status options
export const ENGAGEMENT_STATUSES = [
  { value: 'Lead', label: 'Lead' },
  { value: 'Active', label: 'Active' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Archived', label: 'Archived' },
] as const

// Rock status options
export const ROCK_STATUSES = [
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Shelved', label: 'Shelved' },
] as const

// Default domains
export const DEFAULT_DOMAINS = [
  'Wi-Fi',
  'SD-WAN',
  'Security',
  'Switching',
  'Cloud',
  'Data Center',
  'Collaboration',
  'IoT',
  'Logistics & Supply Chain',
] as const

// Default OEMs
export const DEFAULT_OEMS = [
  'Cisco',
  'Aruba',
  'Juniper',
  'Palo Alto',
  'Fortinet',
  'Meraki',
  'Arista',
] as const

// Timezone options
export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
] as const
