document.addEventListener("DOMContentLoaded", () => {
  // Scroll Animations
  const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(
      (entry) => entry.isIntersecting && entry.target.classList.add("visible")
    );
  }, observerOptions);
  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

  // Mobile Menu
  const mobileBtn = document.getElementById("mobile-menu-btn");
  const navbar = document.getElementById("navbar");
  if (mobileBtn) {
    mobileBtn.addEventListener("click", () => {
      navbar.classList.toggle("active");
      const icon = mobileBtn.querySelector("i");
      if (navbar.classList.contains("active")) {
        icon.classList.replace("fa-bars", "fa-times");
      } else {
        icon.classList.replace("fa-times", "fa-bars");
      }
    });
  }

  // Hero Background Canvas Simulation
  initHeroSimulation();
});

// Hero Simulation
function initHeroSimulation() {
  const canvas = document.getElementById("simulation-canvas");
  const ctx = canvas.getContext("2d");
  let width, height;

  // Camera / Projection
  const HORIZON_RATIO = 0.4;
  const FOCAL_LENGTH = 350;
  const CAM_Y = 150;

  // Grid
  const GRID_ALPHA_BOTTOM = 0.15;

  // Agents
  const AGENT_COUNT = 50;
  let AGENTS = [];

  // Brand colors
  const AGENT_COLORS = ["#4B00FF", "#00BFA5", "#FF3D00", "#2962FF"];
  function shuffledColorPool(count) {
    const pool = [];
    while (pool.length < count) pool.push(...AGENT_COLORS);
    // trim to exact count
    pool.length = count;
    // Fisher–Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }
  let COLOR_POOL = [];

  // Helpers
  function randIn(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Depth
  function sampleDepth() {
    const r = Math.random();

    if (r < 0.1) return randIn(120, 220); 
    if (r < 0.7) return randIn(320, 720); 
    if (r < 0.95) return randIn(720, 1200); 
    return randIn(1200, 1800); 
  }

  // X Distribution
  const WORLD_X_MAX = 1200;
  function sampleX() {
    const r = Math.random();
    if (r < 0.4) return randIn(-WORLD_X_MAX, -600); 
    if (r < 0.8) return randIn(600, WORLD_X_MAX); 
    return randIn(-600, 600); 
  }

  // Resize
  function resize() {
    const parent = canvas.parentElement;
    width = canvas.width = parent.offsetWidth;
    height = canvas.height = parent.offsetHeight;

    if (AGENTS.length === 0) {
      COLOR_POOL = shuffledColorPool(AGENT_COUNT);
      AGENTS = [];
      for (let i = 0; i < AGENT_COUNT; i++) AGENTS.push(createAgent(i));
    }
  }
  window.addEventListener("resize", resize);
  resize();

  function createAgent(i) {
    let x, z;
    for (let attempt = 0; attempt < 8; attempt++) {
      x = sampleX();
      z = sampleDepth();
      const scale = FOCAL_LENGTH / Math.max(1, z);
      const screenX = width / 2 + x * scale;
      if (attempt === 7 || screenX < width * 0.38 || screenX > width * 0.62)
        break;
    }
    return {
      x,
      z,
      targetX: sampleX(),
      targetZ: sampleDepth(),
      speed: 0.9 + Math.random() * 0.8,
      color: COLOR_POOL[i], 
      radius: 11,
      waitTimer: 0,
      walkCycle: Math.random() * 10,
    };
  }

  // Main loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * HORIZON_RATIO;

    // Floor Grid
    const gridGradient = ctx.createLinearGradient(0, cy, 0, height);
    gridGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gridGradient.addColorStop(0.1, "rgba(255, 255, 255, 0.05)");
    gridGradient.addColorStop(1, `rgba(255, 255, 255, ${GRID_ALPHA_BOTTOM})`);
    ctx.strokeStyle = gridGradient;
    ctx.lineWidth = 1;
    ctx.beginPath();

    const spacingAtBottom = 250;
    const numLines = Math.ceil(width / spacingAtBottom) * 4;
    for (let i = -numLines; i <= numLines; i++) {
      const xOffset = i * spacingAtBottom;
      ctx.moveTo(cx + xOffset, height);
      ctx.lineTo(cx, cy);
    }
    const numHLines = 30;
    for (let i = 0; i < numHLines; i++) {
      const t = i / numHLines,
        t2 = t * t;
      const lineY = cy + (height - cy) * t2;
      if (lineY > cy) {
        ctx.moveTo(0, lineY);
        ctx.lineTo(width, lineY);
      }
    }
    ctx.stroke();

    // Agents
    AGENTS.forEach((agent) => {
      if (agent.waitTimer > 0) {
        agent.waitTimer--;
        agent.walkCycle = 0;
      } else {
        const dx = agent.targetX - agent.x;
        const dz = agent.targetZ - agent.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 5) {
          agent.waitTimer = 30 + Math.random() * 60;
          agent.targetX = sampleX();
          agent.targetZ = sampleDepth();
        } else {
          agent.x += (dx / dist) * agent.speed;
          agent.z += (dz / dist) * agent.speed;
          agent.walkCycle += 0.14;
        }
      }

      if (agent.z > 1200 && Math.random() < 0.8) {
        agent.targetZ = randIn(350, 800);
        agent.targetX =
          agent.x < 0 ? randIn(-WORLD_X_MAX, -600) : randIn(600, WORLD_X_MAX);
      }

      const zSafe = Math.max(1, agent.z);
      const scale = FOCAL_LENGTH / zSafe;
      const screenX = cx + agent.x * scale;
      const screenY = cy + CAM_Y * scale;

      let alpha = Math.max(0, 1 - (agent.z - 500) / 1500);
      alpha = Math.min(1, alpha);

      if (screenX > -50 && screenX < width + 50 && alpha > 0.05) {
        const r = agent.radius * (scale * 2.5);
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, r * 2.1, r * 0.7, 0, 0, Math.PI * 2);

        const rgb = hexToRgb(agent.color);
        const gradient = ctx.createRadialGradient(
          screenX,
          screenY,
          0,
          screenX,
          screenY,
          r * 2.0
        );
        gradient.addColorStop(0, `rgba(${rgb}, ${alpha * 0.9})`);
        gradient.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.42 * alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        drawHuman(
          ctx,
          screenX,
          screenY,
          scale,
          agent.color,
          alpha,
          agent.walkCycle
        );
      }
    });

    requestAnimationFrame(animate);
  }

  function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const rr = (bigint >> 16) & 255;
    const gg = (bigint >> 8) & 255;
    const bb = bigint & 255;
    return `${rr},${gg},${bb}`;
  }

  // Draw Stylized Human
  function drawHuman(ctx, x, y, scale, color, alpha, cycle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const stride = Math.sin(cycle) * 0.6;
    const armSwing = Math.sin(cycle + Math.PI) * 0.6;
    const bob = Math.abs(Math.sin(cycle)) * 1.5;
    const sway = Math.sin(cycle * 0.5) * 0.05;

    const hipY = -22 - bob;
    const shoulderY = -44 - bob;
    const headY = -58 - bob;

    const thighLen = 14;
    const calfLen = 14;

    const LEG_WIDTH = 6;
    const BODY_WIDTH = 10;
    const ARM_WIDTH = 4;

    // Legs
    ctx.lineWidth = LEG_WIDTH;
    const kneeX_L = -2 + Math.sin(stride) * 4;
    const kneeY_L = hipY + thighLen;
    const footX_L = -2 + Math.sin(stride) * 10;
    const footY_L = 0 - bob * 0.2;
    ctx.beginPath();
    ctx.moveTo(-2, hipY);
    ctx.lineTo(kneeX_L, kneeY_L);
    ctx.lineTo(footX_L, footY_L);
    ctx.stroke();

    const kneeX_R = 2 - Math.sin(stride) * 4;
    const kneeY_R = hipY + thighLen;
    const footX_R = 2 - Math.sin(stride) * 10;
    const footY_R = 0 - bob * 0.2;
    ctx.beginPath();
    ctx.moveTo(2, hipY);
    ctx.lineTo(kneeX_R, kneeY_R);
    ctx.lineTo(footX_R, footY_R);
    ctx.stroke();

    // Body
    ctx.save();
    ctx.rotate(sway);
    ctx.lineWidth = BODY_WIDTH;
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(0, shoulderY);
    ctx.stroke();
    ctx.restore();

    // Head
    ctx.beginPath();
    ctx.arc(0, headY + 3, 7, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.lineWidth = ARM_WIDTH;
    const elbowX_L = -3 + Math.sin(armSwing) * 4,
      elbowY_L = shoulderY + 7;
    const handX_L = -3 + Math.sin(armSwing) * 10,
      handY_L = shoulderY + 15;
    ctx.beginPath();
    ctx.moveTo(-3, shoulderY);
    ctx.lineTo(elbowX_L, elbowY_L);
    ctx.lineTo(handX_L, handY_L);
    ctx.stroke();

    const elbowX_R = 3 - Math.sin(armSwing) * 4,
      elbowY_R = shoulderY + 7;
    const handX_R = 3 - Math.sin(armSwing) * 10,
      handY_R = shoulderY + 15;
    ctx.beginPath();
    ctx.moveTo(3, shoulderY);
    ctx.lineTo(elbowX_R, elbowY_R);
    ctx.lineTo(handX_R, handY_R);
    ctx.stroke();

    ctx.restore();
  }

  animate();
}

// Pricing Toggle
function switchPricing(plan, element) {
  document
    .querySelectorAll(".toggle-btn")
    .forEach((btn) => btn.classList.remove("active"));
  element.classList.add("active");
  const priceDisplays = document.querySelectorAll(".price-amount");
  if (plan === "yearly") {
    priceDisplays[0].innerHTML = "$0.00<span>/month</span>";
    priceDisplays[1].innerHTML = "$18.00<span>/month</span>";
    priceDisplays[2].innerHTML = "$22.00<span>/month</span>";
  } else {
    priceDisplays[0].innerHTML = "$0.00<span>/month</span>";
    priceDisplays[1].innerHTML = "$20.00<span>/month</span>";
    priceDisplays[2].innerHTML = "$25.00<span>/month</span>";
  }
}