import { numeric, num, money, pct } from './helpers.mjs';

// All economies, markets, tax schedules, and observations below are hypothetical.
// Model assumptions are part of each prompt; no exercise depends on current law or data.
const family = (id, topic, difficulty, build) => ({ id: `econ-drill-${id}`, category: 'Economics', topic, difficulty, build });
const N = (digits = 2, suffix = '') => ({ style: 'number', digits, suffix });
const P = (digits = 2) => ({ style: 'percent', digits });
const M = (digits = 2) => ({ style: 'money', digits });

export const families = [
  family('course-economic-cost', 'Opportunity Cost Drills', 'easy', v => {
    const tuition = 240 + 15 * v, hours = 8 + v, wage = 16 + v % 5, cost = tuition + hours * wage;
    return numeric(`A short course costs ${money(tuition)} and prevents a worker from taking ${hours} hours of paid work at ${money(wage)} per hour. With no taxes or other costs, what is the course's total economic cost?`, cost,
      [tuition, hours * wage, tuition + wage, tuition - hours * wage],
      `Economic cost includes the fee and forgone earnings: ${money(tuition)} + ${hours} × ${money(wage)} = ${money(cost)}.`, M());
  }),
  family('linear-ppf-unit-cost', 'Opportunity Cost Drills', 'easy', v => {
    const robots = 24 + v, grain = 3 * robots + 12 + v, cost = grain / robots;
    return numeric(`With fixed resources and a linear production possibilities frontier, an economy can produce either ${robots} robots or ${grain} tons of grain. What is the opportunity cost of one robot in tons of grain?`, cost,
      [robots / grain, grain, grain - robots, (grain + robots) / robots],
      `A linear frontier has constant opportunity cost: ${grain} tons ÷ ${robots} robots = ${num(cost, 2)} tons of grain per robot.`, N(2, 'tons of grain'));
  }),
  family('ppf-segment-sacrifice', 'Opportunity Cost Drills', 'medium', v => {
    const x0 = 12 + v, dx = 4 + v % 4, y0 = 160 + 7 * v, loss = 18 + 2 * v, x1 = x0 + dx, y1 = y0 - loss, cost = loss / dx;
    return numeric(`On a production frontier, increasing medical machines from ${x0} to ${x1} reduces bicycles from ${y0} to ${y1}. What is the average opportunity cost of each additional medical machine over this segment?`, cost,
      [dx / loss, loss, y1 / x1, y0 / x0],
      `Use the changes along this segment: (${y0} − ${y1}) ÷ (${x1} − ${x0}) = ${loss} ÷ ${dx} = ${num(cost, 2)} bicycles per machine.`, N(2, 'bicycles'));
  }),
  family('specialization-trade-gain', 'Opportunity Cost Drills', 'medium', v => {
    const cloth = 5 + v, domestic = 4 + v % 3, trade = 2 + (v % 2) * 0.5, saved = cloth * (domestic - trade);
    return numeric(`A producer can make one roll of cloth by giving up ${domestic} sacks of grain. Instead, the producer trades grain for ${cloth} rolls at ${num(trade, 1)} sacks per roll. With constant opportunity costs and no transport costs, how many sacks of grain does trading save compared with making the cloth?`, saved,
      [cloth * domestic, cloth * trade, domestic - trade, cloth * (domestic + trade)],
      `Making the cloth costs ${cloth} × ${domestic} sacks; trading costs ${cloth} × ${num(trade, 1)} sacks. The saving is ${cloth} × (${domestic} − ${num(trade, 1)}) = ${num(saved, 1)} sacks.`, N(1, 'sacks'));
  }),
  family('best-forgone-alternative', 'Opportunity Cost Drills', 'easy', v => {
    const a = 280 + 13 * v, b = 410 + 17 * v, c = 350 + 9 * v;
    return numeric(`An owner uses a room for a personal studio. The mutually exclusive alternatives would yield weekly net benefits of ${money(a)} from storage, ${money(b)} from an office rental, or ${money(c)} from tutoring. What is the weekly opportunity cost of the studio?`, b,
      [a + b + c, a, c, (a + b + c) / 3],
      `Opportunity cost is the highest net benefit forgone, not the sum of alternatives: max(${money(a)}, ${money(b)}, ${money(c)}) = ${money(b)}.`, M());
  }),
  family('sunk-cost-continuation', 'Opportunity Cost Drills', 'medium', v => {
    const sunk = 1800 + 60 * v, finish = 900 + 35 * v, sale = 2500 + 95 * v, salvage = 300 + 10 * v, gain = sale - finish - salvage;
    return numeric(`A prototype has already cost ${money(sunk)}, which cannot be recovered. Finishing it costs ${money(finish)} and produces a sale worth ${money(sale)}. Abandoning it now yields ${money(salvage)} in salvage. What is the incremental net benefit of finishing instead of abandoning?`, gain,
      [sale - finish, sale - finish - sunk, sale - finish - sunk - salvage, sale - salvage],
      `Ignore the unrecoverable ${money(sunk)}. Finishing rather than abandoning changes net benefits by ${money(sale)} − ${money(finish)} − ${money(salvage)} = ${money(gain)}.`, M());
  }),
  family('budget-feasible-units', 'Opportunity Cost Drills', 'easy', v => {
    const budget = 150 + 11 * v, transit = 3 + v % 4, rides = 8 + v % 5, meal = 7 + v % 3, units = Math.floor((budget - transit * rides) / meal);
    return numeric(`A student has ${money(budget)} for transit and meals. Each transit ride costs ${money(transit)}, and the student must buy ${rides} rides. Meals cost ${money(meal)} each. What is the maximum whole number of meals affordable?`, units,
      [Math.ceil((budget - transit * rides) / meal), Math.floor(budget / meal), Math.floor((budget - transit) / meal), Math.floor(budget / (meal + transit)), Math.floor((budget - rides) / meal), Math.floor((budget - transit * rides) / (meal + transit))],
      `After transit, ${money(budget)} − ${rides} × ${money(transit)} = ${money(budget - rides * transit)} remains. floor(${budget - rides * transit} ÷ ${meal}) = ${units} whole meals.`, N(0, 'meals'));
  }),
  family('capital-forgone-interest', 'Opportunity Cost Drills', 'easy', v => {
    const capital = 12000 + 750 * v, rate = 3.2 + v * 0.1, cost = capital * rate / 100;
    return numeric(`An entrepreneur ties up ${money(capital)} of personal savings in equipment for one year. The best alternative would earn ${pct(rate)} simple annual interest. Ignoring risk, tax, and depreciation, what is the year's implicit capital cost?`, cost,
      [capital, capital * (1 + rate / 100), capital / rate, capital * rate],
      `Implicit capital cost is the interest forgone: ${money(capital)} × ${pct(rate)} = ${money(cost)} for one year.`, M());
  }),

  family('marginal-product-labor', 'Production and Cost Drills', 'easy', v => {
    const l0 = 5 + v, dl = 2 + v % 3, q0 = 130 + 18 * v, dq = 38 + 6 * v, mp = dq / dl;
    return numeric(`Holding capital fixed, increasing daily workers from ${l0} to ${l0 + dl} raises output from ${q0} to ${q0 + dq} units. What is average marginal product per added worker over this interval?`, mp,
      [dq, (q0 + dq) / (l0 + dl), dl / dq, q0 / l0],
      `Marginal product over the interval = Δoutput ÷ Δlabor = (${q0 + dq} − ${q0}) ÷ (${l0 + dl} − ${l0}) = ${num(mp, 2)} units per additional worker.`, N(2, 'units per worker'));
  }),
  family('average-product-labor', 'Production and Cost Drills', 'easy', v => {
    const workers = 8 + v, output = 205 + 29 * v, ap = output / workers;
    return numeric(`A workshop produces ${output} units daily using ${workers} workers and fixed machinery. What is its average product of labor?`, ap,
      [output - workers, output * workers, workers / output, output / (workers + 1)],
      `Average product = total output ÷ number of workers = ${output} ÷ ${workers} = ${num(ap, 2)} units per worker per day.`, N(2, 'units per worker'));
  }),
  family('marginal-cost-increment', 'Production and Cost Drills', 'easy', v => {
    const q0 = 80 + 4 * v, dq = 10 + v % 4, c0 = 1500 + 87 * v, dc = 180 + 19 * v, mc = dc / dq;
    return numeric(`A firm's daily total cost increases from ${money(c0)} to ${money(c0 + dc)} when output increases from ${q0} to ${q0 + dq} units. What is average marginal cost per added unit over this interval?`, mc,
      [dc, (c0 + dc) / (q0 + dq), c0 / q0, dq / dc],
      `Marginal cost = Δtotal cost ÷ Δoutput = (${money(c0 + dc)} − ${money(c0)}) ÷ (${q0 + dq} − ${q0}) = ${money(mc)} per unit.`, M());
  }),
  family('average-total-cost', 'Production and Cost Drills', 'easy', v => {
    const fixed = 840 + 55 * v, unit = 9 + v % 6, q = 70 + 3 * v, atc = fixed / q + unit;
    return numeric(`A firm has ${money(fixed)} in daily fixed cost and constant variable cost of ${money(unit)} per unit. At ${q} units a day, what is average total cost?`, atc,
      [unit, fixed / q, fixed + unit, (fixed + unit) / q],
      `ATC = (fixed cost + variable cost) ÷ output = (${money(fixed)} + ${money(unit)} × ${q}) ÷ ${q} = ${money(atc)} per unit.`, M());
  }),
  family('recover-fixed-cost', 'Production and Cost Drills', 'medium', v => {
    const q = 120 + 7 * v, avc = 14 + v % 5, afc = 6 + v % 4, atc = avc + afc, fixed = q * afc;
    return numeric(`At an output of ${q} units, average total cost is ${money(atc)} and average variable cost is ${money(avc)}. What is total fixed cost?`, fixed,
      [afc, q * atc, q * avc, q * (atc + avc)],
      `AFC = ATC − AVC = ${money(atc)} − ${money(avc)} = ${money(afc)}. Thus fixed cost = ${money(afc)} × ${q} = ${money(fixed)}.`, M());
  }),
  family('cobb-douglas-output', 'Production and Cost Drills', 'medium', v => {
    const a = 2 + v % 3, k = 16 + 3 * v, l = 25 + 4 * v, q = a * Math.sqrt(k * l);
    return numeric(`A production model is Q = A × K^0.5 × L^0.5. If A = ${a}, capital services K = ${k}, and labor services L = ${l}, what output does the model predict?`, q,
      [Math.sqrt(k * l), a * (k + l), a * k * l, a * Math.sqrt(k + l)],
      `Substitute the inputs: Q = ${a} × √${k} × √${l} = ${a} × √(${k} × ${l}) = ${num(q, 2)} units.`, N(2, 'units'));
  }),
  family('competitive-labor-hiring', 'Production and Cost Drills', 'hard', v => {
    const a = 55 + 2 * v, b = 2 + v % 3, price = 8 + v % 4, wage = 72 + 3 * v, l = (a - wage / price) / b;
    return numeric(`A price-taking firm sells output for ${money(price)} per unit and hires divisible labor at ${money(wage)} per labor unit. Its marginal product is MPL = ${a} − ${b}L. Assuming an interior optimum, what labor quantity maximizes profit?`, l,
      [(a - wage) / b, a / b, (a - wage / price) / (2 * b), (a * price - wage) / b],
      `Set value of marginal product equal to the wage: ${price}(${a} − ${b}L) = ${wage}. Hence L = (${a} − ${wage} ÷ ${price}) ÷ ${b} = ${num(l, 2)} labor units.`, N(2, 'labor units'));
  }),
  family('scale-cost-elasticity', 'Production and Cost Drills', 'medium', v => {
    const q0 = 500 + 20 * v, qg = 12 + v, c0 = 6000 + 175 * v, cg = 5 + 0.4 * v, q1 = q0 * (1 + qg / 100), c1 = c0 * (1 + cg / 100), e = cg / qg;
    return numeric(`A plant's output rises from ${num(q0, 2)} to ${num(q1, 2)} units while long-run total cost rises from ${money(c0)} to ${money(c1)}. Using initial values as the percentage-change bases, what is the cost elasticity with respect to output?`, e,
      [qg / cg, cg, qg, (c1 - c0) / (q1 - q0)],
      `Cost elasticity = [(C1 − C0)/C0] ÷ [(Q1 − Q0)/Q0] = [(${num(c1, 2)} − ${c0})/${c0}] ÷ [(${num(q1, 2)} − ${q0})/${q0}] = ${num(cg, 1)}% ÷ ${qg}% = ${num(e, 2)}.`, N(2));
  }),

  family('linear-market-clearing-price', 'Supply and Demand Drills', 'medium', v => {
    const a = 190 + 11 * v, b = 3 + v % 3, c = 22 + 2 * v, d = 2 + v % 4, p = (a - c) / (b + d);
    return numeric(`A market has Qd = ${a} − ${b}P and Qs = ${c} + ${d}P, where P is dollars per unit. What is the competitive equilibrium price?`, p,
      [(a + c) / (b + d), (a - c) / b, (a - c) / d, a / (b + d)],
      `Set Qd = Qs: ${a} − ${b}P = ${c} + ${d}P. Therefore P = (${a} − ${c}) ÷ (${b} + ${d}) = ${money(p)}.`, M());
  }),
  family('demand-shift-quantity-effect', 'Supply and Demand Drills', 'medium', v => {
    const a = 160 + 9 * v, b = 2 + v % 3, c = 20 + v, d = 3 + v % 4, shift = 24 + 3 * v, dq = d * shift / (b + d);
    return numeric(`Initially Qd = ${a} − ${b}P and Qs = ${c} + ${d}P. Demand then increases to Qd = ${a + shift} − ${b}P, with supply unchanged. How much does equilibrium quantity increase?`, dq,
      [shift, shift / (b + d), b * shift / (b + d), d * shift / b, shift * (b + d)],
      `The demand intercept rises by ${shift}. ΔP = ${shift}/(${b} + ${d}); supply then rises by ΔQ = ${d} × ${shift}/(${b} + ${d}) = ${num(dq, 2)} units.`, N(2, 'units'));
  }),
  family('binding-ceiling-shortage', 'Supply and Demand Drills', 'easy', v => {
    const a = 240 + 12 * v, b = 3, c = 30 + v, d = 2, ceiling = 20 + v, qd = a - b * ceiling, qs = c + d * ceiling, shortage = qd - qs;
    return numeric(`At a binding price ceiling of ${money(ceiling)}, demand is Qd = ${a} − ${b}P and supply is Qs = ${c} + ${d}P. What is the resulting shortage?`, shortage,
      [qd, qs, qd + qs, qs - qd],
      `At P = ${ceiling}, Qd = ${a} − ${b} × ${ceiling} = ${qd}, and Qs = ${c} + ${d} × ${ceiling} = ${qs}. Shortage = ${qd} − ${qs} = ${shortage} units.`, N(0, 'units'));
  }),
  family('binding-floor-surplus', 'Supply and Demand Drills', 'easy', v => {
    const a = 220 + 9 * v, b = 2, c = 20 + v, d = 3, floor = 50 + 2 * v, qd = a - b * floor, qs = c + d * floor, surplus = qs - qd;
    return numeric(`A market has Qd = ${a} − ${b}P and Qs = ${c} + ${d}P. A binding price floor sets P at ${money(floor)}. Before any government purchases, what is the excess quantity supplied?`, surplus,
      [qd, qs, qd + qs, qd - qs],
      `At P = ${floor}, quantity supplied is ${c} + ${d} × ${floor} = ${qs}; quantity demanded is ${a} − ${b} × ${floor} = ${qd}. Excess supply = ${qs} − ${qd} = ${surplus} units.`, N(0, 'units'));
  }),
  family('midpoint-demand-elasticity', 'Supply and Demand Drills', 'medium', v => {
    const p0 = 12 + v, p1 = p0 + 3 + v % 3, q0 = 220 + 8 * v, q1 = q0 - 32 - 2 * v, e = ((q0 - q1) / ((q0 + q1) / 2)) / ((p1 - p0) / ((p0 + p1) / 2));
    return numeric(`When price rises from ${money(p0)} to ${money(p1)}, quantity demanded falls from ${q0} to ${q1}. What is the absolute price elasticity of demand using the midpoint method?`, e,
      [((q0 - q1) / q0) / ((p1 - p0) / p0), 1 / e, (q0 - q1) / (p1 - p0), -e],
      `Midpoint elasticity = |(${q1} − ${q0})/((${q1} + ${q0})/2)| ÷ |(${p1} − ${p0})/((${p1} + ${p0})/2)| = ${num(e, 2)}.`, N(2));
  }),
  family('cross-price-elasticity', 'Supply and Demand Drills', 'medium', v => {
    const dp = 5 + v * 0.4, dq = 8 + v * 0.7, e = dq / dp;
    return numeric(`Holding other factors fixed, a ${pct(dp)} increase in the price of rail travel is associated with a ${pct(dq)} increase in bus trips demanded. Using the supplied percentage changes, what is bus demand's cross-price elasticity with respect to the rail price?`, e,
      [dp / dq, -dq / dp, dq - dp, dq + dp],
      `Cross-price elasticity = percentage change in bus quantity ÷ percentage change in rail price = ${pct(dq)} ÷ ${pct(dp)} = ${num(e, 2)}. Its positive sign indicates substitutes in this example.`, N(2));
  }),
  family('income-elasticity-forecast', 'Supply and Demand Drills', 'medium', v => {
    const q = 400 + 17 * v, elasticity = 0.6 + 0.05 * v, growth = 3 + v % 5, forecast = q * (1 + elasticity * growth / 100);
    return numeric(`Initial demand is ${q} units. Income rises ${pct(growth)} and the income elasticity of demand is ${num(elasticity, 2)}. Use the approximation %ΔQ = income elasticity × %Δincome, holding other factors fixed. What is forecast demand?`, forecast,
      [q * (1 + growth / 100), q * elasticity * growth / 100, q * (1 + growth / (100 * elasticity)), q * (1 - elasticity * growth / 100), q * (1 + elasticity * growth)],
      `%ΔQ = ${num(elasticity, 2)} × ${growth}% = ${num(elasticity * growth, 2)}%. Forecast Q = ${q} × [1 + (${num(elasticity, 2)} × ${growth}/100)] = ${num(forecast, 2)} units.`, N(2, 'units'));
  }),
  family('linear-consumer-surplus', 'Supply and Demand Drills', 'medium', v => {
    const a = 65 + 3 * v, b = 0.5 + 0.1 * (v % 3), p = 25 + v, q = (a - p) / b, cs = 0.5 * (a - p) * q;
    return numeric(`Inverse demand is P = ${a} − ${num(b, 1)}Q. Consumers can buy any desired quantity at a market price of ${money(p)}. What is total consumer surplus?`, cs,
      [(a - p) * q, p * q, 0.5 * a * q, 0.5 * (a - p)],
      `Demand at the market price is Q = (${a} − ${p})/${num(b, 1)} = ${num(q, 2)}. The surplus triangle is ½ × (${a} − ${p}) × [(${a} − ${p})/${num(b, 1)}] = ${money(cs)}.`, M());
  }),

  family('linear-monopoly-output', 'Market Structure Drills', 'hard', v => {
    const a = 120 + 5 * v, b = 2 + v % 3, mc = 24 + v, q = (a - mc) / (2 * b);
    return numeric(`A single-price monopolist faces P = ${a} − ${b}Q and constant marginal cost of ${money(mc)}. Fixed cost is zero. Allowing fractional output, what quantity maximizes profit?`, q,
      [(a - mc) / b, a / (2 * b), (a + mc) / (2 * b), (a - mc) / (4 * b)],
      `For linear inverse demand, MR = ${a} − ${2 * b}Q. Set MR = MC: Q = (${a} − ${mc})/${2 * b} = ${num(q, 2)} units.`, N(2, 'units'));
  }),
  family('monopoly-deadweight-loss', 'Market Structure Drills', 'hard', v => {
    const a = 100 + 4 * v, b = 1 + v % 3, mc = 20 + v, qc = (a - mc) / b, qm = qc / 2, pm = a - b * qm, dwl = 0.5 * (qc - qm) * (pm - mc);
    return numeric(`Demand is P = ${a} − ${b}Q, and constant marginal cost is ${money(mc)}. Compare an unregulated single-price monopoly with the efficient competitive output. With no externalities, what is monopoly's deadweight loss?`, dwl,
      [(qc - qm) * (pm - mc), qm * (pm - mc), 0.5 * qc * (a - mc), 0.5 * (qc - qm) * pm],
      `Efficient Q = (${a} − ${mc})/${b} = ${num(qc, 2)}; monopoly Q = (${a} − ${mc})/${2 * b} = ${num(qm, 2)} and P = ${money(pm)}. DWL = ½ × (${num(qc, 2)} − ${num(qm, 2)}) × (${num(pm, 2)} − ${mc}) = ${money(dwl)}.`, M());
  }),
  family('herfindahl-market-shares', 'Market Structure Drills', 'medium', v => {
    const shares = [40 + v, 30 - Math.floor(v / 2), 20 - Math.ceil(v / 2), 10], hhi = shares.reduce((s, x) => s + x * x, 0);
    return numeric(`Four firms have all market sales, with percentage shares ${shares.join('%, ')}%. What is the Herfindahl–Hirschman Index on the 0-to-10,000 scale?`, hhi,
      [100, hhi / 10000, shares[0] ** 2, (shares[0] + shares[1]) ** 2 + shares[2] ** 2 + shares[3] ** 2],
      `Square each percentage share and sum: ${shares.map(s => `${s}²`).join(' + ')} = ${num(hhi)} HHI points.`, N(0, 'HHI points'));
  }),
  family('four-firm-concentration', 'Market Structure Drills', 'medium', v => {
    const sales = [220 + 9 * v, 170 + 7 * v, 130 + 5 * v, 90 + 4 * v, 65 + 2 * v, 40 + v], total = sales.reduce((a, b) => a + b, 0), top = sales.slice(0, 4).reduce((a, b) => a + b, 0), cr = 100 * top / total;
    return numeric(`The only six firms in a market have annual sales, in millions of dollars, of ${sales.join(', ')}. What is the four-firm concentration ratio?`, cr,
      [100 * sales[0] / total, 100 * (top + sales[4]) / total, top / total, 100 * (total - top) / total],
      `The four largest firms sell ${sales.slice(0, 4).join(' + ')} = ${top} million out of ${total} million. CR4 = ${top}/${total} × 100 = ${pct(cr, 2)}.`, P());
  }),
  family('lerner-markup', 'Market Structure Drills', 'hard', v => {
    const elasticity = 1.8 + 0.15 * v, markup = 100 / elasticity;
    return numeric(`A profit-maximizing single-price monopolist faces a demand elasticity with absolute value ${num(elasticity, 2)} at an interior optimum. Under the Lerner rule, what is (price − marginal cost) as a percentage of price?`, markup,
      [100 * elasticity, 100 / (elasticity - 1), 100 * (1 - 1 / elasticity), 1 / elasticity],
      `The Lerner rule is (P − MC)/P = 1/|elasticity|. Thus the share of price is 100/${num(elasticity, 2)} = ${pct(markup, 2)}.`, P());
  }),
  family('symmetric-cournot-output', 'Market Structure Drills', 'hard', v => {
    const n = 2 + v % 4, a = 140 + 7 * v, b = 2 + v % 3, c = 20 + 2 * v, q = n * (a - c) / (b * (n + 1));
    return numeric(`In a symmetric Cournot market, ${n} identical firms simultaneously choose quantities. Inverse demand is P = ${a} − ${b}Q, and every firm has constant marginal cost ${money(c)} and no fixed cost. What is total equilibrium output?`, q,
      [(a - c) / (b * (n + 1)), (a - c) / b, (a - c) / (2 * b), n * (a - c) / (2 * b)],
      `Symmetric Cournot output is Q = n(a − c)/[b(n + 1)] = ${n}(${a} − ${c})/[${b}(${n} + 1)] = ${num(q, 2)} units.`, N(2, 'units'));
  }),
  family('strategic-expected-profit', 'Market Structure Drills', 'medium', v => {
    const prob = 30 + 2 * v, high = 1800 + 95 * v, low = 450 + 25 * v, expected = prob / 100 * high + (1 - prob / 100) * low;
    return numeric(`If a firm cuts price, its profit is ${money(high)} when its rival keeps price unchanged and ${money(low)} when the rival also cuts. The rival keeps price unchanged with probability ${prob}%. What is expected profit from cutting price?`, expected,
      [(high + low) / 2, prob / 100 * high, prob / 100 * low + (1 - prob / 100) * high, high + low, high - low],
      `Weight each mutually exclusive outcome by its probability: (${prob}/100) × ${money(high)} + (${100 - prob}/100) × ${money(low)} = ${money(expected)}.`, M());
  }),
  family('segmented-pricing-revenue', 'Market Structure Drills', 'medium', v => {
    const highN = 30 + v, lowN = 55 + 2 * v, highP = 48 + v, lowP = 25 + v % 5, gain = highN * (highP - lowP);
    return numeric(`A seller has ${highN} customers willing to pay ${money(highP)} and ${lowN} additional customers willing to pay only ${money(lowP)}, each for one unit. With enforceable segment prices and no resale, how much more revenue does charging each group its willingness to pay generate than a uniform price of ${money(lowP)}?`, gain,
      [highN * highP + lowN * lowP, (highN + lowN) * lowP, (highN + lowN) * (highP - lowP), lowN * (highP - lowP)],
      `Only the high-value group's payment changes. Extra revenue = ${highN} × (${money(highP)} − ${money(lowP)}) = ${money(gain)}.`, M());
  }),

  family('hypothetical-progressive-tax', 'Public Finance Drills', 'medium', v => {
    const cutoff = 18000 + 500 * v, income = cutoff + 12000 + 800 * v, low = 8 + v % 3, high = 20 + v % 4, tax = cutoff * low / 100 + (income - cutoff) * high / 100;
    return numeric(`A hypothetical tax schedule taxes the first ${money(cutoff)} of annual income at ${low}% and all income above that at ${high}%, with no deductions or credits. What is the tax on income of ${money(income)}?`, tax,
      [income * high / 100, income * low / 100, (income - cutoff) * high / 100, cutoff * low / 100 + income * high / 100],
      `Apply each rate only to its bracket: ${money(cutoff)} × ${low}% + (${money(income)} − ${money(cutoff)}) × ${high}% = ${money(tax)}.`, M());
  }),
  family('effective-tax-after-credit', 'Public Finance Drills', 'medium', v => {
    const income = 36000 + 1800 * v, liability = 6500 + 310 * v, credit = 900 + 35 * v, rate = (liability - credit) / income * 100;
    return numeric(`In a hypothetical system, a household earns ${money(income)}, owes ${money(liability)} before credits, and receives a ${money(credit)} tax credit that fully reduces its bill. What is its effective income-tax rate after the credit?`, rate,
      [liability / income * 100, credit / income * 100, (liability + credit) / income * 100, (liability - credit) / (income - credit) * 100],
      `Net tax = ${money(liability)} − ${money(credit)} = ${money(liability - credit)}. Effective rate = ${liability - credit}/${income} × 100 = ${pct(rate, 2)}.`, P());
  }),
  family('unit-tax-equilibrium-revenue', 'Public Finance Drills', 'hard', v => {
    const a = 260 + 12 * v, b = 3, c = 20 + v, d = 2, t = 4 + v % 5, pc = (a - c + d * t) / (b + d), q = a - b * pc, revenue = t * q;
    return numeric(`Demand is Qd = ${a} − ${b}Pc and supply is Qs = ${c} + ${d}Ps, where Pc is the buyer's dollar price and Ps the seller's dollar receipt. A ${money(t)} per-unit tax creates Pc − Ps = ${t}. What is tax revenue at the new equilibrium?`, revenue,
      [t * (a - b * (a - c) / (b + d)), q, t * a, t * (a - c) / (b + d)],
      `Substitute Ps = Pc − ${t}: Pc = (${a} − ${c} + ${d} × ${t})/(${b} + ${d}) = ${num(pc, 2)}. Q = ${a} − ${b} × ${num(pc, 2)} = ${num(q, 2)}. Revenue = ${t} × ${num(q, 2)} = ${money(revenue)}.`, M());
  }),
  family('tax-incidence-consumer-share', 'Public Finance Drills', 'hard', v => {
    const b = 2 + v, d = 5 + 2 * v, t = 6 + v, increase = t * d / (b + d);
    return numeric(`A competitive market has linear demand Qd = A − ${b}P and supply Qs = C + ${d}P. Both equilibria are interior. A ${money(t)} per-unit tax is introduced, with no other changes. How much does the price paid by consumers rise?`, increase,
      [t * b / (b + d), t, t / (b + d), t * d / b],
      `For these quantity slopes, buyers bear d/(b + d) of the tax: ΔPc = ${t} × ${d}/(${b} + ${d}) = ${money(increase)} per unit.`, M());
  }),
  family('simple-spending-multiplier', 'Public Finance Drills', 'medium', v => {
    const mpc = 0.55 + 0.01 * v, spending = 40 + 3 * v, output = spending / (1 - mpc);
    return numeric(`In a closed-economy Keynesian model with fixed prices, spare capacity, no induced taxes or imports, and no crowding out, MPC = ${num(mpc, 2)}. Government purchases rise by $${spending} million. What is the eventual increase in equilibrium output, in millions of dollars?`, output,
      [spending * mpc, spending, spending * mpc / (1 - mpc), spending / mpc],
      `The spending multiplier is 1/(1 − MPC). ΔY = ${spending}/(1 − ${num(mpc, 2)}) = ${num(output, 2)} million dollars.`, N(2, 'million dollars'));
  }),
  family('balanced-budget-output-effect', 'Public Finance Drills', 'hard', v => {
    const mpc = 0.60 + 0.01 * v, change = 30 + 4 * v, effect = change;
    return numeric(`In a closed Keynesian model with fixed prices, no imports, lump-sum taxes, and no crowding out, MPC is ${num(mpc, 2)}. Government purchases and lump-sum taxes both increase by $${change} million. What is the equilibrium output change, in millions of dollars?`, effect,
      [change / (1 - mpc), -mpc * change / (1 - mpc), 0, change * (1 - mpc)],
      `Combine spending and tax multipliers: ΔY = [${change} − ${num(mpc, 2)} × ${change}]/(1 − ${num(mpc, 2)}) = ${num(effect, 2)} million dollars.`, N(2, 'million dollars'));
  }),
  family('overall-budget-deficit', 'Public Finance Drills', 'easy', v => {
    const revenue = 420 + 21 * v, primary = 450 + 24 * v, interest = 32 + 2 * v, deficit = primary + interest - revenue;
    return numeric(`A hypothetical government's annual revenue is $${revenue} billion, noninterest expenditure is $${primary} billion, and interest expense is $${interest} billion. What is its overall budget deficit, in billions of dollars?`, deficit,
      [primary - revenue, revenue - primary - interest, primary + interest, revenue - interest],
      `Overall deficit includes interest: ${primary} + ${interest} − ${revenue} = ${deficit} billion dollars. The primary deficit alone would be ${primary - revenue}.`, N(0, 'billion dollars'));
  }),
  family('public-good-efficient-quantity', 'Public Finance Drills', 'hard', v => {
    const a = 80 + 3 * v, c = 60 + 2 * v, b = 2, d = 1, mc = 50 + v, q = (a + c - mc) / (b + d);
    return numeric(`Two residents consume the same quantity Q of a nonrival public service. Their marginal willingness to pay in dollars is MB1 = ${a} − ${b}Q and MB2 = ${c} − ${d}Q. Marginal provision cost is ${money(mc)}. Both marginal benefits remain positive at the optimum. What is the efficient service quantity?`, q,
      [(a - mc) / b, (c - mc) / d, (a + c) / (b + d), (a + c - mc) / (2 * (b + d))],
      `Sum marginal benefits vertically: (${a} − ${b}Q) + (${c} − ${d}Q) = ${mc}. Thus Q = (${a} + ${c} − ${mc})/(${b} + ${d}) = ${num(q, 2)} units.`, N(2, 'units'));
  }),
  family('fixed-basket-price-index', 'Inflation Measurement Drills', 'medium', v => {
    const qa = 12 + v, qb = 4 + v % 5, pa0 = 3 + v % 3, pb0 = 8 + v % 4, pa1 = pa0 + 0.4 + 0.05 * v, pb1 = pb0 + 0.6 + 0.1 * v;
    const base = qa * pa0 + qb * pb0, current = qa * pa1 + qb * pb1, index = current / base * 100;
    return numeric(`A simplified fixed basket contains ${qa} loaves of bread and ${qb} bus rides. Base-period prices are ${money(pa0)} per loaf and ${money(pb0)} per ride; current prices are ${money(pa1)} and ${money(pb1)}. With the base index set to 100, what is the current basket price index?`, index,
      [(current - base) / base * 100, base / current * 100, (pa1 / pa0 + pb1 / pb0) / 2 * 100, current],
      `Base basket cost = ${qa} × ${money(pa0)} + ${qb} × ${money(pb0)} = ${money(base)}. Current cost = ${qa} × ${money(pa1)} + ${qb} × ${money(pb1)} = ${money(current)}. Index = ${num(current, 2)}/${num(base, 2)} × 100 = ${num(index, 2)}.`, N(2, 'index points'));
  }),
  family('price-index-inflation-rate', 'Inflation Measurement Drills', 'easy', v => {
    const old = 180 + 4 * v, recent = old + 5 + 0.5 * v, rate = (recent - old) / old * 100;
    return numeric(`A hypothetical consumer price index rises from ${num(old, 1)} to ${num(recent, 1)} over one year. What is the annual inflation rate?`, rate,
      [recent - old, (recent - old) / recent * 100, recent / old * 100, old / recent * 100],
      `Inflation is the percentage change, not the index-point change: (${num(recent, 1)} − ${num(old, 1)})/${num(old, 1)} × 100 = ${pct(rate, 2)}.`, P());
  }),
  family('deflated-real-hourly-wage', 'Inflation Measurement Drills', 'easy', v => {
    const nominal = 24 + 0.75 * v, index = 112 + 2 * v, real = nominal / (index / 100);
    return numeric(`A worker earns ${money(nominal)} per hour when a consumer price index is ${index}, with the base period equal to 100. What is the hourly wage in base-period purchasing-power dollars?`, real,
      [nominal * index / 100, nominal / index, nominal - (index - 100), nominal],
      `Deflate the nominal wage: real wage = ${money(nominal)}/(${index}/100) = ${money(real)} in base-period dollars per hour.`, M());
  }),
  family('two-year-compound-inflation', 'Inflation Measurement Drills', 'medium', v => {
    const first = 2.5 + 0.1 * v, second = 3.5 + 0.15 * v, cumulative = ((1 + first / 100) * (1 + second / 100) - 1) * 100;
    return numeric(`Prices rise ${pct(first, 2)} in year 1 and ${pct(second, 2)} in year 2. What is the cumulative price increase over the two years?`, cumulative,
      [first + second, (first + second) / 2, first * second / 100, ((1 + first / 100) * (1 + second / 100)) * 100],
      `Compound the price factors: [(1 + ${num(first, 2)}/100)(1 + ${num(second, 2)}/100) − 1] × 100 = ${pct(cumulative, 2)}.`, P());
  }),
  family('cost-of-living-salary-adjustment', 'Inflation Measurement Drills', 'easy', v => {
    const salary = 42000 + 1350 * v, old = 205 + 3 * v, recent = old + 7 + v, required = salary * recent / old;
    return numeric(`A salary was ${money(salary)} when the price index was ${old}. The index is now ${recent}. What new nominal salary preserves the same purchasing power?`, required,
      [salary * old / recent, salary * (recent - old) / old, salary + recent - old, salary * (1 + (recent - old) / recent)],
      `Preserve real salary by scaling with the price-index ratio: ${money(salary)} × ${recent}/${old} = ${money(required)}.`, M());
  }),
  family('price-index-rebasing', 'Inflation Measurement Drills', 'medium', v => {
    const reference = 140 + 3 * v, current = 185 + 5 * v, rebased = current / reference * 100;
    return numeric(`On an old price-index scale, the intended new base year has index ${reference} and the current year has index ${current}. What is the current-year index after rebasing the new base year to 100?`, rebased,
      [current - reference, current - reference + 100, reference / current * 100, current / reference],
      `Rebasing rescales all levels by the same factor: new current index = ${current}/${reference} × 100 = ${num(rebased, 2)}.`, N(2, 'index points'));
  }),
  family('fixed-weight-inflation-contribution', 'Inflation Measurement Drills', 'medium', v => {
    const weight = 25 + v, food = 5 + 0.2 * v, other = 1.5 + 0.1 * v, inflation = weight / 100 * food + (1 - weight / 100) * other;
    return numeric(`In a simplified fixed-base expenditure-weight price index, food has ${weight}% of base-period spending and all other goods have ${100 - weight}%. Food prices rise ${pct(food)} and other prices rise ${pct(other)} from the same base period. What is the overall index's percentage increase?`, inflation,
      [(food + other) / 2, food + other, weight / 100 * food, (1 - weight / 100) * food + weight / 100 * other],
      `Use base spending weights: (${weight}/100) × ${pct(food)} + (${100 - weight}/100) × ${pct(other)} = ${pct(inflation, 2)}.`, P());
  }),
  family('exact-real-interest-rate', 'Inflation Measurement Drills', 'medium', v => {
    const nominal = 5 + 0.2 * v, inflation = 2 + 0.08 * v, real = ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100;
    return numeric(`An account earns a nominal annual return of ${pct(nominal, 2)} while prices rise ${pct(inflation, 2)} over the same year. What is the exact real return, using compounded purchasing power rather than the subtraction approximation?`, real,
      [nominal - inflation, nominal + inflation, nominal / inflation, ((1 + nominal / 100) * (1 + inflation / 100) - 1) * 100],
      `Exact real return = [(1 + nominal rate)/(1 + inflation rate) − 1] × 100 = [(1 + ${num(nominal, 2)}/100)/(1 + ${num(inflation, 2)}/100) − 1] × 100 = ${pct(real, 2)}.`, P());
  }),

  family('unemployment-labor-force-denominator', 'Labor Data Drills', 'easy', v => {
    const employed = 84000 + 2300 * v, unemployed = 5000 + 170 * v, outside = 33000 + 1100 * v, rate = unemployed / (employed + unemployed) * 100;
    return numeric(`In a hypothetical civilian noninstitutional population age 16+, ${num(employed)} people are employed, ${num(unemployed)} are jobless and actively seeking available work, and ${num(outside)} are outside the labor force. What is the unemployment rate?`, rate,
      [unemployed / (employed + unemployed + outside) * 100, unemployed / employed * 100, outside / (employed + unemployed + outside) * 100, (unemployed + outside) / (employed + unemployed + outside) * 100],
      `The labor force includes employed plus unemployed, so the rate is ${num(unemployed)}/(${num(employed)} + ${num(unemployed)}) × 100 = ${pct(rate, 2)}. People outside the labor force do not enter this denominator.`, P());
  }),
  family('labor-force-participation', 'Labor Data Drills', 'easy', v => {
    const population = 150000 + 4700 * v, employed = 92000 + 2900 * v, unemployed = 6000 + 180 * v, rate = (employed + unemployed) / population * 100;
    return numeric(`A region's civilian noninstitutional population age 16+ is ${num(population)}. It has ${num(employed)} employed people and ${num(unemployed)} unemployed people who meet the active-search definition. What is its labor force participation rate?`, rate,
      [employed / population * 100, unemployed / (employed + unemployed) * 100, (population - employed - unemployed) / population * 100, (employed + unemployed) / employed * 100],
      `Participation rate = (employed + unemployed)/eligible population × 100 = (${num(employed)} + ${num(unemployed)})/${num(population)} × 100 = ${pct(rate, 2)}.`, P());
  }),
  family('employment-population-ratio', 'Labor Data Drills', 'easy', v => {
    const employed = 67000 + 2100 * v, unemployed = 4200 + 140 * v, population = 112000 + 3600 * v, ratio = employed / population * 100;
    return numeric(`A hypothetical area has ${num(employed)} employed residents, ${num(unemployed)} unemployed residents, and ${num(population)} total civilian noninstitutional residents age 16+. What is the employment–population ratio?`, ratio,
      [(employed + unemployed) / population * 100, employed / (employed + unemployed) * 100, unemployed / population * 100, (population - employed) / population * 100],
      `Employment–population ratio uses employed people in the numerator: ${num(employed)}/${num(population)} × 100 = ${pct(ratio, 2)}.`, P());
  }),
  family('new-jobseekers-unemployment-rate', 'Labor Data Drills', 'medium', v => {
    const employed = 50000 + 1700 * v, unemployed = 3000 + 90 * v, entrants = 700 + 35 * v, rate = (unemployed + entrants) / (employed + unemployed + entrants) * 100;
    return numeric(`Initially ${num(employed)} people are employed and ${num(unemployed)} unemployed. Then ${num(entrants)} people previously outside the labor force begin actively searching and are available for work, but none has a job yet. With no other changes, what is the new unemployment rate?`, rate,
      [(unemployed + entrants) / (employed + unemployed) * 100, unemployed / (employed + unemployed + entrants) * 100, unemployed / (employed + unemployed) * 100, (unemployed + entrants) / employed * 100],
      `New jobseekers enter both unemployment and the labor force: (${num(unemployed)} + ${num(entrants)})/(${num(employed)} + ${num(unemployed)} + ${num(entrants)}) × 100 = ${pct(rate, 2)}.`, P());
  }),
  family('broad-u6-underutilization', 'Labor Data Drills', 'hard', v => {
    const employed = 75000 + 2200 * v, unemployed = 4500 + 130 * v, marginal = 1800 + 65 * v, part = 3100 + 80 * v, rate = (unemployed + marginal + part) / (employed + unemployed + marginal) * 100;
    return numeric(`A hypothetical survey counts ${num(employed)} employed people, including ${num(part)} working part time for economic reasons; ${num(unemployed)} unemployed; and ${num(marginal)} marginally attached people outside the labor force. What is U-6 labor underutilization?`, rate,
      [(unemployed + marginal + part) / (employed + unemployed) * 100, unemployed / (employed + unemployed) * 100, (unemployed + marginal) / (employed + unemployed + marginal) * 100, (unemployed + marginal + part) / (employed + unemployed + marginal + part) * 100],
      `U-6 = (unemployed + marginally attached + involuntary part-time)/(labor force + marginally attached). Thus (${num(unemployed)} + ${num(marginal)} + ${num(part)})/(${num(employed)} + ${num(unemployed)} + ${num(marginal)}) × 100 = ${pct(rate, 2)}. Part-time workers are already included among employed people.`, P());
  }),
  family('real-output-per-hour', 'Labor Data Drills', 'easy', v => {
    const output = 1800000 + 127000 * v, hours = 30000 + 1300 * v, productivity = output / hours;
    return numeric(`An industry produces ${money(output)} of real value added in a month using ${num(hours)} total labor hours. What is labor productivity in real dollars per hour?`, productivity,
      [hours / output, output / (hours * 8), output * hours, output / (hours / 8)],
      `Labor productivity = real output/labor hours = ${money(output)}/${num(hours)} = ${money(productivity)} per hour.`, M());
  }),
  family('worker-separation-rate', 'Labor Data Drills', 'easy', v => {
    const start = 16000 + 650 * v, separations = 420 + 17 * v, hires = 510 + 21 * v, rate = separations / start * 100;
    return numeric(`A firm group begins the month with ${num(start)} employees. During the month, ${num(separations)} employees separate and ${num(hires)} are hired. Define the monthly separation rate here as separations divided by start-of-month employment. What is the rate?`, rate,
      [hires / start * 100, (separations - hires) / start * 100, separations / (start + hires - separations) * 100, (separations + hires) / start * 100],
      `Use the stated beginning-employment denominator: ${num(separations)}/${num(start)} × 100 = ${pct(rate, 2)}. Hiring does not enter this defined rate.`, P());
  }),
  family('weekly-earnings-hours', 'Labor Data Drills', 'easy', v => {
    const hourly = 21.5 + 0.65 * v, hours = 32 + 0.25 * v, weekly = hourly * hours;
    return numeric(`A worker earns ${money(hourly)} per hour for ${num(hours, 2)} hours in a week. All hours are paid at the regular rate, and there are no bonuses. What are gross weekly earnings?`, weekly,
      [hourly * 40, hourly * 52, hourly + hours, weekly / 52],
      `Gross weekly earnings = hourly wage × paid hours = ${money(hourly)} × ${num(hours, 2)} = ${money(weekly)}.`, M());
  }),

  family('goods-services-net-exports', 'Trade Data Drills', 'easy', v => {
    const gx = 180 + 11 * v, sx = 85 + 5 * v, gm = 235 + 13 * v, sm = 58 + 3 * v, nx = gx + sx - gm - sm;
    return numeric(`A hypothetical country exports $${gx} billion of goods and $${sx} billion of services, while importing $${gm} billion of goods and $${sm} billion of services. What are total net exports, in billions of dollars?`, nx,
      [gm + sm - gx - sx, gx - gm, gx + sx + gm + sm, sx - sm],
      `Net exports = goods exports + services exports − goods imports − services imports = ${gx} + ${sx} − ${gm} − ${sm} = ${nx} billion dollars. A negative result is a trade deficit.`, N(0, 'billion dollars'));
  }),
  family('foreign-invoice-conversion', 'Trade Data Drills', 'easy', v => {
    const invoice = 7500 + 425 * v, rate = 1.04 + 0.01 * v, dollars = invoice * rate;
    return numeric(`A U.S. importer owes €${num(invoice)}. The exchange rate is ${money(rate)} per euro, with no fees. How many U.S. dollars are needed to pay the invoice?`, dollars,
      [invoice / rate, invoice * (rate - 1), invoice + rate, invoice],
      `The quote is dollars per euro, so multiply: €${num(invoice)} × ${money(rate)}/€ = ${money(dollars)}.`, M());
  }),
  family('reciprocal-currency-appreciation', 'Trade Data Drills', 'medium', v => {
    const old = 1.28 + 0.01 * v, recent = 1.12 + 0.008 * v, appreciation = (old / recent - 1) * 100;
    return numeric(`The exchange rate changes from ${num(old, 3)} U.S. dollars per euro to ${num(recent, 3)} dollars per euro. By what percentage does the dollar appreciate when measured in euros per dollar?`, appreciation,
      [(old - recent) / old * 100, (recent - old) / old * 100, (recent / old - 1) * 100, (old - recent) * 100],
      `A dollar buys 1/${num(old, 3)} euros initially and 1/${num(recent, 3)} later. Dollar appreciation = [(1/${num(recent, 3)})/(1/${num(old, 3)}) − 1] × 100 = ${pct(appreciation, 2)}.`, P());
  }),
  family('terms-of-trade-index', 'Trade Data Drills', 'medium', v => {
    const exports = 116 + 2.5 * v, imports = 108 + 1.5 * v, terms = exports / imports * 100;
    return numeric(`A country's export price index is ${num(exports, 1)} and import price index is ${num(imports, 1)}, both using the same base year = 100. What is its terms-of-trade index, defined as export prices relative to import prices?`, terms,
      [imports / exports * 100, exports - imports, (exports - imports) / imports * 100, exports + imports],
      `Terms of trade = export price index/import price index × 100 = ${num(exports, 1)}/${num(imports, 1)} × 100 = ${num(terms, 2)}.`, N(2, 'index points'));
  }),
  family('small-country-tariff-revenue', 'Trade Data Drills', 'hard', v => {
    const a = 500 + 17 * v, b = 4, c = 20 + v, d = 2, world = 35 + v, tariff = 5 + v % 4, domestic = world + tariff, qd = a - b * domestic, qs = c + d * domestic, imports = qd - qs, revenue = tariff * imports;
    return numeric(`A small importing country faces a fixed world price of ${money(world)} and imposes a ${money(tariff)} per-unit tariff. Domestic demand is Qd = ${a} − ${b}P and supply is Qs = ${c} + ${d}P. Imports remain positive and there are no transport costs. What tariff revenue is collected?`, revenue,
      [tariff * qd, tariff * qs, tariff * (a - b * world - c - d * world), domestic * imports],
      `Domestic P = ${world} + ${tariff} = ${domestic}. Imports = (${a} − ${b} × ${domestic}) − (${c} + ${d} × ${domestic}) = ${imports}. Revenue = ${tariff} × ${imports} = ${money(revenue)}.`, M());
  }),
  family('import-quota-rent', 'Trade Data Drills', 'medium', v => {
    const world = 28 + v, domestic = world + 7 + v % 5, quota = 650 + 37 * v, rent = (domestic - world) * quota;
    return numeric(`An import quota permits ${num(quota)} units. The domestic price is ${money(domestic)} and the fixed world price is ${money(world)}. With no tariffs, transport costs, or license fees, what is the total quota rent available to license holders?`, rent,
      [domestic * quota, world * quota, domestic - world, (domestic + world) * quota],
      `Quota rent is the price wedge times permitted imports: (${money(domestic)} − ${money(world)}) × ${num(quota)} = ${money(rent)}.`, M());
  }),
  family('effective-protection-value-added', 'Trade Data Drills', 'hard', v => {
    const output = 200 + 10 * v, input = 100 + 4 * v, outputTariff = 12 + v % 5, inputTariff = 3 + v % 3, freeVA = output - input, protectedVA = output * (1 + outputTariff / 100) - input * (1 + inputTariff / 100), effective = (protectedVA - freeVA) / freeVA * 100;
    return numeric(`At free-trade prices, a finished unit sells for ${money(output)} and requires ${money(input)} of imported inputs. Hypothetical tariffs of ${outputTariff}% on the output and ${inputTariff}% on inputs fully raise their domestic prices; input quantities are unchanged. What is the effective protection rate for domestic value added?`, effective,
      [outputTariff, outputTariff - inputTariff, (protectedVA - freeVA) / output * 100, (protectedVA - freeVA) / protectedVA * 100],
      `Free-trade value added = ${output} − ${input} = ${freeVA}. Protected value added = ${output}(1 + ${outputTariff}/100) − ${input}(1 + ${inputTariff}/100) = ${num(protectedVA, 2)}. Effective protection = (${num(protectedVA, 2)} − ${freeVA})/${freeVA} × 100 = ${pct(effective, 2)}.`, P());
  }),
  family('current-account-components', 'Trade Data Drills', 'medium', v => {
    const goods = -70 - 3 * v, services = 28 + 2 * v, income = 14 + v, transfers = -11 - 0.5 * v, current = goods + services + income + transfers;
    return numeric(`A country's balances, all in billions of dollars, are goods ${goods}, services +${services}, primary income +${income}, and secondary income ${transfers}. Positive figures are net receipts. What is the current-account balance?`, current,
      [goods + services, goods + services + income - transfers, -current, goods + services - income + transfers],
      `The current account sums trade, primary income, and secondary income balances: (${goods}) + ${services} + ${income} + (${transfers}) = ${num(current, 1)} billion dollars.`, N(1, 'billion dollars'));
  }),

  family('expenditure-gdp', 'Economic Growth Drills', 'easy', v => {
    const c = 720 + 37 * v, i = 160 + 11 * v, g = 210 + 13 * v, x = 140 + 9 * v, m = 170 + 10 * v, transfers = 65 + 3 * v, gdp = c + i + g + x - m;
    return numeric(`In a hypothetical economy, annual values in billions of dollars are household consumption ${c}, gross investment ${i}, government purchases ${g}, exports ${x}, and imports ${m}. Government transfer payments are separately ${transfers}. What is GDP using the expenditure approach?`, gdp,
      [c + i + g + x + m, gdp + transfers, c + i + g, c + i + g - x + m],
      `GDP = C + I + G + X − M = ${c} + ${i} + ${g} + ${x} − ${m} = ${gdp} billion dollars. Transfers are not government purchases of current output.`, N(0, 'billion dollars'));
  }),
  family('real-gdp-growth', 'Economic Growth Drills', 'easy', v => {
    const prior = 1200 + 65 * v, current = prior + 36 + 3 * v, growth = (current - prior) / prior * 100;
    return numeric(`Real GDP, measured consistently in constant purchasing-power units, rises from ${num(prior)} billion to ${num(current)} billion over a year. What is the real GDP growth rate?`, growth,
      [(current - prior) / current * 100, current - prior, current / prior * 100, prior / current * 100],
      `Real GDP growth = (current − prior)/prior × 100 = (${current} − ${prior})/${prior} × 100 = ${pct(growth, 2)}.`, P());
  }),
  family('real-per-capita-growth', 'Economic Growth Drills', 'medium', v => {
    const outputGrowth = 3.4 + 0.12 * v, populationGrowth = 0.7 + 0.03 * v, perCapita = ((1 + outputGrowth / 100) / (1 + populationGrowth / 100) - 1) * 100;
    return numeric(`Real GDP grows ${pct(outputGrowth, 2)} while population grows ${pct(populationGrowth, 2)} over the same year. What is the exact growth rate of real GDP per person?`, perCapita,
      [outputGrowth - populationGrowth, outputGrowth + populationGrowth, outputGrowth / populationGrowth, ((1 + outputGrowth / 100) * (1 + populationGrowth / 100) - 1) * 100],
      `Per-capita growth = [(1 + GDP growth)/(1 + population growth) − 1] × 100 = [(1 + ${num(outputGrowth, 2)}/100)/(1 + ${num(populationGrowth, 2)}/100) − 1] × 100 = ${pct(perCapita, 2)}.`, P());
  }),
  family('compound-output-projection', 'Economic Growth Drills', 'medium', v => {
    const base = 850 + 42 * v, growth = 2.1 + 0.1 * v, years = 5 + v % 6, future = base * (1 + growth / 100) ** years;
    return numeric(`A hypothetical economy has real annual output of ${base} billion dollars. If it grows at a constant ${pct(growth)} per year for ${years} years, what will annual real output be then, in billions of dollars?`, future,
      [base * (1 + years * growth / 100), base * (1 + growth / 100), base * (growth / 100) ** years, base * (1 + growth / 100) ** (years - 1)],
      `Compound growth each year: future output = ${base} × (1 + ${num(growth, 1)}/100)^${years} = ${num(future, 2)} billion dollars.`, N(2, 'billion dollars'));
  }),
  family('output-compound-annual-growth-rate', 'Economic Growth Drills', 'medium', v => {
    const start = 600 + 30 * v, end = 900 + 55 * v, years = 6 + v % 5, rate = ((end / start) ** (1 / years) - 1) * 100;
    return numeric(`Real annual output rises from ${start} billion dollars to ${end} billion dollars over ${years} years. What constant compound annual growth rate would generate this change?`, rate,
      [(end - start) / start * 100 / years, (end - start) / start * 100, (end / start) ** (1 / years) * 100, (end - start) / end * 100 / years],
      `Solve ${end} = ${start}(1 + g)^${years}. Thus g = [(${end}/${start})^(1/${years}) − 1] × 100 = ${pct(rate, 2)} annually.`, P());
  }),
  family('net-capital-accumulation', 'Economic Growth Drills', 'medium', v => {
    const capital = 1800 + 95 * v, invest = 230 + 14 * v, depreciation = 6 + 0.1 * v, next = capital * (1 - depreciation / 100) + invest;
    return numeric(`An economy starts the year with a real capital stock of ${capital} billion dollars. Existing capital depreciates ${pct(depreciation)} during the year, and ${invest} billion of new investment is installed at year-end. What is the end-of-year capital stock?`, next,
      [capital + invest, capital * (1 - depreciation / 100), (capital + invest) * (1 - depreciation / 100), invest - capital * depreciation / 100],
      `New investment is installed after existing-capital depreciation: Knext = ${capital}(1 − ${num(depreciation, 1)}/100) + ${invest} = ${num(next, 2)} billion dollars.`, N(2, 'billion dollars'));
  }),
  family('solow-steady-state-capital', 'Economic Growth Drills', 'hard', v => {
    const saving = 0.15 + 0.005 * v, productivity = 2 + 0.1 * v, depreciation = 0.05 + 0.001 * v, k = (saving * productivity / depreciation) ** 2;
    return numeric(`In a Solow model with no population or technology growth, output per worker is y = ${num(productivity, 1)}√k, the saving rate is ${pct(saving * 100, 1)}, and annual depreciation is ${pct(depreciation * 100, 1)}. What is the positive steady-state capital per worker k?`, k,
      [saving * productivity / depreciation, (productivity / depreciation) ** 2, (depreciation / (saving * productivity)) ** 2, (saving / depreciation) ** 2],
      `At a steady state, investment equals depreciation: ${num(saving, 3)} × ${num(productivity, 1)}√k = ${num(depreciation, 3)}k. For k > 0, k = (${num(saving, 3)} × ${num(productivity, 1)}/${num(depreciation, 3)})² = ${num(k, 2)} capital units per worker.`, N(2, 'capital units per worker'));
  }),
  family('growth-accounting-tfp', 'Economic Growth Drills', 'hard', v => {
    const output = 3.8 + 0.12 * v, capital = 4.5 + 0.1 * v, labor = 1.2 + 0.04 * v, alpha = 0.3 + 0.01 * (v % 6), tfp = output - alpha * capital - (1 - alpha) * labor;
    return numeric(`Use the growth-accounting approximation gY = gA + αgK + (1 − α)gL. Output grows ${pct(output, 2)}, capital ${pct(capital, 2)}, and labor ${pct(labor, 2)}; capital's share α is ${num(alpha, 2)}. What is implied total factor productivity growth gA?`, tfp,
      [output - capital - labor, output - alpha * capital, output - (1 - alpha) * labor, output + alpha * capital + (1 - alpha) * labor],
      `Rearrange the stated approximation: gA = ${num(output, 2)} − ${num(alpha, 2)} × ${num(capital, 2)} − (1 − ${num(alpha, 2)}) × ${num(labor, 2)} = ${pct(tfp, 2)}.`, P());
  }),

  family('employment-weighted-mean-wage', 'Statistics Drills', 'medium', v => {
    const n1 = 24 + v, n2 = 42 + 2 * v, w1 = 18 + 0.5 * v, w2 = 29 + 0.7 * v, mean = (n1 * w1 + n2 * w2) / (n1 + n2);
    return numeric(`In a two-sector workforce, ${n1} workers earn ${money(w1)} per hour and ${n2} workers earn ${money(w2)} per hour. What is the mean hourly wage across all workers?`, mean,
      [(w1 + w2) / 2, (n1 * w1 + n2 * w2) / 2, (n1 * w2 + n2 * w1) / (n1 + n2), n1 * w1 / (n1 + n2)],
      `Weight each wage by its worker count: (${n1} × ${money(w1)} + ${n2} × ${money(w2)})/(${n1} + ${n2}) = ${money(mean)} per hour.`, M());
  }),
  family('median-household-spending', 'Statistics Drills', 'easy', v => {
    const base = 320 + 17 * v, values = [base + 190, base, base + 65, base + 45, base + 120, base + 35, base + 80], sorted = [...values].sort((a, b) => a - b), median = sorted[3], mean = values.reduce((a, b) => a + b, 0) / values.length;
    return numeric(`Seven households report weekly spending of ${values.map(x => money(x, 0)).join(', ')}. What is median weekly spending?`, median,
      [mean, values[3], (sorted[2] + sorted[3]) / 2, sorted[4]],
      `Sort the observations: ${sorted.map(x => money(x, 0)).join(', ')}. The middle position is (7 + 1)/2 = 4, so the median is ${money(median)}.`, M());
  }),
  family('population-variance-output', 'Statistics Drills', 'medium', v => {
    const center = 30 + 2 * v, a = 3 + v % 4, b = 7 + v, values = [center - b, center - a, center + a, center + b], variance = (a * a + b * b) / 2;
    return numeric(`The complete population of four small factories produces ${values.join(', ')} units per hour. What is the population variance of hourly output, in squared output units?`, variance,
      [Math.sqrt(variance), variance * 4 / 3, variance * 4, (a + b) / 2],
      `The mean is (${values.join(' + ')})/4 = ${center}. Population variance divides by N = 4: [(${values[0]} − ${center})² + (${values[1]} − ${center})² + (${values[2]} − ${center})² + (${values[3]} − ${center})²]/4 = ${num(variance, 2)}.`, N(2, 'squared units'));
  }),
  family('sample-mean-standard-error', 'Statistics Drills', 'medium', v => {
    const root = 10 + v, n = root * root, sd = 45 + 3 * v, se = sd / Math.sqrt(n);
    return numeric(`An independent simple random sample of ${n} households has a spending standard deviation of ${money(sd)}. Ignoring finite-population corrections and survey weighting, what is the estimated standard error of the sample mean?`, se,
      [sd / n, sd, sd * Math.sqrt(n), sd * sd / n],
      `For an independent simple random sample, SE(mean) = s/√n = ${money(sd)}/√${n} = ${money(se)}.`, M());
  }),
  family('confidence-interval-upper-limit', 'Statistics Drills', 'medium', v => {
    const estimate = 520 + 23 * v, se = 18 + v, upper = estimate + 1.96 * se;
    return numeric(`An estimated mean weekly expenditure is ${money(estimate)} with standard error ${money(se)}. Under a normal approximation, use 1.96 as the two-sided 95% critical value. What is the upper confidence limit?`, upper,
      [estimate - 1.96 * se, estimate + se, 1.96 * se, estimate + 1.645 * se],
      `Upper confidence limit = estimate + critical value × SE = ${money(estimate)} + 1.96 × ${money(se)} = ${money(upper)}.`, M());
  }),
  family('conditional-training-employment', 'Statistics Drills', 'medium', v => {
    const trainedWorking = 80 + 4 * v, trainedNot = 20 + 2 * v, untrainedWorking = 95 + 3 * v, untrainedNot = 45 + 2 * v, probability = trainedWorking / (trainedWorking + trainedNot) * 100;
    return numeric(`A survey finds ${trainedWorking} trained people employed and ${trainedNot} trained people not employed. It also finds ${untrainedWorking} untrained people employed and ${untrainedNot} untrained people not employed. What is the probability a randomly selected trained person is employed?`, probability,
      [trainedWorking / (trainedWorking + trainedNot + untrainedWorking + untrainedNot) * 100, trainedWorking / (trainedWorking + untrainedWorking) * 100, (trainedWorking + untrainedWorking) / (trainedWorking + trainedNot + untrainedWorking + untrainedNot) * 100, trainedNot / (trainedWorking + trainedNot) * 100],
      `Condition on being trained, so only trained people enter the denominator: ${trainedWorking}/(${trainedWorking} + ${trainedNot}) × 100 = ${pct(probability, 2)}.`, P());
  }),
  family('linear-regression-consumption-prediction', 'Statistics Drills', 'easy', v => {
    const intercept = 120 + 7 * v, slope = 0.55 + 0.01 * v, income = 1800 + 85 * v, prediction = intercept + slope * income;
    return numeric(`A fitted monthly consumption regression is predicted C = ${intercept} + ${num(slope, 2)}Y, where C and disposable income Y are in dollars. What consumption does the regression predict at income ${money(income)}?`, prediction,
      [slope * income, intercept + income, intercept * slope + income, (income - intercept) / slope],
      `Substitute income into the fitted line: predicted C = ${intercept} + ${num(slope, 2)} × ${income} = ${money(prediction)}. This is a model prediction, not a guaranteed household outcome.`, M());
  }),
  family('sample-covariance-growth', 'Statistics Drills', 'hard', v => {
    const xMean = 3 + 0.1 * v, yMean = 2 + 0.05 * v, dx = 0.5 + 0.05 * v, dy = 0.8 + 0.04 * v, x = [xMean - dx, xMean, xMean + dx], y = [yMean - dy, yMean + 0.2, yMean + dy - 0.2], covariance = dx * (2 * dy - 0.2) / 2;
    return numeric(`Three paired annual observations of output growth x and wage growth y, in percentage-point units, are (${num(x[0], 2)}, ${num(y[0], 2)}), (${num(x[1], 2)}, ${num(y[1], 2)}), and (${num(x[2], 2)}, ${num(y[2], 2)}). What is their sample covariance, using n − 1 in the denominator?`, covariance,
      [covariance * 2 / 3, covariance * 2, dx * dy, -covariance, Math.sqrt(Math.abs(covariance))],
      `Means are x̄ = ${num(xMean, 2)} and ȳ = ${num(yMean, 2)}. Sample covariance = [(${num(x[0], 2)} − ${num(xMean, 2)})(${num(y[0], 2)} − ${num(yMean, 2)}) + (${num(x[1], 2)} − ${num(xMean, 2)})(${num(y[1], 2)} − ${num(yMean, 2)}) + (${num(x[2], 2)} − ${num(xMean, 2)})(${num(y[2], 2)} − ${num(yMean, 2)})]/(3 − 1) = ${num(covariance, 2)} squared percentage points.`, N(2, 'squared percentage points'));
  }),
];
