// ── Imports ──────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

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
const TeacherMaterialsPage = () => {
  // ── State ──────────────────────────────────────────────────────────
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Upload form
  const [form, setForm] = useState({ title: '', description: '', subject: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();

  // Inline edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({ title: '', description: '', subject: '' });

  // Inline replace
  const [replacingId, setReplacingId]   = useState(null);
  const [replaceFile, setReplaceFile]   = useState(null);
  const replaceInputRef = useRef();

  // ── Fetch materials on mount ───────────────────────────────────────
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await axios.get('/materials/my');
      setMaterials(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-clear banners ─────────────────────────────────────────────
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 4000); return () => clearTimeout(t); }
  }, [error]);

  // ── Upload handler ─────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!form.title.trim() || !form.subject.trim() || !selectedFile) {
      setError('Title, subject, and file are all required.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('subject', form.subject);
      fd.append('file', selectedFile);
      const res = await axios.post('/materials', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMaterials([res.data, ...materials]);
      setForm({ title: '', description: '', subject: '' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess('File uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Toggle visibility ──────────────────────────────────────────────
  const handleToggleVisibility = async (id) => {
    try {
      const res = await axios.patch(`/materials/${id}/visibility`);
      setMaterials(materials.map(m => m._id === id ? res.data : m));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle visibility');
    }
  };

  // ── Save metadata edit ─────────────────────────────────────────────
  const handleSaveEdit = async (id) => {
    try {
      const res = await axios.put(`/materials/${id}`, editForm);
      setMaterials(materials.map(m => m._id === id ? res.data : m));
      setEditingId(null);
      setSuccess('Material info updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  // ── Replace file ───────────────────────────────────────────────────
  const handleReplaceFile = async (id) => {
    if (!replaceFile) { setError('Select a file first.'); return; }
    try {
      const fd = new FormData();
      fd.append('file', replaceFile);
      const res = await axios.put(`/materials/${id}/file`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMaterials(materials.map(m => m._id === id ? res.data : m));
      setReplacingId(null);
      setReplaceFile(null);
      setSuccess('File replaced successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Replace failed');
    }
  };

  // ── Delete material ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material? This cannot be undone.')) return;
    try {
      await axios.delete(`/materials/${id}`);
      setMaterials(materials.filter(m => m._id !== id));
      setSuccess('Material deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Page Header ──────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Study Materials</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and manage files for your students</p>
        </div>

        {/* ── Banners ──────────────────────────────────────────────── */}
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm font-medium">{success}</div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>
        )}

        {/* ── Upload Form ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload New Material</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Lecture 1 — Introduction"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Mathematics"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Optional description for students"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={e => setSelectedFile(e.target.files[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-1">
                {fileIcon(selectedFile.name.split('.').pop() === 'pdf' ? 'pdf' : 'other')} {selectedFile.name} — {formatSize(selectedFile.size)}
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-5 rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading…' : 'Upload Material'}
          </Button>
        </div>

        {/* ── Materials List ───────────────────────────────────────── */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Uploaded Materials ({materials.length})
        </h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-gray-500">No materials uploaded yet. Upload your first file above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map(material => (
              <div key={material._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                {/* ── Card Top Row ──────────────────────────────────── */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{fileIcon(material.fileType)}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">{material.title}</span>
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{material.subject}</span>
                      </div>
                      {material.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{material.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center flex-shrink-0 ml-4">
                    <Badge className={`text-xs px-2 py-1 rounded-full ${material.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {material.isVisible ? '● Visible' : '○ Hidden'}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatSize(material.fileSize)} · {material.downloadCount} downloads</span>
                  </div>
                </div>

                {/* ── Action Buttons ────────────────────────────────── */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleToggleVisibility(material._id)}
                    className={material.isVisible
                      ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                      : 'text-green-600 border-green-300 hover:bg-green-50'}
                  >
                    {material.isVisible ? 'Hide from Students' : 'Show to Students'}
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => {
                      setEditingId(editingId === material._id ? null : material._id);
                      setEditForm({ title: material.title, description: material.description, subject: material.subject });
                      setReplacingId(null);
                    }}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    Edit Info
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => {
                      setReplacingId(replacingId === material._id ? null : material._id);
                      setReplaceFile(null);
                      setEditingId(null);
                    }}
                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    Replace File
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleDelete(material._id)}
                    className="text-red-500 border-red-300 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>

                {/* ── Inline Edit Form ─────────────────────────────── */}
                {editingId === material._id && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-3 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Title"
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      />
                      <input
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Subject"
                        value={editForm.subject}
                        onChange={e => setEditForm({ ...editForm, subject: e.target.value })}
                      />
                    </div>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                      placeholder="Description"
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(material._id)}>Save Changes</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* ── Inline Replace Form ──────────────────────────── */}
                {replacingId === material._id && (
                  <div className="bg-purple-50 rounded-lg p-4 mt-3 border border-purple-200">
                    <p className="text-sm text-gray-600 mb-2">Select a new file to replace the current one</p>
                    <input
                      type="file"
                      ref={replaceInputRef}
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={e => setReplaceFile(e.target.files[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 mb-3"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleReplaceFile(material._id)}>Upload Replacement</Button>
                      <Button size="sm" variant="outline" onClick={() => { setReplacingId(null); setReplaceFile(null); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMaterialsPage;
