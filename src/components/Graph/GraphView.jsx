import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { fetchGraphData } from '../../api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './GraphView.css';

// Tag-based color palette (Warm Orange/Amber theme)
const TAG_COLORS = [
  '#F97316', '#FB923C', '#FDBA74', '#EA580C',
  '#9A3412', '#C2410C', '#78350F', '#B45309',
];

// Layout nodes in a circular + force-like arrangement
const layoutNodes = (rawNodes, rawEdges) => {
  const n = rawNodes.length;
  if (n === 0) return [];

  // Degree map for sizing
  const degree = {};
  rawNodes.forEach((nd) => (degree[nd.id] = 0));
  rawEdges.forEach((e) => {
    degree[e.source] = (degree[e.source] || 0) + 1;
    degree[e.target] = (degree[e.target] || 0) + 1;
  });

  const radius = Math.max(200, n * 60);
  return rawNodes.map((nd, i) => {
    const angle = (2 * Math.PI * i) / n;
    const deg = degree[nd.id] || 0;
    const colorIdx = i % TAG_COLORS.length;
    const size = 36 + Math.min(deg * 8, 32);
    return {
      id: nd.id,
      type: 'axonNode',
      position: { x: radius * Math.cos(angle) + 500, y: radius * Math.sin(angle) + 300 },
      data: { label: nd.title, size, color: TAG_COLORS[colorIdx], degree: deg },
    };
  });
};

// Custom node renderer
const AxonNode = ({ data, selected }) => (
  <div
    className={`graph-node ${selected ? 'selected' : ''}`}
    style={{
      width: data.size,
      height: data.size,
      background: data.color,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: selected
        ? `0 0 0 3px #fff, 0 0 0 5px ${data.color}, 0 8px 24px ${data.color}55`
        : `0 2px 8px ${data.color}66`,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      position: 'relative',
    }}
  >
    <span
      style={{
        position: 'absolute',
        bottom: `calc(100% + 6px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--surface)',
        color: 'var(--text-primary)',
        fontSize: '0.72rem',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        whiteSpace: 'nowrap',
        boxShadow: 'var(--shadow-sm)',
        pointerEvents: 'none',
        maxWidth: '140px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {data.label}
    </span>
    {data.degree > 0 && (
      <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
        {data.degree}
      </span>
    )}
  </div>
);

const nodeTypes = { axonNode: AxonNode };

const GraphView = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchGraphData();
        const { nodes: rawNodes, edges: rawEdges } = res.data.data;
        const layouted = layoutNodes(rawNodes, rawEdges);
        const flowEdges = rawEdges.map((e, i) => ({
          id: `e-${i}`,
          source: e.source,
          target: e.target,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)' },
          style: { stroke: 'var(--accent)', strokeWidth: 1.5, opacity: 0.6 },
        }));
        setNodes(layouted);
        setEdges(flowEdges);
        setStats({ nodes: rawNodes.length, edges: rawEdges.length });
      } catch (err) {
        console.error('Failed to load graph data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onNodeClick = useCallback((_, node) => {
    navigate(`/?note=${node.id}`);
  }, [navigate]);

  const bgColor = theme === 'dark' ? '#1C1917' : '#F5F5F4';
  const dotColor = theme === 'dark' ? '#44403C' : '#D6D3D1';

  if (loading) {
    return (
      <div className="graph-loading">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p>Building knowledge graph…</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="graph-empty">
        <div className="empty-state">
          <div style={{ fontSize: '3rem', opacity: 0.3 }}>⬡</div>
          <h3>No connections yet</h3>
          <p>Use <code>[[Note Title]]</code> syntax in your notes to create links. They will appear as edges here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="graph-wrapper">
      <div className="graph-stats">
        <span>{stats.nodes} notes</span>
        <span className="graph-stats-sep">·</span>
        <span>{stats.edges} connections</span>
        <span className="graph-stats-sep">·</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Click a node to open note</span>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-right"
      >
        <Background color={dotColor} gap={20} size={1} />
        <Controls
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-md)',
          }}
        />
        <MiniMap
          nodeColor={(n) => n.data?.color || 'var(--accent)'}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
          }}
          maskColor={theme === 'dark' ? 'rgba(28,25,23,0.7)' : 'rgba(245,245,244,0.7)'}
        />
      </ReactFlow>
    </div>
  );
};

export default GraphView;
