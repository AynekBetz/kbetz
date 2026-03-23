export const saveBet = (bet: any) => {
  const existing = JSON.parse(localStorage.getItem("bets") || "[]");
  existing.push(bet);
  localStorage.setItem("bets", JSON.stringify(existing));
};

export const getBets = () => {
  return JSON.parse(localStorage.getItem("bets") || "[]");
};

export const updateBetResult = (index: number, result: "win" | "loss") => {
  const bets = JSON.parse(localStorage.getItem("bets") || "[]");

  if (bets[index]) {
    bets[index].result = result;
  }

  localStorage.setItem("bets", JSON.stringify(bets));
};