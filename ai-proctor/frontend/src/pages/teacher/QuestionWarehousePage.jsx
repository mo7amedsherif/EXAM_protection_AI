import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';

const QuestionWarehousePage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, [search, sourceFilter]);

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (sourceFilter) params.append('source', sourceFilter);
      const res = await axios.get(`/questions/warehouse?${params.toString()}`);
      setQuestions(res.data);
    } catch (err) {
      console.error('Failed to fetch warehouse:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await axios.delete(`/questions/${id}`);
      setQuestions(questions.filter(q => q._id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    setEditForm({
      text: q.text,
      options: [...q.options],
      correctOption: q.correctOption,
      marks: q.marks,
      tags: q.tags?.join(', ') || '',
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const updated = {
        text: editForm.text,
        options: editForm.options,
        correctOption: editForm.correctOption,
        marks: editForm.marks,
      };
      await axios.put(`/questions/${id}`, updated);
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const sourceColors = {
    manual: 'bg-blue-100 text-blue-700',
    ai_generated: 'bg-purple-100 text-purple-700',
    warehouse: 'bg-green-100 text-green-700',
  };

  const sourceLabels = {
    manual: 'Manual',
    ai_generated: 'AI Generated',
    warehouse: 'Warehouse',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
              <p className="text-gray-600 mt-2 text-lg">
                All questions you&apos;ve created or generated — reuse them in any exam
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-xl font-semibold shadow-md">
                {questions.length} Questions
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-8">
        {/* Search & Filters */}
        <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px]">
              <Input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl py-5 px-5 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div className="flex gap-2">
              {['', 'manual', 'ai_generated', 'warehouse'].map((src) => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    sourceFilter === src
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {src === '' ? 'All' : sourceLabels[src] || src}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No questions yet</h3>
            <p className="text-gray-500">Questions you create or generate will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <Card key={q._id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
                {editingId === q._id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <textarea
                      value={editForm.text}
                      onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      rows={2}
                    />
                    {editForm.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q._id}`}
                          checked={editForm.correctOption === oi}
                          onChange={() => setEditForm({ ...editForm, correctOption: oi })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const opts = [...editForm.options];
                            opts[oi] = e.target.value;
                            setEditForm({ ...editForm, options: opts });
                          }}
                          className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleSaveEdit(q._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        variant="outline"
                        className="px-4 py-2 rounded-lg text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>
                          <Badge className={`${sourceColors[q.source] || 'bg-gray-100 text-gray-600'} px-3 py-0.5 rounded-lg text-xs font-semibold`}>
                            {sourceLabels[q.source] || q.source || 'Manual'}
                          </Badge>
                          {q.exam && (
                            <Badge className="bg-gray-100 text-gray-600 px-3 py-0.5 rounded-lg text-xs font-semibold">
                              {q.exam?.title || 'Exam'}
                            </Badge>
                          )}
                          <Badge className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-lg text-xs font-semibold">
                            {q.marks} mark{q.marks !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">{q.text}</h3>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(q)}
                          className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(q._id)}
                          className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options?.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`p-3 rounded-lg border text-sm ${
                            oi === q.correctOption
                              ? 'border-green-300 bg-green-50 text-green-800 font-medium'
                              : 'border-gray-200 bg-gray-50 text-gray-700'
                          }`}
                        >
                          {oi === q.correctOption && <span className="mr-1">✓</span>}
                          {opt}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionWarehousePage;
