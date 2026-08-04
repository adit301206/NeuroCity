import { useEffect, useRef } from 'react';

export default function NetworkBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let W, H, nodes = [], pairs = [], pulses = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let animationId;
    let t = 0;
    let pulseInterval;

    function resize() {
      W = canvas.width = window.innerWidth * devicePixelRatio;
      H = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }

    // આખા પેજ પર સરખા ફેલાયેલા પણ રેન્ડમ (છૂટા-છવાયા) ડોટ્સ ગોઠવવા માટે
    function initNodes() {
      nodes = [];
      const cols = 15, rows = 12;
      const marginX = W * 0.04, marginY = H * 0.04;
      const cellW = (W - marginX * 2) / cols;
      const cellH = (H - marginY * 2) / rows;

      let index = 0;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // દરેક સેલની અંદર રેન્ડમ પોઝિશન જેથી સ્ક્વેર જેવું સીધું ના દેખાય, છતાં બધી જગ્યાએ ફેલાયેલા રહે
          const rx = (Math.random() * 0.8 + 0.1) * cellW;
          const ry = (Math.random() * 0.8 + 0.1) * cellH;
          
          nodes.push({
            x: marginX + i * cellW + rx,
            y: marginY + j * cellH + ry,
            r: 1.4 + Math.random() * 1.2,
            phase: index * 0.2,
          });
          index++;
        }
      }
    }

    function nearbyPairs() {
      const result = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          // નજીકના નોડ્સ જ કનેક્ટ થાય તેવું યોગ્ય અંતર
          if (d < W * 0.11) result.push([i, j]);
        }
      }
      return result;
    }

    function setup() {
      resize();
      initNodes();
      pairs = nearbyPairs();
    }

    function spawnPulse() {
      if (pairs.length === 0) return;
      const [i, j] = pairs[Math.floor(Math.random() * pairs.length)];
      pulses.push({ i, j, t: 0, dur: 60 + Math.random() * 40 });
    }

    function handleMouseMove(e) {
      mouse.x = e.clientX * devicePixelRatio;
      mouse.y = e.clientY * devicePixelRatio;
      mouse.active = true;
    }
    function handleMouseLeave() {
      mouse.active = false;
    }

    function draw() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // કનેક્ટિંગ લાઈનોનો ડાર્ક બ્લુ કલર
      ctx.strokeStyle = 'rgba(2, 43, 107, 0.16)';
      ctx.lineWidth = 1;
      pairs.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      });

      const mouseR = W * 0.13;
      if (mouse.active) {
        nodes.forEach((n) => {
          const dx = n.x - mouse.x, dy = n.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < mouseR) {
            const a = 1 - d / mouseR;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.strokeStyle = `rgba(2, 43, 107, ${a * 0.45})`;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        });
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, mouseR);
        grad.addColorStop(0, 'rgba(2, 43, 107, 0.12)');
        grad.addColorStop(1, 'rgba(2, 43, 107, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouseR, 0, Math.PI * 2);
        ctx.fill();
      }

      // નોડ્સ/ટપકાંના ડાર્ક બ્લુ કલર
      nodes.forEach((n) => {
        const pulse = 0.6 + Math.sin(t * 1.4 + n.phase) * 0.4;
        let near = 0;
        if (mouse.active) {
          const dx = n.x - mouse.x, dy = n.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < mouseR) near = 1 - d / mouseR;
        }
        const rr = n.r * devicePixelRatio * (1 + near * 1.8);
        if (near > 0) {
          ctx.shadowColor = 'rgba(2, 43, 107, 0.5)';
          ctx.shadowBlur = 14 * near;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
        ctx.fillStyle = near > 0
          ? `rgba(2, 43, 107,${0.5 + pulse * 0.2})`
          : `rgba(2, 43, 107,${0.35 + pulse * 0.2})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      pulses.forEach((p) => {
        p.t += 1;
        const a = nodes[p.i], b = nodes[p.j];
        const f = Math.min(p.t / p.dur, 1);
        const x = a.x + (b.x - a.x) * f;
        const y = a.y + (b.y - a.y) * f;
        const alpha = Math.sin(f * Math.PI);
        ctx.beginPath();
        ctx.arc(x, y, 2.2 * devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,91,158,${alpha})`;
        ctx.shadowColor = 'rgba(255,91,158,0.8)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      pulses = pulses.filter((p) => p.t < p.dur);

      animationId = requestAnimationFrame(draw);
    }

    setup();
    draw();
    pulseInterval = setInterval(spawnPulse, 700);
    window.addEventListener('resize', setup);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(pulseInterval);
      window.removeEventListener('resize', setup);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} id="net" />;
}