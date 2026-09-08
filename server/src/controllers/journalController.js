import Journal from '../models/Journal.js';

export const getJournals = async (req, res) => {
  try {
    const { q, tag, startDate, endDate } = req.query;
    const query = { userId: req.user._id };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
      ];
    }
    if (tag) query.tags = tag;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const journals = await Journal.find(query).sort({ createdAt: -1 }).lean();
    res.status(200).json(journals);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const createJournal = async (req, res) => {
  try {
    const { title, content, moodScore, tags, isPrivate } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });
    const journal = await Journal.create({
      userId: req.user._id,
      title: title?.trim() || 'Untitled Entry',
      content: content.trim(),
      moodScore,
      tags: Array.isArray(tags) ? tags : [],
      isPrivate: isPrivate !== false,
    });
    res.status(201).json(journal);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const updateJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });
    if (journal.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    const allowed = ['title', 'content', 'moodScore', 'tags', 'isPrivate'];
    allowed.forEach(k => { if (req.body[k] !== undefined) journal[k] = req.body[k]; });
    const updated = await journal.save();
    res.status(200).json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });
    if (journal.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    await journal.deleteOne();
    res.status(200).json({ message: 'Journal deleted', id: req.params.id });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc   Export journals as JSON or CSV text
// @route  GET /api/journals/export?format=json|csv
// @access Private
export const exportJournals = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const journals = await Journal.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();

    if (format === 'csv') {
      const header = 'Date,Title,Mood,Tags,Content\n';
      const rows = journals.map(j => {
        const date = new Date(j.createdAt).toISOString().split('T')[0];
        const content = `"${(j.content || '').replace(/"/g, '""')}"`;
        const title = `"${(j.title || '').replace(/"/g, '""')}"`;
        const tags = `"${(j.tags || []).join(', ')}"`;
        return `${date},${title},${j.moodScore || ''},${tags},${content}`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="midnight-sanctuary-journal.csv"');
      return res.send(header + rows.join('\n'));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="midnight-sanctuary-journal.json"');
    res.send(JSON.stringify(journals, null, 2));
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};
