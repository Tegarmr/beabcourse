const Material = require('../models/material');

const getMateri = async (req, res) => {
    try {
        // Ambil filter dari query param
        const filter = req.query.filter; // 'completed', 'in_progress', 'not_started', 'locked'

        const materi = await Material.get(req.user.userId, filter);

        return res.status(200).json({ message: 'Success', data: { materi } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error', error });
    }
};

const getOneMateri = async (req, res) => {
    try {
        const materi = await Material.getOne(req.params.id);

        if (!materi) {
            return res.status(404).json({ message: 'Materi not found' });
        }

        return res.status(200).json({ message: 'Success', data: { materi } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error', error });
    }
};

const logMaterialAccess = async (req, res) => {
    const { user_id, materi_id } = req.body;

    if (!user_id || !materi_id) {
        return res.status(400).json({ message: 'user_id and materi_id are required' });
    }

    try {
        await Material.logAccess(user_id, materi_id);
        return res.status(200).json({ message: 'Material access logged successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to log material access', error });
    }
};

const getLatestInProgress = async (req, res) => {
  try {
    const userId = req.user.userId;  // asumsi userId didapat dari middleware auth

    const materi = await Material.getLatestInProgress(userId);

    if (!materi) {
      return res.status(404).json({ message: 'No in-progress or accessed material found' });
    }

    res.json(materi);
  } catch (error) {
    console.error('Error getLatestInProgress:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

module.exports = { getMateri, getOneMateri, logMaterialAccess, getLatestInProgress };
