"use client";

export default function AIGameDrawer({ activeGame, onClose }) {
  if (!activeGame) return null;

  const confidence = activeGame.confidence ?? 75;
  const winProbability = activeGame.winProbability ?? 60;
  const expectedValue = activeGame.expectedValue ?? 0;
  const recommendation =
    activeGame.recommendation || activeGame.home;
  const analysis =
    activeGame.analysis || "Market data is updating.";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.72)",
        zIndex: 999999,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e)=>e.stopPropagation()}
        style={{
          width: 430,
          maxWidth: "100%",
          height: "100%",
          overflowY: "auto",
          background:
            "linear-gradient(180deg,#07141a,#09030f)",
          borderLeft: "2px solid #00ffd6",
          padding: 24,
          color: "#fff",
          boxShadow:
            "-10px 0 40px rgba(0,255,214,.25)",
        }}
      >

        <div style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center"
        }}>
          <h2 style={{margin:0}}>
            {activeGame.away} @ {activeGame.home}
          </h2>

          <button
            onClick={onClose}
            style={{
              background:"transparent",
              color:"#fff",
              border:"none",
              fontSize:26,
              cursor:"pointer"
            }}
          >
            ×
          </button>
        </div>

        <hr style={{
          margin:"18px 0",
          borderColor:"rgba(255,255,255,.12)"
        }}/>

        <h3 style={{color:"#00ffd6"}}>
          🤖 AI Recommendation
        </h3>

        <div style={{
          fontSize:28,
          fontWeight:800,
          marginBottom:18
        }}>
          {recommendation}
        </div>

        <div style={{marginBottom:18}}>
          <strong>Confidence</strong>

          <div style={{
            marginTop:8,
            height:12,
            borderRadius:99,
            overflow:"hidden",
            background:"#222"
          }}>
            <div style={{
              width:`${confidence}%`,
              height:"100%",
              background:"#00ffd6"
            }}/>
          </div>

          <div style={{
            marginTop:6,
            color:"#00ffd6",
            fontWeight:700
          }}>
            {confidence}%
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <strong>Win Probability</strong>
          <div>{winProbability}%</div>
        </div>

        <div style={{marginBottom:14}}>
          <strong>Expected Value</strong>
          <div style={{color:"#20ff7a"}}>
            +{expectedValue}%
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <strong>Spread</strong>
          <div>{activeGame.spread}</div>
        </div>

        <div style={{marginBottom:14}}>
          <strong>Total</strong>
          <div>{activeGame.total}</div>
        </div>

        <div style={{marginBottom:20}}>
          <strong>Analysis</strong>
          <p style={{
            color:"rgba(255,255,255,.8)",
            lineHeight:1.6
          }}>
            {analysis}
          </p>
        </div>

        <h3 style={{color:"#00ffd6"}}>
          Sportsbooks
        </h3>

        {(activeGame.books || []).map((book,i)=>(
          <div
            key={i}
            style={{
              padding:"10px 14px",
              marginBottom:10,
              borderRadius:10,
              background:"rgba(255,255,255,.05)"
            }}
          >
            {book.name}
          </div>
        ))}

      </div>
    </div>
  );
}
