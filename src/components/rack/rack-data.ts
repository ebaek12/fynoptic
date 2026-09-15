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
    description: 'Learn to spot misleading design, avoid unwanted charges, and push back when a company crosses the line.',
    href: '/courses',
  },
  {
    id: 'articles',
    statPrimary: '244 Articles',
    statSecondary: 'Free to Read',
    accent: '#FF9F6E',
    title: 'Articles',
    description: 'Get a closer look at subscriptions, credit, scams, and the costs hiding in everyday purchases.',
    href: '/articles',
  },
  {
    id: 'flashcards',
    statPrimary: '611 Terms',
    statSecondary: '12 Units',
    accent: '#6FE0B8',
    title: 'Flashcards',
    description: 'Get familiar with the financial terms you’ll see on bills, bank statements, and contracts.',
    href: '/flashcard',
  },
  {
    id: 'practice',
    statPrimary: '1,286 Questions',
    statSecondary: '16 Topics',
    accent: '#F17EA0',
    title: 'Practice',
    description: 'Put your finance and economics knowledge to the test, then work on the topics that trip you up.',
    href: '/practice',
  },
] as const;
