import { BTCPricePoint, StrategyConfig, SimulationResult, StrategyStats, Frequency, FearGreedPoint, RebalanceFrequency } from '../types';
import { format, isSameDay, getDay, getDate, isAfter, isBefore, differenceInCalendarDays } from 'date-fns';

const startOfDay = (date: Date | number): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const calculateSMA = (data: BTCPricePoint[], period: number): Map<number, number> => {
  const smaMap = new Map<number, number>();
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue; 
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].price;
    }
    smaMap.set(data[i].date, sum / period);
  }
  return smaMap;
};

export const calculateDCA = (
  priceData: BTCPricePoint[],
  fearGreedData: FearGreedPoint[],
  config: StrategyConfig
): { timeline: SimulationResult[]; stats: StrategyStats } => {
  if (!priceData || priceData.length === 0) {
    return {
      timeline: [],
      stats: {
        totalInvested: 0, finalPortfolioValue: 0, totalReturn: 0, percentageReturn: 0,
        tradesCount: 0, rebalanceCount: 0, currentBTCPrice: 0, finalCashBalance: 0, finalBTCValue: 0,
        isLiquidated: false, liquidationDate: null,
        finalBTCAmount: 0, averageEntryPrice: 0, currentFearGreed: null, durationDays: 0
      },
    };
  }

  // 1. Prepare Data
  const sortedData = [...priceData].sort((a, b) => a.date - b.date);
  const ma200Map = calculateSMA(sortedData, 200);
  const ma350Map = calculateSMA(sortedData, 350);

  const start = startOfDay(new Date(config.startDate));
  const end = startOfDay(new Date(config.endDate));

  const fgMap = new Map<string, number>();
  if (fearGreedData) {
    fearGreedData.forEach(p => fgMap.set(format(new Date(p.date), 'yyyy-MM-dd'), p.value));
  }

  const timeline: SimulationResult[] = [];
  
  // 2. Initialize Portfolio State
  let currentCash = config.initialInvestment;
  let currentBTC = 0;
  let totalInvested = config.initialInvestment;
  let tradesCount = 0;
  let rebalanceCount = 0;
  let isLiquidated = false;
  let liquidationDate: string | null = null;
  
  // Track total value of assets purchased (including borrowed money) to calculate Average Entry
  let totalFiatValueUsedToBuy = 0; 
  let leverageRatio = config.enableLeverage ? config.leverage : 1;

  // Filter relevant range
  const relevantData = sortedData.filter((point) => {
    const pointDate = startOfDay(new Date(point.date));
    return (isAfter(pointDate, start) || isSameDay(pointDate, start)) && 
           (isBefore(pointDate, end) || isSameDay(pointDate, end));
  });

  // Handle Initial Allocation on Day 1 (if config enabled)
  let initialAllocDone = false;

  for (let i = 0; i < relevantData.length; i++) {
    const point = relevantData[i];
    const currentDate = new Date(point.date);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const price = point.price;
    const ma200 = ma200Map.get(point.date) || null;
    const ma350 = ma350Map.get(point.date) || null;
    const fearGreedValue = fgMap.get(dateStr) || null;

    let action: SimulationResult['action'] = 'none';
    let actionAmount = 0;
    
    // --- LIQUIDATION CHECK ---
    let averageEntryPrice: number | null = null;
    let liquidationPrice: number | null = null;

    if (currentBTC > 0) {
      averageEntryPrice = totalFiatValueUsedToBuy / currentBTC;
      
      if (config.enableLeverage) {
        liquidationPrice = averageEntryPrice * (1 - (1 / leverageRatio));
        
        if (!isLiquidated && liquidationPrice > 0 && price <= liquidationPrice) {
          isLiquidated = true;
          liquidationDate = dateStr;
          currentCash = 0;
          currentBTC = 0;
          totalFiatValueUsedToBuy = 0;
          action = 'liquidation';
        }
      }
    }

    if (isLiquidated) {
       timeline.push({
        date: dateStr,
        timestamp: point.date,
        btcPrice: price,
        cashBalance: 0,
        btcAmount: 0,
        btcValue: 0,
        portfolioValue: 0,
        invested: totalInvested,
        totalInvested: totalInvested,
        returnRate: -100,
        isTradeDay: action === 'liquidation',
        action: action === 'liquidation' ? 'liquidation' : 'none',
        actionAmount: 0,
        ma200,
        ma350,
        averageEntryPrice: averageEntryPrice,
        liquidationPrice: liquidationPrice,
        isLiquidated: true,
        fearGreedValue
      });
      continue;
    }

    // --- STEP A: Initial Allocation (Day 1) ---
    if (!initialAllocDone && config.initialInvestment > 0) {
      if (config.enableKellyRebalance) {
        // Kelly: Allocate a percentage of EQUITY to BTC.
        // If leverage is on, that Equity buys (Equity * Leverage) worth of BTC.
        const targetEquityForBTC = config.initialInvestment * (config.targetRatio / 100);
        
        // Effective buy power (Gross)
        const effectiveBuyPower = targetEquityForBTC * leverageRatio;
        
        const btcToBuy = effectiveBuyPower / price;
        currentBTC += btcToBuy;
        
        // We pay for the equity portion out of cash
        currentCash -= targetEquityForBTC; 
        
        totalFiatValueUsedToBuy += effectiveBuyPower;

        action = 'rebalance_buy';
        actionAmount = targetEquityForBTC;
      } else {
        const effectiveBuyPower = config.initialInvestment * leverageRatio;
        const btcToBuy = effectiveBuyPower / price;
        currentBTC += btcToBuy;
        currentCash = 0;
        
        totalFiatValueUsedToBuy += effectiveBuyPower;
        
        action = 'dca_buy';
        actionAmount = config.initialInvestment;
      }
      initialAllocDone = true;
    }

    // --- STEP B: DCA Injection Logic ---
    let isDcaDay = false;
    if (config.frequency === Frequency.DAILY) isDcaDay = true;
    else if (config.frequency === Frequency.WEEKLY && getDay(currentDate) === config.dayOfWeek) isDcaDay = true;
    else if (config.frequency === Frequency.MONTHLY && getDate(currentDate) === config.dayOfMonth) isDcaDay = true;

    let allowDca = true;
    if (config.enableFearGreedFilter) {
      const fgValue = fgMap.get(dateStr);
      if (fgValue === undefined || fgValue > config.fearGreedThreshold) allowDca = false;
    }
    if (config.enableMaFilter) {
      const maValue = config.maThresholdType === '200' ? ma200 : ma350;
      if (maValue === undefined || maValue === null || price >= maValue) allowDca = false;
    }

    if (isDcaDay && allowDca && config.amount > 0) {
      totalInvested += config.amount;

      if (config.enableKellyRebalance) {
        currentCash += config.amount;
        if (action === 'none') {
            action = 'dca_deposit';
            actionAmount = config.amount;
        }
      } else {
        const effectiveBuyPower = config.amount * leverageRatio;
        const btcBought = effectiveBuyPower / price;
        currentBTC += btcBought;
        
        totalFiatValueUsedToBuy += effectiveBuyPower;

        tradesCount++;
        action = 'dca_buy';
        actionAmount = config.amount;
      }
    }

    // --- STEP C: Rebalancing Logic ---
    if (config.enableKellyRebalance) {
      let shouldRebalance = false;

      if (config.rebalanceFrequency === RebalanceFrequency.EVERY_DCA && isDcaDay && allowDca) shouldRebalance = true;
      else if (config.rebalanceFrequency === RebalanceFrequency.DAILY) shouldRebalance = true;
      else if (config.rebalanceFrequency === RebalanceFrequency.WEEKLY && getDay(currentDate) === config.dayOfWeek) shouldRebalance = true;
      else if (config.rebalanceFrequency === RebalanceFrequency.MONTHLY && getDate(currentDate) === config.dayOfMonth) shouldRebalance = true;
      
      if (i === 0) shouldRebalance = true;

      if (shouldRebalance) {
        const currentBTCValue = currentBTC * price;
        
        // Calculate Loan Liability
        let currentLoan = 0;
        if (config.enableLeverage && leverageRatio > 1 && currentBTC > 0) {
            // Loan tracks the portion of TotalFiatValueUsedToBuy that isn't covered by the initial cash outlay (equity)
            // Simplified: Loan = CostBasis * ((L-1)/L)
            currentLoan = totalFiatValueUsedToBuy * ((leverageRatio - 1) / leverageRatio);
        }

        // Net Portfolio Equity = Cash + GrossBTC - Loan
        const portfolioEquity = currentCash + currentBTCValue - currentLoan;
        
        // Target Equity Allocation for BTC
        const targetEquityForBTC = portfolioEquity * (config.targetRatio / 100);
        
        // Target GROSS BTC Value needed to achieve that Equity Allocation
        // If leveraging, the Gross Position = EquityAlloc * Leverage
        const targetBTCValueGross = config.enableLeverage 
            ? targetEquityForBTC * leverageRatio 
            : targetEquityForBTC;

        const diff = targetBTCValueGross - currentBTCValue;
        
        // Threshold to avoid dust trades
        if (Math.abs(diff) > 5) { 
          if (diff > 0) {
            // BUYING
            // We need to spend Equity to buy more Gross BTC.
            // Amount of Equity needed = Diff (in Gross terms) / Leverage
            const equityNeeded = diff / leverageRatio;
            
            const amountToSpend = Math.min(equityNeeded, currentCash);
            
            if (amountToSpend > 0) {
                const effectiveBuyPower = amountToSpend * leverageRatio;
                const btcPurchased = effectiveBuyPower / price;
                
                currentBTC += btcPurchased;
                currentCash -= amountToSpend;
                totalFiatValueUsedToBuy += effectiveBuyPower;
                
                rebalanceCount++;
                action = 'rebalance_buy'; 
                actionAmount = amountToSpend;
            }
          } else {
            // SELLING
            const amountToSellGross = Math.abs(diff);
            const btcSold = amountToSellGross / price;
            
            // Capture state before modification
            const oldBTC = currentBTC;

            if (currentBTC >= btcSold) {
                currentBTC -= btcSold;
                
                // When selling leveraged assets, we pay back the loan portion.
                // Cash Proceeds = GrossProceeds / Leverage (Mathematically: Gross - (Gross * (L-1)/L))
                const cashProceeds = amountToSellGross / leverageRatio;
                
                currentCash += cashProceeds;
                
                // Reduce the Cost Basis (and effectively the tracked loan) proportionally
                if (oldBTC > 0) {
                    const fractionSold = btcSold / oldBTC;
                    totalFiatValueUsedToBuy = totalFiatValueUsedToBuy * (1 - fractionSold);
                }

                rebalanceCount++;
                action = 'rebalance_sell';
                actionAmount = cashProceeds;
            }
          }
        }
      }
    }

    let portfolioValue = 0;
    if (config.enableLeverage && leverageRatio > 1) {
        const positionValue = currentBTC * price;
        const loanAmount = totalFiatValueUsedToBuy * ((leverageRatio - 1) / leverageRatio);
        const equityInBTC = positionValue - loanAmount;
        portfolioValue = currentCash + equityInBTC;
    } else {
        portfolioValue = currentCash + (currentBTC * price);
    }

    const returnRate = totalInvested > 0 ? ((portfolioValue - totalInvested) / totalInvested) * 100 : 0;
    
    if (currentBTC > 0) {
        averageEntryPrice = totalFiatValueUsedToBuy / currentBTC;
        if (config.enableLeverage) {
             liquidationPrice = averageEntryPrice * (1 - (1 / leverageRatio));
        }
    }

    timeline.push({
      date: dateStr,
      timestamp: point.date,
      btcPrice: price,
      cashBalance: currentCash,
      btcAmount: currentBTC,
      btcValue: currentBTC * price,
      portfolioValue: portfolioValue,
      invested: totalInvested, 
      totalInvested: totalInvested,
      returnRate: returnRate,
      isTradeDay: action !== 'none',
      action: action,
      actionAmount: actionAmount,
      ma200,
      ma350,
      averageEntryPrice,
      liquidationPrice,
      isLiquidated: false,
      fearGreedValue
    });
  }

  const finalPrice = relevantData.length > 0 ? relevantData[relevantData.length - 1].price : 0;
  let finalPortfolioVal = 0;
  
  if (isLiquidated) {
      finalPortfolioVal = 0;
  } else {
     if (config.enableLeverage && leverageRatio > 1) {
        const positionValue = currentBTC * finalPrice;
        const loanAmount = totalFiatValueUsedToBuy * ((leverageRatio - 1) / leverageRatio);
        finalPortfolioVal = currentCash + (positionValue - loanAmount);
     } else {
        finalPortfolioVal = currentCash + (currentBTC * finalPrice);
     }
  }

  const totalReturn = finalPortfolioVal - totalInvested;
  const percentageReturn = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Additional Stats
  const durationDays = relevantData.length > 0 
    ? differenceInCalendarDays(new Date(relevantData[relevantData.length - 1].date), new Date(relevantData[0].date)) + 1
    : 0;

  const lastTimelinePoint = timeline.length > 0 ? timeline[timeline.length - 1] : null;
  const currentFearGreed = lastTimelinePoint ? lastTimelinePoint.fearGreedValue : null;
  const finalAverageEntry = lastTimelinePoint && lastTimelinePoint.averageEntryPrice ? lastTimelinePoint.averageEntryPrice : 0;

  return {
    timeline,
    stats: {
      totalInvested,
      finalPortfolioValue: finalPortfolioVal,
      totalReturn,
      percentageReturn,
      tradesCount,
      rebalanceCount,
      currentBTCPrice: finalPrice,
      finalCashBalance: currentCash,
      finalBTCValue: currentBTC * finalPrice,
      isLiquidated,
      liquidationDate,
      // New fields
      finalBTCAmount: currentBTC,
      averageEntryPrice: finalAverageEntry,
      currentFearGreed,
      durationDays
    },
  };
};