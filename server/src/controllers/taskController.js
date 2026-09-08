import Task from '../models/Task.js';
import Journal from '../models/Journal.js';
import { GoogleGenAI } from '@google/genai';

let _genai = null;
function getGenAI() {
  if (!_genai && process.env.GEMINI_API_KEY) {
    _genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _genai;
}

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.status(200).json(tasks);
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

export const createTask = async (req, res) => {
  try {
    const { title, priority, description, dueDate, aiSuggested } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    const task = await Task.create({
      userId: req.user._id,
      title: title.trim(),
      priority: priority || 'Medium',
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      aiSuggested: aiSuggested || false,
    });
    res.status(201).json(task);
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    const allowed = ['title', 'priority', 'description', 'isCompleted', 'dueDate', 'deadline'];
    allowed.forEach(k => { if (req.body[k] !== undefined) task[k] = req.body[k]; });
    const updated = await task.save();
    res.status(200).json(updated);
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    await task.deleteOne();
    res.status(200).json({ message: 'Task deleted', id: req.params.id });
  } catch (e) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

// @desc   AI suggests tasks based on recent journal entries
// @route  POST /api/tasks/ai-suggest
// @access Private (Pro/Premium)
export const aiSuggestTasks = async (req, res) => {
  try {
    const isPro = req.user.planType === 'Pro' || req.user.planType === 'Premium';
    if (!isPro) return res.status(403).json({ message: 'Pro plan required for AI task suggestions' });

    const genai = getGenAI();
    if (!genai) return res.status(503).json({ message: 'AI service not configured' });

    // Fetch last 5 journal entries
    const journals = await Journal.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (journals.length === 0) {
      return res.status(200).json({ suggestions: [
        { title: 'Write your first journal entry', priority: 'High', aiSuggested: true },
        { title: 'Set a 5-minute daily meditation goal', priority: 'Medium', aiSuggested: true },
        { title: 'Define one intention for the week', priority: 'Medium', aiSuggested: true },
      ]});
    }

    const journalText = journals.map((j, i) => `Entry ${i + 1} (mood ${j.moodScore || '?'}/10): ${j.content.slice(0, 200)}`).join('\n\n');

    const prompt = `Based on these recent journal entries from a user of Midnight Sanctuary (a mental wellness app):

${journalText}

Suggest exactly 5 concrete, actionable tasks that would help this person. Each task should:
- Be specific and achievable today or this week
- Relate to their mental wellbeing, focus, or self-care
- Align with themes in their journal entries

Respond ONLY with valid JSON array, no markdown, no extra text:
[
  {"title": "...", "priority": "High|Medium|Low", "description": "..."},
  ...
]`;

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { maxOutputTokens: 400, temperature: 0.7 },
      contents: prompt,
    });

    let suggestions;
    try {
      const clean = response.text.replace(/```json|```/g, '').trim();
      suggestions = JSON.parse(clean);
      if (!Array.isArray(suggestions)) throw new Error('Not an array');
    } catch {
      suggestions = [
        { title: 'Journal about your current state of mind', priority: 'High', description: '' },
        { title: 'Take a 10-minute nature walk', priority: 'Medium', description: '' },
        { title: 'Practice 5 minutes of deep breathing', priority: 'Medium', description: '' },
      ];
    }

    res.status(200).json({
      suggestions: suggestions.slice(0, 5).map(s => ({ ...s, aiSuggested: true }))
    });
  } catch (e) {
    console.error('AI task suggestion error:', e);
    res.status(500).json({ message: 'AI service error', error: e.message });
  }
};
