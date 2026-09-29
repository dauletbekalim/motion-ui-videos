/**
 * The demo's content: a small team ("Northwind") and its notes. Fictional,
 * but specific: real-feeling names, times and sentences make a UI read as a
 * product instead of a wireframe. Never put lorem ipsum in a video.
 */

import { PEOPLE_COLORS as P } from '../theme';

export type PersonId = 'you' | 'maya' | 'theo' | 'ines' | 'sam' | 'priya';
export type Person = { name: string; first: string; initials: string; color: string; email: string };

export const PEOPLE: Record<PersonId, Person> = {
  you: { name: 'Alex Rivera', first: 'Alex', initials: 'AR', color: P[0], email: 'alex@northwind.example' },
  maya: { name: 'Maya Chen', first: 'Maya', initials: 'MC', color: P[1], email: 'maya@northwind.example' },
  theo: { name: 'Theo Park', first: 'Theo', initials: 'TP', color: P[2], email: 'theo@northwind.example' },
  ines: { name: 'Ines Duarte', first: 'Ines', initials: 'ID', color: P[3], email: 'ines@northwind.example' },
  sam: { name: 'Sam Okafor', first: 'Sam', initials: 'SO', color: P[4], email: 'sam@northwind.example' },
  priya: { name: 'Priya Raman', first: 'Priya', initials: 'PR', color: P[5], email: 'priya@northwind.example' },
};

export const WORKSPACE = 'Northwind';

export type Space = { id: string; name: string; color: string };
export const SPACES: Space[] = [
  { id: 'launch', name: 'Launch', color: '#FFB547' },
  { id: 'product', name: 'Product', color: '#7AA2FF' },
  { id: 'design', name: 'Design', color: '#FF7D98' },
  { id: 'research', name: 'Research', color: '#7BDB9C' },
  { id: 'team', name: 'Team', color: '#B996FF' },
];
export const space = (id: string): Space => SPACES.find((s) => s.id === id) ?? SPACES[0];

export type Note = { id: string; title: string; snippet: string; space: string; time: string; people: PersonId[] };

export const NOTES: Note[] = [
  { id: 'launch', title: 'Q3 launch plan', snippet: 'Beta goes to 40 design partners first, then…', space: 'launch', time: '2m', people: ['maya', 'theo'] },
  { id: 'sync', title: 'Weekly sync, Oct 2', snippet: 'Pricing page ships Thursday. Demo moved to…', space: 'team', time: '48m', people: ['maya', 'ines', 'sam'] },
  { id: 'review', title: 'Design review: sidebar', snippet: 'Collapse spaces by default? Theo votes yes.', space: 'design', time: '3h', people: ['theo', 'sam'] },
  { id: 'interview', title: 'Interview: Halden & Co.', snippet: '“We lose every decision in chat threads.”', space: 'research', time: 'Yesterday', people: ['priya'] },
  { id: 'pricing', title: 'Pricing page copy', snippet: 'Lead with “free for up to 5 people”, then…', space: 'product', time: 'Mon', people: ['sam'] },
  { id: 'onboarding', title: 'Onboarding checklist', snippet: 'Accounts, laptop, a first-week buddy…', space: 'team', time: 'Sep 29', people: ['ines'] },
  { id: 'retro', title: 'Sprint 14 retro', snippet: 'Keep: async demos. Drop: Friday deploys.', space: 'product', time: 'Sep 26', people: ['theo', 'priya'] },
  { id: 'hiring', title: 'Hiring: product designer', snippet: 'Portfolio review rubric, second draft.', space: 'team', time: 'Sep 24', people: ['ines', 'you'] },
];
export const note = (id: string): Note => NOTES.find((n) => n.id === id) ?? NOTES[0];

/** The note the demo keeps coming back to. */
export const LAUNCH_PLAN = {
  title: 'Q3 launch plan',
  goal: 'Put the beta in front of 40 design partners and learn what makes a team stay after week two.',
  todos: ['Finalize the pricing page copy', 'Record the onboarding video', 'Draft the launch email'],
  owners: ['sam', 'maya', 'theo'] as PersonId[],
  decision: 'Invite-only until the first cohort is happy. Then open the waitlist.',
};
