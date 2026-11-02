import type { CourseQuestion } from '../components/course/CourseQuiz';

export interface ReadingSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  table?: { headings: string[]; rows: string[][] };
  takeaway: string;
}
export interface ActivityField {
  label: string;
  type: 'number' | 'date' | 'select';
  options?: string[];
  answer: string;
  explanation: string;
}
export interface SubscriptionLesson {
  title: string;
  subtitle: string;
  minutes: number;
  objective: string;
  sections: ReadingSection[];
  activity: { title: string; brief: string; facts: string[]; fields: ActivityField[] };
  questions: CourseQuestion[];
}

export const COURSE_TWO_SOURCES = [
  { title: 'FTC · Free trials, auto-renewals, and subscriptions', url: 'https://consumer.ftc.gov/articles/getting-and-out-free-trials-auto-renewals-and-negative-option-subscriptions' },
  { title: 'CFPB · Stopping automatic bank payments', url: 'https://www.consumerfinance.gov/ask-cfpb/how-do-i-stop-automatic-payments-from-my-bank-account-en-2023/' },
  { title: 'Apple · Cancel a subscription billed by Apple', url: 'https://support.apple.com/en-us/118428' },
  { title: 'FTC · Subscriptions you never ordered', url: 'https://consumer.ftc.gov/consumer-alerts/2023/05/how-stop-subscriptions-you-never-ordered' },
];

export const SUBSCRIPTION_LESSONS: SubscriptionLesson[] = [
  {
    title: 'Read the real offer', subtitle: 'Turn the headline price into a complete commitment.', minutes: 8,
    objective: 'Identify the recurring price, billing frequency, commitment, and cancellation route before subscribing.',
    sections: [
      {
        title: 'You are buying a sequence of payments',
        paragraphs: [
          'A subscription is a decision today that can create several payments tomorrow. That is useful when you repeatedly want the service: a reliable music library, a class you attend, or software you use each week. The difficulty is that the decision and the later charges happen at different times. Your attention moves on; the billing arrangement can keep running. A useful first question is therefore not just “Can I afford this price?” but “Which future payments am I authorizing, and what will make them stop?”',
          'Separate three ideas that advertisements often compress into one phrase. The billing interval tells you how often money is collected. The commitment tells you how long you have agreed to pay. The renewal rule tells you what happens at the end. A membership can be billed monthly while committing you for a year. Another can collect a year in advance without requiring another year after that. “Monthly” on a pricing page does not answer all three questions.',
          'Throughout this course you will use fictional offers with stated terms. Treat them as practice cases, not descriptions of any real company. You will calculate costs, map a trial deadline, choose a plan, finish a cancellation, assemble evidence, and build a manageable subscription list. The goal is to make a deliberate choice, including choosing to keep something that is worth its cost.',
        ],
        takeaway: 'Billing frequency, minimum commitment, and automatic renewal are three separate facts.',
      },
      {
        title: 'Make a six-line offer card',
        paragraphs: [
          'Before comparing services, translate each offer into the same small set of facts. Write the initial payment, the normal recurring price, the billing interval, any minimum term, the next charge date, and the cancellation route. Add mandatory fees beside the price rather than leaving them in a separate mental category. If tax or another charge is unknown, label the total as an estimate; do not quietly treat an unknown as zero.',
          'Imagine a learning app advertised as “$3 a month.” Its checkout says $36 billed today for an annual plan. The monthly equivalent helps compare prices, but it does not describe the cash leaving your account today. If you have $20 available for the purchase, the $3 headline cannot make that $36 payment affordable. Conversely, a $5 monthly plan may cost more over a full year but let you stop after a short project.',
          'Read the final checkout summary as well as the advertisement. A selected add-on, different plan length, or eligibility condition may change the deal. Record the version you actually accept. Useful evidence links the offer to a date, the plan name, and the confirmation receipt. A screenshot of a promotional homepage alone may not show which plan was purchased.',
        ],
        table: { headings: ['Offer detail', 'Question to answer'], rows: [['Price today', 'What leaves my account now?'], ['Normal price', 'What is charged after the promotion?'], ['Interval and term', 'How often, and for how long?'], ['Renewal', 'When and at which price?'], ['Exit', 'Where, how, and by when can I cancel?']] },
        takeaway: 'A good offer card separates a comparison price from an actual bill.',
      },
      {
        title: 'Calculate the first year and the next year',
        paragraphs: [
          'Promotional pricing makes a single multiplication unreliable. Split the year into periods, multiply each price by the number of payments at that price, then add mandatory one-time costs. For an imaginary service with three months at $4, nine months at $11, and a $9 setup fee, the first year costs (3 × $4) + (9 × $11) + $9 = $120. The next full year at the stated standard price costs 12 × $11 = $132, assuming no price change or new fee.',
          'Both figures matter. The first-year figure measures the introductory offer. The ongoing figure measures what you may normalize in your budget after the promotion disappears. A setup fee belongs in the first-year comparison, while a recurring annual maintenance fee belongs in every applicable year. Avoid mixing a monthly service charge with a yearly fee without converting both to the same period.',
          'Try a quick estimation check before trusting a calculator. In the example, most months cost about $11, so a first-year answer of $30 would be suspiciously low. A result of $1,200 would be suspiciously high. Estimation will not replace the exact calculation, but it can catch a misplaced decimal, a missing period, or an accidental extra zero before you choose a plan.',
          'Compare like with like: the same duration, required features, number of users, and assumptions about cancellation. If one plan includes a feature you do not need, its listed “value” is not automatically a saving. If you would not buy the extra separately, count the cash you actually keep, not the retail value printed beside the bundle. A cheaper total is useful only when the product still meets your purpose.',
        ],
        takeaway: 'First-year cost = promotional payments + standard payments + mandatory fees.',
      },
      {
        title: 'Decide what would make you say no',
        paragraphs: [
          'A simple purchase rule is easier to follow before you reach a bright checkout button. For example: “I will subscribe only if I can explain the normal price, find the cancellation route, and name the thing I will use this week.” This is a personal decision rule, not a legal test. It protects you from filling gaps with optimistic guesses. If a minimum term is unclear, ask for clarification or leave the decision unfinished.',
          'Consider who will manage the arrangement. In a household plan, one person may use the service while another receives the receipt. A student may start a trial with a parent’s payment method. Agree on permission, the spending limit, and who will review renewal before purchase. Sharing access does not automatically share visibility into the bill. Use an account nickname in your notes rather than a password or complete card number.',
          'Now practice on the offer below. Count exactly twelve paid months; the first two are discounted and the remaining ten are at the regular rate. The activation fee is charged once. All figures in this exercise exclude tax, and the stated price stays unchanged. Write down the calculation before entering your result. You should be able to explain both the total and why the second year is different.',
        ],
        takeaway: 'If you cannot explain the deal in your own words, pause the purchase.',
      },
    ],
    activity: {
      title: 'Offer lab · Decode the checkout',
      brief: 'Maya is comparing a fictional reading membership. Build an accurate cost picture using only these terms.',
      facts: ['First 2 months: $2 per month', 'Then: $12 per month', 'One-time activation fee: $18', 'No minimum term; billed monthly; no tax or price changes in this example'],
      fields: [
        { label: 'Total for the first 12 months ($)', type: 'number', answer: '142', explanation: '2 × $2 + 10 × $12 + $18 = $142.' },
        { label: 'Total for the following 12 months ($)', type: 'number', answer: '144', explanation: '12 × $12 = $144. The one-time activation fee is not repeated.' },
        { label: 'What does “billed monthly” tell Maya?', type: 'select', options: ['How often she pays', 'That the price can never change', 'That every monthly plan has no minimum term'], answer: 'How often she pays', explanation: 'Billing frequency is separate from price changes and contract duration.' },
      ],
    },
    questions: [
      { stem: 'A plan says “$6 per month, billed $72 annually.” What should you budget for the initial payment?', options: ['$6', '$36', '$72', '$6 plus an unknown fee'], answerIndex: 2, rationale: 'The monthly equivalent is $6, but the stated upfront annual payment is $72.' },
      { stem: 'Which missing fact most directly prevents you from knowing how long you are committed?', options: ['The app icon', 'The number of reviews', 'The minimum contract term', 'The company’s advertising budget'], answerIndex: 2, rationale: 'A billing interval alone does not establish the minimum term.' },
    ],
  },
  {
    title: 'Put trials on a timeline', subtitle: 'Give every trial a decision date before its charge date.', minutes: 9,
    objective: 'Map the trial end, cancellation cutoff, and an earlier review reminder without assuming a refund.',
    sections: [
      {
        title: 'A free start is not a free ongoing service',
        paragraphs: [
          'A trial lets you test a service, but it also creates a small administrative task. You need to know what you are evaluating, when you will make the decision, and what happens if you do nothing. Treat the trial as a short experiment with an end, not as an unfinished purchase that will somehow ask for your attention later. “I might use it” is not an evaluation plan.',
          'For example, Leo wants a language app for a trip. He defines success as finishing three lessons and using the speaking exercise twice. He schedules those sessions during the trial. At the review point, he can compare actual use with the price. Without a test plan, a week can pass with no meaningful use and the subscription can become a paid reminder of a task he meant to do.',
          'The FTC advises checking trial terms and cancellation instructions before enrollment, recording a reminder, and monitoring statements afterward. Use that as a baseline. In your own notes, also distinguish the trial end from any earlier cutoff stated by the provider. A deadline is a fact to copy from the offer, not a date to infer from the word “free.”',
        ],
        takeaway: 'Give the trial a purpose, a review point, and an exit plan before starting.',
      },
      {
        title: 'Track three different moments',
        paragraphs: [
          'Your timeline has three moments: the planned review, the cancellation cutoff, and the first charge. Put them in that order. The review is a date you choose early enough to handle a forgotten password, a support queue, or an unclear account screen. The cutoff is the latest point allowed by the stated terms. The charge is when the company says it will collect payment. They may not be the same moment.',
          'Suppose a fictional trial converts on June 18 at 10:00 a.m. Eastern, and its offer requires cancellation at least 24 hours earlier. The cutoff is June 17 at 10:00 a.m. Eastern. A review on June 15 gives two days of working room before that cutoff. A reminder on the evening of June 17 would already be too late for those terms, even though it is the calendar day before the charge.',
          'Copy the time zone too. “Midnight” without a zone is not a precise plan, and “one month” is not always thirty days. When the account gives an exact timestamp, use it. If the terms and the account screen disagree, preserve both and ask for clarification before relying on the later date. Do not solve uncertainty by selecting the date you prefer.',
          'Work backward on paper once: write the first charge on the right, subtract the stated cancellation buffer, then place your own review earlier still. Label each point rather than drawing three unexplained dates. This small diagram exposes a common mistake: scheduling the decision at the exact instant the action must already be complete. A good timeline includes room to carry out the decision.',
        ],
        table: { headings: ['Moment', 'Purpose'], rows: [['Review reminder', 'Evaluate use and leave time to act'], ['Cancellation cutoff', 'Meet the stated deadline'], ['First charge', 'Check whether billing matches the decision']] },
        takeaway: 'A reminder after the cutoff is late even if it arrives before the charge.',
      },
      {
        title: 'Check what cancellation does to access',
        paragraphs: [
          'Do not assume every trial behaves the same way when cancelled. Some offers may end access immediately; others may continue through a stated date. Read the specific confirmation before choosing. The useful question is “What will happen to this account now?” rather than “What happened on another app last month?” If you need the remaining trial time to evaluate the service, account for that in your review plan.',
          'A calendar entry should contain enough information to be useful when it appears. “Check app” is weak. “Review the language trial; normal price $15/month; billing through app-store account; cutoff June 17, 10 a.m. Eastern” gives you the decision and the route. Keep the actual account credentials in your password manager, not in a shared calendar. A reminder that exposes a password creates a different problem.',
          'Avoid creating more trials than you can evaluate. If four offers all expire during exam week, the apparent savings come with concentrated attention costs. Stagger experiments, keep a small list of active trials, and close each one with a recorded decision. Choosing not to start a trial is a valid outcome when you do not have time to test it.',
        ],
        takeaway: 'Check the effect on access, and put actionable details in the reminder.',
      },
      {
        title: 'Close the loop after the decision',
        paragraphs: [
          'At the review point, make one of three explicit choices: keep the service at its normal price, cancel using the stated route, or investigate a missing fact before the cutoff. “Decide later” only works if the later decision still fits within the timeline. If you keep the service, replace the trial reminder with a normal renewal review. If you cancel, retain the confirmation and note when access ends.',
          'If a charge appears unexpectedly, first distinguish an actual posted payment from the information on your subscription page. Check the receipt, relevant dates, and plan terms. A missed reminder is not by itself a promise of a refund. Ask the billing provider about its policy and describe what happened accurately. You will practice handling an unresolved charge in lesson five.',
          'In the timeline exercise, the terms deliberately specify a time zone and a 24-hour cutoff. Work backward from the charge rather than forward from the trial’s start. Select the review date that leaves time to solve a problem. This habit transfers to other timed decisions, including a promotional price increase or the end of a membership pause.',
        ],
        takeaway: 'The trial is finished when the decision, account status, and billing record agree.',
      },
    ],
    activity: {
      title: 'Timeline lab · Beat the cutoff', brief: 'A fictional FocusDesk trial will become paid unless cancelled at least 24 hours before its first charge.',
      facts: ['First charge: May 20, 2027, at 9:00 a.m. Eastern', 'Cancellation required at least 24 hours before that charge', 'Normal plan: $18 per month', 'You want at least two days between reviewing the trial and the cutoff'],
      fields: [
        { label: 'Latest cancellation date', type: 'date', answer: '2027-05-19', explanation: '24 hours before May 20 at 9 a.m. is May 19 at 9 a.m. Eastern.' },
        { label: 'Time on that cutoff date', type: 'select', options: ['9:00 a.m. Eastern', '11:59 p.m. Eastern', 'Any time that day'], answer: '9:00 a.m. Eastern', explanation: 'The timestamp matters; an evening cancellation misses this stated cutoff.' },
        { label: 'Which review reminder gives the requested buffer?', type: 'select', options: ['May 17 at 9:00 a.m. Eastern', 'May 19 at 8:59 a.m. Eastern', 'May 20 at 8:00 a.m. Eastern'], answer: 'May 17 at 9:00 a.m. Eastern', explanation: 'May 17 at 9 a.m. leaves two full days before the May 19 cutoff.' },
      ],
    },
    questions: [
      { stem: 'What is the strongest trial evaluation plan?', options: ['Wait for the bank alert', 'Test two useful features before a scheduled early review', 'Assume cancellation always preserves access', 'Rely on remembering the signup date'], answerIndex: 1, rationale: 'Specific tests plus an early review turn a vague intention into a decision.' },
      { stem: 'You missed a trial cutoff and were charged. Which statement is sound?', options: ['All trial charges are automatically refundable', 'Deleting the receipt reverses the charge', 'Check the terms and ask the billing provider about the charge and refund policy', 'The reminder app owes you the subscription cost'], answerIndex: 2, rationale: 'Refund eligibility depends on the applicable policy and circumstances; do not invent a guarantee.' },
    ],
  },
  {
    title: 'Choose a plan worth keeping', subtitle: 'Use real usage, cash flow, and break-even math.', minutes: 8,
    objective: 'Compare monthly and annual plans over your likely use period and evaluate a bundle without counting imaginary savings.',
    sections: [
      {
        title: 'Compare your likely use, not the longest possible use',
        paragraphs: [
          'An annual plan can be sensible when you know you will use a service all year and can afford the upfront payment. It can also be expensive when your need lasts only a few months. Start by naming the job the subscription will do and the period over which that job exists. A design tool for a five-month course has a different use pattern from a backup service you expect to need continuously.',
          'In a simple comparison with no extra fees, divide the annual price by the monthly price to find the number of monthly payments equal to the annual cost. If an annual plan is $90 and monthly is $10, the break-even point is nine months. Monthly is cheaper for eight months; the costs are equal at nine; annual is cheaper at ten or more. This comparison assumes the monthly plan can actually be stopped when you need it stopped.',
          'A fractional break-even point deserves care. With $100 annual and $12 monthly, $100 ÷ $12 is about 8.33. Eight monthly payments cost $96; nine cost $108. If you are comparing whole monthly billing periods, the annual option first becomes cheaper at nine payments. Do not round down and call eight months the cheaper annual choice.',
        ],
        takeaway: 'Break-even months = annual price ÷ monthly price, with billing periods considered.',
      },
      {
        title: 'Price, affordability, and flexibility are different',
        paragraphs: [
          'The lower full-year price does not automatically make the upfront bill workable. Compare the actual payment date with the money available for that purpose. An annual payment can concentrate a year’s spending into a single day. If the service is essential, planning ahead may help; if it is optional, waiting or choosing a shorter commitment may fit better. A calculated discount is not permission to ignore your other needs.',
          'Flexibility has value when your plans are uncertain. Consider a fictional photographer who may need an editing tool for either four months or twelve. The annual discount only helps in the twelve-month case. A monthly plan lets the photographer learn more about future use before committing. That flexibility is a reasoned choice even when the annual price looks lower on a comparison card.',
          'Check cancellation and refund assumptions explicitly. If your analysis assumes an unused annual plan can be refunded proportionally, verify that in the terms rather than inserting it into the math. If a monthly-billed contract actually has a minimum year, it is not the flexible alternative in this example. Compare real options, including the constraints that make them different.',
          'You can also compare two scenarios instead of pretending to know the future. Write the total for your short-use case and your full-year case side by side. Then describe why one case is more likely. This makes uncertainty visible and gives you a reason to revisit the choice if circumstances change, rather than defending a decision just because you already made it.',
        ],
        takeaway: 'A cheaper yearly total can still be a poor fit for your cash flow or uncertainty.',
      },
      {
        title: 'Measure use without letting past payments trap you',
        paragraphs: [
          'Cost per use is one useful diagnostic: divide the relevant period’s cost by actual meaningful uses during that period. If a $24 membership was used three times this month, it cost $8 per use. That number is not a universal verdict. Some services provide ongoing availability or protection rather than countable sessions. Choose a measure that reflects the service’s purpose instead of forcing every product into the same formula.',
          'For services you can count, use recorded behavior rather than your ideal future routine. “I will use it every day next month” might be sincere, but it should not erase three months of barely opening the app. Try a smaller plan or a deliberate use schedule, then review the evidence. A subscription can be worth keeping when its value is clear; the exercise is to make that value visible.',
          'Past spending is already spent. If you paid $80 for something you no longer need, spending another $20 does not recover the $80. The next decision concerns future cost and future usefulness. You may still use access you have already paid for, but that is separate from authorizing the next renewal. Write those two decisions on separate lines if you find yourself mixing them.',
        ],
        takeaway: 'Use past behavior as evidence; judge the next payment on its future value.',
      },
      {
        title: 'Unpack bundles and retention discounts',
        paragraphs: [
          'A bundle is worth comparing with the items you would actually buy separately. Suppose you currently pay $8 for music and $6 for cloud storage. A $19 bundle adds games you do not play. The advertisement may value all three services at $30, but your relevant alternative is $14. The bundle increases your spending by $5 per month unless the extra feature is independently worth that amount to you.',
          'A temporary retention offer needs the same timeline treatment as a trial. If a $16 service offers three months at $8, it reduces those three payments by $24 total, assuming you would otherwise keep paying $16. It does not create a $96 annual saving. Record the end of the discount, any new commitment, and the price afterward. A discount on a service you do not need can still be unnecessary spending.',
          'For the plan exercise below, the learner expects exactly five paid months and can cancel the monthly plan afterward. Compare that actual scenario before calculating the full-year discount. Then explain to yourself what would have to change for the annual plan to become preferable. That explanation is more transferable than memorizing which button was marked “best value.”',
        ],
        takeaway: 'Count only savings against a purchase you would otherwise make.',
      },
    ],
    activity: {
      title: 'Plan lab · Find the break-even point', brief: 'Sam needs a fictional design app for a five-month project. Features are identical, there are no fees or taxes, and the monthly plan can stop after five payments.',
      facts: ['Monthly plan: $12 per month', 'Annual plan: $96 paid upfront', 'Annual plan has no partial refund in this example', 'Expected use: five months'],
      fields: [
        { label: 'Cost of five monthly payments ($)', type: 'number', answer: '60', explanation: '5 × $12 = $60.' },
        { label: 'Number of monthly payments equal to the annual price', type: 'number', answer: '8', explanation: '$96 ÷ $12 = 8 monthly payments.' },
        { label: 'Lower-cost plan for the stated project', type: 'select', options: ['Monthly: $60 total', 'Annual: $96 total', 'They cost the same for five months'], answer: 'Monthly: $60 total', explanation: 'The monthly plan saves $36 for this five-month need. Annual only becomes cheaper beyond eight monthly payments.' },
      ],
    },
    questions: [
      { stem: 'You pay $24 this month and use a membership three times. What is the cost per use?', options: ['$3', '$6', '$8', '$24'], answerIndex: 2, rationale: '$24 ÷ 3 uses = $8 per use.' },
      { stem: 'A bundle costs $19. The only services you want cost $14 separately. What is the useful comparison?', options: ['The bundle saves money because it has more features', 'The bundle costs $5 more per month for your stated needs', 'The bundle costs nothing if its advertised value is $30', 'The two prices cannot be compared'], answerIndex: 1, rationale: 'Compare the bundle with your actual alternative, not the advertised value of unwanted extras.' },
    ],
  },
  {
    title: 'Cancel all the way through', subtitle: 'Follow the billing route and verify the final state.', minutes: 9,
    objective: 'Distinguish pause, downgrade, cancellation, and account deletion; identify the billing provider and preserve confirmation.',
    sections: [
      {
        title: 'Find who actually bills the subscription',
        paragraphs: [
          'Start with the receipt. The brand on the app icon may be different from the provider that manages payment. A subscription could be bought directly from a company, through an app store, or as part of a larger bundle. Follow the route linked to the purchase rather than assuming every account has the same cancellation controls. This also helps explain why a service’s own website may show no editable paid plan.',
          'Apple’s support guidance directs Apple-billed subscriptions to the Apple account’s subscription controls and explains how to investigate a missing subscription using receipts. Use official instructions for your billing provider, since menus can change. An absent subscription in one account is a reason to check the purchase account and receipt; it is not proof that no recurring payment exists.',
          'In a shared household, ask the purchaser to manage the billing account rather than sharing passwords. A family member’s access and the purchaser’s billing rights may be different. Record the provider and a safe account nickname on your offer card. When you need support, use contact details from a trusted receipt or the provider’s official site instead of a random search advertisement.',
        ],
        takeaway: 'Follow the receipt to the billing provider and the correct purchase account.',
      },
      {
        title: 'Name the action you want',
        paragraphs: [
          'Pause, downgrade, cancellation, and deletion sound related but can produce different outcomes. A pause may restart billing on a specified date. A downgrade may retain a smaller paid plan. Cancellation may stop the next renewal while leaving already-paid access available until an end date. Account deletion concerns account data and access; do not assume it completes every billing step. Read the stated effect before committing to an action.',
          'Imagine a fictional fitness service with three buttons: “Pause for two months,” “Switch to basic at $7,” and “End renewal.” If your goal is no future membership renewal, only the last option matches that goal as stated. A large pause button may be convenient for a temporary break, but its size does not turn it into cancellation. The right choice is determined by your intention and the terms.',
          'A cancellation request can also be different from a completed cancellation. “Request received” might describe a pending process. Look for an effective date, the renewal status, and any remaining obligations or final payment identified in the terms. If those facts are missing, seek clarification and keep the pending request. Do not rewrite “pending” in your notes as “confirmed.”',
          'A useful self-check is to finish this sentence before pressing a button: “After this action, I expect…” If your expectation is that renewal stops, but the screen says only that recommendations or notifications will stop, you have found a mismatch. The same technique helps when an interface uses friendly but ambiguous labels such as “take a break” or “see you later.”',
        ],
        table: { headings: ['Action', 'Fact to verify'], rows: [['Pause', 'When does billing resume?'], ['Downgrade', 'What will the remaining plan cost?'], ['End renewal', 'Is renewal off, and when does access end?'], ['Delete account', 'Has billing been separately resolved?']] },
        takeaway: 'Choose the action that matches the outcome, then verify that outcome.',
      },
      {
        title: 'Read retention offers as new offers',
        paragraphs: [
          'A cancellation screen may ask why you are leaving or offer a lower price. You can consider the offer, but apply the same checks you used at signup: price today, later price, duration, commitment, and exit route. If you choose the discount, record a new review date. If you still want to leave, continue toward the explicit cancellation outcome rather than accepting an unrelated change just to make the screen disappear.',
          'Use precise language when speaking to support. A fictional practice message might be: “Please end renewal of my monthly Reading Club plan for account nickname Personal. Please confirm the effective date, the access end date, and whether any final payment remains under the plan terms.” This is clearer than “I don’t use this much.” Do not include passwords or full payment details in a routine email.',
          'If the route fails, document the step and error with the date, then use the provider’s published support channel. A short factual record is more useful than a long argument. Note what you asked for, who responded, and any reference number. Do not treat a browser error as a confirmed cancellation, and do not repeatedly enter sensitive information into an unverified form.',
        ],
        takeaway: 'A retention offer is another purchase decision, with another set of terms.',
      },
      {
        title: 'Verify, save, and follow up',
        paragraphs: [
          'The FTC recommends keeping cancellation records and checking statements afterward. Build your record around the request, its date, the confirmation, and the relevant charge if a problem later appears. In your own tracking list, separate three fields: requested on, effective on, and access ends on. A service that remains available through a paid period can still be cancelled; continued access alone does not prove renewal is on.',
          'Read a final screen carefully. In the fictional example below, “Renewal off; access ends August 31; no further renewal scheduled” is stronger evidence of the intended outcome than a generic thank-you message. Save it together with the plan name and timestamp. If a confirmation email arrives, keep that too. A record with context is easier to interpret months later than an isolated cropped phrase.',
          'Close the process by scheduling one check after the expected billing date. Confirm that your statement matches the account status and follow up on discrepancies promptly. This is not an instruction to repeatedly worry about every cancelled service. It is one bounded verification task that turns an uncertain ending into a documented one. The exercise will ask you to make each of these decisions in order.',
        ],
        takeaway: 'A complete cancellation record includes the intended outcome and evidence it took effect.',
      },
    ],
    activity: {
      title: 'Cancellation lab · Choose the complete exit', brief: 'Riley wants to stop renewal of a fictional ReadMore membership. Make the three decisions that lead to a verifiable result.',
      facts: ['The receipt says “Billed by Apple”', 'The purchase uses Riley’s personal Apple account', 'A pause offer would restart billing in two months', 'The final cancellation screen says renewal is off and access ends August 31'],
      fields: [
        { label: '1. Where should Riley manage this purchase?', type: 'select', options: ['The purchasing Apple account’s subscription controls', 'An unrelated email unsubscribe link', 'The app’s notification preferences'], answer: 'The purchasing Apple account’s subscription controls', explanation: 'The receipt identifies Apple and the purchase account as the billing route.' },
        { label: '2. Which action matches stopping renewal?', type: 'select', options: ['Pause for two months', 'Choose the explicit cancellation option and confirm', 'Turn off app notifications'], answer: 'Choose the explicit cancellation option and confirm', explanation: 'Pause and notification settings do not accomplish the stated goal.' },
        { label: '3. What should Riley do with the final screen?', type: 'select', options: ['Save the dated renewal-off confirmation and check the next statement', 'Assume access ending August 31 means cancellation failed', 'Delete all purchase records'], answer: 'Save the dated renewal-off confirmation and check the next statement', explanation: 'Remaining paid access can coexist with renewal being off. Keep evidence and verify billing.' },
      ],
    },
    questions: [
      { stem: 'A pause says billing resumes September 1. You wanted no future renewal. What is true?', options: ['The pause achieves permanent cancellation', 'You still need to choose the cancellation route for your intended outcome', 'Turning off notifications will stop the September charge', 'The calendar will cancel it automatically'], answerIndex: 1, rationale: 'A pause has a restart point; it is not the same as ending renewal.' },
      { stem: 'Which record best establishes a completed cancellation?', options: ['A screenshot of the homepage', 'A note saying “probably cancelled”', 'A dated confirmation identifying the plan, renewal status, and effective date', 'A deleted app icon'], answerIndex: 2, rationale: 'The confirmation ties the requested outcome to a particular plan and date.' },
    ],
  },
  {
    title: 'Handle an unexpected charge', subtitle: 'Build a factual timeline and choose the right next step.', minutes: 8,
    objective: 'Separate cancellation, a refund request, and a payment dispute while assembling useful evidence.',
    sections: [
      {
        title: 'Describe the problem before choosing the remedy',
        paragraphs: [
          'An unexpected charge is a signal to investigate, not a complete diagnosis. It might be a renewal after a missed cutoff, an unfamiliar billing name, a duplicate transaction, a payment after confirmed cancellation, or a purchase you never authorized. These situations need different explanations and sometimes different routes. Start with what you can establish: amount, date, billing descriptor, receipt, and the relevant account.',
          'Do not label a transaction “fraud” simply because you regret an authorized purchase. Equally, do not assume an unfamiliar transaction is legitimate just because the amount looks plausible. Compare it with your records and, if needed, contact the payment provider through a trusted channel. If you suspect account misuse, address that promptly rather than waiting for an ordinary customer-service exchange to finish.',
          'Separate the desired outcomes. Cancellation concerns future service or renewal. A refund request concerns money already paid. A dispute asks a payment provider to review a particular transaction. One action does not automatically achieve all three. Writing the outcomes separately helps prevent a conversation about refund eligibility from leaving an unwanted renewal running.',
        ],
        takeaway: 'Name both the factual problem and the outcome you want.',
      },
      {
        title: 'Build a small evidence packet',
        paragraphs: [
          'Use a chronological record with one row per meaningful event. Include the original offer or relevant term, the payment record, the cancellation request if there was one, and the confirmation or support response. Each item should answer a specific question: what was agreed, what happened, when it happened, or what resolution was requested. More screenshots are not automatically better; relevant, readable records are better.',
          'In a fictional case, Jordan receives cancellation confirmation on March 3 effective immediately, then sees a new $22 membership charge on March 10. The strongest packet pairs that confirmation with the March 10 transaction and the plan identifier. A screenshot of the company’s unrelated advertisement adds little. Jordan’s initial message can state those dates and ask the provider to explain or reverse the charge.',
          'Keep originals and share copies with unnecessary sensitive details removed. A support agent may need a transaction reference or limited identifying information through an official channel; they do not need your password. Avoid publishing full statements as a way of seeking help. Organize the packet so that another person can understand the issue without needing access to your entire financial history.',
          'Give files descriptive names, such as “March-03-membership-cancellation” and “March-10-membership-charge.” Add a short index that identifies what each record shows. If you return to the issue after a week, that organization reduces the chance of attaching the wrong plan’s receipt or confusing a pending transaction with a later posted one. Keep uncertainty visible in the timeline until you resolve it.',
        ],
        takeaway: 'Build a timeline that connects the agreement, cancellation, and disputed payment.',
      },
      {
        title: 'Contact the right provider without losing time',
        paragraphs: [
          'For a recognizable billing problem, use the billing provider’s support route and ask for a specific resolution. Keep the response and reference number. If the company continues charging after an attempted cancellation, FTC guidance points consumers to their card provider’s dispute process and written follow-up. Report the facts accurately, and contact your issuer promptly about the applicable process and deadlines; do not let a slow merchant exchange exhaust your time to act.',
          'For automatic debits from a bank account, CFPB guidance distinguishes withdrawing payment authorization from cancelling the underlying contract. It describes notifying the company and your bank or credit union, following up in writing, and asking about the bank’s process, including possible stop-payment fees. Stopping a payment does not itself erase money you legitimately owe. Use the linked guidance for the full procedure.',
          'Avoid promising yourself a result before the review is complete. A requested refund, a provisional credit, and a final resolution are different states. Record which one you have. A bank’s handling of a charge does not by itself explain whether your service remains active, so verify both billing and subscription status. Exact rights and deadlines depend on the payment method, situation, and applicable law.',
        ],
        takeaway: 'Use the appropriate provider and keep cancellation, payment authorization, and disputes distinct.',
      },
      {
        title: 'Write a message that can be acted on',
        paragraphs: [
          'A useful message has four parts: identify the plan safely, state the relevant dates and amount, attach the strongest evidence, and ask for a concrete resolution. For Jordan’s fictional case: “My membership cancellation was confirmed effective March 3. A new $22 membership charge posted March 10. I have attached the dated confirmation and transaction record. Please explain the charge, refund it if it was made in error, and confirm the current renewal status.”',
          'That wording is specific without overstating what the evidence proves. It leaves room for a legitimate explanation, such as a separately identified earlier balance, while clearly stating the mismatch. If a response says only “resolved,” ask what was resolved: the refund, renewal, or both. Record a promised refund date and check for the actual credit, rather than treating a promise as money already returned.',
          'For the exercise, keep your attention on the chronology. The cancellation was effective before the new charge, and the receipt identifies the same membership. Choose evidence that directly supports that issue. If the provider fails to resolve it, the next step is an accurate payment-provider inquiry, not an invented story designed to guarantee a reversal. You can be persistent and precise at the same time.',
        ],
        takeaway: 'A concise factual request is easier to investigate than an unsupported accusation.',
      },
    ],
    activity: {
      title: 'Evidence lab · Make the case', brief: 'Jordan’s fictional membership was cancelled effective March 3. A new $22 membership charge posted March 10 for the same plan.',
      facts: ['March 3: dated confirmation says cancellation is effective immediately', 'March 10: $22 posted membership charge', 'March 11: Jordan requests an explanation and refund if charged in error', 'The billing provider has not resolved the issue'],
      fields: [
        { label: 'Which pair of records best supports the issue?', type: 'select', options: ['The March 3 confirmation and March 10 transaction record', 'Two unrelated negative reviews', 'The current homepage and app icon'], answer: 'The March 3 confirmation and March 10 transaction record', explanation: 'Those records directly show the effective cancellation and the subsequent payment.' },
        { label: 'Which description is accurate?', type: 'select', options: ['I never had an account, although I did', 'A charge posted after my documented effective cancellation', 'Every subscription charge is illegal'], answer: 'A charge posted after my documented effective cancellation', explanation: 'State the actual sequence; do not misrepresent the original authorization.' },
        { label: 'What should Jordan do about payment-provider deadlines?', type: 'select', options: ['Wait indefinitely for the merchant', 'Contact the payment provider promptly about the process and deadlines', 'Assume all payment methods share an unlimited dispute period'], answer: 'Contact the payment provider promptly about the process and deadlines', explanation: 'A merchant conversation should not cause you to miss an applicable dispute deadline.' },
      ],
    },
    questions: [
      { stem: 'Does stopping an automatic bank payment necessarily cancel a service contract or erase a valid debt?', options: ['Yes, in every case', 'No; payment authorization and the underlying obligation are separate', 'Only if you delete the app', 'Only if the amount is below $25'], answerIndex: 1, rationale: 'The CFPB explicitly distinguishes stopping automatic payments from cancelling the underlying obligation.' },
      { stem: 'Support says a refund is requested. What should your tracker say?', options: ['Money received', 'Refund requested; follow up and verify the credit', 'Subscription automatically cancelled', 'No record needed'], answerIndex: 1, rationale: 'A request is not the same as a completed credit or a cancelled renewal.' },
    ],
  },
  {
    title: 'Build your subscription system', subtitle: 'Turn six skills into a repeatable monthly routine.', minutes: 7,
    objective: 'Normalize a mixed billing list, choose an intentional action, and create a review routine you can maintain.',
    sections: [
      {
        title: 'Create one small source of truth',
        paragraphs: [
          'A useful subscription list does not need an elaborate app. A table or note works if you can update it and find it later. Start with service name, purpose, billing provider, price and interval, next charge, cancellation route, and next action. Add a safe account nickname when you use multiple accounts. The list should help you make decisions, not become another project you avoid opening.',
          'Reconcile the list against receipts and statements. Looking at one month alone may miss annual or quarterly renewals, so use the available history and search receipts for terms such as renewal, membership, and subscription. Mark entries that need verification instead of guessing. A free account and a paid plan can share a brand name; the evidence determines whether a recurring bill belongs on the list.',
          'Use status labels that mean something: active and intentional, trial to review, cancellation pending, cancelled with confirmation, or refund pending. “Done” is too vague for a situation with several moving parts. If someone else manages the household billing, agree on who updates the status. A shared process works best when responsibility is explicit rather than assumed.',
        ],
        takeaway: 'Keep the list small enough to maintain and specific enough to act on.',
      },
      {
        title: 'Convert costs without confusing them with bills',
        paragraphs: [
          'Normalize costs to compare their weight in your budget. Multiply a monthly charge by twelve for its annual equivalent. Divide an annual charge by twelve for its monthly equivalent. Multiply a quarterly charge by four for its annual equivalent. These conversions assume the stated price remains the same and the plan remains active for the comparison period. Label them as equivalents, not as the actual collection schedule.',
          'Suppose you pay $9 monthly for music, $6 monthly for storage, and $84 annually for a learning tool. The monthly equivalent is $9 + $6 + ($84 ÷ 12) = $22. The annual equivalent is ($9 × 12) + ($6 × 12) + $84 = $264. But the learning tool still creates an $84 payment on one date. Keep a renewal calendar alongside the average so a smooth monthly figure does not hide a concentrated bill.',
          'Avoid double-counting annual payments. If you already included the annual tool as $7 per month in the equivalent total, do not add the full $84 again to that same yearly projection. Also separate one-time purchases from recurring commitments. You may track both, but mixing them without labels makes it difficult to see what next year will cost.',
        ],
        takeaway: 'Use equivalents for comparison and actual dates and amounts for cash planning.',
      },
      {
        title: 'Choose keep, change, or cancel with a reason',
        paragraphs: [
          'Review each entry against its purpose and evidence of use. “Keep: weekly language lessons at an acceptable price” is a clear choice. “Change: move to a lower storage tier after checking capacity” is a plan with a prerequisite. “Cancel: duplicate service, no use in two months” is a decision with an action to finish. If you cannot decide, write the missing fact and a date to find it rather than leaving an indefinite question mark.',
          'Treat expected savings separately from confirmed savings. If you plan to cancel an $8 monthly service, the potential annual reduction is $96 assuming twelve avoided payments at the same price. It becomes a reliable forward plan when cancellation is confirmed and the stated terms allow those payments to be avoided. A fee, minimum term, or partial period could change the actual result.',
          'Do not cancel a shared or essential service without checking who relies on it and what depends on it. A cloud service can hold files; a household plan can provide another person’s access. In a fictional practice case you can choose freely, but a real decision may require exporting data, arranging a replacement, or coordinating with the purchaser. A good system prevents avoidable disruption as well as avoidable charges.',
        ],
        takeaway: 'Attach a reason and a next action to each decision; verify dependencies first.',
      },
      {
        title: 'Use a short maintenance routine',
        paragraphs: [
          'Choose a recurring review that fits your life, such as the first weekend of each month. Reconcile new charges, review upcoming renewals, close pending cancellations, and check any expected refunds. Keep this to a few deliberate actions. If the list is accurate, the routine becomes shorter over time. You do not need to reconsider every useful service from scratch every month.',
          'Pair that monthly habit with event-based reviews. A promotional price ending, a new semester, moving home, or finishing a project can change your needs before the next normal review. Set reminders around those events and around larger annual renewals. This combines a regular safety net with attention at moments when a decision actually matters.',
          'Your capstone uses three fictional services so you can complete it without sharing account details. Calculate the total, estimate the reduction from ending the unused service, and choose the follow-through that makes the plan real. After the final assessment, you can download a reusable worksheet and your worked course record. In your own version, use service names and safe nicknames; leave out passwords and full payment numbers.',
          'Before moving on, explain the whole process aloud: identify the agreement, calculate the real cost, decide based on use, act through the billing provider, and verify the result. If you can describe that chain with one concrete example, you have a method you can reuse rather than just a collection of subscription tips.',
        ],
        takeaway: 'A small recurring review keeps deliberate choices from turning into forgotten bills.',
      },
    ],
    activity: {
      title: 'Capstone · Make the renewal plan', brief: 'Audit this fictional household list. Prices stay fixed, taxes are excluded, and the unused monthly service can be cancelled before its next payment without a fee.',
      facts: ['Music: $12/month, used daily, keep', 'GameBox: $8/month, unused, cancel before the next charge', 'StudyShelf: $120/year, useful, review before annual renewal', 'Savings projection: the next 12 months after cancellation takes effect'],
      fields: [
        { label: 'Current monthly equivalent of all three services ($)', type: 'number', answer: '30', explanation: '$12 + $8 + ($120 ÷ 12) = $30 per month equivalent.' },
        { label: 'Current annual equivalent of all three services ($)', type: 'number', answer: '360', explanation: '12 × $12 + 12 × $8 + $120 = $360.' },
        { label: 'Projected annual cost after GameBox is cancelled ($)', type: 'number', answer: '264', explanation: '$360 − (12 × $8) = $264. The projected annual reduction is $96.' },
        { label: 'Which follow-through completes the plan?', type: 'select', options: ['Save GameBox cancellation proof, check billing, and set a StudyShelf review reminder', 'Delete GameBox and assume the charge stops', 'Count $96 as received cash before cancelling'], answer: 'Save GameBox cancellation proof, check billing, and set a StudyShelf review reminder', explanation: 'The plan needs an actual cancellation and verification; projected avoided spending is not a refund.' },
      ],
    },
    questions: [
      { stem: 'A $120 annual plan has a $10 monthly equivalent. What does that mean?', options: ['The provider must collect $10 each month', 'The average cost is $10 per month, but the actual bill is $120 annually', 'You can cancel after any $10 payment', 'The service has no renewal date'], answerIndex: 1, rationale: 'A comparison average does not change the payment schedule or cancellation terms.' },
      { stem: 'What makes a subscription review useful?', options: ['Only listing the apps on your phone', 'Counting discounts on things you never intended to buy', 'Matching receipts, use, next charges, and specific follow-up actions', 'Deleting all old confirmations'], answerIndex: 2, rationale: 'A useful review combines evidence with a decision and a next action.' },
    ],
  },
];

export const SUBSCRIPTION_PREQUIZ: CourseQuestion[] = [
  { stem: 'A plan advertises $5 per month but bills annually. What is the stated upfront payment?', options: ['$5', '$60', '$12', '$0 until you use it'], answerIndex: 1, rationale: '$5 × 12 months = $60 collected annually.' },
  { stem: 'Which is the best time to evaluate whether to keep a trial?', options: ['After the first paid charge', 'At a scheduled review before the cancellation cutoff', 'Whenever you remember', 'After deleting the app'], answerIndex: 1, rationale: 'An early review leaves time to make and carry out the decision.' },
  { stem: 'A pause restarts billing in two months. Has renewal been permanently stopped?', options: ['Yes', 'No', 'Only if you turn off notifications', 'Only if you close the browser'], answerIndex: 1, rationale: 'The stated restart date means the pause does not end renewal permanently.' },
  { stem: 'Which is useful when querying a charge after cancellation?', options: ['A dated cancellation confirmation paired with the transaction', 'Only a screenshot of the logo', 'An unrelated customer review', 'Your full password'], answerIndex: 0, rationale: 'The confirmation and transaction establish the relevant sequence of events.' },
];

export const SUBSCRIPTION_FINAL: CourseQuestion[] = [
  { stem: 'A membership costs $3/month for 3 months, then $15/month for 9 months, plus a one-time $6 fee. What is the first-year total?', options: ['$150', '$180', '$144', '$54'], answerIndex: 0, rationale: '(3 × $3) + (9 × $15) + $6 = $150.' },
  { stem: 'With no price changes or repeat fees, what does the following full year of that $15/month membership cost?', options: ['$150', '$174', '$180', '$186'], answerIndex: 2, rationale: 'The promotion and one-time fee are finished: 12 × $15 = $180.' },
  { stem: 'A trial charges July 12 at noon UTC and requires cancellation 24 hours before. What is the latest stated cutoff?', options: ['July 12 at 11 a.m. UTC', 'July 11 at noon UTC', 'July 11 at midnight after the day ends', 'Any time on July 12'], answerIndex: 1, rationale: 'Subtract exactly 24 hours while preserving the time zone.' },
  { stem: 'A plan is $14 monthly or $112 annually with no partial annual refund. You need 6 months and can stop the monthly plan afterward. Which costs less?', options: ['Annual at $112', 'Monthly at $84', 'They are equal', 'Annual at $56'], answerIndex: 1, rationale: '6 × $14 = $84, which is $28 below the annual price.' },
  { stem: 'When do monthly payments of $14 equal the $112 annual price?', options: ['6 months', '7 months', '8 months', '12 months'], answerIndex: 2, rationale: '$112 ÷ $14 = 8 months.' },
  { stem: 'Your receipt identifies Apple as the biller. Where should you start managing that subscription?', options: ['The correct purchasing Apple account’s subscription controls', 'Your phone’s notification settings', 'An unsubscribe link in an unrelated marketing email', 'The browser history'], answerIndex: 0, rationale: 'Use the billing provider and purchase account identified by the receipt.' },
  { stem: 'A screen offers a 60-day pause that automatically resumes billing. You want to stop renewal. What should you do?', options: ['Accept pause and forget it', 'Delete the app', 'Find and complete the explicit cancellation route', 'Turn off email alerts'], answerIndex: 2, rationale: 'A temporary pause does not meet the stated goal of ending renewal.' },
  { stem: 'Renewal is off, but paid access remains through October 31. What follows?', options: ['Cancellation definitely failed', 'Remaining access can be consistent with a cancelled renewal; keep the confirmation', 'You must accept another paid year', 'There is automatically a full refund'], answerIndex: 1, rationale: 'Access end and renewal status are separate facts; neither creates an automatic refund.' },
  { stem: 'A charge posts after a documented effective cancellation. Which first description is accurate?', options: ['I never subscribed, even though I did', 'A charge posted after my confirmed cancellation; here are the dated records', 'All charges from this company are criminal', 'I can ignore the transaction indefinitely'], answerIndex: 1, rationale: 'State the actual issue and support it with evidence without misrepresenting the original purchase.' },
  { stem: 'What does withdrawing automatic-payment authorization do to a valid underlying obligation?', options: ['Always erases it', 'Automatically refunds all past payments', 'Does not by itself cancel the contract or erase money owed', 'Changes an annual plan into a free account'], answerIndex: 2, rationale: 'Payment authorization and the underlying contract must be addressed separately.' },
  { stem: 'A household pays $10/month, $7/month, and $96/year. What is its monthly equivalent?', options: ['$17', '$25', '$113', '$32'], answerIndex: 1, rationale: '$10 + $7 + ($96 ÷ 12) = $25 per month equivalent.' },
  { stem: 'Which record closes the loop on a refund request?', options: ['The original request alone', 'A support promise alone', 'The actual credit, with subscription status separately verified', 'Deleting the old statement'], answerIndex: 2, rationale: 'A completed credit confirms the refund; renewal status is still a separate fact to verify.' },
];

export function readingSeconds(section: ReadingSection): number {
  const words = [section.title, ...section.paragraphs, ...(section.bullets ?? []), ...(section.table?.rows.flat() ?? []), section.takeaway].join(' ').split(/\s+/).length;
  // A modest active-reading floor, separate from the more generous lesson estimate.
  return Math.max(20, Math.ceil(words / 360 * 60));
}
