import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "./hooks/useGame";

const BANKNOTE_SRC = "/dollar-banknote_color.svg";

function createNote(bankRect) {
  const side = Math.random() < 0.5 ? "left" : "right";
  const direction = side === "left" ? -1 : 1;
  const edgeX = side === "left" ? bankRect.left : bankRect.right;
  const startX = edgeX + direction * (6 + Math.random() * 14);
  const startY =
    bankRect.top + bankRect.height * (0.15 + Math.random() * 0.7);

  return {
    id: crypto.randomUUID(),
    startX,
    startY,
    direction,
    throwDistance: 90 + Math.random() * 110,
    peakHeight: 45 + Math.random() * 55,
    duration: 750 + Math.random() * 350,
    size: 38 + Math.random() * 14,
  };
}

function FlyingBanknote({ note, onComplete }) {
  const [style, setStyle] = useState({
    left: note.startX,
    top: note.startY,
    opacity: 1,
    transform: "translate(-50%, -50%) rotate(0deg)",
  });

  useEffect(() => {
    const { startX, startY, direction, throwDistance, peakHeight, duration } =
      note;
    const a = (-4 * peakHeight) / (throwDistance * throwDistance);
    let rafId;
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const dx = throwDistance * progress;
      const x = startX + direction * dx;
      const y = startY + a * dx * (dx - throwDistance);

      setStyle({
        left: x,
        top: y,
        opacity: 1 - progress * 0.35,
        transform: `translate(-50%, -50%) rotate(${direction * 25 * progress}deg)`,
      });

      if (progress < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        onComplete(note.id);
      }
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [note, onComplete]);

  return (
    <img
      src={BANKNOTE_SRC}
      alt=""
      className="flying-banknote"
      draggable={false}
      style={{
        position: "fixed",
        left: style.left,
        top: style.top,
        width: note.size,
        opacity: style.opacity,
        transform: style.transform,
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
}

function GameHud({ gameState }) {
  const { roundId, player, thresholds, phase } = gameState;

  return (
    <header className="game-hud">
      <div className="hud-row">
        <span className="hud-pill">第 {roundId} 轮</span>
        <span className="hud-pill hud-balance">
          账户余额 ${player?.balance ?? thresholds.initialBalance}
        </span>
      </div>
      {phase === "playing" && (
        <p className="hud-hint">点击银行提现 ${thresholds.withdraw}</p>
      )}
    </header>
  );
}

function AnnouncementOverlay({ onDismiss }) {
  return (
    <div className="announcement-overlay" role="dialog" aria-modal="true">
      <div className="announcement-card">
        <p className="announcement-label">公告</p>
        <p className="announcement-text">
          最近你听到风声，说这家银行的投资失败，准备金不足，许多储户都在抓紧提现走人。但也许等过这波风口，银行资金回笼又都没事了......
        </p>
        <p className="announcement-hint">
          点击银行进行提现，一次可提10刀。
        </p>
        <button type="button" className="announcement-btn" onClick={onDismiss}>
          我知道了
        </button>
      </div>
    </div>
  );
}

function ResultsOverlay({ gameState }) {
  const { outcome, results, endReason, resultsDurationMs } = gameState;
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(resultsDurationMs / 1000),
  );

  useEffect(() => {
    setSecondsLeft(Math.ceil(resultsDurationMs / 1000));
    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [gameState.roundId, resultsDurationMs]);

  if (!results || !outcome) return null;

  const survived = outcome.survived;
  const exploded = endReason === "explosion";

  let title;
  let detail;

  if (exploded) {
    title = "银行爆炸了！";
    detail = survived
      ? "你在爆炸前已取光账户里的钱，活了下来。"
      : "爆炸时账户里还有余额，未能幸存。";
  } else {
    title = "银行撑住了！";
    detail = survived
      ? "你本轮从未提现，与其他信任者一起幸存。"
      : "你曾取走过钱，在本轮和平结局中未能幸存。";
  }

  return (
    <div className="results-overlay" role="dialog" aria-modal="true">
      <div className={`results-card${survived ? " survived" : " dead"}`}>
        <p className="results-round">第 {gameState.roundId} 轮结果</p>
        <h2>{title}</h2>
        <p className={`results-status${survived ? " survived" : " dead"}`}>
          {survived ? "你活下来了" : "你没能活下来"}
        </p>
        <p className="results-detail">{detail}</p>
        <dl className="results-stats">
          <div>
            <dt>全站提现</dt>
            <dd>{results.totalClicks} 次</dd>
          </div>
          <div>
            <dt>访问人数</dt>
            <dd>{results.visitorCount} 人</dd>
          </div>
          <div>
            <dt>你的余额</dt>
            <dd>${outcome.balance}</dd>
          </div>
          <div>
            <dt>你已取出</dt>
            <dd>${outcome.totalWithdrawn}</dd>
          </div>
        </dl>
        <p className="results-next">
          {secondsLeft > 0
            ? `${secondsLeft} 秒后开启新一轮…`
            : "正在开启新一轮…"}
        </p>
      </div>
    </div>
  );
}

function App() {
  const bankRef = useRef(null);
  const { gameState, error, loading, withdraw } = useGame();
  const [shaking, setShaking] = useState(false);
  const [notes, setNotes] = useState([]);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  function dismissAnnouncement() {
    setShowAnnouncement(false);
  }

  const removeNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const canWithdraw =
    gameState?.phase === "playing" &&
    (gameState.player?.balance ?? 0) >= gameState.thresholds.withdraw &&
    !withdrawing;

  async function handleClick() {
    if (!canWithdraw) return;

    setWithdrawing(true);
    try {
      await withdraw();

      setShaking(true);
      setTimeout(() => setShaking(false), 500);

      const bank = bankRef.current;
      if (bank) {
        const rect = bank.getBoundingClientRect();
        const count = 1 + Math.floor(Math.random() * 2);
        const newNotes = Array.from({ length: count }, () => createNote(rect));
        setNotes((prev) => [...prev, ...newNotes]);
      }
    } catch {
      // Error shown in HUD
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return <div className="app-loading">连接银行中…</div>;
  }

  if (!gameState) {
    return (
      <div className="app-loading app-error">
        无法连接游戏服务器，请确认已运行 <code>npm run dev</code>
      </div>
    );
  }

  const bankExploded =
    gameState.phase === "results" && gameState.endReason === "explosion";

  return (
    <div className="app-shell">
      <GameHud gameState={gameState} />

      {error && <p className="game-error">{error}</p>}

      <div className="app-stage">
        <div className="bank-scene">
          <img
            ref={bankRef}
            src="/bank_flat.svg"
            alt="Bank"
            onClick={handleClick}
            className={[
              "bank-img",
              shaking ? "shake" : "",
              bankExploded ? "bank-exploded" : "",
              canWithdraw ? "bank-clickable" : "bank-disabled",
            ]
              .filter(Boolean)
              .join(" ")}
            draggable={false}
          />
          {bankExploded && <div className="explosion-burst" aria-hidden="true" />}
          {notes.map((note) => (
            <FlyingBanknote key={note.id} note={note} onComplete={removeNote} />
          ))}
        </div>
      </div>

      {gameState.phase === "results" && (
        <ResultsOverlay gameState={gameState} />
      )}

      {showAnnouncement && (
        <AnnouncementOverlay onDismiss={dismissAnnouncement} />
      )}
    </div>
  );
}

export default App;
