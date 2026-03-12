export function calculateBankrollStats(bets) {

  let totalStake = 0
  let wins = 0
  let losses = 0
  let profit = 0

  bets.forEach(bet => {

    if (bet.result === "pending") return

    totalStake += bet.stake

    if (bet.result === "win") {

      wins++

      if (bet.odds > 0) {
        profit += (bet.odds / 100) * bet.stake
      } else {
        profit += bet.stake / (Math.abs(bet.odds) / 100)
      }

    }

    if (bet.result === "loss") {

      losses++
      profit -= bet.stake

    }

  })

  const totalBets = wins + losses

  const roi = totalStake > 0
    ? (profit / totalStake) * 100
    : 0

  const winRate = totalBets > 0
    ? (wins / totalBets) * 100
    : 0

  return {

    profit: profit.toFixed(2),
    roi: roi.toFixed(2),
    winRate: winRate.toFixed(2),
    totalBets

  }

}