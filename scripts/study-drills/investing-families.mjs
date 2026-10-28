import { numeric, money, num, pct } from './helpers.mjs';

// Each family isolates a different decision, cash-flow convention, or calculation.
// All rates, fees, returns, policy terms, and tax assumptions are hypothetical.
const f = (id, topic, difficulty, build) => ({ id: `invest-${id}`, category: 'Personal Finance', topic, difficulty, build });
const percent = { style: 'percent', digits: 2 };
const integer = suffix => ({ style: 'number', digits: 0, suffix });
const decimal = suffix => ({ style: 'number', digits: 2, suffix });

export const families = [
  // Shopping Price Drills — 9 families.
  f('sale-price-sales-tax', 'Shopping Price Drills', 'easy', v => {
    const price = 80 + 7 * v, discount = 10 + (v % 5) * 5, tax = 5 + (v % 4) * .5;
    const value = price * (1 - discount / 100) * (1 + tax / 100);
    return numeric(`An item lists for ${money(price)} and is discounted ${pct(discount)}. A ${pct(tax)} sales tax applies only to the discounted price. With no other charges, what is the checkout total?`, value,
      [price * (1 - discount / 100) + price * tax / 100, price * (1 - discount / 100), price * (1 + tax / 100)],
      `Discounted price = ${money(price)} × (1 − ${discount}/100) = ${money(price * (1 - discount / 100))}. Checkout total = ${money(price * (1 - discount / 100))} × (1 + ${tax}/100) = ${money(value)}.`);
  }),
  f('successive-discount-equivalent', 'Shopping Price Drills', 'medium', v => {
    const a = 12 + v, b = 5 + v % 8, value = (1 - (1 - a / 100) * (1 - b / 100)) * 100;
    return numeric(`A shop takes ${pct(a)} off a price, then takes another ${pct(b)} off the reduced price. Ignoring tax, what single discount percentage produces the same final price?`, value,
      [a + b, a - b, a * b / 100, 100 - value],
      `The fraction paid is (1 − ${a}/100) × (1 − ${b}/100). The equivalent discount is [1 − (1 − ${a}/100) × (1 − ${b}/100)] × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('coupon-tax-order', 'Shopping Price Drills', 'medium', v => {
    const price = 110 + 9 * v, coupon = 12 + v, tax = 6 + v % 4, before = (price - coupon) * (1 + tax / 100), after = price * (1 + tax / 100) - coupon, value = after - before;
    return numeric(`For a ${money(price)} purchase with ${pct(tax)} tax, Store A subtracts a ${money(coupon)} coupon before calculating tax. Store B calculates tax on the full price and then subtracts the same coupon. How much less is Store A's total?`, value,
      [coupon, price * tax / 100, coupon * (1 + tax / 100), coupon - value],
      `Store A = (${money(price)} − ${money(coupon)}) × ${num(1 + tax / 100, 2)} = ${money(before)}. Store B = ${money(price)} × ${num(1 + tax / 100, 2)} − ${money(coupon)} = ${money(after)}. Difference = ${money(after)} − ${money(before)} = ${money(value)}.`);
  }),
  f('unit-price-weight-conversion', 'Shopping Price Drills', 'easy', v => {
    const ounces = 18 + 2 * v, price = 3.45 + .31 * v, value = price / ounces * 16;
    return numeric(`A food package contains ${ounces} ounces and costs ${money(price)}. There are 16 ounces in one pound. Before tax, what is its price per pound?`, value,
      [price / ounces, price * ounces / 16, price / 16, price * 16],
      `The package weighs ${ounces}/16 pounds. Price per pound = ${money(price)} ÷ (${ounces}/16) = ${money(value)}.`, { suffix: 'per pound' });
  }),
  f('reverse-taxed-sale-price', 'Shopping Price Drills', 'hard', v => {
    const original = 120 + 20 * v, discount = 20, tax = 5, paid = original * .8 * 1.05;
    return numeric(`After a ${pct(discount)} discount and then ${pct(tax)} tax on the sale price, a shopper pays ${money(paid)}. There are no other charges. What was the original pretax price?`, original,
      [paid * 1.2 / 1.05, paid / .8, paid / 1.05, paid / 1.25],
      `Payment = original price × 0.80 × 1.05. Original price = ${money(paid)} ÷ (0.80 × 1.05) = ${money(original)}.`);
  }),
  f('bundle-free-items-effective-cost', 'Shopping Price Drills', 'easy', v => {
    const price = 4.25 + .35 * v, buy = 2 + v % 3, free = 1 + v % 2, value = buy * price / (buy + free);
    return numeric(`A promotion gives ${free} free identical items for every ${buy} items purchased at ${money(price)} each. A shopper obtains exactly one complete promotional bundle. Ignoring tax, what is the average cost per item received?`, value,
      [price, buy * price / free, price / (buy + free), price * (buy + free) / buy],
      `Pay for ${buy} items: ${buy} × ${money(price)} = ${money(buy * price)}. Receive ${buy + free} items, so cost per item = ${money(buy * price)} ÷ ${buy + free} = ${money(value)}.`, { suffix: 'per item' });
  }),
  f('cashback-eligible-spending-cap', 'Shopping Price Drills', 'medium', v => {
    const eligible = 640 + 45 * v, excluded = 90 + 7 * v, rate = 4 + v % 3, cap = 24 + v % 5, value = Math.min(eligible * rate / 100, cap);
    return numeric(`A shopping promotion pays ${pct(rate)} cashback on eligible merchandise, capped at ${money(cap)} per order. An order contains ${money(eligible)} of eligible merchandise and ${money(excluded)} of excluded gift cards. Ignoring taxes, how much cashback is earned?`, value,
      [eligible * rate / 100, (eligible + excluded) * rate / 100, cap * rate / 100, excluded * rate / 100],
      `Uncapped eligible cashback = ${money(eligible)} × ${rate}/100 = ${money(eligible * rate / 100)}. Excluded gift cards earn nothing. Apply the cap: min(${money(eligible * rate / 100)}, ${money(cap)}) = ${money(value)}.`);
  }),
  f('delivery-threshold-total', 'Shopping Price Drills', 'medium', v => {
    const subtotal = 42 + 3 * v, coupon = 8 + v % 4, threshold = 60 + v % 5, shipping = 6.5 + .25 * v, tax = 7, discounted = subtotal - coupon, delivery = discounted >= threshold ? 0 : shipping, value = discounted * 1.07 + delivery;
    return numeric(`An online basket is ${money(subtotal)} before a ${money(coupon)} coupon. Shipping costs ${money(shipping)} unless the after-coupon merchandise subtotal is at least ${money(threshold)}, when shipping is free. Tax is ${pct(tax)} on after-coupon merchandise only; shipping is not taxed. What is the total?`, value,
      [discounted * 1.07 + shipping, discounted * 1.07, (discounted + shipping) * 1.07, subtotal * 1.07 + delivery, subtotal - coupon + delivery],
      `After-coupon merchandise = ${money(subtotal)} − ${money(coupon)} = ${money(discounted)}. This ${discounted >= threshold ? 'meets' : 'does not meet'} the ${money(threshold)} shipping threshold, so shipping is ${money(delivery)}. Total = ${money(discounted)} × 1.07 + ${money(delivery)} = ${money(value)}.`);
  }),
  f('membership-purchases-break-even', 'Shopping Price Drills', 'medium', v => {
    const fee = 35 + 3 * v, retail = 19.5 + .5 * v, member = retail - (2.25 + .1 * v), savings = retail - member, value = Math.ceil(fee / savings);
    return numeric(`A buying club costs ${money(fee)} for the year. One regularly purchased product costs ${money(retail)} outside the club and ${money(member)} inside it. Ignoring tax and all other benefits, what is the minimum whole number of purchases needed for product savings to cover the membership fee?`, value,
      [Math.floor(fee / savings), Math.ceil(fee / member), Math.ceil(fee / retail), Math.ceil(fee / savings) + 1],
      `Savings per purchase = ${money(retail)} − ${money(member)} = ${money(savings)}. Required purchases = ceiling(${money(fee)} ÷ ${money(savings)}) = ${value}.`, integer('purchases'));
  }),

  // Subscription Value Drills — 9 families.
  f('annual-prepayment-savings', 'Subscription Value Drills', 'easy', v => {
    const monthly = 11 + v, annual = monthly * 9 + 7, value = monthly * 12 - annual;
    return numeric(`A service offers identical access for ${money(monthly)} each month or ${money(annual)} paid upfront for 12 months. Assume all 12 months are used, with no interest, fees, or tax. How much does the annual option save?`, value,
      [monthly * 12, annual - monthly, monthly * 12 - annual - monthly, monthly * 12 - annual + monthly],
      `Twelve monthly payments cost 12 × ${money(monthly)} = ${money(monthly * 12)}. Savings = ${money(monthly * 12)} − ${money(annual)} = ${money(value)}.`);
  }),
  f('introductory-rate-year-cost', 'Subscription Value Drills', 'easy', v => {
    const intro = 3 + v % 4, promo = 5 + v, regular = promo + 12 + v % 3, value = intro * promo + (12 - intro) * regular;
    return numeric(`A subscription bills ${money(promo)} per month for its first ${intro} months, then ${money(regular)} per month. It remains active for exactly 12 billed months. With no fees or tax, what is the first-year cost?`, value,
      [12 * promo, 12 * regular, intro * promo + 12 * regular, (12 - intro) * promo + intro * regular],
      `Promotional cost = ${intro} × ${money(promo)}. Regular-rate cost = ${12 - intro} × ${money(regular)}. Total = ${money(intro * promo)} + ${money((12 - intro) * regular)} = ${money(value)}.`);
  }),
  f('included-usage-overage', 'Subscription Value Drills', 'easy', v => {
    const base = 15 + v, included = 80 + 5 * v, used = included + 23 + 3 * v, overage = .18 + .01 * (v % 4), value = base + (used - included) * overage;
    return numeric(`A monthly plan costs ${money(base)} and includes ${included} usage units. Each additional unit costs ${money(overage)}. This month ${used} units are used. With no tax or other fees, what is the bill?`, value,
      [base + used * overage, (used - included) * overage, base + included * overage, base],
      `Extra units = ${used} − ${included} = ${used - included}. Bill = ${money(base)} + ${used - included} × ${money(overage)} = ${money(value)}.`);
  }),
  f('actual-use-cost', 'Subscription Value Drills', 'easy', v => {
    const monthly = 27 + 2 * v, months = 4 + v % 5, visits = 17 + 3 * v, value = monthly * months / visits;
    return numeric(`A membership costs ${money(monthly)} per month and is kept for ${months} full months. The member makes ${visits} total visits during that period. There are no other charges. What is the average membership cost per actual visit?`, value,
      [monthly / visits, monthly * months, monthly / months, monthly * visits / months],
      `Total paid = ${money(monthly)} × ${months} = ${money(monthly * months)}. Cost per visit = ${money(monthly * months)} ÷ ${visits} = ${money(value)}.`, { suffix: 'per visit' });
  }),
  f('unlimited-plan-strict-break-even', 'Subscription Value Drills', 'medium', v => {
    const fixed = 42 + 4 * v, use = 7 + v % 6, value = Math.floor(fixed / use) + 1;
    return numeric(`A service costs either ${money(fixed)} per month for unlimited sessions or ${money(use)} per session with no monthly fee. Ignoring tax, what is the minimum whole number of sessions in a month for unlimited service to be strictly cheaper?`, value,
      [Math.floor(fixed / use), Math.floor(fixed / use) + 2, Math.ceil(fixed / (use * 2)), fixed - use],
      `Unlimited is strictly cheaper when ${money(fixed)} < sessions × ${money(use)}. Sessions must exceed ${num(fixed / use, 4)}, so the minimum whole count is floor(${fixed}/${use}) + 1 = ${value}.`, integer('sessions'));
  }),
  f('prorated-cancellation-refund', 'Subscription Value Drills', 'medium', v => {
    const annual = 180 + 13 * v, used = 41 + 9 * v, days = 365, unused = days - used, value = annual * unused / days;
    return numeric(`A prepaid 365-day subscription costs ${money(annual)}. Its stated cancellation policy refunds the exact daily price for every unused day, without a cancellation fee. Cancellation takes effect after ${used} paid days have been used. What is the refund?`, value,
      [annual * used / days, annual / 12, annual - used, annual],
      `Unused days = 365 − ${used} = ${unused}. Daily-price refund = ${money(annual)} × ${unused}/365 = ${money(value)}.`);
  }),
  f('minimum-seat-billing', 'Subscription Value Drills', 'easy', v => {
    const actual = 3 + v, minimum = 8 + v % 4, perSeat = 7 + v % 5, platform = 12 + v, billed = Math.max(actual, minimum), value = platform + perSeat * billed;
    return numeric(`A software plan charges a ${money(platform)} monthly platform fee plus ${money(perSeat)} per active user, but bills for at least ${minimum} users. There are ${actual} active users this month. With no tax or other charges, what is the monthly bill?`, value,
      [platform + actual * perSeat, platform + minimum * perSeat, billed * perSeat, platform + (actual + minimum) * perSeat, platform + perSeat],
      `Billed users = max(${actual}, ${minimum}) = ${billed}. Monthly bill = ${money(platform)} + ${billed} × ${money(perSeat)} = ${money(value)}.`);
  }),
  f('pause-versus-reactivation', 'Subscription Value Drills', 'medium', v => {
    const months = 3 + v % 6, pause = 4 + .5 * v, activation = 30 + 2 * v, value = activation - pause * months;
    return numeric(`During a ${months}-month absence, a subscription can be paused for ${money(pause)} per month or canceled for free and later restarted for a ${money(activation)} reactivation fee. Both options resume at the same price afterward. What is cancellation-and-restart cost minus pause cost for the absence? A negative result means cancellation is cheaper.`, value,
      [activation, pause * months, activation + pause * months, pause * months - activation],
      `Pause cost = ${months} × ${money(pause)} = ${money(pause * months)}. Cancel-and-restart cost = ${money(activation)}. Difference = ${money(activation)} − ${money(pause * months)} = ${money(value)}.`);
  }),
  f('compounded-renewal-total', 'Subscription Value Drills', 'medium', v => {
    const first = 90 + 7 * v, increase = 4 + v % 7, r = increase / 100, value = first * (1 + (1 + r) + (1 + r) ** 2);
    return numeric(`An annual subscription costs ${money(first)} in year 1. The contract raises the previous year's annual price by ${pct(increase)} at each renewal. Assume exactly two renewals, no rounding until the end, no tax, and no other fees. What is the total paid for years 1 through 3?`, value,
      [first * 3, first * (3 + 2 * r), first * (1 + r) ** 2 * 3, first * (1 + r) ** 2],
      `Year 2 = ${money(first)} × ${num(1 + r, 2)}; year 3 = ${money(first)} × ${num(1 + r, 2)}². Three-year total = ${money(first)} × [1 + ${num(1 + r, 2)} + ${num(1 + r, 2)}²] = ${money(value)}.`);
  }),

  // Small Business Cash Drills — 9 families.
  f('contribution-per-unit', 'Small Business Cash Drills', 'easy', v => {
    const price = 45 + 2 * v, material = 12 + .7 * v, labor = 8 + .3 * v, units = 90 + 5 * v, value = (price - material - labor) * units;
    return numeric(`A small business sells ${units} units for ${money(price)} each. Each unit incurs ${money(material)} in materials and ${money(labor)} in variable labor. Before fixed costs and tax, what total contribution is available to cover fixed costs and profit?`, value,
      [price * units, (price - material) * units, (price - labor) * units, price - material - labor],
      `Contribution per unit = ${money(price)} − ${money(material)} − ${money(labor)} = ${money(price - material - labor)}. Total contribution = ${money(price - material - labor)} × ${units} = ${money(value)}.`);
  }),
  f('fixed-cost-break-even-units', 'Small Business Cash Drills', 'medium', v => {
    const fixed = 1500 + 137 * v, price = 32 + v, variable = 17 + .4 * v, value = Math.ceil(fixed / (price - variable));
    return numeric(`Monthly fixed costs are ${money(fixed)}. A business receives ${money(price)} per unit sold and pays ${money(variable)} in variable cost per unit. Ignoring tax, what minimum whole number of units covers all monthly costs?`, value,
      [Math.floor(fixed / (price - variable)), Math.ceil(fixed / price), Math.ceil(fixed / variable), Math.ceil((fixed + variable) / price), Math.ceil((fixed + variable) / (price - variable))],
      `Each unit contributes ${money(price)} − ${money(variable)} = ${money(price - variable)}. Break-even units = ceiling(${money(fixed)} ÷ ${money(price - variable)}) = ${value}.`, integer('units'));
  }),
  f('cash-versus-invoiced-sales', 'Small Business Cash Drills', 'medium', v => {
    const start = 4200 + 150 * v, cashSales = 3100 + 170 * v, invoices = 1900 + 110 * v, collections = 1400 + 75 * v, payments = 4900 + 180 * v, value = start + cashSales + collections - payments;
    return numeric(`A business starts the month with ${money(start)} cash. It makes ${money(cashSales)} of cash sales, issues ${money(invoices)} of new invoices that remain unpaid, collects ${money(collections)} on older invoices, and pays ${money(payments)} in cash expenses. With no other cash flows, what is ending cash?`, value,
      [start + cashSales + invoices + collections - payments, start + cashSales - payments, start + cashSales + invoices - payments, cashSales + collections - payments],
      `Unpaid new invoices do not add cash. Ending cash = ${money(start)} + ${money(cashSales)} + ${money(collections)} − ${money(payments)} = ${money(value)}.`);
  }),
  f('runway-full-months', 'Small Business Cash Drills', 'medium', v => {
    const reserve = 18000 + 850 * v, spending = 4800 + 120 * v, receipts = 2200 + 55 * v, value = Math.floor(reserve / (spending - receipts));
    return numeric(`A business has ${money(reserve)} in usable cash. At each month-end it receives ${money(receipts)} and pays ${money(spending)}. Assume both amounts stay fixed, cash is sufficient within each month, no borrowing, and no other cash flows. How many complete months can it fund before it cannot cover the next month's net cash use?`, value,
      [Math.ceil(reserve / (spending - receipts)), Math.floor(reserve / spending), Math.floor(reserve / receipts), Math.floor(reserve / (spending + receipts))],
      `Monthly net cash use = ${money(spending)} − ${money(receipts)} = ${money(spending - receipts)}. Complete funded months = floor(${money(reserve)} ÷ ${money(spending - receipts)}) = ${value}.`, integer('months'));
  }),
  f('early-payment-discount-annualized', 'Small Business Cash Drills', 'hard', v => {
    const discount = 1 + .1 * v, early = 10 + v % 4, due = 40 + v, gap = due - early, value = discount / (100 - discount) * 365 / gap * 100;
    return numeric(`A supplier offers a ${pct(discount)} discount if an invoice is paid on day ${early}; otherwise the full amount is due on day ${due}. Using a 365-day year and simple annualization, what is the annualized cost of giving up the discount, measured against the discounted amount that could have been paid? Ignore compounding.`, value,
      [discount * 365 / gap, discount / (100 - discount) * 100, discount * 365 / due, (100 - discount) / discount],
      `The extra payment relative to the discounted payment is ${num(discount, 1)}/(100 − ${num(discount, 1)}). Credit lasts ${due} − ${early} = ${gap} days. Simple annualized cost = [${num(discount, 1)}/${num(100 - discount, 1)}] × (365/${gap}) × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('cash-conversion-cycle', 'Small Business Cash Drills', 'medium', v => {
    const inventory = 35 + v, receivable = 19 + v % 8, payable = 14 + v % 6, value = inventory + receivable - payable;
    return numeric(`A business holds inventory an average of ${inventory} days before sale, collects customers ${receivable} days after sale, and pays suppliers ${payable} days after inventory purchase. Under these steady timing assumptions, how many days elapse between paying suppliers and collecting customers?`, value,
      [inventory + receivable + payable, inventory + receivable, inventory - receivable + payable, receivable - payable],
      `Collection occurs ${inventory} + ${receivable} = ${inventory + receivable} days after purchase. Supplier payment occurs on day ${payable}. Cash conversion cycle = ${inventory} + ${receivable} − ${payable} = ${value} days.`, integer('days'));
  }),
  f('gross-margin-versus-markup', 'Small Business Cash Drills', 'medium', v => {
    const cost = 24 + 2 * v, markup = 25 + v, price = cost * (1 + markup / 100), value = (price - cost) / price * 100;
    return numeric(`A product costs a business ${money(cost)} and is priced by adding a ${pct(markup)} markup on cost. Ignoring other costs and tax, what is its gross profit margin as a percentage of the selling price?`, value,
      [markup, 100 - markup, markup / (100 - markup) * 100, (100 + markup) / markup],
      `Selling price = ${money(cost)} × (1 + ${markup}/100) = ${money(price)}. Margin = (${money(price)} − ${money(cost)}) ÷ ${money(price)} × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('merchant-processing-net-deposit', 'Small Business Cash Drills', 'medium', v => {
    const transactions = 52 + 7 * v, ticket = 21 + v, rate = 2.5 + .1 * (v % 4), per = .2 + .05 * (v % 3), sales = transactions * ticket, value = sales * (1 - rate / 100) - transactions * per;
    return numeric(`A merchant processes ${transactions} card sales of ${money(ticket)} each. The processor deducts ${pct(rate)} of sales plus ${money(per)} for each transaction. No refunds, tax withholding, or other fees apply. What net amount is deposited?`, value,
      [sales, sales * (1 - rate / 100) - per, sales - transactions * per, sales * rate / 100 + transactions * per],
      `Gross sales = ${transactions} × ${money(ticket)} = ${money(sales)}. Fees = ${money(sales)} × ${rate}/100 + ${transactions} × ${money(per)}. Net deposit = ${money(sales)} − ${money(sales * rate / 100 + transactions * per)} = ${money(value)}.`);
  }),
  f('working-capital-classification', 'Small Business Cash Drills', 'easy', v => {
    const cash = 3500 + 175 * v, ar = 2800 + 130 * v, inventory = 4100 + 210 * v, equipment = 12000 + 400 * v, payables = 3700 + 140 * v, debt = 1300 + 60 * v, value = cash + ar + inventory - payables - debt;
    return numeric(`A business has cash of ${money(cash)}, receivables collectible within a year of ${money(ar)}, inventory expected to sell within a year of ${money(inventory)}, and long-term equipment of ${money(equipment)}. Its only current liabilities are ${money(payables)} of payables and ${money(debt)} of debt due within a year. What is working capital, defined as current assets minus current liabilities?`, value,
      [value + equipment, cash - payables - debt, cash + ar + inventory, cash + ar + inventory - payables],
      `Current assets = ${money(cash)} + ${money(ar)} + ${money(inventory)}; long-term equipment is excluded. Current liabilities = ${money(payables)} + ${money(debt)}. Working capital = ${money(cash + ar + inventory)} − ${money(payables + debt)} = ${money(value)}.`);
  }),

  // Fund Fee Drills — 9 families.
  f('expense-ratio-dollar-cost', 'Fund Fee Drills', 'easy', v => {
    const balance = 14000 + 1700 * v, expense = .18 + .02 * v, value = balance * expense / 100;
    return numeric(`A fund investment has a hypothetical constant fee-calculation balance of ${money(balance)} for one full year. Its annual expense ratio is ${pct(expense, 2)}. Ignoring other charges, what is the estimated annual expense in dollars?`, value,
      [balance * expense, balance * expense / 1200, balance * (1 - expense / 100), expense],
      `Annual expense = ${money(balance)} × (${num(expense, 2)}/100) = ${money(value)}. The constant-balance assumption isolates the expense-ratio calculation; actual fund values can change.`);
  }),
  f('weighted-fund-expense-ratio', 'Fund Fee Drills', 'medium', v => {
    const a = 7000 + 600 * v, b = 11000 + 350 * v, ar = .12 + .01 * (v % 5), br = .65 + .01 * v, value = (a * ar + b * br) / (a + b);
    return numeric(`An investor holds ${money(a)} in Fund A with a ${pct(ar, 2)} annual expense ratio and ${money(b)} in Fund B with a ${pct(br, 2)} ratio. Assuming constant balances and no other fees, what is the dollar-weighted expense ratio of the combined holdings?`, value,
      [(ar + br) / 2, ar + br, (a * br + b * ar) / (a + b), ar, br, a * ar / (a + b)],
      `Annual expenses are ${money(a)} × ${num(ar, 2)}/100 + ${money(b)} × ${num(br, 2)}/100. Divide by total holdings ${money(a + b)} and multiply by 100: weighted ratio = (${a} × ${num(ar, 2)} + ${b} × ${num(br, 2)})/(${a} + ${b}) = ${pct(value, 2)}.`, percent);
  }),
  f('front-load-invested-shares', 'Fund Fee Drills', 'medium', v => {
    const deposit = 4000 + 350 * v, load = 3 + .1 * v, nav = 22 + v, net = deposit * (1 - load / 100), value = net / nav;
    return numeric(`An investor sends ${money(deposit)} to a fund. A front-end sales charge of ${pct(load)} is deducted from that payment, and the remainder buys shares at ${money(nav)} each. Fractional shares are allowed and there are no other fees. How many shares are purchased?`, value,
      [deposit / nav, deposit * load / 100 / nav, deposit / (nav * (1 + load / 100)), net],
      `Amount invested = ${money(deposit)} × (1 − ${load}/100) = ${money(net)}. Shares = ${money(net)} ÷ ${money(nav)} = ${num(value, 2)}.`, decimal('shares'));
  }),
  f('deferred-load-lesser-base', 'Fund Fee Drills', 'hard', v => {
    const original = 6000 + 400 * v, current = original + (v % 2 === 0 ? -1 : 1) * (500 + 25 * v), rate = 2 + .1 * (v % 5), base = Math.min(original, current), value = current - base * rate / 100;
    return numeric(`A fund holding originally cost ${money(original)} and is now worth ${money(current)}. A complete redemption incurs a deferred sales charge of ${pct(rate)} applied to the lesser of original cost or current value. No other fees or taxes apply. What cash does the investor receive?`, value,
      [current * (1 - rate / 100), current - original * rate / 100, current, base * rate / 100, original - current * rate / 100],
      `Charge base = min(${money(original)}, ${money(current)}) = ${money(base)}. Charge = ${money(base)} × ${rate}/100 = ${money(base * rate / 100)}. Cash received = ${money(current)} − ${money(base * rate / 100)} = ${money(value)}.`);
  }),
  f('tiered-advisory-fee', 'Fund Fee Drills', 'medium', v => {
    const boundary = 50000, balance = 61000 + 4300 * v, low = 1, high = .65, value = boundary * low / 100 + (balance - boundary) * high / 100;
    return numeric(`An adviser charges an annual fee of ${pct(low)} on the first ${money(boundary)} and ${pct(high, 2)} only on assets above that amount. The fee-calculation balance is ${money(balance)} for the full year. What is the annual fee?`, value,
      [balance * low / 100, balance * high / 100, balance * (low + high) / 100, boundary * low / 100 + balance * high / 100],
      `First-tier fee = ${money(boundary)} × 1% = ${money(boundary * .01)}. Excess assets = ${money(balance)} − ${money(boundary)} = ${money(balance - boundary)}. Total fee = ${money(boundary * .01)} + ${money(balance - boundary)} × 0.65% = ${money(value)}.`);
  }),
  f('fee-day-proration', 'Fund Fee Drills', 'medium', v => {
    const balance = 24000 + 1600 * v, rate = .6 + .02 * (v % 5), days = 43 + 5 * v, value = balance * rate / 100 * days / 365;
    return numeric(`An account charges a ${pct(rate, 2)} annual advisory fee, prorated by actual days divided by 365. It has a constant fee-calculation balance of ${money(balance)} for ${days} billable days. What fee applies to that period?`, value,
      [balance * rate / 100, balance * rate / 100 * days / 360, balance * rate / 100 / 12, balance * rate / 100 * days / 366],
      `Prorated fee = ${money(balance)} × (${num(rate, 2)}/100) × (${days}/365) = ${money(value)}.`);
  }),
  f('multiyear-fee-drag', 'Fund Fee Drills', 'hard', v => {
    const initial = 10000 + 1000 * v, years = 5 + v % 6, gross = 5 + .2 * (v % 5), fee = .8 + .05 * (v % 4), noFee = initial * (1 + gross / 100) ** years, withFee = initial * (1 + (gross - fee) / 100) ** years, value = noFee - withFee;
    return numeric(`For a hypothetical ${years}-year illustration, ${money(initial)} earns a constant ${pct(gross)} gross annual return. Model fees by subtracting ${pct(fee, 2)} from the return each year before annual compounding. There are no contributions, withdrawals, or taxes. How much lower is the ending balance than in the same illustration with no fee?`, value,
      [initial * fee / 100 * years, noFee * fee / 100, noFee - initial, withFee - initial],
      `No-fee ending value = ${money(initial)} × (1 + ${gross}/100)^${years} = ${money(noFee)}. Modeled fee-adjusted value = ${money(initial)} × [1 + (${gross} − ${num(fee, 2)})/100]^${years} = ${money(withFee)}. Difference = ${money(value)}. These assumed returns are not a forecast.`);
  }),
  f('temporary-expense-waiver', 'Fund Fee Drills', 'medium', v => {
    const balance = 18000 + 1200 * v, normal = .75 + .02 * (v % 5), waived = .25 + .01 * (v % 4), months = 3 + v % 6, value = balance * (waived * months + normal * (12 - months)) / 1200;
    return numeric(`A fund's annualized expense ratio is temporarily reduced to ${pct(waived, 2)} for the first ${months} months of a year and is ${pct(normal, 2)} for the remaining ${12 - months} months. Assume a constant ${money(balance)} balance, equal monthly fee proration, and no other costs. What is the year's expense?`, value,
      [balance * waived / 100, balance * normal / 100, balance * (waived + normal) / 200, balance * (normal * months + waived * (12 - months)) / 1200, balance * (normal - waived) / 100],
      `Waiver-period expense = ${money(balance)} × ${num(waived, 2)}% × ${months}/12. Remaining-period expense = ${money(balance)} × ${num(normal, 2)}% × ${12 - months}/12. Total = ${money(value)}.`);
  }),
  f('fixed-and-percentage-fee-crossover', 'Fund Fee Drills', 'hard', v => {
    const fixed = 45 + 4 * v, low = .18 + .01 * (v % 5), high = .48 + .01 * v, value = fixed / ((high - low) / 100);
    return numeric(`Fund platform A charges a fixed ${money(fixed)} annual fee plus ${pct(low, 2)} of the balance annually. Platform B charges ${pct(high, 2)} annually with no fixed fee. Assume the same constant balance all year and no other differences. At what balance are the two annual dollar costs equal?`, value,
      [fixed / (high / 100), fixed / (low / 100), fixed / ((high + low) / 100), fixed * (high - low) / 100],
      `Set ${money(fixed)} + balance × ${num(low, 2)}% = balance × ${num(high, 2)}%. Balance = ${money(fixed)} ÷ [(${num(high, 2)} − ${num(low, 2)})/100] = ${money(value)}.`);
  }),

  // Portfolio Allocation Drills — 9 families.
  f('target-allocation-dollar-holding', 'Portfolio Allocation Drills', 'easy', v => {
    const total = 28000 + 2400 * v, stocks = 45 + v % 11, cash = 8 + v % 5, bond = 100 - stocks - cash, value = total * bond / 100;
    return numeric(`A ${money(total)} portfolio has a target allocation of ${pct(stocks)} stocks, ${pct(cash)} cash, and the remainder bonds. What dollar value should bonds have at the target?`, value,
      [total * stocks / 100, total * (100 - stocks) / 100, total * cash / 100, total * (stocks - cash) / 100, total * (100 - cash) / 100],
      `Bond percentage = 100% − ${stocks}% − ${cash}% = ${bond}%. Bond target = ${money(total)} × ${bond}/100 = ${money(value)}.`);
  }),
  f('rebalance-by-selling-overweight', 'Portfolio Allocation Drills', 'medium', v => {
    const stocks = 36000 + 1700 * v, bonds = 14000 + 900 * v, target = 55 + v % 6, total = stocks + bonds, value = stocks - total * target / 100;
    return numeric(`A portfolio holds ${money(stocks)} in stocks and ${money(bonds)} in bonds. The desired stock weight is ${pct(target)}. With prices unchanged, no taxes or fees, and no money added or removed, how much stock must be sold and moved to bonds to reach the target?`, value,
      [stocks * target / 100, total * target / 100, (stocks - bonds) * target / 100, stocks - bonds],
      `Total value = ${money(stocks)} + ${money(bonds)} = ${money(total)}. Target stocks = ${money(total)} × ${target}% = ${money(total * target / 100)}. Sell ${money(stocks)} − ${money(total * target / 100)} = ${money(value)}.`);
  }),
  f('rebalance-with-new-money-only', 'Portfolio Allocation Drills', 'hard', v => {
    const stock = 39000 + 2100 * v, bond = 21000 + 700 * v, target = .6, value = stock / target - stock - bond;
    return numeric(`A portfolio has ${money(stock)} in stocks and ${money(bond)} in bonds. An investor wants stocks to be exactly 60% by adding new cash only to bonds. Assume unchanged prices and no fees. How much new cash is required?`, value,
      [(stock + bond) * .4 - bond, stock * .4 - bond, stock / .4 - stock - bond, stock - bond],
      `With stocks fixed, required total = ${money(stock)} ÷ 0.60 = ${money(stock / .6)}. New bond contribution = ${money(stock / .6)} − ${money(stock)} − ${money(bond)} = ${money(value)}.`);
  }),
  f('allocation-drift-after-returns', 'Portfolio Allocation Drills', 'medium', v => {
    const stock = 19000 + 1100 * v, bond = 13000 + 500 * v, sr = 7 + v, br = 2 + v % 4, endStock = stock * (1 + sr / 100), endBond = bond * (1 + br / 100), value = endStock / (endStock + endBond) * 100;
    return numeric(`A portfolio begins with ${money(stock)} in stocks and ${money(bond)} in bonds. Over one stated period, stocks return ${pct(sr)} and bonds return ${pct(br)}, with distributions reinvested. There are no contributions, withdrawals, fees, or taxes. What percentage of ending value is in stocks?`, value,
      [stock / (stock + bond) * 100, endStock / (stock + bond) * 100, (stock / (stock + bond) * 100) + sr, endBond / (endStock + endBond) * 100],
      `Ending stocks = ${money(stock)} × (1 + ${sr}/100) = ${money(endStock)}. Ending bonds = ${money(bond)} × (1 + ${br}/100) = ${money(endBond)}. Stock weight = ${money(endStock)} ÷ ${money(endStock + endBond)} × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('weighted-portfolio-period-return', 'Portfolio Allocation Drills', 'medium', v => {
    const stockWeight = 35 + v, bondWeight = 40 - v % 10, cashWeight = 100 - stockWeight - bondWeight, stockReturn = -8 + v, bondReturn = 2 + .2 * (v % 5), cashReturn = 1, value = (stockWeight * stockReturn + bondWeight * bondReturn + cashWeight * cashReturn) / 100;
    return numeric(`At the start of a period, a portfolio is ${pct(stockWeight)} stocks, ${pct(bondWeight)} bonds, and ${pct(cashWeight)} cash. Their total returns are ${pct(stockReturn)}, ${pct(bondReturn)}, and ${pct(cashReturn)}, respectively. With no rebalancing, fees, taxes, or outside cash flows, what is the portfolio's period return?`, value,
      [(stockReturn + bondReturn + cashReturn) / 3, stockReturn + bondReturn + cashReturn, stockWeight * stockReturn / 100, (stockWeight * bondReturn + bondWeight * stockReturn + cashWeight * cashReturn) / 100, bondWeight * bondReturn / 100, stockReturn],
      `Use beginning weights: return = (${stockWeight} × ${stockReturn} + ${bondWeight} × ${bondReturn} + ${cashWeight} × ${cashReturn})/100 = ${pct(value, 2)}.`, percent);
  }),
  f('fund-look-through-stock-exposure', 'Portfolio Allocation Drills', 'medium', v => {
    const direct = 600 + 80 * v, fundA = 8000 + 400 * v, fundB = 5000 + 300 * v, weightA = 3 + v % 5, weightB = 5 + v % 4, value = direct + fundA * weightA / 100 + fundB * weightB / 100;
    return numeric(`An investor owns ${money(direct)} of Company X directly, ${money(fundA)} of Fund A that holds ${pct(weightA)} in Company X, and ${money(fundB)} of Fund B that holds ${pct(weightB)} in Company X. Assume these are the only exposures and holdings values are current. What is the total dollar exposure to Company X?`, value,
      [direct, fundA * weightA / 100 + fundB * weightB / 100, direct + fundA + fundB, direct + (fundA + fundB) * (weightA + weightB) / 100],
      `Look-through exposure = direct holding + each fund value × its Company X weight = ${money(direct)} + ${money(fundA)} × ${weightA}% + ${money(fundB)} × ${weightB}% = ${money(value)}.`);
  }),
  f('withdrawal-and-target-allocation', 'Portfolio Allocation Drills', 'hard', v => {
    const total = 80000 + 4000 * v, stock = total * .65, withdraw = 14000 + 700 * v, target = .6, value = stock - (total - withdraw) * target;
    return numeric(`A ${money(total)} portfolio is 65% stocks and 35% bonds. An investor withdraws ${money(withdraw)} and wants the remaining portfolio to be 60% stocks. Assume unchanged prices, no tax or fees, and the withdrawal is funded by selling both assets in the necessary amounts. How much stock should be sold?`, value,
      [withdraw * .65, withdraw * .6, total * .05, stock - (total - withdraw) * .65],
      `Current stocks = ${money(total)} × 65% = ${money(stock)}. After withdrawal, total = ${money(total - withdraw)} and target stocks = ${money(total - withdraw)} × 60% = ${money((total - withdraw) * target)}. Stock sale = ${money(stock)} − ${money((total - withdraw) * target)} = ${money(value)}.`);
  }),
  f('whole-share-allocation-cash-remainder', 'Portfolio Allocation Drills', 'medium', v => {
    const cash = 7200 + 330 * v, target = 35 + v % 11, price = 87 + 3 * v, budget = cash * target / 100, shares = Math.floor(budget / price), value = budget - shares * price;
    return numeric(`An investor earmarks ${pct(target)} of ${money(cash)} for an ETF priced at ${money(price)} per share. Fractional shares are unavailable and commissions are zero. After buying the maximum whole shares within that earmarked budget, how much of that budget remains as cash?`, value,
      [budget, cash - shares * price, budget - Math.ceil(budget / price) * price, price, shares],
      `ETF budget = ${money(cash)} × ${target}% = ${money(budget)}. Whole shares = floor(${money(budget)} ÷ ${money(price)}) = ${shares}. Unspent earmarked cash = ${money(budget)} − ${shares} × ${money(price)} = ${money(value)}.`);
  }),
  f('two-asset-portfolio-volatility', 'Portfolio Allocation Drills', 'hard', v => {
    const w = .35 + .01 * v, sa = 14 + .4 * v, sb = 6 + .1 * v, correlation = .1 + .1 * (v % 4), variance = w ** 2 * sa ** 2 + (1 - w) ** 2 * sb ** 2 + 2 * w * (1 - w) * sa * sb * correlation, value = Math.sqrt(variance);
    return numeric(`A two-asset model uses weight ${pct(w * 100)} in A and ${pct((1 - w) * 100)} in B. Their annual return standard deviations are ${pct(sa)} and ${pct(sb)}; correlation is ${num(correlation, 1)}. Using portfolio variance = wA²σA² + wB²σB² + 2wAwBσAσBρ, what is modeled annual portfolio standard deviation?`, value,
      [w * sa + (1 - w) * sb, variance, Math.sqrt(w ** 2 * sa ** 2 + (1 - w) ** 2 * sb ** 2), Math.sqrt(w ** 2 * sa ** 2 + (1 - w) ** 2 * sb ** 2 - 2 * w * (1 - w) * sa * sb * correlation)],
      `Using standard deviations in percentage units, variance = ${num(w, 2)}² × ${num(sa, 1)}² + ${num(1 - w, 2)}² × ${num(sb, 1)}² + 2 × ${num(w, 2)} × ${num(1 - w, 2)} × ${num(sa, 1)} × ${num(sb, 1)} × ${num(correlation, 1)} = ${num(variance, 4)}. Its square root is ${pct(value, 2)}. This is a model based on assumed inputs.`, percent);
  }),

  // Investment Return Drills — 8 families.
  f('holding-return-dividends-trading-costs', 'Investment Return Drills', 'medium', v => {
    const shares = 24 + 3 * v, buy = 31 + v, sell = buy + 4 + .2 * v, dividend = .6 + .05 * v, fee = 4 + .25 * v, initial = shares * buy + fee, net = shares * (sell + dividend) - fee, value = (net - initial) / initial * 100;
    return numeric(`An investor buys ${shares} shares at ${money(buy)} each and pays a ${money(fee)} purchase commission. The shares pay ${money(dividend)} per share in cash dividends, then all sell at ${money(sell)} each with another ${money(fee)} commission. Ignoring taxes, what is the holding-period return on the full initial cash outlay?`, value,
      [(sell - buy) / buy * 100, (sell - buy + dividend) / buy * 100, (net - initial) / (shares * buy) * 100, (net - initial + fee) / initial * 100],
      `Initial outlay = ${shares} × ${money(buy)} + ${money(fee)} = ${money(initial)}. Sale plus dividends less sale commission = ${shares} × (${money(sell)} + ${money(dividend)}) − ${money(fee)} = ${money(net)}. Return = (${money(net)} − ${money(initial)})/${money(initial)} × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('compound-annual-growth-rate', 'Investment Return Drills', 'hard', v => {
    const start = 6500 + 500 * v, end = start * (1.4 + .025 * v), years = 3 + v % 6, value = ((end / start) ** (1 / years) - 1) * 100;
    return numeric(`An investment grows from ${money(start)} to ${money(end)} over exactly ${years} years with no deposits, withdrawals, fees, or taxes. What constant annual compound growth rate would connect those two values?`, value,
      [(end / start - 1) * 100 / years, (end / start - 1) * 100, ((end / start) ** years - 1) * 100, (end - start) / end / years * 100],
      `Solve ending = beginning × (1 + r)^${years}. CAGR = [(${money(end)}/${money(start)})^(1/${years}) − 1] × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('exact-inflation-adjusted-return', 'Investment Return Drills', 'medium', v => {
    const nominal = 5 + .4 * v, inflation = 2 + .1 * v, value = ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100;
    return numeric(`Over one year, an investment earns a ${pct(nominal)} nominal total return while the price level rises ${pct(inflation)}. Ignoring tax, what is the exact inflation-adjusted return, using (1 + nominal return)/(1 + inflation) − 1?`, value,
      [nominal - inflation, nominal + inflation, ((1 + inflation / 100) / (1 + nominal / 100) - 1) * 100, nominal / inflation],
      `Real return = [(1 + ${num(nominal, 1)}/100)/(1 + ${num(inflation, 1)}/100) − 1] × 100 = ${pct(value, 2)}. Dividing the growth factors accounts for the higher price level.`, percent);
  }),
  f('two-period-cumulative-return', 'Investment Return Drills', 'medium', v => {
    const gain = 9 + v, loss = 4 + v % 9, value = ((1 + gain / 100) * (1 - loss / 100) - 1) * 100;
    return numeric(`An investment rises ${pct(gain)} in the first period and then falls ${pct(loss)} from its new value in the second period. With no cash flows, fees, or taxes, what is the cumulative return over both periods?`, value,
      [gain - loss, (gain - loss) / 2, gain + loss, ((1 - gain / 100) * (1 + loss / 100) - 1) * 100],
      `Multiply the period growth factors: cumulative return = [(1 + ${gain}/100) × (1 − ${loss}/100) − 1] × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('drawdown-recovery-return', 'Investment Return Drills', 'medium', v => {
    const loss = 12 + 2 * v, value = loss / (100 - loss) * 100;
    return numeric(`An investment loses ${pct(loss)} of its value. With no further deposits or withdrawals, what percentage gain from the reduced value would restore the original value?`, value,
      [loss, 100 - loss, loss / (100 + loss) * 100, 100 / (100 - loss)],
      `Starting from a reference value of 100, the reduced value is ${100 - loss} and the required gain is ${loss}. Recovery return = ${loss}/${100 - loss} × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('equal-dollar-purchase-average-cost', 'Investment Return Drills', 'medium', v => {
    const payment = 300 + 25 * v, p1 = 20 + v, p2 = 28 + 1.2 * v, p3 = 17 + .6 * v, shares = payment / p1 + payment / p2 + payment / p3, value = payment * 3 / shares;
    return numeric(`An investor spends ${money(payment)} on each of three purchases at share prices of ${money(p1)}, ${money(p2)}, and ${money(p3)}. Fractional shares are allowed and there are no fees. What is the average cost per share across all purchases?`, value,
      [(p1 + p2 + p3) / 3, shares / (payment * 3), payment * 3 / (p1 + p2 + p3), payment / shares],
      `Total shares = ${payment}/${num(p1, 2)} + ${payment}/${num(p2, 2)} + ${payment}/${num(p3, 2)} = ${num(shares, 6)}. Total cost = 3 × ${money(payment)} = ${money(payment * 3)}. Average cost = ${money(payment * 3)} ÷ total shares = ${money(value)}.`, { suffix: 'per share' });
  }),
  f('dividend-reinvestment-ending-value', 'Investment Return Drills', 'medium', v => {
    const shares = 70 + 5 * v, dividend = .8 + .05 * v, reinvestPrice = 25 + v, endPrice = 29 + 1.1 * v, extraShares = shares * dividend / reinvestPrice, value = (shares + extraShares) * endPrice;
    return numeric(`An investor owns ${shares} shares. A single dividend of ${money(dividend)} per share is immediately reinvested at ${money(reinvestPrice)} per share, with fractional shares allowed. Later the share price is ${money(endPrice)}. No other distributions, trades, fees, or taxes occur. What is the ending holding value?`, value,
      [shares * endPrice, shares * endPrice + shares * dividend, (shares + dividend / reinvestPrice) * endPrice, (shares + shares * dividend / endPrice) * endPrice],
      `Dividend cash = ${shares} × ${money(dividend)} = ${money(shares * dividend)}. Added shares = ${money(shares * dividend)} ÷ ${money(reinvestPrice)} = ${num(extraShares, 6)}. Ending value = (${shares} + ${num(extraShares, 6)}) × ${money(endPrice)} = ${money(value)}, using unrounded added shares.`);
  }),
  f('foreign-investment-home-currency-return', 'Investment Return Drills', 'hard', v => {
    const assetTenths = 60 + 5 * v, currencyTenths = -70 + 4 * v, asset = assetTenths / 10, currency = currencyTenths / 10;
    // Integer-scaled inputs preserve exact decimal half-cent cases before formatting.
    const value = ((assetTenths + currencyTenths) * 1000 + assetTenths * currencyTenths) / 10000;
    return numeric(`A foreign investment has a ${pct(asset)} total return in its local currency. Over the same period, the U.S. dollar value of one unit of that currency changes by ${pct(currency)}. Assume distributions are included in the local return, no hedging, no fees or tax, and no outside cash flows. What is the investment's return measured in U.S. dollars?`, value,
      [asset + currency, asset - currency, asset, ((1 + asset / 100) / (1 + currency / 100) - 1) * 100],
      `Dollar growth factor = local-asset growth factor × currency-dollar-value factor. Return = [(1 + ${num(asset, 1)}/100) × (1 + ${num(currency, 1)}/100) − 1] × 100 = ${pct(value, 2)}.`, percent);
  }),

  // Bond Cash Flow Drills — 8 families.
  f('semiannual-coupon-payment', 'Bond Cash Flow Drills', 'easy', v => {
    const face = 5000 + 1000 * v, coupon = 3.2 + .1 * v, value = face * coupon / 100 / 2;
    return numeric(`A fixed-rate bond holding has total face value of ${money(face)} and a ${pct(coupon)} annual coupon rate. It pays two equal coupons per year. Assuming the issuer makes the scheduled payment, how much is one semiannual coupon?`, value,
      [face * coupon / 100, face * coupon / 100 / 12, face * coupon / 100 * 2, face / 2],
      `Annual coupon = ${money(face)} × ${num(coupon, 1)}% = ${money(face * coupon / 100)}. One of two equal payments = ${money(face * coupon / 100)} ÷ 2 = ${money(value)}.`);
  }),
  f('bond-current-yield', 'Bond Cash Flow Drills', 'medium', v => {
    const face = 1000, coupon = 4 + .1 * v, price = 890 + 11 * v, value = face * coupon / 100 / price * 100;
    return numeric(`A bond has ${money(face)} face value, a ${pct(coupon)} annual coupon rate, and a current market price of ${money(price)} excluding accrued interest. What is its current yield, defined as annual coupon dollars divided by market price?`, value,
      [coupon, (face - price) / price * 100, (face * coupon / 100 + face - price) / price * 100, price * coupon / face, coupon / 2, coupon * 2],
      `Annual coupon = ${money(face)} × ${num(coupon, 1)}% = ${money(face * coupon / 100)}. Current yield = ${money(face * coupon / 100)} ÷ ${money(price)} × 100 = ${pct(value, 2)}. This is not yield to maturity.`, percent);
  }),
  f('bond-clean-price-accrued-total', 'Bond Cash Flow Drills', 'hard', v => {
    const face = 5000 + 1000 * v, quote = 96.5 + .15 * v, coupon = 4.5, days = 22 + 6 * v, clean = face * quote / 100, accrued = face * coupon / 100 * days / 365, value = clean + accrued;
    return numeric(`A bond holding with face value ${money(face)} is quoted at ${num(quote, 2)}% of face value, excluding accrued interest. Its annual coupon rate is ${pct(coupon)}, and ${days} accrual days have passed since the last coupon. For this problem use annual coupon × actual days/365. With no fees, what total does the buyer pay including accrued interest?`, value,
      [clean, clean - accrued, clean + face * coupon / 100, clean + face * coupon / 100 * days / 360],
      `Clean price = ${money(face)} × ${num(quote, 2)}/100 = ${money(clean)}. Accrued interest = ${money(face)} × 4.5% × ${days}/365 = ${money(accrued)}. Total = ${money(clean)} + accrued interest = ${money(value)}.`);
  }),
  f('maturity-final-cash-flow', 'Bond Cash Flow Drills', 'easy', v => {
    const face = 3000 + 1000 * v, coupon = 3 + .1 * v, paid = face * .97, value = face + face * coupon / 100 / 2;
    return numeric(`An investor bought a bond holding for ${money(paid)}. Its face value is ${money(face)} and annual coupon is ${pct(coupon)}, paid in two equal installments. On its scheduled maturity date, principal and the final semiannual coupon are due together. Assuming no default, fees, or taxes, how much cash is received on that date?`, value,
      [face, paid + face * coupon / 100 / 2, face + face * coupon / 100, face * coupon / 100 / 2],
      `Maturity pays face value, regardless of the purchase price, plus the final coupon. Cash = ${money(face)} + (${money(face)} × ${num(coupon, 1)}% ÷ 2) = ${money(value)}.`);
  }),
  f('zero-coupon-present-value', 'Bond Cash Flow Drills', 'hard', v => {
    const face = 1000 + 250 * v, years = 3 + v % 7, yieldRate = 3.5 + .1 * v, value = face / (1 + yieldRate / 100) ** years;
    return numeric(`A zero-coupon bond is assumed to pay ${money(face)} at maturity in exactly ${years} years and nothing beforehand. Using a required annual effective yield of ${pct(yieldRate)}, annual compounding, and no fees or taxes, what is its present value?`, value,
      [face / (1 + yieldRate / 100 * years), face * (1 + yieldRate / 100) ** years, face * (1 - yieldRate / 100 * years), face / (1 + yieldRate / 100)],
      `Discount the sole maturity payment: present value = ${money(face)} ÷ (1 + ${num(yieldRate, 1)}/100)^${years} = ${money(value)}.`);
  }),
  f('coupon-bond-discounted-price', 'Bond Cash Flow Drills', 'hard', v => {
    const face = 1000 + 100 * v, coupon = 4 + .1 * v, y = (5.5 + .1 * v) / 100, years = 3 + v % 5, payment = face * coupon / 100, annuity = (1 - (1 + y) ** -years) / y, value = payment * annuity + face / (1 + y) ** years;
    return numeric(`Immediately after a coupon date, a bond has ${years} years remaining, ${money(face)} face value, and a ${pct(coupon)} annual coupon paid once each year. Assume every coupon and principal are paid on schedule. Discount all payments at an annual effective yield of ${pct(y * 100)}; ignore fees and tax. What is the bond's present value?`, value,
      [face, payment * years + face, (payment * years + face) / (1 + y) ** years, payment * annuity],
      `Annual coupon = ${money(face)} × ${num(coupon, 1)}% = ${money(payment)}. Price = ${money(payment)} × [1 − (1 + ${num(y, 4)})^(−${years})]/${num(y, 4)} + ${money(face)}/(1 + ${num(y, 4)})^${years} = ${money(value)}.`);
  }),
  f('bond-sale-return-accrual', 'Bond Cash Flow Drills', 'hard', v => {
    const cleanBuy = 950 + 3 * v, accruedBuy = 12 + .5 * v, cleanSell = 970 + 3.5 * v, accruedSell = 8 + .3 * v, coupon = 40 + v, cost = cleanBuy + accruedBuy, proceeds = cleanSell + accruedSell + coupon, value = (proceeds - cost) / cost * 100;
    return numeric(`A bond is bought for ${money(cleanBuy)} clean price plus ${money(accruedBuy)} accrued interest. During the holding period it pays ${money(coupon)} in coupons, then sells for ${money(cleanSell)} clean price plus ${money(accruedSell)} accrued interest. With no fees or taxes, what is the holding-period return on the total purchase payment?`, value,
      [(cleanSell - cleanBuy + coupon) / cleanBuy * 100, (proceeds - cost) / cleanBuy * 100, (cleanSell + accruedSell - cost) / cost * 100, (proceeds - cleanBuy) / cleanBuy * 100],
      `Initial payment = ${money(cleanBuy)} + ${money(accruedBuy)} = ${money(cost)}. Cash received = ${money(cleanSell)} + ${money(accruedSell)} + ${money(coupon)} = ${money(proceeds)}. Return = (${money(proceeds)} − ${money(cost)})/${money(cost)} × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('bond-ladder-year-cash-flow', 'Bond Cash Flow Drills', 'medium', v => {
    const mature = 4000 + 500 * v, later = 6000 + 750 * v, rateA = 3 + .1 * v, rateB = 4 + .1 * (v % 7), value = mature + mature * rateA / 100 + later * rateB / 100;
    return numeric(`A bond ladder holds ${money(mature)} face value at a ${pct(rateA)} annual coupon maturing at this year-end and ${money(later)} face value at ${pct(rateB)} maturing next year. Both pay one full annual coupon this year. Assume all scheduled payments occur, with no reinvestment, trades, fees, or taxes. How much cash does the ladder pay during this year?`, value,
      [mature + later + mature * rateA / 100 + later * rateB / 100, mature * rateA / 100 + later * rateB / 100, mature + mature * rateA / 100, mature + later * rateB / 100],
      `This year's cash includes maturing principal ${money(mature)} plus coupons ${money(mature)} × ${num(rateA, 1)}% and ${money(later)} × ${num(rateB, 1)}%. Total = ${money(value)}; the later bond's principal is not paid this year.`);
  }),

  // Retirement Saving Drills — 8 families.
  f('capped-employer-match', 'Retirement Saving Drills', 'medium', v => {
    const salary = 48000 + 2500 * v, contribution = 3 + v % 7, eligibleCap = 5, value = salary * Math.min(contribution, eligibleCap) / 100 * .5;
    return numeric(`In a hypothetical retirement plan, annual eligible pay is ${money(salary)}. The employee contributes ${pct(contribution)} of pay. The employer matches 50% of employee contributions on only the first 5% of pay contributed. Assume full-year eligibility and no other limits. What is the annual employer match?`, value,
      [salary * contribution / 100 * .5, salary * .05, salary * Math.min(contribution, eligibleCap) / 100, salary * .025, salary * contribution / 100 + value, value / 12],
      `Eligible employee contribution = ${money(salary)} × min(${contribution}%, 5%) = ${money(salary * Math.min(contribution, eligibleCap) / 100)}. Employer match = that amount × 50% = ${money(value)}. This plan formula is hypothetical.`);
  }),
  f('tiered-employer-match', 'Retirement Saving Drills', 'hard', v => {
    const salary = 52000 + 2700 * v, employeeRate = 3.5 + .25 * v, first = Math.min(employeeRate, 3), second = Math.max(0, Math.min(employeeRate - 3, 2)), value = salary * (first + .5 * second) / 100;
    return numeric(`A hypothetical retirement plan matches 100% of contributions on the first 3% of annual eligible pay and 50% on the next 2% of pay, with no match above 5%. Eligible pay is ${money(salary)}, and the employee contributes ${pct(employeeRate, 2)}. Assume full-year eligibility and no other limits. What is the annual employer match?`, value,
      [salary * employeeRate / 100, salary * .05, salary * employeeRate / 100 * .5, salary * .03 + salary * employeeRate / 100 * .5],
      `First tier = ${money(salary)} × ${num(first, 2)}% × 100%. Second tier = ${money(salary)} × ${num(second, 2)}% × 50%. Total match = ${money(value)}. The second tier is limited to two percentage points of pay.`);
  }),
  f('vested-retirement-balance', 'Retirement Saving Drills', 'medium', v => {
    const employee = 12500 + 750 * v, employer = 5400 + 320 * v, vested = 20 + 20 * (v % 4), value = employee + employer * vested / 100;
    return numeric(`A retirement account has ${money(employee)} attributable to employee contributions and their earnings, all fully vested, plus ${money(employer)} attributable to employer contributions and their earnings. The plan's stated vesting percentage for the employer portion is ${pct(vested)}. What is the total vested balance, ignoring taxes or distribution penalties?`, value,
      [(employee + employer) * vested / 100, employee + employer, employer * vested / 100, employee + employer * (1 - vested / 100)],
      `Employee portion remains fully owned: ${money(employee)}. Vested employer portion = ${money(employer)} × ${vested}% = ${money(employer * vested / 100)}. Total vested balance = ${money(employee)} + ${money(employer * vested / 100)} = ${money(value)}.`);
  }),
  f('retirement-saving-gap-no-growth', 'Retirement Saving Drills', 'easy', v => {
    const target = 24000 + 1400 * v, saved = 4200 + 250 * v, months = 24 + v, value = (target - saved) / months;
    return numeric(`A saver wants ${money(target)} in a retirement reserve in ${months} months and already has ${money(saved)} earmarked for it. For this conservative arithmetic scenario, assume zero return, no fees, no taxes, and equal deposits at each month-end. What monthly deposit closes the gap?`, value,
      [target / months, (target + saved) / months, (target - saved) / 12, saved / months],
      `Remaining goal = ${money(target)} − ${money(saved)} = ${money(target - saved)}. Monthly deposit = ${money(target - saved)} ÷ ${months} = ${money(value)}.`, { suffix: 'per month' });
  }),
  f('monthly-retirement-annuity-future-value', 'Retirement Saving Drills', 'hard', v => {
    const deposit = 150 + 20 * v, years = 10 + v, annual = 4 + .1 * (v % 6), monthly = annual / 1200, periods = years * 12, value = deposit * ((1 + monthly) ** periods - 1) / monthly;
    return numeric(`In a hypothetical retirement projection starting from zero, a saver deposits ${money(deposit)} at the end of every month for ${years} years. Assume a constant nominal annual return of ${pct(annual)} compounded monthly, no missed deposits, fees, or taxes. What is the projected balance immediately after the last deposit?`, value,
      [deposit * periods, deposit * ((1 + monthly) ** periods - 1) / monthly * (1 + monthly), deposit * periods * (1 + monthly) ** periods, deposit * ((1 + monthly) ** (periods - 1) - 1) / monthly],
      `Monthly rate = ${num(annual, 1)}%/12 = ${num(monthly, 8)}; deposits = ${years} × 12 = ${periods}. Ordinary-annuity value = ${money(deposit)} × [(1 + ${num(monthly, 8)})^${periods} − 1]/${num(monthly, 8)} = ${money(value)}, using the unrounded rate. The assumed return is not guaranteed.`);
  }),
  f('required-yearly-retirement-contribution', 'Retirement Saving Drills', 'hard', v => {
    const target = 180000 + 12000 * v, current = 15000 + 700 * v, years = 12 + v % 9, r = .045 + .001 * (v % 5), factor = ((1 + r) ** years - 1) / r, grown = current * (1 + r) ** years, value = (target - grown) / factor;
    return numeric(`A hypothetical retirement projection targets ${money(target)} in ${years} years from a starting balance of ${money(current)}. Assume a constant ${pct(r * 100, 2)} annual return compounded yearly and equal contributions made at each year-end. Ignore taxes and fees. What annual contribution makes the projected ending balance equal the target?`, value,
      [target / factor, (target - current) / years, (target - current) / factor, (target - grown) / years],
      `Existing balance grows to ${money(current)} × (1 + ${num(r, 4)})^${years} = ${money(grown)}. Contribution accumulation factor = [(1 + ${num(r, 4)})^${years} − 1]/${num(r, 4)} = ${num(factor, 6)}. Required annual deposit = (${money(target)} − ${money(grown)})/factor = ${money(value)}, using unrounded intermediates. Returns are hypothetical.`, { suffix: 'per year' });
  }),
  f('future-retirement-spending-inflation', 'Retirement Saving Drills', 'medium', v => {
    const present = 32000 + 1700 * v, years = 8 + v, inflation = 2 + .1 * (v % 7), value = present * (1 + inflation / 100) ** years;
    return numeric(`A retirement budget would buy ${money(present)} of goods and services per year at today's prices. Under a hypothetical constant ${pct(inflation)} annual inflation assumption for ${years} years, what annual dollar budget would buy the same basket then?`, value,
      [present * (1 + inflation / 100 * years), present / (1 + inflation / 100) ** years, present * (1 + inflation / 100), present],
      `Escalate the budget with annual compounding: future budget = ${money(present)} × (1 + ${num(inflation, 1)}/100)^${years} = ${money(value)}. This is a scenario, not an inflation forecast.`, { suffix: 'per year' });
  }),
  f('gross-withdrawal-for-net-cash', 'Retirement Saving Drills', 'medium', v => {
    const net = 9000 + 650 * v, withholding = 12 + v % 10, value = net / (1 - withholding / 100);
    return numeric(`A retiree needs ${money(net)} deposited into a bank account. For this hypothetical withdrawal, the administrator withholds exactly ${pct(withholding)} of the gross withdrawal and charges no fees or penalties. What gross withdrawal produces that net payment? Treat withholding only as an assumed cash deduction, not as a statement of final tax owed.`, value,
      [net * (1 + withholding / 100), net * (1 - withholding / 100), net / (withholding / 100), net + withholding],
      `Net cash = gross withdrawal × (1 − ${withholding}/100). Gross withdrawal = ${money(net)} ÷ ${num(1 - withholding / 100, 2)} = ${money(value)}.`);
  }),

  // Payment and Currency Drills — 8 families.
  f('foreign-card-purchase-fee', 'Payment and Currency Drills', 'medium', v => {
    const euros = 120 + 19 * v, exchange = 1.07 + .005 * v, fee = 2 + .1 * (v % 6), converted = euros * exchange, value = converted * (1 + fee / 100);
    return numeric(`A card purchase costs ${num(euros, 2)} euros. The card converts it at ${money(exchange, 4)} per euro and adds a ${pct(fee)} foreign transaction fee to the converted dollar amount. With no other charges and no intermediate rounding, what dollar amount is billed?`, value,
      [converted, euros / exchange * (1 + fee / 100), converted + euros * fee / 100, converted * fee / 100],
      `Converted purchase = ${num(euros, 2)} × ${money(exchange, 4)} = ${money(converted)}. Billed amount = converted purchase × (1 + ${num(fee, 1)}/100) = ${money(value)}, using the unrounded conversion.`);
  }),
  f('remittance-fixed-budget-net-recipient', 'Payment and Currency Drills', 'medium', v => {
    const budget = 250 + 35 * v, fee = 7 + v % 5, rate = 16.5 + .1 * v, recipientFee = 20 + 2 * v, value = (budget - fee) * rate - recipientFee;
    return numeric(`A sender has a total budget of ${money(budget)}, including a ${money(fee)} sender fee. The remaining dollars convert at ${num(rate, 2)} pesos per dollar. A ${num(recipientFee, 2)}-peso recipient fee is then deducted. With no other fees or taxes, how many pesos does the recipient receive?`, value,
      [budget * rate - recipientFee, (budget - fee) * rate, budget * rate - fee - recipientFee, (budget - fee - recipientFee) * rate],
      `Dollars converted = ${money(budget)} − ${money(fee)} = ${money(budget - fee)}. Recipient gets (${budget} − ${fee}) × ${num(rate, 2)} − ${recipientFee} = ${num(value, 2)} pesos.`, decimal('pesos'));
  }),
  f('remittance-target-reverse-conversion', 'Payment and Currency Drills', 'hard', v => {
    const target = 2800 + 240 * v, localFee = 35 + v, rate = 17 + .08 * v, senderFee = 8 + .5 * v, value = (target + localFee) / rate + senderFee;
    return numeric(`A recipient must receive exactly ${num(target, 2)} pesos after a ${num(localFee, 2)}-peso local fee. The provider exchanges dollars at ${num(rate, 2)} pesos per dollar and charges the sender ${money(senderFee)} in addition to the dollars converted. With no other charges and using unrounded conversion amounts, what is the sender's total dollar cost?`, value,
      [target / rate + senderFee, (target - localFee) / rate + senderFee, (target + localFee) * rate + senderFee, (target + localFee + senderFee) / rate],
      `Pesos needed before the local fee = ${target} + ${localFee} = ${target + localFee}. Dollars to convert = ${target + localFee}/${num(rate, 2)}. Total cost = ${target + localFee}/${num(rate, 2)} + ${money(senderFee)} = ${money(value)}.`);
  }),
  f('remittance-fee-and-rate-comparison', 'Payment and Currency Drills', 'hard', v => {
    const budget = 400 + 45 * v, feeA = 3 + v % 4, feeB = 10 + v % 5, rateA = 16.8 + .02 * v, rateB = rateA + .35, receiveA = (budget - feeA) * rateA, receiveB = (budget - feeB) * rateB, value = receiveB - receiveA;
    return numeric(`Using the same total ${money(budget)} budget, Provider A subtracts a ${money(feeA)} fee and exchanges the rest at ${num(rateA, 2)} pesos per dollar. Provider B subtracts ${money(feeB)} and exchanges the rest at ${num(rateB, 2)} pesos per dollar. There are no recipient fees or taxes. What is pesos received with B minus pesos received with A?`, value,
      [budget * (rateB - rateA), receiveA - receiveB, (feeB - feeA) * rateB, receiveB - budget * rateA],
      `A delivers (${budget} − ${feeA}) × ${num(rateA, 2)} = ${num(receiveA, 2)} pesos. B delivers (${budget} − ${feeB}) × ${num(rateB, 2)} = ${num(receiveB, 2)} pesos. B minus A = ${num(value, 2)} pesos.`, decimal('pesos'));
  }),
  f('reward-card-annual-net-benefit', 'Payment and Currency Drills', 'medium', v => {
    const eligible = 9000 + 750 * v, excluded = 600 + 40 * v, rate = 1.5 + .1 * (v % 5), annualFee = 65 + 4 * v, value = eligible * rate / 100 - annualFee;
    return numeric(`A card earns ${pct(rate)} cash rewards on ${money(eligible)} of eligible annual purchases and no rewards on ${money(excluded)} of excluded transactions. Its annual fee is ${money(annualFee)}. Assume every statement is paid in full, no interest or other fees, and all rewards are redeemed at face value. What is annual rewards minus the annual fee?`, value,
      [(eligible + excluded) * rate / 100 - annualFee, eligible * rate / 100, eligible * rate / 100 + annualFee, eligible * rate / 100 - annualFee / 12],
      `Rewards = ${money(eligible)} × ${num(rate, 1)}% = ${money(eligible * rate / 100)}. Excluded transactions earn zero. Net annual benefit = ${money(eligible * rate / 100)} − ${money(annualFee)} = ${money(value)}.`);
  }),
  f('daily-card-interest-simple-period', 'Payment and Currency Drills', 'medium', v => {
    const balance = 850 + 125 * v, apr = 17 + .4 * v, days = 18 + v, value = balance * apr / 100 / 365 * days;
    return numeric(`A card has an interest-bearing balance of ${money(balance)} that stays constant for ${days} days; no grace period applies. For this problem, the daily rate is APR/365, APR is ${pct(apr)}, and interest does not compound during the period. No payments, fees, or new purchases occur. How much interest accrues?`, value,
      [balance * apr / 100 / 12, balance * apr / 100 / 360 * days, balance * apr / 100, balance * ((1 + apr / 36500) ** days - 1)],
      `Daily rate = ${num(apr, 1)}%/365. Interest = ${money(balance)} × (${num(apr, 1)}/100) × ${days}/365 = ${money(value)}. The stated calculation excludes daily compounding.`);
  }),
  f('installment-price-extra-percent', 'Payment and Currency Drills', 'medium', v => {
    const cash = 680 + 55 * v, down = 80 + 5 * v, count = 10 + v % 5, payment = Math.ceil((cash - down) / count) + 7 + v % 4, total = down + count * payment, value = (total - cash) / cash * 100;
    return numeric(`An item costs ${money(cash)} if paid in cash. An installment offer requires ${money(down)} upfront and ${count} monthly payments of ${money(payment)}. There are no other charges. What is the installment plan's total extra cost as a percentage of the cash price? This asks for total markup, not APR.`, value,
      [(total - cash) / (cash - down) * 100, total / cash * 100, (count * payment - cash) / cash * 100, (total - cash) / cash * 100 / count],
      `Installment total = ${money(down)} + ${count} × ${money(payment)} = ${money(total)}. Extra cost = ${money(total)} − ${money(cash)} = ${money(total - cash)}. Percentage extra = ${money(total - cash)}/${money(cash)} × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('currency-roundtrip-spread-loss', 'Payment and Currency Drills', 'medium', v => {
    const dollars = 500 + 75 * v, buyRate = .9 + .002 * v, sellRate = 1.07 - .002 * v, euros = dollars * buyRate, returned = euros * sellRate, value = dollars - returned;
    return numeric(`A traveler exchanges ${money(dollars)} at ${num(buyRate, 4)} euros per dollar, then immediately exchanges all those euros back at ${money(sellRate, 4)} per euro. Rates remain as stated, with no separate fees or rounding during conversion. How many dollars are lost in the round trip?`, value,
      [dollars * (1 - buyRate), dollars - dollars / buyRate * sellRate, returned, dollars - dollars * buyRate / sellRate],
      `Euros received = ${dollars} × ${num(buyRate, 4)} = ${num(euros, 4)}. Dollars returned = ${num(euros, 4)} × ${num(sellRate, 4)} = ${money(returned)}. Round-trip loss = ${money(dollars)} − ${money(returned)} = ${money(value)}.`);
  }),

  // Consumer Risk Drills — 8 families.
  f('insurance-deductible-payout-limit', 'Consumer Risk Drills', 'medium', v => {
    const loss = 4800 + 650 * v, deductible = 500 + 50 * v, limit = 6500 + 250 * v, value = Math.min(Math.max(loss - deductible, 0), limit);
    return numeric(`A hypothetical property policy covers a ${money(loss)} loss. The policy pays loss minus a ${money(deductible)} deductible, but its maximum insurer payout for this event is ${money(limit)}. There is no coinsurance or other exclusion. How much does the insurer pay?`, value,
      [loss - deductible, Math.min(loss, limit) - deductible, loss, Math.min(loss, limit), deductible, limit, loss - 2 * deductible],
      `Amount after deductible = ${money(loss)} − ${money(deductible)} = ${money(loss - deductible)}. Apply the payout cap: min(${money(loss - deductible)}, ${money(limit)}) = ${money(value)}.`);
  }),
  f('health-cost-sharing-out-of-pocket-cap', 'Consumer Risk Drills', 'hard', v => {
    const bill = 9000 + 850 * v, deductible = 1400 + 50 * v, share = 20 + v % 4 * 5, maximum = 3800 + 100 * v, uncap = deductible + (bill - deductible) * share / 100, value = Math.min(uncap, maximum);
    return numeric(`A hypothetical health plan has a ${money(deductible)} annual deductible, then ${pct(share)} patient coinsurance, with a ${money(maximum)} annual out-of-pocket maximum. No deductible or out-of-pocket costs have yet been paid this year. A single ${money(bill)} allowed bill is fully covered and in network; all deductible and coinsurance count toward the maximum. Ignoring premiums and other charges, how much does the patient pay?`, value,
      [uncap, bill * share / 100, Math.min(bill * share / 100, maximum), deductible + bill * share / 100, maximum + deductible],
      `Before the cap, patient cost = ${money(deductible)} + (${money(bill)} − ${money(deductible)}) × ${share}% = ${money(uncap)}. Apply the annual maximum: min(${money(uncap)}, ${money(maximum)}) = ${money(value)}.`);
  }),
  f('expected-uninsured-event-loss', 'Consumer Risk Drills', 'medium', v => {
    const probability = 2 + .3 * v, loss = 2500 + 350 * v, value = probability / 100 * loss;
    return numeric(`A hypothetical one-year model has a ${pct(probability)} chance of one uninsured loss of ${money(loss)} and otherwise no loss. No other outcomes occur. What is the expected dollar loss for the year?`, value,
      [loss, loss * (1 - probability / 100), loss / (probability / 100), probability],
      `Expected loss = probability × loss + probability of no loss × zero = (${num(probability, 1)}/100) × ${money(loss)} = ${money(value)}. This is a modeled average, not a guaranteed bill.`);
  }),
  f('warranty-break-even-probability', 'Consumer Risk Drills', 'medium', v => {
    const premium = 45 + 4 * v, repair = 360 + 25 * v, deductible = 30 + 2 * v, payout = repair - deductible, value = premium / payout * 100;
    return numeric(`A one-year warranty costs ${money(premium)}. If the only covered failure occurs, repair costs ${money(repair)} and the warranty pays that cost minus a ${money(deductible)} deductible. Otherwise it pays nothing. Assuming at most one failure, no other benefits or costs, and ignoring risk preferences, what failure probability makes expected payout equal the warranty price?`, value,
      [premium / repair * 100, premium / (repair + deductible) * 100, premium / deductible * 100, payout / premium * 100],
      `Covered payout if failure occurs = ${money(repair)} − ${money(deductible)} = ${money(payout)}. Set probability × ${money(payout)} = ${money(premium)}. Break-even probability = ${money(premium)}/${money(payout)} × 100 = ${pct(value, 2)}.`, percent);
  }),
  f('deductible-premium-expected-cost', 'Consumer Risk Drills', 'hard', v => {
    const premiumA = 860 + 22 * v, premiumB = premiumA - (180 + 4 * v), deductibleA = 300 + 20 * v, deductibleB = deductibleA + 700 + 30 * v, probability = 8 + v, value = (premiumB + probability / 100 * deductibleB) - (premiumA + probability / 100 * deductibleA);
    return numeric(`Policy A costs ${money(premiumA)} annually with a ${money(deductibleA)} deductible. Policy B costs ${money(premiumB)} with a ${money(deductibleB)} deductible. In a hypothetical one-year model there is a ${pct(probability)} chance of one covered loss large enough to exceed either deductible; otherwise no loss occurs. Both insurers pay all covered loss above their deductible with no limit. What is B's expected premium-plus-deductible cost minus A's?`, value,
      [premiumB - premiumA, deductibleB - deductibleA, premiumB + deductibleB - premiumA - deductibleA, -value],
      `Expected cost A = ${money(premiumA)} + ${probability}% × ${money(deductibleA)} = ${money(premiumA + probability / 100 * deductibleA)}. Expected cost B = ${money(premiumB)} + ${probability}% × ${money(deductibleB)} = ${money(premiumB + probability / 100 * deductibleB)}. B minus A = ${money(value)}. This arithmetic does not assess personal risk preferences.`);
  }),
  f('emergency-fund-income-gap-duration', 'Consumer Risk Drills', 'medium', v => {
    const savings = 7200 + 650 * v, essential = 2600 + 95 * v, benefits = 1100 + 35 * v, value = savings / (essential - benefits);
    return numeric(`During a hypothetical income interruption, essential spending is ${money(essential)} per month and a temporary benefit provides ${money(benefits)} per month throughout the interruption. Usable emergency savings are ${money(savings)}. Assume spending and benefits accrue evenly, no interest or other income, and no taxes. For how many months, including a fractional final month, can savings cover the remaining gap?`, value,
      [savings / essential, savings / benefits, savings / (essential + benefits), (savings + benefits) / essential],
      `Monthly gap = ${money(essential)} − ${money(benefits)} = ${money(essential - benefits)}. Duration = ${money(savings)} ÷ ${money(essential - benefits)} = ${num(value, 2)} months.`, decimal('months'));
  }),
  f('variable-rate-interest-payment-shock', 'Consumer Risk Drills', 'medium', v => {
    const principal = 18000 + 1800 * v, oldRate = 5.5 + .1 * v, newRate = oldRate + 2 + .1 * (v % 6), value = principal * (newRate - oldRate) / 100 / 12;
    return numeric(`An interest-only credit line has a constant ${money(principal)} balance. Its nominal annual rate rises from ${pct(oldRate)} to ${pct(newRate)}. The contract calculates each monthly payment as balance × annual rate/12, with no principal payment or other fees. How much does the monthly payment increase?`, value,
      [principal * newRate / 100 / 12, principal * oldRate / 100 / 12, principal * (newRate - oldRate) / 100, principal * (newRate - oldRate) / 100 / 365],
      `Monthly increase = ${money(principal)} × [(${num(newRate, 1)} − ${num(oldRate, 1)})/100] ÷ 12 = ${money(value)}. This follows the stated interest-only payment rule.`, { suffix: 'per month' });
  }),
  f('utilization-target-payment', 'Consumer Risk Drills', 'medium', v => {
    const limit = 4000 + 500 * v, balance = limit * (.52 + .01 * (v % 8)), target = 25 + v % 6, value = balance - limit * target / 100;
    return numeric(`A credit card has a ${money(limit)} limit and a reported balance of ${money(balance)}. The cardholder chooses a utilization target of ${pct(target)} of the limit. Assuming no new charges, interest, fees, or limit changes, what payment reduces the balance exactly to that target? The target is a personal assumption, not a promised credit-score threshold.`, value,
      [balance * target / 100, limit * target / 100, balance * (1 - target / 100), (limit - balance) * target / 100],
      `Target balance = ${money(limit)} × ${target}% = ${money(limit * target / 100)}. Required payment = ${money(balance)} − ${money(limit * target / 100)} = ${money(value)}.`);
  }),
];
