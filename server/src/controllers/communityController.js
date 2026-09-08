import Community from '../models/Community.js';

export const getCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .populate('members', 'name avatarUrl')
      .sort({ createdAt: -1 });
    // Add real member count
    const result = communities.map(c => ({
      ...c.toObject(),
      memberCount: c.members.length,
    }));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Community name is required' });
    const exists = await Community.findOne({ name });
    if (exists) return res.status(400).json({ message: 'A community with that name already exists' });
    const community = await Community.create({
      name, description, creatorId: req.user._id, members: [req.user._id],
    });
    res.status(201).json({ ...community.toObject(), memberCount: 1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    const alreadyMember = community.members.some(m => m.toString() === req.user._id.toString());
    if (!alreadyMember) {
      community.members.push(req.user._id);
      await community.save();
    }
    res.status(200).json({ ...community.toObject(), memberCount: community.members.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    community.members.pull(req.user._id);
    await community.save();
    res.status(200).json({ message: 'Left community', memberCount: community.members.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
