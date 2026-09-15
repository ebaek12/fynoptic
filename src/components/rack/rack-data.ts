export interface RackItem {
  id: string;
  title: string;
  description: string;
  statPrimary: string;
  statSecondary: string;
  href: string;
  accent: string;
}

export const RACK_ITEMS: readonly RackItem[] = [
  {
    id: 'courses',
    statPrimary: 'Free Course',
    statSecondary: 'Self-paced',
    accent: '#7C9EFF',
    title: 'Courses',
    description: 'Work through lessons on hidden charges, confusing checkout pages, and cancellation problems.',
    href: '/courses',
  },
  {
    id: 'articles',
    statPrimary: '244 Articles',
    statSecondary: 'Free to Read',
    accent: '#FF9F6E',
    title: 'Articles',
    description: 'Read about fees, credit, subscriptions, and what to do when a payment goes wrong.',
    href: '/articles',
  },
  {
    id: 'flashcards',
    statPrimary: '611 Terms',
    statSecondary: '12 Units',
    accent: '#6FE0B8',
    title: 'Flashcards',
    description: 'Review the terms used on bills, bank statements, and contracts.',
    href: '/flashcard',
  },
  {
    id: 'practice',
    statPrimary: '1,286 Questions',
    statSecondary: '16 Topics',
    accent: '#F17EA0',
    title: 'Practice',
    description: 'Answer finance and economics questions, check the explanations, and review your mistakes.',
    href: '/practice',
  },
] as const;
