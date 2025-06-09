const supabase = require('../config/supabase');

const Material = {
 get: async (userId, filter = null) => {
    // Ambil data materi beserta quiz user
    const { data: materiData, error: materiError } = await supabase
        .from('materi')
        .select(`
            materi_id,
            nama_materi,
            judul,
            level,
            description,
            quiz (
                user_id,
                nilai_quiz,
                created_at
            )
        `)
        .order('level', { ascending: true });

    if (materiError) throw materiError;

    // Ambil data done_materi untuk user ini
    const { data: doneMateriData, error: doneError } = await supabase
        .from('done_materi')
        .select('materi_id, last_accessed_at')
        .eq('user_id', userId);

    if (doneError) throw doneError;

    // Buat map cepat materi_id ke done_materi entry
    const doneMap = new Map();
    doneMateriData.forEach(dm => {
        doneMap.set(dm.materi_id, dm);
    });

    let prevMaterialCompleted = false;

    const result = materiData.map((materi, index) => {
        const userQuizzes = materi.quiz
            ? materi.quiz
                .filter(q => q.user_id === userId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            : [];

        // Cek done_materi entry
        const doneEntry = doneMap.get(materi.materi_id);

        let status = 'not_started';
        let isLocked = false;
        let bestScore = 0;

        if (doneEntry && doneEntry.last_accessed_at) {
            // Ada akses materi (last_accessed_at ada)
            if (userQuizzes.length > 0) {
                bestScore = Math.max(...userQuizzes.map(q => q.nilai_quiz));
                status = bestScore >= 80 ? 'completed' : 'in_progress';
            } else {
                // Ada akses materi tapi quiz belum pernah dikerjakan = in_progress (incomplete)
                status = 'in_progress';
            }
        } else {
            // Tidak ada akses materi (last_accessed_at kosong atau tidak ada)
            if (userQuizzes.length > 0) {
                bestScore = Math.max(...userQuizzes.map(q => q.nilai_quiz));
                status = bestScore >= 80 ? 'completed' : 'in_progress'; // mungkin jarang terjadi tapi tetap logis
            } else {
                status = 'not_started';
            }
        }

        // Locked logic: jika materi sebelumnya belum completed, materi ini terkunci kecuali materi pertama
        if (index === 0) {
            isLocked = false;
        } else {
            isLocked = !prevMaterialCompleted;
        }

        prevMaterialCompleted = status === 'completed';

        return {
            ...materi,
            quiz: userQuizzes,
            status,
            isLocked,
            bestScore,
            last_accessed_at: doneEntry?.last_accessed_at || null
        };
    });

    if (filter) {
        switch (filter) {
            case 'completed':
                return result.filter(materi => materi.status === 'completed');
            case 'in_progress':
                return result.filter(materi => materi.status === 'in_progress');
            case 'not_started':
                return result.filter(materi => materi.status === 'not_started');
            case 'locked':
                return result.filter(materi => materi.isLocked);
            default:
                return result;
        }
    }

    return result;
},


    getOne: async (id) => {
        const { data, error } = await supabase
            .from('materi')
            .select(`
                materi_id,
                nama_materi,
                judul,
                content,
                description
            `)
            .eq('materi_id', id)
            .single();

        if (error) throw error;

        return data;
    },

    logAccess: async (user_id, materi_id) => {
        // Cek sudah ada entry di done_materi
        const { data: existing, error: checkErr } = await supabase
            .from('done_materi')
            .select('*')
            .eq('user_id', user_id)
            .eq('materi_id', materi_id)
            .single();

        if (checkErr && checkErr.code !== 'PGRST116') {
            throw checkErr;
        }

        if (!existing) {
            // Insert baru
            const { error: insertErr } = await supabase
                .from('done_materi')
                .insert([{ user_id, materi_id }]);
            if (insertErr) throw insertErr;
        } else {
            // Update last_accessed_at
            const { error: updateErr } = await supabase
                .from('done_materi')
                .update({ last_accessed_at: new Date().toISOString() })
                .eq('user_id', user_id)
                .eq('materi_id', materi_id);

            if (updateErr) throw updateErr;
        }

        return true;
    },
getLatestInProgress: async (userId) => {
  const { data: materiData, error: materiError } = await supabase
    .from("materi")
    .select(`
      materi_id,
      nama_materi,
      judul,
      description,
      level,
      quiz (
        user_id,
        nilai_quiz,
        created_at
      )
    `)
    .order("level", { ascending: true });

  if (materiError) throw materiError;

  const { data: doneData, error: doneError } = await supabase
    .from("done_materi")
    .select("materi_id, last_accessed_at")
    .eq("user_id", userId);

  if (doneError) throw doneError;

  const doneMap = new Map();
  doneData.forEach((d) => {
    doneMap.set(d.materi_id, d);
  });

  let prevMaterialCompleted = false;
  let firstEligible = null;
  let firstUnlockedNotStarted = null;

  for (let i = 0; i < materiData.length; i++) {
    const materi = materiData[i];
    const quizzes = (materi.quiz || []).filter((q) => q.user_id === userId);
    const doneEntry = doneMap.get(materi.materi_id);

    const last_accessed_at = doneEntry?.last_accessed_at || null;
    const bestScore =
      quizzes.length > 0 ? Math.max(...quizzes.map((q) => q.nilai_quiz)) : 0;

    let status = "not_started";
    if (last_accessed_at) {
      status =
        quizzes.length === 0
          ? "in_progress"
          : bestScore >= 80
          ? "completed"
          : "in_progress";
    } else {
      status =
        quizzes.length === 0
          ? "not_started"
          : bestScore >= 80
          ? "completed"
          : "in_progress";
    }

    const isLocked = i === 0 ? false : !prevMaterialCompleted;

    // ⬇️ Jika unlocked dan in_progress → prioritas utama
    if (!isLocked && status === "in_progress") {
      return {
        materi_id: materi.materi_id,
        nama_materi: materi.nama_materi,
        judul: materi.judul,
        description: materi.description,
        level: materi.level,
        last_accessed_at,
      };
    }

    // ⬇️ Jika unlocked dan pernah diakses → fallback pertama
    if (!isLocked && !firstEligible && last_accessed_at) {
      firstEligible = {
        materi_id: materi.materi_id,
        nama_materi: materi.nama_materi,
        judul: materi.judul,
        description: materi.description,
        level: materi.level,
        last_accessed_at,
      };
    }

    // ⬇️ Jika unlocked dan belum pernah dibuka → fallback terakhir
    if (!isLocked && !firstUnlockedNotStarted && !last_accessed_at) {
      firstUnlockedNotStarted = {
        materi_id: materi.materi_id,
        nama_materi: materi.nama_materi,
        judul: materi.judul,
        description: materi.description,
        level: materi.level,
        last_accessed_at: null,
      };
    }

    prevMaterialCompleted = bestScore >= 80;
  }

  // ⬇️ Jika tidak ada yang sedang in_progress, pakai fallback yang sudah pernah dibuka
  if (firstEligible) return firstEligible;

  // ⬇️ Jika tidak ada yang pernah dibuka, ambil materi pertama yang tidak terkunci meski belum ada progress
  if (firstUnlockedNotStarted) return firstUnlockedNotStarted;

  // ⬇️ Kalau tetap tidak ada yang bisa diambil
  return null;
}
};




module.exports = Material;
