/**
 * Draws the Tronk board: a hexagonal lattice with two bot trails routing
 * across it, sized to whatever container it is given.
 *
 * Geometry (pointy-top hexes, odd-r offset coordinates) — do not improvise
 * this, an earlier hand-written version spaced rows by the full hex height and
 * the cells did not tessellate:
 *
 *   column pitch = sqrt(3) * r      row pitch = 1.5 * r
 *   odd rows are offset half a column to the right
 */

type Cell = readonly [col: number, row: number];
type Direction = 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Neighbour offsets differ between even and odd rows in an offset layout. */
const STEPS: Record<0 | 1, Record<Direction, Cell>> = {
  0: { E: [1, 0], W: [-1, 0], NE: [0, -1], NW: [-1, -1], SE: [0, 1], SW: [-1, 1] },
  1: { E: [1, 0], W: [-1, 0], NE: [1, -1], NW: [0, -1], SE: [1, 1], SW: [0, 1] },
};

export interface HexOptions {
  /** Hex radius, centre to vertex, in px. */
  size?: number;
  /** Faint lattice stroke. */
  latticeColor?: string;
  /** The player trail. */
  accent?: string;
  /** The opponent trail. */
  rival?: string;
  /** Stroke width of the player trail; the rival is drawn slightly thinner. */
  trailWidth?: number;
  /** Corner labels, drawn only when both are given. */
  labels?: readonly [left: string, right: string];
}

function step([col, row]: Cell, direction: Direction): Cell {
  const parity = (((row % 2) + 2) % 2) as 0 | 1;
  const [dc, dr] = STEPS[parity][direction];
  return [col + dc, row + dr];
}

function walk(start: Cell, moves: readonly Direction[], cols: number, rows: number): Cell[] {
  const path: Cell[] = [start];
  for (const move of moves) {
    const next = step(path[path.length - 1]!, move);
    // Stop at the edge rather than drawing a trail through empty space.
    if (next[0] < 0 || next[0] >= cols || next[1] < 0 || next[1] >= rows) break;
    path.push(next);
  }
  return path;
}

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

/** Renders one lattice into `container`, replacing whatever was there. */
export function drawBoard(container: HTMLElement, options: HexOptions = {}): void {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width < 40 || height < 40) return;

  const {
    size = Math.max(11, Math.round(width / 36)),
    latticeColor = 'rgba(226, 221, 210, 0.10)',
    accent = '#d9a45f',
    rival = '#8d8a83',
    trailWidth = Math.max(2, size / 9),
    labels,
  } = options;

  const colPitch = Math.sqrt(3) * size;
  const rowPitch = 1.5 * size;
  const cols = Math.ceil(width / colPitch) + 2;
  const rows = Math.ceil(height / rowPitch) + 2;
  const originX = -colPitch / 2;
  const originY = -rowPitch / 2;

  const centre = ([col, row]: Cell): [number, number] => [
    originX + colPitch * (col + (Math.abs(row % 2) === 1 ? 0.5 : 0)),
    originY + rowPitch * row,
  ];

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    width: '100%',
    height: '100%',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.style.display = 'block';

  // Lattice.
  const lattice = el('g', { stroke: latticeColor, 'stroke-width': 1, fill: 'none' });
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const [cx, cy] = centre([col, row]);
      const points: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = ((60 * i - 90) * Math.PI) / 180;
        points.push(
          `${(cx + size * Math.cos(angle)).toFixed(1)},${(cy + size * Math.sin(angle)).toFixed(1)}`,
        );
      }
      lattice.appendChild(el('polygon', { points: points.join(' ') }));
    }
  }
  svg.appendChild(lattice);

  // Two trails, meeting on adjacent cells: the moment before a collision.
  const playerStart: Cell = [0, Math.max(1, rows - 3)];
  const climb: Direction[] = [];
  for (let i = 0; i < cols; i++) climb.push(i % 2 === 0 ? 'E' : 'NE');
  const player = walk(playerStart, climb, cols, rows);
  const head = player[player.length - 1]!;

  const rivalHead = step(head, 'E');
  const retreat: Direction[] = [];
  for (let i = 0; i < cols; i++) retreat.push(i % 3 === 1 ? 'SE' : 'E');
  const opponent = walk(rivalHead, retreat, cols, rows).reverse();

  const toPath = (cells: readonly Cell[]) =>
    `M${cells.map((cell) => centre(cell).map((n) => n.toFixed(1)).join(',')).join(' L')}`;

  const drawTrail = (cells: readonly Cell[], color: string, strokeWidth: number) => {
    if (cells.length < 2) return;
    svg.appendChild(
      el('path', {
        d: toPath(cells),
        fill: 'none',
        stroke: color,
        'stroke-width': strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    );
    const [hx, hy] = centre(cells[cells.length - 1]!);
    svg.appendChild(el('circle', { cx: hx.toFixed(1), cy: hy.toFixed(1), r: strokeWidth * 1.6, fill: color }));
  };

  drawTrail(player, accent, trailWidth);
  drawTrail(opponent, rival, trailWidth * 0.85);

  // A faint mark where the player trail began.
  if (player.length > 1) {
    const [sx, sy] = centre(player[0]!);
    svg.appendChild(
      el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: trailWidth * 1.2, fill: accent, opacity: 0.45 }),
    );
  }

  if (labels) {
    const [left, right] = labels;
    const common = {
      fill: '#6a675f',
      'font-family': "'IBM Plex Mono', ui-monospace, monospace",
      'font-size': 12,
      'letter-spacing': 1.6,
    };
    const leftLabel = el('text', { ...common, x: 18, y: height - 16 });
    leftLabel.textContent = left;
    const rightLabel = el('text', { ...common, x: width - 18, y: height - 16, 'text-anchor': 'end' });
    rightLabel.textContent = right;
    svg.append(leftLabel, rightLabel);
  }

  container.replaceChildren(svg);
}

/** Draws every `[data-hex]` container on the page and keeps them sized. */
export function mountBoards(): void {
  const containers = Array.from(document.querySelectorAll<HTMLElement>('[data-hex]'));
  if (containers.length === 0) return;

  const render = () => {
    for (const container of containers) {
      const labels = container.dataset.hexLabels?.split('|');
      drawBoard(container, {
        ...(container.dataset.hexSize ? { size: Number(container.dataset.hexSize) } : {}),
        ...(labels?.length === 2 ? { labels: [labels[0]!, labels[1]!] as const } : {}),
      });
    }
  };

  render();

  let frame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
  });
}
