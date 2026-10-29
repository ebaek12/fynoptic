import {
  rewrite as R,
  replaceContext as C,
  m,
  n,
  p,
} from "./rewrite-helpers.mjs";
export const practice = {};
const set = (id, fn) => (practice[id] = fn);
// The central-bank and regulatory schedules below are explicitly hypothetical.
set("cash-overtime-gross-pay", (v, o) => {
  let r = 18 + 0.5 * v,
    h = 43 + (v % 8);
  return R(
    o,
    `In a hypothetical central-bank reserve-remuneration schedule, the first $40,000 of a bank's constant annual reserve balance earns ${m(r)} per $1,000; each additional $1,000 earns 1.5 times that amount. Its balance is ${m(h * 1000)}. With no fees or compounding, how much annual reserve interest is credited?`,
    (a) =>
      `The first tier earns 40 × ${m(r)}. The remaining ${h - 40} thousand dollars earn ${m(r * 1.5)} each. Total reserve interest = 40 × ${m(r)} + ${h - 40} × ${m(r * 1.5)} = ${a}.`,
  );
});
set("cash-paycheck-deductions", (v, o) => {
  let d = 1600 + 85 * v,
    c = 16 + (v % 5),
    r = 4 + (v % 3),
    b = 65 + 3 * v;
  return R(
    o,
    `In a simplified monetary-expansion exercise, a bank receives ${m(d)} in new deposits. Customers withdraw ${p(c)} of the original deposit amount as currency; the bank separately retains ${p(r)} of the original amount as reserves plus a ${m(b)} liquidity buffer. Assuming no other constraints, how much of the inflow remains available to lend?`,
    (a) =>
      `All percentage amounts use the original inflow: ${m(d)} − ${m((d * c) / 100)} − ${m((d * r) / 100)} − ${m(b)} = ${a}. This is the stated simplified balance-sheet model, not a claim that lending mechanically follows a fixed multiplier.`,
  );
});
set("cash-biweekly-monthly-income", (v, o) => {
  let x = 1250 + 65 * v;
  return R(
    o,
    `A central bank purchases ${m(x)} of securities every two weeks and makes exactly 26 purchases in one year. It sells none and all purchases settle. What is the average monthly addition to its securities portfolio over 12 months?`,
    (a) =>
      `Annual purchases are 26 × ${m(x)}. Divide by 12 to express the annual portfolio addition as a monthly average: ${a}.`,
  );
});
set("cash-tiered-sales-commission", (v, o) => {
  let cash = 1600 + 30 * v,
    t = 10000 + 200 * v,
    d = t + 4000 + 350 * v,
    r = 6 + (v % 3);
  return R(
    o,
    `In a hypothetical reserve system, currency held outside banks is ${m(cash)}. Banks hold required reserves of 3% on the first ${m(t)} of deposits and ${p(r)} on deposits above that amount. Total deposits are ${m(d)}, with no excess reserves. What is the monetary base, defined here as currency plus bank reserves?`,
    (a) =>
      `Required reserves = ${m(t)} × 3% + (${m(d)} − ${m(t)}) × ${p(r)}. Add ${m(cash)} of currency to obtain a monetary base of ${a}.`,
  );
});
set("cash-irregular-income-average", (v, o) => {
  let a = 1600 + 45 * v,
    b = 2300 + 55 * v,
    c = 1900 + 35 * v,
    once = 450 + 15 * v;
  return R(
    o,
    `Central-bank asset purchases over three months were ${m(a)}, ${m(b)}, and ${m(c)}. The second month included an exceptional ${m(once)} purchase outside the regular program. Excluding that purchase, what was the average monthly purchase amount under the regular program?`,
    (ans) =>
      `Subtract the exceptional operation once, then average: (${m(a)} + ${m(b)} + ${m(c)} − ${m(once)}) ÷ 3 = ${ans}.`,
  );
});
set("cash-cash-flow-timing-buffer", (v, o) => {
  let start = 180 + 8 * v,
    early = 650 + 20 * v,
    add = 1450 + 40 * v,
    late = 500 + 10 * v;
  return R(
    o,
    `A bank starts with ${m(start)} in its central-bank settlement account. A ${m(early)} payment settles on day 2, a ${m(add)} reserve injection arrives on day 5, and a ${m(late)} payment settles on day 8. No other flows occur. What minimum additional opening reserves keep the account nonnegative throughout?`,
    (a) =>
      `The binding shortfall comes before the injection: ${m(early)} − ${m(start)} = ${a}. The day-5 injection is sufficient for the later payment, so later net inflows cannot remove the need for the earlier reserve buffer.`,
  );
});
set("cash-raise-net-increase", (v, o) => {
  let b = 42000 + 1800 * v,
    g = 3 + (v % 6),
    c = 21 + (v % 4);
  return R(
    o,
    `A central bank increases its ${m(b)} securities portfolio by ${p(g)} over one year, paying with newly created reserves. Assume ${p(c)} of that increase is subsequently converted from reserves into currency, with no other changes. What is the average monthly increase in reserves remaining in banks?`,
    (a) =>
      `New reserves before conversion are ${m(b)} × ${p(g)}. Retain ${100 - c}% in reserve form and divide by 12: ${m(b)} × ${g}/100 × (1 − ${c}/100) ÷ 12 = ${a}. Currency conversion changes the composition, rather than eliminating the monetary base.`,
  );
});
set("cash-gig-profit-tax-reserve", (v, o) => {
  let dep = 2200 + 95 * v,
    w = 540 + 25 * v,
    r = 22 + (v % 5);
  return R(
    o,
    `A simplified banking model has deposit inflows of ${m(dep)} and withdrawals of ${m(w)}. A hypothetical policy requires the bank to retain ${p(r)} of the net inflow as reserves. With no other changes or lending constraints, how much of the net inflow is left for new loans?`,
    (a) =>
      `Net inflow = ${m(dep)} − ${m(w)}. Under the specified model, multiply that amount by (1 − ${r}/100) to obtain ${a} available after the reserve allocation.`,
  );
});
set("cash-effective-hourly-with-commute", (v, o) => {
  let gross = 680 + 32 * v,
    reb = 45 + 3 * v,
    a = 35 + (v % 6),
    b = 5 + (v % 4);
  return R(
    o,
    `A hypothetical central-bank lending facility collects ${m(gross)} in interest and returns ${m(reb)} in rebates over one period. There are ${a} continuing borrowers and ${b} new borrowers, all included in the period's count. What is the average net interest cost per participating bank?`,
    (ans) =>
      `Net interest receipts = ${m(gross)} − ${m(reb)}. Divide by all ${a + b} participating banks: (${m(gross)} − ${m(reb)}) ÷ (${a} + ${b}) = ${ans}.`,
    { suffix: "per bank" },
  );
});
set("cash-zero-based-discretionary-budget", (v, o) => {
  let t = 3200 + 110 * v,
    a = 1700 + 45 * v,
    b = 650 + 20 * v,
    c = 350 + 15 * v;
  return R(
    o,
    `Under a hypothetical broker compliance plan, ${m(t)} of eligible capital must cover ${m(a)} of minimum capital, ${m(b)} of additional position requirements, and a ${m(c)} internal buffer. These requirements do not overlap. How much capital remains above all three allocations?`,
    (ans) =>
      `Subtract each separately specified requirement once: ${m(t)} − ${m(a)} − ${m(b)} − ${m(c)} = ${ans}. Actual regulatory capital rules require additional definitions and adjustments; this exercise uses only the stated requirements.`,
  );
});
set("cash-needs-share-room", (v, o) => {
  let t = 3000 + 125 * v,
    c = 45 + (v % 6),
    x = 1000 + 40 * v;
  return R(
    o,
    `A hypothetical exchange limits a member's exposure in one product to ${p(c)} of its ${m(t)} eligible capital. Existing exposure in that product is ${m(x)}. Ignoring other limits, what additional dollar exposure remains available under this rule?`,
    (a) =>
      `The stated ceiling is ${m(t)} × ${p(c)}. Subtract existing exposure ${m(x)} to obtain ${a} of remaining capacity.`,
  );
});
set("cash-irregular-bills-monthly-reserve", (v, o) => {
  let a = 420 + 18 * v,
    b = 150 + 7 * v,
    c = 260 + 11 * v;
  return R(
    o,
    `A hypothetical securities exchange charges a member ${m(a)} annually for registration, ${m(b)} each quarter for market access, and ${m(c)} twice yearly for examinations. Assuming all fees apply and ignoring interest, what equal monthly compliance-cost reserve funds one year?`,
    (ans) =>
      `Annual charges are ${m(a)} + 4 × ${m(b)} + 2 × ${m(c)}. Divide by 12 to reserve ${ans} per month.`,
  );
});
set("cash-weekly-spending-monthly-equivalent", (v, o) => {
  let w = 95 + 6 * v,
    mth = 35 + 2 * v;
  return R(
    o,
    `Under a hypothetical exchange fee schedule, a member pays ${m(w)} per week for required trade-reporting access and ${m(mth)} monthly for a surveillance assessment. Using exactly 52 weeks and 12 months per year, what is the average monthly total?`,
    (a) =>
      `Annual reporting charges are 52 × ${m(w)}. Spread them over 12 months, then add the monthly assessment: ${m(w)} × 52 ÷ 12 + ${m(mth)} = ${a}.`,
  );
});
set("cash-budget-overrun-percentage", (v, o) => {
  let ref = 320 + 15 * v,
    now = ref + 55 + 4 * v;
  return R(
    o,
    `To evaluate an exchange's hypothetical price-band alert, compare a stock's ${m(now)} trade price with its ${m(ref)} reference price. What percentage increase from the reference price should the surveillance calculation report?`,
    (a) =>
      `The reference price is the denominator: (${m(now)} − ${m(ref)}) ÷ ${m(ref)} × 100 = ${a}. Whether that move triggers an alert depends on the separately specified exchange rule.`,
  );
});
set("cash-required-flexible-spending-cut", (v, o) => {
  let need = 150 + 8 * v,
    done = 35 + v,
    pos = 520 + 20 * v;
  return R(
    o,
    `A hypothetical compliance instruction requires ${m(need)} less market exposure. Closing one position has already reduced exposure by ${m(done)}. The remaining reduction must come entirely from a separate ${m(pos)} position. What percentage of that position must be closed?`,
    (a) =>
      `Remaining reduction = ${m(need)} − ${m(done)}. Divide by the separate position's ${m(pos)} exposure and multiply by 100: ${a}.`,
  );
});
set("cash-proportional-shared-bills", (v, o) => {
  let a = 2600 + 90 * v,
    b = 1800 + 50 * v,
    t = 1650 + 55 * v;
  return R(
    o,
    `A hypothetical market-oversight assessment of ${m(t)} is allocated between two exchange members in proportion to their eligible transaction revenues of ${m(a)} and ${m(b)}. What assessment does the first member owe?`,
    (ans) =>
      `The first member's allocation weight is ${m(a)} ÷ (${m(a)} + ${m(b)}). Multiply that weight by ${m(t)} to obtain ${ans}.`,
  );
});
set("cash-weighted-price-increase-budget", (v, o) => {
  let a = 450 + 15 * v,
    b = 130 + 7 * v,
    c = 850 + 20 * v,
    ar = 4 + (v % 4),
    br = 9 + (v % 6);
  return R(
    o,
    `A clearinghouse's hypothetical margin schedule currently requires ${m(a)} for Position A, ${m(b)} for Position B, and an unchanged ${m(c)} base deposit. It raises A's requirement by ${p(ar)} and B's by ${p(br)}, with positions unchanged. What is the new total required collateral?`,
    (ans) =>
      `Apply each change only to its margin component: ${m(a)} × (1 + ${ar}/100) + ${m(b)} × (1 + ${br}/100) + ${m(c)} = ${ans}.`,
  );
});
set("cash-subscription-break-even-use", (v, o) => {
  let monthly = 18 + v,
    annual = monthly * (7 + (v % 3)) + 5;
  return R(
    o,
    `An exchange offers the same required market-data access at ${m(monthly)} per active month or ${m(annual)} for a nonrefundable annual license. Monthly access can end without a fee. Ignoring interest, what is the smallest whole number of active months for which the annual license is strictly cheaper?`,
    (a) =>
      `The annual license wins only when months × ${m(monthly)} > ${m(annual)}. Divide, then take the first whole number strictly above the quotient: ${a}.`,
  );
});
// Fixed-income issuer/holder contexts retain each original debt calculation.
for (const id of [
  "amortizing-loan-payment",
  "first-payment-principal",
  "scheduled-loan-total-financing-cost",
  "debt-payment-capacity",
  "refinance-fee-recovery-months",
  "extra-principal-next-interest",
])
  set("cash-" + id, (v, o) =>
    C(o, [
      [
        "A fixed-rate loan advances",
        "A hypothetical amortizing bond is issued at par for",
      ],
      ["charges a nominal", "pays a nominal"],
      ["A loan starts", "An amortizing bond starts"],
      [
        "You receive a",
        "An issuer sells a hypothetical amortizing bond at par for",
      ],
      [" loan and make exactly", " and makes exactly"],
      ["origination fee", "issuance fee"],
      ["amount borrowed", "face amount issued"],
      [
        "For this exercise, a lender caps",
        "For this exercise, a hypothetical bond covenant caps",
      ],
      ["gross monthly income", "monthly operating cash inflow"],
      ["housing debt payments", "secured-debt payments"],
      ["monthly loan payment", "monthly bond payment"],
      ["Both loans", "The old and new bond issues"],
      [
        "Refinancing changes a payment",
        "Refinancing a bond changes its required payment",
      ],
      ["a loan has", "an amortizing bond has"],
      ["You make an extra", "The issuer makes an extra"],
      ["saved next month", "less interest paid next month"],
    ]),
  );
set("cash-loan-net-proceeds-gross-up", (v, o) => {
  let need = 3500 + 230 * v,
    discount = 2 + (v % 5) * 0.5;
  return R(
    o,
    `An issuer needs ${m(need)} from selling a short-term discount note. Investors pay face value minus a discount of ${p(discount)} of face value, with no fees. What face amount must the note have to provide the required issue proceeds?`,
    (a) =>
      `Issue proceeds = face amount × (1 − ${discount}/100). Face amount = ${m(need)} ÷ (1 − ${discount}/100) = ${a}. The discount is measured against face value, not against issue proceeds.`,
  );
});
// Deposit products used for short-term cash management, rather than stock investments.
set("cash-maintenance-fee-waiver-count", (v, o) =>
  C(o, [["A checking account", "A hypothetical money market deposit account"]]),
);
set("cash-tiered-bank-interest", (v, o) =>
  C(o, [
    ["An account holds", "A hypothetical money market deposit account holds"],
  ]),
);
set("cash-interest-fee-break-even-balance", (v, o) =>
  C(o, [
    ["Account A", "Money market deposit account A"],
    ["Account B", "Money market deposit account B"],
  ]),
);
set("cash-net-bank-return-percentage", (v, o) =>
  C(o, [
    ["A $", "A $"],
    ["deposit earns", "money market deposit account earns"],
  ]),
);
// Derivative contracts: amounts and schedules are hypothetical contract terms, not current market rules.
set("invest-sale-price-sales-tax", (v, o) => {
  let x = 80 + 7 * v,
    d = 10 + (v % 5) * 5,
    t = 5 + (v % 4) * 0.5;
  return R(
    o,
    `A quoted option premium is ${m(x)} per contract. A negotiated trade reduces that premium by ${p(d)}, and a hypothetical venue charges a transaction fee of ${p(t)} of the actual premium paid. With no other costs, what is the all-in cost for one contract?`,
    (a) =>
      `Apply the reduction first, then the percentage fee to the reduced premium: ${m(x)} × (1 − ${d}/100) × (1 + ${t}/100) = ${a}.`,
  );
});
set("invest-successive-discount-equivalent", (v, o) => {
  let a = 12 + v,
    b = 5 + (v % 8);
  return R(
    o,
    `An option's premium falls ${p(a)} during one period and then ${p(b)} of its reduced value in the next. With no other changes, what percentage decline from the original premium do the two periods produce?`,
    (ans) =>
      `Retain (1 − ${a}/100)(1 − ${b}/100) of the original premium. The total percentage loss is [1 − (1 − ${a}/100)(1 − ${b}/100)] × 100 = ${ans}.`,
  );
});
set("invest-coupon-tax-order", (v, o) => {
  let x = 110 + 9 * v,
    t = 6 + (v % 4),
    c = 12 + v;
  return R(
    o,
    `An options order has a ${m(x)} premium and a ${m(c)} promotional credit. Broker A applies the credit before charging a hypothetical ${p(t)} commission on the remaining premium. Broker B calculates that commission on the full premium, then applies the credit. What is Broker B's total cost minus Broker A's?`,
    (a) =>
      `A costs (${m(x)} − ${m(c)}) × (1 + ${t}/100); B costs ${m(x)} × (1 + ${t}/100) − ${m(c)}. The difference is ${m(c)} × ${t}/100 = ${a}.`,
  );
});
set("invest-unit-price-weight-conversion", (v, o) => {
  let oz = 18 + 2 * v,
    x = 3.45 + 0.31 * v;
  return R(
    o,
    `A commodity reference used to settle a hypothetical derivative is quoted at ${m(x)} for ${oz} ounces. The contract requires a price in dollars per pound, and 16 ounces equal one pound. What equivalent price should be used?`,
    (a) =>
      `Convert the quote's quantity to pounds: ${oz}/16. Dollars per pound = ${m(x)} ÷ (${oz}/16) = ${a}.`,
    { suffix: "per pound" },
  );
});
set("invest-reverse-taxed-sale-price", (v, o) => {
  let x = 120 + 20 * v,
    paid = x * 0.8 * 1.05;
  return R(
    o,
    `A hypothetical option trade pays ${m(paid)} in total after a 20% reduction from the original quoted premium and a 5% commission on the reduced premium. No other charges apply. What was the original quoted premium?`,
    (a) =>
      `The total is original premium × 0.80 × 1.05. Undo both factors: ${m(paid)} ÷ (0.80 × 1.05) = ${a}.`,
  );
});
set("invest-bundle-free-items-effective-cost", (v, o) => {
  let x = 4.25 + 0.35 * v,
    b = 2 + (v % 3),
    f = 1 + (v % 2);
  return R(
    o,
    `An options broker's hypothetical promotion waives the per-contract commission on ${f} contracts when ${b} contracts are billed at ${m(x)} each. An order qualifies for exactly one complete group. Ignoring premiums and all other fees, what is average commission per contract in the group?`,
    (a) =>
      `Total commission = ${b} × ${m(x)}. Divide by all ${b + f} contracts, including the waived contracts: ${a}.`,
    { suffix: "per contract" },
  );
});
// Preserve the original payout algebra while replacing insurance with actual derivative payoffs.
set("cash-insurance-deductible-claim-payment", (v, o) => {
  let s = 2800 + 240 * v,
    k = 500 + 50 * v,
    w = 2000 + 175 * v + 400 * (v % 3);
  return R(
    o,
    `A hypothetical cash-settled bull call spread has lower strike ${m(k)} and upper strike ${m(k + w)}. The underlying settlement value is ${m(s)}. Each option has a multiplier of 1. Ignoring premiums, tax, and fees, what is the spread's expiration payoff?`,
    (a) =>
      `A bull call spread pays min(max(S − lower strike, 0), upper strike − lower strike). Here that is min(max(${m(s)} − ${m(k)}, 0), ${m(w)}) = ${a}.`,
  );
});
set("invest-insurance-deductible-payout-limit", (v, o) => {
  let loss = 4800 + 650 * v,
    d = 500 + 50 * v,
    lim = 6500 + 250 * v;
  return R(
    o,
    `A hypothetical cash-settled bull call spread holds a long call at lower strike ${m(d)}, a short call at upper strike ${m(d + lim)}, and underlying settlement value ${m(loss)}. The multiplier is 1. Ignoring premiums and fees, what is the expiration payoff?`,
    (a) =>
      `The payoff is min(max(${m(loss)} − ${m(d)}, 0), ${m(lim)}). The lower strike must be exceeded and the spread width caps the payoff, giving ${a}.`,
  );
});
set("invest-expected-uninsured-event-loss", (v, o) => {
  let prob = 2 + 0.3 * v,
    amt = 2500 + 350 * v;
  return R(
    o,
    `A hypothetical binary option pays ${m(amt)} if a stated event occurs at expiration and zero otherwise. You assign a ${p(prob)} probability to that event. What is expected gross payoff, before any option premium, discounting, tax, or fees? This is a probability-weighted payoff, not a market-price estimate.`,
    (a) =>
      `Expected payoff = ${prob}/100 × ${m(amt)} + (1 − ${prob}/100) × $0 = ${a}.`,
  );
});
set("invest-warranty-break-even-probability", (v, o) => {
  let premium = 45 + 4 * v,
    pay = 360 + 25 * v,
    fee = 30 + 2 * v;
  return R(
    o,
    `A hypothetical binary option costs ${m(premium)}. If its event occurs it pays ${m(pay)}, with a ${m(fee)} settlement charge deducted; otherwise it pays nothing and no charge applies. Ignoring discounting and risk preferences, what event probability makes expected settlement proceeds after the settlement charge equal the purchase premium?`,
    (a) =>
      `Net event payoff = ${m(pay)} − ${m(fee)}. Solve probability × net event payoff = ${m(premium)}: probability = ${m(premium)} ÷ (${m(pay)} − ${m(fee)}) × 100 = ${a}.`,
  );
});
set("cash-monthly-compound-savings", (v, o) =>
  C(o, [
    [
      "in an account with",
      "in a hypothetical money market deposit account with",
    ],
  ]),
);
set("cash-simple-interest-required-deposit", (v, o) =>
  C(o, [["A savings product", "A hypothetical money market deposit account"]]),
);
set("cash-fund-withdrawal-recovery", (v, o) =>
  C(o, [
    [
      "A no-interest reserve",
      "A cash management account's no-interest bank balance",
    ],
    ["final reserve balance", "final bank balance"],
  ]),
);
set("invest-two-period-cumulative-return", (v, o) =>
  C(o, [["An investment", "A stock holding"]]),
);
set("invest-drawdown-recovery-return", (v, o) =>
  C(o, [["An investment", "A stock holding"]]),
);
set("invest-variable-rate-interest-payment-shock", (v, o) =>
  C(o, [
    [
      "An interest-only credit line",
      "In a hypothetical monetary-policy transmission exercise, an interest-only credit line",
    ],
    [
      "Its nominal annual rate rises",
      "Assume its rate moves one-for-one with a policy-linked benchmark. Its nominal annual rate rises",
    ],
  ]),
);
