// ── Imports ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';

// ── Helpers ──────────────────────────────────────────────────────────
function fileIcon(type) {
  if (type === 'pdf') return '📄';
  if (type === 'word') return '📝';
  if (type === 'powerpoint') return '📊';
  return '📁';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Component ────────────────────────────────────────────────────────
const StudentMaterialsPage = () => {
  // ── State ──────────────────────────────────────────────────────────
  const [materials, setMaterials]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [downloading, setDownloading]   = useState(null);

  // ── Fetch visible materials on mount ───────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/materials');
        setMaterials(res.data);
      } catch {
        // silent — empty list
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Derived values ─────────────────────────────────────────────────
  const subjects = ['All', ...new Set(materials.map(m => m.subject))];
  const filtered = materials.filter(m => {
    const matchSubject = filterSubject === 'All' || m.subject === filterSubject;
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  // ── Download handler ───────────────────────────────────────────────
  const handleDownload = async (material) => {
    setDownloading(material._id);
    try {
      // Backend increments count and returns the R2 public URL
      const { data } = await axios.get(`/materials/${material._id}/download`);
      // Fetch file from R2 CDN as a blob and trigger browser download
      const response = await fetch(data.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', data.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // ── Open handler (view in new tab via R2 CDN) ──────────────────────
  const handleOpen = async (material) => {
    try {
      const { data } = await axios.get(`/materials/${material._id}/view-token`);
      window.open(data.fileUrl, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Could not open file. Please try again.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Header ───────────────────────────────────────────────── */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Study Materials</h1>
        <p className="text-gray-500 text-sm mb-6">Download lecture notes, slides and resources</p>

        {/* ── Filters ──────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            placeholder="Search materials…"
            className="flex-1 min-w-[12rem] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none"
          >
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* ── Materials Grid ───────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-gray-500">No materials found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(material => (
              <div
                key={material._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col"
              >
                {/* ── Top ──────────────────────────────────────────── */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl flex-shrink-0">{fileIcon(material.fileType)}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{material.title}</p>
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full mt-1">
                      {material.subject}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">by {material.teacher?.name || 'Teacher'}</p>
                  </div>
                </div>

                {/* ── Description ──────────────────────────────────── */}
                {material.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{material.description}</p>
                )}

                <div className="flex-1" />

                {/* ── File Meta ────────────────────────────────────── */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-400">
                    {material.fileType.toUpperCase()} · {formatSize(material.fileSize)} · ↓ {material.downloadCount}
                  </span>
                  <div className="flex gap-2">
                    {/* Open in new tab via R2 CDN */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpen(material)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      Open
                    </Button>
                    <Button
                      size="sm"
                      disabled={downloading === material._id}
                      onClick={() => handleDownload(material)}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      {downloading === material._id ? 'Downloading…' : '⬇ Download'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMaterialsPage;
