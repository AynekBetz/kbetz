export function generateDailyBet(evBets){

 if(!evBets || evBets.length === 0){
  return null
 }

 const bestBet = evBets.sort((a,b)=>{

  const evA = parseFloat(a.EV)
  const evB = parseFloat(b.EV)

  return evB - evA

 })[0]

 const confidence = Math.min(
  95,
  Math.round(parseFloat(bestBet.EV) * 10)
 )

 return {
  game: bestBet.game,
  bet: bestBet.bet,
  EV: bestBet.EV,
  confidence
 }

}