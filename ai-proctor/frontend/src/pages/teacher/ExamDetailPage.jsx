import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // ── Add question panel ─────────────────────────────────
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addMode, setAddMode] = useState('manual'); // 'manual' | 'ai' | 'warehouse'
  
  // Manual form
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    marks: 1,
  });

  // AI generation form
  const [aiMaterialId, setAiMaterialId] = useState('');
  const [aiFile, setAiFile] = useState(null);
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState([]);
  const [aiSelected, setAiSelected] = useState({});
  const [aiEditing, setAiEditing] = useState(null); // index of question being edited
  const [materials, setMaterials] = useState([]);
  const [materialsLoaded, setMaterialsLoaded] = useState(false);

  // Warehouse import
  const [warehouseQuestions, setWarehouseQuestions] = useState([]);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseSelected, setWarehouseSelected] = useState({});
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, [id]);

  const fetchExamData = async () => {
    try {
      const [examRes, questionsRes] = await Promise.all([
        axios.get(`/exams/${id}`),
        axios.get(`/exams/${id}/questions`),
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exam data');
    } finally {
      setLoading(false);
    }
  };

  // ── Manual question add ─────────────────────────────────
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/exams/${id}/questions`, newQuestion);
      setQuestions([...questions, response.data]);
      setNewQuestion({ text: '', options: ['', '', '', ''], correctOption: 0, marks: 1 });
      setShowAddPanel(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question');
    }
  };

  // ── AI generation ───────────────────────────────────────
  const fetchMaterials = async () => {
    if (materialsLoaded) return;
    try {
      const res = await axios.get('/materials/my');
      setMaterials(res.data);
      setMaterialsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiMaterialId && !aiFile) {
      setError('Please select a material or upload a file');
      return;
    }
    setAiLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('count', aiCount);
      if (aiMaterialId) {
        formData.append('materialId', aiMaterialId);
      }
      if (aiFile) {
        formData.append('file', aiFile);
      }
      const res = await axios.post(`/exams/${id}/questions/generate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAiPreview(res.data);
      // Select all by default
      const selected = {};
      res.data.forEach((_, i) => { selected[i] = true; });
      setAiSelected(selected);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiAdd = async () => {
    const toAdd = aiPreview.filter((_, i) => aiSelected[i]);
    if (toAdd.length === 0) return;
    try {
      const res = await axios.post(`/exams/${id}/questions/bulk`, {
        questions: toAdd.map(q => ({
          ...q,
          source: 'ai_generated',
        })),
      });
      setQuestions([...questions, ...res.data]);
      setAiPreview([]);
      setAiSelected({});
      setAiFile(null);
      setAiMaterialId('');
      setShowAddPanel(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add AI questions');
    }
  };

  const toggleAiSelect = (idx) => {
    setAiSelected(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const updateAiQuestion = (idx, field, value) => {
    setAiPreview(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateAiOption = (qIdx, optIdx, value) => {
    setAiPreview(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[optIdx] = value;
      return { ...q, options: opts };
    }));
  };

  // ── Warehouse import ────────────────────────────────────
  const fetchWarehouse = async () => {
    setWarehouseLoading(true);
    try {
      const params = new URLSearchParams();
      if (warehouseSearch) params.append('search', warehouseSearch);
      const res = await axios.get(`/questions/warehouse?${params.toString()}`);
      // Filter out questions already in this exam
      const existingIds = new Set(questions.map(q => q._id));
      setWarehouseQuestions(res.data.filter(q => !existingIds.has(q._id)));
    } catch (err) {
      console.error('Failed to fetch warehouse:', err);
    } finally {
      setWarehouseLoading(false);
    }
  };

  const handleWarehouseImport = async () => {
    const selected = warehouseQuestions.filter(q => warehouseSelected[q._id]);
    if (selected.length === 0) return;
    try {
      const res = await axios.post(`/exams/${id}/questions/bulk`, {
        questions: selected.map(q => ({
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          marks: q.marks,
          source: 'warehouse',
        })),
      });
      setQuestions([...questions, ...res.data]);
      setWarehouseSelected({});
      setShowAddPanel(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import questions');
    }
  };

  const toggleWarehouseSelect = (qId) => {
    setWarehouseSelected(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`/exams/${id}/questions/${questionId}`);
      setQuestions(questions.filter((q) => q._id !== questionId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  // ── Tab configs ──────────────────────────────────────────
  const tabs = [
    { key: 'manual', label: '✏️ Manual', desc: 'Write a question by hand' },
    { key: 'ai', label: '🤖 AI Generate', desc: 'Use Gemini AI to create questions' },
    { key: 'warehouse', label: '📦 From Bank', desc: 'Import from your Question Bank' },
  ];

  const selectedWarehouseCount = Object.values(warehouseSelected).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{exam?.title}</h1>
            <p className="text-gray-600 mt-2 text-lg">{exam?.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-xl font-semibold shadow-md shadow-blue-500/30">
                {exam?.duration} min
              </Badge>
              <Badge className={`px-4 py-1.5 rounded-xl font-semibold ${
                exam?.isActive
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/30'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {exam?.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-xl font-semibold">
                {questions.length} Questions
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-10 px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">×</button>
          </div>
        )}

        {/* Add Questions Button */}
        <div className="mb-8">
          <Button
            onClick={() => setShowAddPanel(!showAddPanel)}
            className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-6 rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
          >
            {showAddPanel ? '✕ Close Panel' : '+ Add Questions'}
          </Button>
        </div>

        {/* ── Add Questions Panel ──────────────────────────────── */}
        {showAddPanel && (
          <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => {
                    setAddMode(t.key);
                    if (t.key === 'warehouse') fetchWarehouse();
                    if (t.key === 'ai') fetchMaterials();
                  }}
                  className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    addMode === t.key
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mb-6">
              {tabs.find(t => t.key === addMode)?.desc}
            </p>

            {/* ── Manual Tab ──────────────────────────────────── */}
            {addMode === 'manual' && (
              <form onSubmit={handleAddQuestion} className="space-y-6">
                <div>
                  <label className="block text-gray-900 mb-2 font-semibold">Question Text</label>
                  <textarea
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 resize-none"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-900 mb-3 font-semibold">Options</label>
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3 mb-3">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={newQuestion.correctOption === index}
                        onChange={() => setNewQuestion({ ...newQuestion, correctOption: index })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[index] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: newOptions });
                        }}
                        className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200"
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-gray-900 mb-2 font-semibold">Marks</label>
                  <input
                    type="number"
                    value={newQuestion.marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) })}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200"
                    min="1"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 py-6 rounded-xl font-bold text-lg shadow-lg shadow-green-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
                >
                  Add Question
                </Button>
              </form>
            )}

            {/* ── AI Generate Tab ─────────────────────────────── */}
            {addMode === 'ai' && (
              <div className="space-y-6">
                {/* Source selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Material dropdown */}
                  <div>
                    <label className="block text-gray-900 mb-2 font-semibold">Select Existing Material</label>
                    <select
                      value={aiMaterialId}
                      onFocus={fetchMaterials}
                      onChange={(e) => { setAiMaterialId(e.target.value); setAiFile(null); }}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-all duration-200 bg-white"
                    >
                      <option value="">— Choose a material —</option>
                      {materials.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.title} ({m.fileType?.toUpperCase()}) — {m.subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-gray-900 mb-2 font-semibold">Or Upload a File</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { setAiFile(f); setAiMaterialId(''); }
                        }}
                        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-all duration-200 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 file:font-semibold file:text-sm hover:file:bg-purple-200"
                      />
                    </div>
                    {aiFile && (
                      <p className="text-sm text-purple-600 mt-1 font-medium">📄 {aiFile.name}</p>
                    )}
                  </div>
                </div>

                {/* Question count */}
                <div>
                  <label className="block text-gray-900 mb-2 font-semibold">Number of Questions</label>
                  <input
                    type="number"
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                    className="w-40 px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-all duration-200"
                    min="1"
                    max="20"
                  />
                </div>

                <Button
                  onClick={handleAiGenerate}
                  disabled={aiLoading || (!aiMaterialId && !aiFile)}
                  className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-8 py-5 rounded-xl font-semibold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all duration-200 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⚙️</span> Reading & Generating...
                    </span>
                  ) : (
                    '🤖 Generate from Material'
                  )}
                </Button>

                {/* AI Preview with checkboxes + editing */}
                {aiPreview.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-gray-900">
                        Generated {aiPreview.length} questions — select which to add
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const allSelected = aiPreview.every((_, i) => aiSelected[i]);
                            const next = {};
                            aiPreview.forEach((_, i) => { next[i] = !allSelected; });
                            setAiSelected(next);
                          }}
                          className="text-sm font-semibold text-purple-600 hover:text-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          {aiPreview.every((_, i) => aiSelected[i]) ? 'Deselect All' : 'Select All'}
                        </button>
                        <Button
                          onClick={() => { setAiPreview([]); setAiSelected({}); }}
                          variant="outline"
                          className="px-4 py-2 rounded-lg text-sm"
                        >
                          Discard
                        </Button>
                        <Button
                          onClick={handleAiAdd}
                          disabled={!Object.values(aiSelected).some(Boolean)}
                          className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-md hover:scale-105 transition-all disabled:opacity-50"
                        >
                          ✓ Add Selected ({Object.values(aiSelected).filter(Boolean).length})
                        </Button>
                      </div>
                    </div>

                    {aiPreview.map((q, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          aiSelected[i]
                            ? 'border-purple-300 bg-purple-50/50'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleAiSelect(i)}
                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              aiSelected[i] ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                            }`}
                          >
                            {aiSelected[i] && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <div className="flex-1">
                            {aiEditing === i ? (
                              /* Edit mode */
                              <div className="space-y-3">
                                <textarea
                                  value={q.text}
                                  onChange={(e) => updateAiQuestion(i, 'text', e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                                  rows={2}
                                />
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`ai-correct-${i}`}
                                      checked={q.correctOption === oi}
                                      onChange={() => updateAiQuestion(i, 'correctOption', oi)}
                                      className="w-4 h-4 text-purple-600"
                                    />
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => updateAiOption(i, oi, e.target.value)}
                                      className="flex-1 px-3 py-1.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                ))}
                                <button
                                  onClick={() => setAiEditing(null)}
                                  className="text-sm font-semibold text-green-600 hover:text-green-800 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
                                >
                                  ✓ Done Editing
                                </button>
                              </div>
                            ) : (
                              /* View mode */
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-semibold text-gray-900 text-sm">
                                    <span className="text-purple-600 mr-2">Q{i + 1}.</span>
                                    {q.text}
                                  </p>
                                  <button
                                    onClick={() => setAiEditing(i)}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors ml-2 flex-shrink-0"
                                  >
                                    ✏️ Edit
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {q.options?.map((opt, oi) => (
                                    <div
                                      key={oi}
                                      className={`p-2 rounded-lg text-sm ${
                                        oi === q.correctOption
                                          ? 'bg-green-100 border border-green-300 text-green-800 font-medium'
                                          : 'bg-white border border-gray-200 text-gray-700'
                                      }`}
                                    >
                                      {oi === q.correctOption && <span className="mr-1">✓</span>}
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Warehouse Import Tab ────────────────────────── */}
            {addMode === 'warehouse' && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={warehouseSearch}
                    onChange={(e) => setWarehouseSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchWarehouse()}
                    className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200"
                    placeholder="Search your question bank..."
                  />
                  <Button
                    onClick={fetchWarehouse}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
                  >
                    Search
                  </Button>
                </div>

                {warehouseLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading questions...</div>
                ) : warehouseQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No available questions found. Create some first!
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {selectedWarehouseCount} of {warehouseQuestions.length} selected
                      </span>
                      <Button
                        onClick={handleWarehouseImport}
                        disabled={selectedWarehouseCount === 0}
                        className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-md hover:scale-105 transition-all disabled:opacity-50"
                      >
                        Import Selected ({selectedWarehouseCount})
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {warehouseQuestions.map((q) => (
                        <div
                          key={q._id}
                          onClick={() => toggleWarehouseSelect(q._id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            warehouseSelected[q._id]
                              ? 'border-blue-500 bg-blue-50/50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              warehouseSelected[q._id]
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}>
                              {warehouseSelected[q._id] && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{q.text}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs text-gray-500">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                                {q.exam && <span className="text-xs text-gray-400">from: {q.exam?.title}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>
        )}

        {/* ── Questions List ───────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions ({questions.length})</h2>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question._id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Q{index + 1}: {question.text}
                  </h3>
                  <Button
                    onClick={() => handleDeleteQuestion(question._id)}
                    className="text-red-600 hover:text-white bg-red-300 hover:bg-red-600 px-4 py-2 rounded-xl font-semibold hover:scale-105 transition-all duration-200"
                  >
                    Delete
                  </Button>
                </div>
                <div className="space-y-3">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        optIndex === question.correctOption
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 shadow-md'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {optIndex === question.correctOption && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/30">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-600">Marks: {question.marks}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {questions.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No questions yet. Add your first question!
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamDetailPage;
