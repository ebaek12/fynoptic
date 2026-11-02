import { SUBSCRIPTION_LESSONS } from './course-two';

export interface OutlineModule {
  title: string;
  description: string;
  practice: string;
  minutes?: number;
}
export interface CourseOutline {
  number: number;
  id: string;
  title: string;
  subtitle: string;
  headline: string;
  accent: string;
  description: string;
  outcome: string;
  skillsTitle: string;
  ready: boolean;
  lessonHref?: string;
  duration: string;
  assessment: string;
  modules: OutlineModule[];
}

export const COURSE_CATALOG: CourseOutline[] = [
  {
    number: 1, id: 'dark-patterns', title: 'Dark Patterns', subtitle: 'How to Spot Them',
    headline: 'Dark patterns.', accent: 'How to spot them.',
    description: 'Learn to see the design decisions behind a checkout, recognise when they push you off course, and respond with a clear plan.',
    outcome: 'The confidence to spot a misleading design, choose your next move, and keep the evidence that matters.',
    skillsTitle: 'Four ways to take back the decision', ready: true, lessonHref: '/courseone', duration: 'Self-paced',
    assessment: 'Start with a 10-question diagnostic. Complete the videos or text notes, readings, pattern-identification exercise, and evidence record. Pass the final quiz with at least 80% to earn your certificate and meet the prerequisite for later courses.',
    modules: [
      { title: 'Foundations: why the design matters', description: 'Explore the incentives behind misleading interfaces and learn a quick scan for choices, costs, and consequences.', practice: 'Watch the opening lesson or read its notes, then work through the foundations reading.' },
      { title: 'Spot the pattern', description: 'Distinguish obstruction, sneaking, forced action, and other design tactics in everyday buying decisions.', practice: 'Identify the patterns in ten situations and correct every missed answer.' },
      { title: 'Push back with a clear next move', description: 'Match a misleading interface to a practical response, from checking the total to asking for an explicit cancellation.', practice: 'Use the optional writing prompts to draft a cancellation or follow-up message.' },
      { title: 'Keep the evidence', description: 'Build a useful record of what happened, when it happened, and what you asked the company to do.', practice: 'Create and save an evidence record that identifies the merchant, action, pattern, and supporting proof.' },
    ],
  },
  {
    number: 2, id: 'subscriptions', title: 'Subscriptions & Memberships', subtitle: 'Costs, renewals, and cancellations',
    headline: 'Subscriptions.', accent: 'On your terms.',
    description: 'Know the real cost. Take control of renewals. Leave with a practical system for keeping what you value and cancelling what you don’t.',
    outcome: 'A clear renewal plan, a documented cancellation, and the confidence to question an unexpected charge.',
    skillsTitle: 'Your next six skills', ready: true, lessonHref: '/coursetwo', duration: 'About 60 minutes',
    assessment: 'Begin with a 3-minute starting quiz, complete all readings and six graded cases, and answer both knowledge checks in each module. Finish with an 8-minute, 12-question assessment: at least 80% is required for the certificate and downloadable workbook.',
    modules: SUBSCRIPTION_LESSONS.map(lesson => ({ title: lesson.title, description: lesson.objective, practice: lesson.activity.title, minutes: lesson.minutes })),
  },
  {
    number: 3, id: 'disputes-refunds', title: 'Disputes & Refunds', subtitle: 'How to request a refund',
    headline: 'A purchase went wrong.', accent: 'Make your case.',
    description: 'Turn a frustrating purchase into a clear request. Organise the facts, understand the policy, and follow up without losing track of what you are owed or promised.',
    outcome: 'A concise refund request backed by a useful timeline, relevant evidence, and a realistic follow-up plan.',
    skillsTitle: 'From purchase problem to a clear resolution', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone follows a fictional damaged-order case from its receipt through a written refund request and follow-up. A final scenario assessment will check evidence selection, accurate wording, and the difference between a promise and a completed refund.',
    modules: [
      { title: 'Name the problem and the remedy', minutes: 8, description: 'Separate a faulty item, a missing order, a duplicate payment, and a change of mind. Define whether you want a replacement, repair, refund, or explanation.', practice: 'Match four fictional purchase problems to a specific, proportionate request.' },
      { title: 'Read the policy that applies', minutes: 9, description: 'Locate the relevant return window, item conditions, fees, and purchase terms. Separate a company policy from questions that require jurisdiction-specific guidance.', practice: 'Annotate a sample return policy and identify the facts still missing from the case.' },
      { title: 'Build a useful evidence packet', minutes: 8, description: 'Connect the order confirmation, description, payment, delivery record, and photos to the issue you are reporting.', practice: 'Choose five relevant records from a mixed folder and arrange them chronologically.' },
      { title: 'Write a request someone can act on', minutes: 9, description: 'State the purchase, the problem, the evidence, and the outcome you want in a calm, concise message.', practice: 'Rewrite a vague complaint into a complete refund request for the damaged order.' },
      { title: 'Follow up and escalate thoughtfully', minutes: 8, description: 'Keep track of responses, reference numbers, and promised dates. Identify when to seek help through the platform, payment provider, or an appropriate consumer channel.', practice: 'Build the next three steps for an unanswered request without inventing facts or guaranteed outcomes.' },
      { title: 'Verify the resolution', minutes: 7, description: 'Distinguish a return label, an approved refund, a pending credit, and money actually returned. Close the case only when the relevant records agree.', practice: 'Reconcile the case timeline with a sample statement and write a final status note.' },
    ],
  },
  {
    number: 4, id: 'money-skills-students', title: 'Money Skills for Students', subtitle: 'Spending at school and online',
    headline: 'Student life.', accent: 'Smarter money moves.',
    description: 'Build a spending plan around the semester you actually have: uneven income, shared costs, everyday purchases, and the expenses that arrive all at once.',
    outcome: 'A workable student spending plan with room for upcoming bills, changing priorities, and a small financial buffer.',
    skillsTitle: 'Six habits for the semester ahead', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone uses a fictional student’s income, course costs, transport, and shared expenses to build a one-month plan. The assessment will test cash timing, trade-offs, and adjustments when the plan changes.',
    modules: [
      { title: 'Map money in and money out', minutes: 8, description: 'List reliable income, occasional income, fixed expenses, and flexible spending without treating uncertain money as already available.', practice: 'Sort a sample student’s transactions into a clear monthly money map.' },
      { title: 'Plan for the semester, not just today', minutes: 9, description: 'Bring textbooks, course supplies, travel, and other irregular costs into a calendar alongside weekly spending.', practice: 'Turn three upcoming semester costs into manageable savings targets.' },
      { title: 'Make everyday trade-offs visible', minutes: 8, description: 'Compare the total cost and usefulness of transport, meals, memberships, and convenience purchases in the same period.', practice: 'Choose between two fictional weekly routines within a fixed spending limit.' },
      { title: 'Handle shared expenses clearly', minutes: 9, description: 'Agree on who pays, how costs are divided, and when reimbursements happen. Keep a record that avoids double-counting or awkward surprises.', practice: 'Reconcile a group purchase and draft a simple shared-expense agreement.' },
      { title: 'Navigate online spending and credit offers', minutes: 8, description: 'Spot trial conversions, small recurring charges, and payment plans that move today’s spending into future weeks.', practice: 'Add a fictional instalment offer to a calendar and test whether the later payments fit.' },
      { title: 'Adjust the plan without abandoning it', minutes: 7, description: 'Respond to a missed shift or unexpected expense by revisiting priorities, protecting essentials, and choosing a realistic next step.', practice: 'Revise the capstone budget after an income change and identify one useful buffer habit.' },
    ],
  },
  {
    number: 5, id: 'ai-scams-deepfakes', title: 'AI Scams & Deepfakes', subtitle: 'Fake voices, images, and messages',
    headline: 'It sounds familiar.', accent: 'Verify it anyway.',
    description: 'Learn a calm response to convincing voices, videos, and messages. Check the identity and request through a trusted route before urgency makes the decision for you.',
    outcome: 'A repeatable verification routine for suspicious requests, plus a household response plan for impersonation attempts.',
    skillsTitle: 'Six steps from alarm to verification', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone presents a fictional urgent voice message and supporting texts. Learners will choose independent verification steps, protect sensitive information, and document a response without treating visual or audio clues as definitive proof.',
    modules: [
      { title: 'Understand what can be imitated', minutes: 8, description: 'Explore how a familiar voice, face, writing style, or logo can be used to lend credibility to an unfamiliar request.', practice: 'Separate identity claims from independently verified facts in a sample message.' },
      { title: 'Recognise the pressure in the request', minutes: 9, description: 'Examine secrecy, urgency, emotional pressure, unusual payment demands, and attempts to stop you checking elsewhere.', practice: 'Mark the pressure tactics in a fictional family-emergency call transcript.' },
      { title: 'Verify through a separate channel', minutes: 8, description: 'Use contact details you already trust, rather than the number or link supplied in the suspicious communication.', practice: 'Choose a safe verification route for a friend, employer, and supposed service provider.' },
      { title: 'Check media without relying on a single clue', minutes: 9, description: 'Investigate context, original sources, and corroborating information. Understand why an odd image detail or a confident detector result cannot settle every case.', practice: 'Compare a viral clip’s claim with its source context and record what remains uncertain.' },
      { title: 'Respond when information or money was shared', minutes: 8, description: 'Identify the accounts, payment providers, and official support channels relevant to a suspected impersonation incident.', practice: 'Put a fictional incident response checklist in order and preserve the useful records.' },
      { title: 'Create a shared verification plan', minutes: 7, description: 'Agree on trusted contact routes, how to handle urgent requests, and what to do when the first person cannot be reached.', practice: 'Draft a household verification card and use it to resolve the capstone scenario.' },
    ],
  },
  {
    number: 6, id: 'privacy-permissions', title: 'Privacy Permissions', subtitle: 'What apps can access',
    headline: 'Your data.', accent: 'A deliberate choice.',
    description: 'Connect an app’s requested access to the feature you actually want. Review permissions, sharing settings, and account choices without losing track of useful functionality.',
    outcome: 'A practical permission audit that records what an app needs, what you choose to allow, and when to review it again.',
    skillsTitle: 'Six checks before you tap “Allow”', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone audits a fictional travel app with several permission requests. Learners will justify a minimal, functional setup and explain the differences between device permissions, sharing preferences, and account deletion.',
    modules: [
      { title: 'Match access to a real feature', minutes: 8, description: 'Connect requests for camera, microphone, contacts, photos, and location to the task the app is performing.', practice: 'Sort fictional permission requests into necessary, optional, and unclear.' },
      { title: 'Compare the scope of permission', minutes: 9, description: 'Look for choices such as selected items, approximate location, or access only while using an app where the device provides them.', practice: 'Choose the least access that still supports three sample features.' },
      { title: 'Separate access from data sharing', minutes: 8, description: 'Distinguish a device permission from account visibility, advertising preferences, and the service’s stated data practices.', practice: 'Trace which setting addresses each concern in a fictional app’s settings menu.' },
      { title: 'Review connected apps and old access', minutes: 9, description: 'Find accounts and integrations that continue to have access after their original task is finished.', practice: 'Audit a sample connected-app list and identify which relationships need review.' },
      { title: 'Plan for revocation and deletion', minutes: 8, description: 'Consider what stops when a permission is revoked and what separate questions remain about data already held by a provider.', practice: 'Write a before-and-after checklist for removing a fictional service safely.' },
      { title: 'Make a permission review routine', minutes: 7, description: 'Keep a simple record of the app, purpose, access granted, and next review, especially after a new feature or account change.', practice: 'Complete the travel-app audit and explain the trade-offs in the chosen settings.' },
    ],
  },
  {
    number: 7, id: 'ad-transparency', title: 'Ad Transparency', subtitle: 'Sponsored posts and targeted ads',
    headline: 'Behind the recommendation.', accent: 'Follow the incentive.',
    description: 'Read sponsored posts, affiliate links, search results, and product claims with a clearer view of who benefits from your attention and purchase.',
    outcome: 'An advertising claim-check sheet that separates sponsorship, evidence, targeting context, and your own buying criteria.',
    skillsTitle: 'Six ways to read an ad more clearly', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone compares a fictional influencer post, a sponsored search result, and a product page. Learners will identify incentives and evidence gaps, then make a purchase decision based on their own criteria.',
    modules: [
      { title: 'Identify the commercial relationship', minutes: 8, description: 'Look for sponsorship, affiliate arrangements, gifted products, and other reasons a recommendation may also be an advertisement.', practice: 'Annotate the relationship signals in three fictional posts.' },
      { title: 'Separate a claim from its evidence', minutes: 9, description: 'Distinguish a personal testimonial, a measurable product claim, and supporting evidence that actually addresses that claim.', practice: 'Build a claim-and-evidence table for an imaginary productivity product.' },
      { title: 'Read reviews and endorsements in context', minutes: 8, description: 'Consider the reviewer’s experience, incentives, comparison basis, and what the review does not establish.', practice: 'Compare two endorsements and list the questions needed before relying on either.' },
      { title: 'Understand why an ad reached you', minutes: 9, description: 'Explore the difference between the context where an ad appears and the information a platform may use to select an audience.', practice: 'Interpret a fictional ad-information panel without assuming it reveals every targeting decision.' },
      { title: 'Check the offer beyond the headline', minutes: 8, description: 'Follow the claim through to the product details, total price, conditions, and any recurring commitment.', practice: 'Reconcile a promotional post with a fictional checkout summary.' },
      { title: 'Make a decision on your own criteria', minutes: 7, description: 'Write down the job you need done, the evidence you require, and the price you are willing to pay before comparing promotions.', practice: 'Complete the capstone claim-check sheet and explain a buy, wait, or pass decision.' },
    ],
  },
  {
    number: 8, id: 'chargebacks', title: 'Chargebacks', subtitle: 'How to dispute a card charge',
    headline: 'Question the charge.', accent: 'Document the facts.',
    description: 'Understand the role of a card-payment dispute, prepare an accurate case, and track the process without confusing a temporary credit with a final decision.',
    outcome: 'An organised card-dispute packet and follow-up tracker with the transaction, reason, evidence, and provider instructions in one place.',
    skillsTitle: 'Six parts of a well-documented dispute', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone follows a fictional card charge for an undelivered order. The assessment will distinguish merchant refunds from payment-provider disputes and test accurate evidence selection, timely inquiry, and resolution tracking.',
    modules: [
      { title: 'Separate refund requests from card disputes', minutes: 8, description: 'Understand the different roles of the merchant, marketplace, and card provider when a payment is questioned.', practice: 'Map the relevant parties and requested outcome for three fictional transactions.' },
      { title: 'Identify the transaction and the issue', minutes: 9, description: 'Check the amount, posting status, descriptor, receipt, and whether the issue concerns authorisation or a purchase problem.', practice: 'Match sample statement entries to receipts and write a factual issue description.' },
      { title: 'Check your provider’s process promptly', minutes: 8, description: 'Find the appropriate dispute channel and ask about applicable deadlines, required records, and follow-up instructions for the payment method.', practice: 'Build a provider-question checklist without assuming a universal deadline.' },
      { title: 'Assemble evidence that answers the question', minutes: 9, description: 'Connect the relevant terms, delivery information, merchant contact, and payment record to the specific disputed transaction.', practice: 'Select and label the evidence for a fictional undelivered-order case.' },
      { title: 'Track credits, requests, and decisions', minutes: 8, description: 'Distinguish a submitted dispute, a request for more information, a provisional credit, and the final outcome.', practice: 'Update a case tracker as new fictional messages arrive from the card provider.' },
      { title: 'Close the case accurately', minutes: 7, description: 'Reconcile the final statement with the decision, any merchant refund, and any separate cancellation still needed.', practice: 'Resolve the capstone timeline and identify any remaining action without double-counting credits.' },
    ],
  },
  {
    number: 9, id: 'banking-without-hidden-fees', title: 'Banking Without Hidden Fees', subtitle: 'Account terms, overdrafts, and payment apps',
    headline: 'Everyday banking.', accent: 'Fewer surprises.',
    description: 'Read an account through the way you actually use it: deposits, transfers, cash withdrawals, recurring payments, and the fees that can quietly add up.',
    outcome: 'An account-comparison worksheet and a routine for checking balances, payment timing, and recurring fees.',
    skillsTitle: 'Six checks for everyday money movement', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone compares two fictional accounts against a month of realistic transactions. Learners will calculate stated fees, explain balance timing, and select a suitable setup using the provided terms.',
    modules: [
      { title: 'Read the fee schedule', minutes: 8, description: 'Locate monthly charges, waiver conditions, transaction fees, and the account features you actually expect to use.', practice: 'Turn a sample account disclosure into a short comparison card.' },
      { title: 'Follow the timing of your balance', minutes: 9, description: 'Distinguish a displayed balance from pending payments and funds that may not yet be available for the next transaction.', practice: 'Reconstruct a fictional week of deposits, holds, and scheduled bills.' },
      { title: 'Understand overdraft choices', minutes: 8, description: 'Compare the stated consequences of different account settings and identify the provider questions needed before choosing.', practice: 'Work through a sample payment sequence under two fictional overdraft arrangements.' },
      { title: 'Compare transfers and cash access', minutes: 9, description: 'Look at speed, fees, withdrawal access, and any conditions attached to moving money between services.', practice: 'Choose a route for three sample transfers using a provided fee and timing table.' },
      { title: 'Use payment apps with clear expectations', minutes: 8, description: 'Identify who provides a service, what account or balance is involved, and which terms explain holds, fees, and support.', practice: 'Trace a fictional payment from sender to recipient and list the unresolved protection questions.' },
      { title: 'Build a low-surprise banking routine', minutes: 7, description: 'Set a manageable habit for reviewing fees, incoming money, upcoming bills, and alerts relevant to your account.', practice: 'Complete the account comparison and create a monthly review checklist.' },
    ],
  },
  {
    number: 10, id: 'credit-borrowing', title: 'Credit & Borrowing', subtitle: 'Interest, credit reports, and loan comparisons',
    headline: 'Before you borrow.', accent: 'See the whole cost.',
    description: 'Look beyond a manageable monthly payment. Compare borrowing terms, understand how repayment changes the total, and read credit information with context.',
    outcome: 'A loan-comparison sheet that connects the payment, total cost, fees, duration, and fit with a realistic repayment plan.',
    skillsTitle: 'Six questions before a borrowing decision', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone compares fictional borrowing offers with clearly stated assumptions. Learners will check the total repayment, explain payment-versus-duration trade-offs, and identify information still needed before deciding.',
    modules: [
      { title: 'Name the borrowing need', minutes: 8, description: 'Identify the purpose, amount, timing, and realistic source of repayment before comparing available offers.', practice: 'Write a borrowing brief for a fictional purchase and list non-borrowing alternatives to evaluate.' },
      { title: 'Read interest, fees, and APR together', minutes: 9, description: 'Locate the stated rate, fees, payment schedule, and total repayment; identify assumptions that make a comparison incomplete.', practice: 'Extract the comparison facts from two sample loan summaries.' },
      { title: 'Compare payment size with total cost', minutes: 8, description: 'Explore how a longer repayment period can change monthly affordability and the overall amount paid.', practice: 'Calculate totals from provided repayment schedules and explain the trade-off.' },
      { title: 'Understand revolving balances', minutes: 9, description: 'Read a fictional card statement, distinguish the minimum from a repayment plan, and track new spending alongside existing debt.', practice: 'Build a short balance timeline using the interest assumptions supplied in the case.' },
      { title: 'Read credit reports and check errors', minutes: 8, description: 'Distinguish a credit report from a score and identify the records needed to investigate unfamiliar or incorrect entries.', practice: 'Review a fictional report excerpt and prepare a factual correction checklist.' },
      { title: 'Choose a repayment plan you can explain', minutes: 7, description: 'Compare the offers against the borrower’s actual budget and identify next steps if payments become difficult.', practice: 'Finish the capstone comparison and describe the decision, assumptions, and unanswered questions.' },
    ],
  },
  {
    number: 11, id: 'safer-online-shopping', title: 'Safer Online Shopping', subtitle: 'Seller checks, delivery problems, and fake offers',
    headline: 'Before you buy.', accent: 'Check the whole story.',
    description: 'Follow an online purchase from the first offer to the delivered item. Check the seller, compare the actual terms, and keep the records you may need later.',
    outcome: 'A reusable purchase-check routine covering the seller, offer, payment, delivery, and response if something goes wrong.',
    skillsTitle: 'Six checks from listing to delivery', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone asks learners to evaluate a fictional unfamiliar shop and follow its order through a delivery problem. The assessment will test seller checks, complete pricing, evidence, and safe follow-up.',
    modules: [
      { title: 'Verify the seller behind the listing', minutes: 8, description: 'Look for a consistent business identity, usable contact information, and independent context beyond the shop’s own claims.', practice: 'Compare two fictional storefronts and record verifiable facts and unanswered questions.' },
      { title: 'Read the offer without the pressure', minutes: 9, description: 'Examine product details, condition, availability, urgency claims, and whether the offer makes sense for your actual need.', practice: 'Annotate a sample listing and separate product facts from sales pressure.' },
      { title: 'Compare the complete checkout', minutes: 8, description: 'Include shipping, add-ons, recurring commitments, and stated return costs when comparing the price you will actually pay.', practice: 'Reconcile a fictional advertised price with the final order total.' },
      { title: 'Choose a payment route deliberately', minutes: 9, description: 'Identify the payment recipient and review the applicable support and dispute options instead of assuming every method works the same way.', practice: 'Evaluate a seller’s unusual payment request and list the checks needed before proceeding.' },
      { title: 'Track delivery and preserve evidence', minutes: 8, description: 'Keep the order, delivery estimate, tracking record, and item condition connected to the same purchase.', practice: 'Build an evidence timeline for a fictional missing or misdescribed item.' },
      { title: 'Respond safely when an order goes wrong', minutes: 7, description: 'Use trusted contact routes, state the issue clearly, and distinguish a seller response from a completed resolution.', practice: 'Complete the storefront capstone and draft the next action for its delivery problem.' },
    ],
  },
  {
    number: 12, id: 'housing-rental-costs', title: 'Housing & Rental Costs', subtitle: 'Leases, deposits, and the costs of moving',
    headline: 'More than the rent.', accent: 'Plan the whole move.',
    description: 'Compare a rental using the costs, commitments, and practical details around it. Prepare questions and documentation before signing, moving in, and moving out.',
    outcome: 'A complete rental-cost comparison and a move-in evidence checklist, with questions marked for local guidance.',
    skillsTitle: 'Six parts of a clearer rental decision', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone compares two fictional rental listings, their move-in costs, and selected lease terms. Learners will build a cash plan and evidence checklist without assuming that deposit or notice rules are the same everywhere.',
    modules: [
      { title: 'Compare the full monthly cost', minutes: 8, description: 'Add stated utilities, transport, parking, and required recurring charges to the rent when comparing options.', practice: 'Build monthly totals for two fictional listings using the same assumptions.' },
      { title: 'Plan the cash needed to move', minutes: 9, description: 'Separate upfront payments, refundable amounts, moving expenses, and cash that needs to remain available afterward.', practice: 'Create a move-in cash calendar and identify the largest payment day.' },
      { title: 'Verify the listing and the contact', minutes: 8, description: 'Check the property, the person offering it, and the payment request before sending money or sensitive application information.', practice: 'Investigate a fictional listing and identify the independent checks needed to proceed.' },
      { title: 'Read the commitments in the lease', minutes: 9, description: 'Locate the term, payment obligations, responsibilities, renewal conditions, and notice provisions; flag questions requiring local advice.', practice: 'Annotate a sample lease excerpt and prepare a focused question list.' },
      { title: 'Document move-in and maintenance', minutes: 8, description: 'Keep a dated record of condition, agreed repairs, and maintenance communication that can be understood later.', practice: 'Assemble a fictional move-in inventory and write a clear repair request.' },
      { title: 'Prepare for the end of the tenancy', minutes: 7, description: 'Plan notice, key return, condition records, and deposit follow-up using the agreement and applicable local guidance.', practice: 'Finish the rental comparison and create a move-out checklist with unresolved local questions.' },
    ],
  },
  {
    number: 13, id: 'investing-without-hype', title: 'Investing Without the Hype', subtitle: 'Risk, fees, and misleading investment claims',
    headline: 'Less hype.', accent: 'Better questions.',
    description: 'Learn to question an investment pitch before considering a decision. Connect the goal, risks, costs, access to money, and quality of the evidence behind a claim.',
    outcome: 'An investment-pitch review that identifies the product, major risks, fees, evidence gaps, and questions for further research.',
    skillsTitle: 'Six questions behind every investment pitch', ready: false, duration: 'Planned: about 60 minutes',
    assessment: 'The planned capstone reviews a fictional investment promotion without recommending a purchase. Learners will distinguish claims from evidence, identify stated risks and costs, and explain what they would need to verify next.',
    modules: [
      { title: 'Start with the purpose and time horizon', minutes: 8, description: 'Connect an investing goal to when money may be needed and the uncertainty a person is able and willing to consider.', practice: 'Compare fictional goals and identify why the same product may not fit each one.' },
      { title: 'Identify what the product actually is', minutes: 9, description: 'Ask what is owned, how returns might arise, who operates the product, and which documents explain it.', practice: 'Translate a fictional pitch into a plain-language product description with unanswered questions.' },
      { title: 'Read the risks behind the return', minutes: 8, description: 'Look at possible losses, concentration, changing prices, and limits on accessing money instead of relying on an appealing return figure.', practice: 'Map the risks disclosed in a sample product summary to realistic scenarios.' },
      { title: 'Make the costs visible', minutes: 9, description: 'Identify ongoing fees, transaction costs, and other stated charges; compare examples using consistent assumptions.', practice: 'Calculate the effect of two fictional fee schedules on a supplied account value.' },
      { title: 'Question performance claims and urgency', minutes: 8, description: 'Examine the period shown, comparison basis, missing information, incentives, and pressure to act before checking.', practice: 'Annotate a promotional performance chart and write the questions it leaves unanswered.' },
      { title: 'Build a verification checklist', minutes: 7, description: 'Find appropriate official sources for checking the firm and offering, and decide what must be understood before considering any action.', practice: 'Complete the investment-pitch capstone with a risk summary and a research plan.' },
    ],
  },
];

export const outlineHref = (course: Pick<CourseOutline, 'id'>) => `/courses/${course.id}`;
export const COURSE_ONE_LOCK_MESSAGE = 'Locked until Course 1 is complete';
