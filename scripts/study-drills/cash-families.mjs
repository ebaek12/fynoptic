import { numeric, money as m, num as n, pct as p, round } from './helpers.mjs';

// All terms are hypothetical. Each family changes meaningful numeric inputs for v = 0..19.
const topics = [
  'Pay and Cash Flow Drills', 'Budget Planning Drills', 'Savings Goal Drills',
  'Bank Account Cost Drills', 'Credit Card Math Drills', 'Loan Payment Drills',
  'Housing Cost Drills', 'Car Ownership Drills', 'College Cost Drills', 'Insurance Cost Drills',
];
const family = (topic, id, difficulty, build) => ({ id: `cash-${id}`, category: 'Personal Finance', topic: topics[topic], difficulty, build });
const percent = { style: 'percent', digits: 2 };
const count = suffix => ({ style: 'number', digits: 0, suffix });
const amort = (principal, monthlyRate, months) => principal * monthlyRate / (1 - (1 + monthlyRate) ** -months);

export const families = [
  // Pay and cash flow: 9 families.
  family(0, 'overtime-gross-pay', 'easy', v => {
    const rate = 18 + v * 0.5, hours = 43 + v % 8, extra = hours - 40;
    const value = 40 * rate + extra * rate * 1.5;
    return numeric(`A job pays ${m(rate)} an hour for the first 40 hours of a week and 1.5 times that rate for every additional hour. You work ${hours} hours. What is gross pay before any deductions?`, value,
      [hours * rate, hours * rate * 1.5, 40 * rate + extra * rate * 0.5, 40 * rate],
      `Regular pay is 40 × ${m(rate)} = ${m(40 * rate)}. Overtime is ${extra} × ${m(rate)} × 1.5 = ${m(extra * rate * 1.5)}. Gross pay is ${m(value)}.`);
  }),
  family(0, 'paycheck-deductions', 'easy', v => {
    const gross = 1600 + 85 * v, withholding = 16 + v % 5, retirement = 4 + v % 3, benefit = 65 + v * 3;
    const value = gross * (1 - (withholding + retirement) / 100) - benefit;
    return numeric(`Gross pay is ${m(gross)}. Under this hypothetical payroll, withholding is ${p(withholding)} of gross pay, a retirement contribution is separately ${p(retirement)} of gross pay, and benefits cost ${m(benefit)}. What take-home pay remains?`, value,
      [gross * (1 - withholding / 100) - benefit, gross * (1 - withholding / 100) * (1 - retirement / 100) - benefit, gross * (1 - (withholding + retirement) / 100), gross - benefit],
      `Both percentage deductions use gross pay: ${m(gross)} − ${m(gross * withholding / 100)} − ${m(gross * retirement / 100)} − ${m(benefit)} = ${m(value)}.`);
  }),
  family(0, 'biweekly-monthly-income', 'easy', v => {
    const check = 1250 + 65 * v, value = check * 26 / 12;
    return numeric(`Your take-home pay is ${m(check)} every two weeks, with exactly 26 paychecks in the year. What is average monthly take-home income for a 12-month budget?`, value,
      [check * 2, check * 24 / 12, check * 52 / 12, check * 26],
      `Annual take-home income is ${m(check)} × 26 = ${m(check * 26)}. Dividing by 12 gives ${m(value)} per month.`);
  }),
  family(0, 'tiered-sales-commission', 'medium', v => {
    const base = 1600 + 30 * v, threshold = 10000 + 200 * v, sales = threshold + 4000 + 350 * v, low = 3, high = 6 + v % 3;
    const value = base + threshold * low / 100 + (sales - threshold) * high / 100;
    return numeric(`A monthly pay plan includes ${m(base)} base pay, ${p(low)} commission on the first ${m(threshold)} of sales, and ${p(high)} only on sales above that amount. With ${m(sales)} of sales and no deductions, what is total pay?`, value,
      [base + sales * high / 100, base + sales * low / 100, threshold * low / 100 + (sales - threshold) * high / 100, base + threshold * low / 100 + sales * high / 100],
      `Pay = ${m(base)} + ${m(threshold)} × ${p(low)} + (${m(sales)} − ${m(threshold)}) × ${p(high)} = ${m(value)}.`);
  }),
  family(0, 'irregular-income-average', 'easy', v => {
    const a = 1600 + 45 * v, b = 2300 + 55 * v, c = 1900 + 35 * v, bonus = 450 + 15 * v, value = (a + b + c - bonus) / 3;
    return numeric(`Three months of take-home deposits were ${m(a)}, ${m(b)}, and ${m(c)}. The second month included a one-time bonus of ${m(bonus)}. Excluding that bonus, what was average recurring monthly income?`, value,
      [(a + b + c) / 3, (a + b + c) / 3 - bonus, (a + b + c - bonus) / 2, b - bonus],
      `Remove the one-time receipt before averaging: (${m(a)} + ${m(b)} + ${m(c)} − ${m(bonus)}) ÷ 3 = ${m(value)}.`);
  }),
  family(0, 'cash-flow-timing-buffer', 'medium', v => {
    const opening = 180 + 8 * v, earlyBill = 650 + 20 * v, pay = 1450 + 40 * v, laterBill = 500 + 10 * v, value = earlyBill - opening;
    return numeric(`Checking starts at ${m(opening)}. A ${m(earlyBill)} bill clears on day 2, a ${m(pay)} paycheck arrives on day 5, and a ${m(laterBill)} bill clears on day 8. No other transactions occur. What is the minimum additional opening cash needed to keep the balance at or above zero throughout?`, value,
      [earlyBill, earlyBill + laterBill - opening, pay - earlyBill - laterBill + opening, earlyBill - opening + laterBill],
      `The lowest balance before any extra cash is on day 2: ${m(opening)} − ${m(earlyBill)} = ${m(-value)}. An opening buffer of ${m(value)} prevents the shortfall; the later paycheck covers the remaining bill.`);
  }),
  family(0, 'raise-net-increase', 'medium', v => {
    const salary = 42000 + 1800 * v, raise = 3 + v % 6, deduction = 21 + v % 4, value = salary * raise / 100 * (1 - deduction / 100) / 12;
    return numeric(`Annual salary is ${m(salary)} and rises by ${p(raise)}. Assume a hypothetical flat ${p(deduction)} of the additional gross pay is deducted, with no other changes. What is the increase in average monthly take-home pay?`, value,
      [salary * raise / 100 / 12, salary * raise / 100 * deduction / 100 / 12, salary * raise / 100 * (1 - deduction / 100), salary * (1 - deduction / 100) / 12],
      `Annual raise = ${m(salary)} × ${p(raise)} = ${m(salary * raise / 100)}. Monthly take-home increase = ${m(salary * raise / 100)} × (1 − ${deduction}/100) ÷ 12 = ${m(value)}.`);
  }),
  family(0, 'gig-profit-tax-reserve', 'medium', v => {
    const receipts = 2200 + 95 * v, costs = 540 + 25 * v, reserve = 22 + v % 5, value = (receipts - costs) * (1 - reserve / 100);
    return numeric(`A freelancer collects ${m(receipts)} and pays ${m(costs)} in business expenses. For planning only, they reserve ${p(reserve)} of profit for future taxes. How much remains for personal use after expenses and this reserve?`, value,
      [receipts - costs, receipts * (1 - reserve / 100) - costs, (receipts - costs) * reserve / 100, receipts * (1 - reserve / 100)],
      `Profit is ${m(receipts)} − ${m(costs)} = ${m(receipts - costs)}. Keep ${100 - reserve}% after the stated reserve: ${m(receipts - costs)} × ${n(1 - reserve / 100, 2)} = ${m(value)}. The reserve is a planning assumption, not a tax calculation.`);
  }),
  family(0, 'effective-hourly-with-commute', 'medium', v => {
    const takeHome = 680 + 32 * v, commuteCost = 45 + 3 * v, work = 35 + v % 6, travel = 5 + v % 4, value = (takeHome - commuteCost) / (work + travel);
    return numeric(`A job provides ${m(takeHome)} weekly take-home pay. Commuting costs ${m(commuteCost)} a week and takes ${travel} hours, in addition to ${work} working hours. What is effective take-home pay per hour of total work-plus-commute time after commuting costs?`, value,
      [takeHome / work, (takeHome - commuteCost) / work, takeHome / (work + travel), (takeHome - commuteCost) / travel],
      `Net weekly cash is ${m(takeHome)} − ${m(commuteCost)} = ${m(takeHome - commuteCost)}. Divide by ${work} + ${travel} = ${work + travel} hours: ${m(value)} per hour.`, { suffix: 'per hour' });
  }),

  // Budget planning: 9 families.
  family(1, 'zero-based-discretionary-budget', 'easy', v => {
    const income = 3200 + 110 * v, fixed = 1700 + 45 * v, essentials = 650 + 20 * v, saving = 350 + 15 * v, value = income - fixed - essentials - saving;
    return numeric(`Monthly take-home income is ${m(income)}. You assign ${m(fixed)} to fixed bills, ${m(essentials)} to other essentials, and ${m(saving)} to savings. To assign every dollar exactly once, how much remains for discretionary spending?`, value,
      [income - fixed - essentials, income - fixed - saving, fixed + essentials + saving, income - fixed],
      `Unassigned income = ${m(income)} − ${m(fixed)} − ${m(essentials)} − ${m(saving)} = ${m(value)}.`);
  }),
  family(1, 'needs-share-room', 'easy', v => {
    const income = 3000 + 125 * v, cap = 45 + v % 6, current = 1000 + 40 * v, value = income * cap / 100 - current;
    return numeric(`Your chosen budget caps needs at ${p(cap)} of ${m(income)} monthly take-home income. Needs already budgeted total ${m(current)}. How much more could be assigned to needs without exceeding your own cap?`, value,
      [income * cap / 100, income - current, current * cap / 100, income * (1 - cap / 100) - current],
      `Needs cap = ${m(income)} × ${p(cap)} = ${m(income * cap / 100)}. Remaining room = ${m(income * cap / 100)} − ${m(current)} = ${m(value)}.`);
  }),
  family(1, 'irregular-bills-monthly-reserve', 'medium', v => {
    const annual = 420 + 18 * v, quarterly = 150 + 7 * v, semiannual = 260 + 11 * v, value = (annual + 4 * quarterly + 2 * semiannual) / 12;
    return numeric(`You pay ${m(annual)} once a year for membership, ${m(quarterly)} each quarter for a service, and ${m(semiannual)} twice a year for insurance. With no interest and a full year to fund all bills, what equal monthly reserve covers these costs?`, value,
      [(annual + quarterly + semiannual) / 12, annual / 12 + quarterly / 4 + semiannual / 2, (annual + 4 * quarterly + 2 * semiannual) / 6, annual + quarterly + semiannual],
      `Annual cost is ${m(annual)} + 4 × ${m(quarterly)} + 2 × ${m(semiannual)} = ${m(annual + 4 * quarterly + 2 * semiannual)}. Divide by 12: ${m(value)} per month.`);
  }),
  family(1, 'weekly-spending-monthly-equivalent', 'easy', v => {
    const weekly = 95 + 6 * v, monthly = 35 + 2 * v, value = weekly * 52 / 12 + monthly;
    return numeric(`Groceries average ${m(weekly)} per week and household supplies cost ${m(monthly)} per month. Using exactly 52 weeks and 12 months per year, what monthly amount should cover both?`, value,
      [weekly * 4 + monthly, (weekly + monthly) * 52 / 12, weekly * 52 / 12, weekly + monthly],
      `Convert groceries using 52 ÷ 12, then add the monthly item: ${m(weekly)} × 52 ÷ 12 + ${m(monthly)} = ${m(value)}.`);
  }),
  family(1, 'budget-overrun-percentage', 'easy', v => {
    const planned = 320 + 15 * v, actual = planned + 55 + 4 * v, value = (actual - planned) / planned * 100;
    return numeric(`Dining spending was budgeted at ${m(planned)}, but actual spending was ${m(actual)}. By what percentage of the original budget did actual spending exceed the budget?`, value,
      [(actual - planned) / actual * 100, actual / planned * 100, (actual - planned) / planned, (actual - planned)],
      `Overrun = ${m(actual)} − ${m(planned)} = ${m(actual - planned)}. Percentage over budget = ${m(actual - planned)} ÷ ${m(planned)} × 100 = ${p(value, 2)}.`, percent);
  }),
  family(1, 'required-flexible-spending-cut', 'medium', v => {
    const deficit = 150 + 8 * v, cancel = 35 + v, flexible = 520 + 20 * v, value = (deficit - cancel) / flexible * 100;
    return numeric(`A monthly plan is short by ${m(deficit)}. Canceling a subscription saves ${m(cancel)}. The remaining shortfall must come entirely from a ${m(flexible)} flexible-spending category. By what percentage must that category be reduced?`, value,
      [deficit / flexible * 100, (deficit + cancel) / flexible * 100, (deficit - cancel) / (flexible - cancel) * 100, cancel / flexible * 100],
      `After the cancellation, the gap is ${m(deficit)} − ${m(cancel)} = ${m(deficit - cancel)}. Required cut = ${m(deficit - cancel)} ÷ ${m(flexible)} × 100 = ${p(value, 2)}.`, percent);
  }),
  family(1, 'proportional-shared-bills', 'medium', v => {
    const a = 2600 + 90 * v, b = 1800 + 50 * v, shared = 1650 + 55 * v, value = shared * a / (a + b);
    return numeric(`Two partners take home ${m(a)} and ${m(b)} monthly. They split ${m(shared)} of shared bills in proportion to their take-home incomes. What is the first partner's share?`, value,
      [shared / 2, shared * b / (a + b), shared * a / b, shared * (a - b) / (a + b)],
      `Combined income is ${m(a + b)}. The first partner pays ${m(shared)} × ${m(a)} ÷ ${m(a + b)} = ${m(value)}.`);
  }),
  family(1, 'weighted-price-increase-budget', 'medium', v => {
    const food = 450 + 15 * v, energy = 130 + 7 * v, other = 850 + 20 * v, foodRate = 4 + v % 4, energyRate = 9 + v % 6, value = food * (1 + foodRate / 100) + energy * (1 + energyRate / 100) + other;
    return numeric(`A monthly basket currently includes ${m(food)} of food, ${m(energy)} of energy, and ${m(other)} of other costs. Food rises ${p(foodRate)}, energy rises ${p(energyRate)}, and other costs stay fixed. Quantities do not change. What is the new total monthly cost?`, value,
      [(food + energy + other) * (1 + (foodRate + energyRate) / 100), food + energy + other, food * (1 + energyRate / 100) + energy * (1 + foodRate / 100) + other, food * (1 + foodRate / 100) + energy + other],
      `Apply each rate only to its category: ${m(food)} × ${n(1 + foodRate / 100, 2)} + ${m(energy)} × ${n(1 + energyRate / 100, 2)} + ${m(other)} = ${m(value)}.`);
  }),
  family(1, 'subscription-break-even-use', 'medium', v => {
    const month = 18 + v, annual = month * (7 + v % 3) + 5, value = Math.floor(annual / month) + 1;
    return numeric(`A service costs ${m(month)} for each month you use it, or ${m(annual)} for a nonrefundable annual pass. Monthly service can be canceled without a fee. Ignoring interest, what is the smallest whole number of paid months at which the annual pass costs strictly less?`, value,
      [Math.floor(annual / month), 12, Math.ceil(annual / month) + 1, Math.round(annual / month) - 1],
      `The annual pass is cheaper when months × ${m(month)} > ${m(annual)}. The threshold is ${m(annual)} ÷ ${m(month)} = ${n(annual / month, 3)} months, so the first whole number above it is ${value}.`, count('months'));
  }),

  // Savings goals: 9 families.
  family(2, 'goal-monthly-contribution', 'easy', v => {
    const target = 4200 + 260 * v, saved = 650 + 45 * v, months = 8 + v % 9, value = (target - saved) / months;
    return numeric(`You want ${m(target)} in ${months} months and already have ${m(saved)}. Assuming no interest, fees, or withdrawals, what equal deposit at each month-end reaches the target?`, value,
      [target / months, (target + saved) / months, target - saved, saved / months],
      `Still needed = ${m(target)} − ${m(saved)} = ${m(target - saved)}. Divide by ${months} deposits: ${m(value)} each. Carry full precision before rounding.`);
  }),
  family(2, 'whole-months-to-goal', 'easy', v => {
    const target = 4800 + 210 * v, saved = 720 + 25 * v, deposit = 240 + 12 * v, value = Math.ceil((target - saved) / deposit);
    return numeric(`A savings goal is ${m(target)} and the opening balance is ${m(saved)}. You add ${m(deposit)} at each month-end, earning no interest. What is the minimum whole number of monthly deposits needed to meet or exceed the goal?`, value,
      [Math.floor((target - saved) / deposit), Math.ceil(target / deposit), Math.ceil((target + saved) / deposit), Math.ceil((target - saved) / deposit) + 1],
      `The gap is ${m(target - saved)}. ${m(target - saved)} ÷ ${m(deposit)} = ${n((target - saved) / deposit, 3)} deposits; round up to ${value} whole deposits.`, count('months'));
  }),
  family(2, 'emergency-fund-essential-target', 'easy', v => {
    const essential = 1750 + 70 * v, optional = 350 + 15 * v, months = 3 + v % 4, saved = 1300 + 55 * v, value = essential * months - saved;
    return numeric(`You choose an emergency-fund target of ${months} months of essential expenses only. Essential costs are ${m(essential)} monthly; optional costs are ${m(optional)}. You already have ${m(saved)}. How much more is needed?`, value,
      [(essential + optional) * months - saved, essential * months, essential + optional - saved, (essential - saved) * months],
      `The chosen target excludes optional spending: ${m(essential)} × ${months} = ${m(essential * months)}. Subtract ${m(saved)} already saved to get ${m(value)}.`);
  }),
  family(2, 'simple-interest-required-deposit', 'medium', v => {
    const target = 5000 + 350 * v, rate = 3 + (v % 7) * 0.25, months = 9 + v % 12, value = target / (1 + rate / 100 * months / 12);
    return numeric(`A savings product pays ${p(rate, 2)} annual simple interest, without compounding or fees. What single opening deposit grows to ${m(target)} after exactly ${months}/12 years, with no other deposits or withdrawals?`, value,
      [target * (1 - rate / 100 * months / 12), target / (1 + rate / 100), target / (1 + rate / 100 * months), target * (1 + rate / 100 * months / 12)],
      `With simple interest, target = principal × (1 + rate × years). Principal = ${m(target)} ÷ [1 + ${rate}/100 × ${months}/12] = ${m(value)}.`);
  }),
  family(2, 'monthly-compound-savings', 'medium', v => {
    const principal = 2400 + 180 * v, rate = 3 + (v % 6) * 0.4, months = 15 + v, value = principal * (1 + rate / 1200) ** months;
    return numeric(`Deposit ${m(principal)} in an account with a fixed nominal annual interest rate of ${p(rate, 1)}, compounded monthly. With no later transactions or fees, what is the balance after ${months} months? Keep full precision until the final answer.`, value,
      [principal * (1 + rate / 100 * months / 12), principal * (1 + rate / 100) ** months, principal * (1 + rate / 1200), principal * (1 + rate / 100) ** Math.floor(months / 12)],
      `Monthly rate is ${rate}/100 ÷ 12. Balance = ${m(principal)} × (1 + ${rate}/1200)^${months} = ${m(value)}.`);
  }),
  family(2, 'annuity-savings-deposit', 'hard', v => {
    const target = 9000 + 600 * v, rate = 3.6 + (v % 5) * 0.6, months = 24 + v, r = rate / 1200, factor = ((1 + r) ** months - 1) / r, value = target / factor;
    return numeric(`Starting from zero, you want ${m(target)} after ${months} months. The account pays a nominal ${p(rate, 1)} annual rate compounded monthly, with no fees. What equal month-end deposit is required? Use the ordinary-annuity factor [(1 + r)^n − 1]/r, where r is the monthly rate; keep full precision until the final answer.`, value,
      [target / months, target / (factor * (1 + r)), target / (((1 + rate / 100) ** months - 1) / (rate / 100)), target / (months * (1 + r))],
      `r = ${rate}/1200 and n = ${months}. The factor is [(1 + ${rate}/1200)^${months} − 1]/(${rate}/1200) = ${n(factor, 6)}. Deposit = ${m(target)} ÷ factor = ${m(value)}.`);
  }),
  family(2, 'step-up-savings-plan', 'medium', v => {
    const first = 75 + 5 * v, increase = 10 + v % 6, months = 9 + v % 5, value = months * first + increase * months * (months - 1) / 2;
    return numeric(`A savings challenge starts with a ${m(first)} deposit in month 1. Each later monthly deposit is exactly ${m(increase)} larger than the previous one. With no interest, what total is deposited over ${months} months?`, value,
      [first * months, (first + increase * (months - 1)) * months, first * months + increase * months, months * first + increase * months * (months + 1) / 2],
      `Deposits form an arithmetic sequence from ${m(first)} to ${m(first + increase * (months - 1))}. Total = ${months} × [${m(first)} + ${m(first + increase * (months - 1))}] ÷ 2 = ${m(value)}.`);
  }),
  family(2, 'inflating-savings-goal', 'hard', v => {
    const price = 6000 + 400 * v, inflation = 3 + v % 4, years = 2 + v % 4, saved = 1200 + 100 * v, value = (price * (1 + inflation / 100) ** years - saved) / (years * 12);
    return numeric(`A purchase costs ${m(price)} today and its price is assumed to rise ${p(inflation)} each year, compounded annually for ${years} years. You already have ${m(saved)} in a no-interest account. What equal month-end deposit over ${years * 12} months funds the projected purchase price?`, value,
      [(price - saved) / (years * 12), (price * (1 + inflation / 100 * years) - saved) / (years * 12), price * (1 + inflation / 100) ** years / (years * 12), (price * (1 + inflation / 100) ** years - saved) / years],
      `Projected price = ${m(price)} × (1 + ${inflation}/100)^${years} = ${m(price * (1 + inflation / 100) ** years)}. Monthly saving = (projected price − ${m(saved)}) ÷ ${years * 12} = ${m(value)}.`);
  }),
  family(2, 'fund-withdrawal-recovery', 'medium', v => {
    const opening = 2300 + 140 * v, deposit = 160 + 9 * v, before = 3 + v % 4, repair = 700 + 35 * v, after = 5 + v % 3, value = opening + deposit * (before + after) - repair;
    return numeric(`A no-interest reserve starts at ${m(opening)}. You make ${before} monthly deposits of ${m(deposit)}, then withdraw ${m(repair)} for a repair, and then make ${after} more deposits of the same size. With no fees or other transactions, what is the final reserve balance?`, value,
      [opening + deposit * before - repair, opening + deposit * (before + after), opening + deposit * after - repair, opening + deposit * (before + after) + repair],
      `There are ${before + after} deposits in total. Balance = ${m(opening)} + ${before + after} × ${m(deposit)} − ${m(repair)} = ${m(value)}.`);
  }),

  // Bank account costs: 9 families.
  family(3, 'maintenance-fee-waiver-count', 'easy', v => {
    const fee = 8 + v * 0.5, waived = 3 + v % 7, value = (12 - waived) * fee;
    return numeric(`A checking account charges ${m(fee)} per month unless its stated waiver condition is met. You meet the condition in exactly ${waived} of 12 months. With no other fees, what is the total annual account cost?`, value,
      [fee * 12, fee * waived, fee, fee * (12 + waived)],
      `The fee applies in 12 − ${waived} = ${12 - waived} months. Annual cost = ${12 - waived} × ${m(fee)} = ${m(value)}.`);
  }),
  family(3, 'atm-two-fees-reimbursement', 'medium', v => {
    const visits = 3 + v % 6, bank = 2 + v * 0.1, operator = 3.5 + v * 0.05, cap = 5 + v * 0.2, value = visits * (bank + operator) - Math.min(visits * operator, cap);
    return numeric(`You make ${visits} out-of-network ATM withdrawals. Each incurs a ${m(bank)} bank fee and a ${m(operator)} ATM-owner fee. Your bank reimburses ATM-owner fees only, up to ${m(cap)} in total this month. What is your net ATM cost?`, value,
      [visits * (bank + operator), visits * bank, visits * (bank + operator) - cap * visits, visits * operator - cap],
      `Gross fees = ${visits} × (${m(bank)} + ${m(operator)}) = ${m(visits * (bank + operator))}. Reimbursement is min(${m(visits * operator)}, ${m(cap)}) = ${m(Math.min(visits * operator, cap))}. Net cost is ${m(value)}.`);
  }),
  family(3, 'tiered-bank-interest', 'medium', v => {
    const threshold = 2000 + 100 * v, balance = threshold + 3000 + 150 * v, low = 1.5, high = 3 + (v % 4) * 0.25, fee = 24 + v, value = threshold * low / 100 + (balance - threshold) * high / 100 - fee;
    return numeric(`An account holds a constant ${m(balance)} for one year. It pays ${p(low)} simple annual interest on the first ${m(threshold)} and ${p(high, 2)} only on the excess, then charges a ${m(fee)} year-end fee. What is net interest income after the fee?`, value,
      [balance * high / 100 - fee, balance * low / 100 - fee, threshold * low / 100 + (balance - threshold) * high / 100, threshold * low / 100 + balance * high / 100 - fee],
      `Net interest = ${m(threshold)} × ${p(low)} + (${m(balance)} − ${m(threshold)}) × ${p(high, 2)} − ${m(fee)} = ${m(value)}.`);
  }),
  family(3, 'capped-overdraft-fees', 'medium', v => {
    const each = 22 + v, dailyCap = 2 + v % 2, dayOne = dailyCap + 1, dayTwo = 1, daily = 4 + v * 0.25, days = 2 + v % 4, value = (Math.min(dayOne, dailyCap) + Math.min(dayTwo, dailyCap)) * each + days * daily;
    return numeric(`Under a hypothetical account agreement, each eligible paid overdraft costs ${m(each)}, capped at ${dailyCap} such fees per day. There are ${dayOne} eligible overdrafts on one day and ${dayTwo} on another. Separately, a ${m(daily)} extended-overdraft charge applies on each of ${days} days. What are total fees?`, value,
      [(dayOne + dayTwo) * each + days * daily, dailyCap * each + days * daily, (dailyCap + dayTwo) * each, (dailyCap + dayTwo) * each + daily],
      `Transaction fees = [min(${dayOne}, ${dailyCap}) + min(${dayTwo}, ${dailyCap})] × ${m(each)} = ${m((dailyCap + dayTwo) * each)}. Add ${days} × ${m(daily)} = ${m(days * daily)} in extended charges, for ${m(value)}.`);
  }),
  family(3, 'bank-reconciliation-available-cash', 'medium', v => {
    const statement = 1800 + 95 * v, deposit = 450 + 20 * v, check = 310 + 12 * v, debit = 85 + 4 * v, fee = 7 + v * 0.25, value = statement + deposit - check - debit - fee;
    return numeric(`A statement shows ${m(statement)}. A later ${m(deposit)} deposit has cleared and is available. A ${m(check)} written check and ${m(debit)} card purchase remain outstanding, and a new ${m(fee)} fee must be included. None of these four items is in the statement balance. What reconciled balance should you use after reserving for the outstanding payments?`, value,
      [statement + deposit, statement + deposit - check - debit, statement - check - debit - fee, statement + deposit + check + debit - fee],
      `Reconciled balance = ${m(statement)} + ${m(deposit)} − ${m(check)} − ${m(debit)} − ${m(fee)} = ${m(value)}.`);
  }),
  family(3, 'cd-early-withdrawal-net', 'medium', v => {
    const principal = 4000 + 300 * v, rate = round(3.2 + (v % 5) * 0.2, 1), held = 7 + v % 5, penalty = 3, value = principal + principal * rate / 100 * (held - penalty) / 12;
    return numeric(`A certificate holds ${m(principal)} at ${p(rate, 1)} annual simple interest. You close it after exactly ${held}/12 years. The stated early-withdrawal penalty equals ${penalty}/12 years of simple interest on the original principal. With no other charges, how much cash do you receive?`, value,
      [principal + principal * rate / 100 * held / 12, principal - principal * rate / 100 * penalty / 12, principal + principal * rate / 100 * (held + penalty) / 12, principal * rate / 100 * (held - penalty) / 12],
      `Interest earned = ${m(principal)} × ${rate}/100 × ${held}/12 = ${m(principal * rate / 100 * held / 12)}. Penalty = ${m(principal * rate / 100 * penalty / 12)}. Cash received = principal + interest − penalty = ${m(value)}.`);
  }),
  family(3, 'interest-fee-break-even-balance', 'hard', v => {
    const fee = 48 + 6 * v, rateA = 1.2 + (v % 3) * 0.2, spread = 1.5 + (v % 4) * 0.25, rateB = rateA + spread, value = fee / (spread / 100);
    return numeric(`Account A has no annual fee and pays ${p(rateA, 2)} simple annual interest. Account B charges ${m(fee)} once at year-end and pays ${p(rateB, 2)} simple annual interest. Both keep the same constant balance during the year. At what balance is annual interest minus fees equal?`, value,
      [fee / (rateB / 100), fee / (rateA / 100), fee / spread, fee * 12 / (spread / 100)],
      `B earns an extra ${p(spread, 2)} of the balance. Set balance × ${spread}/100 = ${m(fee)}. Break-even balance = ${m(fee)} ÷ (${spread}/100) = ${m(value)}.`);
  }),
  family(3, 'transfer-fee-cap-comparison', 'medium', v => {
    const transfer = 1800 + 170 * v, rate = 1 + (v % 4) * 0.1, cap = 22 + v * 0.5, wire = 38 + v, percentFee = Math.min(transfer * rate / 100, cap), value = wire - percentFee;
    return numeric(`For a ${m(transfer)} transfer, one provider charges ${p(rate, 1)} of the amount, capped at ${m(cap)}. A bank wire costs a flat ${m(wire)}. Assume equal delivery speed and no other charges. How much less does the capped-fee provider cost?`, value,
      [wire - transfer * rate / 100, wire + percentFee, percentFee, wire - rate],
      `Provider fee = min(${m(transfer)} × ${p(rate, 1)}, ${m(cap)}) = ${m(percentFee)}. Savings versus the wire = ${m(wire)} − ${m(percentFee)} = ${m(value)}.`);
  }),
  family(3, 'net-bank-return-percentage', 'medium', v => {
    const balance = 2500 + 200 * v, apy = 3.5 + (v % 5) * 0.25, fee = 3 + v * 0.1, interest = balance * apy / 100, value = (interest - 12 * fee) / balance * 100;
    return numeric(`A ${m(balance)} deposit earns a stated ${p(apy, 2)} APY for exactly one year. No money moves during the year; all 12 monthly maintenance fees of ${m(fee)} are deducted together at year-end after interest is credited. What is the net annual return as a percentage of the initial deposit?`, value,
      [apy, apy - fee / balance * 100, (interest + 12 * fee) / balance * 100, (interest - 12 * fee) / (balance + interest) * 100],
      `One-year interest = ${m(balance)} × ${p(apy, 2)} = ${m(interest)}. Net gain = ${m(interest)} − 12 × ${m(fee)} = ${m(interest - 12 * fee)}. Net return = net gain ÷ ${m(balance)} × 100 = ${p(value, 2)}.`, percent);
  }),

  // Credit card math: 9 families.
  family(4, 'card-monthly-interest-model', 'easy', v => {
    const balance = 900 + 110 * v, apr = 15 + v % 10, value = balance * apr / 1200;
    return numeric(`For this simplified card exercise, monthly interest equals an unchanged ${m(balance)} balance times a ${p(apr)} APR divided by 12. There is no grace period, compounding within the month, or fee. What is one month's interest?`, value,
      [balance * apr / 100, balance * apr / 36500, balance * (1 + apr / 1200), balance * apr / 120],
      `Monthly interest = ${m(balance)} × (${apr}/100 ÷ 12) = ${m(value)}.`);
  }),
  family(4, 'card-average-daily-balance', 'medium', v => {
    const first = 1200 + 75 * v, payment = 250 + 10 * v, days = 8 + v % 12, second = first - payment, apr = 18 + v % 7, average = (first * days + second * (30 - days)) / 30, value = average * apr / 100 / 365 * 30;
    return numeric(`In a 30-day card cycle, the balance is ${m(first)} for ${days} days and, after a payment, ${m(second)} for the remaining ${30 - days} days. Interest equals average daily balance × (${p(apr)} APR ÷ 365) × 30. There is no grace period or daily compounding. What is the cycle's interest?`, value,
      [first * apr / 100 / 365 * 30, second * apr / 100 / 365 * 30, (first + second) / 2 * apr / 100 / 365 * 30, average * apr / 100 / 12],
      `Average daily balance = (${m(first)} × ${days} + ${m(second)} × ${30 - days}) ÷ 30 = ${m(average)}. Interest = that unrounded average × ${apr}/100 ÷ 365 × 30 = ${m(value)}.`);
  }),
  family(4, 'card-minimum-payment-rule', 'medium', v => {
    const principal = 600 + 135 * v, interest = 14 + 2 * v, fee = 5 + v % 4, floor = 30 + v % 3, share = 1.5, computed = principal * share / 100 + interest + fee, value = Math.max(floor, computed);
    return numeric(`A hypothetical card's minimum is the larger of ${m(floor)} or the sum of ${p(share)} of principal, this month's interest, and fees. Principal is ${m(principal)}, interest is ${m(interest)}, and fees are ${m(fee)}; the total owed exceeds either minimum. What payment is required?`, value,
      [principal * share / 100, principal * share / 100 + interest, (principal + interest + fee) * share / 100, floor + computed, Math.min(floor, computed)],
      `Formula amount = ${m(principal)} × ${p(share)} + ${m(interest)} + ${m(fee)} = ${m(computed)}. The larger of ${m(floor)} and ${m(computed)} is ${m(value)}.`);
  }),
  family(4, 'zero-apr-transfer-payoff', 'medium', v => {
    const balance = 2100 + 150 * v, feeRate = 3 + v % 3, months = 12 + v % 7, value = balance * (1 + feeRate / 100) / months;
    return numeric(`You transfer ${m(balance)} to a card with 0% interest for exactly ${months} payment periods. A ${p(feeRate)} transfer fee is added immediately to the balance. With no new purchases or other fees, what equal payment each period clears the full balance within the promotion?`, value,
      [balance / months, balance * feeRate / 100 / months, balance * (1 + feeRate / 100), balance / months + balance * feeRate / 100],
      `Fee = ${m(balance)} × ${p(feeRate)} = ${m(balance * feeRate / 100)}. Divide the total ${m(balance * (1 + feeRate / 100))} by ${months} periods: ${m(value)} per payment. Carry full precision before rounding.`);
  }),
  family(4, 'two-card-balance-interest', 'medium', v => {
    const purchase = 1400 + 80 * v, cash = 300 + 25 * v, purchaseAPR = 17 + v % 5, cashAPR = 26 + v % 4, value = purchase * purchaseAPR / 1200 + cash * cashAPR / 1200;
    return numeric(`A card carries ${m(purchase)} in purchases at ${p(purchaseAPR)} APR and ${m(cash)} in cash advances at ${p(cashAPR)} APR. Assume both balances remain constant for one month, each uses APR/12, and there are no fees, grace periods, or intra-month compounding. What is total interest?`, value,
      [(purchase + cash) * purchaseAPR / 1200, (purchase + cash) * cashAPR / 1200, purchase * purchaseAPR / 1200, purchase * purchaseAPR / 100 + cash * cashAPR / 100],
      `Purchase interest = ${m(purchase)} × ${purchaseAPR}/1200 = ${m(purchase * purchaseAPR / 1200)}. Advance interest = ${m(cash)} × ${cashAPR}/1200 = ${m(cash * cashAPR / 1200)}. Add unrounded amounts for ${m(value)}.`);
  }),
  family(4, 'tiered-rewards-after-annual-fee', 'medium', v => {
    const bonusSpend = 2500 + 160 * v, otherSpend = 5800 + 240 * v, bonusRate = 3 + v % 3, baseRate = 1, annualFee = 75 + 5 * v, value = bonusSpend * bonusRate / 100 + otherSpend * baseRate / 100 - annualFee;
    return numeric(`A card earns ${p(bonusRate)} cash back on ${m(bonusSpend)} of eligible category spending and ${p(baseRate)} on ${m(otherSpend)} of other spending during a year. It charges a ${m(annualFee)} annual fee. All balances are paid without interest; there are no caps or other rewards. What is net cash-back value after the fee?`, value,
      [(bonusSpend + otherSpend) * bonusRate / 100 - annualFee, bonusSpend * bonusRate / 100 + otherSpend * baseRate / 100, (bonusSpend + otherSpend) * baseRate / 100 - annualFee, bonusSpend * bonusRate / 100 - annualFee],
      `Rewards = ${m(bonusSpend)} × ${p(bonusRate)} + ${m(otherSpend)} × ${p(baseRate)} = ${m(bonusSpend * bonusRate / 100 + otherSpend * baseRate / 100)}. Subtract ${m(annualFee)} to get ${m(value)}.`);
  }),
  family(4, 'card-statement-balance-rollforward', 'easy', v => {
    const start = 780 + 60 * v, purchases = 340 + 17 * v, payment = 250 + 15 * v, credit = 45 + 2 * v, interest = 18 + v, value = start + purchases - payment - credit + interest;
    return numeric(`A card begins the cycle owing ${m(start)}. It adds ${m(purchases)} in purchases and ${m(interest)} in interest, receives a ${m(payment)} payment, and posts a ${m(credit)} merchant refund. No other items apply. What is the ending balance owed?`, value,
      [start + purchases - payment + credit + interest, start + purchases - payment - credit, start + purchases + payment - credit + interest, start - payment - credit + interest],
      `Ending debt = ${m(start)} + ${m(purchases)} + ${m(interest)} − ${m(payment)} − ${m(credit)} = ${m(value)}. Both the payment and refund reduce debt.`);
  }),
  family(4, 'utilization-target-payment', 'medium', v => {
    const limit = 4000 + 250 * v, balance = 2100 + 170 * v, target = 20 + v % 6, value = balance - limit * target / 100;
    return numeric(`A card has a ${m(limit)} limit and a ${m(balance)} reported balance. You choose a utilization target of exactly ${p(target)} for that card. With no new charges, fees, or interest, how much must you pay to reach that target?`, value,
      [balance * target / 100, limit * target / 100, balance * (1 - target / 100), limit - balance],
      `Target balance = ${m(limit)} × ${p(target)} = ${m(limit * target / 100)}. Required payment = ${m(balance)} − ${m(limit * target / 100)} = ${m(value)}. This is a chosen target, not a promised credit-score result.`);
  }),
  family(4, 'balance-transfer-interest-savings', 'medium', v => {
    const balance = 2800 + 180 * v, apr = 19 + v % 7, months = 5 + v % 5, fee = 3 + v % 2, interest = balance * apr / 100 * months / 12, transferFee = balance * fee / 100, value = interest - transferFee;
    return numeric(`Compare keeping a constant ${m(balance)} principal at ${p(apr)} APR for ${months} months with transferring it to a 0% offer covering those months. In this simplified comparison, current-card interest is paid separately each month so principal stays fixed; the transfer fee of ${p(fee)} is paid upfront. There are no other costs. How much financing cost does transferring save?`, value,
      [interest, transferFee, interest + transferFee, balance * (apr - fee) / 100 * months / 12],
      `Current-card cost = ${m(balance)} × ${apr}/100 × ${months}/12 = ${m(interest)}. Transfer cost = ${m(balance)} × ${p(fee)} = ${m(transferFee)}. Savings = ${m(interest)} − ${m(transferFee)} = ${m(value)}.`);
  }),

  // Loan payments: 8 families.
  family(5, 'amortizing-loan-payment', 'hard', v => {
    const principal = 6500 + 550 * v, annualRate = 6 + (v % 6) * 0.5, months = 24 + 6 * (v % 5), r = annualRate / 1200, value = amort(principal, r, months);
    return numeric(`A fixed-rate loan advances ${m(principal)}, charges a nominal ${p(annualRate, 1)} annual interest rate, and has ${months} equal month-end payments. Interest is charged monthly on the unpaid balance at annual rate/12, with no fees. Using payment = P × r / [1 − (1 + r)^(−n)], what is the monthly payment? Keep full precision until the final answer.`, value,
      [principal / months, principal * (1 + annualRate / 100 * months / 12) / months, principal * r, amort(principal, annualRate / 100, months)],
      `Use P = ${m(principal)}, r = ${annualRate}/1200, and n = ${months}. Payment = ${m(principal)} × (${annualRate}/1200) ÷ [1 − (1 + ${annualRate}/1200)^(−${months})] = ${m(value)}.`);
  }),
  family(5, 'first-payment-principal', 'medium', v => {
    const balance = 9200 + 600 * v, annualRate = 6 + (v % 5) * 0.6, payment = 420 + 25 * v, interest = balance * annualRate / 1200, value = payment - interest;
    return numeric(`A loan starts the month with ${m(balance)} of principal and a nominal ${p(annualRate, 1)} annual interest rate. One month's interest is charged at annual rate/12. A ${m(payment)} payment first covers all that interest, and the rest reduces principal. With no fees, how much principal does this payment repay?`, value,
      [payment, interest, payment + interest, balance - payment],
      `Interest = ${m(balance)} × ${annualRate}/1200 = ${m(interest)}. Principal repaid = ${m(payment)} − ${m(interest)} = ${m(value)}.`);
  }),
  family(5, 'scheduled-loan-total-financing-cost', 'medium', v => {
    const principal = 8000 + 500 * v, months = 36 + 12 * (v % 3), interestTotal = 1100 + 95 * v, payment = (principal + interestTotal) / months, fee = 180 + 12 * v;
    // Choose a cent-exact payment and recompute the cost from that displayed schedule.
    const actualPayment = round(payment), actualValue = months * actualPayment - principal + fee;
    return numeric(`You receive a ${m(principal)} loan and make exactly ${months} payments of ${m(actualPayment)}, with no separate final adjustment. A ${m(fee)} origination fee is paid in cash at the start, outside those payments. What is total financing cost above the amount borrowed?`, actualValue,
      [months * actualPayment - principal, months * actualPayment + fee, months * actualPayment - principal - fee, actualPayment + fee],
      `All payments total ${months} × ${m(actualPayment)} = ${m(months * actualPayment)}. Financing cost = payments − principal + upfront fee = ${m(months * actualPayment)} − ${m(principal)} + ${m(fee)} = ${m(actualValue)}.`);
  }),
  family(5, 'simple-loan-lump-sum-payoff', 'easy', v => {
    const principal = 1400 + 125 * v, annualRate = 7 + v % 5, months = 5 + v % 10, value = principal * (1 + annualRate / 100 * months / 12);
    return numeric(`Borrow ${m(principal)} for exactly ${months}/12 years at ${p(annualRate)} annual simple interest. No installments, compounding, or fees apply; principal and interest are paid together at maturity. What is the maturity payment?`, value,
      [principal * annualRate / 100 * months / 12, principal * (1 + annualRate / 100), principal * (1 + annualRate / 100 * months), principal / months + principal * annualRate / 100],
      `Interest = ${m(principal)} × ${annualRate}/100 × ${months}/12 = ${m(principal * annualRate / 100 * months / 12)}. Add the principal to obtain ${m(value)}.`);
  }),
  family(5, 'loan-net-proceeds-gross-up', 'medium', v => {
    const need = 3500 + 230 * v, feeRate = 2 + (v % 5) * 0.5, value = need / (1 - feeRate / 100);
    return numeric(`You need exactly ${m(need)} in usable loan proceeds. A lender withholds a ${p(feeRate, 1)} origination fee from the face amount when funding the loan. With no other deductions, what face amount is required?`, value,
      [need * (1 + feeRate / 100), need * (1 - feeRate / 100), need / (feeRate / 100), need],
      `Usable proceeds = face amount × (1 − ${feeRate}/100). Solve face amount = ${m(need)} ÷ (1 − ${feeRate}/100) = ${m(value)}. This face amount, before fees, is the principal owed.`);
  }),
  family(5, 'debt-payment-capacity', 'medium', v => {
    const gross = 4200 + 170 * v, cap = 32 + v % 5, housing = 900 + 25 * v, other = 160 + 7 * v, value = gross * cap / 100 - housing - other;
    return numeric(`For this exercise, a lender caps total monthly debt payments at ${p(cap)} of ${m(gross)} gross monthly income. Existing housing debt payments are ${m(housing)} and other debt payments are ${m(other)}. Under this hypothetical rule, what is the largest additional monthly loan payment allowed?`, value,
      [gross * cap / 100, gross * cap / 100 - other, gross * cap / 100 - housing, (gross - housing - other) * cap / 100],
      `Total allowed = ${m(gross)} × ${p(cap)} = ${m(gross * cap / 100)}. Subtract existing debt payments: ${m(gross * cap / 100)} − ${m(housing)} − ${m(other)} = ${m(value)}.`);
  }),
  family(5, 'refinance-fee-recovery-months', 'medium', v => {
    const oldPayment = 420 + 16 * v, saving = 43 + 3 * v, newPayment = oldPayment - saving, cost = 650 + 55 * v, value = Math.ceil(cost / saving);
    return numeric(`Refinancing changes a payment from ${m(oldPayment)} to ${m(newPayment)} each month and costs ${m(cost)} upfront. Both loans have the same remaining term, which is long enough to recover the cost. Ignoring discounting and any other differences, after how many whole monthly savings is cumulative payment savings at least the upfront cost?`, value,
      [Math.floor(cost / saving), Math.ceil(cost / newPayment), Math.ceil(cost / oldPayment), Math.ceil(cost / saving) + 1],
      `Monthly savings = ${m(oldPayment)} − ${m(newPayment)} = ${m(saving)}. ${m(cost)} ÷ ${m(saving)} = ${n(cost / saving, 3)} months, so recovery needs ${value} whole months.`, count('months'));
  }),
  family(5, 'extra-principal-next-interest', 'medium', v => {
    const balance = 7400 + 420 * v, extra = 600 + 55 * v, annualRate = 7.2 + (v % 5) * 0.6, value = extra * annualRate / 1200;
    return numeric(`Immediately before a new monthly interest period, a loan has ${m(balance)} principal. You make an extra ${m(extra)} payment applied entirely to principal, with no penalty. The nominal annual interest rate is ${p(annualRate, 1)}, and next month's interest uses annual rate/12 on opening principal. How much lower is that next month's interest? Use unrounded interest amounts and round only the final difference.`, value,
      [extra * annualRate / 100, (balance - extra) * annualRate / 1200, balance * annualRate / 1200, extra / 12],
      `Only the extra principal changes interest. The unrounded difference is [${m(balance)} − (${m(balance)} − ${m(extra)})] × ${annualRate}/1200 = ${m(extra)} × ${annualRate}/1200, which rounds to ${m(value)} saved next month.`);
  }),

  // Housing costs: 8 families.
  family(6, 'full-monthly-home-payment', 'easy', v => {
    const pi = 1350 + 65 * v, tax = 3300 + 180 * v, insurance = 1080 + 48 * v, hoa = 70 + 5 * v, value = pi + (tax + insurance) / 12 + hoa;
    return numeric(`Mortgage principal and interest cost ${m(pi)} per month. Property taxes are ${m(tax)} per year, homeowners insurance is ${m(insurance)} per year, and HOA dues are ${m(hoa)} per month. Assume taxes and insurance are budgeted evenly over 12 months, with no other housing charges. What is the full monthly amount?`, value,
      [pi + tax + insurance + hoa, pi + tax / 12 + insurance / 12, (pi + tax + insurance + hoa) / 12, pi + (tax + insurance) / 12 + hoa / 12],
      `Monthly housing = ${m(pi)} + ${m(tax)} ÷ 12 + ${m(insurance)} ÷ 12 + ${m(hoa)} = ${m(value)}.`);
  }),
  family(6, 'home-cash-to-close-credit', 'medium', v => {
    const price = 240000 + 12000 * v, down = 10 + v % 6, closing = 5200 + 270 * v, prepaid = 1600 + 80 * v, earnest = 3000 + 150 * v, credit = 1200 + 60 * v, value = price * down / 100 + closing + prepaid - earnest - credit;
    return numeric(`A home costs ${m(price)} with a ${p(down)} down payment. Additional closing charges are ${m(closing)} and prepaid costs are ${m(prepaid)}. An already-paid ${m(earnest)} earnest deposit is credited toward the down payment, and a ${m(credit)} seller credit covers part of closing charges. What additional cash is due at closing?`, value,
      [price * down / 100 + closing + prepaid, price * down / 100 + closing + prepaid - credit, price * down / 100 + closing + prepaid + earnest - credit, price * down / 100 + closing - earnest - credit],
      `Cash due = ${m(price)} × ${p(down)} + ${m(closing)} + ${m(prepaid)} − ${m(earnest)} − ${m(credit)} = ${m(value)}.`);
  }),
  family(6, 'home-price-cash-constraint', 'hard', v => {
    const cash = 34000 + 2200 * v, reserve = 6000 + 350 * v, down = 10 + v % 5, closing = 3, value = (cash - reserve) / ((down + closing) / 100);
    return numeric(`You have ${m(cash)} of cash and will keep ${m(reserve)} untouched. A purchase requires ${p(down)} of its price as down payment plus ${p(closing)} of its price for all closing costs. Ignore loan-income constraints and other costs. What is the highest home price these cash funds support?`, value,
      [cash / ((down + closing) / 100), (cash - reserve) / (down / 100), (cash - reserve) / (closing / 100), (cash - reserve) * (1 - (down + closing) / 100)],
      `Available purchase cash = ${m(cash)} − ${m(reserve)} = ${m(cash - reserve)}. Required cash is ${down + closing}% of price. Maximum price = ${m(cash - reserve)} ÷ (${down + closing}/100) = ${m(value)}.`);
  }),
  family(6, 'rent-concession-effective-monthly', 'medium', v => {
    const rent = 1300 + 60 * v, months = 12 + v % 4, free = 1 + v % 2, fee = 180 + 12 * v, value = (rent * (months - free) + fee) / months;
    return numeric(`A ${months}-month lease lists rent of ${m(rent)} per month but waives rent for exactly ${free} full months. A nonrefundable ${m(fee)} lease fee is paid once. There are no other costs. What is the effective average monthly cost over the whole lease?`, value,
      [rent * (months - free) / months, rent + fee / months, (rent * months + fee) / (months - free), (rent * (months - free) + fee) / (months - free)],
      `Total cost = ${months - free} paid months × ${m(rent)} + ${m(fee)} = ${m(rent * (months - free) + fee)}. Divide by all ${months} lease months: ${m(value)}.`);
  }),
  family(6, 'roommate-prorated-utilities', 'medium', v => {
    const bill = 180 + 12 * v, daysA = 30, daysB = 30, daysC = 10 + v, value = bill * daysC / (daysA + daysB + daysC);
    return numeric(`Three roommates split a ${m(bill)} utility bill by person-days of occupancy. Two each lived there all 30 days, while the third lived there for ${daysC} days. Under this agreed rule, what is the third roommate's share?`, value,
      [bill / 3, bill * daysC / 30, bill / 3 * daysC / 30, bill * 30 / (60 + daysC)],
      `Total person-days = 30 + 30 + ${daysC} = ${60 + daysC}. The third roommate pays ${m(bill)} × ${daysC} ÷ ${60 + daysC} = ${m(value)}.`);
  }),
  family(6, 'home-loan-to-value', 'easy', v => {
    const appraisal = 260000 + 15000 * v, balance = 190000 + 9500 * v, purchase = appraisal - 12000 - 400 * v, value = balance / appraisal * 100;
    return numeric(`A property is currently appraised at ${m(appraisal)}, was purchased for ${m(purchase)}, and has a ${m(balance)} mortgage balance. Define current loan-to-value as mortgage balance divided by current appraised value. What is current LTV?`, value,
      [balance / purchase * 100, (appraisal - balance) / appraisal * 100, appraisal / balance * 100, balance / appraisal],
      `Current LTV uses the current appraisal: ${m(balance)} ÷ ${m(appraisal)} × 100 = ${p(value, 2)}. The old purchase price is not the denominator.`, percent);
  }),
  family(6, 'home-sale-net-cash', 'medium', v => {
    const sale = 285000 + 13000 * v, commission = 5 + (v % 3) * 0.5, costs = 3500 + 190 * v, mortgage = 175000 + 6500 * v, value = sale * (1 - commission / 100) - costs - mortgage;
    return numeric(`A home sells for ${m(sale)}. Selling commission is ${p(commission, 1)} of sale price, other seller costs are ${m(costs)}, and the mortgage payoff is ${m(mortgage)}. Ignoring taxes and any other adjustments, how much cash does the seller receive?`, value,
      [sale - mortgage, sale * (1 - commission / 100) - mortgage, sale - costs - mortgage, (sale - mortgage) * (1 - commission / 100) - costs],
      `Net cash = ${m(sale)} − ${m(sale * commission / 100)} commission − ${m(costs)} other costs − ${m(mortgage)} payoff = ${m(value)}.`);
  }),
  family(6, 'cash-out-refinance-proceeds', 'medium', v => {
    const valueHome = 310000 + 18000 * v, ltv = 75 + v % 6, oldLoan = 170000 + 8000 * v, costs = 4200 + 250 * v, newLoan = valueHome * ltv / 100, value = newLoan - oldLoan - costs;
    return numeric(`For this hypothetical cash-out refinance, the new loan is limited to ${p(ltv)} of a ${m(valueHome)} appraisal. The existing loan payoff is ${m(oldLoan)}, and ${m(costs)} in closing costs are deducted from new loan proceeds. Assuming you borrow the maximum and face no other constraints, what cash reaches you?`, value,
      [newLoan - oldLoan, newLoan, valueHome - oldLoan - costs, (valueHome - oldLoan) * ltv / 100 - costs],
      `Maximum new loan = ${m(valueHome)} × ${p(ltv)} = ${m(newLoan)}. Cash out = ${m(newLoan)} − ${m(oldLoan)} − ${m(costs)} = ${m(value)}.`);
  }),

  // Car ownership: 8 families.
  family(7, 'car-fuel-monthly-cost', 'easy', v => {
    const miles = 800 + 55 * v, mpg = 26 + v % 8, gas = 3.2 + v * 0.05, value = miles / mpg * gas;
    return numeric(`You drive ${n(miles)} miles in a month. The car averages ${mpg} miles per gallon and gasoline costs a fixed ${m(gas)} per gallon. What is the month's fuel cost?`, value,
      [miles * gas, miles / mpg, miles * mpg / gas, miles / (mpg * gas)],
      `Gallons needed = ${n(miles)} ÷ ${mpg} = ${n(miles / mpg, 4)}. Fuel cost = ${n(miles)} ÷ ${mpg} × ${m(gas)} = ${m(value)}.`);
  }),
  family(7, 'auto-financed-amount-trade-equity', 'medium', v => {
    const price = 24500 + 900 * v, taxRate = 5 + (v % 4) * 0.5, fees = 650 + 25 * v, down = 2200 + 80 * v, trade = 7800 + 200 * v, owed = 4300 + 100 * v, value = price * (1 + taxRate / 100) + fees - down - (trade - owed);
    return numeric(`A car's price is ${m(price)}. In this hypothetical jurisdiction, purchase tax is ${p(taxRate, 1)} of the full price with no trade-in tax reduction. Fees are ${m(fees)} and cash down is ${m(down)}. The trade-in is worth ${m(trade)} but has ${m(owed)} still owed; all net trade equity is applied to the purchase. What amount is financed?`, value,
      [price * (1 + taxRate / 100) + fees - down - trade, price * (1 + taxRate / 100) + fees - down, (price - trade) * (1 + taxRate / 100) + fees - down + owed, price + fees - down - trade + owed],
      `Tax = ${m(price * taxRate / 100)}. Net trade equity = ${m(trade)} − ${m(owed)} = ${m(trade - owed)}. Amount financed = ${m(price)} + tax + ${m(fees)} − ${m(down)} − ${m(trade - owed)} = ${m(value)}.`);
  }),
  family(7, 'lease-full-period-monthly-cost', 'medium', v => {
    const payment = 270 + 12 * v, months = 24 + 12 * (v % 2), upfront = 1800 + 100 * v, disposal = 300 + 15 * v, value = (payment * months + upfront + disposal) / months;
    return numeric(`A car lease requires ${months} monthly payments of ${m(payment)}, plus ${m(upfront)} upfront in addition to every monthly payment, and a ${m(disposal)} return fee. Assume no mileage, damage, tax, or other charges and no purchase at the end. What is average monthly lease cash cost including these fees?`, value,
      [payment, payment + upfront / months, payment + disposal / months, (payment * (months - 1) + upfront + disposal) / months],
      `Total cash cost = ${months} × ${m(payment)} + ${m(upfront)} + ${m(disposal)} = ${m(payment * months + upfront + disposal)}. Divide by ${months}: ${m(value)} per month.`);
  }),
  family(7, 'car-depreciation-resale-value', 'medium', v => {
    const purchase = 23000 + 1200 * v, firstRate = 18 + v % 4, laterRate = 8 + v % 3, years = 3 + v % 4, value = purchase * (1 - firstRate / 100) * (1 - laterRate / 100) ** (years - 1);
    return numeric(`A car costs ${m(purchase)}. For planning, assume its value falls ${p(firstRate)} during year 1 and then ${p(laterRate)} of the remaining value in each later year. What is estimated value after ${years} years? Ignore selling fees and round only the final answer.`, value,
      [purchase * (1 - (firstRate + laterRate * (years - 1)) / 100), purchase * (1 - laterRate / 100) ** years, purchase * (1 - firstRate / 100) * (1 - laterRate / 100) ** years, purchase * (1 - firstRate / 100)],
      `Year-1 value = ${m(purchase)} × (1 − ${firstRate}/100). Apply ${years - 1} later reductions: ${m(purchase)} × (1 − ${firstRate}/100) × (1 − ${laterRate}/100)^${years - 1} = ${m(value)}.`);
  }),
  family(7, 'car-operating-cost-per-mile', 'medium', v => {
    const miles = 9000 + 600 * v, fuel = 1100 + 65 * v, insurance = 1050 + 45 * v, maintenance = 540 + 35 * v, registration = 140 + 8 * v, total = fuel + insurance + maintenance + registration, value = total / miles;
    return numeric(`During a year you drive ${n(miles)} miles and spend ${m(fuel)} on fuel, ${m(insurance)} on insurance, ${m(maintenance)} on maintenance, and ${m(registration)} on registration. Define operating cost here as these four items only, excluding depreciation and financing. What is operating cost per mile?`, value,
      [fuel / miles, (fuel + insurance + maintenance) / miles, total / 12, total / miles * 100],
      `Total included cost = ${m(fuel)} + ${m(insurance)} + ${m(maintenance)} + ${m(registration)} = ${m(total)}. Divide by ${n(miles)} miles: ${m(value)} per mile.`, { suffix: 'per mile' });
  }),
  family(7, 'ev-versus-gas-energy-savings', 'medium', v => {
    const miles = 10000 + 700 * v, mpg = 28 + v % 5, gas = 3.3 + 0.04 * v, kwhPerMile = 0.28 + (v % 4) * 0.01, electricity = 0.13 + (v % 5) * 0.01, gasCost = miles / mpg * gas, evCost = miles * kwhPerMile * electricity, value = gasCost - evCost;
    return numeric(`Compare energy costs for ${n(miles)} annual miles. A gasoline car gets ${mpg} mpg with fuel at ${m(gas)}/gallon. An EV uses ${n(kwhPerMile, 2)} kWh per mile with electricity at ${m(electricity)}/kWh; that usage already includes charging losses. Ignoring all other costs, how much lower is the EV's annual energy cost?`, value,
      [gasCost, evCost, gasCost + evCost, miles / mpg * gas - miles / kwhPerMile * electricity],
      `Gas cost = ${n(miles)} ÷ ${mpg} × ${m(gas)} = ${m(gasCost)}. EV cost = ${n(miles)} × ${n(kwhPerMile, 2)} × ${m(electricity)} = ${m(evCost)}. Subtract unrounded costs to obtain ${m(value)} saved.`);
  }),
  family(7, 'car-maintenance-distance-reserve', 'medium', v => {
    const miles = 12000 + 900 * v, oilCost = 65 + 3 * v, oilInterval = 5000, tireCost = 600 + 25 * v, tireInterval = 40000, value = miles * (oilCost / oilInterval + tireCost / tireInterval) / 12;
    return numeric(`You expect ${n(miles)} miles per year. Oil service costs ${m(oilCost)} per ${n(oilInterval)} miles and tires cost ${m(tireCost)} per ${n(tireInterval)} miles. For a long-run reserve, prorate both costs continuously by mileage rather than counting whole service visits. What equal monthly amount should be reserved?`, value,
      [miles * (oilCost / oilInterval + tireCost / tireInterval), (oilCost + tireCost) / 12, miles * oilCost / oilInterval / 12, miles * tireCost / tireInterval / 12],
      `Annual reserve = ${n(miles)} × (${m(oilCost)}/${n(oilInterval)} + ${m(tireCost)}/${n(tireInterval)}) = ${m(value * 12)}. Divide by 12 to get ${m(value)} per month.`);
  }),
  family(7, 'cash-car-ownership-cost', 'medium', v => {
    const buy = 12500 + 750 * v, resale = 6500 + 300 * v, annualUpkeep = 1900 + 80 * v, years = 3 + v % 4, saleFee = 150 + 10 * v, value = (buy - resale + saleFee + years * annualUpkeep) / years;
    return numeric(`You buy a car for ${m(buy)} cash, keep it ${years} years, and sell it for ${m(resale)} while paying a ${m(saleFee)} selling fee. All operating costs total ${m(annualUpkeep)} each year. Ignoring interest, taxes beyond included costs, and opportunity cost, what is average annual ownership cost?`, value,
      [buy / years + annualUpkeep, (buy - resale) / years, (buy - resale - saleFee) / years + annualUpkeep, buy - resale + saleFee + annualUpkeep],
      `Net capital cost = ${m(buy)} − ${m(resale)} + ${m(saleFee)} = ${m(buy - resale + saleFee)}. Annual ownership cost = net capital cost ÷ ${years} + ${m(annualUpkeep)} = ${m(value)}.`);
  }),

  // College costs: 8 families.
  family(8, 'college-net-price-not-loans', 'easy', v => {
    const tuition = 18000 + 900 * v, living = 10800 + 500 * v, books = 900 + 40 * v, grant = 6500 + 280 * v, scholarship = 1800 + 100 * v, loan = 4000 + 150 * v, value = tuition + living + books - grant - scholarship;
    return numeric(`One college year costs ${m(tuition)} in tuition and fees, ${m(living)} for living costs, and ${m(books)} for books. An aid offer includes a ${m(grant)} grant, ${m(scholarship)} scholarship, and ${m(loan)} repayable loan. What is net price, defined as total cost minus grants and scholarships only?`, value,
      [tuition + living + books - grant - scholarship - loan, tuition - grant - scholarship, tuition + living + books - grant, tuition + living + books],
      `Total cost = ${m(tuition + living + books)}. Net price = ${m(tuition + living + books)} − ${m(grant)} − ${m(scholarship)} = ${m(value)}. The loan is financing, so it does not reduce net price.`);
  }),
  family(8, 'college-tuition-flat-band', 'medium', v => {
    const credits = 19 + v % 4, band = 4800 + 170 * v, excessRate = 320 + 12 * v, fee = 280 + 15 * v, value = band + (credits - 18) * excessRate + fee;
    return numeric(`A college charges a flat ${m(band)} for 12 through 18 credits in a semester, plus ${m(excessRate)} for each credit above 18. A mandatory semester fee of ${m(fee)} is additional. What is the bill for ${credits} credits?`, value,
      [credits * excessRate + fee, band + fee, band + (credits - 12) * excessRate + fee, band + (credits - 18) * excessRate],
      `Credits above the flat-rate band = ${credits} − 18 = ${credits - 18}. Bill = ${m(band)} + ${credits - 18} × ${m(excessRate)} + ${m(fee)} = ${m(value)}.`);
  }),
  family(8, 'college-funding-gap', 'medium', v => {
    const cost = 25500 + 1000 * v, grants = 7500 + 300 * v, savings = 4200 + 130 * v, familyHelp = 2800 + 110 * v, jobNet = 3200 + 140 * v, value = cost - grants - savings - familyHelp - jobNet;
    return numeric(`Your complete annual college budget is ${m(cost)}. You can use ${m(grants)} in grants, ${m(savings)} of savings, ${m(familyHelp)} of family support, and ${m(jobNet)} in net job earnings available for these costs. No source overlaps another. What amount remains to finance?`, value,
      [cost - grants, cost - grants - savings - familyHelp, cost - grants - savings - familyHelp + jobNet, cost - savings - familyHelp - jobNet],
      `Funding gap = ${m(cost)} − ${m(grants)} − ${m(savings)} − ${m(familyHelp)} − ${m(jobNet)} = ${m(value)}.`);
  }),
  family(8, 'college-weekly-work-hours', 'medium', v => {
    const gap = 2600 + 160 * v, wage = 14 + v * 0.4, deduction = 10 + v % 4, weeks = 28 + v % 5, value = gap / (wage * (1 - deduction / 100) * weeks);
    return numeric(`You want campus-job earnings to cover a ${m(gap)} annual college gap over ${weeks} working weeks. The job pays ${m(wage)} per hour, with hypothetical deductions equal to ${p(deduction)} of gross earnings. Assuming all take-home pay goes toward the gap, what average hours per week are required? Fractional hours are allowed.`, value,
      [gap / (wage * weeks), gap / (wage * (1 - deduction / 100)), gap / (wage * deduction / 100 * weeks), gap / (wage * (1 + deduction / 100) * weeks)],
      `Take-home hourly pay = ${m(wage)} × (1 − ${deduction}/100) = ${m(wage * (1 - deduction / 100))}. Required hours per week = ${m(gap)} ÷ [${m(wage)} × (1 − ${deduction}/100) × ${weeks}] = ${n(value, 2)}.`, { style: 'number', digits: 2, suffix: 'hours per week' });
  }),
  family(8, 'four-year-rising-tuition-total', 'hard', v => {
    const first = 14000 + 850 * v, growth = 3 + (v % 5) * 0.5, r = 1 + growth / 100, value = first * (1 + r + r ** 2 + r ** 3);
    return numeric(`First-year tuition is ${m(first)} and rises ${p(growth, 1)} at the start of each following academic year. What is total tuition for four consecutive years, before aid and excluding all other expenses? Keep full precision until the final answer.`, value,
      [first * 4, first * r ** 3 * 4, first * (1 + growth / 100 * 3) * 4, first * (r + r ** 2 + r ** 3 + r ** 4)],
      `Four years cost ${m(first)} × [1 + ${n(r, 3)} + ${n(r, 3)}² + ${n(r, 3)}³] = ${m(value)}. The first year has no increase; the later years include one, two, and three increases.`);
  }),
  family(8, 'student-loan-in-school-interest', 'medium', v => {
    const principal = 4500 + 300 * v, annualRate = 4.5 + (v % 5) * 0.4, years = 2 + v % 3, value = principal * annualRate / 100 * years;
    return numeric(`A hypothetical unsubsidized education loan disburses ${m(principal)} at the start of school. It accrues ${p(annualRate, 1)} annual simple interest for exactly ${years} years; no payments, additional disbursements, fees, or capitalization occur during that period. How much unpaid interest accrues, excluding principal?`, value,
      [principal * ((1 + annualRate / 100) ** years - 1), principal * (1 + annualRate / 100 * years), principal * annualRate / 100, principal * annualRate / 100 * years / 12],
      `Unpaid simple interest = ${m(principal)} × ${annualRate}/100 × ${years} = ${m(value)}. Without capitalization, interest is not added to principal during the period.`);
  }),
  family(8, 'tuition-installment-after-deposit', 'medium', v => {
    const bill = 7200 + 430 * v, deposit = 900 + 70 * v, fee = 45 + 3 * v, installments = 4 + v % 3, value = (bill - deposit + fee) / installments;
    return numeric(`After aid, a semester bill is ${m(bill)}. A ${m(deposit)} payment has already reduced it. An interest-free plan adds a one-time ${m(fee)} enrollment fee to the remaining bill and divides that total into ${installments} equal payments. What is each payment?`, value,
      [(bill + fee) / installments, (bill - deposit) / installments, (bill - deposit) / installments + fee, (bill - deposit - fee) / installments],
      `Amount to split = ${m(bill)} − ${m(deposit)} + ${m(fee)} = ${m(bill - deposit + fee)}. Divide by ${installments}: ${m(value)} per payment. Carry full precision before rounding.`);
  }),
  family(8, 'textbook-resale-versus-rental', 'medium', v => {
    const buy = 210 + 11 * v, resale = 95 + 6 * v, saleFee = 8 + v * 0.5, rental = 150 + 8 * v, shipping = 12 + v * 0.25, buyNet = buy - resale + saleFee, rentNet = rental + shipping, value = rentNet - buyNet;
    return numeric(`A textbook bundle can be bought for ${m(buy)} and later sold for ${m(resale)}, with a ${m(saleFee)} resale fee. Renting the same bundle costs ${m(rental)} plus ${m(shipping)} total shipping. Assume the quoted resale amount is realized and there are no other costs. How much does buying and reselling save compared with renting?`, value,
      [rentNet - (buy - resale), rental - buyNet, rentNet - buy, rentNet + buyNet],
      `Net buying cost = ${m(buy)} − ${m(resale)} + ${m(saleFee)} = ${m(buyNet)}. Rental cost = ${m(rental)} + ${m(shipping)} = ${m(rentNet)}. Savings = ${m(rentNet)} − ${m(buyNet)} = ${m(value)}.`);
  }),

  // Insurance costs: 8 families.
  family(9, 'insurance-deductible-claim-payment', 'easy', v => {
    const damage = 2800 + 240 * v, deductible = 500 + 50 * v, limit = 2000 + 175 * v + 400 * (v % 3), value = Math.min(Math.max(damage - deductible, 0), limit);
    return numeric(`An insured loss is ${m(damage)}. This hypothetical policy subtracts a ${m(deductible)} deductible from the covered loss, then caps the insurer's payment at ${m(limit)} per claim. There are no exclusions or other adjustments. What does the insurer pay?`, value,
      [damage - deductible, Math.min(damage, limit) - deductible, damage, limit + deductible, deductible],
      `After the deductible, the covered amount is ${m(damage)} − ${m(deductible)} = ${m(damage - deductible)}. Insurer payment = min(${m(damage - deductible)}, ${m(limit)}) = ${m(value)}.`);
  }),
  family(9, 'health-deductible-coinsurance', 'medium', v => {
    const allowed = 4200 + 350 * v, annualDeductible = 1400 + 50 * v, met = 500 + 20 * v, share = 15 + v % 4 * 5, remaining = annualDeductible - met, value = remaining + (allowed - remaining) * share / 100;
    return numeric(`A covered in-network procedure has an allowed cost of ${m(allowed)}. Your annual deductible is ${m(annualDeductible)}, of which ${m(met)} has already been met. You pay the remaining deductible, then ${p(share)} coinsurance on the rest of this bill. No copay or out-of-pocket cap applies to this calculation. What do you pay for this procedure?`, value,
      [allowed * share / 100, annualDeductible + (allowed - annualDeductible) * share / 100, remaining + allowed * share / 100, remaining + (allowed - remaining) * (1 - share / 100)],
      `Remaining deductible = ${m(annualDeductible)} − ${m(met)} = ${m(remaining)}. Your procedure cost = ${m(remaining)} + (${m(allowed)} − ${m(remaining)}) × ${p(share)} = ${m(value)}.`);
  }),
  family(9, 'health-annual-out-of-pocket-cap', 'medium', v => {
    const premium = 230 + 14 * v, previous = 1700 + 100 * v, cap = 4200 + 180 * v, next = 3500 + 170 * v, value = premium * 12 + Math.min(previous + next, cap);
    return numeric(`A health policy costs ${m(premium)} per month in premiums. You have already paid ${m(previous)} toward a ${m(cap)} annual in-network out-of-pocket maximum. Later covered care would normally require another ${m(next)} in deductible and coinsurance payments before applying the cap. Assume all these payments count toward the cap, premiums do not, and there are no other costs. What is your full-year total including premiums?`, value,
      [premium * 12 + previous + next, Math.min(premium * 12 + previous + next, cap), premium * 12 + Math.min(next, cap), cap],
      `Covered cost sharing is capped at min(${m(previous)} + ${m(next)}, ${m(cap)}) = ${m(Math.min(previous + next, cap))}. Annual premiums = 12 × ${m(premium)} = ${m(premium * 12)}. Total = ${m(value)}.`);
  }),
  family(9, 'insurance-plan-total-cost-comparison', 'medium', v => {
    const premiumA = 180 + 9 * v, premiumB = 140 + 7 * v, deductibleA = 500 + 25 * v, deductibleB = 1200 + 50 * v, loss = 4000 + 200 * v, totalA = premiumA * 12 + deductibleA, totalB = premiumB * 12 + deductibleB, value = totalB - totalA;
    return numeric(`Plan A costs ${m(premiumA)} per month with a ${m(deductibleA)} deductible. Plan B costs ${m(premiumB)} per month with a ${m(deductibleB)} deductible. Exactly one covered ${m(loss)} loss occurs this year; each plan pays all covered costs above its deductible with no limit. How much lower is total premiums plus claim spending under Plan A?`, value,
      [deductibleB - deductibleA, (premiumA - premiumB) * 12, totalA - totalB, totalA, totalB],
      `A costs 12 × ${m(premiumA)} + ${m(deductibleA)} = ${m(totalA)}. B costs 12 × ${m(premiumB)} + ${m(deductibleB)} = ${m(totalB)}. A saves ${m(totalB)} − ${m(totalA)} = ${m(value)}.`);
  }),
  family(9, 'insurance-sequential-discounts', 'medium', v => {
    const premium = 1100 + 65 * v, bundle = 8 + v % 5, safe = 5 + v % 4, fee = 35 + 2 * v, value = premium * (1 - bundle / 100) * (1 - safe / 100) + fee;
    return numeric(`An annual insurance base premium is ${m(premium)}. Apply a ${p(bundle)} bundle discount first, then a ${p(safe)} safe-driver discount to the already discounted premium. A ${m(fee)} policy fee is added afterward and receives neither discount. What is the final annual bill?`, value,
      [premium * (1 - (bundle + safe) / 100) + fee, (premium + fee) * (1 - bundle / 100) * (1 - safe / 100), premium * (1 - bundle / 100) + fee, premium * (1 - bundle / 100) * (1 - safe / 100)],
      `Bill = ${m(premium)} × (1 − ${bundle}/100) × (1 − ${safe}/100) + ${m(fee)} = ${m(value)}. Each percentage applies to the specified premium base.`);
  }),
  family(9, 'insurance-expected-annual-cash-cost', 'hard', v => {
    const premium = 420 + 22 * v, probability = 8 + v % 9, deductible = 650 + 35 * v, damage = 4200 + 250 * v, value = premium + probability / 100 * deductible;
    return numeric(`A simplified one-year model has a ${p(probability)} probability of exactly one covered ${m(damage)} loss and otherwise no loss. Insurance costs ${m(premium)} for the year and makes you pay a ${m(deductible)} deductible per loss, covering the rest with no limit. What is expected annual cash cost to you, including the certain premium?`, value,
      [(premium + deductible) * probability / 100, premium + deductible, premium + probability / 100 * damage, probability / 100 * deductible],
      `The premium is paid in every outcome. Expected deductible cost = ${p(probability)} × ${m(deductible)} = ${m(probability / 100 * deductible)}. Expected total = ${m(premium)} + ${m(probability / 100 * deductible)} = ${m(value)}. This is a probability-weighted average, not a guaranteed bill.`);
  }),
  family(9, 'life-coverage-capital-needs', 'medium', v => {
    const annualNeed = 32000 + 1700 * v, years = 7 + v % 4, debt = 85000 + 5000 * v, oneTime = 18000 + 900 * v, assets = 48000 + 2200 * v, existing = 75000 + 3000 * v, value = annualNeed * years + debt + oneTime - assets - existing;
    return numeric(`For a simplified life-insurance needs exercise, a family wants ${m(annualNeed)} per year for ${years} years, plus ${m(debt)} to clear debt and ${m(oneTime)} for one-time expenses. It can use ${m(assets)} in assets and ${m(existing)} of existing death benefits. Ignoring investment returns, inflation, and taxes, what additional coverage fills the calculated gap?`, value,
      [annualNeed * years + debt + oneTime, annualNeed * years + debt + oneTime - assets, annualNeed * years + debt + oneTime - existing, annualNeed + debt + oneTime - assets - existing],
      `Required resources = ${m(annualNeed)} × ${years} + ${m(debt)} + ${m(oneTime)} = ${m(annualNeed * years + debt + oneTime)}. Additional coverage = ${m(annualNeed * years + debt + oneTime)} − ${m(assets)} − ${m(existing)} = ${m(value)} under these assumptions.`);
  }),
  family(9, 'disability-benefit-cap-wait', 'medium', v => {
    const monthlyPay = 4800 + 260 * v, replacement = 60 + v % 3 * 5, cap = 3000 + 80 * v, disabilityMonths = 7 + v % 4, wait = 2, monthlyBenefit = Math.min(monthlyPay * replacement / 100, cap), value = monthlyBenefit * (disabilityMonths - wait);
    return numeric(`A hypothetical disability policy pays ${p(replacement)} of prior ${m(monthlyPay)} monthly pay, capped at ${m(cap)} per month. A disability lasts exactly ${disabilityMonths} whole months. The first ${wait} whole months are an unpaid waiting period; benefits then run through the remaining months. Ignore taxes and offsets. What total benefit is paid?`, value,
      [monthlyBenefit * disabilityMonths, monthlyPay * replacement / 100 * (disabilityMonths - wait), cap * disabilityMonths, monthlyBenefit, monthlyPay * (disabilityMonths - wait)],
      `Monthly benefit = min(${m(monthlyPay)} × ${p(replacement)}, ${m(cap)}) = ${m(monthlyBenefit)}. Paid months = ${disabilityMonths} − ${wait} = ${disabilityMonths - wait}. Total benefit = ${m(monthlyBenefit)} × ${disabilityMonths - wait} = ${m(value)}.`);
  }),
];
