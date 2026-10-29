import {
  rewrite as R,
  replaceContext as C,
  m,
  n,
  p,
} from "./rewrite-helpers.mjs";
export const flash = {};
const set = (id, fn) => (flash["econ-drill-" + id] = fn);
// Personal decisions, rather than aggregate production frontiers.
set("linear-ppf-unit-cost", (v, o) => {
  let trips = 24 + v,
    cost = 3 * trips + 12 + v;
  return R(
    o,
    `You are comparing the operating costs of a car. Across ${trips} identical trips, parking and tolls total ${m(cost)}. Excluding fuel, maintenance, and all other costs, what is average parking-and-toll cost per trip?`,
    (a) =>
      `Divide the included total by the number of trips: ${m(cost)} ÷ ${trips} = ${a}. This does not represent the car's full ownership cost.`,
    { style: "money", suffix: "per trip" },
  );
});
set("ppf-segment-sacrifice", (v, o) => {
  let before = 12 + v,
    extra = 4 + (v % 4),
    old = 160 + 7 * v,
    add = 18 + 2 * v;
  return R(
    o,
    `Your car-use plan changes from ${before} trips to ${before + extra} trips, raising the total budgeted parking cost from ${m(old - add)} to ${m(old)}. What is the average additional parking cost per extra trip?`,
    (a) =>
      `Use changes rather than total averages: (${m(old)} − ${m(old - add)}) ÷ (${before + extra} − ${before}) = ${a}.`,
    { style: "money", suffix: "per extra trip" },
  );
});
set("specialization-trade-gain", (v, o) => {
  let count = 5 + v,
    home = 4 + (v % 3),
    service = 2 + (v % 2) * 0.5;
  return R(
    o,
    `Washing your car at home uses ${m(home)} of supplies and water each time. A self-service station charges ${m(service)} per wash, including all supplies. Ignoring time and travel costs, how much would the station save over ${count} washes?`,
    (a) =>
      `Savings per wash = ${m(home)} − ${m(service)}. Multiply by ${count} washes to obtain ${a}.`,
    { style: "money", suffix: "" },
  );
});
set("sunk-cost-continuation", (v, o) =>
  C(o, [
    ["A prototype has already cost", "A car restoration has already cost"],
    ["Finishing it costs", "Finishing the restoration costs"],
    ["Abandoning it now yields", "Selling the unfinished car now yields"],
    ["in salvage", "as-is"],
    ["finishing instead of abandoning", "finishing instead of selling as-is"],
    ["Finishing rather than abandoning", "Finishing rather than selling as-is"],
  ]),
);
set("marginal-product-labor", (v, o) => {
  let h = 5 + v,
    dh = 2 + (v % 3),
    q = 130 + 18 * v,
    dq = 38 + 6 * v;
  return R(
    o,
    `For your paid packing side job, increasing work from ${h} to ${h + dh} hours increases completed packages from ${q} to ${q + dq}, with equipment unchanged. What is the average number of extra packages completed per additional work hour?`,
    (a) =>
      `Additional packages divided by additional time = (${q + dq} − ${q}) ÷ (${h + dh} − ${h}) = ${a}. This is the incremental productivity relevant to comparing the extra work, not total output divided by total hours.`,
    { suffix: "packages per extra hour" },
  );
});
set("average-product-labor", (v, o) => {
  let hours = 8 + v,
    earn = 205 + 29 * v;
  return R(
    o,
    `A freelance assignment pays ${m(earn)} before expenses and takes ${hours} hours in total. With no additional compensation, what is average gross earnings per work hour?`,
    (a) =>
      `Gross hourly earnings = ${m(earn)} ÷ ${hours} = ${a}. Deducting expenses or adding unpaid preparation time would change take-home earnings per hour.`,
    { style: "money", suffix: "per hour" },
  );
});
set("marginal-cost-increment", (v, o) => {
  let q = 80 + 4 * v,
    dq = 10 + (v % 4),
    c = 1500 + 87 * v,
    dc = 180 + 19 * v;
  return R(
    o,
    `A training provider quotes ${m(c)} for a ${q}-hour program and ${m(c + dc)} for a ${q + dq}-hour program, with identical terms otherwise. What is the average extra tuition per additional instruction hour?`,
    (a) =>
      `Compare the differences: (${m(c + dc)} − ${m(c)}) ÷ (${q + dq} − ${q}) = ${a} per additional instruction hour.`,
  );
});
set("average-total-cost", (v, o) => {
  let fixed = 840 + 55 * v,
    rate = 9 + (v % 6),
    h = 70 + 3 * v;
  return R(
    o,
    `A college training course charges a one-time ${m(fixed)} enrollment fee plus ${m(rate)} per instruction hour. You take ${h} hours. Excluding books and other costs, what is average total course cost per instruction hour?`,
    (a) =>
      `Total tuition is ${m(fixed)} + ${m(rate)} × ${h}. Divide by ${h} hours: fixed fee per hour plus hourly charge = ${a}.`,
  );
});
set("recover-fixed-cost", (v, o) => {
  let q = 120 + 7 * v,
    variable = 14 + (v % 5),
    fixedPer = 6 + (v % 4);
  return R(
    o,
    `Across a ${q}-hour training program, average total tuition is ${m(variable + fixedPer)} per hour. The variable instruction charge is ${m(variable)} per hour; all remaining tuition is a one-time enrollment fee. What is that fixed fee?`,
    (a) =>
      `Average fixed charge = ${m(variable + fixedPer)} − ${m(variable)} = ${m(fixedPer)} per hour. Multiply by ${q} hours to recover the one-time fee: ${a}.`,
  );
});
set("cobb-douglas-output", (v, o) =>
  C(o, [
    [
      "A production model is",
      "For planning your home craft side gig, the supplied output model is",
    ],
    ["capital services K", "equipment-service units K"],
    ["labor services L", "work-time units L"],
    [
      "what output does the model predict",
      "how many finished items does this model predict",
    ],
    ["units.", "items."],
  ]),
);
set("competitive-labor-hiring", (v, o) => {
  let a = 55 + 2 * v,
    b = 2 + (v % 3),
    price = 8 + (v % 4),
    w = 72 + 3 * v;
  return R(
    o,
    `For your side business, an additional work hour produces MPL = ${a} − ${b}H items when total work time is H hours. Each item sells for ${m(price)}; the opportunity cost of an hour is ${m(w)}. Ignore other costs, allow fractional hours, and assume an interior optimum. At what H does the value of the next hour's output equal its opportunity cost?`,
    (ans) =>
      `Set ${m(price)} × (${a} − ${b}H) = ${m(w)}. Solving gives H = (${a} − ${w}/${price}) ÷ ${b} = ${ans}. Beyond this point the assumed value of marginal output is below the time cost.`,
    { suffix: "hours" },
  );
});
set("scale-cost-elasticity", (v, o) =>
  C(o, [
    ["A plant's output", "Your annual paid work time"],
    ["long-run total cost", "annual work-related costs"],
    [
      "cost elasticity with respect to output",
      "ratio of the percentage cost increase to the percentage increase in paid work time",
    ],
    ["units", "hours"],
  ]),
);
set("linear-market-clearing-price", (v, o) => {
  let a = 190 + 11 * v,
    b = 3 + (v % 3),
    c = 22 + 2 * v,
    d = 2 + (v % 4);
  return R(
    o,
    `Two no-interest savings balances follow a stated continuous cash-flow model: Account A starts at ${m(a)} and falls ${m(b)} per month; Account B starts at ${m(c)} and rises ${m(d)} per month. No fees apply. After how many months, allowing a fractional month, will the balances be equal?`,
    (ans) =>
      `Set ${a} − ${b}t = ${c} + ${d}t. The initial gap closes at ${m(b + d)} per month, so t = (${a} − ${c}) ÷ (${b} + ${d}) = ${ans}.`,
    { style: "number", suffix: "months" },
  );
});
set("demand-shift-quantity-effect", (v, o) => {
  let debt = 2 + (v % 3),
    save = 3 + (v % 4),
    extra = 24 + 3 * v;
  return R(
    o,
    `You receive an extra ${m(extra)} and divide it between debt repayment and savings in the ratio ${debt}:${save}. Both shares use the entire extra receipt, with no fees. How much goes to savings?`,
    (a) =>
      `There are ${debt + save} total ratio parts, of which ${save} go to savings. Savings = ${m(extra)} × ${save} ÷ (${debt} + ${save}) = ${a}.`,
    { style: "money", suffix: "" },
  );
});
set("binding-ceiling-shortage", (v, o) => {
  let income = 240 + 12 * v,
    fixed = 30 + v,
    days = 20 + v;
  return R(
    o,
    `Your transit-and-meal budget for a travel period is ${m(income)}. You pay a fixed ${m(fixed)} pass fee, plus ${m(3)} for transit and ${m(2)} for snacks on each of ${days} travel days. Assuming these are the only costs, how much remains?`,
    (a) =>
      `Remaining budget = ${m(income)} − ${m(fixed)} − ${days} × (${m(3)} + ${m(2)}) = ${a}.`,
    { style: "money", suffix: "" },
  );
});
set("binding-floor-surplus", (v, o) => {
  let budget = 220 + 9 * v,
    fee = 20 + v,
    units = 50 + 2 * v;
  return R(
    o,
    `A project budget is ${m(budget)}. The project requires ${units} identical supply sets, each with a ${m(2)} material charge and a ${m(3)} service charge, plus a one-time ${m(fee)} fee. By how much do total costs exceed the budget?`,
    (a) =>
      `Cost minus budget = ${units} × (${m(2)} + ${m(3)}) + ${m(fee)} − ${m(budget)} = ${a}.`,
    { style: "money", suffix: "" },
  );
});
set("midpoint-demand-elasticity", (v, o) =>
  C(o, [
    [
      "When price rises",
      "In your household shopping records, the price of an item rises",
    ],
    ["quantity demanded falls", "the quantity purchased falls"],
    [
      "absolute price elasticity of demand using the midpoint method",
      "ratio of the absolute midpoint percentage change in quantity purchased to the midpoint percentage change in price",
    ],
  ]),
);
set("cross-price-elasticity", (v, o) =>
  C(o, [
    [
      "Holding other factors fixed, a",
      "In a household transport-budget model, holding other factors fixed, a",
    ],
    ["rail travel", "driving"],
    ["bus trips demanded", "bus trips taken"],
    [
      "bus demand's cross-price elasticity with respect to the rail price",
      "the ratio of the percentage change in bus trips to the percentage change in driving cost",
    ],
    ["rail price", "driving cost"],
  ]),
);
set("income-elasticity-forecast", (v, o) => {
  let q = 400 + 17 * v,
    e = 0.6 + 0.05 * v,
    g = 3 + (v % 5);
  return R(
    o,
    `You currently spend ${m(q)} a month on discretionary purchases. For a hypothetical budget forecast, each 1% increase in take-home income raises this spending by ${n(e, 2)}%. Income rises ${p(g)} and nothing else changes. What monthly discretionary spending does that model predict?`,
    (a) =>
      `Predicted spending growth = ${n(e, 2)} × ${g}%. Apply it to the original ${m(q)}: ${m(q)} × [1 + (${n(e, 2)} × ${g}/100)] = ${a}.`,
    { style: "money", suffix: "" },
  );
});
set("linear-consumer-surplus", (v, o) => {
  let a = 65 + 3 * v,
    b = 0.5 + 0.1 * (v % 3),
    price = 25 + v;
  return R(
    o,
    `For a hypothetical college tutoring decision, your marginal willingness to pay for hour Q is ${a} − ${n(b, 1)}Q dollars. Tutoring costs ${m(price)} per hour, and fractional hours are allowed. If you buy until marginal benefit equals price, what is total willingness to pay above the amount paid (consumer surplus)?`,
    (ans) =>
      `Chosen hours = (${a} − ${price})/${n(b, 1)}. Surplus is the triangle between willingness to pay and price: ½ × (${a} − ${price}) × [(${a} − ${price})/${n(b, 1)}] = ${ans}.`,
  );
});
set("linear-monopoly-output", (v, o) =>
  C(o, [
    [
      "A single-price monopolist faces",
      "Your side business uses the hypothetical price-demand model",
    ],
    [
      "and constant marginal cost of",
      "with constant materials and other variable cost of",
    ],
    [
      "what quantity maximizes profit",
      "how many items maximize the modeled profit",
    ],
    ["units", "items"],
  ]),
);
set("monopoly-deadweight-loss", (v, o) => {
  let intercept = 100 + 4 * v,
    b = 1 + (v % 3),
    base = 20 + v,
    duration = (intercept - base) / (2 * b),
    endRate = (intercept - base) / 2;
  return R(
    o,
    `In a continuous savings model, your deposit rate rises evenly from $0 per month today to ${m(endRate)} per month after exactly (${intercept} − ${base}) ÷ ${2 * b} months. There is no interest or withdrawal. What total amount is deposited during that interval? Use the area under the straight-line deposit-rate graph.`,
    (a) =>
      `For a line rising from zero, total deposits equal ½ × duration × final monthly rate: ½ × [(${intercept} − ${base})/${2 * b}] × ${m(endRate)} = ${a}. The duration is ${n(duration, 4)} months; do not round it before multiplying.`,
  );
});
set("herfindahl-market-shares", (v, o) => {
  let weights = [40 + v, 30 - Math.floor(v / 2), 20 - Math.ceil(v / 2), 10];
  return R(
    o,
    `Your four investment holdings have portfolio weights ${weights.join("%, ")}%. To summarize concentration, define an index as the sum of squared percentage weights, using percentages such as 40 rather than decimals such as 0.40. What is the index?`,
    (a) =>
      `Square each weight and add: ${weights.map((x) => x + "²").join(" + ")} = ${a}. A higher value under this definition indicates more concentrated weights; it does not measure every type of investment risk.`,
    { suffix: "concentration points" },
  );
});
set("four-firm-concentration", (v, o) => {
  let amounts = [
    220 + 9 * v,
    170 + 7 * v,
    130 + 5 * v,
    90 + 4 * v,
    65 + 2 * v,
    40 + v,
  ];
  return R(
    o,
    `Your only six monthly budget categories are ${amounts.map(m).join(", ")}. What percentage of the total is accounted for by the four largest categories?`,
    (a) =>
      `Add the four largest amounts and divide by the sum of all six: (${amounts.slice(0, 4).join(" + ")}) ÷ (${amounts.join(" + ")}) × 100 = ${a}.`,
  );
});
set("lerner-markup", (v, o) => {
  let ratio = 1.8 + 0.15 * v;
  return R(
    o,
    `Your monthly take-home income is exactly ${n(ratio, 2)} times your monthly debt payment. Using take-home income as the denominator, what percentage of that income goes to the payment? This is a budget ratio, not a lender's approval rule.`,
    (a) =>
      `If income/payment = ${n(ratio, 2)}, then payment/income = 1/${n(ratio, 2)}. Multiply by 100 to obtain ${a}.`,
  );
});
set("symmetric-cournot-output", (v, o) => {
  let count = 2 + (v % 4),
    owed = 140 + 7 * v,
    each = 20 + 2 * v,
    b = 2 + (v % 3);
  return R(
    o,
    `You have ${count} identical interest-free balances of ${m(owed)} each and immediately pay ${m(each)} toward each one. The remaining total will be split into ${b} equal payments per month for ${count + 1} months, with no fees. What is each scheduled payment?`,
    (a) =>
      `Remaining total = ${count} × (${m(owed)} − ${m(each)}). There are ${b} × ${count + 1} payments. Divide: ${count}(${owed} − ${each})/[${b}(${count + 1})] = ${a}.`,
    { style: "money", suffix: "" },
  );
});
set("strategic-expected-profit", (v, o) => {
  let prob = 30 + 2 * v,
    high = 1800 + 95 * v,
    low = 450 + 25 * v;
  return R(
    o,
    `A hypothetical insurance claim pays ${m(high)} with probability ${p(prob)} and ${m(low)} otherwise. The outcomes are mutually exclusive and exhaustive. Ignoring premiums, tax, and time value, what is expected claim payment?`,
    (a) =>
      `Weight both outcomes: (${prob}/100) × ${m(high)} + (${100 - prob}/100) × ${m(low)} = ${a}. Expected payment is an average across possible outcomes, not a guaranteed claim amount.`,
  );
});
set("segmented-pricing-revenue", (v, o) => {
  let high = 30 + v,
    low = 55 + 2 * v,
    h = 48 + v,
    l = 25 + (v % 5);
  return R(
    o,
    `Across a degree program, ${high} lab credits carry a ${m(h)} materials fee per credit and ${low} other credits carry a ${m(l)} fee. How much more are total materials fees than if every credit carried only the ${m(l)} fee? Ignore tuition and other charges.`,
    (a) =>
      `Only the ${high} lab credits create an extra fee: ${high} × (${m(h)} − ${m(l)}) = ${a}.`,
  );
});
set("unit-tax-equilibrium-revenue", (v, o) => {
  let a = 260 + 12 * v,
    c = 20 + v,
    t = 4 + (v % 5),
    q = a - (3 * (a - c + 2 * t)) / 5;
  return R(
    o,
    `A training course includes exactly ${n(q, 2)} lab hours. A separate mandatory lab charge is ${m(t)} per hour, with fractional hours billed proportionally. What total lab charge belongs in your college budget?`,
    (ans) =>
      `Multiply billable lab hours by the hourly charge: ${n(q, 2)} × ${m(t)} = ${ans}. This charge is additional to any tuition or other costs.`,
  );
});
set("tax-incidence-consumer-share", (v, o) => {
  let a = 2 + v,
    b = 5 + 2 * v,
    total = 6 + v;
  return R(
    o,
    `Two joint-account owners agree to split a ${m(total)} bank fee in proportion to their ${a}:${b} contribution weights. What amount of the fee is paid by the second owner?`,
    (ans) =>
      `The second owner's share is ${b}/(${a} + ${b}) of the total: ${m(total)} × ${b} ÷ (${a} + ${b}) = ${ans}.`,
  );
});
set("simple-spending-multiplier", (v, o) => {
  let spend = 0.55 + 0.01 * v,
    goal = 40 + 3 * v;
  return R(
    o,
    `You plan to save ${m(goal)} from an extra cash receipt and spend exactly ${p(spend * 100)} of that receipt. With no taxes or fees, how large must the receipt be to fund the saving target?`,
    (a) =>
      `The saved fraction is 1 − ${n(spend, 2)}. Required receipt = ${m(goal)} ÷ (1 − ${n(spend, 2)}) = ${a}.`,
    { style: "money", suffix: "" },
  );
});
set("balanced-budget-output-effect", (v, o) => {
  let r = 0.6 + 0.01 * v,
    t = 30 + 4 * v;
  return R(
    o,
    `A mathematical savings plan makes a first deposit of ${m(t)} × (1 − ${n(r, 2)}). Every later deposit equals ${p(r * 100)} of the preceding deposit. With no interest or withdrawals, what total would the deposits approach if this shrinking sequence continued indefinitely? Use first deposit ÷ (1 − common ratio).`,
    (a) =>
      `The first deposit is ${m(t)} × (1 − ${n(r, 2)}). Divide by (1 − ${n(r, 2)}) for the infinite geometric sum: ${a}. The question asks the sequence's limiting total, not a finite-month balance.`,
    { style: "money", suffix: "" },
  );
});
set("overall-budget-deficit", (v, o) => {
  let income = 420 + 21 * v,
    cost = 450 + 24 * v,
    interest = 32 + 2 * v;
  return R(
    o,
    `For one budget period, income is ${m(income)}, expenses excluding debt interest are ${m(cost)}, and separate interest charges are ${m(interest)}. What is the total budget shortfall? No item appears in more than one category.`,
    (a) =>
      `Shortfall = expenses + separate interest − income = ${m(cost)} + ${m(interest)} − ${m(income)} = ${a}.`,
    { style: "money", suffix: "" },
  );
});
set("public-good-efficient-quantity", (v, o) => {
  let a = 80 + 3 * v,
    c = 60 + 2 * v,
    mc = 50 + v;
  return R(
    o,
    `Two roommates share the same home-security service level Q. In a hypothetical decision model, their separate marginal dollar benefits are ${a} − 2Q and ${c} − Q, and each extra service unit costs ${m(mc)}. Both benefits remain positive. What Q equates combined marginal benefit with marginal cost?`,
    (ans) =>
      `Because both roommates benefit from the same service level, add marginal benefits: (${a} − 2Q) + (${c} − Q) = ${mc}. Solving gives Q = (${a} + ${c} − ${mc})/3 = ${ans}.`,
    { suffix: "service units" },
  );
});
set("price-index-rebasing", (v, o) =>
  C(o, [
    [
      "On an old price-index scale,",
      "In your household cost-of-living tracker, on its old price-index scale,",
    ],
  ]),
);
// Credit-report arithmetic deliberately makes no claim about credit-score points.
set("unemployment-labor-force-denominator", (v, o) => {
  let available = 8400 + 230 * v,
    balance = 500 + 17 * v,
    mortgage = 3300 + 110 * v;
  return R(
    o,
    `Your revolving accounts show ${m(balance)} used and ${m(available)} available, together making the total credit limit. A separate mortgage balance is ${m(mortgage)}. What is aggregate revolving utilization, excluding the mortgage?`,
    (a) =>
      `Total revolving limit = used + available. Utilization = ${m(balance)} ÷ (${m(balance)} + ${m(available)}) × 100 = ${a}. The mortgage is outside this revolving-credit ratio; no score change is implied.`,
  );
});
set("labor-force-participation", (v, o) => {
  let limit = 15000 + 470 * v,
    a = 9200 + 290 * v,
    b = 600 + 18 * v;
  return R(
    o,
    `Across your revolving accounts, the combined reported credit limit is ${m(limit)}. Reported balances are ${m(a)} on one group of cards and ${m(b)} on the remaining cards. What is aggregate utilization?`,
    (ans) =>
      `Add every reported revolving balance, then divide by the combined limit: (${m(a)} + ${m(b)}) ÷ ${m(limit)} × 100 = ${ans}. This measures utilization, not a credit score.`,
  );
});
set("employment-population-ratio", (v, o) => {
  let balance = 6700 + 210 * v,
    loan = 420 + 14 * v,
    limit = 11200 + 360 * v;
  return R(
    o,
    `Your revolving-credit report shows total balances of ${m(balance)} and total limits of ${m(limit)}. It also lists a separate ${m(loan)} installment loan. What is revolving utilization when that installment debt is excluded?`,
    (a) =>
      `Use revolving balances and revolving limits only: ${m(balance)} ÷ ${m(limit)} × 100 = ${a}. Adding the installment loan would answer a different question.`,
  );
});
set("new-jobseekers-unemployment-rate", (v, o) => {
  let avail = 5000 + 170 * v,
    bal = 300 + 9 * v,
    newLimit = 70 + 3.5 * v;
  return R(
    o,
    `Your existing revolving accounts have ${m(bal)} reported balances and ${m(avail)} unused credit. A new card reports a ${m(newLimit)} limit and a balance equal to that entire limit. Nothing else changes. What is aggregate utilization across old and new accounts?`,
    (a) =>
      `Both total balances and limits rise by ${m(newLimit)}. Utilization = (${m(bal)} + ${m(newLimit)}) ÷ (${m(avail)} + ${m(bal)} + ${m(newLimit)}) × 100 = ${a}.`,
  );
});
set("broad-u6-underutilization", (v, o) => {
  let lim = 7500 + 220 * v,
    b = 450 + 13 * v,
    c = 180 + 6.5 * v,
    a = 310 + 8 * v;
  return R(
    o,
    `Card A reports a ${m(lim)} limit and a ${m(a)} balance. Card B has a ${m(b)} limit and the same ${m(b)} balance; Card C has a ${m(c)} limit and the same ${m(c)} balance. What is combined revolving utilization?`,
    (ans) =>
      `Add balances separately from limits: (${m(a)} + ${m(b)} + ${m(c)}) ÷ (${m(lim)} + ${m(b)} + ${m(c)}) × 100 = ${ans}. Card A's balance is already within its limit, so it must not be added to the denominator again.`,
  );
});
set("real-output-per-hour", (v, o) => {
  let receipts = (1800000 + 127000 * v) / 100,
    hours = (30000 + 1300 * v) / 100;
  return R(
    o,
    `Across a year, your freelance work earns ${m(receipts)} after business expenses and uses ${n(hours)} billable and nonbillable hours combined. Ignoring personal taxes, what is average net business income per total work hour?`,
    (a) =>
      `Include all the stated work time: ${m(receipts)} ÷ ${n(hours)} hours = ${a}. This includes unpaid administrative time in the denominator.`,
    { suffix: "per hour" },
  );
});
set("worker-separation-rate", (v, o) => {
  let start = 1600 + 65 * v,
    pay = 42 + 1.7 * v,
    newCharge = 51 + 2.1 * v;
  return R(
    o,
    `A card's opening reported balance is ${m(start)}. You pay ${m(pay)} toward it during the cycle and separately make ${m(newCharge)} in new purchases. What percentage of the opening balance does that payment represent? This asks for the payment-to-opening-balance ratio, not the ending balance or a score change.`,
    (a) =>
      `Use the specified opening denominator: ${m(pay)} ÷ ${m(start)} × 100 = ${a}. New purchases change the later balance but do not change this defined ratio.`,
  );
});
set("goods-services-net-exports", (v, o) => {
  let a = 180 + 11 * v,
    b = 85 + 5 * v,
    c = 235 + 13 * v,
    d = 58 + 3 * v;
  return R(
    o,
    `This week your checking account receives ${m(a)} of job pay and ${m(b)} of a refund, then pays ${m(c)} for groceries and ${m(d)} for transit. There are no other entries. What is the net change in the account balance? A negative result means a decrease.`,
    (ans) =>
      `Net change = inflows minus outflows = ${m(a)} + ${m(b)} − ${m(c)} − ${m(d)} = ${ans}.`,
    { style: "money", suffix: "" },
  );
});
set("foreign-invoice-conversion", (v, o) =>
  C(o, [
    ["A U.S. importer owes", "A U.S. student owes a foreign college"],
    ["the invoice", "the tuition invoice"],
  ]),
);
set("reciprocal-currency-appreciation", (v, o) =>
  C(o, [
    [
      "The exchange rate changes",
      "Your bank's no-fee travel-currency quote changes",
    ],
    [
      "does the dollar appreciate",
      "does the amount of euros available per dollar increase",
    ],
  ]),
);
set("terms-of-trade-index", (v, o) => {
  let income = 116 + 2.5 * v,
    cost = 108 + 1.5 * v;
  return R(
    o,
    `Your take-home income index is ${n(income, 1)} and your household cost-of-living index is ${n(cost, 1)}, both based on 100 in the same starting year. Define purchasing-power income index as income index ÷ cost index × 100. What is its current value?`,
    (a) =>
      `Adjust the income index for the cost index: ${n(income, 1)} ÷ ${n(cost, 1)} × 100 = ${a}. An index above 100 means greater purchasing power than in the common base period.`,
    { suffix: "index points" },
  );
});
set("small-country-tariff-revenue", (v, o) => {
  let a = 500 + 17 * v,
    c = 20 + v,
    t = 5 + (v % 4),
    price = 35 + v + t,
    base = (a - 4 * price - c - 2 * price) * 100;
  return R(
    o,
    `For a hypothetical car purchase, the taxable price is ${m(base)} and the stated purchase-tax rate is ${p(t)}. No trade-in credit, exemption, or other taxable charge applies. How much tax is added?`,
    (ans) =>
      `Under the stated hypothetical terms, tax = ${m(base)} × ${t}/100 = ${ans}. This is not a statement of a particular jurisdiction's tax rate.`,
  );
});
set("import-quota-rent", (v, o) => {
  let buy = 28 + v,
    sell = buy + 7 + (v % 5),
    shares = 650 + 37 * v;
  return R(
    o,
    `You buy ${shares} shares at ${m(buy)} each and later sell all of them at ${m(sell)} each. There are no dividends, trading costs, or taxes in this example. What is the total capital gain?`,
    (a) =>
      `Gain per share = ${m(sell)} − ${m(buy)}. Multiply by ${shares} shares to obtain ${a}.`,
  );
});
set("effective-protection-value-added", (v, o) => {
  let sell = 200 + 10 * v,
    cost = 100 + 4 * v,
    s = 12 + (v % 5),
    c = 3 + (v % 3);
  return R(
    o,
    `Your side business currently sells one item for ${m(sell)} and pays ${m(cost)} for its materials. You increase the price by ${p(s)}, while material cost rises ${p(c)}. Ignoring other costs and holding quantities fixed, by what percentage does gross profit per item rise?`,
    (a) =>
      `Old gross profit = ${m(sell)} − ${m(cost)}. New gross profit = ${m(sell)}(1 + ${s}/100) − ${m(cost)}(1 + ${c}/100). Divide the increase by old gross profit and multiply by 100: ${a}.`,
  );
});
set("current-account-components", (v, o) => {
  let a = -70 - 3 * v,
    b = 28 + 2 * v,
    c = 14 + v,
    d = -11 - 0.5 * v;
  return R(
    o,
    `Four checking-account entries are ${m(a)} for shopping, ${m(b)} in refunds, ${m(c)} of interest, and ${m(d)} in fees. Positive numbers are credits and negative numbers are debits. What is the combined change in the account balance?`,
    (ans) =>
      `Preserve each sign and add all entries: (${a}) + ${b} + ${c} + (${d}) = ${ans}. A negative change reduces the opening balance.`,
    { style: "money", suffix: "" },
  );
});
set("expenditure-gdp", (v, o) => {
  let a = 720 + 37 * v,
    b = 160 + 11 * v,
    c = 210 + 13 * v,
    d = 140 + 9 * v,
    expense = 170 + 10 * v,
    transfer = 65 + 3 * v;
  return R(
    o,
    `Across your checking and savings accounts together, outside receipts are ${m(a)} of pay, ${m(b)} of reimbursements, ${m(c)} of gifts, and ${m(d)} of refunds. You spend ${m(expense)} outside those accounts and separately transfer ${m(transfer)} from checking to savings. What is the net change in the combined balances?`,
    (ans) =>
      `Add outside inflows and subtract outside spending: ${a} + ${b} + ${c} + ${d} − ${expense} = ${ans}. The internal ${m(transfer)} transfer leaves combined balances unchanged.`,
    { style: "money", suffix: "" },
  );
});
set("real-gdp-growth", (v, o) => {
  let before = 1200 + 65 * v,
    after = before + 36 + 3 * v;
  return R(
    o,
    `Your emergency reserve rises from ${m(before)} to ${m(after)} through deposits and interest combined. What is the percentage increase in its balance? This asks for balance growth, not an investment return excluding contributions.`,
    (a) =>
      `Balance growth = (${m(after)} − ${m(before)}) ÷ ${m(before)} × 100 = ${a}.`,
  );
});
set("real-per-capita-growth", (v, o) => {
  let cost = 3.4 + 0.12 * v,
    distance = 0.7 + 0.03 * v;
  return R(
    o,
    `Your annual car operating costs rise ${p(cost, 2)}, while miles driven rise ${p(distance, 2)}. Using only those changes, what is the exact percentage increase in operating cost per mile?`,
    (a) =>
      `Cost per mile changes by the cost factor divided by the mileage factor: [(1 + ${cost}/100) ÷ (1 + ${distance}/100) − 1] × 100 = ${a}. Simply subtracting the two growth rates is only an approximation.`,
  );
});
set("compound-output-projection", (v, o) => {
  let start = 850 + 42 * v,
    r = 2.1 + 0.1 * v,
    years = 5 + (v % 6);
  return R(
    o,
    `A savings projection starts with ${m(start)} and assumes a constant ${p(r)} annual return compounded annually for ${years} years. There are no contributions, withdrawals, fees, or taxes. What ending balance does the assumption produce?`,
    (a) =>
      `Apply the growth factor once for each year: ${m(start)} × (1 + ${r}/100)^${years} = ${a}. The stated return is an illustration, not a promise.`,
    { style: "money", suffix: "" },
  );
});
set("output-compound-annual-growth-rate", (v, o) => {
  let start = 600 + 30 * v,
    end = 900 + 55 * v,
    years = 6 + (v % 5);
  return R(
    o,
    `You want a ${m(start)} savings balance to reach ${m(end)} in ${years} years without further deposits. Ignoring fees and taxes, what constant annual compounded return would be required? This is a target calculation, not an available guaranteed rate.`,
    (a) =>
      `Solve ${end} = ${start}(1 + r)^${years}. The required percentage is [(${end}/${start})^(1/${years}) − 1] × 100 = ${a}.`,
  );
});
set("net-capital-accumulation", (v, o) => {
  let start = 1800 + 95 * v,
    deposit = 230 + 14 * v,
    used = 6 + 0.1 * v;
  return R(
    o,
    `Your emergency reserve starts at ${m(start)}. During the year, a repair uses ${p(used)} of that opening balance. At year-end you deposit ${m(deposit)}. No interest, fees, or other withdrawals apply. What is the ending reserve?`,
    (a) =>
      `First subtract the repair from the opening balance, then add the later deposit: ${m(start)} × (1 − ${used}/100) + ${m(deposit)} = ${a}.`,
    { style: "money", suffix: "" },
  );
});
set("solow-steady-state-capital", (v, o) => {
  let s = 0.15 + 0.005 * v,
    a = 2 + 0.1 * v,
    d = 0.05 + 0.001 * v;
  return R(
    o,
    `A promoter claims that paying ${m(d * 10000)} would produce an entire ending balance equal to ${p(s * 100)} of ${m(a * 10000)} after six months. If that claimed ending-balance multiplier were repeated for a second six months, what multiple of the original payment would the one-year ending balance be? Calculate the claim only; do not assume it is achievable.`,
    (ans) =>
      `The claimed six-month multiplier is [${m(a * 10000)} × ${n(s, 3)}] ÷ ${m(d * 10000)}. Repeating it twice gives (${n(a, 1)} × ${n(s, 3)} ÷ ${n(d, 3)})² = ${ans}. A correct calculation of a promoter's claim is not evidence that the return is realistic or the offer legitimate.`,
    { suffix: "times the original payment" },
  );
});
set("growth-accounting-tfp", (v, o) => {
  let actual = 3.8 + 0.12 * v,
    stock = 4.5 + 0.1 * v,
    bond = 1.2 + 0.04 * v,
    w = 0.3 + 0.01 * (v % 6);
  return R(
    o,
    `An investment returns ${p(actual, 2)} over one period. Its comparison benchmark weights a ${p(stock, 2)} stock return by ${p(w * 100)} and a ${p(bond, 2)} bond return by ${p((1 - w) * 100)}. What is the investment's return minus the blended benchmark, in percentage points?`,
    (a) =>
      `Benchmark = ${n(w, 2)} × ${n(stock, 2)}% + (1 − ${n(w, 2)}) × ${n(bond, 2)}%. Subtract that weighted return from ${n(actual, 2)}% to obtain ${a}.`,
    { style: "number", suffix: "percentage points" },
  );
});
set("employment-weighted-mean-wage", (v, o) => {
  let h1 = 24 + v,
    h2 = 42 + 2 * v,
    r1 = 18 + 0.5 * v,
    r2 = 29 + 0.7 * v;
  return R(
    o,
    `Over a pay period you work ${h1} hours at ${m(r1)} per hour and ${h2} hours at ${m(r2)} per hour. There are no premiums or bonuses. What is your average gross hourly rate across all hours?`,
    (a) =>
      `Weight each hourly rate by its paid hours: (${h1} × ${m(r1)} + ${h2} × ${m(r2)}) ÷ (${h1} + ${h2}) = ${a}.`,
    { suffix: "per hour" },
  );
});
set("median-household-spending", (v, o) =>
  C(o, [
    [
      "Seven households report weekly spending of",
      "Your household records seven weekly spending totals of",
    ],
  ]),
);
set("population-variance-output", (v, o) => {
  let center = 30 + 2 * v,
    a = 3 + (v % 4),
    b = 7 + v,
    values = [center - b, center - a, center + a, center + b];
  return R(
    o,
    `Your last four weekly transport costs were ${values.map(m).join(", ")}. Treat exactly these four weeks as the complete population being summarized. What is the population variance of those costs, measured in squared dollars?`,
    (ans) =>
      `The mean is ${m(center)}. Square each deviation from the mean and average all four: (${values.map((x) => `(${x} − ${center})²`).join(" + ")}) ÷ 4 = ${ans}. Variance is in squared dollars; its square root would be the standard deviation.`,
    { suffix: "squared dollars" },
  );
});
set("sample-mean-standard-error", (v, o) =>
  C(o, [
    ["households has a spending", "students has a textbook-spending"],
    ["the sample mean", "the estimated mean textbook cost"],
  ]),
);
set("confidence-interval-upper-limit", (v, o) =>
  C(o, [
    [
      "An estimated mean weekly expenditure",
      "For a college living-cost study, estimated mean weekly expenditure",
    ],
    [
      "What is the upper confidence limit",
      "What is the upper confidence limit for the population mean (not a guaranteed limit on one student's spending)",
    ],
  ]),
);
set("conditional-training-employment", (v, o) => {
  let on = 80 + 4 * v,
    late = 20 + 2 * v,
    other = 95 + 3 * v,
    otherLate = 45 + 2 * v;
  return R(
    o,
    `Your saved payment records show ${on} on-time and ${late} late payments for Account A, and ${other} on-time and ${otherLate} late payments for Account B. If one Account A record is selected uniformly at random, what is the probability that it is on time? This is a record-summary calculation, not a credit-score model.`,
    (a) =>
      `Condition on Account A: only its records belong in the denominator. Probability = ${on} ÷ (${on} + ${late}) × 100 = ${a}.`,
  );
});
set("linear-regression-consumption-prediction", (v, o) =>
  C(o, [
    [
      "A fitted monthly consumption regression is predicted",
      "Your hypothetical budget forecast is",
    ],
    ["the regression predict", "the forecast predict"],
  ]),
);
set("sample-covariance-growth", (v, o) =>
  C(o, [
    [
      "output growth x and wage growth y",
      "stock-fund return x and bond-fund return y",
    ],
  ]),
);
// Small-business cash questions describe a personal side business for income planning.
for (const id of [
  "contribution-per-unit",
  "fixed-cost-break-even-units",
  "cash-versus-invoiced-sales",
  "runway-full-months",
  "early-payment-discount-annualized",
  "cash-conversion-cycle",
  "gross-margin-versus-markup",
  "merchant-processing-net-deposit",
  "working-capital-classification",
])
  flash["invest-" + id] = (v, o) =>
    C(o, [
      ["A small business", "Your side business"],
      ["A business", "Your side business"],
      ["a business", "your side business"],
      ["A supplier offers", "A supplier for your freelance work offers"],
      ["A product costs a business", "A product costs your side business"],
      ["A merchant", "Your side business"],
      [
        "Monthly fixed costs are",
        "For your side business, monthly fixed costs are",
      ],
    ]);
