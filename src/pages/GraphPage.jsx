import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch } from 'lucide-react';
import GraphView from '../components/Graph/GraphView';
import './GraphPage.css';

const GraphPage = () => {
  const navigate = useNavigate();

  return (
    <div className="graph-page">
      {/* Page header */}
      <div className="graph-page-header">
        <button
          id="back-to-notes-btn"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={14} /> Notes
        </button>
        <div className="graph-page-title">
          <GitBranch size={16} />
          <span>Knowledge Graph</span>
        </div>
        <div className="graph-page-hint">
          Drag to pan · Scroll to zoom · Click a node to open note
        </div>
      </div>

      {/* Full-screen graph */}
      <div className="graph-page-canvas">
        <GraphView />
      </div>
    </div>
  );
};

export default GraphPage;
