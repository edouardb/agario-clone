
import { useEffect, useRef } from 'react';
import type { Player, Food, GameState } from '../../../server/src/schema';

interface GameCanvasProps {
  gameState: GameState;
  players: Player[];
  food: Food[];
  currentPlayer: Player;
  mousePos: { x: number; y: number };
}

export function GameCanvas({ gameState, players, food, currentPlayer, mousePos }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale and offset to center current player
    const scale = Math.min(canvas.width / 800, canvas.height / 600);
    const offsetX = canvas.width / 2 - currentPlayer.x * scale;
    const offsetY = canvas.height / 2 - currentPlayer.y * scale;

    // Draw grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50 * scale;
    
    for (let x = (offsetX % gridSize); x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = (offsetY % gridSize); y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw map boundaries
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      offsetX,
      offsetY,
      gameState.map_width * scale,
      gameState.map_height * scale
    );

    // Draw food particles
    food.forEach((foodItem: Food) => {
      const x = foodItem.x * scale + offsetX;
      const y = foodItem.y * scale + offsetY;
      const radius = Math.max(foodItem.mass / 2, 3) * scale;

      // Skip if outside visible area
      if (x + radius < 0 || x - radius > canvas.width || y + radius < 0 || y - radius > canvas.height) {
        return;
      }

      ctx.fillStyle = foodItem.color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Add subtle glow effect
      ctx.shadowColor = foodItem.color;
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw players (excluding current player)
    players
      .filter((player: Player) => player.id !== currentPlayer.id && player.is_alive)
      .forEach((player: Player) => {
        const x = player.x * scale + offsetX;
        const y = player.y * scale + offsetY;
        const radius = Math.max(player.mass / 3, 10) * scale;

        // Skip if outside visible area
        if (x + radius < 0 || x - radius > canvas.width || y + radius < 0 || y - radius > canvas.height) {
          return;
        }

        // Draw player cell
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw player name
        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(12, radius / 3)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.name, x, y);

        // Add glow effect for larger players
        if (player.mass > 50) {
          ctx.shadowColor = player.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

    // Draw current player (always on top)
    const currentX = currentPlayer.x * scale + offsetX;
    const currentY = currentPlayer.y * scale + offsetY;
    const currentRadius = Math.max(currentPlayer.mass / 3, 10) * scale;

    // Draw current player cell with special effects
    ctx.fillStyle = currentPlayer.color;
    ctx.beginPath();
    ctx.arc(currentX, currentY, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw thick border for current player
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw player name
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(14, currentRadius / 3)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentPlayer.name, currentX, currentY);

    // Draw movement direction indicator
    const mouseX = mousePos.x * scale + offsetX;
    const mouseY = mousePos.y * scale + offsetY;
    const directionLength = 30;
    const angle = Math.atan2(mouseY - currentY, mouseX - currentX);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentX, currentY);
    ctx.lineTo(
      currentX + Math.cos(angle) * (currentRadius + directionLength),
      currentY + Math.sin(angle) * (currentRadius + directionLength)
    );
    ctx.stroke();

    // Draw arrowhead
    const arrowSize = 8;
    const arrowX = currentX + Math.cos(angle) * (currentRadius + directionLength);
    const arrowY = currentY + Math.sin(angle) * (currentRadius + directionLength);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
      arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
      arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.fill();

    // Add pulsing glow effect for current player
    const time = Date.now() / 1000;
    const pulseIntensity = 0.5 + 0.3 * Math.sin(time * 2);
    ctx.shadowColor = currentPlayer.color;
    ctx.shadowBlur = 15 * pulseIntensity;
    ctx.beginPath();
    ctx.arc(currentX, currentY, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

  }, [gameState, players, food, currentPlayer, mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: 'radial-gradient(circle, #1a1a2e 0%, #16213e 50%, #0f172a 100%)' }}
    />
  );
}
