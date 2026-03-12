let bets = []

export function addBet(bet) {

  bets.push({
    id: Date.now(),
    ...bet,
    result: "pending"
  })

}

export function getBets() {

  return bets

}

export function settleBet(id, result) {

  bets = bets.map(bet => {

    if (bet.id == id) {
      bet.result = result
    }

    return bet

  })

}