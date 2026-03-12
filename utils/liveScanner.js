import { fetchOdds } from "./oddsFetcher.js"
import { scanForPositiveEV } from "./evScanner.js"
import { findArbitrage } from "./arbScanner.js"
import { detectSteamMoves } from "./steamDetector.js"
import { trackLineMovement } from "./lineTracker.js"
import { updateMarketFeed } from "./marketFeed.js"

let cachedBets = []
let cachedArbs = []
let cachedSteam = []
let cachedEvents = []


export async function runLiveScanner() {

  try {

    console.log("Running live odds scan...")

    const events = await fetchOdds()

    if (!events || events.length === 0) {

      console.log("No events returned from odds API — keeping previous cached data")
      return

    }

    cachedEvents = events

    /* =========================
       UPDATE MARKET FEED
    ========================= */

    updateMarketFeed(events)


    /* =========================
       EV SCANNER
    ========================= */

    const evBets = scanForPositiveEV(events)

    cachedBets = evBets.slice(0,25)

    console.log("Value bets found:", cachedBets.length)


    /* =========================
       ARBITRAGE
    ========================= */

    const arbs = findArbitrage(events)

    cachedArbs = arbs

    console.log("Arbitrage found:", cachedArbs.length)


    /* =========================
       STEAM DETECTION
    ========================= */

    const steam = detectSteamMoves(events)

    cachedSteam = steam

    console.log("Steam moves detected:", cachedSteam.length)


    /* =========================
       LINE TRACKING
    ========================= */

    trackLineMovement(events)


  } catch (error) {

    console.error("Live scanner error:", error)

  }

}


/* =========================
   CACHE GETTERS
========================= */

export function getCachedBets() {
  return cachedBets
}

export function getCachedArbs() {
  return cachedArbs
}

export function getCachedSteam() {
  return cachedSteam
}

export function getCachedEvents() {
  return cachedEvents
}