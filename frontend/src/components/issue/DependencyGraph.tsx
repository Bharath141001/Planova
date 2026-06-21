import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Issue, IssueLink } from '@/types/issue.types';
import type { IssueType } from '@/types/common.types';
import { cx } from '@/utils/cx';
import styles from './DependencyGraph.module.scss';

interface GraphNode {
  id: string;
  key: string;
  title: string;
  status: string;
  type: IssueType;
  x: number;
  y: number;
  isCurrent: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  color: string;
}

const LINK_COLORS: Record<string, string> = {
  BLOCKS: 'var(--color-danger)',
  IS_BLOCKED_BY: 'var(--color-warning)',
  DUPLICATES: 'var(--color-text-subtle)',
  CLONES: 'var(--color-text-subtle)',
  RELATES_TO: 'var(--color-primary)',
};

const LINK_LABELS: Record<string, string> = {
  BLOCKS: 'blocks',
  IS_BLOCKED_BY: 'blocked by',
  DUPLICATES: 'duplicates',
  CLONES: 'clones',
  RELATES_TO: 'relates to',
};

const NODE_W = 130;
const NODE_H = 48;
const CENTER_X = 260;
const CENTER_Y = 160;
const ORBIT_RX = 210;
const ORBIT_RY = 120;

function buildGraph(issue: Issue): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  nodes.push({
    id: issue.id,
    key: issue.key,
    title: issue.title,
    status: issue.status,
    type: issue.type,
    x: CENTER_X,
    y: CENTER_Y,
    isCurrent: true,
  });

  const linked: Array<{ id: string; key: string; title: string; status: string; type: IssueType }> = [];
  const seenIds = new Set<string>([issue.id]);

  const addLinked = (link: IssueLink, direction: 'source' | 'target') => {
    const peer = direction === 'source' ? link.targetIssue : link.sourceIssue;
    if (!peer || seenIds.has(peer.id)) return;
    seenIds.add(peer.id);
    linked.push(peer);
    edges.push({
      from: direction === 'source' ? issue.id : peer.id,
      to: direction === 'source' ? peer.id : issue.id,
      label: LINK_LABELS[link.type] ?? link.type,
      color: LINK_COLORS[link.type] ?? 'var(--color-border)',
    });
  };

  issue.sourceLinks.forEach((l) => addLinked(l, 'source'));
  issue.targetLinks.forEach((l) => addLinked(l, 'target'));

  const total = linked.length;
  linked.forEach((peer, i) => {
    const angle = total === 1 ? 0 : (2 * Math.PI * i) / total - Math.PI / 2;
    nodes.push({
      id: peer.id,
      key: peer.key,
      title: peer.title,
      status: peer.status,
      type: peer.type,
      x: CENTER_X + ORBIT_RX * Math.cos(angle),
      y: CENTER_Y + ORBIT_RY * Math.sin(angle),
      isCurrent: false,
    });
  });

  return { nodes, edges };
}

function edgePath(from: GraphNode, to: GraphNode): string {
  const x1 = from.x + NODE_W / 2;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x + NODE_W / 2;
  const y2 = to.y + NODE_H / 2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

function nodeBounds(nodes: GraphNode[]) {
  if (!nodes.length) return { minX: 0, minY: 0, maxX: 600, maxY: 340 };
  const pad = 20;
  const minX = Math.min(...nodes.map((n) => n.x)) - pad;
  const minY = Math.min(...nodes.map((n) => n.y)) - pad;
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_W)) + pad;
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_H)) + pad;
  return { minX, minY, maxX, maxY };
}

interface DependencyGraphProps {
  issue: Issue;
}

export function DependencyGraph({ issue }: DependencyGraphProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => buildGraph(issue), [issue]);

  const hasLinks = issue.sourceLinks.length > 0 || issue.targetLinks.length > 0;

  if (!hasLinks) {
    return (
      <div className={styles.empty}>
        <svg width={64} height={64} viewBox="0 0 64 64" fill="none" aria-hidden>
          <circle cx={12} cy={32} r={10} stroke="var(--color-border)" strokeWidth={2} />
          <circle cx={52} cy={14} r={8} stroke="var(--color-border)" strokeWidth={2} strokeDasharray="3 3" />
          <circle cx={52} cy={50} r={8} stroke="var(--color-border)" strokeWidth={2} strokeDasharray="3 3" />
          <line x1={22} y1={32} x2={44} y2={18} stroke="var(--color-border)" strokeWidth={1.5} strokeDasharray="3 3" />
          <line x1={22} y1={32} x2={44} y2={48} stroke="var(--color-border)" strokeWidth={1.5} strokeDasharray="3 3" />
        </svg>
        <p>No issue links yet.</p>
        <p className={styles.emptyHint}>Use the "Link issue" button to create dependencies.</p>
      </div>
    );
  }

  const { minX, minY, maxX, maxY } = nodeBounds(nodes);
  const svgW = maxX - minX;
  const svgH = maxY - minY;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`${minX} ${minY} ${svgW} ${svgH}`}
        className={styles.svg}
        style={{ width: '100%', height: svgH * (100 / svgW) + '%' }}
        aria-label="Issue dependency graph"
      >
        <defs>
          {Object.entries(LINK_COLORS).map(([type, color]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              markerWidth={8}
              markerHeight={8}
              refX={7}
              refY={3}
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={color} />
            </marker>
          ))}
        </defs>

        {edges.map((edge, i) => {
          const fromNode = nodeById.get(edge.from);
          const toNode = nodeById.get(edge.to);
          if (!fromNode || !toNode) return null;
          const linkType = Object.entries(LINK_LABELS).find(([, v]) => v === edge.label)?.[0] ?? 'RELATES_TO';
          const d = edgePath(fromNode, toNode);
          const mx = (fromNode.x + NODE_W / 2 + toNode.x + NODE_W / 2) / 2;
          const my = (fromNode.y + NODE_H / 2 + toNode.y + NODE_H / 2) / 2;
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke={edge.color}
                strokeWidth={1.5}
                markerEnd={`url(#arrow-${linkType})`}
                opacity={hovered && hovered !== edge.from && hovered !== edge.to ? 0.25 : 1}
              />
              <text x={mx} y={my - 5} className={styles.edgeLabel} fill={edge.color} textAnchor="middle">
                {edge.label}
              </text>
            </g>
          );
        })}

        {nodes.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x},${node.y})`}
            className={cx(styles.nodeG, !node.isCurrent && styles.nodeGClickable)}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => !node.isCurrent && navigate(`/issues/${node.key}`)}
            aria-label={node.isCurrent ? `Current issue: ${node.key}` : `Go to ${node.key}`}
            role={node.isCurrent ? undefined : 'button'}
            tabIndex={node.isCurrent ? undefined : 0}
            onKeyDown={(e) => { if (!node.isCurrent && e.key === 'Enter') navigate(`/issues/${node.key}`); }}
          >
            <rect
              width={NODE_W}
              height={NODE_H}
              rx={6}
              className={cx(
                styles.nodeRect,
                node.isCurrent && styles.nodeRectCurrent,
                hovered === node.id && styles.nodeRectHovered,
              )}
            />
            <text x={8} y={16} className={styles.nodeKey}>{node.key}</text>
            <text x={8} y={34} className={styles.nodeTitle}>
              {node.title.length > 18 ? node.title.slice(0, 17) + '…' : node.title}
            </text>
            <text x={NODE_W - 6} y={16} className={styles.nodeStatus} textAnchor="end">
              {node.status}
            </text>
          </g>
        ))}
      </svg>

      <div className={styles.legend}>
        {Object.entries(LINK_LABELS).map(([type, label]) => (
          <div key={type} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: LINK_COLORS[type] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
